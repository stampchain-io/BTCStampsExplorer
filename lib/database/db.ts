import { Client } from "$mysql/mod.ts";
import { conf } from "utils/config.ts";

const maxRetries = parseInt(conf.DB_MAX_RETRIES) || 5;
const retryInterval = 500;

let db: Client | null = null;

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

export async function getClient() {
  if (db) {
    return db;
  }
  db = await connectDb();
  return db;
}

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
