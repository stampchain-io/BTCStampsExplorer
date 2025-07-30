import { Client } from "mysql/mod.ts";
import { spy } from "@std/testing/mock";

export interface MockDatabaseConfig {
  maxConnections?: number;
  minConnections?: number;
  acquireTimeout?: number;
  connectionTimeout?: number;
  validationTimeout?: number;
  retryDelay?: number;
  enableCompression?: boolean;
  enableConnectionLogging?: boolean;
  maxRetries?: number;
}

export const defaultDatabaseConfig: MockDatabaseConfig = {
  maxConnections: 10,
  minConnections: 2,
  acquireTimeout: 5000,
  connectionTimeout: 10000,
  validationTimeout: 1000,
  retryDelay: 500,
  enableCompression: false,
  enableConnectionLogging: true,
  maxRetries: 3,
};

export function createMockClient(isValid = true): Client {
  const client = new Client();
  // Add a flag to mark validity for testing
  (client as any).isValid = isValid;
  return client;
}

export function createMockDatabaseManager(config?: MockDatabaseConfig) {
  const mergedConfig = { ...defaultDatabaseConfig, ...config };
  const pool: Client[] = [];
  let activeConnections = 0;
  
  const logger = {
    info: spy(),
    warn: spy(),
    error: spy(),
  };
  
  return {
    pool,
    activeConnections,
    config: mergedConfig,
    logger,
    
    async warmupConnectionPool(): Promise<void> {
      const connectionsToCreate = Math.min(
        mergedConfig.minConnections!,
        mergedConfig.maxConnections!
      );
      
      for (let i = 0; i < connectionsToCreate; i++) {
        try {
          const client = createMockClient();
          pool.push(client);
        } catch (error) {
          logger.warn(`Failed to create warmup connection ${i + 1}: ${error}`);
        }
      }
      
      logger.info(
        `Connection pool warmed up with ${pool.length} connections`
      );
    },
    
    async getClient(): Promise<Client> {
      if (pool.length > 0) {
        const client = pool.pop() as Client;
        
        // Validate connection before returning
        try {
          await validateConnection(client);
          activeConnections++;
          return client;
        } catch (error) {
          logger.warn(`Connection validation failed: ${error}`);
          await closeClient(client);
          // Recursively try to get another connection
          return this.getClient();
        }
      }
      
      // Check if we can create a new connection
      if (activeConnections < mergedConfig.maxConnections!) {
        try {
          const client = createMockClient();
          activeConnections++;
          return client;
        } catch (error) {
          throw new Error(`Failed to create new connection: ${error}`);
        }
      }
      
      // Pool exhausted - wait with timeout
      const startTime = Date.now();
      while (Date.now() - startTime < mergedConfig.acquireTimeout!) {
        if (pool.length > 0) {
          return this.getClient();
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      
      throw new Error(
        `Connection pool exhausted. Active: ${activeConnections}/${mergedConfig.maxConnections}`
      );
    },
    
    releaseClient(client: Client): void {
      activeConnections = Math.max(0, activeConnections - 1);
      pool.push(client);
      logger.info(
        `Connection released. Pool size: ${pool.length}, Active: ${activeConnections}`
      );
    },
    
    async closeClient(client: Client): Promise<void> {
      try {
        await client.close();
      } catch (error) {
        logger.error(`Error closing connection: ${error}`);
      }
    },
    
    getPoolMetrics() {
      return {
        poolSize: pool.length,
        activeConnections: activeConnections,
        totalConnections: pool.length + activeConnections,
        connectionLimit: mergedConfig.maxConnections!,
        utilizationPercent: Math.round(
          (activeConnections / mergedConfig.maxConnections!) * 100
        ),
      };
    },
  };
  
  async function validateConnection(client: Client): Promise<void> {
    const isValid = (client as any).isValid !== false;
    if (!isValid) {
      throw new Error("Connection validation failed");
    }
  }
  
  async function closeClient(client: Client): Promise<void> {
    await client.close();
  }
}