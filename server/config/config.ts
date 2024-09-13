import { load } from "$std/dotenv/mod.ts";

// Check if we're in a Deno environment
const isDeno = typeof Deno !== "undefined";

let serverConfig: ServerConfig;

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
    ...envVars,
    ...confFromFile,
    APP_ROOT: Deno.cwd(),
  };
} else {
  // Provide a dummy config for the client-side
  serverConfig = {
    APP_ROOT: "",
  };
}

// Define an interface for the server config
interface ServerConfig {
  APP_ROOT: string;
  IMAGES_SRC_PATH?: string;
  API_BASE_URL?: string;
  MINTING_SERVICE_FEE?: string;
  MINTING_SERVICE_FEE_ADDRESS?: string;
  CSRF_SECRET_KEY?: string;
  [key: string]: string | undefined;
}

export { serverConfig };

// Add a function to get client-safe config
export function getClientConfig() {
  return {
    API_BASE_URL: serverConfig.API_BASE_URL,
    MINTING_SERVICE_FEE: serverConfig.MINTING_SERVICE_FEE,
    MINTING_SERVICE_FEE_ADDRESS: serverConfig.MINTING_SERVICE_FEE_ADDRESS,
    // Add other client-safe config variables here
  };
}