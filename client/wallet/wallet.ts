import { signal } from "@preact/signals";
import { logger } from "$lib/utils/logger.ts";

import { Wallet } from "$types/index.d.ts";
import {
  broadcastPSBT,
  broadcastRawTX,
  signMessage,
  signPSBT,
} from "./walletHelper.ts";

// Add this at the very top of the file, before any imports
declare global {
  interface Window {
    __DEBUG?: {
      namespaces: string;
      enabled: boolean;
    };
  }
}

interface GlobalWithDebug {
  __DEBUG?: {
    namespaces: string;
    enabled: boolean;
  };
}

// Move interfaces and variables to the top
interface WalletProviders {
  LeatherProvider?: any;
  okxwallet?: any;
  unisat?: any;
  tapwallet?: any;
  phantom?: any;
}

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

// Initialize wallet state
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
export const showConnectWalletModal = signal<boolean>(false);

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

// Wallet context with all functionality
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

// Provider checking functions
export function getGlobalWallets(): WalletProviders {
  // Skip provider checks if we're not in a browser context
  if (typeof globalThis === "undefined" || !("document" in globalThis)) {
    return {};
  }

  // Only log wallet availability on client-side
  const global = globalThis as unknown as {
    LeatherProvider?: unknown;
    okxwallet?: { bitcoin?: unknown };
    unisat?: unknown;
    tapwallet?: unknown;
    phantom?: { bitcoin?: { isPhantom?: boolean } };
  };

  logger.debug("ui", {
    message: "Checking wallet providers (client-side)",
    data: {
      hasLeather: Boolean(global.LeatherProvider),
      hasOKX: Boolean(global.okxwallet?.bitcoin),
      hasUnisat: Boolean(global.unisat),
      hasTapWallet: Boolean(global.tapwallet),
      hasPhantom: Boolean(global.phantom?.bitcoin?.isPhantom),
      timestamp: new Date().toISOString(),
    },
  });

  return {
    LeatherProvider: global.LeatherProvider,
    okxwallet: global.okxwallet,
    unisat: global.unisat,
    tapwallet: global.tapwallet,
    phantom: global.phantom,
  };
}

// Update wallet availability checks
export function checkWalletAvailability(provider: string): boolean {
  // Skip checks if we're not in a browser context
  if (typeof globalThis === "undefined" || !("document" in globalThis)) {
    return false;
  }

  const wallets = getGlobalWallets();

  switch (provider) {
    case "leather":
      return !!wallets.LeatherProvider;
    case "okx":
      return !!wallets.okxwallet?.bitcoin;
    case "unisat":
      return !!wallets.unisat;
    case "tapwallet":
      return !!wallets.tapwallet;
    case "phantom":
      return !!wallets.phantom?.bitcoin?.isPhantom;
    default:
      return false;
  }
}
