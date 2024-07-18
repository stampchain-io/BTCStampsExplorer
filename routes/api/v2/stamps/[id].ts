// api/v2/stamps/[id].ts
import { getStampByIdOrIdentifier } from "$lib/services/stampService.ts";

export const handler = getStampByIdOrIdentifier;
