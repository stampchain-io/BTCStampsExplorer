import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";
import { logger } from "$lib/utils/logger.ts";

export const isTapWalletInstalled = signal<boolean>(false);

export const connectTapWallet = async (
  addToast: (message: string, type: "error" | "success") => void,
) => {
  try {
    const tapwallet = (globalThis as any).tapwallet;
    if (!tapwallet) {
      addToast(
        "TapWallet not detected. Please install the TapWallet extension.",
        "error",
      );
      return;
    }
    const accounts = await tapwallet.requestAccounts();
    await handleAccountsChanged(accounts);
    addToast("Successfully connected to TapWallet", "success");
  } catch (error) {
    if (error instanceof Error) {
      addToast(`Failed to connect to TapWallet: ${error.message}`, "error");
    } else {
      addToast("Failed to connect to TapWallet", "error");
    }
  }
};

export const checkTapWallet = () => {
  const isAvailable = checkWalletAvailability("tapwallet");
  isTapWalletInstalled.value = isAvailable;
  return isAvailable;
};

const handleAccountsChanged = async (accounts: string[]) => {
  if (accounts.length === 0) {
    walletContext.disconnect();
    return;
  }

  const tapwallet = (globalThis as any).tapwallet;
  const _wallet = {} as Wallet;
  _wallet.address = accounts[0];
  _wallet.accounts = accounts;

  const publicKey = await tapwallet.getPublicKey();
  _wallet.publicKey = publicKey;

  const balance = await tapwallet.getBalance();
  _wallet.btcBalance = {
    confirmed: balance.confirmed,
    unconfirmed: balance.unconfirmed,
    total: balance.confirmed + balance.unconfirmed,
  };

  _wallet.network = await tapwallet.getNetwork();
  _wallet.provider = "tapwallet";

  walletContext.updateWallet(_wallet);
};

const signMessage = async (message: string) => {
  const tapwallet = (globalThis as any).tapwallet;
  if (!tapwallet) {
    throw new Error("TapWallet not connected");
  }

  try {
    logger.debug("ui", {
      message: "TapWallet signing message",
      data: { messageLength: message.length },
    });

    const signature = await tapwallet.signMessage(message);

    logger.debug("ui", {
      message: "TapWallet signature result",
      data: { signature },
    });

    return signature;
  } catch (error) {
    logger.error("ui", {
      message: "Error signing message with TapWallet",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const signPSBT = async (
  psbtHex: string,
  inputsToSign: { index: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  const tapwallet = (globalThis as any).tapwallet;
  if (!tapwallet) {
    return { signed: false, error: "TapWallet not connected" };
  }

  try {
    logger.debug("ui", {
      message: "Signing PSBT with TapWallet",
      data: {
        psbtHexLength: psbtHex.length,
        inputsToSign,
        enableRBF,
        autoBroadcast,
      },
    });

    const options: any = {
      enableRBF,
    };

    if (inputsToSign?.length > 0) {
      options.inputsToSign = inputsToSign.map((input) => ({
        index: input.index,
        sighashTypes: sighashTypes || undefined,
      }));
    }

    const signedPsbtHex = await tapwallet.signPsbt(psbtHex, options);

    logger.debug("ui", {
      message: "TapWallet signPsbt result",
      data: { signedPsbtHex },
    });

    if (!signedPsbtHex) {
      return { signed: false, error: "No result from TapWallet" };
    }

    if (autoBroadcast) {
      try {
        const txid = await tapwallet.pushPsbt(signedPsbtHex);
        logger.info("ui", {
          message: "Successfully broadcast transaction",
          data: { txid },
        });
        return { signed: true, txid };
      } catch (broadcastError) {
        return {
          signed: true,
          psbt: signedPsbtHex,
          error: "Transaction signed but broadcast failed",
        };
      }
    }

    return { signed: true, psbt: signedPsbtHex };
  } catch (error: unknown) {
    return handleWalletError(error, "TapWallet");
  }
};

const broadcastRawTX = async (rawTx: string) => {
  const tapwallet = (globalThis as any).tapwallet;
  return await tapwallet.pushTx({ rawtx: rawTx });
};

const broadcastPSBT = async (psbtHex: string) => {
  const tapwallet = (globalThis as any).tapwallet;
  return await tapwallet.pushPsbt(psbtHex);
};

export const tapWalletProvider = {
  checkTapWallet,
  connectTapWallet,
  signMessage,
  signPSBT,
  broadcastRawTX,
  broadcastPSBT,
};
