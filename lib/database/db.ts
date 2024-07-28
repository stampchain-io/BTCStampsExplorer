import { Client } from "$mysql/mod.ts";
import { conf } from "utils/config.ts";

const maxRetries = parseInt(conf.DB_MAX_RETRIES) || 5;
const retryInterval = 500;

class ConnectionPool {
  private pool: Client[] = [];
  private readonly maxPoolSize: number;

  constructor(maxPoolSize: number) {
    this.maxPoolSize = maxPoolSize;
  }

  async getClient(): Promise<Client> {
    if (this.pool.length > 0) {
      return this.pool.pop() as Client;
    }

    if (this.pool.length < this.maxPoolSize) {
      const client = await this.createConnection();
      return client;
    }

    throw new Error("No available connections in the pool");
  }

  releaseClient(client: Client): void {
    this.pool.push(client);
  }

  async closeClient(client: Client): Promise<void> {
    await client.close();
    const index = this.pool.indexOf(client);
    if (index > -1) {
      this.pool.splice(index, 1);
    }
  }

  private async createConnection(): Promise<Client> {
    const hostname = conf.DB_HOST;
    const username = conf.DB_USER;
    const password = conf.DB_PASSWORD;
    const port = conf.DB_PORT;
    const db = conf.DB_NAME;
    const client = await new Client().connect({
      hostname,
      port: Number(port),
      username,
      db,
      password,
    });
    return client;
  }
}

const connectionPool = new ConnectionPool(10); // Create a new connection pool with a maximum size of 10

export async function getClient() {
  const client = await connectionPool.getClient();
  return client;
}

export async function closeClient(client: Client) {
  await connectionPool.closeClient(client);
}

export async function closeAllClients() {
  for (const client of connectionPool.pool) {
    await connectionPool.closeClient(client);
  }
}

export function releaseClient(client: Client) {
  connectionPool.releaseClient(client);
}
/**
 * Executes a database query with retry logic.
 *
 * @param query - The query to execute.
 * @param params - The parameters for the query.
 * @returns A Promise that resolves to the result of the query.
 * @throws If the query fails after the maximum number of retries.
 */
export const handleQuery = async (query: string, params: string[]) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await getClient();
      const result = await client?.execute(query, params);
      closeClient(client);
      return result;
    } catch (error) {
      console.error(
        `ERROR: Error executing query on attempt ${attempt}:`,
        error,
      );
      if (attempt === maxRetries) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }
};

/**
 * Executes a database query using the provided client and handles retries in case of failure.
 *
 * @param client - The database client to use for executing the query.
 * @param query - The query to execute.
 * @param params - The parameters to pass to the query.
 * @returns A Promise that resolves to the result of the query execution.
 * @throws If the query execution fails after the maximum number of retries.
 */
export const handleQueryWithClient = async (
  client: Client,
  query: string,
  params: string[],
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await client.execute(query, params);
      return result;
    } catch (error) {
      console.error(
        `ERROR: Error executing query with client on attempt ${attempt}:`,
        error,
      );
      if (attempt === maxRetries) {
        throw new Error("Stamps Down...");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }
};
