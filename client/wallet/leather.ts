import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";
import { getBTCBalanceInfo } from "$lib/utils/balanceUtils.ts";
import type { BaseToast } from "$lib/utils/toastSignal.ts";

interface LeatherAddress {
  symbol: "BTC" | "STX";
  type?: "p2wpkh" | "p2tr";
  address: string;
  publicKey: string;
  derivationPath?: string;
  tweakedPublicKey?: string;
}

type AddToastFunction = (message: string, type: BaseToast["type"]) => void;

export const isLeatherInstalled = signal<boolean>(false);

export const checkLeather = () => {
  const isAvailable = checkWalletAvailability("leather");
  isLeatherInstalled.value = isAvailable;
  return isAvailable;
};

export const connectLeather = async (addToast: AddToastFunction) => {
  try {
    const isInstalled = checkLeather();
    if (!isInstalled) {
      logger.warn("ui", {
        message: "Leather wallet not detected",
      });
      addToast(
        "Leather wallet not detected. Please install the Leather extension.",
        "error",
      );
      return;
    }

    logger.debug("ui", {
      message: "Connecting to Leather wallet",
    });

    const leatherProvider = getProvider();
    const response = await leatherProvider.request("getAddresses");

    let addresses;
    if (
      response?.result?.addresses && Array.isArray(response.result.addresses)
    ) {
      addresses = response.result.addresses;
    } else {
      throw new Error("Invalid response format from getAddresses");
    }

    if (!addresses || addresses.length === 0) {
      throw new Error("No addresses received from Leather wallet");
    }

    await handleConnect(addresses);
    logger.info("ui", {
      message: "Successfully connected to Leather wallet",
    });
    addToast("Successfully connected to Leather wallet", "success");
  } catch (error) {
    logger.error("ui", {
      message: "Error connecting to Leather wallet",
      error: error instanceof Error ? error.message : String(error),
      details: error,
    });
    addToast(
      `Failed to connect to Leather wallet: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
    );
  }
};

export const handleConnect = async (addresses: LeatherAddress[]) => {
  if (!addresses || addresses.length === 0) {
    throw new Error("No addresses received from Leather wallet");
  }

  // Prioritize p2wpkh (Native SegWit) address, but also allow p2tr (Taproot) as fallback
  const btcAddress = addresses.find((addr) =>
    addr.symbol === "BTC" && (addr.type === "p2wpkh" || addr.type === "p2tr")
  );

  if (!btcAddress) {
    throw new Error(
      "No compatible BTC address found in the received addresses",
    );
  }

  console.log(`Using BTC address type: ${btcAddress.type}`);

  const _wallet = {} as Wallet;
  _wallet.address = btcAddress.address;
  _wallet.accounts = [btcAddress.address];
  _wallet.publicKey = btcAddress.publicKey;
  _wallet.addressType = btcAddress.type || "p2wpkh";

  const addressInfo = await getBTCBalanceInfo(btcAddress.address);

  _wallet.btcBalance = {
    confirmed: addressInfo?.balance ?? 0,
    unconfirmed: addressInfo?.unconfirmedBalance ?? 0,
    total: (addressInfo?.balance ?? 0) + (addressInfo?.unconfirmedBalance ?? 0),
  };

  _wallet.network = "mainnet";
  _wallet.provider = "leather";

  walletContext.updateWallet(_wallet);
};

const signMessage = async (message: string) => {
  const leatherProvider = getProvider();
  if (typeof leatherProvider === "undefined") {
    throw new Error("Leather wallet not connected");
  }

  console.log("Leather wallet signing message:", message);
  try {
    const { signature } = await leatherProvider.request(
      "signMessage",
      {
        message,
        paymentType: "p2wpkh",
      },
    );
    console.log("Leather wallet signature result:", signature);
    return signature;
  } catch (error) {
    console.error("Error signing message with Leather wallet:", error);
    throw error;
  }
};

interface LeatherSignPSBTResponse {
  error?: string;
  result?: {
    hex?: string; // Signed PSBT in hex format
    txid?: string; // Transaction ID if broadcast
    cancelled?: boolean;
  };
}

export const signPSBT = async (
  psbtHex: string,
  inputsToSign: { index: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  logger.debug("ui", {
    message: "Entering Leather signPSBT function",
    data: {
      psbtHexLength: psbtHex.length,
      inputsCount: inputsToSign.length,
      enableRBF,
      autoBroadcast,
    },
  });

  const leatherProvider = getProvider();
  if (typeof leatherProvider === "undefined") {
    logger.error("ui", {
      message: "Leather wallet not connected",
    });
    return { signed: false, error: "Leather wallet not connected" };
  }

  try {
    const requestParams = {
      hex: psbtHex,
      network: "mainnet",
      broadcast: autoBroadcast,
      inputsToSign: inputsToSign || undefined,
      rbf: enableRBF,
      sighashTypes: sighashTypes || undefined,
    };

    logger.debug("ui", {
      message: "Calling Leather provider signPsbt method",
      data: requestParams,
    });

    const result = await leatherProvider.request(
      "signPsbt",
      requestParams,
    ) as LeatherSignPSBTResponse;

    logger.debug("ui", {
      message: "Leather signPsbt result received",
      data: result,
    });

    if (!result) {
      return { signed: false, error: "No result from Leather wallet" };
    }

    // Check for user cancellation
    if (result.result?.cancelled) {
      return { signed: false, cancelled: true };
    }

    // Check for error
    if (result.error) {
      return { signed: false, error: result.error };
    }

    if (result.result) {
      // Prioritize txid if available, as it implies successful broadcast
      if (result.result.txid) {
        logger.info("ui", {
          message: "PSBT signed and broadcast successfully by Leather",
          data: { txid: result.result.txid, hexProvided: !!result.result.hex },
        });
        // Construct the base response
        const responsePayload: SignPSBTResult = {
          signed: true,
          txid: result.result.txid,
        };
        // Conditionally add the psbt property only if result.result.hex is a string
        if (
          typeof result.result.hex === "string" && result.result.hex.length > 0
        ) {
          responsePayload.psbt = result.result.hex;
        }
        return responsePayload;
      }
      // If only hex is available (e.g., broadcast was false or txid not part of this specific response)
      if (result.result.hex) {
        logger.info("ui", {
          message: "PSBT signed successfully by Leather (hex only)",
          data: { hasHex: true, hasTxid: false },
        });
        return { signed: true, psbt: result.result.hex };
      }
    }

    logger.error("ui", {
      message: "Unexpected result format from Leather wallet",
      data: result,
    });
    return {
      signed: false,
      error: "Unexpected result format from Leather wallet",
    };
  } catch (error: unknown) {
    logger.error("ui", {
      message: "Error in Leather signPSBT",
      error: error instanceof Error ? error.message : String(error),
      details: error,
    });
    return handleWalletError(error, "Leather");
  }
};

export const leatherProvider = {
  checkLeather,
  connectLeather,
  signMessage,
  signPSBT,
};

const getProvider = () => {
  const wallets = getGlobalWallets();
  return wallets.LeatherProvider;
};
