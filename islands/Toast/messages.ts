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
      CONNECTION: {
        DEFAULT: "Wallet connected successfully",
        UNISAT: "UniSat Wallet connected successfully",
        OKX: "OKX Wallet connected successfully",
        LEATHER: "Leather Wallet connected successfully",
        PHANTOM: "Phantom Wallet connected successfully",
        TAPWALLET: "Tap Wallet connected successfully",
      },
      TRANSACTION: {
        BROADCAST: "Transaction has been broadcasted",
        SIGNED: "Transaction has been signed successfully",
        BROADCAST_TXID: (txid: string) =>
          `Transaction has been broadcasted - (TXID: ${txid})`,
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
      TRANSACTION: {
        REJECTED: "Transaction rejected by user",
        CANCELLED: "Transaction signing cancelled by user",
        SIGNING: (error: string) => `Failed to sign transaction - ${error}`,
        INSUFFICIENT_FUNDS: "Insufficient funds for transaction",
        FEE: "Transaction fee is too low",
        BROADCAST: "Broadcasting transaction...",
        SIGNATURE: "Waiting for signature...",
        NETWORK_ERROR: "Network error occurred",
        WRONG_NETWORK: "Please switch to the correct network",
      },
    },
  },

  GENERAL: {
    SUCCESS: {
      UPLOAD: "Image uploaded successfully",
    },
    ERROR: {
      SOURCE_ADDRESS: "A source address is required",
      RECIPIENT_ADDRESS: "A recipient address is required",
      AMOUNT: "An amount is required",
      FEE: "A fee must be set",
      BALANCE: "Insufficient balance",
      URL: "The website URL is invalid",
      EMAIL: "The email address is invalid",
      USERNAME_VALID: "The username is not valid",
      USERNAME_EXISTS: "The username is already taken",
      IMAGE_FORMAT: "Invalid image file format",
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
        UPLOAD: "Failed to upload stamp image",
        MINT: "Failed to mint stamp",
      },
      PENDING: "Processing your stamp...",
    },

    TRANSFER: {
      SUCCESS: "Stamp transferred successfully",
      ERROR: "Failed to transfer stamp",
      PENDING: "Processing stamp transfer...",
    },
  },

  SRC20: {
    DEPLOY: {
      SUCCESS: "Your token has been deployed successfully",
      ERROR: {
        TICK_EXISTS: "Token ticker already exists",
        INVALID_PARAMS: "Invalid deployment parameters",
        TICK: "Tick is required",
        MAX_SUPPLY: "Max supply is required",
        LIMIT_PER_MINT: "Limit per mint is required",
        DECIMALS: "Decimals must be between 0 and 18",
      },
      PENDING: "Processing your token deployment...",
    },

    MINT: {
      SUCCESS: "Your token has been minted successfully",
      ERROR: {
        LIMIT_EXCEEDED: "Mint limit exceeded",
        NOT_ACTIVE: "Minting not active for this token",
      },
      PENDING: "Processing your token mint...",
    },

    TRANSFER: {
      SUCCESS: "Token transferred successfully",
      ERROR: {
        TICK: "A token ticker is required",
        BALANCE_FETCH: "Failed to fetch token balances",
        INSUFFICIENT_BALANCE: "Insufficient token balance",
        INVALID_AMOUNT: "Invalid transfer amount",
      },
      PENDING: "Processing your token transfer...",
    },
  },

  SRC101: {
    MINT: {
      SUCCESS: "Your bitname has been registered successfully",
      ERROR: "Failed to register bitname",
      PENDING: "Processing your bitname registration...",
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
