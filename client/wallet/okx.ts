import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";
import type { BaseToast } from "$lib/utils/toastSignal.ts";

export const isOKXInstalled = signal<boolean>(false);

export const connectOKX = async (
  addToast: (message: string, type: BaseToast["type"]) => void,
) => {
  try {
    const okx = (globalThis as any).okxwallet;
    if (!okx) {
      logger.error("ui", {
        message: "OKX wallet not detected",
        context: "connectOKX",
      });
      addToast(
        "OKX wallet not detected. Please install the OKX extension.",
        "error",
      );
      return;
    }
    await okx.bitcoin.requestAccounts();
    await handleAccountsChanged();
    logger.info("ui", {
      message: "Successfully connected to OKX wallet",
      context: "connectOKX",
    });
    addToast("Successfully connected to OKX wallet", "success");
  } catch (error: unknown) {
    logger.error("ui", {
      message: "Failed to connect to OKX wallet",
      context: "connectOKX",
      error: error instanceof Error ? error.message : String(error),
    });
    addToast(
      `Failed to connect to OKX wallet: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
    );
  }
};

export const checkOKX = () => {
  const isAvailable = checkWalletAvailability("okx");
  isOKXInstalled.value = isAvailable;
  return isAvailable;
};

const getProvider = () => {
  const wallets = getGlobalWallets();
  return wallets.okxwallet;
};

const handleAccountsChanged = async () => {
  const okx = (globalThis as any).okxwallet;
  if (!okx || !okx.bitcoin) {
    logger.error("ui", {
      message: "OKX wallet not connected",
      context: "handleAccountsChanged",
    });
    return;
  }

  try {
    const accounts: string[] = await okx.bitcoin.getAccounts();
    if (!accounts || accounts.length === 0) {
      logger.error("ui", {
        message: "No accounts found in OKX wallet",
        context: "handleAccountsChanged",
      });
      walletContext.disconnect();
      return;
    }

    const address = accounts[0];
    const balanceInfo = await okx.bitcoin.getBalance();
    const publicKey = await okx.bitcoin.getPublicKey();

    logger.debug("ui", {
      message: "Fetched OKX wallet information",
      context: "handleAccountsChanged",
      address,
      balanceInfo,
    });

    const _wallet: Wallet = {
      address,
      accounts,
      publicKey,
      btcBalance: {
        confirmed: balanceInfo.confirmed,
        unconfirmed: balanceInfo.unconfirmed,
        total: balanceInfo.total,
      },
      network: "mainnet",
      provider: "okx",
      stampBalance: [],
    };

    logger.info("ui", {
      message: "Updated wallet information",
      context: "handleAccountsChanged",
      wallet: _wallet,
    });

    walletContext.updateWallet(_wallet);
  } catch (error: unknown) {
    logger.error("ui", {
      message: "Error fetching account from OKX wallet",
      context: "handleAccountsChanged",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const signMessage = async (message: string) => {
  const okx = (globalThis as any).okxwallet;
  if (!okx || !okx.bitcoin) {
    throw new Error("OKX wallet not connected");
  }
  console.log("OKX wallet signing message:", message);
  try {
    const signature = await okx.bitcoin.signMessage(message);
    console.log("OKX wallet signature result:", signature);
    return signature;
  } catch (error) {
    console.error("Error signing message with OKX wallet:", error);
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
  const okx = getProvider();
  if (!okx) {
    return { signed: false, error: "OKX wallet not connected" };
  }
  try {
    logger.debug("ui", {
      message: "Signing PSBT with OKX",
      data: {
        psbtHexLength: psbtHex.length,
        inputsToSign,
        enableRBF,
        autoBroadcast,
      },
    });

    const options: any = {
      autoFinalized: true,
      enableRBF, // Add RBF support
    };

    if (inputsToSign?.length > 0) {
      options.toSignInputs = inputsToSign.map((input, idx) => ({
        index: input.index,
        sighashTypes: sighashTypes ? [sighashTypes[idx]] : undefined,
      }));
    }

    const signedPsbtHex = await okx.bitcoin.signPsbt(psbtHex, options);

    logger.debug("ui", {
      message: "OKX signPsbt result",
      data: { signedPsbtHex },
    });

    if (!signedPsbtHex) {
      return { signed: false, error: "No result from OKX wallet" };
    }

    if (autoBroadcast) {
      try {
        const txid = await okx.bitcoin.pushPsbt(signedPsbtHex);
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
    return handleWalletError(error, "OKX");
  }
};

const broadcastRawTX = async (rawTx: string) => {
  const okx = (globalThis as any).okxwallet;
  return await okx.bitcoin.pushTx(rawTx);
};

const broadcastPSBT = async (psbtHex: string) => {
  const okx = (globalThis as any).okxwallet;
  return await okx.bitcoin.pushPsbt(psbtHex);
};

export const okxProvider = {
  checkOKX,
  connectOKX,
  signMessage,
  signPSBT,
  broadcastRawTX,
  broadcastPSBT,
};
