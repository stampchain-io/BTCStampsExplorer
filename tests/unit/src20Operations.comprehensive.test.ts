/**
 * Comprehensive unit tests for SRC20OperationService
 * Covers all operations: deploy, mint, transfer with edge cases and error handling
 */

import { assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";
import { restore, stub } from "@std/testing@1.0.14/mock";
import { SRC20OperationService } from "$server/services/src20/operations/src20Operations.ts";
import { SRC20UtilityService } from "$server/services/src20/utilityService.ts";
import { SRC20MultisigPSBTService } from "$server/services/src20/psbt/src20MultisigPSBTService.ts";
import { logger } from "$lib/utils/logger.ts";
import type {
  IDeploySRC20,
  IMintSRC20,
  ITransferSRC20,
} from "$server/types/services/src20.d.ts";

// Import fixtures
import src20Data from "../fixtures/src20Data.json" with { type: "json" };
import { utxoFixtures } from "../fixtures/utxoFixtures.ts";

// Extract real data from fixtures
const deployFixture = src20Data.src20Valid.find((item) => item.op === "DEPLOY");
const mintFixture = src20Data.src20Valid.find((item) => item.op === "MINT");

// Test fixtures using real transaction data patterns
const mockPSBTResult = {
  psbtHex: "70736274ff01005e0200000001",
  psbtBase64:
    "cHNidP8BAF4CAAAAAQphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejEyMzQ1NgEAAAAA",
  inputsToSign: [{ index: 0 }],
  estimatedTxSize: 250,
  fee: "2500",
  change: "47500",
};

// Use addresses from UTXO fixtures for realistic test data
const validMintParams: IMintSRC20 = {
  network: "mainnet",
  toAddress: utxoFixtures.p2wpkh.standard.address,
  changeAddress: utxoFixtures.p2wpkh.largeValue.address,
  tick: mintFixture?.tick || "TEST",
  feeRate: 10,
  amt: "1000",
};

const validDeployParams: IDeploySRC20 = {
  network: "mainnet",
  toAddress: deployFixture?.destination || utxoFixtures.p2wpkh.standard.address,
  changeAddress: utxoFixtures.p2wpkh.dustAmount.address,
  tick: "NEWTOKEN",
  feeRate: 10,
  max: deployFixture?.max?.toString() || "1000000",
  lim: deployFixture?.lim?.toString() || "1000",
  dec: deployFixture?.deci || 8,
  x: "https://x.com/newtoken",
  web: "https://newtoken.com",
  email: "contact@newtoken.com",
  tg: "@newtoken",
  description: "New token description",
};

const validTransferParams: ITransferSRC20 = {
  network: "mainnet",
  toAddress: utxoFixtures.p2sh.multisig.address,
  fromAddress: utxoFixtures.p2wpkh.standard.address,
  changeAddress: utxoFixtures.p2wpkh.largeValue.address,
  tick: mintFixture?.tick || "TEST",
  feeRate: 10,
  amt: "500",
};

describe("SRC20OperationService - Comprehensive Tests", () => {
  afterEach(() => {
    restore();
  });

  describe("mintSRC20", () => {
    it("should successfully mint SRC20 tokens", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub checkMintedOut to return not minted out
      const checkMintedOutStub = stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.resolve({ minted_out: false, progress: 50 }),
      );

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result, {
        hex: mockPSBTResult.psbtHex,
        base64: mockPSBTResult.psbtBase64,
        inputsToSign: mockPSBTResult.inputsToSign,
        est_tx_size: mockPSBTResult.estimatedTxSize,
        est_miner_fee: mockPSBTResult.fee,
        change_value: mockPSBTResult.change,
      });

      // Verify checkMintedOut was called with correct params
      assertEquals(checkMintedOutStub.calls.length, 1);
      assertEquals(
        checkMintedOutStub.calls[0].args[0],
        mintFixture?.tick || "TEST",
      );
      assertEquals(checkMintedOutStub.calls[0].args[1], "1000");

      // Verify preparePSBT was called with correct transfer string
      assertEquals(preparePSBTStub.calls.length, 1);
      const prepareCall = preparePSBTStub.calls[0].args[0];
      assertEquals(
        prepareCall.transferString,
        JSON.stringify({
          op: "MINT",
          p: "SRC-20",
          tick: mintFixture?.tick || "TEST",
          amt: "1000",
        }),
      );
    });

    it("should handle token already minted out error", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.resolve({ minted_out: true, progress: 100 }),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result, {
        error: `Error: token ${mintFixture?.tick || "TEST"} already minted out`,
      });

      // Verify preparePSBT was not called
      assertEquals(preparePSBTStub.calls.length, 0);
    });

    it("should handle prepare PSBT error", async () => {
      // Stub logger to verify error logging
      const loggerErrorStub = stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.resolve({ minted_out: false, progress: 50 }),
      );

      stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.reject(new Error("PSBT preparation failed")),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result, {
        error: "PSBT preparation failed",
      });

      // Verify error was logged
      assertEquals(loggerErrorStub.calls.length, 1);
      assertEquals(loggerErrorStub.calls[0].args[0], "src20-operation-service");
      assertEquals(
        loggerErrorStub.calls[0].args[1].message,
        "Error in executeSRC20Operation",
      );
    });

    it("should handle estimatedTxSize being undefined", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.resolve({ minted_out: false, progress: 50 }),
      );

      stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () =>
          Promise.resolve({
            ...mockPSBTResult,
            estimatedTxSize: undefined,
          }),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result.est_tx_size, 0);
    });
  });

  describe("deploySRC20", () => {
    it("should successfully deploy SRC20 token with all fields", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      const checkDeployedTickStub = stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const result = await SRC20OperationService.deploySRC20(validDeployParams);

      assertEquals(result, {
        hex: mockPSBTResult.psbtHex,
        base64: mockPSBTResult.psbtBase64,
        inputsToSign: mockPSBTResult.inputsToSign,
        est_tx_size: mockPSBTResult.estimatedTxSize,
        est_miner_fee: mockPSBTResult.fee,
        change_value: mockPSBTResult.change,
      });

      // Verify checkDeployedTick was called
      assertEquals(checkDeployedTickStub.calls.length, 1);
      assertEquals(checkDeployedTickStub.calls[0].args[0], "NEWTOKEN");

      // Verify preparePSBT was called with correct transfer string
      const prepareCall = preparePSBTStub.calls[0].args[0];
      const expectedOperation = {
        op: "DEPLOY",
        p: "SRC-20",
        tick: "NEWTOKEN",
        max: "1000000",
        lim: "1000",
        // dec is not included because deployFixture.deci is 18, which is >= 18
        x: "https://x.com/newtoken",
        web: "https://newtoken.com",
        email: "contact@newtoken.com",
        tg: "@newtoken",
        description: "New token description",
      };
      assertEquals(
        prepareCall.transferString,
        JSON.stringify(expectedOperation),
      );
    });

    it("should deploy with minimal parameters", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const minimalDeployParams: IDeploySRC20 = {
        network: "mainnet",
        toAddress: utxoFixtures.p2wpkh.dustAmount.address,
        changeAddress: utxoFixtures.p2wsh.multisig2of3.address,
        tick: "MIN",
        feeRate: 10,
        max: "1000000",
        lim: "1000",
      };

      const result = await SRC20OperationService.deploySRC20(
        minimalDeployParams,
      );

      assertEquals(result.hex, mockPSBTResult.psbtHex);

      // Verify transfer string has only required fields
      const prepareCall = preparePSBTStub.calls[0].args[0];
      const transferObj = JSON.parse(prepareCall.transferString);
      assertEquals(transferObj.op, "DEPLOY");
      assertEquals(transferObj.p, "SRC-20");
      assertEquals(transferObj.tick, "MIN");
      assertEquals(transferObj.max, "1000000");
      assertEquals(transferObj.lim, "1000");
      assertEquals(transferObj.dec, undefined); // Should not be included
      assertEquals(transferObj.x, undefined);
      assertEquals(transferObj.web, undefined);
    });

    it("should include dec when it is 0", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const deployWithZeroDec = { ...validDeployParams, dec: 0 };
      await SRC20OperationService.deploySRC20(deployWithZeroDec);

      const prepareCall = preparePSBTStub.calls[0].args[0];
      const transferObj = JSON.parse(prepareCall.transferString);
      assertEquals(transferObj.dec, 0);
    });

    it("should not include dec when it is 18 or higher", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const deployWithHighDec = { ...validDeployParams, dec: 18 };
      await SRC20OperationService.deploySRC20(deployWithHighDec);

      const prepareCall = preparePSBTStub.calls[0].args[0];
      const transferObj = JSON.parse(prepareCall.transferString);
      assertEquals(transferObj.dec, undefined);
    });

    it("should not include dec when it is negative", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const deployWithNegativeDec = { ...validDeployParams, dec: -1 };
      await SRC20OperationService.deploySRC20(deployWithNegativeDec);

      const prepareCall = preparePSBTStub.calls[0].args[0];
      const transferObj = JSON.parse(prepareCall.transferString);
      assertEquals(transferObj.dec, undefined);
    });

    it("should use desc when description is not provided", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const deployWithDesc = {
        ...validDeployParams,
        description: undefined,
        desc: "Short description",
      };
      await SRC20OperationService.deploySRC20(deployWithDesc);

      const prepareCall = preparePSBTStub.calls[0].args[0];
      const transferObj = JSON.parse(prepareCall.transferString);
      assertEquals(transferObj.description, "Short description");
    });

    it("should prefer description over desc when both provided", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const deployWithBoth = {
        ...validDeployParams,
        desc: "Short description",
      };
      await SRC20OperationService.deploySRC20(deployWithBoth);

      const prepareCall = preparePSBTStub.calls[0].args[0];
      const transferObj = JSON.parse(prepareCall.transferString);
      assertEquals(transferObj.description, "New token description");
    });

    it("should handle token already deployed error", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: true }),
      );

      const result = await SRC20OperationService.deploySRC20(validDeployParams);

      assertEquals(result, {
        error: "Error: Token NEWTOKEN already deployed",
      });
    });

    it("should only include optional fields when they have values", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );

      const deployWithEmptyOptionals = {
        ...validDeployParams,
        x: "",
        web: "",
        email: "",
        tg: "",
        description: "",
      };

      await SRC20OperationService.deploySRC20(deployWithEmptyOptionals);

      const prepareCall = preparePSBTStub.calls[0].args[0];
      const transferObj = JSON.parse(prepareCall.transferString);

      // Empty strings should not be included
      assertEquals(transferObj.x, undefined);
      assertEquals(transferObj.web, undefined);
      assertEquals(transferObj.email, undefined);
      assertEquals(transferObj.tg, undefined);
      assertEquals(transferObj.description, undefined);
    });
  });

  describe("transferSRC20", () => {
    it("should successfully transfer SRC20 tokens", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      const checkEnoughBalanceStub = stub(
        SRC20UtilityService,
        "checkEnoughBalance",
        () => Promise.resolve(true),
      );

      const result = await SRC20OperationService.transferSRC20(
        validTransferParams,
      );

      assertEquals(result, {
        hex: mockPSBTResult.psbtHex,
        base64: mockPSBTResult.psbtBase64,
        inputsToSign: mockPSBTResult.inputsToSign,
        est_tx_size: mockPSBTResult.estimatedTxSize,
        est_miner_fee: mockPSBTResult.fee,
        change_value: mockPSBTResult.change,
      });

      // Verify checkEnoughBalance was called with correct params
      assertEquals(checkEnoughBalanceStub.calls.length, 1);
      assertEquals(
        checkEnoughBalanceStub.calls[0].args[0],
        utxoFixtures.p2wpkh.standard.address,
      );
      assertEquals(
        checkEnoughBalanceStub.calls[0].args[1],
        mintFixture?.tick || "TEST",
      );
      assertEquals(checkEnoughBalanceStub.calls[0].args[2], "500");

      // Verify preparePSBT was called with correct transfer string
      const prepareCall = preparePSBTStub.calls[0].args[0];
      assertEquals(
        prepareCall.transferString,
        JSON.stringify({
          op: "TRANSFER",
          p: "SRC-20",
          tick: mintFixture?.tick || "TEST",
          amt: "500",
        }),
      );
    });

    it("should handle insufficient balance error", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkEnoughBalance",
        () => Promise.resolve(false),
      );

      const result = await SRC20OperationService.transferSRC20(
        validTransferParams,
      );

      assertEquals(result, {
        error: "Error: Not enough balance",
      });
    });

    it("should handle checkEnoughBalance throwing error", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkEnoughBalance",
        () => Promise.reject(new Error("Database error")),
      );

      const result = await SRC20OperationService.transferSRC20(
        validTransferParams,
      );

      assertEquals(result, {
        error: "Database error",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle non-Error exceptions", async () => {
      // Stub logger to verify error logging
      const loggerErrorStub = stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.reject("String error"),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result, {
        error: "Unknown error in SRC20 operation",
      });

      // Verify error was logged with string conversion
      assertEquals(loggerErrorStub.calls.length, 1);
      assertEquals(loggerErrorStub.calls[0].args[1].error, "String error");
    });

    it("should handle undefined errors", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.reject(undefined),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result, {
        error: "Unknown error in SRC20 operation",
      });
    });

    it("should handle null errors", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.reject(null),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result, {
        error: "Unknown error in SRC20 operation",
      });
    });

    it("should handle object errors", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.reject({ code: "ERR_001", message: "Custom error" }),
      );

      const result = await SRC20OperationService.mintSRC20(validMintParams);

      assertEquals(result, {
        error: "Unknown error in SRC20 operation",
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle all operations returning consistent structure", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Setup stubs
      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.resolve({ minted_out: false }),
      );
      stub(
        SRC20UtilityService,
        "checkDeployedTick",
        () => Promise.resolve({ deployed: false }),
      );
      stub(
        SRC20UtilityService,
        "checkEnoughBalance",
        () => Promise.resolve(true),
      );
      stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      const [mintResult, deployResult, transferResult] = await Promise.all([
        SRC20OperationService.mintSRC20(validMintParams),
        SRC20OperationService.deploySRC20(validDeployParams),
        SRC20OperationService.transferSRC20(validTransferParams),
      ]);

      // All should have the same structure
      const expectedKeys = [
        "hex",
        "base64",
        "inputsToSign",
        "est_tx_size",
        "est_miner_fee",
        "change_value",
      ];

      assertEquals(Object.keys(mintResult).sort(), expectedKeys.sort());
      assertEquals(Object.keys(deployResult).sort(), expectedKeys.sort());
      assertEquals(Object.keys(transferResult).sort(), expectedKeys.sort());
    });

    it("should pass through all params to preparePSBT", async () => {
      // Stub logger to avoid console output
      stub(logger, "error", () => {});

      // Stub preparePSBT
      const preparePSBTStub = stub(
        SRC20MultisigPSBTService,
        "preparePSBT",
        () => Promise.resolve(mockPSBTResult),
      );

      stub(
        SRC20UtilityService,
        "checkMintedOut",
        () => Promise.resolve({ minted_out: false }),
      );

      const extendedMintParams = {
        ...validMintParams,
        extraField: "should be passed through",
      };

      await SRC20OperationService.mintSRC20(extendedMintParams);

      const prepareCall = preparePSBTStub.calls[0].args[0];
      assertEquals(prepareCall.extraField, "should be passed through");
      assertEquals(prepareCall.network, "mainnet");
      assertEquals(prepareCall.toAddress, utxoFixtures.p2wpkh.standard.address);
    });
  });
});
