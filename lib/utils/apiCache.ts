import { dbManager } from "$lib/database/db.ts";
import { CreatePayload, handleXcpQuery } from "utils/xcpUtils.ts";
import { XCPParams } from "globals";

export async function handleApiRequestWithCache(
  method: string,
  params: XCPParams,
  cacheDuration: number | "never",
) {
  const cacheKey = `api:${method}:${JSON.stringify(params)}`;

  return await dbManager.handleCache(
    cacheKey,
    async () => {
      const payload = CreatePayload(method, params);
      return await handleXcpQuery(payload);
    },
    cacheDuration,
  );
}
