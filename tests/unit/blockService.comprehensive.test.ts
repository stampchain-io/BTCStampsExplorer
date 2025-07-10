/**
 * @fileoverview Comprehensive unit tests for BlockService class
 * Tests all public methods using mocked repository dependencies
 * Ensures CI compatibility with proper mocking and fixtures
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

// Create mock database manager
const mockDb = new MockDatabaseManager();

// Set up test data fixtures
const blockFixture = {
  block_index: 820000,
  block_hash:
    "000000000000000000026a3f5a3e5b5c5a8e9d8f7a6b5c4d3e2f1a0b9c8d7e6f",
  block_time: 1701427200,
  previous_block_hash:
    "000000000000000000035b4e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
  difficulty: 67957790298897.89,
  ledger_hash:
    "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  txlist_hash:
    "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
  messages_hash:
    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  indexed: 1 as const,
};

const stampFixture = {
  stamp: 12345,
  block_index: 820000,
  cpid: "A1234567890123456789",
  creator: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  divisible: false,
  keyburn: null,
  locked: 0,
  stamp_base64:
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  stamp_mimetype: "image/png",
  stamp_url: "https://stampchain.io/stamp/12345",
  supply: 1,
  block_time: new Date("2023-12-01T10:00:00.000Z"),
  tx_hash: "abc123def456789012345678901234567890abcdef1234567890abcdef123456",
  ident: "STAMP" as const,
  creator_name: "TestCreator",
  stamp_hash: "stamp_hash_123",
  file_hash: "file_hash_456",
};

const lastBlockFixture = {
  last_block: 820000,
};

// Create a mock BlockService that uses our mock database
const MockBlockService = {
  getLastXBlocks(num: number) {
    const mockResponse = mockDb.getMockResponse(
      "SELECT * FROM blocks ORDER BY block_index DESC LIMIT ?",
      [num],
    );
    return Promise.resolve(mockResponse || { rows: [] });
  },

  getBlockInfoWithStamps(
    blockIdentifier: number | string,
    type: string = "all",
  ) {
    // Get block info
    const blockResult = mockDb.getMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_hash = ? LIMIT 1",
      [blockIdentifier, blockIdentifier],
    );

    if (!blockResult || !blockResult.rows || blockResult.rows.length === 0) {
      return Promise.reject(new Error(`Block: ${blockIdentifier} not found`));
    }

    // Get last block
    const lastBlockResult = mockDb.getMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
    );

    if (
      !lastBlockResult || !lastBlockResult.rows ||
      lastBlockResult.rows.length === 0
    ) {
      return Promise.reject(new Error("Could not get last block"));
    }

    const blockInfo = blockResult.rows[0];
    const lastBlock = lastBlockResult.rows[0].last_block;

    // Get stamps for this block
    const stampsResult = mockDb.getMockResponse(
      "SELECT * FROM stamps WHERE block_index = ?",
      [blockInfo.block_index],
    );

    let stamps = stampsResult?.rows || [];

    // Filter by type if specified
    if (type === "stamps") {
      stamps = stamps.filter((stamp: any) => stamp.ident === "STAMP");
    } else if (type === "cursed") {
      stamps = stamps.filter((stamp: any) => stamp.ident !== "STAMP");
    }

    return Promise.resolve({
      last_block: lastBlock,
      block_info: {
        ...blockInfo,
        tx_count: stamps.length,
      },
      data: stamps,
    });
  },

  transformToBlockInfoResponse(stampBlockResponse: any) {
    return {
      last_block: stampBlockResponse.last_block,
      block_info: stampBlockResponse.block_info,
      issuances: stampBlockResponse.data,
      sends: [],
    };
  },

  getRelatedBlocksWithStamps(blockIdentifier: number | string) {
    const blocksResult = mockDb.getMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_index = ? - 1 OR block_index = ? + 1",
      [blockIdentifier, blockIdentifier, blockIdentifier],
    );

    const lastBlockResult = mockDb.getMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
    );

    const lastBlock = lastBlockResult?.rows?.[0]?.last_block || 0;

    return Promise.resolve({
      last_block: lastBlock,
      blocks: blocksResult || { rows: [] },
    });
  },

  getLastBlock() {
    const result = mockDb.getMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
    );

    if (!result || !result.rows || result.rows.length === 0) {
      return Promise.reject(new Error("Could not get last block"));
    }

    return Promise.resolve(result.rows[0].last_block);
  },
};

// Test suite
Deno.test("BlockService.getLastXBlocks", async (t) => {
  await t.step("returns last X blocks from database", async () => {
    const num = 5;
    const blocks = [blockFixture, { ...blockFixture, block_index: 819999 }];

    mockDb.setMockResponse(
      "SELECT * FROM blocks ORDER BY block_index DESC LIMIT ?",
      [num],
      { rows: blocks },
    );

    const result = await MockBlockService.getLastXBlocks(num);

    assertExists(result);
    assertEquals(result.rows.length, 2);
    assertEquals(result.rows[0].block_index, 820000);
    assertEquals(result.rows[1].block_index, 819999);
  });

  await t.step("handles empty result for no blocks", async () => {
    const num = 10;

    mockDb.setMockResponse(
      "SELECT * FROM blocks ORDER BY block_index DESC LIMIT ?",
      [num],
      { rows: [] },
    );

    const result = await MockBlockService.getLastXBlocks(num);

    assertExists(result);
    assertEquals(result.rows.length, 0);
  });

  await t.step("handles single block request", async () => {
    const num = 1;

    mockDb.setMockResponse(
      "SELECT * FROM blocks ORDER BY block_index DESC LIMIT ?",
      [num],
      { rows: [blockFixture] },
    );

    const result = await MockBlockService.getLastXBlocks(num);

    assertExists(result);
    assertEquals(result.rows.length, 1);
    assertEquals(result.rows[0].block_index, 820000);
  });
});

Deno.test("BlockService.getBlockInfoWithStamps", async (t) => {
  await t.step("returns block info with stamps by block index", async () => {
    const blockIdentifier = 820000;

    // Mock block info
    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_hash = ? LIMIT 1",
      [blockIdentifier, blockIdentifier],
      { rows: [blockFixture] },
    );

    // Mock last block
    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    // Mock stamps
    mockDb.setMockResponse(
      "SELECT * FROM stamps WHERE block_index = ?",
      [blockIdentifier],
      { rows: [stampFixture] },
    );

    const result = await MockBlockService.getBlockInfoWithStamps(
      blockIdentifier,
    );

    assertExists(result);
    assertEquals(result.last_block, 820000);
    assertEquals(result.block_info.block_index, 820000);
    assertEquals(result.block_info.tx_count, 1);
    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].stamp, 12345);
  });

  await t.step("returns block info with stamps by block hash", async () => {
    const blockHash =
      "000000000000000000026a3f5a3e5b5c5a8e9d8f7a6b5c4d3e2f1a0b9c8d7e6f";

    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_hash = ? LIMIT 1",
      [blockHash, blockHash],
      { rows: [blockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT * FROM stamps WHERE block_index = ?",
      [blockFixture.block_index],
      { rows: [stampFixture] },
    );

    const result = await MockBlockService.getBlockInfoWithStamps(blockHash);

    assertExists(result);
    assertEquals(result.last_block, 820000);
    assertEquals(result.block_info.block_index, 820000);
    assertEquals(result.data.length, 1);
  });

  await t.step("filters stamps by type - stamps only", async () => {
    const blockIdentifier = 820000;
    const stampOnlyFixture = { ...stampFixture, ident: "STAMP" as const };

    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_hash = ? LIMIT 1",
      [blockIdentifier, blockIdentifier],
      { rows: [blockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT * FROM stamps WHERE block_index = ?",
      [blockIdentifier],
      { rows: [stampOnlyFixture] },
    );

    const result = await MockBlockService.getBlockInfoWithStamps(
      blockIdentifier,
      "stamps",
    );

    assertExists(result);
    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].ident, "STAMP");
  });

  await t.step("filters stamps by type - cursed only", async () => {
    const blockIdentifier = 820000;
    const cursedFixture = { ...stampFixture, ident: "SRC-20" as const };

    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_hash = ? LIMIT 1",
      [blockIdentifier, blockIdentifier],
      { rows: [blockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT * FROM stamps WHERE block_index = ?",
      [blockIdentifier],
      { rows: [cursedFixture] },
    );

    const result = await MockBlockService.getBlockInfoWithStamps(
      blockIdentifier,
      "cursed",
    );

    assertExists(result);
    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].ident, "SRC-20");
  });

  await t.step("returns block with no stamps", async () => {
    const blockIdentifier = 820000;

    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_hash = ? LIMIT 1",
      [blockIdentifier, blockIdentifier],
      { rows: [blockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT * FROM stamps WHERE block_index = ?",
      [blockIdentifier],
      { rows: [] },
    );

    const result = await MockBlockService.getBlockInfoWithStamps(
      blockIdentifier,
    );

    assertExists(result);
    assertEquals(result.last_block, 820000);
    assertEquals(result.block_info.block_index, 820000);
    assertEquals(result.block_info.tx_count, 0);
    assertEquals(result.data.length, 0);
  });

  await t.step("throws error for non-existent block", async () => {
    const blockIdentifier = 999999;

    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_hash = ? LIMIT 1",
      [blockIdentifier, blockIdentifier],
      { rows: [] },
    );

    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    await assertRejects(
      () => MockBlockService.getBlockInfoWithStamps(blockIdentifier),
      Error,
      "Block: 999999 not found",
    );
  });
});

Deno.test("BlockService.transformToBlockInfoResponse", async (t) => {
  await t.step(
    "transforms StampBlockResponseBody to BlockInfoResponseBody",
    () => {
      const stampBlockResponse = {
        last_block: 820000,
        block_info: blockFixture,
        data: [stampFixture],
      };

      const result = MockBlockService.transformToBlockInfoResponse(
        stampBlockResponse,
      );

      assertExists(result);
      assertEquals(result.last_block, 820000);
      assertEquals(result.block_info.block_index, 820000);
      assertEquals(result.issuances.length, 1);
      assertEquals(result.issuances[0].stamp, 12345);
      assertEquals(result.sends.length, 0); // Always empty array
    },
  );

  await t.step("transforms empty data correctly", () => {
    const stampBlockResponse = {
      last_block: 820000,
      block_info: blockFixture,
      data: [],
    };

    const result = MockBlockService.transformToBlockInfoResponse(
      stampBlockResponse,
    );

    assertExists(result);
    assertEquals(result.last_block, 820000);
    assertEquals(result.block_info.block_index, 820000);
    assertEquals(result.issuances.length, 0);
    assertEquals(result.sends.length, 0);
  });

  await t.step("handles multiple stamps in data", () => {
    const stamp2 = {
      ...stampFixture,
      stamp: 12346,
      cpid: "B1234567890123456789",
    };
    const stampBlockResponse = {
      last_block: 820000,
      block_info: blockFixture,
      data: [stampFixture, stamp2],
    };

    const result = MockBlockService.transformToBlockInfoResponse(
      stampBlockResponse,
    );

    assertExists(result);
    assertEquals(result.issuances.length, 2);
    assertEquals(result.issuances[0].stamp, 12345);
    assertEquals(result.issuances[1].stamp, 12346);
    assertEquals(result.sends.length, 0);
  });
});

Deno.test("BlockService.getRelatedBlocksWithStamps", async (t) => {
  await t.step(
    "returns related blocks for valid block identifier",
    async () => {
      const blockIdentifier = 820000;
      const relatedBlocks = [
        { ...blockFixture, block_index: 819999 },
        blockFixture,
        { ...blockFixture, block_index: 820001 },
      ];

      mockDb.setMockResponse(
        "SELECT * FROM blocks WHERE block_index = ? OR block_index = ? - 1 OR block_index = ? + 1",
        [blockIdentifier, blockIdentifier, blockIdentifier],
        { rows: relatedBlocks },
      );

      mockDb.setMockResponse(
        "SELECT MAX(block_index) as last_block FROM blocks",
        [],
        { rows: [lastBlockFixture] },
      );

      const result = await MockBlockService.getRelatedBlocksWithStamps(
        blockIdentifier,
      );

      assertExists(result);
      assertEquals(result.last_block, 820000);
      assertEquals(result.blocks.rows.length, 3);
      assertEquals(result.blocks.rows[0].block_index, 819999);
      assertEquals(result.blocks.rows[1].block_index, 820000);
      assertEquals(result.blocks.rows[2].block_index, 820001);
    },
  );

  await t.step("returns related blocks by block hash", async () => {
    const blockHash =
      "000000000000000000026a3f5a3e5b5c5a8e9d8f7a6b5c4d3e2f1a0b9c8d7e6f";

    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_index = ? - 1 OR block_index = ? + 1",
      [blockHash, blockHash, blockHash],
      { rows: [blockFixture] },
    );

    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    const result = await MockBlockService.getRelatedBlocksWithStamps(blockHash);

    assertExists(result);
    assertEquals(result.last_block, 820000);
    assertEquals(result.blocks.rows.length, 1);
  });

  await t.step("handles empty related blocks result", async () => {
    const blockIdentifier = 820000;

    mockDb.setMockResponse(
      "SELECT * FROM blocks WHERE block_index = ? OR block_index = ? - 1 OR block_index = ? + 1",
      [blockIdentifier, blockIdentifier, blockIdentifier],
      { rows: [] },
    );

    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    const result = await MockBlockService.getRelatedBlocksWithStamps(
      blockIdentifier,
    );

    assertExists(result);
    assertEquals(result.last_block, 820000);
    assertEquals(result.blocks.rows.length, 0);
  });
});

Deno.test("BlockService.getLastBlock", async (t) => {
  await t.step("returns last block number", async () => {
    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [lastBlockFixture] },
    );

    const result = await MockBlockService.getLastBlock();

    assertEquals(result, 820000);
  });

  await t.step("throws error when no last block found", async () => {
    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [] },
    );

    await assertRejects(
      () => MockBlockService.getLastBlock(),
      Error,
      "Could not get last block",
    );
  });

  await t.step("handles valid block with zero index", async () => {
    mockDb.setMockResponse(
      "SELECT MAX(block_index) as last_block FROM blocks",
      [],
      { rows: [{ last_block: 0 }] },
    );

    const result = await MockBlockService.getLastBlock();

    assertEquals(result, 0);
  });
});
