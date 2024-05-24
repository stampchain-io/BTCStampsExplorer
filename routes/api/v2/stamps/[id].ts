// api/v2/stamps/[id].ts
import { getStampByIdOrIdentifier } from "$lib/controller/sharedHandlers.ts";

export const handler = getStampByIdOrIdentifier;
