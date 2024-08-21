import { FreshContext } from "$fresh/server.ts";
import { conf } from "utils/config.ts";
// Frontend safe VARS
export const handler = (_req: Request, _ctx: FreshContext): Response => {
  const frontendConfig = {
    API_BASE_URL: conf.API_BASE_URL,
    MINTING_SERVICE_FEE_ENABLED: conf.MINTING_SERVICE_FEE_ENABLED === "true",
    MINTING_SERVICE_FEE: conf.MINTING_SERVICE_FEE_ENABLED === "true"
      ? conf.MINTING_SERVICE_FEE
      : null,
    MINTING_SERVICE_FEE_ADDRESS: conf.MINTING_SERVICE_FEE_ENABLED === "true"
      ? conf.MINTING_SERVICE_FEE_ADDRESS
      : null,
  };

  return new Response(JSON.stringify(frontendConfig), {
    headers: { "Content-Type": "application/json" },
  });
};
