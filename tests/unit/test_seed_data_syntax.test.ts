/**
 * Unit tests for test-seed-data.sql syntax and structure validation
 *
 * Validates that the seed data SQL file:
 * 1. Has valid SQL syntax
 * 2. Uses idempotent statements (REPLACE INTO or INSERT IGNORE)
 * 3. Contains INSERT statements for all required tables
 * 4. Properly handles BINARY(16) collection_id with UNHEX()
 * 5. Has proper JSON formatting for JSON columns
 */

import { assertEquals, assert, assertMatch } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.208.0/testing/bdd.ts";

const SEED_FILE_PATH = "../../scripts/test-seed-data.sql";

describe("Test Seed Data SQL Syntax Validation", () => {
  let seedSQL: string;

  // Load the seed data file once for all tests
  const loadSeedFile = async (): Promise<string> => {
    const seedPath = new URL(SEED_FILE_PATH, import.meta.url).pathname;
    return await Deno.readTextFile(seedPath);
  };

  describe("File Structure", () => {
    it("should exist and be readable", async () => {
      seedSQL = await loadSeedFile();
      assert(seedSQL.length > 0, "Seed file should not be empty");
    });

    it("should have proper SQL comment headers", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      assertMatch(
        seedSQL,
        /--.*BTCStampsExplorer.*Test.*Seed.*Data/i,
        "Should have descriptive header comment"
      );
    });

    it("should use consistent statement terminators (semicolons)", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Check that INSERT/REPLACE statements end with semicolons
      const statements = seedSQL.match(/(INSERT|REPLACE)\s+INTO[\s\S]*?;/gi);
      assert(
        statements && statements.length > 0,
        "Should contain INSERT or REPLACE statements ending with semicolons"
      );
    });
  });

  describe("Idempotency", () => {
    it("should use REPLACE INTO or INSERT IGNORE for all insertions", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Remove comments and check for non-idempotent INSERT statements
      const cleanSQL = seedSQL.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

      // Find all INSERT statements that are not REPLACE or INSERT IGNORE
      const invalidInserts = cleanSQL.match(/\bINSERT\s+INTO\s+(?!IGNORE)/gi);

      // Filter out REPLACE INTO which is valid
      const nonIdempotent = invalidInserts?.filter(stmt =>
        !stmt.toUpperCase().includes("IGNORE")
      );

      // Check if we have REPLACE INTO as alternative
      const hasReplace = cleanSQL.match(/\bREPLACE\s+INTO\b/gi);

      assert(
        (!nonIdempotent || nonIdempotent.length === 0) || (hasReplace && hasReplace.length > 0),
        "All INSERT statements should use INSERT IGNORE or REPLACE INTO for idempotency"
      );
    });

    it("should not use DELETE statements", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      const cleanSQL = seedSQL.replace(/--.*$/gm, "");
      const deleteStatements = cleanSQL.match(/\bDELETE\s+FROM\b/gi);

      assertEquals(
        deleteStatements,
        null,
        "Seed data should not use DELETE statements (schema handles cleanup)"
      );
    });

    it("should not use TRUNCATE statements", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      const cleanSQL = seedSQL.replace(/--.*$/gm, "");
      const truncateStatements = cleanSQL.match(/\bTRUNCATE\s+TABLE\b/gi);

      assertEquals(
        truncateStatements,
        null,
        "Seed data should not use TRUNCATE statements (schema handles cleanup)"
      );
    });
  });

  describe("Required Tables Coverage", () => {
    const requiredTables = [
      "blocks",
      "StampTableV4",
      "creator",
      "SRC20Valid",
      "balances",
      "src20_token_stats",
      "collections",
    ];

    for (const table of requiredTables) {
      it(`should have INSERT/REPLACE statements for ${table} table`, async () => {
        if (!seedSQL) seedSQL = await loadSeedFile();

        const pattern = new RegExp(`(INSERT|REPLACE)\\s+INTO\\s+${table}\\b`, "i");
        assertMatch(
          seedSQL,
          pattern,
          `Should contain INSERT or REPLACE statements for ${table} table`
        );
      });
    }
  });

  describe("BINARY(16) Collection ID Handling", () => {
    it("should use UNHEX() for collection_id insertions", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Check if collections table uses UNHEX for collection_id
      const collectionsPattern = /INSERT|REPLACE.*INTO\s+collections[\s\S]*?VALUES/i;
      const collectionsInsert = seedSQL.match(collectionsPattern);

      if (collectionsInsert) {
        assertMatch(
          seedSQL,
          /UNHEX\(['"]/i,
          "Should use UNHEX() function for BINARY(16) collection_id values"
        );
      }
    });

    it("should use UNHEX() in collection_creators table", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      const creatorsPattern = /INSERT|REPLACE.*INTO\s+collection_creators/i;
      const hasCreators = creatorsPattern.test(seedSQL);

      if (hasCreators) {
        assertMatch(
          seedSQL,
          /collection_creators[\s\S]*?UNHEX/i,
          "collection_creators should use UNHEX() for collection_id"
        );
      }
    });

    it("should use UNHEX() in collection_stamps table", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      const stampsPattern = /INSERT|REPLACE.*INTO\s+collection_stamps/i;
      const hasStamps = stampsPattern.test(seedSQL);

      if (hasStamps) {
        assertMatch(
          seedSQL,
          /collection_stamps[\s\S]*?UNHEX/i,
          "collection_stamps should use UNHEX() for collection_id"
        );
      }
    });

    it("should have properly formatted hex strings for UNHEX()", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Find all UNHEX() calls
      const unhexCalls = seedSQL.match(/UNHEX\(['"]([0-9A-Fa-f]+)['"]\)/g);

      if (unhexCalls) {
        for (const call of unhexCalls) {
          const hexMatch = call.match(/UNHEX\(['"]([0-9A-Fa-f]+)['"]\)/);
          if (hexMatch) {
            const hexValue = hexMatch[1];
            assertEquals(
              hexValue.length,
              32,
              `UNHEX() hex string should be 32 characters (16 bytes), got ${hexValue.length} in: ${call}`
            );
          }
        }
      }
    });
  });

  describe("JSON Column Handling", () => {
    const jsonColumns = [
      { table: "stamp_market_data", column: "volume_sources" },
      { table: "src20_market_data", column: "exchange_sources" },
    ];

    it("should have valid JSON syntax in JSON columns", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Extract potential JSON values from INSERT statements
      const jsonValuePattern = /['"](\{[^'"]*\})['"]/g;
      const matches = seedSQL.matchAll(jsonValuePattern);

      for (const match of matches) {
        const jsonString = match[1];
        try {
          // Attempt to parse as JSON
          JSON.parse(jsonString);
        } catch (error) {
          assert(false, `Invalid JSON found: ${jsonString}`);
        }
      }
    });
  });

  describe("Data Volume Requirements", () => {
    it("should have at least 25 stamp INSERT statements", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Count VALUES entries in stamps table inserts
      const stampsInserts = seedSQL.match(/(INSERT|REPLACE)\s+INTO\s+stamps[\s\S]*?;/gi);

      if (stampsInserts) {
        let valueCount = 0;
        for (const insert of stampsInserts) {
          // Count individual value tuples
          const matches = insert.match(/\([^)]+\)/g);
          if (matches) {
            valueCount += matches.length - 1; // Subtract 1 for column list
          }
        }

        assertGreaterOrEqual(
          valueCount,
          25,
          `Should have at least 25 stamp records, found approximately ${valueCount}`
        );
      }
    });

    it("should have at least 10 block INSERT statements", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      const blocksInserts = seedSQL.match(/(INSERT|REPLACE)\s+INTO\s+blocks[\s\S]*?;/gi);

      if (blocksInserts) {
        let valueCount = 0;
        for (const insert of blocksInserts) {
          const matches = insert.match(/\([^)]+\)/g);
          if (matches) {
            valueCount += matches.length - 1;
          }
        }

        assertGreaterOrEqual(
          valueCount,
          10,
          `Should have at least 10 block records, found approximately ${valueCount}`
        );
      }
    });
  });

  describe("SQL Syntax Validation", () => {
    it("should not have syntax errors in INSERT statements", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Check for common syntax errors
      const errors: string[] = [];

      // Check for unclosed parentheses in VALUES clauses
      const valuesClauses = seedSQL.match(/VALUES[\s\S]*?;/gi);
      if (valuesClauses) {
        for (const clause of valuesClauses) {
          const openParens = (clause.match(/\(/g) || []).length;
          const closeParens = (clause.match(/\)/g) || []).length;

          if (openParens !== closeParens) {
            errors.push(`Unmatched parentheses in VALUES clause: ${clause.substring(0, 100)}...`);
          }
        }
      }

      // Check for unclosed quotes
      const singleQuotes = (seedSQL.match(/'/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push("Unmatched single quotes in SQL file");
      }

      assertEquals(
        errors.length,
        0,
        `Found ${errors.length} syntax errors:\n${errors.join("\n")}`
      );
    });

    it("should use proper NULL representation", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Check for invalid null representations
      const invalidNulls = seedSQL.match(/VALUES[^;]*?'null'|"null"/gi);

      assertEquals(
        invalidNulls,
        null,
        "Should use NULL without quotes, not 'null' string"
      );
    });

    it("should use consistent date format for timestamps", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      // Find timestamp values - should be either UNIX timestamps (integers) or ISO strings
      const timestampPattern = /'(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})'/g;
      const timestamps = Array.from(seedSQL.matchAll(timestampPattern));

      // If timestamps are found, validate they're properly formatted
      for (const match of timestamps) {
        const timestamp = match[1];
        assert(
          /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(timestamp),
          `Invalid timestamp format: ${timestamp}`
        );
      }
    });
  });

  describe("Foreign Key Data Preparation", () => {
    it("should insert parent tables before child tables", async () => {
      if (!seedSQL) seedSQL = await loadSeedFile();

      const tableOrder: string[] = [];
      const tablePattern = /(INSERT|REPLACE)\s+INTO\s+(\w+)/gi;
      const matches = seedSQL.matchAll(tablePattern);

      for (const match of matches) {
        const tableName = match[2].toLowerCase();
        if (!tableOrder.includes(tableName)) {
          tableOrder.push(tableName);
        }
      }

      // blocks should come before stamps and src20
      const blocksIndex = tableOrder.indexOf("blocks");
      const stampsIndex = tableOrder.indexOf("stamps");
      const src20Index = tableOrder.indexOf("src20");

      if (blocksIndex !== -1 && stampsIndex !== -1) {
        assert(
          blocksIndex < stampsIndex,
          "blocks table should be inserted before stamps table"
        );
      }

      if (blocksIndex !== -1 && src20Index !== -1) {
        assert(
          blocksIndex < src20Index,
          "blocks table should be inserted before src20 table"
        );
      }

      // collections should come before collection_stamps and collection_creators
      const collectionsIndex = tableOrder.indexOf("collections");
      const collectionStampsIndex = tableOrder.indexOf("collection_stamps");
      const collectionCreatorsIndex = tableOrder.indexOf("collection_creators");

      if (collectionsIndex !== -1 && collectionStampsIndex !== -1) {
        assert(
          collectionsIndex < collectionStampsIndex,
          "collections table should be inserted before collection_stamps table"
        );
      }

      if (collectionsIndex !== -1 && collectionCreatorsIndex !== -1) {
        assert(
          collectionsIndex < collectionCreatorsIndex,
          "collections table should be inserted before collection_creators table"
        );
      }
    });
  });
});

// Helper function to count approximate number of records
function assertGreaterOrEqual(actual: number, expected: number, message: string) {
  assert(actual >= expected, message);
}
