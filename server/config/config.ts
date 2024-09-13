import { load } from "$std/dotenv/mod.ts";

interface ServerConfig {
  APP_ROOT: string;
  IMAGES_SRC_PATH?: string;
  API_BASE_URL?: string;
  MINTING_SERVICE_FEE?: string;
  MINTING_SERVICE_FEE_ADDRESS?: string;
  CSRF_SECRET_KEY?: string;
  MINTING_SERVICE_FEE_ENABLED: string;
  MINTING_SERVICE_FEE_FIXED_SATS: string;
  [key: string]: string | undefined;
}

// Initialize serverConfig with default values
let serverConfig: ServerConfig = {
  APP_ROOT: "",
  MINTING_SERVICE_FEE_ENABLED: "0",
  MINTING_SERVICE_FEE_FIXED_SATS: "0",
};

const isDeno = typeof Deno !== "undefined";

if (isDeno) {
  const env_file = Deno.env.get("ENV") === "development"
    ? "./.env.development.local"
    : "./.env";

  const confFromFile = await load({
    envPath: env_file,
    export: true,
  });

  const envVars = Deno.env.toObject();

  serverConfig = {
    ...serverConfig,
    ...envVars,
    ...confFromFile,
    APP_ROOT: Deno.cwd(),
  };
}

export { serverConfig };

export function getClientConfig() {
  return {
    API_BASE_URL: serverConfig.API_BASE_URL,
    MINTING_SERVICE_FEE: serverConfig.MINTING_SERVICE_FEE,
    MINTING_SERVICE_FEE_ADDRESS: serverConfig.MINTING_SERVICE_FEE_ADDRESS,
    // Add other client-safe config variables here
  };
}