import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$lib/types/index.d.ts";

export const isUnisatInstalled = signal<boolean>(false);

export const connectUnisat = async (
  addToast: (message: string, type: "error" | "success") => void,
) => {
  const unisat = (window as any).unisat;
  if (!unisat) {
    addToast("Unisat not installed", "error");
    return;
  }
  const result = await unisat.requestAccounts();
  handleAccountsChanged(result);
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
  const publicKey = await unisat.getPublicKey();
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

// Sign a PSBT hex transaction with Unisat
export const signPSBT = async (
  psbtHex: string,
  options?: {
    inputsToSign?: { index: number }[];
  },
): Promise<SignPSBTResult> => {
  try {
    const unisat = (window as any).unisat;
    if (!unisat) {
      throw new Error("Unisat wallet not connected");
    }

    // Prepare options for signing
    const unisatOptions: any = {
      // Set autoFinalized to true to let Unisat finalize the PSBT
      autoFinalized: true,
    };

    if (options?.inputsToSign && options.inputsToSign.length > 0) {
      unisatOptions.toSignInputs = options.inputsToSign.map((input, idx) => {
        if (typeof input.index !== "number") {
          throw new Error(
            `Input at position ${idx} is missing 'index' property`,
          );
        }
        return {
          index: input.index,
          address: walletContext.wallet.value.address,
        };
      });
    }

    // Sign the PSBT using Unisat's signPsbt method
    const signedPsbtHex = await unisat.signPsbt(psbtHex, unisatOptions);

    console.log("Unisat signPsbt result (signedPsbtHex):", signedPsbtHex);

    if (signedPsbtHex && typeof signedPsbtHex === "string") {
      // Broadcast the signed PSBT using Unisat's pushPsbt method
      const txid = await unisat.pushPsbt(signedPsbtHex);
      console.log("Transaction broadcasted with txid:", txid);
      return { signed: true, txid };
    } else {
      return {
        signed: false,
        error: "Unexpected result format from Unisat wallet",
      };
    }
  } catch (error) {
    console.error(
      "Error signing and broadcasting transaction with Unisat:",
      error,
    );
    return {
      signed: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

// Export the provider
export const unisatProvider = {
  connectUnisat,
  signPSBT,
};
