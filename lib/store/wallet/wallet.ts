import { Signal, signal } from "@preact/signals";

import { Wallet } from "store/wallet/wallet.d.ts";
import {
  broadcastPSBT,
  broadcastRawTX,
  signMessage,
  signPSBT,
} from "./walletHelper.ts";

interface WalletContext {
  wallet: Signal<Wallet>;
  isConnected: Signal<boolean>;
  updateWallet: (wallet: Wallet) => void;
  getBasicStampInfo: (address: string) => Promise<any>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<any>;
  signPSBT: (
    wallet: Wallet,
    psbt: string,
    inputsToSign: any[],
    enableRBF?: boolean,
  ) => Promise<any>;
  broadcastRawTX: (rawTx: string) => Promise<any>;
  broadcastPSBT: (psbtHex: string) => Promise<any>;
}

export const initialWallet: Wallet = {
  address: undefined,
  publicKey: undefined,
  accounts: [],
  btcBalance: {
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  },
  stampBalance: [],
  type: undefined,
  provider: undefined,
  network: undefined,
};

let initialWalletState;
let initialConnected = false;
try {
  const savedWallet = localStorage.getItem("wallet");
  initialConnected = savedWallet ? true : false;
  initialWalletState = savedWallet ? JSON.parse(savedWallet) : initialWallet;
} catch (error) {
  console.error("Error reading the wallet state:", error);
  initialWalletState = initialWallet;
}

export const wallet = signal<Wallet>(initialWalletState);
export const isConnected = signal<boolean>(initialConnected);

export const updateWallet = (_wallet: Wallet) => {
  wallet.value = _wallet;
  console.log("updateWallet", _wallet);
  localStorage.setItem("wallet", JSON.stringify(_wallet));
};

export const disconnect = () => {
  wallet.value = initialWallet;
  isConnected.value = false;
  localStorage.removeItem("wallet");
};

export const getBasicStampInfo = async (address: string) => {
  const response = await fetch("/api/v2/balance/getStampsBalance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const { stampBalance } = await response.json();
  return { stampBalance };
};

export const showConnectWalletModal = signal<boolean>(false);

export const walletContext: WalletContext = {
  wallet: signal<Wallet>(initialWallet),
  isConnected: signal<boolean>(false),
  updateWallet: (wallet: Wallet) => {
    walletContext.wallet.value = wallet;
  },
  getBasicStampInfo: async (address: string) => {
    return await getBasicStampInfo(address);
  },
  disconnect: () => {
    walletContext.wallet.value = initialWallet;
    walletContext.isConnected.value = false;
  },
  signMessage: async (message: string) => {
    return await signMessage(walletContext.wallet.value, message);
  },
  signPSBT: async (
    wallet: Wallet,
    psbt: string,
    inputsToSign: any[],
    enableRBF = true,
  ) => {
    console.log("Entering signPSBT in walletContext");
    console.log("Wallet provider:", wallet.provider);
    console.log("PSBT length:", psbt.length);
    console.log("Number of inputs to sign:", inputsToSign.length);
    console.log("Enable RBF:", enableRBF);
    return await signPSBT(wallet, psbt, inputsToSign, enableRBF);
  },
  broadcastRawTX: async (rawTx: string) => {
    return await broadcastRawTX(walletContext.wallet.value, rawTx);
  },
  broadcastPSBT: async (psbtHex: string) => {
    return await broadcastPSBT(walletContext.wallet.value, psbtHex);
  },
  showConnectModal: () => {
    showConnectWalletModal.value = true;
  },
};
