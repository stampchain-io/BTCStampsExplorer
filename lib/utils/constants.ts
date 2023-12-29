export const BASE_URL = `${new URL(import.meta.url).origin}`;
export const API_BASE = `${BASE_URL}/api`;
export const LOGO_STAMPCHAIN = '/img/stampchain.png'
export const LOGO = LOGO_STAMPCHAIN
export const MAX_XCP_RETRIES = 5;
export const STAMP_TABLE = "StampTableV4";
export const SEND_TABLE = "sends";
export const BLOCK_TABLE = "blocks";
export const SRC20_TABLE = "SRC20Valid";
export const SRC20_BALANCE_TABLE = "balances";
export const TTL_CACHE = 1000 * 60 * 60 * 12;

export const WALLET_PROVIDERS = {
    unisat: {
        name: "unisat",
        logo:{
            full:"/img/unisat/logo_unisat_full_white.png",
            small:"/img/unisat/logo_unisat.png",
        },
    },
    leather: {
        name: "leather",
        logo:{
            full:"/img/leather/logo_leather.svg",
            small:"/img/leather/logo_leather.svg",
        },
    }
}