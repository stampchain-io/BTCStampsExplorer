import { conf } from "utils/config.ts";

export const frontendConfig = {
  API_BASE_URL: conf.API_BASE_URL,
  MINTING_SERVICE_FEE_ENABLED: conf.MINTING_SERVICE_FEE_ENABLED,
  MINTING_SERVICE_FEE: conf.MINTING_SERVICE_FEE_ENABLED
    ? conf.MINTING_SERVICE_FEE
    : null,
  MINTING_SERVICE_FEE_ADDRESS: conf.MINTING_SERVICE_FEE_ENABLED
    ? conf.MINTING_SERVICE_FEE_ADDRESS
    : null,
  // other frontend-safe only variables
};
