import { getClient, releaseClient } from "$lib/database/index.ts";
import { Client } from "$mysql/mod.ts";

export async function withDatabaseClient<T>(
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  if (!client) {
    throw new Error("Could not connect to database");
  }
  try {
    return await operation(client);
  } finally {
    releaseClient(client);
  }
}
