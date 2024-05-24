// api/v2/cursed/[id].ts
import { getStampByIdOrIdentifier } from "$lib/controller/sharedHandlers.ts";

export const handler = getStampByIdOrIdentifier;
