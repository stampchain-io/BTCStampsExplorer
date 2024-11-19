import "$/server/config/env.ts";

type ServerConfig = {
  readonly APP_ROOT: string;
  readonly IMAGES_SRC_PATH?: string;
  readonly API_BASE_URL?: string;
  readonly MINTING_SERVICE_FEE?: string;
  readonly MINTING_SERVICE_FEE_ADDRESS?: string;
  readonly CSRF_SECRET_KEY?: string;
  readonly MINTING_SERVICE_FEE_ENABLED: string;
  readonly MINTING_SERVICE_FEE_FIXED_SATS: string;
  readonly OPENSTAMP_API_KEY: string;
  readonly API_KEY?: string;
  readonly QUICKNODE_ENDPOINT?: string;
  readonly QUICKNODE_API_KEY?: string;
  readonly DEBUG_NAMESPACES: string;
  readonly IS_DEBUG_ENABLED: boolean;
  [key: string]: string | undefined;
};

const serverConfig: ServerConfig = {
  APP_ROOT: Deno.cwd(),
  MINTING_SERVICE_FEE_ENABLED: "0",
  MINTING_SERVICE_FEE_FIXED_SATS: "0",

  get IMAGES_SRC_PATH() {
    return Deno.env.get("IMAGES_SRC_PATH");
  },
  get API_BASE_URL() {
    return Deno.env.get("API_BASE_URL");
  },
  get MINTING_SERVICE_FEE() {
    return Deno.env.get("MINTING_SERVICE_FEE");
  },
  get MINTING_SERVICE_FEE_ADDRESS() {
    return Deno.env.get("MINTING_SERVICE_FEE_ADDRESS");
  },
  get CSRF_SECRET_KEY() {
    return Deno.env.get("CSRF_SECRET_KEY");
  },
  get OPENSTAMP_API_KEY() {
    return Deno.env.get("OPENSTAMP_API_KEY") || "";
  },
  get API_KEY() {
    return Deno.env.get("API_KEY");
  },
  get QUICKNODE_ENDPOINT() {
    return Deno.env.get("QUICKNODE_ENDPOINT");
  },
  get QUICKNODE_API_KEY() {
    return Deno.env.get("QUICKNODE_API_KEY");
  },
  get DEBUG_NAMESPACES() {
    return Deno.env.get("DEBUG") || "";
  },
  get IS_DEBUG_ENABLED() {
    return !!Deno.env.get("DEBUG");
  },
};

export { serverConfig };

export function getClientConfig() {
  return {
    API_BASE_URL: serverConfig.API_BASE_URL,
    MINTING_SERVICE_FEE: serverConfig.MINTING_SERVICE_FEE,
    MINTING_SERVICE_FEE_ADDRESS: serverConfig.MINTING_SERVICE_FEE_ADDRESS,
    DEBUG_NAMESPACES: serverConfig.DEBUG_NAMESPACES,
    IS_DEBUG_ENABLED: serverConfig.IS_DEBUG_ENABLED,
  };
}