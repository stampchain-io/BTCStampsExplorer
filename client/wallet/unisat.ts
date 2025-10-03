import {
  checkWalletAvailability,
  getGlobalWallets,
  walletContext,
} from "$client/wallet/wallet.ts";
import {
  handleWalletError,
  parseConnectionError,
} from "$client/wallet/walletHelper.ts";
import { logger } from "$lib/utils/logger.ts";
import type { BaseToast } from "$lib/utils/ui/notifications/toastSignal.ts";
import type { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { signal } from "@preact/signals";

export const isUnisatInstalled = signal<boolean>(false);

export const checkUnisat = () => {
  const isAvailable = checkWalletAvailability("unisat");
  isUnisatInstalled.value = isAvailable;
  return isAvailable;
};

const getProvider = () => {
  const wallets = getGlobalWallets();
  return wallets.unisat;
};

export const connectUnisat = async (
  addToast: (message: string, type: BaseToast["type"]) => void,
) => {
  try {
    const unisat = getProvider();
    if (!unisat) {
      logger.error("ui", {
        message: "Unisat wallet not detected",
        context: "connectUnisat",
      });
      addToast(
        "Unisat wallet not detected.\nPlease install the Unisat extension.",
        "error",
      );
      return;
    }
    const result = await unisat.requestAccounts();
    handleAccountsChanged(result);
    logger.info("ui", {
      message: "Successfully connected to Unisat wallet",
      context: "connectUnisat",
    });
    addToast("Connected using Unisat wallet.", "success");
  } catch (error: unknown) {
    const errorMessage = parseConnectionError(error);
    logger.error("ui", {
      message: "Failed to connect to Unisat wallet",
      context: "connectUnisat",
      error: errorMessage,
    });
    addToast(
      `Failed to connect to Unisat wallet:\n${errorMessage}`,
      "error",
    );
  }
};

const handleAccountsChanged = async (accounts: string[]) => {
  console.log("handleAccountsChanged", accounts);
  if (walletContext.wallet.address === accounts[0]) {
    return;
  }
  if (accounts.length === 0) {
    walletContext.disconnect();
    return;
  }
  const wallet = {} as Wallet;
  const unisat = getProvider();
  wallet.accounts = accounts;
  const address = accounts[0];
  wallet.address = address;
  const publicKey = await unisat.getPublicKey();
  wallet.publicKey = publicKey;
  const balance = await unisat.getBalance();
  wallet.btcBalance = {
    confirmed: balance.confirmed,
    unconfirmed: balance.unconfirmed,
    total: balance.confirmed + balance.unconfirmed,
  };
  wallet.network = "mainnet";
  wallet.provider = "unisat";
  walletContext.updateWallet(wallet);
};

const unisat = getProvider();
unisat?.on("accountsChanged", handleAccountsChanged);

export const signPSBT = async (
  psbtHex: string,
  inputsToSign: { index: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  try {
    const unisat = getProvider();
    if (!unisat) {
      return { signed: false, error: "Unisat wallet not connected" };
    }

    logger.debug("ui", {
      message: "Signing PSBT with Unisat",
      data: {
        psbtHexLength: psbtHex.length,
        inputsToSign,
        enableRBF,
        autoBroadcast,
      },
    });

    const unisatOptions: any = {
      autoFinalized: true,
      enableRBF, // Note: Check if Unisat supports RBF in their options
    };

    if (inputsToSign?.length > 0) {
      unisatOptions.toSignInputs = inputsToSign.map((input) => ({
        index: input.index,
        address: walletContext.wallet.address,
        sighashTypes: sighashTypes,
      }));
    }

    const signedPsbtHex = await unisat.signPsbt(psbtHex, unisatOptions);

    logger.debug("ui", {
      message: "Unisat signPsbt result",
      data: { signedPsbtHex },
    });

    if (!signedPsbtHex) {
      return { signed: false, error: "No result from Unisat wallet" };
    }

    if (autoBroadcast) {
      try {
        const txid = await unisat.pushPsbt(signedPsbtHex);
        logger.info("ui", {
          message: "Successfully broadcast transaction",
          data: { txid },
        });
        return { signed: true, txid };
      } catch (_broadcastError) {
        return {
          signed: true,
          psbt: signedPsbtHex,
          error: "Transaction signed but broadcast failed",
        };
      }
    }

    return { signed: true, psbt: signedPsbtHex };
  } catch (error: unknown) {
    return handleWalletError(error, "Unisat");
  }
};

export const signMessage = async (message: string): Promise<string> => {
  const unisat = getProvider();
  if (!unisat) {
    throw new Error("Unisat wallet not connected");
  }
  return await unisat.signMessage(message);
};

// Export the provider
export const unisatProvider = {
  connectUnisat,
  signPSBT,
  signMessage,
};
