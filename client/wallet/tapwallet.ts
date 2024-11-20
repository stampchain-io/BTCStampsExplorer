import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";

export const isTapWalletInstalled = signal<boolean>(false);

export const connectTapWallet = async (addToast) => {
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
    addToast(`Failed to connect to TapWallet: ${error.message}`, "error");
  }
};

export const checkTapWallet = () => {
  const isAvailable = checkWalletAvailability("tapwallet");
  isTapWalletInstalled.value = isAvailable;
  return isAvailable;
};

const getProvider = () => {
  const wallets = getGlobalWallets();
  return wallets.tapwallet;
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
    total: balance.total,
  };

  const basicInfo = await walletContext.getBasicStampInfo(accounts[0]);
  _wallet.stampBalance = basicInfo.stampBalance;
  _wallet.network = await tapwallet.getNetwork();
  _wallet.provider = "tapwallet";

  walletContext.isConnected.value = true;
  walletContext.updateWallet(_wallet);
};

const signMessage = async (message: string) => {
  const tapwallet = (globalThis as any).tapwallet;
  if (!tapwallet) {
    throw new Error("TapWallet not connected");
  }
  console.log("TapWallet signing message:", message);
  try {
    const signature = await tapwallet.signMessage(message);
    console.log("TapWallet signature result:", signature);
    return signature;
  } catch (error) {
    console.error("Error signing message with TapWallet:", error);
    throw error;
  }
};

const signPSBT = async (
  psbtHex: string,
  inputsToSign?: { index: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  const tapwallet = (globalThis as any).tapwallet;
  if (!tapwallet) {
    throw new Error("TapWallet not connected");
  }
  try {
    const options: any = {
      enableRBF,
    };

    if (inputsToSign && inputsToSign.length > 0) {
      options.inputsToSign = inputsToSign.map((input) => ({
        index: input.index,
        sighashTypes: sighashTypes || undefined,
      }));
    }

    // Sign the PSBT
    const signedPsbtHex = await tapwallet.signPsbt(psbtHex, options);

    if (!signedPsbtHex) {
      throw new Error("Failed to sign PSBT with TapWallet");
    }

    if (autoBroadcast) {
      // Broadcast the signed PSBT
      const txid = await tapwallet.pushPsbt(signedPsbtHex);
      return { signed: true, txid };
    } else {
      // Return the signed PSBT for further handling
      return { signed: true, psbt: signedPsbtHex };
    }
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
