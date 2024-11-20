import { signal } from "@preact/signals";
import { walletContext } from "./wallet.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { checkWalletAvailability, getGlobalWallets } from "./wallet.ts";
import { handleWalletError } from "./walletHelper.ts";
export const isUnisatInstalled = signal<boolean>(false);

export const checkUnisat = () => {
  const isAvailable = checkWalletAvailability("unisat");
  isUnisatInstalled.value = isAvailable;
  return isAvailable;
};

const getProvider = () => {
  const wallets = getGlobalWallets();
  return wallets.unisat;
};

export const connectUnisat = async (
  addToast: (message: string, type: "error" | "success") => void,
) => {
  const unisat = getProvider();
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
  if (walletContext.wallet.address === _accounts[0]) {
    return;
  }
  if (_accounts.length === 0) {
    walletContext.disconnect();
    return;
  }
  const _wallet = {} as Wallet;
  const unisat = getProvider();
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
  walletContext.updateWallet(_wallet);
};

const unisat = getProvider();
unisat?.on("accountsChanged", handleAccountsChanged);

export const signPSBT = async (
  psbtHex: string,
  inputsToSign?: { index: number; sighashTypes?: number[] }[],
  enableRBF = true,
  sighashTypes?: number[],
  autoBroadcast = true,
): Promise<SignPSBTResult> => {
  try {
    const unisat = getProvider();
    if (!unisat) {
      throw new Error("Unisat wallet not connected");
    }

    // Prepare options for signing
    const unisatOptions: any = {
      autoFinalized: true, // Default is true
    };

    if (inputsToSign && inputsToSign.length > 0) {
      unisatOptions.toSignInputs = inputsToSign.map((input, idx) => {
        if (typeof input.index !== "number") {
          throw new Error(
            `Input at position ${idx} is missing 'index' property`,
          );
        }
        return {
          index: input.index,
          address: walletContext.wallet.address,
          sighashTypes: input.sighashTypes || sighashTypes,
        };
      });
    }

    // Sign the PSBT using Unisat's signPsbt method
    const signedPsbtHex = await unisat.signPsbt(psbtHex, unisatOptions);

    console.log("Unisat signPsbt result (signedPsbtHex):", signedPsbtHex);

    if (signedPsbtHex && typeof signedPsbtHex === "string") {
      if (autoBroadcast) {
        // Broadcast the signed PSBT using Unisat's pushPsbt method
        const txid = await unisat.pushPsbt(signedPsbtHex);
        console.log("Transaction broadcasted with txid:", txid);
        return { signed: true, txid };
      } else {
        // Return the signed PSBT for further handling
        return { signed: true, psbt: signedPsbtHex };
      }
    } else {
      return {
        signed: false,
        error: "Unexpected result format from Unisat wallet",
      };
    }
  } catch (error: unknown) {
    return handleWalletError(error, "Unisat");
  }
};

// Export the provider
export const unisatProvider = {
  connectUnisat,
  signPSBT,
};
