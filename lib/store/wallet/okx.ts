import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$lib/types/index.d.ts";

export const isOKXInstalled = signal<boolean>(false);

export const connectOKX = async (
  addToast: (message: string, type: string) => void,
) => {
  try {
    const okx = (window as any).okxwallet;
    if (!okx) {
      addToast(
        "OKX wallet not detected. Please install the OKX extension.",
        "error",
      );
      return;
    }
    const result = await okx.bitcoin.connect();
    await handleAccountsChanged();
    addToast("Successfully connected to OKX wallet", "success");
  } catch (error) {
    addToast(`Failed to connect to OKX wallet: ${error.message}`, "error");
  }
};

export const checkOKX = () => {
  const okx = (window as any).okxwallet;
  if (okx && okx.bitcoin) {
    isOKXInstalled.value = true;
    okx.bitcoin.on("accountsChanged", handleAccountsChanged);
    return true;
  }
  isOKXInstalled.value = false;
  return false;
};

// Modified the function to fetch multiple addresses
const handleAccountsChanged = async () => {
  const okx = (window as any).okxwallet;
  if (!okx || !okx.bitcoin) {
    console.error("OKX wallet not connected");
    return;
  }

  try {
    const accounts: string[] = await okx.bitcoin.requestAccounts();
    if (!accounts || accounts.length === 0) {
      console.error("No accounts found in OKX wallet");
      walletContext.disconnect();
      return;
    }

    const address = accounts[0];
    const balanceInfo = await okx.bitcoin.getBalance();

    const _wallet: Wallet = {
      address,
      accounts,
      publicKey: await okx.bitcoin.getPublicKey(),
      btcBalance: {
        confirmed: balanceInfo.confirmed,
        unconfirmed: balanceInfo.unconfirmed,
        total: balanceInfo.total,
      },
      // Assign other necessary properties
      network: "mainnet",
      provider: "okx",
    };

    // Fetch stamp balance or other custom balances if needed
    const basicInfo = await walletContext.getBasicStampInfo(address);
    _wallet.stampBalance = basicInfo.stampBalance;

    walletContext.isConnected.value = true;
    walletContext.updateWallet(_wallet);
  } catch (error) {
    console.error("Error fetching account from OKX wallet:", error);
  }
};

const signMessage = async (message: string) => {
  const okx = (window as any).okxwallet;
  if (!okx || !okx.bitcoin) {
    throw new Error("OKX wallet not connected");
  }
  console.log("OKX wallet signing message:", message);
  try {
    const signature = await okx.bitcoin.signMessage(message);
    console.log("OKX wallet signature result:", signature);
    return signature;
  } catch (error) {
    console.error("Error signing message with OKX wallet:", error);
    throw error;
  }
};

const signPSBT = async (
  psbtHex: string,
  inputsToSign?: { index: number }[],
  enableRBF = true,
): Promise<SignPSBTResult> => {
  const okx = (window as any).okxwallet;
  try {
    const result = await okx.bitcoin.signPsbt({
      psbt: psbtHex,
      inputsToSign,
      options: { enableRBF },
    });
    if (result && result.hex) {
      return { signed: true, psbt: result.hex };
    } else {
      return {
        signed: false,
        error: "Unexpected result format from OKX wallet",
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

const broadcastRawTX = async (rawTx: string) => {
  const okx = (window as any).okxwallet;
  return await okx.bitcoin.pushTx(rawTx);
};

const broadcastPSBT = async (psbtHex: string) => {
  const okx = (window as any).okxwallet;
  return await okx.bitcoin.pushPsbt(psbtHex);
};

export const okxProvider = {
  checkOKX,
  connectOKX,
  signMessage,
  signPSBT,
  broadcastRawTX,
  broadcastPSBT,
};
