/**
 * Comprehensive unit tests for SRC20TransactionService
 * Covers all methods including handleOperation and prepare methods for deploy, mint, transfer
 */

import { assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";
import { restore, stub } from "@std/testing@1.0.14/mock";
import { SRC20TransactionService } from "$server/services/src20/transactionService.ts";
// Import from operations directly to avoid circular dependency
import { SRC20OperationService } from "$server/services/src20/operations/src20Operations.ts";
// TX and TXError types are used for type checking in the service but not directly in tests
import type { InputData } from "$types/index.d.ts";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";

// Test fixtures
const mockDeployResult = {
  hex:
    "02000000010000000000000000000000000000000000000000000000000000000000000000ffffffff00ffffffff0100000000000000000000000000",
  est_miner_fee: "2500",
  change_value: "47500",
};

const mockMintResult = {
  base64:
    "cHNidP8BAFUCAAAAAT1N0pJUPgABw7QS6c0fzxLxz5sDcBsOPCF9HYXJOzgXAAAAAP////8BoIYBAAAAAAAWABSfbM",
  est_miner_fee: "1500",
  change_value: "98500",
};

const mockTransferResult = {
  hex:
    "020000000200000000000000000000000000000000000000000000000000000000000000000000000000ffffffff0000000000000000000000000000000000000000000000000000000000000000010000006a47304402207c3b6f30195b3084db2328b24539b59e399dd8c96a38e8c3df20bc7e8ab5e10e02205c3ac436a8b6d1e2cf96a1de5c72e9b2e9e83c6d8f1a83b40e0bb8f64fa77f4012103b0bd634231b362a2d87f9f13e59e7e0e868e3e93fb48f3f6e97d0e8e1f7ba5afffffffff02005ed0b20000000017a914f8b6b3c3f3e3c3b3f3e3c3b3f3e3c3b3f3e3c3b387401f00000000000017a914f8b6b3c3f3e3c3b3f3e3c3b3f3e3c3b3f3e3c3b387024730440220499a7e7f8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d02207f8d7d8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d8c7f8d7d012103e3c3b3f3e3c3b3f3e3c3b3f3e3c3b3f3e3c3b3f3e3c3b3f3e3c3b3f3e3c3b3f00000000",
  est_miner_fee: "2000",
  change_value: "35000",
};

const mockErrorResult = {
  error: "Insufficient funds",
};

// Valid test input data
const validDeployBody: InputData = {
  op: "deploy",
  sourceAddress: "bc1qtest123456789",
  toAddress: "bc1qtest987654321",
  changeAddress: "bc1qchangeaddress1",
  tick: "TEST",
  feeRate: 10,
  max: "1000000",
  lim: "1000",
  dec: 18,
  x: "https://x.com/test",
  web: "https://test.com",
  email: "test@example.com",
  tg: "@testchannel",
  description: "Test token description",
};

const validMintBody: InputData = {
  op: "mint",
  sourceAddress: "bc1qtest123456789",
  toAddress: "bc1qtest987654321",
  changeAddress: "bc1qchangeaddress1",
  tick: "TEST",
  feeRate: 15,
  amt: "1000",
};

const validTransferBody: InputData = {
  op: "transfer",
  sourceAddress: "bc1qtest123456789",
  toAddress: "bc1qtest987654321",
  fromAddress: "bc1qfromaddress123",
  changeAddress: "bc1qchangeaddress1",
  tick: "TEST",
  feeRate: 20,
  amt: "500",
};

describe("SRC20TransactionService - Comprehensive Tests", () => {
  let loggerDebugStub: ReturnType<typeof stub>;
  let loggerErrorStub: ReturnType<typeof stub>;

  beforeEach(() => {
    // Stub logger methods to avoid console output during tests
    loggerDebugStub = stub(logger, "debug", () => {});
    loggerErrorStub = stub(logger, "error", () => {});
  });

  afterEach(() => {
    restore();
  });

  describe("handleOperation - Deploy", () => {
    it("should successfully handle deploy operation", async () => {
      const deploySRC20Stub = stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockDeployResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "deploy",
        validDeployBody,
      );

      assertEquals(result, {
        psbtHex: mockDeployResult.hex,
        fee: 2500,
        change: 47500,
      });

      assertEquals(deploySRC20Stub.calls.length, 1);
      const callArgs = deploySRC20Stub.calls[0].args[0];
      assertEquals(callArgs.network, "mainnet");
      assertEquals(callArgs.tick, "TEST");
      assertEquals(callArgs.max, "1000000");
      assertEquals(callArgs.lim, "1000");
      assertEquals(callArgs.dec, 18);
      assertEquals(callArgs.x, "https://x.com/test");
      assertEquals(callArgs.web, "https://test.com");
      assertEquals(callArgs.email, "test@example.com");
      assertEquals(callArgs.tg, "@testchannel");
      assertEquals(callArgs.description, "Test token description");
    });

    it("should handle deploy operation with minimal parameters", async () => {
      const minimalDeployBody: InputData = {
        op: "deploy",
        sourceAddress: "bc1qtest123456789",
        toAddress: "bc1qtest987654321",
        changeAddress: "bc1qchangeaddress1",
        tick: "MIN",
        feeRate: 5,
      };

      const deploySRC20Stub = stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockDeployResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "deploy",
        minimalDeployBody,
      );

      assertEquals(result, {
        psbtHex: mockDeployResult.hex,
        fee: 2500,
        change: 47500,
      });

      const callArgs = deploySRC20Stub.calls[0].args[0];
      assertEquals(callArgs.max, "");
      assertEquals(callArgs.lim, "");
      assertEquals(callArgs.dec, 18); // Default value
      assertEquals(callArgs.x, "");
      assertEquals(callArgs.web, "");
      assertEquals(callArgs.email, "");
      assertEquals(callArgs.tg, "");
      assertEquals(callArgs.description, "");
    });

    it("should handle deploy operation with desc instead of description", async () => {
      const deployBodyWithDesc: InputData = {
        ...validDeployBody,
        desc: "Short description",
        description: undefined,
      };

      const deploySRC20Stub = stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockDeployResult),
      );

      await SRC20TransactionService.handleOperation(
        "deploy",
        deployBodyWithDesc,
      );

      const callArgs = deploySRC20Stub.calls[0].args[0];
      assertEquals(callArgs.description, "Short description");
    });

    it("should handle deploy operation error", async () => {
      stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockErrorResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "deploy",
        validDeployBody,
      );

      assertEquals(result, { error: "Insufficient funds" });
    });
  });

  describe("handleOperation - Mint", () => {
    it("should successfully handle mint operation", async () => {
      const mintSRC20Stub = stub(
        SRC20OperationService,
        "mintSRC20",
        () => Promise.resolve(mockMintResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "mint",
        validMintBody,
      );

      assertEquals(result, {
        psbtHex: mockMintResult.base64,
        fee: 1500,
        change: 98500,
      });

      assertEquals(mintSRC20Stub.calls.length, 1);
      const callArgs = mintSRC20Stub.calls[0].args[0];
      assertEquals(callArgs.network, "mainnet");
      assertEquals(callArgs.tick, "TEST");
      assertEquals(callArgs.amt, "1000");
      assertEquals(callArgs.feeRate, 15);
    });

    it("should return error when amt is missing for mint", async () => {
      const invalidMintBody: InputData = {
        ...validMintBody,
        amt: undefined,
      };

      const result = await SRC20TransactionService.handleOperation(
        "mint",
        invalidMintBody,
      );

      assertEquals(result, {
        error: "Error: amt is required for mint operation",
      });
    });

    it("should handle mint operation error from service", async () => {
      stub(
        SRC20OperationService,
        "mintSRC20",
        () => Promise.resolve(mockErrorResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "mint",
        validMintBody,
      );

      assertEquals(result, { error: "Insufficient funds" });
    });

    it("should handle mint with zero amount", async () => {
      const mintBodyWithZero: InputData = {
        ...validMintBody,
        amt: "0",
      };

      const mintSRC20Stub = stub(
        SRC20OperationService,
        "mintSRC20",
        () => Promise.resolve(mockMintResult),
      );

      await SRC20TransactionService.handleOperation(
        "mint",
        mintBodyWithZero,
      );

      const callArgs = mintSRC20Stub.calls[0].args[0];
      assertEquals(callArgs.amt, "0");
    });
  });

  describe("handleOperation - Transfer", () => {
    it("should successfully handle transfer operation", async () => {
      const transferSRC20Stub = stub(
        SRC20OperationService,
        "transferSRC20",
        () => Promise.resolve(mockTransferResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "transfer",
        validTransferBody,
      );

      assertEquals(result, {
        psbtHex: mockTransferResult.hex,
        fee: 2000,
        change: 35000,
      });

      assertEquals(transferSRC20Stub.calls.length, 1);
      const callArgs = transferSRC20Stub.calls[0].args[0];
      assertEquals(callArgs.network, "mainnet");
      assertEquals(callArgs.tick, "TEST");
      assertEquals(callArgs.amt, "500");
      assertEquals(callArgs.fromAddress, "bc1qfromaddress123");
      assertEquals(callArgs.feeRate, 20);
    });

    it("should return error when fromAddress is missing for transfer", async () => {
      const invalidTransferBody: InputData = {
        ...validTransferBody,
        fromAddress: undefined,
      };

      const result = await SRC20TransactionService.handleOperation(
        "transfer",
        invalidTransferBody,
      );

      assertEquals(result, {
        error: "Error: fromAddress is required for transfer operation",
      });
    });

    it("should return error when amt is missing for transfer", async () => {
      const invalidTransferBody: InputData = {
        ...validTransferBody,
        amt: undefined,
      };

      const result = await SRC20TransactionService.handleOperation(
        "transfer",
        invalidTransferBody,
      );

      assertEquals(result, {
        error: "Error: amt is required for transfer operation",
      });
    });

    it("should handle transfer with empty fromAddress string", async () => {
      const transferBodyEmptyFrom: InputData = {
        ...validTransferBody,
        fromAddress: "",
      };

      const result = await SRC20TransactionService.handleOperation(
        "transfer",
        transferBodyEmptyFrom,
      );

      assertEquals(result, {
        error: "Error: fromAddress is required for transfer operation",
      });
    });

    it("should handle transfer operation error from service", async () => {
      stub(
        SRC20OperationService,
        "transferSRC20",
        () => Promise.resolve(mockErrorResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "transfer",
        validTransferBody,
      );

      assertEquals(result, { error: "Insufficient funds" });
    });
  });

  describe("handleOperation - Invalid Operation", () => {
    it("should return error for invalid operation", async () => {
      const result = await SRC20TransactionService.handleOperation(
        "invalid" as any,
        validDeployBody,
      );

      assertEquals(result, { error: "Invalid operation" });
    });
  });

  describe("Result Mapping", () => {
    it("should handle result with only hex field", async () => {
      const hexOnlyResult = {
        hex: "0200000001...",
        est_miner_fee: "1000",
        change_value: "5000",
      };

      stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(hexOnlyResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "deploy",
        validDeployBody,
      );

      assertEquals(result, {
        psbtHex: "0200000001...",
        fee: 1000,
        change: 5000,
      });
    });

    it("should handle result with only base64 field", async () => {
      const base64OnlyResult = {
        base64: "cHNidP8BAFUCAAAAAT...",
        est_miner_fee: "2000",
        change_value: "10000",
      };

      stub(
        SRC20OperationService,
        "mintSRC20",
        () => Promise.resolve(base64OnlyResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "mint",
        validMintBody,
      );

      assertEquals(result, {
        psbtHex: "cHNidP8BAFUCAAAAAT...",
        fee: 2000,
        change: 10000,
      });
    });

    it("should handle missing fee and change values", async () => {
      const incompleteResult = {
        hex: "0200000001...",
      };

      stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(incompleteResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "deploy",
        validDeployBody,
      );

      assertEquals(result, {
        psbtHex: "0200000001...",
        fee: 0,
        change: 0,
      });
    });

    it("should handle result with neither hex nor base64", async () => {
      const emptyResult = {
        est_miner_fee: "1500",
        change_value: "8500",
      };

      stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(emptyResult),
      );

      const result = await SRC20TransactionService.handleOperation(
        "deploy",
        validDeployBody,
      );

      assertEquals(result, {
        psbtHex: "",
        fee: 1500,
        change: 8500,
      });
    });
  });

  describe("Logger Calls", () => {
    it("should log debug messages during operation", async () => {
      stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockDeployResult),
      );

      await SRC20TransactionService.handleOperation(
        "deploy",
        validDeployBody,
      );

      // Check that debug was called multiple times
      assertEquals(loggerDebugStub.calls.length >= 4, true);

      // Check first debug call
      assertEquals(loggerDebugStub.calls[0].args[0], "stamps");
      assertEquals(
        loggerDebugStub.calls[0].args[1].message,
        "Starting handleOperation",
      );
      assertEquals(loggerDebugStub.calls[0].args[1].operation, "deploy");
    });

    it("should log error messages when operation fails", async () => {
      stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockErrorResult),
      );

      await SRC20TransactionService.handleOperation(
        "deploy",
        validDeployBody,
      );

      // Check that error was logged
      assertEquals(loggerErrorStub.calls.length, 1);
      assertEquals(loggerErrorStub.calls[0].args[0], "stamps");
      assertEquals(loggerErrorStub.calls[0].args[1].message, "Operation error");
      assertEquals(
        loggerErrorStub.calls[0].args[1].error,
        "Insufficient funds",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle numeric values passed as numbers", async () => {
      const numericBody: InputData = {
        ...validDeployBody,
        max: 1000000 as any, // Testing number instead of string
        lim: 1000 as any,
        dec: 8,
      };

      const deploySRC20Stub = stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockDeployResult),
      );

      await SRC20TransactionService.handleOperation(
        "deploy",
        numericBody,
      );

      const callArgs = deploySRC20Stub.calls[0].args[0];
      assertEquals(callArgs.max, "1000000");
      assertEquals(callArgs.lim, "1000");
      assertEquals(callArgs.dec, 8);
    });

    it("should handle undefined optional fields", async () => {
      const undefinedFieldsBody: InputData = {
        op: "deploy",
        sourceAddress: "bc1qtest123456789",
        toAddress: "bc1qtest987654321",
        changeAddress: "bc1qchangeaddress1",
        tick: "UNDEF",
        feeRate: 10,
        max: undefined,
        lim: undefined,
        dec: undefined,
        x: undefined,
        web: undefined,
        email: undefined,
        tg: undefined,
        description: undefined,
      };

      const deploySRC20Stub = stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockDeployResult),
      );

      await SRC20TransactionService.handleOperation(
        "deploy",
        undefinedFieldsBody,
      );

      const callArgs = deploySRC20Stub.calls[0].args[0];
      assertEquals(callArgs.max, "");
      assertEquals(callArgs.lim, "");
      assertEquals(callArgs.dec, 18); // Default value
      assertEquals(callArgs.x, "");
      assertEquals(callArgs.web, "");
      assertEquals(callArgs.email, "");
      assertEquals(callArgs.tg, "");
      assertEquals(callArgs.description, "");
    });

    it("should handle concurrent operations", async () => {
      const deploySRC20Stub = stub(
        SRC20OperationService,
        "deploySRC20",
        () => Promise.resolve(mockDeployResult),
      );

      const mintSRC20Stub = stub(
        SRC20OperationService,
        "mintSRC20",
        () => Promise.resolve(mockMintResult),
      );

      const transferSRC20Stub = stub(
        SRC20OperationService,
        "transferSRC20",
        () => Promise.resolve(mockTransferResult),
      );

      const [deployResult, mintResult, transferResult] = await Promise.all([
        SRC20TransactionService.handleOperation("deploy", validDeployBody),
        SRC20TransactionService.handleOperation("mint", validMintBody),
        SRC20TransactionService.handleOperation("transfer", validTransferBody),
      ]);

      assertEquals(deployResult, {
        psbtHex: mockDeployResult.hex,
        fee: 2500,
        change: 47500,
      });

      assertEquals(mintResult, {
        psbtHex: mockMintResult.base64,
        fee: 1500,
        change: 98500,
      });

      assertEquals(transferResult, {
        psbtHex: mockTransferResult.hex,
        fee: 2000,
        change: 35000,
      });

      assertEquals(deploySRC20Stub.calls.length, 1);
      assertEquals(mintSRC20Stub.calls.length, 1);
      assertEquals(transferSRC20Stub.calls.length, 1);
    });
  });
});
