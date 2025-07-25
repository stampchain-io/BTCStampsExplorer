/**
 * @fileoverview Comprehensive unit tests for BlockController class
 * Tests all public methods using mocked BlockService dependencies
 * Ensures CI compatibility with proper mocking and fixtures
 */

import { BlockController } from "$server/controller/blockController.ts";
import { assertEquals, assertExists, assertRejects } from "@std/assert";

// Create mocks for BlockService
const mockBlockService = {
  getLastXBlocks: (_num: number) => Promise.resolve([]),
  getBlockInfoWithStamps: (
    _blockIdentifier: number | string,
    _type?: string,
  ) =>
    Promise.resolve({
      last_block: 875000,
      block_info: {
        block_index: 875000,
        block_hash:
          "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054",
        block_time: 1720598400,
        previous_block_hash:
          "00000000000000000002b7c4c1e48d76c5a37902165a270156b7a8d72728a053",
        difficulty: 84381461788831.34,
        ledger_hash: "ledger123",
        txlist_hash: "txlist123",
        messages_hash: "messages123",
        indexed: 1 as const,
        tx_count: 2,
      },
      data: [],
    }),
  transformToBlockInfoResponse: (_stampBlockResponse: any) => ({
    last_block: 875000,
    block_info: {
      block_index: 875000,
      block_hash:
        "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054",
      block_time: 1720598400,
      previous_block_hash:
        "00000000000000000002b7c4c1e48d76c5a37902165a270156b7a8d72728a053",
      difficulty: 84381461788831.34,
      ledger_hash: "ledger123",
      txlist_hash: "txlist123",
      messages_hash: "messages123",
      indexed: 1 as const,
    },
    issuances: [],
    sends: [],
  }),
  getRelatedBlocksWithStamps: (_blockIdentifier: number | string) =>
    Promise.resolve({
      last_block: 875000,
      blocks: [],
    }),
  getLastBlock: () => Promise.resolve(875000),
};

// Helper to create mock stamp data
function createMockStampRow(stamp: number, cpid: string) {
  return {
    stamp,
    block_index: 875000,
    cpid,
    creator: "bc1qaddress123",
    creator_name: "Test Creator",
    divisible: false,
    keyburn: null,
    locked: 0,
    stamp_url: "https://example.com/stamp.png",
    stamp_mimetype: "image/png",
    supply: 1,
    block_time: new Date("2025-07-10T10:00:00.000Z"),
    tx_hash: "tx123",
    ident: "STAMP" as const,
    stamp_hash: "stamphash123",
    file_hash: "filehash123",
    stamp_base64: "base64data",
    unbound_quantity: 1,
  };
}

// Helper to create mock block info response
function createMockBlockInfoResponse(blockIndex: number, stampsCount = 0) {
  const stamps = Array.from(
    { length: stampsCount },
    (_, i) =>
      createMockStampRow(
        i + 1,
        `A${blockIndex}${String(i + 1).padStart(3, "0")}`,
      ),
  );

  return {
    last_block: 875000,
    block_info: {
      block_index: blockIndex,
      block_hash: `000000000000000000${String(blockIndex).padStart(8, "0")}`,
      block_time: 1720598400,
      previous_block_hash: `000000000000000000${
        String(blockIndex - 1).padStart(8, "0")
      }`,
      difficulty: 84381461788831.34,
      ledger_hash: "ledger123",
      txlist_hash: "txlist123",
      messages_hash: "messages123",
      indexed: 1 as const,
      tx_count: stampsCount,
    },
    data: stamps,
  };
}

// Mock BlockService before importing BlockController
const originalBlockService = await import(
  "$server/services/core/blockService.ts"
);

// Store original methods for restoration
const originalMethods = {
  getLastXBlocks: originalBlockService.BlockService.getLastXBlocks,
  getBlockInfoWithStamps:
    originalBlockService.BlockService.getBlockInfoWithStamps,
  transformToBlockInfoResponse:
    originalBlockService.BlockService.transformToBlockInfoResponse,
  getRelatedBlocksWithStamps:
    originalBlockService.BlockService.getRelatedBlocksWithStamps,
  getLastBlock: originalBlockService.BlockService.getLastBlock,
};

// Override BlockService methods with mocks
originalBlockService.BlockService.getLastXBlocks =
  mockBlockService.getLastXBlocks;
originalBlockService.BlockService.getBlockInfoWithStamps =
  mockBlockService.getBlockInfoWithStamps;
originalBlockService.BlockService.transformToBlockInfoResponse =
  mockBlockService.transformToBlockInfoResponse;
originalBlockService.BlockService.getRelatedBlocksWithStamps =
  mockBlockService.getRelatedBlocksWithStamps;
originalBlockService.BlockService.getLastBlock = mockBlockService.getLastBlock;

Deno.test("BlockController.getLastXBlocks", async (t) => {
  await t.step("returns array of blocks", async () => {
    const mockBlocks = [
      { block_index: 875000, block_hash: "hash1", block_time: 1720598400 },
      { block_index: 874999, block_hash: "hash2", block_time: 1720598300 },
    ];

    originalBlockService.BlockService.getLastXBlocks = (num: number) => {
      assertEquals(num, 10);
      return Promise.resolve(mockBlocks);
    };

    const result = await BlockController.getLastXBlocks(10);
    assertEquals(result, mockBlocks);
  });

  await t.step("passes correct number parameter", async () => {
    let capturedNum: number;
    originalBlockService.BlockService.getLastXBlocks = (num: number) => {
      capturedNum = num;
      return Promise.resolve([]);
    };

    await BlockController.getLastXBlocks(5);
    assertEquals(capturedNum!, 5);
  });
});

Deno.test("BlockController.getBlockInfoWithStamps", async (t) => {
  await t.step(
    "returns block info with stamps using number identifier",
    async () => {
      const mockResponse = createMockBlockInfoResponse(875000, 2);

      originalBlockService.BlockService.getBlockInfoWithStamps = (
        blockIdentifier,
        type,
      ) => {
        assertEquals(blockIdentifier, 875000);
        assertEquals(type, "stamps");
        return Promise.resolve(mockResponse);
      };

      const result = await BlockController.getBlockInfoWithStamps(
        875000,
        "stamps",
      );
      assertEquals(result, mockResponse);
    },
  );

  await t.step(
    "returns block info with stamps using string identifier",
    async () => {
      const blockHash =
        "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054";
      const mockResponse = createMockBlockInfoResponse(875000, 1);

      originalBlockService.BlockService.getBlockInfoWithStamps = (
        blockIdentifier,
        type,
      ) => {
        assertEquals(blockIdentifier, blockHash);
        assertEquals(type, "cursed");
        return Promise.resolve(mockResponse);
      };

      const result = await BlockController.getBlockInfoWithStamps(
        blockHash,
        "cursed",
      );
      assertEquals(result, mockResponse);
    },
  );

  await t.step("defaults to 'all' type when not specified", async () => {
    const mockResponse = createMockBlockInfoResponse(875000);

    originalBlockService.BlockService.getBlockInfoWithStamps = (
      blockIdentifier,
      type,
    ) => {
      assertEquals(blockIdentifier, 875000);
      assertEquals(type, "all");
      return Promise.resolve(mockResponse);
    };

    const result = await BlockController.getBlockInfoWithStamps(875000);
    assertEquals(result, mockResponse);
  });
});

Deno.test("BlockController.transformToBlockInfoResponse", async (t) => {
  await t.step(
    "transforms StampBlockResponseBody to BlockInfoResponseBody",
    () => {
      const stampBlockResponse = createMockBlockInfoResponse(875000, 2);
      const mockTransformedResponse = {
        last_block: stampBlockResponse.last_block,
        block_info: stampBlockResponse.block_info,
        issuances: stampBlockResponse.data,
        sends: [],
      };

      originalBlockService.BlockService.transformToBlockInfoResponse = (
        _response,
      ) => {
        assertEquals(_response, stampBlockResponse);
        return mockTransformedResponse;
      };

      const result = BlockController.transformToBlockInfoResponse(
        stampBlockResponse,
      );
      assertEquals(result, mockTransformedResponse);
    },
  );

  await t.step("handles empty data array", () => {
    const stampBlockResponse = createMockBlockInfoResponse(875000, 0);
    const mockTransformedResponse = {
      last_block: stampBlockResponse.last_block,
      block_info: stampBlockResponse.block_info,
      issuances: [],
      sends: [],
    };

    originalBlockService.BlockService.transformToBlockInfoResponse = (
      _response,
    ) => {
      return mockTransformedResponse;
    };

    const result = BlockController.transformToBlockInfoResponse(
      stampBlockResponse,
    );
    assertEquals(result.issuances.length, 0);
    assertEquals(result.sends.length, 0);
  });
});

Deno.test("BlockController.getRelatedBlocksWithStamps", async (t) => {
  await t.step("returns related blocks for number identifier", async () => {
    const mockResponse = {
      last_block: 875000,
      blocks: [
        { block_index: 874999, stamps_count: 5 },
        { block_index: 875001, stamps_count: 3 },
      ],
    };

    originalBlockService.BlockService.getRelatedBlocksWithStamps = (
      blockIdentifier,
    ) => {
      assertEquals(blockIdentifier, 875000);
      return Promise.resolve(mockResponse);
    };

    const result = await BlockController.getRelatedBlocksWithStamps(875000);
    assertEquals(result, mockResponse);
  });

  await t.step("returns related blocks for string identifier", async () => {
    const blockHash =
      "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054";
    const mockResponse = {
      last_block: 875000,
      blocks: [],
    };

    originalBlockService.BlockService.getRelatedBlocksWithStamps = (
      blockIdentifier,
    ) => {
      assertEquals(blockIdentifier, blockHash);
      return Promise.resolve(mockResponse);
    };

    const result = await BlockController.getRelatedBlocksWithStamps(blockHash);
    assertEquals(result, mockResponse);
  });
});

Deno.test("BlockController.getLastBlock", async (t) => {
  await t.step("returns last block number", async () => {
    originalBlockService.BlockService.getLastBlock = () => {
      return Promise.resolve(875000);
    };

    const result = await BlockController.getLastBlock();
    assertEquals(result, 875000);
  });

  await t.step("returns different block numbers", async () => {
    originalBlockService.BlockService.getLastBlock = () => {
      return Promise.resolve(874999);
    };

    const result = await BlockController.getLastBlock();
    assertEquals(result, 874999);
  });
});

Deno.test("BlockController.getBlockPageData", async (t) => {
  await t.step(
    "returns block page data for valid block identifier",
    async () => {
      const blockIndex = 875000;
      const mockStampResponse = createMockBlockInfoResponse(blockIndex, 3);
      const mockRelatedBlocks = {
        last_block: 875000,
        blocks: [{ block_index: 874999, stamps_count: 2 }],
      };
      const mockTransformedBlock = {
        last_block: mockStampResponse.last_block,
        block_info: mockStampResponse.block_info,
        issuances: mockStampResponse.data,
        sends: [],
      };

      originalBlockService.BlockService.getBlockInfoWithStamps = (
        identifier,
        type,
      ) => {
        assertEquals(identifier, blockIndex);
        assertEquals(type, "stamps");
        return Promise.resolve(mockStampResponse);
      };

      originalBlockService.BlockService.getRelatedBlocksWithStamps = (
        identifier,
      ) => {
        assertEquals(identifier, blockIndex);
        return Promise.resolve(mockRelatedBlocks);
      };

      originalBlockService.BlockService.transformToBlockInfoResponse = (
        _response,
      ) => {
        assertEquals(_response, mockStampResponse);
        return mockTransformedBlock;
      };

      const result = await BlockController.getBlockPageData(blockIndex);

      assertExists(result.block);
      assertExists(result.related_blocks);
      assertEquals(result.block, mockTransformedBlock);
      assertEquals(result.related_blocks, mockRelatedBlocks);
    },
  );

  await t.step("uses last block when identifier is invalid", async () => {
    const lastBlock = 875000;
    const mockStampResponse = createMockBlockInfoResponse(lastBlock, 1);
    const mockRelatedBlocks = { last_block: lastBlock, blocks: [] };
    const mockTransformedBlock = {
      last_block: mockStampResponse.last_block,
      block_info: mockStampResponse.block_info,
      issuances: mockStampResponse.data,
      sends: [],
    };

    originalBlockService.BlockService.getLastBlock = () =>
      Promise.resolve(lastBlock);

    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, lastBlock);
      assertEquals(type, "stamps");
      return Promise.resolve(mockStampResponse);
    };

    originalBlockService.BlockService.getRelatedBlocksWithStamps = (
      identifier,
    ) => {
      assertEquals(identifier, lastBlock);
      return Promise.resolve(mockRelatedBlocks);
    };

    originalBlockService.BlockService.transformToBlockInfoResponse = () =>
      mockTransformedBlock;

    // Test with invalid identifier (empty string)
    const result = await BlockController.getBlockPageData("");
    assertEquals(result.block, mockTransformedBlock);
    assertEquals(result.related_blocks, mockRelatedBlocks);
  });

  await t.step("uses last block when identifier is NaN", async () => {
    const lastBlock = 875000;
    originalBlockService.BlockService.getLastBlock = () =>
      Promise.resolve(lastBlock);
    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
    ) => {
      assertEquals(identifier, lastBlock);
      return Promise.resolve(createMockBlockInfoResponse(lastBlock));
    };
    originalBlockService.BlockService.getRelatedBlocksWithStamps = () =>
      Promise.resolve({ last_block: lastBlock, blocks: [] });
    originalBlockService.BlockService.transformToBlockInfoResponse = () => ({
      last_block: lastBlock,
      block_info: {} as any,
      issuances: [],
      sends: [],
    });

    const result = await BlockController.getBlockPageData("invalid");
    assertExists(result.block);
    assertExists(result.related_blocks);
  });
});

Deno.test("BlockController.getBlockInfoResponse", async (t) => {
  await t.step("returns block info response for valid integer", async () => {
    const blockIndex = 875000;
    const mockStampResponse = createMockBlockInfoResponse(blockIndex, 2);
    const mockTransformedResponse = {
      last_block: mockStampResponse.last_block,
      block_info: mockStampResponse.block_info,
      issuances: mockStampResponse.data,
      sends: [],
    };

    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, blockIndex);
      assertEquals(type, "stamps");
      return Promise.resolve(mockStampResponse);
    };

    originalBlockService.BlockService.transformToBlockInfoResponse = (
      _response,
    ) => {
      assertEquals(_response, mockStampResponse);
      return mockTransformedResponse;
    };

    const result = await BlockController.getBlockInfoResponse(
      blockIndex,
      "stamps",
    );
    assertEquals(result, mockTransformedResponse);
  });

  await t.step(
    "returns block info response for valid 64-character hex string",
    async () => {
      const blockHash =
        "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054";
      const mockStampResponse = createMockBlockInfoResponse(875000, 1);
      const mockTransformedResponse = {
        last_block: mockStampResponse.last_block,
        block_info: mockStampResponse.block_info,
        issuances: mockStampResponse.data,
        sends: [],
      };

      originalBlockService.BlockService.getBlockInfoWithStamps = (
        identifier,
        type,
      ) => {
        assertEquals(identifier, blockHash);
        assertEquals(type, "cursed");
        return Promise.resolve(mockStampResponse);
      };

      originalBlockService.BlockService.transformToBlockInfoResponse = () =>
        mockTransformedResponse;

      const result = await BlockController.getBlockInfoResponse(
        blockHash,
        "cursed",
      );
      assertEquals(result, mockTransformedResponse);
    },
  );

  await t.step("defaults to 'all' type when not specified", async () => {
    const blockIndex = 875000;
    originalBlockService.BlockService.getBlockInfoWithStamps = (
      _identifier,
      type,
    ) => {
      assertEquals(type, "all");
      return Promise.resolve(createMockBlockInfoResponse(blockIndex));
    };
    originalBlockService.BlockService.transformToBlockInfoResponse = () => ({
      last_block: 875000,
      block_info: {} as any,
      issuances: [],
      sends: [],
    });

    await BlockController.getBlockInfoResponse(blockIndex);
  });

  await t.step("throws error for invalid block identifier", async () => {
    await assertRejects(
      () => BlockController.getBlockInfoResponse("invalid"),
      Error,
      "Invalid input: invalid. It must be a valid block index (integer) or block hash (64 character string).",
    );
  });

  await t.step("throws error for invalid hex string (too short)", async () => {
    await assertRejects(
      () => BlockController.getBlockInfoResponse("abc123"),
      Error,
      "Invalid input: abc123. It must be a valid block index (integer) or block hash (64 character string).",
    );
  });

  await t.step("throws error for invalid hex string (too long)", async () => {
    const longHex =
      "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054extra";
    await assertRejects(
      () => BlockController.getBlockInfoResponse(longHex),
      Error,
      `Invalid input: ${longHex}. It must be a valid block index (integer) or block hash (64 character string).`,
    );
  });
});

Deno.test("BlockController.getRelatedBlockInfoResponse", async (t) => {
  await t.step("returns related block info for valid integer", async () => {
    const blockIndex = 875000;
    const mockStampResponse = createMockBlockInfoResponse(blockIndex, 2);
    const mockTransformedResponse = {
      last_block: mockStampResponse.last_block,
      block_info: mockStampResponse.block_info,
      issuances: mockStampResponse.data,
      sends: [],
    };

    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, blockIndex);
      assertEquals(type, "stamps");
      return Promise.resolve(mockStampResponse);
    };

    originalBlockService.BlockService.transformToBlockInfoResponse = (
      _response,
    ) => {
      assertEquals(_response, mockStampResponse);
      return mockTransformedResponse;
    };

    const result = await BlockController.getRelatedBlockInfoResponse(
      blockIndex,
      "stamps",
    );
    assertEquals(result, mockTransformedResponse);
  });

  await t.step("returns related block info for valid hex string", async () => {
    const blockHash =
      "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054";
    const mockStampResponse = createMockBlockInfoResponse(875000, 1);
    const mockTransformedResponse = {
      last_block: mockStampResponse.last_block,
      block_info: mockStampResponse.block_info,
      issuances: mockStampResponse.data,
      sends: [],
    };

    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, blockHash);
      assertEquals(type, "cursed");
      return Promise.resolve(mockStampResponse);
    };

    originalBlockService.BlockService.transformToBlockInfoResponse = () =>
      mockTransformedResponse;

    const result = await BlockController.getRelatedBlockInfoResponse(
      blockHash,
      "cursed",
    );
    assertEquals(result, mockTransformedResponse);
  });

  await t.step("throws error for invalid block identifier", async () => {
    await assertRejects(
      () => BlockController.getRelatedBlockInfoResponse("invalid", "stamps"),
      Error,
      "Invalid argument provided. Must be an integer or 32 byte hex string.",
    );
  });

  await t.step("throws error for invalid type", async () => {
    await assertRejects(
      () => BlockController.getRelatedBlockInfoResponse("abc123", "stamps"),
      Error,
      "Invalid argument provided. Must be an integer or 32 byte hex string.",
    );
  });
});

Deno.test("BlockController.getSharedBlockWithStamps", async (t) => {
  await t.step("uses last block when blockIndex is undefined", async () => {
    const lastBlock = 875000;
    const mockResponse = createMockBlockInfoResponse(lastBlock, 2);

    originalBlockService.BlockService.getLastBlock = () =>
      Promise.resolve(lastBlock);
    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, lastBlock);
      assertEquals(type, "stamps");
      return Promise.resolve(mockResponse);
    };

    const result = await BlockController.getSharedBlockWithStamps(
      undefined,
      "stamps",
    );
    assertEquals(result, mockResponse);
  });

  await t.step("uses provided numeric string block index", async () => {
    const blockIndex = "875000";
    const mockResponse = createMockBlockInfoResponse(875000, 1);

    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, 875000); // Should be converted to number
      assertEquals(type, "cursed");
      return Promise.resolve(mockResponse);
    };

    const result = await BlockController.getSharedBlockWithStamps(
      blockIndex,
      "cursed",
    );
    assertEquals(result, mockResponse);
  });

  await t.step("uses provided hex string block index", async () => {
    const blockHash =
      "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054";
    const mockResponse = createMockBlockInfoResponse(875000, 3);

    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, blockHash); // Should remain as string
      assertEquals(type, "stamps");
      return Promise.resolve(mockResponse);
    };

    const result = await BlockController.getSharedBlockWithStamps(
      blockHash,
      "stamps",
    );
    assertEquals(result, mockResponse);
  });

  await t.step("throws error for invalid block index", async () => {
    await assertRejects(
      () => BlockController.getSharedBlockWithStamps("invalid", "stamps"),
      Error,
      "Invalid input: invalid. It must be a valid block index (integer) or block hash (64 character string).",
    );
  });

  await t.step("throws error for invalid hex string", async () => {
    await assertRejects(
      () => BlockController.getSharedBlockWithStamps("abc123", "cursed"),
      Error,
      "Invalid input: abc123. It must be a valid block index (integer) or block hash (64 character string).",
    );
  });

  await t.step("handles numeric strings correctly", async () => {
    const blockIndexStr = "123456";
    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, 123456); // Should be converted to number
      assertEquals(type, "stamps");
      return Promise.resolve(createMockBlockInfoResponse(123456));
    };

    await BlockController.getSharedBlockWithStamps(blockIndexStr, "stamps");
  });

  await t.step("handles hex strings correctly", async () => {
    const blockHash =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    originalBlockService.BlockService.getBlockInfoWithStamps = (
      identifier,
      type,
    ) => {
      assertEquals(identifier, blockHash); // Should remain as string
      assertEquals(type, "cursed");
      return Promise.resolve(createMockBlockInfoResponse(875000));
    };

    await BlockController.getSharedBlockWithStamps(blockHash, "cursed");
  });
});

// Cleanup test
Deno.test("Cleanup BlockController tests", () => {
  // Restore original BlockService methods
  originalBlockService.BlockService.getLastXBlocks =
    originalMethods.getLastXBlocks;
  originalBlockService.BlockService.getBlockInfoWithStamps =
    originalMethods.getBlockInfoWithStamps;
  originalBlockService.BlockService.transformToBlockInfoResponse =
    originalMethods.transformToBlockInfoResponse;
  originalBlockService.BlockService.getRelatedBlocksWithStamps =
    originalMethods.getRelatedBlocksWithStamps;
  originalBlockService.BlockService.getLastBlock = originalMethods.getLastBlock;
});
