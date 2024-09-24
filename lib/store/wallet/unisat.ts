import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$lib/types/index.d.ts";

export const isUnisatInstalled = signal<boolean>(false);

export const connectUnisat = async (addToast) => {
  const unisat = (window as any).unisat;
  if (!unisat) {
    addToast("Unisat not installed", "error");
    return;
  }
  const result = await unisat.requestAccounts();
  handleAccountsChanged(result, addToast);
  addToast("Connected using Unisat wallet", "success");
};

const handleAccountsChanged = async (_accounts: string[]) => {
  console.log("handleAccountsChanged", _accounts);
  if (walletContext.wallet.value.accounts[0] === _accounts[0]) {
    return;
  }
  if (_accounts.length === 0) {
    walletContext.disconnect();
    return;
  }
  const _wallet = {} as Wallet;
  const unisat = (window as any).unisat;
  _wallet.accounts = _accounts;
  const address = _accounts[0];
  _wallet.address = address;
  const publicKey = await unisat.getPublicKey(address);
  _wallet.publicKey = publicKey;
  const balance = await unisat.getBalance();
  _wallet.btcBalance = balance;
  const basicInfo = await walletContext.getBasicStampInfo(address);
  _wallet.stampBalance = basicInfo.stampBalance;
  _wallet.network = "mainnet";
  _wallet.provider = "unisat";
  walletContext.isConnected.value = true;
  walletContext.updateWallet(_wallet);
};

const unisat = (window as any).unisat;
unisat?.on("accountsChanged", handleAccountsChanged);

// Sign a message
const signMessage = async (message: string) => {
  const unisat = (window as any).unisat;
  if (!unisat) {
    throw new Error("Unisat wallet not connected");
  }
  console.log("Unisat wallet signing message:", message);
  try {
    const signature = await unisat.signMessage(message);
    console.log("Unisat wallet signature result:", signature);
    return signature;
  } catch (error) {
    console.error("Error signing message with Unisat wallet:", error);
    throw error;
  }
};

// Sign a PSBT hex tx
const signPSBT = async (
  psbtHex: string,
  _inputsToSign?: { index: number }[],
  enableRBF = true,
): Promise<SignPSBTResult> => {
  const unisat = (window as any).unisat;
  try {
    const signature = await unisat.signPsbt(psbtHex, { enableRBF });
    if (signature) {
      return { signed: true, psbt: signature };
    } else {
      return {
        signed: false,
        error: "Unexpected result format from Unisat wallet",
      };
    }
  } catch (error) {
    console.error("Error signing PSBT:", error);
    if (error.message && error.message.includes("User rejected")) {
      return { signed: false, cancelled: true };
    }
    return { signed: false, error: error.message };
  }
};

// Broadcast a raw tx
const broadcastRawTX = async (rawTx: string) => {
  const unisat = (window as any).unisat;
  const txid = await unisat.pushTx(rawTx);
  return txid;
};

// Broacdcast a PSBT hex tx
const broadcastPSBT = async (psbtHex: string) => {
  const unisat = (window as any).unisat;
  const txid = await unisat.pushPsbt(psbtHex);
  return txid;
};

export const unisatProvider = {
  connectUnisat,
  signMessage,
  signPSBT,
  broadcastRawTX,
  broadcastPSBT,
};
