import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { Wallet } from "./wallet.d.ts";
import { getBtcBalance } from "utils/btc.ts";

export const isTapWalletInstalled = signal<boolean>(false);

export const connectTapWallet = async (addToast) => {
  try {
    const tapwallet = (window as any).tapwallet;
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
  const tapwallet = (window as any).tapwallet;
  if (tapwallet) {
    isTapWalletInstalled.value = true;
    tapwallet.on("accountsChanged", handleAccountsChanged);
    return true;
  }
  isTapWalletInstalled.value = false;
  return false;
};

const handleAccountsChanged = async (accounts: string[]) => {
  if (accounts.length === 0) {
    walletContext.disconnect();
    return;
  }

  const tapwallet = (window as any).tapwallet;
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
  const tapwallet = (window as any).tapwallet;
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

const signPSBT = async (psbt: string) => {
  const tapwallet = (window as any).tapwallet;
  try {
    const result = await tapwallet.signPsbt(psbt);
    if (result && result.hex) {
      return { signed: true, psbt: result.hex };
    } else {
      return {
        signed: false,
        error: "Unexpected result format from TapWallet",
      };
    }
  } catch (error) {
    console.error("Error signing PSBT:", error);
    if (error.message && error.message.includes("User rejected")) {
      return { signed: false, cancelled: true };
    }
    return { signed: false, error: error.message };
  }
};

const broadcastRawTX = async (rawTx: string) => {
  const tapwallet = (window as any).tapwallet;
  return await tapwallet.pushTx({ rawtx: rawTx });
};

const broadcastPSBT = async (psbtHex: string) => {
  const tapwallet = (window as any).tapwallet;
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
