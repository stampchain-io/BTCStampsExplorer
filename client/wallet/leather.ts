import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";
import { getAddressInfo } from "$lib/utils/balanceUtils.ts";

interface LeatherAddress {
  symbol: "BTC" | "STX";
  type?: "p2wpkh" | "p2tr";
  address: string;
  publicKey: string;
  derivationPath?: string;
  tweakedPublicKey?: string;
}

type AddToastFunction = (message: string, type: string) => void;

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
  _wallet.addressType = btcAddress.type; // Store the address type for future reference

  const addressInfo = await getAddressInfo(btcAddress.address);

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

export const signPSBT = async (
  psbtHex: string,
  inputsToSign: { index: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  logger.debug("ui", {
    message: "Entering Leather signPSBT function",
    psbtHexLength: psbtHex.length,
    inputsCount: inputsToSign.length,
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
      requestParams,
    });

    const result = await leatherProvider.request("signPsbt", requestParams);

    logger.debug("ui", {
      message: "Leather signPsbt result received",
      result: JSON.stringify(result, null, 2),
    });

    if (result?.result) {
      if (result.result.hex) {
        return { signed: true, psbt: result.result.hex };
      } else if (result.result.txid) {
        return { signed: true, txid: result.result.txid };
      }
    }

    return {
      signed: false,
      error: "Unexpected result format from Leather wallet",
    };
  } catch (error: unknown) {
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
