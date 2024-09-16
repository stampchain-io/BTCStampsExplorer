import { leatherProvider } from "./leather.ts";
import { okxProvider } from "./okx.ts";
import { unisatProvider } from "./unisat.ts";
import { Wallet } from "./wallet.d.ts";
import { tapWalletProvider } from "./tapwallet.ts";
import { phantomProvider } from "./phantom.ts";
import { SignPSBTResult } from "$lib/types/src20.d.ts";

interface WalletProvider {
  signMessage: (message: string) => Promise<string>;
  signPSBT: (
    psbtHex: string,
    inputsToSign?: { index: number }[],
    enableRBF?: boolean,
  ) => Promise<SignPSBTResult>;
  broadcastRawTX?: (rawTx: string) => Promise<string>;
  broadcastPSBT?: (psbtHex: string) => Promise<string>;
}

export const getWalletProvider = (
  provider: string | undefined,
): WalletProvider => {
  console.log("Getting wallet provider for:", provider);
  switch (provider) {
    case "leather":
      return leatherProvider;
    case "okx":
      return okxProvider;
    case "unisat":
      return unisatProvider;
    case "tapwallet":
      return tapWalletProvider;
    case "phantom":
      return phantomProvider;
    default:
      throw new Error(`Unsupported wallet provider: ${provider}`);
  }
};

export const signMessage = async (wallet: Wallet, message: string) => {
  console.log("Signing message for wallet:", wallet.provider);
  console.log("Message to sign:", message);
  if (!wallet.provider) throw new Error("No wallet provider specified");
  const provider = getWalletProvider(wallet.provider);
  return await provider.signMessage(message);
};

export const signPSBT = async (
  wallet: Wallet,
  psbtHex: string,
  inputsToSign: any[],
  enableRBF = true,
): Promise<SignPSBTResult> => {
  console.log("Entering signPSBT in walletHelper.ts");
  console.log("Wallet provider:", wallet.provider);
  console.log("PSBT hex length:", psbtHex.length);
  console.log("Number of inputs to sign:", inputsToSign.length);
  console.log("Enable RBF:", enableRBF);

  if (!wallet.provider) {
    console.error("No wallet provider specified");
    return { signed: false, error: "No wallet provider specified" };
  }

  const provider = getWalletProvider(wallet.provider);
  console.log("Got wallet provider:", provider);

  try {
    console.log("Calling provider.signPSBT");
    const inputIndexToSign = inputsToSign.map((input) => ({
      index: input.index,
    }));
    console.log("input Index to Sign", inputIndexToSign);
    const result = await provider.signPSBT(
      psbtHex,
      inputIndexToSign,
      enableRBF,
    );
    console.log("PSBT signing result:", JSON.stringify(result, null, 2));

    if (!result) {
      return { signed: false, error: "No result from wallet provider" };
    }

    if (result.signed) {
      return {
        signed: true,
        psbt: result.psbt,
        txid: result.txid,
      };
    } else if (result.cancelled) {
      return { signed: false, cancelled: true };
    } else {
      return { signed: false, error: result.error || "Failed to sign PSBT" };
    }
  } catch (error) {
    console.error("Error in signPSBT:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
    return { signed: false, error: error.message || "Unknown error occurred" };
  }
};

export const broadcastRawTX = async (wallet: Wallet, rawTx: string) => {
  console.log("Broadcasting raw TX for wallet:", wallet.provider);
  console.log("Raw TX to broadcast:", rawTx);
  if (!wallet.provider) throw new Error("No wallet provider specified");
  const provider = getWalletProvider(wallet.provider);
  return await provider.broadcastRawTX(rawTx);
};

export const broadcastPSBT = async (wallet: Wallet, psbtHex: string) => {
  console.log("Broadcasting PSBT for wallet:", wallet.provider);
  console.log("PSBT hex to broadcast:", psbtHex);
  if (!wallet.provider) throw new Error("No wallet provider specified");
  const provider = getWalletProvider(wallet.provider);
  return await provider.broadcastPSBT(psbtHex);
};
