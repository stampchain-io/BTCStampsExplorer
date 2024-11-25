import { createStampHandler } from "$handlers/sharedStampHandler.ts";

export const handler = createStampHandler({ type: "cursed", isIndex: false });
