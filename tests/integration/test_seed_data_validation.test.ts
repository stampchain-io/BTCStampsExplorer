/**
 * Integration tests for test-seed-data.sql validation
 *
 * Validates that the seed data:
 * 1. Loads successfully after test-schema.sql execution
 * 2. Contains the required minimum record counts for pagination testing
 * 3. Maintains foreign key integrity across tables
 * 4. Is idempotent (can be run multiple times without errors)
 * 5. Has valid relationships between market data and entities
 */

import { assertEquals, assertGreaterOrEqual, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it, beforeAll, afterAll } from "https://deno.land/std@0.208.0/testing/bdd.ts";
import mysql from "npm:mysql2@3.6.5/promise";

interface TestConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

let connection: mysql.Connection | null = null;

// Get database config from environment or use test defaults
const getTestConfig = (): TestConfig => {
  return {
    host: Deno.env.get("TEST_DB_HOST") || "localhost",
    user: Deno.env.get("TEST_DB_USER") || "root",
    password: Deno.env.get("TEST_DB_PASSWORD") || "",
    database: Deno.env.get("TEST_DB_NAME") || "btcstamps_test",
  };
};

describe("Test Seed Data Validation", () => {
  beforeAll(async () => {
    const config = getTestConfig();

    try {
      // Create test database if it doesn't exist
      const setupConnection = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
      });

      await setupConnection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
      await setupConnection.end();

      // Connect to the test database
      connection = await mysql.createConnection(config);

      // Load schema and seed data
      const schemaPath = new URL("../../scripts/test-schema.sql", import.meta.url).pathname;
      const seedPath = new URL("../../scripts/test-seed-data.sql", import.meta.url).pathname;

      const schemaSQL = await Deno.readTextFile(schemaPath);
      const seedSQL = await Deno.readTextFile(seedPath);

      // Execute schema
      const schemaStatements = schemaSQL
        .split(";")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of schemaStatements) {
        if (statement) {
          await connection.query(statement);
        }
      }

      // Execute seed data
      const seedStatements = seedSQL
        .split(";")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of seedStatements) {
        if (statement) {
          await connection.query(statement);
        }
      }
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
  });

  afterAll(async () => {
    if (connection) {
      await connection.end();
    }
  });

  describe("Minimum Record Count Requirements", () => {
    it("should have at least 25 stamps for pagination testing", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query("SELECT COUNT(*) as count FROM stamps");
      const count = (rows as any[])[0].count;

      assertGreaterOrEqual(
        count,
        25,
        `Expected at least 25 stamps for pagination testing, got ${count}`
      );
    });

    it("should have at least 10 blocks", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query("SELECT COUNT(*) as count FROM blocks");
      const count = (rows as any[])[0].count;

      assertGreaterOrEqual(
        count,
        10,
        `Expected at least 10 blocks, got ${count}`
      );
    });

    it("should have at least 10 SRC-20 token operations", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query("SELECT COUNT(DISTINCT tick) as count FROM src20");
      const count = (rows as any[])[0].count;

      assertGreaterOrEqual(
        count,
        10,
        `Expected at least 10 distinct SRC-20 tokens, got ${count}`
      );
    });

    it("should have blocks referenced by stamps", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query("SELECT COUNT(DISTINCT block_index) as count FROM stamps");
      const count = (rows as any[])[0].count;

      assertGreaterOrEqual(
        count,
        5,
        `Expected stamps across multiple blocks, got ${count} blocks`
      );
    });
  });

  describe("Foreign Key Integrity", () => {
    it("should have no orphaned stamps (all block_index values exist in blocks)", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM stamps s
        LEFT JOIN blocks b ON s.block_index = b.block_index
        WHERE b.block_index IS NULL
      `);

      const orphanedCount = (rows as any[])[0].count;
      assertEquals(
        orphanedCount,
        0,
        `Found ${orphanedCount} stamps with invalid block_index references`
      );
    });

    it("should have no orphaned SRC-20 operations (all block_index values exist in blocks)", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM src20 s
        LEFT JOIN blocks b ON s.block_index = b.block_index
        WHERE b.block_index IS NULL
      `);

      const orphanedCount = (rows as any[])[0].count;
      assertEquals(
        orphanedCount,
        0,
        `Found ${orphanedCount} SRC-20 operations with invalid block_index references`
      );
    });

    it("should have valid collection_stamps references", async () => {
      if (!connection) throw new Error("Database connection not established");

      // Check for orphaned collection references
      const [collectionRows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM collection_stamps cs
        LEFT JOIN collections c ON cs.collection_id = c.collection_id
        WHERE c.collection_id IS NULL
      `);

      const orphanedCollections = (collectionRows as any[])[0].count;
      assertEquals(
        orphanedCollections,
        0,
        `Found ${orphanedCollections} collection_stamps entries with invalid collection_id`
      );

      // Check for orphaned stamp references (if stamps exist in collection_stamps)
      const [stampRows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM collection_stamps cs
        LEFT JOIN stamps s ON cs.stamp = s.stamp
        WHERE s.stamp IS NULL AND cs.stamp IS NOT NULL
      `);

      const orphanedStamps = (stampRows as any[])[0].count;
      assertEquals(
        orphanedStamps,
        0,
        `Found ${orphanedStamps} collection_stamps entries with invalid stamp references`
      );
    });

    it("should have valid collection_creators references", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM collection_creators cc
        LEFT JOIN collections c ON cc.collection_id = c.collection_id
        WHERE c.collection_id IS NULL
      `);

      const orphanedCount = (rows as any[])[0].count;
      assertEquals(
        orphanedCount,
        0,
        `Found ${orphanedCount} collection_creators entries with invalid collection_id`
      );
    });
  });

  describe("Market Data Relationships", () => {
    it("should have stamp_market_data entries that reference valid stamps", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM stamp_market_data smd
        LEFT JOIN stamps s ON smd.cpid = s.cpid
        WHERE s.cpid IS NULL
      `);

      const orphanedCount = (rows as any[])[0].count;
      assertEquals(
        orphanedCount,
        0,
        `Found ${orphanedCount} stamp_market_data entries with invalid cpid references`
      );
    });

    it("should have src20_market_data entries that reference valid tokens", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM src20_market_data smd
        LEFT JOIN (SELECT DISTINCT tick FROM src20) s ON smd.tick = s.tick
        WHERE s.tick IS NULL
      `);

      const orphanedCount = (rows as any[])[0].count;
      assertEquals(
        orphanedCount,
        0,
        `Found ${orphanedCount} src20_market_data entries with invalid tick references`
      );
    });

    it("should have collection_market_data entries that reference valid collections", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM collection_market_data cmd
        LEFT JOIN collections c ON cmd.collection_id = c.collection_id
        WHERE c.collection_id IS NULL
      `);

      const orphanedCount = (rows as any[])[0].count;
      assertEquals(
        orphanedCount,
        0,
        `Found ${orphanedCount} collection_market_data entries with invalid collection_id`
      );
    });
  });

  describe("Idempotency", () => {
    it("should maintain same row counts after re-running seed script", async () => {
      if (!connection) throw new Error("Database connection not established");

      // Get initial counts
      const [stampsRows1] = await connection.query("SELECT COUNT(*) as count FROM stamps");
      const [blocksRows1] = await connection.query("SELECT COUNT(*) as count FROM blocks");
      const [src20Rows1] = await connection.query("SELECT COUNT(*) as count FROM src20");

      const initialCounts = {
        stamps: (stampsRows1 as any[])[0].count,
        blocks: (blocksRows1 as any[])[0].count,
        src20: (src20Rows1 as any[])[0].count,
      };

      // Re-run seed data
      const seedPath = new URL("../../scripts/test-seed-data.sql", import.meta.url).pathname;
      const seedSQL = await Deno.readTextFile(seedPath);

      const seedStatements = seedSQL
        .split(";")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of seedStatements) {
        if (statement) {
          await connection.query(statement);
        }
      }

      // Get counts after re-run
      const [stampsRows2] = await connection.query("SELECT COUNT(*) as count FROM stamps");
      const [blocksRows2] = await connection.query("SELECT COUNT(*) as count FROM blocks");
      const [src20Rows2] = await connection.query("SELECT COUNT(*) as count FROM src20");

      const finalCounts = {
        stamps: (stampsRows2 as any[])[0].count,
        blocks: (blocksRows2 as any[])[0].count,
        src20: (src20Rows2 as any[])[0].count,
      };

      assertEquals(
        finalCounts,
        initialCounts,
        "Row counts changed after re-running seed script - not idempotent"
      );
    });
  });

  describe("Data Quality", () => {
    it("should have stamps with required fields populated", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM stamps
        WHERE stamp IS NULL
          OR block_index IS NULL
          OR cpid IS NULL
          OR creator IS NULL
          OR tx_hash IS NULL
      `);

      const invalidCount = (rows as any[])[0].count;
      assertEquals(
        invalidCount,
        0,
        `Found ${invalidCount} stamps with missing required fields`
      );
    });

    it("should have blocks with required fields populated", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM blocks
        WHERE block_index IS NULL
          OR block_time IS NULL
          OR block_hash IS NULL
      `);

      const invalidCount = (rows as any[])[0].count;
      assertEquals(
        invalidCount,
        0,
        `Found ${invalidCount} blocks with missing required fields`
      );
    });

    it("should have SRC-20 operations with required fields populated", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM src20
        WHERE tx_hash IS NULL
          OR block_index IS NULL
          OR tick IS NULL
          OR op IS NULL
      `);

      const invalidCount = (rows as any[])[0].count;
      assertEquals(
        invalidCount,
        0,
        `Found ${invalidCount} SRC-20 operations with missing required fields`
      );
    });

    it("should have unique tx_hash values in stamps table", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT tx_hash, COUNT(*) as count
        FROM stamps
        GROUP BY tx_hash
        HAVING COUNT(*) > 1
      `);

      const duplicates = rows as any[];
      assertEquals(
        duplicates.length,
        0,
        `Found ${duplicates.length} duplicate tx_hash values in stamps table`
      );
    });

    it("should have unique cpid values in stamps table", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT cpid, COUNT(*) as count
        FROM stamps
        GROUP BY cpid
        HAVING COUNT(*) > 1
      `);

      const duplicates = rows as any[];
      assertEquals(
        duplicates.length,
        0,
        `Found ${duplicates.length} duplicate cpid values in stamps table`
      );
    });

    it("should have valid collection_id BINARY(16) format", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM collections
        WHERE LENGTH(collection_id) != 16
      `);

      const invalidCount = (rows as any[])[0].count;
      assertEquals(
        invalidCount,
        0,
        `Found ${invalidCount} collections with invalid collection_id format`
      );
    });
  });

  describe("Pagination Test Data", () => {
    it("should support pagination with 20 records per page", async () => {
      if (!connection) throw new Error("Database connection not established");

      // Test first page
      const [page1] = await connection.query(`
        SELECT stamp FROM stamps ORDER BY stamp DESC LIMIT 20
      `);

      assertEquals(
        (page1 as any[]).length,
        20,
        "First page should have exactly 20 records"
      );

      // Test second page
      const [page2] = await connection.query(`
        SELECT stamp FROM stamps ORDER BY stamp DESC LIMIT 20 OFFSET 20
      `);

      assertGreaterOrEqual(
        (page2 as any[]).length,
        5,
        "Second page should have at least 5 records for pagination testing"
      );
    });

    it("should have enough SRC-20 tokens for pagination testing", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT DISTINCT tick FROM src20 ORDER BY tick LIMIT 10
      `);

      assertEquals(
        (rows as any[]).length,
        10,
        "Should have at least 10 distinct SRC-20 tokens for pagination"
      );
    });
  });

  describe("Block Time Consistency", () => {
    it("should have block times that match between blocks and stamps", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM stamps s
        INNER JOIN blocks b ON s.block_index = b.block_index
        WHERE s.block_time != b.block_time
      `);

      const mismatchCount = (rows as any[])[0].count;
      assertEquals(
        mismatchCount,
        0,
        `Found ${mismatchCount} stamps with block_time mismatch`
      );
    });

    it("should have block times that match between blocks and SRC-20 operations", async () => {
      if (!connection) throw new Error("Database connection not established");

      const [rows] = await connection.query(`
        SELECT COUNT(*) as count
        FROM src20 s
        INNER JOIN blocks b ON s.block_index = b.block_index
        WHERE s.block_time != b.block_time
      `);

      const mismatchCount = (rows as any[])[0].count;
      assertEquals(
        mismatchCount,
        0,
        `Found ${mismatchCount} SRC-20 operations with block_time mismatch`
      );
    });
  });
});
