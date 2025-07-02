import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";
import { getBTCBalanceInfo } from "$lib/utils/balanceUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { broadcastTransaction } from "$lib/utils/minting/broadcast.ts";
import type { BaseToast } from "$lib/utils/toastSignal.ts";

export const isPhantomInstalled = signal<boolean>(false);

export const connectPhantom = async (
  addToast: (message: string, type: BaseToast["type"]) => void,
) => {
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
  } catch (error: unknown) {
    addToast(
      `Failed to connect to Phantom wallet: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
    );
  }
};

const getProvider = () => {
  const wallets = getGlobalWallets();
  return wallets.phantom?.bitcoin;
};

export const checkPhantom = () => {
  const isAvailable = checkWalletAvailability("phantom");
  isPhantomInstalled.value = isAvailable;
  return isAvailable;
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

  if (_wallet.address) {
    const addressInfo = await getBTCBalanceInfo(_wallet.address);

    _wallet.btcBalance = {
      confirmed: addressInfo?.balance ?? 0,
      unconfirmed: addressInfo?.unconfirmedBalance ?? 0,
      total: (addressInfo?.balance ?? 0) +
        (addressInfo?.unconfirmedBalance ?? 0),
    };
  }

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
  inputsToSign: { index: number; address?: string; sighashType?: number }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  const provider = getProvider();
  if (!provider) {
    return { signed: false, error: "Phantom wallet not connected" };
  }

  try {
    logger.debug("ui", {
      message: "Signing PSBT with Phantom",
      data: {
        psbtHexLength: psbtHex.length,
        inputsToSign,
        enableRBF,
        autoBroadcast,
      },
    });

    const psbtBuffer = hexToUint8Array(psbtHex);
    const inputsToSignArray = inputsToSign?.map((input) => ({
      address: input.address || walletContext.wallet.address,
      signingIndexes: [input.index],
      sigHash: input.sighashType || sighashTypes?.[0],
    }));

    const result = await provider.signPSBT(psbtBuffer, {
      inputsToSign: inputsToSignArray,
      enableRBF,
    });

    logger.debug("ui", {
      message: "Phantom signPSBT result",
      data: { result },
    });

    if (!result) {
      return { signed: false, error: "No result from Phantom wallet" };
    }

    const signedPsbtHex = uint8ArrayToHex(result);

    if (autoBroadcast) {
      try {
        const txid = await broadcastTransaction(signedPsbtHex);
        logger.debug("ui", {
          message: "Transaction broadcast successful",
          data: { txid },
        });
        return {
          signed: true,
          psbt: signedPsbtHex,
          txid,
        };
      } catch (broadcastError: unknown) {
        logger.error("ui", {
          message: "Transaction broadcast failed",
          error: broadcastError,
        });
        return {
          signed: true,
          psbt: signedPsbtHex,
          error: `Transaction signed but broadcast failed: ${
            broadcastError instanceof Error
              ? broadcastError.message
              : String(broadcastError)
          }`,
        };
      }
    }

    return { signed: true, psbt: signedPsbtHex };
  } catch (error: unknown) {
    return handleWalletError(error, "Phantom");
  }
};

export const phantomProvider = {
  checkPhantom,
  connectPhantom,
  signMessage,
  signPSBT,
};
