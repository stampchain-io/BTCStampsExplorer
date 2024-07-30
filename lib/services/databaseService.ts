import { releaseClient } from "$lib/database/index.ts";
import { Client } from "$mysql/mod.ts";
import { dbManager } from "$lib/database/db.ts";

export async function withDatabaseClient<T>(
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const client = await dbManager.getClient();
  if (!client) {
    throw new Error("Could not connect to database");
  }
  try {
    return await operation(client);
  } finally {
    dbManager.releaseClient(client);
  }
}
