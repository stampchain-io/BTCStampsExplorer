import { load } from "$std/dotenv/mod.ts";

// Load .env file
const env_file = Deno.env.get("ENV") === "development"
  ? "./.env.development.local"
  : "./.env";

const confFromFile = await load({
  envPath: env_file,
  export: true,
});

const envVars = Deno.env.toObject();

export const conf = { ...envVars, ...confFromFile };
