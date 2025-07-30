import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub, returnsNext, Stub } from "@std/testing/mock";

import { StampCreationService } from "../../server/services/stamp/stampCreationService.ts";
import {
  mockStampParams,
  mockWalletAddresses,
  mockUTXOs,
  mockCounterpartyResponses,
  mockFileData,
  mockPSBTResults,
  mockCIP33Addresses,
  validationTestCases,
  edgeCases,
  createMockServices,
  performanceTestCases,
  validateStampResult,
  createRealisticStampScenario,
  errorScenarios,
} from "../fixtures/stampCreationServiceFixtures.ts";

describe("StampCreationService", () => {
  let stubs: Record<string, Stub> = {};

  beforeEach(() => {
    // Reset all stubs
    Object.values(stubs).forEach(stub => stub.restore?.());
    stubs = {};
  });

  describe("createStampIssuance", () => {
    describe("Input validation", () => {
      for (const testCase of validationTestCases) {
        it(`should ${testCase.shouldPass ? 'accept' : 'reject'} ${testCase.name}`, async () => {
          if (testCase.shouldPass) {
            // Mock dependencies for successful case
            stubs.createIssuanceTransaction = stub(
              StampCreationService as any,
              "createIssuanceTransaction",
              returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
            );
            stubs.generatePSBT = stub(
              StampCreationService as any,
              "generatePSBT", 
              returnsNext([Promise.resolve(mockPSBTResults.successful)])
            );

            const result = await StampCreationService.createStampIssuance(testCase.params);
            assertExists(result);
            validateStampResult(result);
          } else {
            await assertRejects(
              () => StampCreationService.createStampIssuance(testCase.params),
              Error,
              testCase.expectedError
            );
          }
        });
      }
    });

    describe("Wallet address validation", () => {
      it("should accept valid P2WPKH addresses", async () => {
        const params = {
          ...mockStampParams.basic,
          sourceWallet: mockWalletAddresses.valid.p2wpkh,
        };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);
      });

      it("should accept valid P2PKH addresses", async () => {
        const params = {
          ...mockStampParams.basic,
          sourceWallet: mockWalletAddresses.valid.p2pkh,
        };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);
      });

      it("should reject invalid wallet addresses", async () => {
        const params = {
          ...mockStampParams.basic,
          sourceWallet: mockWalletAddresses.invalid.malformed,
        };

        await assertRejects(
          () => StampCreationService.createStampIssuance(params),
          Error,
          "Invalid source wallet"
        );
      });

      it("should validate service fee addresses when service fee is provided", async () => {
        const params = {
          ...mockStampParams.basic,
          service_fee: 50000,
          service_fee_address: mockWalletAddresses.invalid.malformed,
        };

        await assertRejects(
          () => StampCreationService.createStampIssuance(params),
          Error,
          "Invalid service fee address"
        );
      });

      it("should skip service fee address validation when service fee is zero", async () => {
        const params = {
          ...mockStampParams.basic,
          service_fee: 0,
          service_fee_address: mockWalletAddresses.invalid.malformed, // Should be ignored
        };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);
      });
    });

    describe("Output value validation", () => {
      it("should accept valid output values in range 1-332", async () => {
        for (const outputValue of [1, 100, 200, 332]) {
          const params = { ...mockStampParams.basic, outputValue };

          stubs.createIssuanceTransaction = stub(
            StampCreationService as any,
            "createIssuanceTransaction",
            returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
          );
          stubs.generatePSBT = stub(
            StampCreationService as any,
            "generatePSBT",
            returnsNext([Promise.resolve(mockPSBTResults.successful)])
          );

          const result = await StampCreationService.createStampIssuance(params);
          assertExists(result);
          
          // Clean up stubs for next iteration
          stubs.createIssuanceTransaction.restore();
          stubs.generatePSBT.restore();
        }
      });

      it("should accept exactly 333 as valid output value", async () => {
        const params = { ...mockStampParams.basic, outputValue: 333 };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);
      });

      it("should reject output values outside valid ranges", async () => {
        const invalidValues = [0, -1, 334, 400, 1000];

        for (const outputValue of invalidValues) {
          const params = { ...mockStampParams.basic, outputValue };

          await assertRejects(
            () => StampCreationService.createStampIssuance(params),
            Error,
            `Invalid outputValue: ${outputValue}`
          );
        }
      });

      it("should use default dust value when outputValue is undefined", async () => {
        const params = { ...mockStampParams.basic };
        delete (params as any).outputValue;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        // Verify default dust value was used (should be called with TX_CONSTANTS.DUST_SIZE)
        // This would be verified by checking the generatePSBT call arguments
      });
    });

    describe("Quantity handling", () => {
      it("should handle string quantities", async () => {
        const params = { ...mockStampParams.basic, qty: "42" };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        // Verify createIssuanceTransaction was called with parsed integer
        assertEquals(stubs.createIssuanceTransaction.calls[0].args[0].qty, 42);
      });

      it("should handle numeric quantities", async () => {
        const params = { ...mockStampParams.basic, qty: 100 as any };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        assertEquals(stubs.createIssuanceTransaction.calls[0].args[0].qty, 100);
      });

      it("should handle zero quantity", async () => {
        const params = { ...mockStampParams.basic, qty: "0" };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        assertEquals(stubs.createIssuanceTransaction.calls[0].args[0].qty, 0);
      });
    });

    describe("Fee rate normalization", () => {
      it("should normalize fee rates correctly", async () => {
        const params = { ...mockStampParams.basic, satsPerVB: 25.5 };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        // Verify fee rate was converted properly (should be ~25500 sats/kB)
        const callArgs = stubs.createIssuanceTransaction.calls[0].args[0];
        assert(callArgs.satsPerKB >= 25000 && callArgs.satsPerKB <= 26000);
      });

      it("should handle undefined fee rates", async () => {
        const params = { ...mockStampParams.basic };
        delete (params as any).satsPerVB;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);
      });
    });

    describe("Dry run mode", () => {
      it("should return estimation data without hex for dry runs", async () => {
        const params = { ...mockStampParams.basic, isDryRun: true };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        
        // Should not include hex field in dry run
        assert(!("hex" in result));
        
        // Should include estimation fields
        assertExists(result.est_tx_size);
        assertExists(result.input_value);
        assertExists(result.total_dust_value);
        assertExists(result.est_miner_fee);
        assertExists(result.change_value);
        assertExists(result.total_output_value);

        validateStampResult(result, true);
      });

      it("should return hex for non-dry runs", async () => {
        const params = { ...mockStampParams.basic, isDryRun: false };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        
        assertExists(result.hex);
        assertEquals(typeof result.hex, "string");
        assert(result.hex.length > 0);

        validateStampResult(result, false);
      });
    });

    describe("Asset name handling", () => {
      it("should handle defined asset names", async () => {
        const params = { ...mockStampParams.basic, assetName: "MYASSET" };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        assertEquals(stubs.createIssuanceTransaction.calls[0].args[0].assetName, "MYASSET");
      });

      it("should handle undefined asset names", async () => {
        const params = { ...mockStampParams.basic };
        delete (params as any).assetName;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        assertEquals(stubs.createIssuanceTransaction.calls[0].args[0].assetName, "");
      });
    });

    describe("Error handling", () => {
      it("should handle transaction creation failures", async () => {
        const params = mockStampParams.basic;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "" })]) // Empty tx_hex
        );

        await assertRejects(
          () => StampCreationService.createStampIssuance(params),
          Error,
          "Transaction creation failed: No transaction hex returned"
        );
      });

      it("should handle missing transaction hex", async () => {
        const params = mockStampParams.basic;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({})]) // No tx_hex field
        );

        await assertRejects(
          () => StampCreationService.createStampIssuance(params),
          Error,
          "Transaction creation failed: No transaction hex returned"
        );
      });

      it("should enhance error messages for base58 errors", async () => {
        const params = mockStampParams.basic;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.reject(new Error("invalid base58 address"))])
        );

        await assertRejects(
          () => StampCreationService.createStampIssuance(params),
          Error,
          "Invalid address format. Please use a supported Bitcoin address format"
        );
      });

      it("should propagate other errors unchanged", async () => {
        const params = mockStampParams.basic;
        const originalError = new Error("Network connection failed");

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.reject(originalError)])
        );

        await assertRejects(
          () => StampCreationService.createStampIssuance(params),
          Error,
          "Network connection failed"
        );
      });
    });

    describe("File processing", () => {
      it("should process small files correctly", async () => {
        const params = { ...mockStampParams.basic, file: mockFileData.small.base64 };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);
      });

      it("should process large files correctly", async () => {
        const params = { ...mockStampParams.basic, file: mockFileData.large.base64 };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);
        
        // Large files should result in higher estimated sizes
        assert(result.est_tx_size > 200);
      });

      it("should calculate file sizes correctly", async () => {
        const params = { ...mockStampParams.basic, file: mockFileData.medium.base64 };

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        // Verify file size was calculated and passed correctly
        const generatePSBTCall = stubs.generatePSBT.calls[0];
        const fileSize = generatePSBTCall.args[6]; // fileSize parameter
        assert(fileSize > 0);
        assert(typeof fileSize === 'number');
      });
    });

    describe("Service integration", () => {
      it("should integrate with createIssuanceTransaction correctly", async () => {
        const params = mockStampParams.basic;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex123" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        // Verify createIssuanceTransaction was called with correct parameters
        assertEquals(stubs.createIssuanceTransaction.calls.length, 1);
        const callArgs = stubs.createIssuanceTransaction.calls[0].args[0];
        
        assertEquals(callArgs.sourceWallet, params.sourceWallet);
        assertEquals(callArgs.qty, parseInt(params.qty));
        assertEquals(callArgs.locked, params.locked);
        assertEquals(callArgs.divisible, params.divisible);
        assertExists(callArgs.satsPerKB);
        assertEquals(callArgs.isDryRun, false);
        assertEquals(callArgs.file, params.file);
        assertEquals(callArgs.service_fee, params.service_fee);
      });

      it("should integrate with generatePSBT correctly", async () => {
        const params = mockStampParams.basic;

        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex456" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const result = await StampCreationService.createStampIssuance(params);
        assertExists(result);

        // Verify generatePSBT was called with correct parameters
        assertEquals(stubs.generatePSBT.calls.length, 1);
        const callArgs = stubs.generatePSBT.calls[0].args;
        
        assertEquals(callArgs[0], "mockTxHex456"); // tx hex
        assertEquals(callArgs[1], params.sourceWallet); // address
        assert(typeof callArgs[2] === 'number'); // satsPerVB
        assertEquals(callArgs[3], params.service_fee); // service_fee
        assertEquals(callArgs[4], params.service_fee_address); // recipient_fee
        assert(Array.isArray(callArgs[5])); // cip33Addresses
        assert(typeof callArgs[6] === 'number'); // fileSize
        assertEquals(callArgs[7], false); // isDryRun
        assert(typeof callArgs[8] === 'number'); // dustValue
      });
    });
  });

  describe("Performance tests", () => {
    for (const testCase of performanceTestCases) {
      it(`should complete ${testCase.name} within ${testCase.maxExecutionTime}ms`, async () => {
        stubs.createIssuanceTransaction = stub(
          StampCreationService as any,
          "createIssuanceTransaction",
          returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
        );
        stubs.generatePSBT = stub(
          StampCreationService as any,
          "generatePSBT",
          returnsNext([Promise.resolve(mockPSBTResults.successful)])
        );

        const startTime = Date.now();
        const result = await StampCreationService.createStampIssuance(testCase.params);
        const endTime = Date.now();
        
        assertExists(result);
        assert(endTime - startTime < testCase.maxExecutionTime, 
          `Execution took ${endTime - startTime}ms, expected < ${testCase.maxExecutionTime}ms`);
      });
    }
  });

  describe("Edge cases", () => {
    it("should handle empty files gracefully", async () => {
      const params = edgeCases.emptyFile;

      stubs.createIssuanceTransaction = stub(
        StampCreationService as any,
        "createIssuanceTransaction",
        returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
      );
      stubs.generatePSBT = stub(
        StampCreationService as any,
        "generatePSBT",
        returnsNext([Promise.resolve(mockPSBTResults.successful)])
      );

      const result = await StampCreationService.createStampIssuance(params);
      assertExists(result);
    });

    it("should handle very high fee rates", async () => {
      const params = edgeCases.veryHighFeeRate;

      stubs.createIssuanceTransaction = stub(
        StampCreationService as any,
        "createIssuanceTransaction",
        returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
      );
      stubs.generatePSBT = stub(
        StampCreationService as any,
        "generatePSBT",
        returnsNext([Promise.resolve(mockPSBTResults.successful)])
      );

      const result = await StampCreationService.createStampIssuance(params);
      assertExists(result);
      
      // High fee rates should result in high estimated fees
      assert(result.est_miner_fee > 50000); // Should be substantial
    });

    it("should handle very low fee rates", async () => {
      const params = edgeCases.veryLowFeeRate;

      stubs.createIssuanceTransaction = stub(
        StampCreationService as any,
        "createIssuanceTransaction",
        returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
      );
      stubs.generatePSBT = stub(
        StampCreationService as any,
        "generatePSBT",
        returnsNext([Promise.resolve(mockPSBTResults.successful)])
      );

      const result = await StampCreationService.createStampIssuance(params);
      assertExists(result);
      
      // Low fee rates should result in low estimated fees
      assert(result.est_miner_fee < 1000);
    });

    it("should handle maximum service fees", async () => {
      const params = edgeCases.maxServiceFee;

      stubs.createIssuanceTransaction = stub(
        StampCreationService as any,
        "createIssuanceTransaction",
        returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
      );
      stubs.generatePSBT = stub(
        StampCreationService as any,
        "generatePSBT",
        returnsNext([Promise.resolve({
          ...mockPSBTResults.successful,
          totalOutputValue: mockPSBTResults.successful.totalOutputValue + 950000 // Add high service fee
        })])
      );

      const result = await StampCreationService.createStampIssuance(params);
      assertExists(result);
      
      // Should handle large service fees without issues
      assert(result.total_output_value > 1000000);
    });
  });

  describe("MARA mode integration", () => {
    it("should handle MARA mode stamps (outputValue < 330)", async () => {
      const params = mockStampParams.maraMode;

      stubs.createIssuanceTransaction = stub(
        StampCreationService as any,
        "createIssuanceTransaction",
        returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
      );
      stubs.generatePSBT = stub(
        StampCreationService as any,
        "generatePSBT",
        returnsNext([Promise.resolve(mockPSBTResults.successful)])
      );

      const result = await StampCreationService.createStampIssuance(params);
      assertExists(result);

      // Verify MARA mode parameters were passed correctly
      const generatePSBTCall = stubs.generatePSBT.calls[0];
      const dustValue = generatePSBTCall.args[8];
      assertEquals(dustValue, 150); // MARA mode value
    });

    it("should handle non-MARA mode stamps (outputValue >= 330)", async () => {
      const params = { ...mockStampParams.basic, outputValue: 333 };

      stubs.createIssuanceTransaction = stub(
        StampCreationService as any,
        "createIssuanceTransaction",
        returnsNext([Promise.resolve({ tx_hex: "mockTxHex" })])
      );
      stubs.generatePSBT = stub(
        StampCreationService as any,
        "generatePSBT",
        returnsNext([Promise.resolve(mockPSBTResults.successful)])
      );

      const result = await StampCreationService.createStampIssuance(params);
      assertExists(result);

      // Verify non-MARA mode parameters were passed correctly
      const generatePSBTCall = stubs.generatePSBT.calls[0];
      const dustValue = generatePSBTCall.args[8];
      assertEquals(dustValue, 333);
    });
  });
});