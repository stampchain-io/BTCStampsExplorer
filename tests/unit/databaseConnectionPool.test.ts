import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";
import { assertSpyCall, spy } from "@std/testing@1.0.14/mock";
import { Client } from "mysql/mod.ts";

// Mock configuration
const mockConfig = {
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

// Create a mock DatabaseManager class for testing
class MockDatabaseManager {
  private pool: Client[] = [];
  private activeConnections = 0;
  private CONNECTION_LIMIT = mockConfig.maxConnections;
  private MIN_CONNECTIONS = mockConfig.minConnections;
  private ACQUIRE_TIMEOUT = mockConfig.acquireTimeout;
  private CONNECTION_TIMEOUT = mockConfig.connectionTimeout;
  private VALIDATION_TIMEOUT = mockConfig.validationTimeout;
  private logger = {
    info: spy(),
    warn: spy(),
    error: spy(),
  };

  // Expose methods for test manipulation
  _setPool(pool: Client[]) {
    this.pool = pool;
  }

  _getPool() {
    return this.pool;
  }

  _setActiveConnections(count: number) {
    this.activeConnections = count;
  }

  _getActiveConnections() {
    return this.activeConnections;
  }

  _getLogger() {
    return this.logger;
  }

  _setConnectionLimit(limit: number) {
    this.CONNECTION_LIMIT = limit;
  }

  _setMinConnections(min: number) {
    this.MIN_CONNECTIONS = min;
  }

  _setAcquireTimeout(timeout: number) {
    this.ACQUIRE_TIMEOUT = timeout;
  }

  async warmupConnectionPool(): Promise<void> {
    const connectionsToCreate = Math.min(
      this.MIN_CONNECTIONS,
      this.CONNECTION_LIMIT,
    );

    for (let i = 0; i < connectionsToCreate; i++) {
      try {
        const client = await this.createNewConnection();
        this.pool.push(client);
      } catch (error) {
        this.logger.warn(
          `Failed to create warmup connection ${i + 1}: ${error}`,
        );
      }
    }

    this.logger.info(
      `Connection pool warmed up with ${this.pool.length} connections`,
    );
  }

  async getClient(): Promise<Client> {
    if (this.pool.length > 0) {
      const client = this.pool.pop() as Client;

      // Validate connection before returning
      try {
        await this.validateConnection(client);
        this.activeConnections++;
        return client;
      } catch (error) {
        this.logger.warn(`Connection validation failed: ${error}`);
        await this.closeClient(client);
        // Recursively try to get another connection
        return this.getClient();
      }
    }

    // Check if we can create a new connection
    if (this.activeConnections < this.CONNECTION_LIMIT) {
      try {
        const client = await this.createNewConnection();
        this.activeConnections++;
        return client;
      } catch (error) {
        throw new Error(`Failed to create new connection: ${error}`);
      }
    }

    // Pool exhausted - wait with timeout
    const startTime = Date.now();
    while (Date.now() - startTime < this.ACQUIRE_TIMEOUT) {
      if (this.pool.length > 0) {
        return this.getClient();
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(
      `Connection pool exhausted. Active: ${this.activeConnections}/${this.CONNECTION_LIMIT}`,
    );
  }

  releaseClient(client: Client): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.pool.push(client);
    this.logger.info(
      `Connection released. Pool size: ${this.pool.length}, Active: ${this.activeConnections}`,
    );
  }

  async closeClient(client: Client): Promise<void> {
    try {
      await client.close();
    } catch (error) {
      this.logger.error(`Error closing connection: ${error}`);
    }
  }

  async createNewConnection(): Promise<Client> {
    const client = new Client();
    // Mock connection creation
    return client;
  }

  async validateConnection(client: Client): Promise<void> {
    // Mock validation - can be configured to fail in tests
    const isValid = (client as any).isValid !== false;
    if (!isValid) {
      throw new Error("Connection validation failed");
    }
  }

  getPoolMetrics() {
    return {
      poolSize: this.pool.length,
      activeConnections: this.activeConnections,
      totalConnections: this.pool.length + this.activeConnections,
      connectionLimit: this.CONNECTION_LIMIT,
      utilizationPercent: Math.round(
        (this.activeConnections / this.CONNECTION_LIMIT) * 100,
      ),
    };
  }

  // Test helper method to simulate connection creation failures
  _setCreateNewConnectionError(error: Error | null) {
    if (error) {
      this.createNewConnection = async () => {
        throw error;
      };
    } else {
      this.createNewConnection = async () => {
        const client = new Client();
        return client;
      };
    }
  }
}

describe("Database Connection Pool Management", () => {
  let dbManager: MockDatabaseManager;

  beforeEach(() => {
    // Create fresh instance for each test
    dbManager = new MockDatabaseManager();
  });

  describe("Connection Pool Warmup", () => {
    it("should warm up pool to minimum connections", async () => {
      await dbManager.warmupConnectionPool();

      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.poolSize, mockConfig.minConnections);
      assertEquals(metrics.activeConnections, 0);
    });

    it("should handle warmup failures gracefully", async () => {
      // Make createNewConnection fail
      dbManager._setCreateNewConnectionError(new Error("Connection failed"));

      await dbManager.warmupConnectionPool();

      // Should log warnings but not throw
      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.poolSize, 0);

      // Verify logger was called
      const logger = dbManager._getLogger();
      assertEquals(logger.warn.calls.length >= 2, true);
    });

    it("should not exceed connection limit during warmup", async () => {
      // Set min connections higher than limit
      dbManager._setMinConnections(20);
      dbManager._setConnectionLimit(10);

      await dbManager.warmupConnectionPool();

      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.poolSize <= 10, true);
    });
  });

  describe("Connection Acquisition", () => {
    it("should get connection from pool", async () => {
      // Pre-populate pool
      await dbManager.warmupConnectionPool();

      const client = await dbManager.getClient();
      assertExists(client);

      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.activeConnections, 1);
      assertEquals(metrics.poolSize, mockConfig.minConnections - 1);
    });

    it("should create new connection when pool is empty", async () => {
      // Don't warm up pool
      const client = await dbManager.getClient();
      assertExists(client);

      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.activeConnections, 1);
      assertEquals(metrics.poolSize, 0);
    });

    it("should validate connections before returning", async () => {
      await dbManager.warmupConnectionPool();

      // Mark first connection as invalid
      const pool = dbManager._getPool();
      if (pool[0]) {
        (pool[0] as any).isValid = false;
      }

      const client = await dbManager.getClient();
      assertExists(client);

      // Should have skipped invalid connection
      assertEquals((client as any).isValid !== false, true);
    });

    it("should handle pool exhaustion", async () => {
      // Acquire all connections
      const clients: Client[] = [];
      for (let i = 0; i < mockConfig.maxConnections; i++) {
        clients.push(await dbManager.getClient());
      }

      // Set a short timeout for testing
      dbManager._setAcquireTimeout(100);

      // Next request should timeout
      await assertRejects(
        () => dbManager.getClient(),
        Error,
        "Connection pool exhausted",
      );
    });

    it("should wait for available connection", async () => {
      // Acquire all connections
      const clients: Client[] = [];
      for (let i = 0; i < mockConfig.maxConnections; i++) {
        clients.push(await dbManager.getClient());
      }

      // Release one connection after delay
      setTimeout(() => {
        dbManager.releaseClient(clients[0]);
      }, 50);

      // Should get connection after waiting
      const client = await dbManager.getClient();
      assertExists(client);
    });
  });

  describe("Connection Release", () => {
    it("should release connection back to pool", async () => {
      const client = await dbManager.getClient();
      const metricsBeforeRelease = dbManager.getPoolMetrics();

      dbManager.releaseClient(client);

      const metricsAfterRelease = dbManager.getPoolMetrics();
      assertEquals(
        metricsAfterRelease.poolSize,
        metricsBeforeRelease.poolSize + 1,
      );
      assertEquals(
        metricsAfterRelease.activeConnections,
        metricsBeforeRelease.activeConnections - 1,
      );
    });

    it("should handle negative active connections", () => {
      // Force negative scenario
      dbManager._setActiveConnections(0);

      const client = new Client();
      dbManager.releaseClient(client);

      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.activeConnections, 0); // Should not go negative
    });
  });

  describe("Connection Closing", () => {
    it("should close connection gracefully", async () => {
      const client = new Client();
      const closeSpy = spy(client, "close");

      await dbManager.closeClient(client);

      assertSpyCall(closeSpy, 0);
    });

    it("should handle close errors", async () => {
      const client = new Client();
      // Make close method throw an error
      client.close = async () => {
        throw new Error("Close failed");
      };

      // Should not throw
      await dbManager.closeClient(client);

      // Should log error
      const logger = dbManager._getLogger();
      assertEquals(logger.error.calls.length >= 1, true);
    });
  });

  describe("Pool Metrics", () => {
    it("should calculate utilization correctly", async () => {
      // Acquire half of the connections
      const halfConnections = Math.floor(mockConfig.maxConnections / 2);
      for (let i = 0; i < halfConnections; i++) {
        await dbManager.getClient();
      }

      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.activeConnections, halfConnections);
      assertEquals(metrics.utilizationPercent, 50);
    });

    it("should report accurate total connections", async () => {
      await dbManager.warmupConnectionPool();

      // Acquire some connections
      await dbManager.getClient();
      await dbManager.getClient();

      const metrics = dbManager.getPoolMetrics();
      assertEquals(
        metrics.totalConnections,
        metrics.poolSize + metrics.activeConnections,
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid acquire/release cycles", async () => {
      const cycles = 20;

      for (let i = 0; i < cycles; i++) {
        const client = await dbManager.getClient();
        dbManager.releaseClient(client);
      }

      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.activeConnections, 0);
      assertEquals(metrics.poolSize >= 1, true);
    });

    it("should handle concurrent connection requests", async () => {
      const concurrentRequests = 5;
      const promises: Promise<Client>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(dbManager.getClient());
      }

      const clients = await Promise.all(promises);

      assertEquals(clients.length, concurrentRequests);
      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.activeConnections, concurrentRequests);
    });

    it("should recover from validation failures", async () => {
      await dbManager.warmupConnectionPool();

      // Mark all connections as invalid
      const pool = dbManager._getPool();
      for (const conn of pool) {
        (conn as any).isValid = false;
      }

      // Should create new connection after failing validations
      const client = await dbManager.getClient();
      assertExists(client);
      assertEquals((client as any).isValid !== false, true);
    });
  });
});
