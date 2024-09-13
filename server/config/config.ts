import { load } from "$std/dotenv/mod.ts";

const env_file = Deno.env.get("ENV") === "development"
  ? "./.env.development.local"
  : "./.env";

const confFromFile = await load({
  envPath: env_file,
  export: true,
});

const envVars = Deno.env.toObject();

export const serverConfig = {
  ...envVars,
  ...confFromFile,
};

// Add a function to get client-safe config
export function getClientConfig() {
  return {
    API_BASE_URL: serverConfig.API_BASE_URL,
    MINTING_SERVICE_FEE: serverConfig.MINTING_SERVICE_FEE,
    MINTING_SERVICE_FEE_ADDRESS: serverConfig.MINTING_SERVICE_FEE_ADDRESS,
    // Add other client-safe config variables here
  };
}