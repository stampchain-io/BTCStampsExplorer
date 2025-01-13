import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";
import { logger } from "$lib/utils/logger.ts";
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
  addToast: (message: string, type: "error" | "success") => void,
) => {
  const unisat = getProvider();
  if (!unisat) {
    addToast("Unisat not installed", "error");
    return;
  }
  const result = await unisat.requestAccounts();
  handleAccountsChanged(result);
  addToast("Connected using Unisat wallet", "success");
};

const handleAccountsChanged = async (_accounts: string[]) => {
  console.log("handleAccountsChanged", _accounts);
  if (walletContext.wallet.address === _accounts[0]) {
    return;
  }
  if (_accounts.length === 0) {
    walletContext.disconnect();
    return;
  }
  const _wallet = {} as Wallet;
  const unisat = getProvider();
  _wallet.accounts = _accounts;
  const address = _accounts[0];
  _wallet.address = address;
  const publicKey = await unisat.getPublicKey();
  _wallet.publicKey = publicKey;
  const balance = await unisat.getBalance();
  _wallet.btcBalance = {
    confirmed: balance.confirmed,
    unconfirmed: balance.unconfirmed,
    total: balance.confirmed + balance.unconfirmed,
  };
  _wallet.network = "mainnet";
  _wallet.provider = "unisat";
  walletContext.updateWallet(_wallet);
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

// Export the provider
export const unisatProvider = {
  connectUnisat,
  signPSBT,
};
