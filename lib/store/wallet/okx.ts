// TODO: FINISH IMPLEMENTATION
// https://www.okx.com/web3/build/docs/sdks/web-use-injected-providers#bitcoin

import { signal } from "@preact/signals";

import { walletContext } from "./wallet.ts";
import { Wallet } from "./wallet.d.ts";

export const isOKXInstalled = signal<boolean>(false);

export const connectOKX = async () => {
  const okx = (window as any).okxwallet;
  const result = await okx.bitcoin.connect();
  handleAccountsChanged([result]);
};

export const checkOKX = async () => {
  let okx = (window as any).okxwallet;

  for (let i = 1; i < 10 && !okx; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100 * i));
    okx = (window as any).okxwallet;
  }
  console.log("okx", okx);
  if (!okx) {
    console.log("OKX not installed");
    return;
  }
  isOKXInstalled.value = true;
  okx.on("accountChanged", handleAccountsChanged);

  return () => {
    okx.removeListener("accountChanged", handleAccountsChanged);
  };
};

const handleAccountsChanged = async (_accounts: string[]) => {
  console.log("handleAccountChanged", _accounts);
  const _wallet = {} as Wallet;
  const okx = (window as any).okxwallet;
};

// Sign a message
const signMessage = async (message: string) => {
};

// Sign a PSBT hex tx
const signPSBT = async (psbt: string) => {
};

// Broadcast a raw tx
const broadcastRawTX = async (rawTx: string) => {
};

// Broacdcast a PSBT hex tx
const broadcastPSBT = async (psbtHex: string) => {
};

export const unisatProvider = {
  checkOKX,
  connectOKX,
  signMessage,
  signPSBT,
  broadcastRawTX,
  broadcastPSBT,
};
