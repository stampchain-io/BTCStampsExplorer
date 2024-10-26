import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";

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
  if ("phantom" in globalThis) {
    const provider = globalThis.phantom?.bitcoin;
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

  const _wallet = {} as Wallet;
  _wallet.address = accounts[0]?.address;
  _wallet.accounts = accounts.map((acc) => acc.address);
  _wallet.publicKey = accounts[0]?.publicKey;

  // Phantom doesn't provide a direct method to get balance
  // _wallet.btcBalance = await getBtcBalance(_wallet.address);

  const basicInfo = await walletContext.getBasicStampInfo(_wallet.address);
  _wallet.stampBalance = basicInfo.stampBalance;
  _wallet.network = "mainnet";
  _wallet.provider = "phantom";

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
    return btoa(String.fromCharCode(...new Uint8Array(result.signature)));
  } catch (error) {
    console.error("Error signing message with Phantom wallet:", error);
    throw error;
  }
};

const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const byte = hex.substr(i * 2, 2);
    array[i] = parseInt(byte, 16);
  }
  return array;
};

const uint8ArrayToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const signPSBT = async (
  psbtHex: string,
  inputsToSign?: { index: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error("Phantom wallet not connected");
  }
  try {
    // Convert psbtHex to Uint8Array
    const psbtBuffer = hexToUint8Array(psbtHex);

    // Prepare inputsToSign
    const inputsToSignArray = inputsToSign?.map((input) => ({
      address: walletContext.wallet.address,
      signingIndexes: [input.index],
      sigHash: sighashTypes ? sighashTypes[0] : undefined,
    }));

    const result = await provider.signPSBT(psbtBuffer, {
      inputsToSign: inputsToSignArray,
    });

    console.log("Phantom signPSBT result:", result);

    if (result && result instanceof Uint8Array) {
      // Convert the signed PSBT back to hex
      const signedPsbtHex = uint8ArrayToHex(result);

      if (autoBroadcast) {
        // Phantom doesn't provide a direct method to broadcast
        // You might need to use an external API to broadcast
        // For now, we'll return an error
        return {
          signed: true,
          error: "Auto-broadcasting is not supported with Phantom wallet",
        };
      } else {
        return { signed: true, psbt: signedPsbtHex };
      }
    } else {
      return {
        signed: false,
        error: "Unexpected result format from Phantom wallet",
      };
    }
  } catch (error) {
    console.error("Error signing PSBT with Phantom:", error);
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
