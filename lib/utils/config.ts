import { load } from "$std/dotenv/mod.ts";

// Load .env file
const env_file = Deno.env.get("ENV") === "development"
  ? "./.env.development.local"
  : "./.env";

export const conf = await load({
  envPath: env_file,
  export: true,
});
