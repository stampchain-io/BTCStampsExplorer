import { loadSync } from "@std/dotenv";

const currentDir = Deno.cwd();
const envFilePath = `${currentDir}/.env`;

loadSync({
  envPath: envFilePath,
  export: true,
});

// Set ENV to 'development' if not already set
if (!Deno.env.get("ENV")) {
  Deno.env.set("ENV", "development");
}

// Optional: Log environment variables for debugging
console.log("ENV value (from env.ts):", Deno.env.get("ENV"));