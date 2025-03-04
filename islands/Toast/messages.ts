export type WalletProvider =
  | "UNISAT"
  | "OKX"
  | "LEATHER"
  | "PHANTOM"
  | "TAPWALLET"
  | "DEFAULT";

export const MESSAGES = {
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
      SIGNING: {
        DEFAULT: "Failed to sign transaction",
        UNISAT: "UniSat Wallet failed to sign transaction",
        OKX: "OKX Wallet failed to sign transaction",
        LEATHER: "Leather Wallet failed to sign transaction",
        PHANTOM: "Phantom Wallet failed to sign transaction",
        TAPWALLET: "Tap Wallet failed to sign transaction",
      },
      NETWORK: {
        DEFAULT: "Network error occurred",
        WRONG_NETWORK: "Please switch to the correct network",
      },
    },
    TRANSACTION: {
      SUCCESS: {
        BROADCAST: "Transaction broadcasted successfully",
        SIGNED: "Transaction signed successfully",
        WITH_TXID: (txid: string) =>
          `Transaction broadcasted successfully. (TXID: ${txid})`,
      },
      ERROR: {
        CANCELLED: "Transaction signing cancelled by user",
        SIGNING: (error: string) => `Transaction signing failed: ${error}`,
        INSUFFICIENT_FUNDS: "Insufficient funds for transaction",
        NETWORK_FEE: "Network fee too low",
      },
      PENDING: {
        BROADCAST: "Broadcasting transaction...",
        SIGNING: "Waiting for signature...",
      },
    },
  },

  STAMP: {
    CREATION: {
      SUCCESS: {
        UPLOAD: "Stamp image uploaded successfully",
        MINT: "Stamp minted successfully",
      },
      ERROR: {
        IMAGE_SIZE: "Image must be exactly 420x420 pixels",
        IMAGE_FORMAT: "Invalid image file format",
        UPLOAD: "Failed to upload stamp image",
        MINT: "Failed to mint stamp",
      },
    },
    TRANSFER: {
      SUCCESS: "Stamp transferred successfully",
      ERROR: "Failed to transfer stamp",
      PENDING: "Processing stamp transfer...",
    },
  },

  SRC20: {
    DEPLOY: {
      SUCCESS: "Token deployed successfully",
      ERROR: {
        TICK_EXISTS: "Token tick already exists",
        INVALID_PARAMS: "Invalid deployment parameters",
      },
      VALIDATION: {
        TICK: "Tick is required",
        MAX_SUPPLY: "Max supply is required",
        LIMIT_PER_MINT: "Limit per mint is required",
        DECIMALS: "Decimals must be between 0 and 18",
      },
    },
    MINT: {
      SUCCESS: "Token minted successfully",
      ERROR: {
        LIMIT_EXCEEDED: "Mint limit exceeded",
        NOT_ACTIVE: "Minting not active for this token",
      },
      PENDING: "Processing mint transaction...",
    },
    TRANSFER: {
      SUCCESS: "Token transferred successfully",
      ERROR: {
        BALANCE_FETCH: "Failed to fetch token balances",
        INSUFFICIENT_BALANCE: "Insufficient token balance",
        INVALID_AMOUNT: "Invalid transfer amount",
      },
      PENDING: "Processing token transfer...",
    },
  },

  SRC101: {
    MINT: {
      SUCCESS: "SRC-101 token minted successfully",
      ERROR: "Failed to mint SRC-101 token",
      PENDING: "Processing SRC-101 mint...",
    },
  },
} as const;

// Type definitions
export type MessageKey = keyof typeof MESSAGES;
export type WalletKey = keyof typeof MESSAGES.WALLET;
export type StampKey = keyof typeof MESSAGES.STAMP;
export type SRC20Key = keyof typeof MESSAGES.SRC20;
export type SRC101Key = keyof typeof MESSAGES.SRC101;

// Helper type for message parameters
export type MessageParams = {
  txid?: string;
  error?: string;
  provider?: WalletProvider;
};
