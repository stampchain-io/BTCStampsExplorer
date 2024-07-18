// api/v2/cursed/[id].ts
import { getStampByIdOrIdentifier } from "$lib/services/stampService.ts";

export const handler = getStampByIdOrIdentifier;
