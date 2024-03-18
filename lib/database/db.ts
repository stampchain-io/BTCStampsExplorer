import { Client } from "$mysql/mod.ts";
import { conf } from "utils/config.ts";

const maxRetries = parseInt(conf.DB_MAX_RETRIES) || 5;
const retryInterval = 500;

/**
 * Connects to the database.
 * @returns {Promise<Client>} A promise that resolves to the connected client.
 * @throws {Error} If unable to connect to the database after maximum retries.
 */
export const connectDb = async () => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
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
    } catch (error) {
      console.error(`ERROR: Error connecting db on attempt ${attempt}:`, error);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      } else {
        throw error;
      }
    }
  }
};

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
      const client = await connectDb();
      const result = await client?.execute(query, params);
      client?.close();
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
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }
};
