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

export const isWonderInstalled = signal<boolean>(false);

export const checkWonder = () => {
  const isAvailable = checkWalletAvailability("wonder");
  isWonderInstalled.value = isAvailable;
  return isAvailable;
};

const getProvider = () => {
  const wallets = getGlobalWallets();
  return wallets.wonderWallet;
};

export const connectWonder = async (
  addToast: (message: string, type: BaseToast["type"]) => void,
) => {
  try {
    const wonder = getProvider();
    if (!wonder) {
      logger.error("ui", {
        message: "Wonder Wallet not detected",
        context: "connectWonder",
      });
      addToast(
        "Wonder Wallet not detected.\nPlease install the Wonder Wallet extension.",
        "error",
      );
      return;
    }
    const accounts = await wonder.requestAccounts();
    await handleAccountsChanged(accounts);
    logger.info("ui", {
      message: "Successfully connected to Wonder Wallet",
      context: "connectWonder",
    });
    addToast("Connected using Wonder Wallet.", "success");
  } catch (error: unknown) {
    const errorMessage = parseConnectionError(error);
    logger.error("ui", {
      message: "Failed to connect to Wonder Wallet",
      context: "connectWonder",
      error: errorMessage,
    });
    addToast(
      `Failed to connect to Wonder Wallet.\n${errorMessage}`,
      "error",
    );
  }
};

const handleAccountsChanged = async (accounts: string[]) => {
  if (!accounts || accounts.length === 0) {
    walletContext.disconnect();
    return;
  }
  if (walletContext.wallet.address === accounts[0]) {
    return;
  }
  const wonder = getProvider();
  const wallet = {} as Wallet;
  wallet.accounts = accounts;
  wallet.address = accounts[0];
  wallet.publicKey = await wonder.getPublicKey();
  const balance = await wonder.getBalances();
  const confirmed = balance?.confirmed ?? 0;
  const unconfirmed = balance?.unconfirmed ?? 0;
  wallet.btcBalance = {
    confirmed,
    unconfirmed,
    total: balance?.total ?? confirmed + unconfirmed,
  };
  wallet.network = "mainnet";
  wallet.provider = "wonder";
  walletContext.updateWallet(wallet);
};

const wonderForEvents = getProvider();
wonderForEvents?.on?.("accountsChanged", handleAccountsChanged);

interface WonderSignOptions {
  autoFinalized: boolean;
  enableRBF: boolean;
  toSignInputs?: {
    index: number;
    address: string;
    sighashTypes?: number[] | undefined;
  }[];
}

interface WonderSignResult {
  txhex?: string;
  txid?: string;
  psbt?: string;
}

export const signPSBT = async (
  psbtHex: string,
  inputsToSign: { index: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  try {
    const wonder = getProvider();
    if (!wonder) {
      return { signed: false, error: "Wonder Wallet not connected" };
    }

    // Wonder is UniSat-style: with autoFinalized it returns the finalized
    // { txhex, txid }; without it, a signed { psbt }. It only signs the inputs
    // it owns, so an input map is optional.
    const options: WonderSignOptions = {
      autoFinalized: autoBroadcast,
      enableRBF,
    };
    if (inputsToSign?.length > 0) {
      options.toSignInputs = inputsToSign.map((input) => ({
        index: input.index,
        address: walletContext.wallet.address,
        sighashTypes,
      }));
    }

    const rawResult = await wonder.signPsbt(psbtHex, options);
    const result = rawResult as WonderSignResult | undefined;

    logger.debug("ui", {
      message: "Wonder signPsbt result",
      data: { hasTxhex: !!result?.txhex, hasPsbt: !!result?.psbt },
    });

    if (!result) {
      return { signed: false, error: "No result from Wonder Wallet" };
    }

    // autoBroadcast → the finalized txhex is ready to push to the network.
    if (autoBroadcast && result.txhex) {
      try {
        const txid = await wonder.broadcastTransaction(result.txhex);
        logger.info("ui", {
          message: "Successfully broadcast transaction",
          data: { txid },
        });
        return { signed: true, txid };
      } catch (_broadcastError) {
        return {
          signed: true,
          psbt: result.txhex,
          error: "Transaction signed but broadcast failed",
        };
      }
    }

    // Not broadcasting (or the wallet returned a signed PSBT to broadcast later).
    if (result.psbt) {
      return { signed: true, psbt: result.psbt };
    }
    if (result.txhex) {
      return { signed: true, psbt: result.txhex };
    }
    return { signed: false, error: "No signed result from Wonder Wallet" };
  } catch (error: unknown) {
    return handleWalletError(error, "Wonder");
  }
};

export const signMessage = async (message: string): Promise<string> => {
  const wonder = getProvider();
  if (!wonder) {
    throw new Error("Wonder Wallet not connected");
  }
  return await wonder.signMessage(message);
};

// Export the provider
export const wonderProvider = {
  connectWonder,
  signPSBT,
  signMessage,
};
