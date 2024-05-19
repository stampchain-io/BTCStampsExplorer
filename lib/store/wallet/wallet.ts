import { signal } from "@preact/signals";

import { Wallet } from "./wallet.d.ts";

interface WalletContext {
  wallet: signal<Wallet>;
  isConnected: signal<boolean>;
  updateWallet: (wallet: Wallet) => void;
  getBasicStampInfo: (address: string) => Promise<any>;
  disconnect: () => void;
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

export const walletContext: WalletContext = {
  wallet,
  isConnected,
  updateWallet,
  getBasicStampInfo,
  disconnect,
};
