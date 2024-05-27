import { signal } from "@preact/signals";

import { Wallet } from "./wallet.d.ts";

import { walletContext } from "./wallet.ts";

import { getBtcBalance } from "utils/btc.ts";

interface leatherAddress {
  symbol: "BTC" | "STX";
  type?: "p2wpkh" | "p2tr";
  address: string;
  publicKey?: string;
  derivationPath?: string;
}

export const isLeatherInstalled = signal<boolean>(false);

export const connectLeather = async () => {
  const leather = (window as any).btc;
  const { result } = await leather.request("getAddresses");
  handleConnect(result.addresses);
};

export const checkLeather = async () => {
  let leather = (window as any).btc;

  for (let i = 1; i < 10 && !leather; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100 * i));
    leather = (window as any).btc;
  }
  console.log("leather", leather);
  if (!leather) {
    console.log("Leather not installed");
    return;
  }
  isLeatherInstalled.value = true;
};

export const getSegwitAddress = (_accounts: leatherAddress[]) => {
  const segwitAddress = _accounts.find((account) => account.type === "p2wpkh");
  return segwitAddress as leatherAddress;
};

export const handleConnect = async (addresses: leatherAddress[]) => {
  const _wallet = {} as Wallet;
  const address = getSegwitAddress(addresses);
  _wallet.address = address.address;
  _wallet.accounts = [address.address];
  _wallet.publicKey = address.publicKey;
  const btcBalance = await getBtcBalance(address.address);
  _wallet.btcBalance = {
    confirmed: btcBalance,
    unconfirmed: 0,
    total: btcBalance,
  };
  const basicInfo = await walletContext.getBasicStampInfo(address.address);
  _wallet.stampBalance = basicInfo.stampBalance;
  _wallet.network = "mainnet";
  _wallet.provider = "leather";
  walletContext.isConnected.value = true;
  walletContext.updateWallet(_wallet);
};

const signMessage = async (message: string) => {
  const leather = (window as any).btc;
  const signature = await leather.request("signMessage", {
    message,
  });
  return signature;
};

interface SignPsbtRequestParams {
  hex: string;
  allowedSighash?: any[]; //SignatureHash[];
  signAtIndex?: number | number[];
  network?: any; //NetworkModes;
  account?: number;
  broadcast?: boolean;
}

const signPSBT = async (psbt: string) => {
  const leather = (window as any).btc;
  const signature = await leather.request("signPSBT", {
    psbt,
  });
  return signature;
};

export const leatherProvider = {
  checkLeather,
  connectLeather,
  signMessage,
  signPSBT,
};
