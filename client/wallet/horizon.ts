// Horizon Wallet Integration for BTCStampsExplorer
// Based on API discovery from testing - supports 6 methods:
// getAddresses, signPsbt, signMessage, fairmint, dispense, openOrder

import type { HorizonAddress, HorizonWalletAPI } from "$lib/types/wallet.d.ts";
import { getBTCBalanceInfo } from "$lib/utils/balanceUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import type { BaseToast } from "$lib/utils/toastSignal.ts";
import { SignPSBTResult, Wallet } from "$types/index.d.ts";
import { getGlobalWallets, walletContext } from "./wallet.ts";

// Helper function to get Horizon provider safely
const getHorizonProvider = (): HorizonWalletAPI | undefined => {
  const wallets = getGlobalWallets();
  return wallets.HorizonWalletProvider as HorizonWalletAPI | undefined;
};

// Connection function for Horizon wallet
export const connectHorizon = async (
  addToast: (message: string, type: BaseToast["type"]) => void,
) => {
  try {
    const wallet = new HorizonWallet();
    if (!wallet.isInstalled()) {
      logger.warn("ui", {
        message: "Horizon wallet not detected",
      });
      addToast(
        "Horizon wallet not detected. Please install the Horizon extension.",
        "error",
      );
      return;
    }

    logger.debug("ui", {
      message: "Connecting to Horizon wallet",
    });

    const addresses = await wallet.getAddresses();

    if (!addresses || addresses.length === 0) {
      throw new Error("No addresses received from Horizon wallet");
    }

    await handleConnect(addresses);
    logger.info("ui", {
      message: "Successfully connected to Horizon wallet",
    });
    addToast("Successfully connected to Horizon wallet", "success");
  } catch (error) {
    logger.error("ui", {
      message: "Error connecting to Horizon wallet",
      error: error instanceof Error ? error.message : String(error),
      details: error,
    });
    addToast(
      `Failed to connect to Horizon wallet: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
    );
  }
};

const handleConnect = async (addresses: HorizonAddress[]) => {
  if (!addresses || addresses.length === 0) {
    throw new Error("No addresses received from Horizon wallet");
  }

  // Use the first available address (Horizon provides addresses with types and public keys)
  const primaryAddress = addresses[0];

  console.log(`Using Horizon address type: ${primaryAddress.type}`);

  const wallet = {} as Wallet;
  wallet.address = primaryAddress.address;
  wallet.accounts = [primaryAddress.address];
  wallet.publicKey = primaryAddress.publicKey;

  // Map Horizon address types to supported wallet address types
  // Only p2wpkh and p2tr are supported by the Wallet interface
  if (primaryAddress.type === "p2wpkh" || primaryAddress.type === "p2tr") {
    wallet.addressType = primaryAddress.type;
  } else {
    // Default to p2wpkh for other types (p2sh, p2pkh)
    wallet.addressType = "p2wpkh";
    console.log(
      `Horizon address type ${primaryAddress.type} mapped to p2wpkh for compatibility`,
    );
  }

  const addressInfo = await getBTCBalanceInfo(primaryAddress.address);

  wallet.btcBalance = {
    confirmed: addressInfo?.balance ?? 0,
    unconfirmed: addressInfo?.unconfirmedBalance ?? 0,
    total: (addressInfo?.balance ?? 0) + (addressInfo?.unconfirmedBalance ?? 0),
  };

  wallet.network = "mainnet";
  wallet.provider = "horizon";

  walletContext.updateWallet(wallet);
};

export class HorizonWallet {
  readonly name = "Horizon";
  readonly icon =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwN2FmZiIvPgo8cGF0aCBkPSJNOCAxNkgyNE04IDE2TDE2IDhNOCAxNkwxNiAyNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+"; // Placeholder icon
  private provider: HorizonWalletAPI | undefined;

  constructor() {
    // Use the safe provider getter instead of direct window access
    this.provider = getHorizonProvider();
  }

  /**
   * Check if Horizon Wallet is installed
   */
  isInstalled(): boolean {
    return !!getHorizonProvider();
  }

  /**
   * Connect to Horizon Wallet and get addresses
   * Note: Horizon doesn't have a separate "connect" method - getAddresses serves as connection
   */
  async connect(): Promise<string[]> {
    if (!this.provider) {
      throw new Error("Horizon Wallet not installed");
    }

    try {
      const response = await this.provider.request("getAddresses", {});

      if (response.addresses && Array.isArray(response.addresses)) {
        return response.addresses.map((addr: HorizonAddress) => addr.address);
      }

      throw new Error("Invalid response format from Horizon Wallet");
    } catch (error: any) {
      if (error.error && typeof error.error === "string") {
        throw new Error(error.error);
      }
      throw error;
    }
  }

  /**
   * Get wallet addresses with detailed information
   */
  async getAddresses(): Promise<HorizonAddress[]> {
    if (!this.provider) {
      throw new Error("Horizon Wallet not installed");
    }

    try {
      const response = await this.provider.request("getAddresses", {});

      // Based on our discovery, the response should have an addresses array directly
      // Example: { "id": "...", "addresses": [...] }
      if (response && response.addresses && Array.isArray(response.addresses)) {
        return response.addresses;
      }

      // Check if response has a result property (like some other wallets)
      if (
        response && response.result && response.result.addresses &&
        Array.isArray(response.result.addresses)
      ) {
        return response.result.addresses;
      }

      // Check if the response itself is an array of addresses
      if (Array.isArray(response)) {
        return response;
      }

      logger.error("ui", {
        message: "Unexpected Horizon response format",
        data: {
          response,
          type: typeof response,
          keys: response ? Object.keys(response) : [],
          hasAddresses: response && "addresses" in response,
          hasResult: response && "result" in response,
        },
      });

      throw new Error(
        `Invalid response format from Horizon Wallet. Expected addresses array. Got: ${
          JSON.stringify(response, null, 2)
        }`,
      );
    } catch (error: any) {
      if (error.error && typeof error.error === "string") {
        throw new Error(error.error);
      }
      throw error;
    }
  }

  /**
   * Get primary wallet address
   */
  async getAddress(): Promise<string> {
    const addresses = await this.getAddresses();

    if (addresses.length === 0) {
      throw new Error("No addresses available");
    }

    return addresses[0].address;
  }

  /**
   * Get public key for an address
   */
  async getPublicKey(address?: string): Promise<string> {
    const addresses = await this.getAddresses();

    if (address) {
      const found = addresses.find((addr) => addr.address === address);
      if (!found) {
        throw new Error(`Address ${address} not found in wallet`);
      }
      return found.publicKey;
    }

    if (addresses.length === 0) {
      throw new Error("No addresses available");
    }

    return addresses[0].publicKey;
  }

  /**
   * Sign a message with the specified address
   */
  async signMessage(message: string, address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Horizon Wallet not installed");
    }

    const signAddress = address || await this.getAddress();

    try {
      const response = await this.provider.request("signMessage", {
        message,
        address: signAddress,
      });

      return response.signature || response;
    } catch (error: any) {
      if (error.error && typeof error.error === "string") {
        throw new Error(error.error);
      }
      throw error;
    }
  }

  /**
   * Sign a PSBT (Partially Signed Bitcoin Transaction)
   */
  async signPsbt(
    psbtHex: string,
    options?: {
      autoFinalize?: boolean;
      signInputs?: Record<string, number[]>;
    },
  ): Promise<string> {
    if (!this.provider) {
      throw new Error("Horizon Wallet not installed");
    }

    let signInputs = options?.signInputs;

    // If no signInputs provided, try to sign with primary address for all inputs
    if (!signInputs) {
      const primaryAddress = await this.getAddress();
      signInputs = { [primaryAddress]: [0] }; // Default to signing first input
    }

    try {
      const response = await this.provider.request("signPsbt", {
        hex: psbtHex,
        signInputs,
      });

      return response.hex || response.signedPsbt || response;
    } catch (error: any) {
      if (error.error && typeof error.error === "string") {
        throw new Error(error.error);
      }
      throw error;
    }
  }

  /**
   * Horizon-specific: Execute a fairmint operation
   */
  async fairmint(params: any): Promise<any> {
    if (!this.provider) {
      throw new Error("Horizon Wallet not installed");
    }

    try {
      return await this.provider.request("fairmint", params);
    } catch (error: any) {
      if (error.error && typeof error.error === "string") {
        throw new Error(error.error);
      }
      throw error;
    }
  }

  /**
   * Horizon-specific: Execute a dispense operation
   */
  async dispense(params: any): Promise<any> {
    if (!this.provider) {
      throw new Error("Horizon Wallet not installed");
    }

    try {
      return await this.provider.request("dispense", params);
    } catch (error: any) {
      if (error.error && typeof error.error === "string") {
        throw new Error(error.error);
      }
      throw error;
    }
  }

  /**
   * Horizon-specific: Execute an openOrder operation
   */
  async openOrder(params: any): Promise<any> {
    if (!this.provider) {
      throw new Error("Horizon Wallet not installed");
    }

    try {
      return await this.provider.request("openOrder", params);
    } catch (error: any) {
      if (error.error && typeof error.error === "string") {
        throw new Error(error.error);
      }
      throw error;
    }
  }

  /**
   * Get wallet network (Bitcoin mainnet assumed)
   */
  getNetwork(): Promise<string> {
    return Promise.resolve("mainnet"); // Horizon Wallet appears to be mainnet-focused
  }

  /**
   * Get wallet balance (not directly supported by Horizon API)
   */
  getBalance(): Promise<
    { confirmed: number; unconfirmed: number; total: number }
  > {
    return Promise.reject(
      new Error(
        "getBalance not supported by Horizon Wallet - use external API",
      ),
    );
  }

  /**
   * Send Bitcoin (not directly supported - use PSBT signing instead)
   */
  sendBitcoin(_to: string, _amount: number): Promise<string> {
    return Promise.reject(
      new Error(
        "sendBitcoin not directly supported - use PSBT signing workflow instead",
      ),
    );
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<void> {
    // Horizon doesn't have a disconnect method
    // Clear any local state if needed
  }

  /**
   * Check if wallet is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const addresses = await this.getAddresses();
      return addresses.length > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const horizonWallet = new HorizonWallet();

// Helper function to detect Horizon Wallet
export const detectHorizonWallet = (): boolean => {
  return !!getHorizonProvider();
};

// Horizon Wallet Provider Implementation - Compatible with WalletProvider interface
export const horizonProvider = {
  connectHorizon,
  signMessage: async (message: string): Promise<string> => {
    const wallet = new HorizonWallet();
    if (!wallet.isInstalled()) {
      throw new Error("Horizon Wallet not installed");
    }

    try {
      return await wallet.signMessage(message);
    } catch (error: any) {
      logger.error("ui", {
        message: "Error in Horizon signMessage",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  signPSBT: async (
    psbtHex: string,
    inputsToSign: { index: number }[],
    enableRBF = true,
    _sighashTypes?: number[], // Prefixed with _ to indicate intentionally unused
    autoBroadcast = true,
  ): Promise<SignPSBTResult> => {
    const wallet = new HorizonWallet();
    if (!wallet.isInstalled()) {
      return { signed: false, error: "Horizon Wallet not installed" };
    }

    try {
      logger.debug("ui", {
        message: "Signing PSBT with Horizon",
        data: {
          psbtHexLength: psbtHex.length,
          inputsToSign,
          enableRBF,
          autoBroadcast,
        },
      });

      // Get the primary address for signing
      const primaryAddress = await wallet.getAddress();

      // Create signInputs mapping for Horizon's format
      const signInputs: Record<string, number[]> = {};
      signInputs[primaryAddress] = inputsToSign.map((input) => input.index);

      const signedPsbtHex = await wallet.signPsbt(psbtHex, {
        autoFinalize: true,
        signInputs,
      });

      logger.debug("ui", {
        message: "Horizon signPsbt result",
        data: { signedPsbtHex: signedPsbtHex ? "present" : "missing" },
      });

      if (!signedPsbtHex) {
        return { signed: false, error: "No result from Horizon Wallet" };
      }

      // Horizon wallet doesn't support auto-broadcast, so we return the signed PSBT
      // The application will handle broadcasting through its own infrastructure
      if (autoBroadcast) {
        return {
          signed: true,
          psbt: signedPsbtHex,
          error:
            "Auto-broadcast not supported by Horizon - PSBT signed successfully",
        };
      } else {
        return {
          signed: true,
          psbt: signedPsbtHex,
        };
      }
    } catch (error: any) {
      logger.error("ui", {
        message: "Error in Horizon signPSBT",
        error: error instanceof Error ? error.message : String(error),
      });

      // Handle user cancellation or other specific errors
      if (
        error.message?.includes("cancelled") ||
        error.message?.includes("rejected")
      ) {
        return { signed: false, cancelled: true };
      }

      return {
        signed: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  broadcastRawTX: (_rawTx: string): Promise<string> => {
    return Promise.reject(
      new Error(
        "broadcastRawTX not supported by Horizon Wallet - use external broadcast service",
      ),
    );
  },

  broadcastPSBT: (_psbtHex: string): Promise<string> => {
    return Promise.reject(
      new Error(
        "broadcastPSBT not supported by Horizon Wallet - use external broadcast service",
      ),
    );
  },
};
