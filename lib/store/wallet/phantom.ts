import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { Wallet } from "./wallet.d.ts";
import { SignPSBTResult } from "$lib/types/src20.d.ts";

export const isPhantomInstalled = signal<boolean>(false);

export const connectPhantom = async (addToast) => {
  try {
    const provider = getProvider();
    if (!provider) {
      addToast(
        "Phantom wallet not detected. Please install the Phantom extension.",
        "error",
      );
      return;
    }
    const accounts = await provider.requestAccounts();
    await handleAccountsChanged(accounts);
    addToast("Successfully connected to Phantom wallet", "success");
  } catch (error) {
    addToast(`Failed to connect to Phantom wallet: ${error.message}`, "error");
  }
};

const getProvider = () => {
  if ("phantom" in window) {
    const provider = window.phantom?.bitcoin;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  return null;
};

export const checkPhantom = () => {
  const provider = getProvider();
  if (provider) {
    isPhantomInstalled.value = true;
    provider.on("accountsChanged", handleAccountsChanged);
    return true;
  }
  isPhantomInstalled.value = false;
  return false;
};

const handleAccountsChanged = async (accounts: any[]) => {
  if (accounts.length === 0) {
    walletContext.disconnect();
    return;
  }

  const provider = getProvider();
  const _wallet = {} as Wallet;
  _wallet.address = accounts[0].address;
  _wallet.accounts = accounts.map((acc) => acc.address);
  _wallet.publicKey = accounts[0].publicKey;

  // Phantom doesn't provide a direct method to get balance, so we'll need to implement this separately
  // _wallet.btcBalance = await getBtcBalance(_wallet.address);

  const basicInfo = await walletContext.getBasicStampInfo(_wallet.address);
  _wallet.stampBalance = basicInfo.stampBalance;
  _wallet.network = "mainnet"; // Phantom currently only supports mainnet
  _wallet.provider = "phantom";

  walletContext.isConnected.value = true;
  walletContext.updateWallet(_wallet);
};

const signMessage = async (message: string) => {
  const provider = getProvider();
  if (!provider) {
    throw new Error("Phantom wallet not connected");
  }
  console.log("Phantom wallet signing message:", message);
  try {
    const result = await provider.signMessage(
      new TextEncoder().encode(message),
    );
    console.log("Phantom wallet signature result:", result);
    return result.signature;
  } catch (error) {
    console.error("Error signing message with Phantom wallet:", error);
    throw error;
  }
};

const signPSBT = async (
  psbtHex: string,
  _inputsToSign?: { index: number }[],
  enableRBF = true,
): Promise<SignPSBTResult> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error("Phantom wallet not connected");
  }
  try {
    const result = await provider.signPSBT(psbtHex, { enableRBF });
    if (result && result.hex) {
      return { signed: true, psbt: result.hex };
    } else {
      return {
        signed: false,
        error: "Unexpected result format from Phantom wallet",
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

export const phantomProvider = {
  checkPhantom,
  connectPhantom,
  signMessage,
  signPSBT,
};
