export const LOGO_STAMPCHAIN = "/img/stampchain.png";
export const LOGO = LOGO_STAMPCHAIN;
export const MAX_XCP_RETRIES = 5;
export const STAMP_TABLE = "StampTableV4";
export const BLOCK_TABLE = "blocks";
export const SRC20_TABLE = "SRC20Valid";
export const SRC20_BALANCE_TABLE = "balances";
export const DEFAULT_CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours

export const BIG_LIMIT = 200;
export const SMALL_LIMIT = 50;

export type WalletProviderKey =
  | "unisat"
  | "leather"
  | "okx"
  | "tapwallet"
  | "phantom";

export const WALLET_PROVIDERS: Record<
  WalletProviderKey,
  { name: string; logo: { full: string; small: string } }
> = {
  unisat: {
    name: "Unisat",
    logo: {
      full: "/img/unisat/logo_unisat_full_white.png",
      small: "/img/unisat/logo_unisat.png",
    },
  },
  leather: {
    name: "Leather",
    logo: {
      full: "/img/leather/logo_leather.svg",
      small: "/img/leather/logo_leather.svg",
    },
  },
  okx: {
    name: "OKX",
    logo: {
      full: "/img/okx/logo_okx.svg",
      small: "/img/okx/logo_okx.svg",
    },
  },
  tapwallet: {
    name: "TapWallet",
    logo: {
      small: "/img/tapwallet/logo_tapwallet.png",
      full: "/img/tapwallet/logo_tapwallet.png",
    },
  },
  phantom: {
    name: "Phantom",
    logo: {
      full: "/img/phantom/logo_phantom.svg",
      small: "/img/phantom/logo_phantom.svg",
    },
  },
};
