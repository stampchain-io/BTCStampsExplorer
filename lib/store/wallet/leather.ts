import { signal } from "@preact/signals";
import { Wallet } from "./wallet.d.ts";
import { walletContext } from "./wallet.ts";
import { getBtcBalance } from "utils/btc.ts";

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
  if (typeof globalThis !== "undefined" && globalThis.LeatherProvider) {
    isLeatherInstalled.value = true;
    return true;
  }
  isLeatherInstalled.value = false;
  return false;
};

export const connectLeather = async (addToast: AddToastFunction) => {
  try {
    const isInstalled = checkLeather();
    if (!isInstalled) {
      addToast(
        "Leather wallet not detected. Please install the Leather extension.",
        "error",
      );
      return;
    }

    const response = await globalThis.LeatherProvider.request("getAddresses");

    let addresses;
    if (
      response && response.result && Array.isArray(response.result.addresses)
    ) {
      addresses = response.result.addresses;
    } else {
      throw new Error("Invalid response format from getAddresses");
    }

    if (!addresses || addresses.length === 0) {
      throw new Error("No addresses received from Leather wallet");
    }

    await handleConnect(addresses);
    addToast("Successfully connected to Leather wallet", "success");
  } catch (error) {
    console.error("Error in connectLeather:", error);
    addToast(`Failed to connect to Leather wallet: ${error.message}`, "error");
  }
};

export const handleConnect = async (addresses: LeatherAddress[]) => {
  if (!addresses || addresses.length === 0) {
    throw new Error("No addresses received from Leather wallet");
  }

  const btcAddress = addresses.find((addr) =>
    addr.symbol === "BTC" && addr.type === "p2wpkh"
  );

  if (!btcAddress) {
    throw new Error("No BTC p2wpkh address found in the received addresses");
  }

  const _wallet = {} as Wallet;
  _wallet.address = btcAddress.address;
  _wallet.accounts = [btcAddress.address];
  _wallet.publicKey = btcAddress.publicKey;

  const btcBalance = await getBtcBalance(btcAddress.address);
  _wallet.btcBalance = {
    confirmed: btcBalance,
    unconfirmed: 0,
    total: btcBalance,
  };

  const basicInfo = await walletContext.getBasicStampInfo(btcAddress.address);
  _wallet.stampBalance = basicInfo.stampBalance;
  _wallet.network = "mainnet";
  _wallet.provider = "leather";

  walletContext.isConnected.value = true;
  walletContext.updateWallet(_wallet);
};

const signMessage = async (message: string) => {
  if (typeof globalThis.LeatherProvider === "undefined") {
    throw new Error("Leather wallet not connected");
  }

  const { signature } = await globalThis.LeatherProvider.request(
    "signMessage",
    {
      message,
      paymentType: "p2wpkh",
    },
  );
  return signature;
};

const signPSBT = async (psbt: string) => {
  if (typeof globalThis.LeatherProvider === "undefined") {
    throw new Error("Leather wallet not connected");
  }

  const { psbt: signedPsbt } = await globalThis.LeatherProvider.request(
    "signPsbt",
    {
      psbt,
    },
  );
  return signedPsbt;
};

export const leatherProvider = {
  checkLeather,
  connectLeather,
  signMessage,
  signPSBT,
};
