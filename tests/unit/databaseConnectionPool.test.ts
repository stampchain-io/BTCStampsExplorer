import {
  assertEquals,
  assertExists,
  assertRejects,
} from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub, spy } from "@std/testing/mock";
import { Client } from "mysql/mod.ts";
import { 
  createMockDatabaseManager,
  createMockClient,
  defaultDatabaseConfig 
} from "../fixtures/databaseFixtures.ts";

describe("Database Connection Pool Management", () => {
  let dbManager: ReturnType<typeof createMockDatabaseManager>;

  beforeEach(() => {
    // Create a fresh mock database manager for each test
    dbManager = createMockDatabaseManager();
  });

  describe("Connection Pool Warmup", () => {
    it("should warm up pool to minimum connections", async () => {
      await dbManager.warmupConnectionPool();
      
      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.poolSize, defaultDatabaseConfig.minConnections);
      assertEquals(metrics.activeConnections, 0);
    });

    it("should handle warmup failures gracefully", async () => {
      // Create a manager that will fail to create connections
      const failingManager = createMockDatabaseManager();
      
      // Stub the client creation to fail
      const originalCreateClient = createMockClient;
      (globalThis as any).createMockClient = () => {
        throw new Error("Connection failed");
      };
      
      // Override the internal connection creation
      stub(Client.prototype, "connect", () => Promise.reject(new Error("Connection failed")));

      await failingManager.warmupConnectionPool();
      
      // Should log warnings but not throw
      const metrics = failingManager.getPoolMetrics();
      assertEquals(metrics.poolSize, 0);
    });

    it("should not exceed connection limit during warmup", async () => {
      // Create manager with min connections higher than limit
      const customManager = createMockDatabaseManager({
        minConnections: 20,
        maxConnections: 10,
      });

      await customManager.warmupConnectionPool();
      
      const metrics = customManager.getPoolMetrics();
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
      assertEquals(metrics.poolSize, defaultDatabaseConfig.minConnections! - 1);
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
      if (dbManager.pool && dbManager.pool[0]) {
        (dbManager.pool[0] as any).isValid = false;
      }

      const client = await dbManager.getClient();
      assertExists(client);
      
      // Should have skipped invalid connection
      assertEquals((client as any).isValid !== false, true);
    });

    it("should handle pool exhaustion", async () => {
      // Acquire all connections
      const clients: Client[] = [];
      for (let i = 0; i < defaultDatabaseConfig.maxConnections!; i++) {
        clients.push(await dbManager.getClient());
      }

      // Create a new manager with short timeout for testing
      const shortTimeoutManager = createMockDatabaseManager({
        acquireTimeout: 100,
      });
      // Exhaust the pool
      for (let i = 0; i < defaultDatabaseConfig.maxConnections!; i++) {
        await shortTimeoutManager.getClient();
      }

      // Next request should timeout
      await assertRejects(
        () => shortTimeoutManager.getClient(),
        Error,
        "Connection pool exhausted"
      );
    });

    it("should wait for available connection", async () => {
      // Acquire all connections
      const clients: Client[] = [];
      for (let i = 0; i < defaultDatabaseConfig.maxConnections!; i++) {
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
        metricsBeforeRelease.poolSize + 1
      );
      assertEquals(
        metricsAfterRelease.activeConnections,
        metricsBeforeRelease.activeConnections - 1
      );
    });

    it("should handle negative active connections", () => {
      // Force negative scenario by releasing without acquiring
      const client = createMockClient();
      dbManager.releaseClient(client);
      
      const metrics = dbManager.getPoolMetrics();
      assertEquals(metrics.activeConnections, 0); // Should not go negative
    });
  });

  describe("Connection Closing", () => {
    it("should close connection gracefully", async () => {
      const client = createMockClient();
      const closeSpy = spy(client, "close");
      
      await dbManager.closeClient(client);
      
      assertEquals(closeSpy.calls.length, 1);
    });

    it("should handle close errors", async () => {
      const client = createMockClient();
      stub(client, "close", () => Promise.reject(new Error("Close failed")));
      
      // Should not throw
      await dbManager.closeClient(client);
      
      // Should log error
      assertEquals(dbManager.logger.error.calls.length >= 1, true);
    });
  });

  describe("Pool Metrics", () => {
    it("should calculate utilization correctly", async () => {
      // Acquire half of the connections
      const halfConnections = Math.floor(defaultDatabaseConfig.maxConnections! / 2);
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
        metrics.poolSize + metrics.activeConnections
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
      if (dbManager.pool && Array.isArray(dbManager.pool)) {
        for (const conn of dbManager.pool) {
          (conn as any).isValid = false;
        }
      }

      // Should create new connection after failing validations
      const client = await dbManager.getClient();
      assertExists(client);
      assertEquals((client as any).isValid !== false, true);
    });
  });
});