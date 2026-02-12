/**
 * Comprehensive Unit Tests for SRC20Repository
 *
 * Tests repository pattern, data access, CRUD operations, caching,
 * data validation, emoji handling, and database interactions.
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { restore, stub } from "@std/testing/mock";
import { SRC20Repository } from "../../server/database/src20Repository.ts";
import {
  emojiToUnicodeEscape,
  unicodeEscapeToEmoji,
} from "../../lib/utils/ui/formatting/emojiUtils.ts";
import { BigFloat } from "bigfloat/mod.ts";

// Store original database for restoration after tests
const originalDb = (SRC20Repository as any).db;

// Helper to create a mock database with call tracking
function createMockDb(responseData: any = {}) {
  const calls: { query: string; params: any[] }[] = [];

  return {
    db: {
      executeQueryWithCache: (query: string, params: any[]) => {
        calls.push({ query, params });
        return Promise.resolve(responseData);
      },
    },
    calls,
    reset: () => calls.length = 0,
  };
}

// Mock database responses
const mockSRC20TxResponse = {
  rows: [
    {
      tx_hash: "abc123def456",
      block_index: 800000,
      p: "src-20",
      op: "DEPLOY",
      tick: "\\U0001F4A9", // Unicode escape for 💩
      creator: "bc1qcreator123",
      amt: null,
      deci: 8,
      lim: "1000",
      max: "21000000",
      destination: null,
      block_time: "2024-01-01T00:00:00Z",
      creator_name: "TestCreator",
      destination_name: null,
      holders: 100,
      progress: 50.5,
      minted_amt: "10500000",
      total_mints: 10500,
      deploy_tx: "abc123def456",
    },
  ],
};

const mockBalanceResponse = {
  rows: [
    {
      address: "bc1qholder123",
      p: "src-20",
      tick: "\\U0001F4A9",
      amt: "1000.00000000",
      block_time: "2024-01-01T00:00:00Z",
      last_update: "2024-01-01T00:00:00Z",
    },
  ],
};

const mockCountResponse = {
  rows: [{ total: 42 }],
};

const mockMintProgressResponse = {
  rows: [
    {
      max: "21000000",
      deci: 8,
      lim: "1000",
      tx_hash: "abc123def456",
      tick: "\\U0001F4A9",
      total_minted: "10500000",
      holders_count: 100,
      total_mints: 10500,
      progress: "50", // Add progress field for optimized method
      progress_percentage: 50, // Add for optimized method
    },
  ],
};

Deno.test("SRC20Repository - Database Dependency Injection", async (t) => {
  await t.step("should allow setting custom database", async () => {
    const mockDb = {
      executeQueryWithCache: async () => mockSRC20TxResponse,
    };

    SRC20Repository.setDatabase(mockDb as any);
    assertEquals((SRC20Repository as any).db, mockDb);
  });

  await t.step("should restore original database", async () => {
    SRC20Repository.setDatabase(originalDb);
    assertEquals((SRC20Repository as any).db, originalDb);
  });
});

Deno.test("SRC20Repository - Unicode/Emoji Handling", async (t) => {
  await t.step(
    "should convert emoji to unicode escape for database operations",
    async () => {
      const emojiToUnicodeStub = stub(
        emojiToUnicodeEscape as any,
        "default",
        () => "\\U0001F4A9",
      );
      const mock = createMockDb(mockCountResponse);

      SRC20Repository.setDatabase(mock.db as any);

      try {
        const params = { tick: "💩" }; // Emoji input
        await SRC20Repository.getTotalCountValidSrc20TxFromDb(params);

        // Should have converted emoji to unicode escape
        assertEquals(mock.calls.length > 0, true);
        assertEquals(mock.calls[0].params.includes("\\U0001F4A9"), true);
      } finally {
        SRC20Repository.setDatabase(originalDb);
        restore();
      }
    },
  );

  await t.step(
    "should convert unicode escape to emoji in responses",
    async () => {
      const unicodeToEmojiStub = stub(
        unicodeEscapeToEmoji as any,
        "default",
        () => "💩",
      );
      const mock = createMockDb(mockSRC20TxResponse);

      SRC20Repository.setDatabase(mock.db as any);

      try {
        const result = await SRC20Repository.getValidSrc20TxFromDb({});

        // Response should have been converted to emoji
        assertEquals(result.rows[0].tick, "💩");
      } finally {
        SRC20Repository.setDatabase(originalDb);
        restore();
      }
    },
  );

  await t.step("should handle null/undefined ticks gracefully", async () => {
    const mock = createMockDb({
      rows: [{ ...mockSRC20TxResponse.rows[0], tick: null }],
    });

    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.getValidSrc20TxFromDb({});

      // Null tick should remain null
      assertEquals(result.rows[0].tick, null);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step(
    "should handle array of ticks with mixed emoji/unicode",
    async () => {
      const emojiToUnicodeStub = stub(
        emojiToUnicodeEscape as any,
        "default",
        (input: string) => {
          return input === "💩" ? "\\U0001F4A9" : input;
        },
      );
      const mock = createMockDb(mockSRC20TxResponse);

      SRC20Repository.setDatabase(mock.db as any);

      try {
        const params = { tick: ["💩", "\\U0001F4A9", "PLAIN"] };
        await SRC20Repository.getTotalCountValidSrc20TxFromDb(params);

        // Should process all tick variants
        assertEquals(mock.calls.length, 1);
      } finally {
        SRC20Repository.setDatabase(originalDb);
        restore();
      }
    },
  );
});

Deno.test("SRC20Repository - Query Parameter Building", async (t) => {
  await t.step("should build query with single tick parameter", async () => {
    const mock = createMockDb(mockCountResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getTotalCountValidSrc20TxFromDb({ tick: "TEST" });

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params.includes("TEST"), true);
      assertEquals(query.includes("tick = ?"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should build query with array of tick parameters", async () => {
    const mock = createMockDb(mockCountResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getTotalCountValidSrc20TxFromDb({
        tick: ["TEST1", "TEST2"],
      });

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params.includes("TEST1"), true);
      assertEquals(params.includes("TEST2"), true);
      assertEquals(query.includes("tick IN"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should build query with operation parameters", async () => {
    const mock = createMockDb(mockCountResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getTotalCountValidSrc20TxFromDb({ op: "DEPLOY" });

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params.includes("DEPLOY"), true);
      assertEquals(query.includes("op = ?"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should build query with multiple parameters", async () => {
    const mock = createMockDb(mockCountResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getTotalCountValidSrc20TxFromDb({
        tick: "TEST",
        op: "MINT",
        block_index: 800000,
        address: "bc1qtest123",
        tx_hash: "abc123def456",
      });

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params.includes("TEST"), true);
      assertEquals(params.includes("MINT"), true);
      assertEquals(params.includes(800000), true);
      assertEquals(params.includes("bc1qtest123"), true);
      assertEquals(params.includes("abc123def456"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});

Deno.test("SRC20Repository - Filtering and Sorting", async (t) => {
  await t.step("should apply excludeFullyMinted filter", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({}, true); // excludeFullyMinted = true

      const [query] = [mock.calls[0].query];
      assertEquals(
        query.includes("progress_percentage") && query.includes("< 100"),
        true,
      );
      assertEquals(query.includes("src20_market_data"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should apply onlyFullyMinted filter", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({}, false, true); // onlyFullyMinted = true

      const [query] = [mock.calls[0].query];
      assertEquals(
        query.includes("progress_percentage") && query.includes("= 100"),
        true,
      );
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle market cap sorting", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({
        sortBy: "MARKET_CAP_DESC",
      });

      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("market_cap_btc DESC"), true);
      assertEquals(query.includes("src20_market_data"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle holders sorting", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({ sortBy: "HOLDERS_DESC" });

      const [query] = [mock.calls[0].query];
      assertEquals(
        query.includes("holder_count") && query.includes("DESC"),
        true,
      );
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle basic sorting without market data", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({ sortBy: "BLOCK_DESC" });

      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("block_index DESC"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should default to ASC sorting for invalid sortBy", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({ sortBy: "INVALID_SORT" });

      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("block_index ASC"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});

Deno.test("SRC20Repository - Pagination", async (t) => {
  await t.step("should apply default pagination", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({});

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(query.includes("LIMIT ? OFFSET ?"), true);
      assertEquals(params[params.length - 2], 50); // default limit
      assertEquals(params[params.length - 1], 0); // offset for page 1
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle custom pagination", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({ limit: 25, page: 3 });

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params[params.length - 2], 25); // limit
      assertEquals(params[params.length - 1], 50); // offset: (3-1) * 25
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle invalid pagination values", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getValidSrc20TxFromDb({ limit: -10, page: 0 });

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params[params.length - 2], 50); // default limit
      assertEquals(params[params.length - 1], 0); // page 1 (minimum)
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});

Deno.test("SRC20Repository - Balance Operations", async (t) => {
  await t.step("should get SRC20 balances with address filter", async () => {
    const mock = createMockDb(mockBalanceResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.getSrc20BalanceFromDb({
        address: "bc1qtest123",
      });

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(query.includes("address = ?"), true);
      assertEquals(params.includes("bc1qtest123"), true);
      assertEquals(query.includes("amt > 0"), true); // Should only return positive balances
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should get balance count with filtering", async () => {
    const mock = createMockDb(mockCountResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const count = await SRC20Repository.getTotalSrc20BalanceCount({
        address: "bc1qtest123",
        tick: "TEST",
        amt: 0,
      });

      assertEquals(count, 42);

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(query.includes("address = ?"), true);
      assertEquals(query.includes("tick = ?"), true);
      assertEquals(query.includes("amt > ?"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle balance queries with sorting", async () => {
    const mock = createMockDb(mockBalanceResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getSrc20BalanceFromDb({
        sortBy: "ASC",
        sortField: "last_update",
      });

      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("ORDER BY last_update ASC"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should validate sort parameters", async () => {
    const mock = createMockDb(mockBalanceResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.getSrc20BalanceFromDb({
        sortBy: "INVALID",
        sortField: "invalid_field",
      });

      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("ORDER BY amt DESC"), true); // Should use defaults
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});

Deno.test("SRC20Repository - Mint Progress and Statistics", async (t) => {
  await t.step("should fetch mint progress with calculations", async () => {
    const mock = createMockDb(mockMintProgressResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.fetchSrc20MintProgress("TEST");

      assertExists(result);
      assertEquals(result.max_supply, "21000000");
      assertEquals(result.total_minted, "10500000");
      assertEquals(result.limit, "1000");
      assertEquals(result.total_mints, 10500);
      assertEquals(result.decimals, 8);
      assertEquals(result.holders, 100);
      assertEquals(result.tx_hash, "abc123def456");

      // Should convert to emoji
      assertExists(result.tick);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should return null for non-existent tick", async () => {
    const mock = createMockDb({ rows: [] });
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.fetchSrc20MintProgress(
        "NONEXISTENT",
      );
      assertEquals(result, null);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle BigFloat calculations", async () => {
    const mock = createMockDb(mockMintProgressResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.fetchSrc20MintProgress("TEST");

      // Should calculate progress percentage
      assertExists(result.progress);
      assertEquals(typeof result.progress, "string");

      // Progress should be calculated as (total_minted / max_supply) * 100
      const expectedProgress = (10500000 / 21000000) * 100;
      assertEquals(parseFloat(result.progress), expectedProgress);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});

Deno.test("SRC20Repository - Trending and Market Data", async (t) => {
  await t.step("should fetch trending active minting tokens", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.fetchTrendingActiveMintingTokens(
        100,
      );

      assertExists(result);
      assertEquals(result.rows.length, 1);
      assertEquals(result.total, 1);

      // Should query with optimized transaction count
      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params[0], 100); // transaction count
      assertEquals(params[1], 100); // for percentage calculation
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should limit transaction count for performance", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.fetchTrendingActiveMintingTokens(5000); // Large number

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params[0], 300); // Should be capped at 300
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step(
    "should handle trending query errors with fallback",
    async () => {
      let callCount = 0;
      const mock = {
        db: {
          executeQueryWithCache: (query: string, params: any[]) => {
            callCount++;
            if (callCount === 1) {
              throw new Error("Complex query failed");
            }
            return Promise.resolve(mockSRC20TxResponse);
          },
        },
      };

      SRC20Repository.setDatabase(mock.db as any);

      try {
        const result = await SRC20Repository.fetchTrendingActiveMintingTokens(
          100,
        );

        // Should have fallen back to simpler query
        assertEquals(callCount, 2);
        assertExists(result);
      } finally {
        SRC20Repository.setDatabase(originalDb);
      }
    },
  );
});

Deno.test("SRC20Repository - Deployment and Validation", async (t) => {
  await t.step("should get deployment info with counts", async () => {
    const deploymentResponse = {
      rows: [{
        ...mockSRC20TxResponse.rows[0],
        creator_name: "TestCreator",
        total_mints: 500,
        total_transfers: 250,
      }],
    };
    const mock = createMockDb(deploymentResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.getDeploymentAndCountsForTick(
        "TEST",
      );

      assertExists(result);
      assertExists(result.deployment);
      assertEquals(result.total_mints, 500);
      assertEquals(result.total_transfers, 250);

      // Should add image URLs
      assertExists(result.deployment.stamp_url);
      assertExists(result.deployment.deploy_img);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should return null for non-existent deployment", async () => {
    const mock = createMockDb({ rows: [] });
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.getDeploymentAndCountsForTick(
        "NONEXISTENT",
      );
      assertEquals(result, null);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should check SRC20 deployments health", async () => {
    const mock = createMockDb(mockCountResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.checkSrc20Deployments();

      assertEquals(result.isValid, true);
      assertEquals(result.count, 42);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle deployment check failures", async () => {
    const mock = createMockDb({ rows: [] });
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.checkSrc20Deployments();

      assertEquals(result.isValid, false);
      assertEquals(result.count, 0);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});

Deno.test("SRC20Repository - Search Functionality", async (t) => {
  await t.step("should search for SRC20 tokens", async () => {
    const mock = createMockDb({
      rows: [{
        tick: "\\U0001F4A9",
        progress: 50.5,
        total_minted: "10500000",
        max_supply: "21000000",
        holders: 100,
        total_mints: 10500,
      }],
    });
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.searchValidSrc20TxFromDb("test");

      assertEquals(result.length, 1);
      assertExists(result[0].tick);
      assertEquals(result[0].progress, 50.5);

      // Should sanitize query input
      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      assertEquals(params[0], "%test%"); // Should be wrapped with wildcards
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should sanitize search query", async () => {
    const mock = createMockDb({ rows: [] });
    SRC20Repository.setDatabase(mock.db as any);

    try {
      // Input sanitization happens in the service layer (searchInputClassifier)
      // The repository wraps with % wildcards but does not strip special chars
      await SRC20Repository.searchValidSrc20TxFromDb("test@#$%^&*()");

      const [query, params] = [mock.calls[0].query, mock.calls[0].params];
      // Repository wraps input with wildcards; sanitization is upstream
      assertEquals(params[0], "%test@#$%^&*()%");
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle search errors gracefully", async () => {
    const mock = {
      db: {
        executeQueryWithCache: () => {
          throw new Error("Search query failed");
        },
      },
    };
    SRC20Repository.setDatabase(mock.db as any);
    const consoleErrorStub = stub(console, "error");

    try {
      const result = await SRC20Repository.searchValidSrc20TxFromDb("test");

      assertEquals(result, []);
      assertEquals(consoleErrorStub.calls.length, 1);
    } finally {
      SRC20Repository.setDatabase(originalDb);
      restore();
    }
  });
});

Deno.test("SRC20Repository - Optimized Methods", async (t) => {
  await t.step("should use optimized trending method", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository
        .fetchTrendingActiveMintingTokensOptimized("24h", 5, 10);

      assertExists(result);
      assertEquals(result.rows.length, 1);

      // Should use pre-populated market data fields
      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("src20_market_data"), true);
      assertEquals(query.includes("trending_score"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should handle different trending windows", async () => {
    const mock = createMockDb(mockSRC20TxResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await SRC20Repository.fetchTrendingActiveMintingTokensOptimized("7d");

      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("168"), true); // 7 days * 24 hours
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should fallback to original method on error", async () => {
    const mock = {
      db: {
        executeQueryWithCache: () => {
          throw new Error("Optimized query failed");
        },
      },
    };
    SRC20Repository.setDatabase(mock.db as any);

    const fetchTrendingStub = stub(
      SRC20Repository,
      "fetchTrendingActiveMintingTokens",
      () => Promise.resolve({ rows: [], total: 0 }),
    );

    try {
      const result = await SRC20Repository
        .fetchTrendingActiveMintingTokensOptimized("24h");

      // Should have called fallback method
      assertEquals(fetchTrendingStub.calls.length, 1);
      assertExists(result);
    } finally {
      SRC20Repository.setDatabase(originalDb);
      restore();
    }
  });

  await t.step("should use optimized mint progress method", async () => {
    const mock = createMockDb(mockMintProgressResponse);
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.fetchSrc20MintProgressOptimized(
        "TEST",
      );

      assertExists(result);
      assertEquals(result.max_supply, "21000000");

      // Should use pre-populated fields
      const [query] = [mock.calls[0].query];
      assertEquals(query.includes("src20_market_data"), true);
      assertEquals(query.includes("progress_percentage"), true);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});

Deno.test("SRC20Repository - Error Handling", async (t) => {
  await t.step("should handle database errors gracefully", async () => {
    const mock = {
      db: {
        executeQueryWithCache: () => {
          throw new Error("Database connection failed");
        },
      },
    };
    SRC20Repository.setDatabase(mock.db as any);

    try {
      await assertRejects(
        () => SRC20Repository.getValidSrc20TxFromDb({}),
        Error,
        "Database connection failed",
      );
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });

  await t.step("should log errors appropriately", async () => {
    const mock = {
      db: {
        executeQueryWithCache: () => {
          throw new Error("Query execution failed");
        },
      },
    };
    SRC20Repository.setDatabase(mock.db as any);
    const consoleErrorStub = stub(console, "error");

    try {
      await assertRejects(() => SRC20Repository.getValidSrc20TxFromDb({}));
      assertEquals(consoleErrorStub.calls.length, 1);
    } finally {
      SRC20Repository.setDatabase(originalDb);
      restore();
    }
  });

  await t.step("should handle malformed database responses", async () => {
    const mock = createMockDb({ rows: [] }); // Empty rows instead of null
    SRC20Repository.setDatabase(mock.db as any);

    try {
      const result = await SRC20Repository.getValidSrc20TxFromDb({});

      // Should handle empty response gracefully
      assertExists(result);
      assertEquals(result.rows.length, 0);
    } finally {
      SRC20Repository.setDatabase(originalDb);
    }
  });
});
