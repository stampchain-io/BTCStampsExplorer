import { createStampHandler } from "$handlers/sharedStampHandler.ts";
export const handler = createStampHandler({ type: "stamps", isIndex: false });
