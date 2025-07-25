/**
 * Unit tests for Tool Endpoint Adapters
 *
 * Tests the adapter interface implementations for proper request building,
 * response parsing, and error handling.
 */

import {
  SRC101TransactionOptions,
  SRC20TransactionOptions,
  StampTransactionOptions,
  ToolResponseError,
  ToolValidationError,
} from "$lib/types/toolEndpointAdapter.ts";
import {
  DefaultToolEndpointAdapterFactory,
  isSRC101TransactionOptions,
  isSRC20TransactionOptions,
  isStampTransactionOptions,
  SRC101ToolAdapter,
  SRC20ToolAdapter,
  StampToolAdapter,
} from "$lib/utils/api/adapters/toolEndpointAdapters.ts";
import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

describe("StampToolAdapter", () => {
  const adapter = new StampToolAdapter();

  const validStampOptions: StampTransactionOptions = {
    walletAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    file:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    filename: "test.png",
    fileSize: 100,
    quantity: 1,
    locked: true,
    divisible: false,
    feeRate: 10,
    dryRun: true,
  };

  it("should build correct request body", () => {
    const requestBody = adapter.buildRequestBody(validStampOptions);

    assertEquals(requestBody.sourceWallet, validStampOptions.walletAddress);
    assertEquals(requestBody.filename, validStampOptions.filename);
    assertEquals(requestBody.file, validStampOptions.file);
    assertEquals(requestBody.qty, validStampOptions.quantity);
    assertEquals(requestBody.locked, validStampOptions.locked);
    assertEquals(requestBody.divisible, validStampOptions.divisible);
    assertEquals(requestBody.dryRun, validStampOptions.dryRun);
    assertEquals(requestBody.satsPerVB, validStampOptions.feeRate);
  });

  it("should parse valid response correctly", () => {
    const mockResponse = {
      est_tx_size: 290,
      est_miner_fee: 2900,
      total_dust_value: 999,
      total_output_value: 3899,
      is_estimate: true,
      estimation_method: "service_with_dummy_utxos",
      change_value: 7100,
      input_value: 16799,
    };

    const standardResponse = adapter.parseResponse(mockResponse);

    assertEquals(standardResponse.estimatedSize, 290);
    assertEquals(standardResponse.minerFee, 2900);
    assertEquals(standardResponse.dustValue, 999);
    assertEquals(standardResponse.totalCost, 3899);
    assertEquals(standardResponse.isEstimate, true);
    assertEquals(standardResponse.estimationMethod, "service_with_dummy_utxos");
    assertEquals(standardResponse.feeRate, 2900 / 290);
    assertEquals(standardResponse.changeValue, 7100);
    assertEquals(standardResponse.inputValue, 16799);
  });

  it("should throw error for invalid response", () => {
    const invalidResponse = { est_tx_size: 290 }; // Missing required fields

    assertThrows(
      () => adapter.parseResponse(invalidResponse),
      ToolResponseError,
      "Missing required fields in stamp response",
    );
  });

  it("should validate options correctly", () => {
    // Valid options should pass
    assertEquals(adapter.validateOptions(validStampOptions), true);

    // Invalid options should throw
    const invalidOptions = { ...validStampOptions, walletAddress: "" };
    assertThrows(
      () => adapter.validateOptions(invalidOptions as StampTransactionOptions),
      ToolValidationError,
      "Invalid stamp transaction options",
    );
  });

  it("should generate consistent cache keys", () => {
    const cacheKey1 = adapter.getCacheKey(validStampOptions);
    const cacheKey2 = adapter.getCacheKey(validStampOptions);

    assertEquals(cacheKey1, cacheKey2);
    assertEquals(typeof cacheKey1, "string");
    assertEquals(cacheKey1.startsWith("stamp:"), true);
  });
});

describe("SRC20ToolAdapter", () => {
  const adapter = new SRC20ToolAdapter();

  const validSRC20Options: SRC20TransactionOptions = {
    walletAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    op: "DEPLOY",
    tick: "TEST",
    max: "1000",
    lim: "10",
    dec: 18,
    feeRate: 10,
    dryRun: true,
  };

  it("should build correct request body for DEPLOY", () => {
    const requestBody = adapter.buildRequestBody(validSRC20Options);

    assertEquals(requestBody.op, "DEPLOY");
    assertEquals(requestBody.tick, "TEST");
    assertEquals(requestBody.sourceAddress, validSRC20Options.walletAddress);
    assertEquals(requestBody.max, "1000");
    assertEquals(requestBody.lim, "10");
    assertEquals(requestBody.dec, 18);
    assertEquals(requestBody.dryRun, true);
    assertEquals(requestBody.satsPerVB, 10);
  });

  it("should parse valid response correctly", () => {
    const mockResponse = {
      est_tx_size: 213,
      est_miner_fee: 2130,
      total_dust_value: 999,
      fee: 3129,
      feeDetails: {
        effectiveFeeRate: 10,
        totalVsize: 213,
      },
      change_value: 4130,
      input_value: 7592,
    };

    const standardResponse = adapter.parseResponse(mockResponse);

    assertEquals(standardResponse.estimatedSize, 213);
    assertEquals(standardResponse.minerFee, 2130);
    assertEquals(standardResponse.dustValue, 999);
    assertEquals(standardResponse.totalCost, 3129);
    assertEquals(standardResponse.isEstimate, true);
    assertEquals(standardResponse.estimationMethod, "real_utxo_selection");
    assertEquals(standardResponse.feeRate, 10);
  });

  it("should validate DEPLOY options correctly", () => {
    assertEquals(adapter.validateOptions(validSRC20Options), true);

    // Missing required DEPLOY fields
    const invalidOptions = { ...validSRC20Options, max: undefined };
    assertThrows(
      () => adapter.validateOptions(invalidOptions as SRC20TransactionOptions),
      ToolValidationError,
    );
  });
});

describe("SRC101ToolAdapter", () => {
  const adapter = new SRC101ToolAdapter();

  const validSRC101Options: SRC101TransactionOptions = {
    walletAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    op: "deploy",
    root: "test.btc",
    feeRate: 10,
    dryRun: true,
  };

  it("should build correct request body for deploy", () => {
    const requestBody = adapter.buildRequestBody(validSRC101Options);

    assertEquals(requestBody.op, "deploy");
    assertEquals(requestBody.root, "test.btc");
    assertEquals(requestBody.sourceAddress, validSRC101Options.walletAddress);
    assertEquals(requestBody.changeAddress, validSRC101Options.walletAddress);
    assertEquals(requestBody.dryRun, true);
    assertEquals(requestBody.feeRate, 10);
  });

  it("should parse valid response correctly", () => {
    const mockResponse = {
      est_miner_fee: 3000,
      total_dust_value: 546,
      total_cost: 3546,
      est_tx_size: 300,
      is_estimate: true,
      estimation_method: "dryRun_calculation",
      feeDetails: {
        effectiveFeeRate: 10,
        estimatedSize: 300,
      },
    };

    const standardResponse = adapter.parseResponse(mockResponse);

    assertEquals(standardResponse.estimatedSize, 300);
    assertEquals(standardResponse.minerFee, 3000);
    assertEquals(standardResponse.dustValue, 546);
    assertEquals(standardResponse.totalCost, 3546);
    assertEquals(standardResponse.isEstimate, true);
    assertEquals(standardResponse.estimationMethod, "dryRun_calculation");
    assertEquals(standardResponse.feeRate, 10);
  });

  it("should validate deploy options correctly", () => {
    assertEquals(adapter.validateOptions(validSRC101Options), true);

    // Missing required deploy fields
    const invalidOptions = { ...validSRC101Options, root: undefined };
    assertThrows(
      () => adapter.validateOptions(invalidOptions as SRC101TransactionOptions),
      ToolValidationError,
    );
  });
});

describe("DefaultToolEndpointAdapterFactory", () => {
  const factory = new DefaultToolEndpointAdapterFactory();

  it("should create adapters for all supported tool types", () => {
    const stampAdapter = factory.createAdapter("stamp");
    const src20Adapter = factory.createAdapter("src20");
    const src101Adapter = factory.createAdapter("src101");

    assertEquals(stampAdapter.toolType, "stamp");
    assertEquals(src20Adapter.toolType, "src20");
    assertEquals(src101Adapter.toolType, "src101");
  });

  it("should return supported tool types", () => {
    const supportedTypes = factory.getSupportedToolTypes();

    assertEquals(supportedTypes.length, 3);
    assertEquals(supportedTypes.includes("stamp"), true);
    assertEquals(supportedTypes.includes("src20"), true);
    assertEquals(supportedTypes.includes("src101"), true);
  });

  it("should throw error for unsupported tool type", () => {
    assertThrows(
      () => factory.createAdapter("invalid" as any),
      Error,
      "No adapter available for tool type",
    );
  });
});

describe("Type Guards", () => {
  const stampOptions: StampTransactionOptions = {
    walletAddress: "bc1qtest",
    file: "data",
    filename: "test.png",
    fileSize: 100,
    quantity: 1,
    locked: true,
    divisible: false,
    feeRate: 10,
    dryRun: true,
  };

  const src20Options: SRC20TransactionOptions = {
    walletAddress: "bc1qtest",
    op: "DEPLOY",
    tick: "TEST",
    max: "1000",
    lim: "10",
    dec: 18,
    feeRate: 10,
    dryRun: true,
  };

  const src101Options: SRC101TransactionOptions = {
    walletAddress: "bc1qtest",
    op: "deploy",
    root: "test.btc",
    feeRate: 10,
    dryRun: true,
  };

  it("should correctly identify stamp options", () => {
    assertEquals(isStampTransactionOptions(stampOptions), true);
    assertEquals(isStampTransactionOptions(src20Options), false);
    assertEquals(isStampTransactionOptions(src101Options), false);
  });

  it("should correctly identify SRC-20 options", () => {
    assertEquals(isSRC20TransactionOptions(src20Options), true);
    assertEquals(isSRC20TransactionOptions(stampOptions), false);
    assertEquals(isSRC20TransactionOptions(src101Options), false);
  });

  it("should correctly identify SRC-101 options", () => {
    assertEquals(isSRC101TransactionOptions(src101Options), true);
    assertEquals(isSRC101TransactionOptions(stampOptions), false);
    assertEquals(isSRC101TransactionOptions(src20Options), false);
  });
});
