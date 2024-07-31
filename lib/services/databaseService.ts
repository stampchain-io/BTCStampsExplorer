import { Client } from "$mysql/mod.ts";
import { dbManager } from "$lib/database/db.ts";

export async function withDatabaseClient<T>( // FIXME: remove calls to this and go directly to the dbManager
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
