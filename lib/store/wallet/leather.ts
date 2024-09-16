import { signal } from "@preact/signals";
import { Wallet } from "./wallet.d.ts";
import { walletContext } from "./wallet.ts";
import { getBtcBalance } from "utils/btc.ts";
import { SignPSBTResult } from "$lib/types/src20.d.ts";

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
  if (typeof window !== "undefined" && "LeatherProvider" in window) {
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

    const leatherProvider = (window as any).LeatherProvider;
    const response = await leatherProvider.request("getAddresses");

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
  const leatherProvider = (window as any).LeatherProvider;
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
  inputsToSign?: { index: number }[],
  enableRBF = true, // Add this parameter
): Promise<SignPSBTResult> => {
  console.log("Entering Leather signPSBT function");
  console.log("PSBT hex length:", psbtHex.length);
  console.log("Number of inputs to sign:", inputsToSign?.length);

  const leatherProvider = (window as any).LeatherProvider;
  if (typeof leatherProvider === "undefined") {
    console.error("Leather wallet not connected");
    return { signed: false, error: "Leather wallet not connected" };
  }

  try {
    console.log("Calling Leather provider signPsbt method");
    console.log("Input parameters:", {
      hex: psbtHex.substring(0, 50) + "...", // Log first 50 characters of hex
      network: "mainnet",
      broadcast: true,
      inputsToSign: inputsToSign || undefined,
      rbf: enableRBF, // Add this parameter
    });

    const result = await leatherProvider.request(
      "signPsbt",
      {
        hex: psbtHex,
        network: "mainnet",
        broadcast: true,
        inputsToSign: inputsToSign || undefined,
        rbf: enableRBF, // Add this parameter
      },
    );

    console.log("Leather signPsbt result:", JSON.stringify(result, null, 2));

    if (result && result.result) {
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
  } catch (error) {
    console.error("Error signing PSBT with Leather:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
    if (error.message && error.message.includes("User rejected")) {
      return { signed: false, cancelled: true };
    }
    return { signed: false, error: error.message || "Unknown error occurred" };
  }
};

export const leatherProvider = {
  checkLeather,
  connectLeather,
  signMessage,
  signPSBT,
};
