/**
 * Stamp Route Pages
 * =================
 * 
 * Overview
 * --------
 * The index.tsx contains the Stamp Overiew page
 * The [id].tsx contains the Stamp Details page
 * The trade.tsx file is moved to /routes/tools/stamp/
 *  - it is neither finetuned nor styled
 * art.tsx and posh.tsx are redirect files 
 * 
 * TODO(@reinamora) - 
 * The two redirects could probably be handled by the middleware system ? 
 *
 *
 * Barrel files
 * ------------
 * The barrel file for exporting all stamp-related islands components is located in:
 * /islands/stamp/index.ts
 * All stamp related files can be imported using:
 * import { StampXxxx, StampYyyy } from "$stamp";
 *
 */