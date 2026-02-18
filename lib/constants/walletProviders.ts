/* ===== WALLET PROVIDER CONSTANTS ===== */

/**
 * Supported wallet provider keys for Bitcoin wallet connections
 */
export type WalletProviderKey =
  | "unisat"
  | "leather"
  | "okx"
  | "tapwallet"
  | "phantom"
  | "horizon"
  | "xverse";

/**
 * Default wallet connectors available in the application
 */
export const DEFAULT_WALLET_CONNECTORS: WalletProviderKey[] = [
  "unisat",
  "leather",
  "okx",
  "tapwallet",
  "phantom",
  "horizon",
  "xverse",
];

/**
 * Wallet provider capability identifiers
 */
export type WalletCapability =
  | "p2tr"
  | "p2wpkh"
  | "p2sh"
  | "p2pkh"
  | "psbt"
  | "message-signing"
  | "send-btc"
  | "ordinals";

/**
 * Wallet provider address type identifiers
 */
export type WalletAddressType = "payment" | "ordinals" | "stacks";

/**
 * Wallet provider configuration entry
 */
export interface WalletProviderConfig {
  name: string;
  displayName?: string;
  logo: string;
  logoPng?: string;
  capabilities?: WalletCapability[];
  addressTypes?: WalletAddressType[];
}

/**
 * Wallet provider configuration with display names and logo paths
 */
export const WALLET_PROVIDERS: Record<WalletProviderKey, WalletProviderConfig> =
  {
    unisat: {
      name: "Unisat",
      logo: "/img/wallet/unisat/logo_unisat.png",
    },
    leather: {
      name: "Leather",
      logo: "/img/wallet/leather/logo_leather.svg",
    },
    okx: {
      name: "OKX",
      logo: "/img/wallet/okx/logo_okx.svg",
    },
    tapwallet: {
      name: "Universe",
      logo: "/img/wallet/tapwallet/logo_tapwallet.png",
    },
    phantom: {
      name: "Phantom",
      logo: "/img/wallet/phantom/logo_phantom.svg",
    },
    horizon: {
      name: "Horizon",
      logo: "/img/wallet/horizon/logo_horizon.png",
    },
    xverse: {
      name: "Xverse",
      logo: "/img/wallet/xverse/logo_xverse.svg",
      logoPng: "/img/wallet/xverse/logo_xverse.png",
      capabilities: ["p2tr", "p2wpkh", "psbt", "message-signing", "send-btc"],
      addressTypes: ["payment", "ordinals"],
    },
  };
