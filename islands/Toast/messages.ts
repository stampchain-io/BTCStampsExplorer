export type WalletProvider =
  | "UNISAT"
  | "OKX"
  | "LEATHER"
  | "PHANTOM"
  | "TAPWALLET"
  | "DEFAULT";

export const MESSAGES = {
  TRANSACTION: {
    SUCCESS: {
      BROADCAST: "Transaction broadcasted successfully.",
      SIGNED: "Transaction signed successfully.",
      WITH_TXID: (txid: string) =>
        `Transaction broadcasted successfully. (TXID: ${txid})`,
    },
    ERROR: {
      CANCELLED: "Transaction signing cancelled by user.",
      SIGNING: (error: string) => `Transaction signing failed: ${error}`,
      UNEXPECTED: "An unexpected error occurred",
    },
  },
  VALIDATION: {
    REQUIRED: {
      TICK: "Tick is required",
      SOURCE_ADDRESS: "Source address is required",
      RECIPIENT_ADDRESS: "Recipient address is required",
      MAX_SUPPLY: "Max supply is required for deploy",
      LIMIT_PER_MINT: "Limit per mint is required for deploy",
      DECIMALS: "Decimals is required for deploy",
      AMOUNT: "Amount is required",
      FEE: "Fee must be set",
    },
    INVALID: {
      USERNAME: "Invalid x username",
      URL: "Invalid website URL",
      EMAIL: "Invalid email address",
      ADDRESS: "Invalid or missing recipient address",
      BALANCE: "Insufficient balance",
    },
  },
  WALLET: {
    SUCCESS: {
      CONNECTED: {
        DEFAULT: "Wallet connected successfully",
        UNISAT: "UniSat Wallet connected successfully",
        OKX: "OKX Wallet connected successfully",
        LEATHER: "Leather Wallet connected successfully",
        PHANTOM: "Phantom Wallet connected successfully",
        TAPWALLET: "Tap Wallet connected successfully",
      },
      SIGNED: {
        DEFAULT: "Transaction signed successfully",
        UNISAT: "Transaction signed with UniSat Wallet",
        OKX: "Transaction signed with OKX Wallet",
        LEATHER: "Transaction signed with Leather Wallet",
        PHANTOM: "Transaction signed with Phantom Wallet",
        TAPWALLET: "Transaction signed with Tap Wallet",
      },
    },
    ERROR: {
      CONNECTION: {
        DEFAULT: "Failed to connect wallet",
        UNISAT: "Failed to connect UniSat Wallet",
        OKX: "Failed to connect OKX Wallet",
        LEATHER: "Failed to connect Leather Wallet",
        PHANTOM: "Failed to connect Phantom Wallet",
        TAPWALLET: "Failed to connect Tap Wallet",
      },
      SIGNING: {
        DEFAULT: "Failed to sign transaction",
        UNISAT: "UniSat Wallet failed to sign transaction",
        OKX: "OKX Wallet failed to sign transaction",
        LEATHER: "Leather Wallet failed to sign transaction",
        PHANTOM: "Phantom Wallet failed to sign transaction",
        TAPWALLET: "Tap Wallet failed to sign transaction",
      },
      NOT_INSTALLED: {
        UNISAT: "UniSat Wallet not installed",
        OKX: "OKX Wallet not installed",
        LEATHER: "Leather Wallet not installed",
        PHANTOM: "Phantom Wallet not installed",
        TAPWALLET: "Tap Wallet not installed",
      },
      REJECTED: {
        DEFAULT: "Transaction rejected by user",
        UNISAT: "Transaction rejected in UniSat Wallet",
        OKX: "Transaction rejected in OKX Wallet",
        LEATHER: "Transaction rejected in Leather Wallet",
        PHANTOM: "Transaction rejected in Phantom Wallet",
        TAPWALLET: "Transaction rejected in Tap Wallet",
      },
      NETWORK: {
        DEFAULT: "Network error occurred",
        WRONG_NETWORK: "Please switch to the correct network",
      },
      UNEXPECTED: {
        DEFAULT: "An unexpected error occurred",
      },
    },
  },
} as const;

// Type definitions for type safety
export type MessageKey = keyof typeof MESSAGES;
export type TransactionKey = keyof typeof MESSAGES.TRANSACTION;
export type ValidationKey = keyof typeof MESSAGES.VALIDATION;
export type WalletKey = keyof typeof MESSAGES.WALLET;
