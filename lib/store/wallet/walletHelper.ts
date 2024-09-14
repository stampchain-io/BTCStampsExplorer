import { leatherProvider } from "./leather.ts";
import { okxProvider } from "./okx.ts";
import { unisatProvider } from "./unisat.ts";
import { Wallet } from "./wallet.d.ts";
import { tapWalletProvider } from "./tapwallet.ts";
import { phantomProvider } from "./phantom.ts";

export const getWalletProvider = (provider: string | undefined) => {
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
  if (!wallet.provider) throw new Error("No wallet provider specified");
  const provider = getWalletProvider(wallet.provider);
  return await provider.signMessage(message);
};

export const signPSBT = async (wallet: Wallet, psbt: string) => {
  if (!wallet.provider) throw new Error("No wallet provider specified");
  const provider = getWalletProvider(wallet.provider);
  try {
    const result = await provider.signPSBT(psbt);

    if (result.signed) {
      return result.psbt || result.txid;
    } else if (result.cancelled) {
      throw new Error("Transaction cancelled by user");
    } else {
      throw new Error(result.error || "Failed to sign PSBT");
    }
  } catch (error) {
    console.error("Error in signPSBT:", error);
    throw error;
  }
};

export const broadcastRawTX = async (wallet: Wallet, rawTx: string) => {
  if (!wallet.provider) throw new Error("No wallet provider specified");
  const provider = getWalletProvider(wallet.provider);
  return await provider.broadcastRawTX(rawTx);
};

export const broadcastPSBT = async (wallet: Wallet, psbtHex: string) => {
  if (!wallet.provider) throw new Error("No wallet provider specified");
  const provider = getWalletProvider(wallet.provider);
  return await provider.broadcastPSBT(psbtHex);
};
