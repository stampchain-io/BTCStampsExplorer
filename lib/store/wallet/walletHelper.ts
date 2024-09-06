import { leatherProvider } from "./leather.ts";
import { okxProvider } from "./okx.ts";
import { unisatProvider } from "./unisat.ts";
import { Wallet } from "./wallet.d.ts";
import { tapWalletProvider } from "./tapwallet.ts";

export const getWalletProvider = (provider: string) => {
  switch (provider) {
    case "leather":
      return leatherProvider;
    case "okx":
      return okxProvider;
    case "unisat":
      return unisatProvider;
    case "tapwallet":
      return tapWalletProvider;
    default:
      throw new Error(`Unsupported wallet provider: ${provider}`);
  }
};

export const signMessage = async (wallet: Wallet, message: string) => {
  const provider = getWalletProvider(wallet.provider);
  return await provider.signMessage(message);
};

export const signPSBT = async (wallet: Wallet, psbt: string) => {
  const provider = getWalletProvider(wallet.provider);
  return await provider.signPSBT(psbt);
};

export const broadcastRawTX = async (wallet: Wallet, rawTx: string) => {
  const provider = getWalletProvider(wallet.provider);
  return await provider.broadcastRawTX(rawTx);
};

export const broadcastPSBT = async (wallet: Wallet, psbtHex: string) => {
  const provider = getWalletProvider(wallet.provider);
  return await provider.broadcastPSBT(psbtHex);
};
