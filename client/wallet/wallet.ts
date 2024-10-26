import { Signal, signal } from "@preact/signals";

import { Wallet } from "$types/index.d.ts";
import {
  broadcastPSBT,
  broadcastRawTX,
  signMessage,
  signPSBT,
} from "./walletHelper.ts";

interface WalletContext {
  readonly wallet: Wallet;
  readonly isConnected: boolean;
  updateWallet: (wallet: Wallet) => void;
  getBasicStampInfo: (address: string) => Promise<any>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<any>;
  signPSBT: (
    wallet: Wallet,
    psbt: string,
    inputsToSign: any[],
    enableRBF?: boolean,
    sighashTypes?: number[],
    autoBroadcast?: boolean,
  ) => Promise<any>;
  broadcastRawTX: (rawTx: string) => Promise<any>;
  broadcastPSBT: (psbtHex: string) => Promise<any>;
  showConnectModal: () => void;
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
  addressType: undefined,
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

export const walletSignal = signal<Wallet>(initialWalletState);
export const isConnectedSignal = signal<boolean>(initialConnected);

export const updateWallet = (_wallet: Wallet) => {
  walletSignal.value = _wallet;
  localStorage.setItem("wallet", JSON.stringify(_wallet));
  isConnectedSignal.value = true;
};

export const disconnect = () => {
  walletSignal.value = initialWallet;
  isConnectedSignal.value = false;
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
  get wallet() {
    return walletSignal.value;
  },
  get isConnected() {
    return isConnectedSignal.value;
  },
  updateWallet,
  disconnect,
  getBasicStampInfo,
  signMessage: async (message: string) => {
    return await signMessage(walletContext.wallet, message);
  },
  signPSBT: async (
    wallet: Wallet,
    psbt: string,
    inputsToSign: any[],
    enableRBF = true,
    sighashTypes?: number[],
    autoBroadcast = true,
  ) => {
    console.log("Entering signPSBT in walletContext");
    console.log("Wallet provider:", wallet.provider);
    console.log("PSBT length:", psbt.length);
    console.log("Number of inputs to sign:", inputsToSign.length);
    console.log("Enable RBF:", enableRBF);
    return await signPSBT(
      wallet,
      psbt,
      inputsToSign,
      enableRBF,
      sighashTypes,
      autoBroadcast,
    );
  },
  broadcastRawTX: async (rawTx: string) => {
    return await broadcastRawTX(walletContext.wallet, rawTx);
  },
  broadcastPSBT: async (psbtHex: string) => {
    return await broadcastPSBT(walletContext.wallet, psbtHex);
  },
  showConnectModal: () => {
    showConnectWalletModal.value = true;
  },
};
