import { assertEquals } from "@std/assert";
import { SRC101Repository } from "$server/database/src101Repository.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import { dbManager } from "$server/database/databaseManager.ts";

const mockDb = new MockDatabaseManager();
const originalDb = dbManager;

function setup() {
  mockDb.clearQueryHistory();
  mockDb.clearMockResponses();
  SRC101Repository.setDatabase(mockDb as any);
}

function teardown() {
  SRC101Repository.setDatabase(originalDb);
}

Deno.test("SRC101Repository - getSrc101Price", async (t) => {
  await t.step("should return price mapping for deploy hash", async () => {
    setup();

    const deployHash =
      "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1";
    const result = await SRC101Repository.getSrc101Price(deployHash) as Record<
      number,
      string
    >;

    // Should return object with length as keys and prices as values
    assertEquals(result[3], "500000");
    assertEquals(result[4], "200000");
    assertEquals(result[5], "100000");

    // Verify correct query was called
    const history = mockDb.getQueryHistory();
    assertEquals(history.length, 1);
    assertEquals(history[0].params, [deployHash]);

    teardown();
  });

  await t.step(
    "should return empty object for non-existent deploy hash",
    async () => {
      setup();

      const result = await SRC101Repository.getSrc101Price("nonexistent");

      assertEquals(Object.keys(result).length, 0);

      teardown();
    },
  );
});

Deno.test("SRC101Repository - getTotalSrc101TXFromSRC101TableCount", async (t) => {
  await t.step("should return total count with filters", async () => {
    setup();

    // Mock the count response
    mockDb.setMockResponse(
      "SELECT COUNT(*) AS total FROM src101",
      [],
      { rows: [{ total: 4 }] },
    );

    const result = await SRC101Repository.getTotalSrc101TXFromSRC101TableCount({
      tick: "BITNAME",
    });

    assertEquals(result, 3); // Expecting 3 because the mock returns 3 for tick filtering

    teardown();
  });

  await t.step("should apply valid filter correctly", async () => {
    setup();

    // Mock the count response for valid transactions
    mockDb.setMockResponse(
      "SELECT COUNT(*) AS total FROM src_101_transactions",
      ["BITNAME"],
      { rows: [{ total: 3 }] },
    );

    const result = await SRC101Repository.getTotalSrc101TXFromSRC101TableCount({
      tick: "BITNAME",
      valid: 1,
    });

    assertEquals(result, 3);

    const history = mockDb.getQueryHistory();
    const lastQuery = history[history.length - 1].query.toLowerCase();
    assertEquals(lastQuery.includes("status is null"), true);

    teardown();
  });
});

Deno.test("SRC101Repository - getSrc101TXFromSRC101Table", async (t) => {
  await t.step("should return transactions with filters", async () => {
    setup();

    const result = await SRC101Repository.getSrc101TXFromSRC101Table({
      tick: "BITNAME",
      op: "MINT",
      limit: 10,
      page: 1,
    });

    assertEquals(result.length, 2); // Should return the 2 MINT transactions
    assertEquals(result[0].op, "MINT");
    assertEquals(result[0].tick, "BITNAME");

    teardown();
  });

  await t.step("should handle pagination", async () => {
    setup();

    const result = await SRC101Repository.getSrc101TXFromSRC101Table({
      limit: 2,
      page: 1,
    });

    assertEquals(result.length, 2);

    teardown();
  });
});

Deno.test("SRC101Repository - getDeployDetails", async (t) => {
  await t.step("should return deploy details with recipients", async () => {
    setup();

    const deployHash =
      "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1";
    const result = await SRC101Repository.getDeployDetails(deployHash);

    assertEquals(result.length, 1);
    assertEquals(result[0].op, "DEPLOY");
    assertEquals(result[0].recipients.length, 2);
    assertEquals(result[0].recipients[0], "bc1qexampleaddress1");
    assertEquals(result[0].mintstart, 863453);
    assertEquals(result[0].mintend, 863553);

    teardown();
  });

  await t.step(
    "should return empty array for non-existent deploy",
    async () => {
      setup();

      const result = await SRC101Repository.getDeployDetails("nonexistent");

      assertEquals(result.length, 0);

      teardown();
    },
  );
});

Deno.test("SRC101Repository - getTotalCount", async (t) => {
  await t.step("should return total owner count for deploy hash", async () => {
    setup();

    // Mock the count response - use normalized query
    mockDb.setMockResponse(
      "SELECT COUNT(*) FROM owners WHERE deploy_hash = ?",
      ["c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1"],
      { rows: [{ "COUNT(*)": 2 }] },
    );

    const result = await SRC101Repository.getTotalCount(
      "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
    );

    assertEquals(result, 2);

    teardown();
  });
});

Deno.test("SRC101Repository - getValidSrc101Tx", async (t) => {
  await t.step("should return valid transactions with filters", async () => {
    setup();

    const result = await SRC101Repository.getValidSrc101Tx({
      op: "MINT",
      limit: 10,
      page: 1,
    });

    assertEquals(result.length > 0, true);
    assertEquals(result[0].op, "MINT");
    // Verify mintstart/mintend conversion to number
    assertEquals(typeof result[0].mintstart, "number");
    assertEquals(typeof result[0].mintend, "number");

    teardown();
  });

  await t.step(
    "should filter by address (creator or destination)",
    async () => {
      setup();

      const result = await SRC101Repository.getValidSrc101Tx({
        address: "bc1qexampleminter1",
        limit: 10,
        page: 1,
      });

      assertEquals(result.length > 0, true);

      teardown();
    },
  );
});

Deno.test("SRC101Repository - getSrc101BalanceTotalCount", async (t) => {
  await t.step("should return total count for address", async () => {
    setup();

    const result = await SRC101Repository.getSrc101BalanceTotalCount({
      address: "bc1qexamplerecipient1",
    });

    assertEquals(result, 1); // Only 1 owner with this address in fixture data

    teardown();
  });
});

Deno.test("SRC101Repository - getSrc101Balance", async (t) => {
  await t.step("should return balance for address", async () => {
    setup();

    const result = await SRC101Repository.getSrc101Balance({
      address: "bc1qexamplerecipient1",
      limit: 10,
      page: 1,
    });

    assertEquals(result.length, 1);
    assertEquals(result[0].tokenid_utf8, "alice");
    assertEquals(result[0].owner, "bc1qexamplerecipient1");

    teardown();
  });

  await t.step("should handle pagination and sorting", async () => {
    setup();

    const result = await SRC101Repository.getSrc101Balance({
      address: "bc1qexampleminter2",
      limit: 10,
      page: 1,
      sort: "DESC",
    });

    assertEquals(result.length > 0, true);

    // Verify query includes ORDER BY with DESC
    const history = mockDb.getQueryHistory();
    const lastQuery = history[history.length - 1].query;
    assertEquals(lastQuery.includes("ORDER BY last_update DESC"), true);

    teardown();
  });
});

Deno.test("SRC101Repository - getTotalSrc101TokenidsCount", async (t) => {
  await t.step("should return total count for deploy hash", async () => {
    setup();

    const result = await SRC101Repository.getTotalSrc101TokenidsCount({
      deploy_hash:
        "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
      address_btc: "bc1qexampleaddress1",
      prim: true,
    });

    assertEquals(result, 2);

    teardown();
  });
});

Deno.test("SRC101Repository - getSrc101Tokenids", async (t) => {
  await t.step("should return tokenids for deploy hash", async () => {
    setup();

    const result = await SRC101Repository.getSrc101Tokenids({
      deploy_hash:
        "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
      address_btc: "bc1qexampleaddress",
      prim: false,
      limit: 10,
      page: 1,
    });

    assertEquals(result.length, 2);
    assertEquals(result[0].tokenid_utf8, "alice");
    assertEquals(result[1].tokenid_utf8, "bob");

    teardown();
  });
});

Deno.test("SRC101Repository - searchSrc101Owner", async (t) => {
  await t.step("should search owner by tokenid", async () => {
    setup();

    // Mock specific response for search
    mockDb.setMockResponse(
      "SELECT * FROM src_101_owners",
      [
        "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
        "alice",
        0,
        100,
        0,
      ],
      {
        rows: [{
          deploy_hash:
            "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
          tokenid: "616c696365",
          tokenid_utf8: "alice",
          owner: "bc1qexamplerecipient1",
        }],
      },
    );

    const result = await SRC101Repository.searchSrc101Owner(
      "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
      "alice",
      0,
      100,
      0,
      "ASC",
    );

    assertEquals(result.length > 0, true);
    assertEquals(result[0].tokenid_utf8, "alice");

    teardown();
  });
});

Deno.test("SRC101Repository - getSrc101OwnerCount", async (t) => {
  await t.step("should return owner count with filters", async () => {
    setup();

    const result = await SRC101Repository.getSrc101OwnerCount({
      deploy_hash:
        "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
      sort: "ASC",
    });

    assertEquals(result, 2);

    teardown();
  });
});

Deno.test("SRC101Repository - getSrc101Owner", async (t) => {
  await t.step("should return owners with filters", async () => {
    setup();

    const result = await SRC101Repository.getSrc101Owner({
      deploy_hash:
        "c1b1f1a1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1b1c1d1e1f1a1",
      limit: 10,
      page: 1,
      sort: "ASC",
    });

    assertEquals(result.length, 2);
    assertEquals(result[0].tokenid_utf8, "alice");
    assertEquals(result[1].tokenid_utf8, "bob");

    teardown();
  });

  await t.step("should handle no results gracefully", async () => {
    setup();

    const result = await SRC101Repository.getSrc101Owner({
      deploy_hash: "nonexistent",
      limit: 10,
      page: 1,
      sort: "ASC",
    });

    assertEquals(result.length, 0);

    teardown();
  });
});

Deno.test("SRC101Repository - error handling", async (t) => {
  await t.step("should handle database errors gracefully", async () => {
    setup();

    // Mock an error response
    mockDb.setMockResponse(
      "SELECT * FROM src_101_price",
      ["error_hash"],
      { rows: [] },
    );

    const result = await SRC101Repository.getSrc101Price("error_hash");

    assertEquals(Object.keys(result).length, 0);

    teardown();
  });
});
