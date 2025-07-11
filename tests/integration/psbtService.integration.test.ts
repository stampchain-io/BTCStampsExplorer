/**
 * @fileoverview Integration tests for PSBTService using controlled test data
 * These tests use the new PSBTService with dependency injection but with real-like data
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterAll, beforeEach, describe, it } from "@std/testing/bdd";
import { Buffer } from "node:buffer";
import * as bitcoin from "bitcoinjs-lib";

// Set test environment
(globalThis as any).SKIP_REDIS_CONNECTION = true;
(globalThis as any).SKIP_DB_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("SKIP_DB_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

// Import the production PSBTService
import {
  createPSBTService,
  formatPsbtForLogging,
  PSBTServiceImpl,
} from "$server/services/transaction/psbtService.ts";
// Removed unused import - utxoFixtures

// Create controlled test data that simulates real Bitcoin data
const controlledTestData = {
  // Known Bitcoin addresses with valid checksums
  addresses: {
    p2wpkh: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", // Valid P2WPKH
    p2pkh: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", // Valid P2PKH
    p2sh: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", // Valid P2SH
  },

  // Mock UTXOs with realistic structure
  utxos: {
    p2wpkh: {
      txid: "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
      vout: 0,
      value: 100000, // 0.001 BTC
      script: "0014751e76a02fcf9f04a1ac8b83b5c6a0f3b6b8f5af", // P2WPKH script
    },
    p2pkh: {
      txid: "f5a688a4d12580ca697af3d9f942a4f20ba30b0510b4181e3db838adea57c65e",
      vout: 0,
      value: 500000, // 0.005 BTC
      script: "76a9145e9b23809261178723055968d134a947f47e799f88ac", // P2PKH script
    },
  },

  // Mock raw transaction data
  rawTransactions: {
    "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b":
      "02000000000101abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890000000001716001475" +
      "1e76a02fcf9f04a1ac8b83b5c6a0f3b6b8f5afffffffff01a0860100000000001600141e9b23809261178723055968" +
      "d134a947f47e799f02473044022012345678901234567890123456789012345678901234567890123456789012340220" +
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef012102751e76a02fcf9f04a1ac8b83b5" +
      "c6a0f3b6b8f5af00000000",
    "f5a688a4d12580ca697af3d9f942a4f20ba30b0510b4181e3db838adea57c65e":
      "0200000001abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890000000006b483045022100" +
      "1234567890123456789012345678901234567890123456789012345678901234022012345678901234567890123456789" +
      "012345678901234567890123456789012340121025e9b23809261178723055968d134a947f47e799fffffffff0120a107" +
      "0000000000001976a9145e9b23809261178723055968d134a947f47e799f88ac00000000",
  },
};

describe("PSBTService Integration Tests", {
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
  let psbtService: PSBTServiceImpl;

  beforeEach(() => {
    // Create PSBTService with controlled dependencies
    psbtService = createPSBTService({
      getUTXOForAddress: (
        _address: string,
        txid: string,
        vout: number,
      ) => {
        // Return controlled UTXO data
        if (txid === controlledTestData.utxos.p2wpkh.txid && vout === 0) {
          return {
            utxo: {
              value: controlledTestData.utxos.p2wpkh.value,
              script: controlledTestData.utxos.p2wpkh.script,
              ancestor: null,
            },
          };
        }

        if (txid === controlledTestData.utxos.p2pkh.txid && vout === 0) {
          return {
            utxo: {
              value: controlledTestData.utxos.p2pkh.value,
              script: controlledTestData.utxos.p2pkh.script,
              ancestor: null,
            },
          };
        }

        throw new Error(`UTXO not found: ${txid}:${vout}`);
      },

      estimateFee: (outputs: any[], feeRate: number, inputCount: number) => {
        // Realistic fee calculation
        const outputSize = outputs.length * 34;
        const inputSize = inputCount * 148; // P2WPKH input size
        const overhead = 10;
        return Math.ceil((inputSize + outputSize + overhead) * feeRate);
      },

      commonUtxoService: {
        getSpecificUTXO: (txid: string, vout: number) => {
          if (txid === controlledTestData.utxos.p2wpkh.txid && vout === 0) {
            return {
              value: controlledTestData.utxos.p2wpkh.value,
              script: controlledTestData.utxos.p2wpkh.script,
              address: controlledTestData.addresses.p2wpkh,
              scriptType: "p2wpkh",
            };
          }

          if (txid === controlledTestData.utxos.p2pkh.txid && vout === 0) {
            return {
              value: controlledTestData.utxos.p2pkh.value,
              script: controlledTestData.utxos.p2pkh.script,
              address: controlledTestData.addresses.p2pkh,
              scriptType: "p2pkh",
            };
          }

          throw new Error(`UTXO not found: ${txid}:${vout}`);
        },

        getRawTransactionHex: (txid: string) => {
          const rawTx = controlledTestData.rawTransactions[txid];
          if (!rawTx) {
            throw new Error(`Transaction not found: ${txid}`);
          }
          return rawTx;
        },

        getInstance: () => ({
          getSpecificUTXO: (txid: string, vout: number) => {
            if (txid === controlledTestData.utxos.p2wpkh.txid && vout === 0) {
              return {
                value: controlledTestData.utxos.p2wpkh.value,
                script: controlledTestData.utxos.p2wpkh.script,
                address: controlledTestData.addresses.p2wpkh,
                scriptType: "p2wpkh",
              };
            }

            if (txid === controlledTestData.utxos.p2pkh.txid && vout === 0) {
              return {
                value: controlledTestData.utxos.p2pkh.value,
                script: controlledTestData.utxos.p2pkh.script,
                address: controlledTestData.addresses.p2pkh,
                scriptType: "p2pkh",
              };
            }

            throw new Error(`UTXO not found: ${txid}:${vout}`);
          },

          getRawTransactionHex: (txid: string) => {
            const rawTx = controlledTestData.rawTransactions[txid];
            if (!rawTx) {
              throw new Error(`Transaction not found: ${txid}`);
            }
            return rawTx;
          },
        }),
      } as any,
    });
  });

  // Clean up after tests - close any database connections
  afterAll(async () => {
    // Even though we skip Redis/DB connections, ensure cleanup for safety
    try {
      const { dbManager } = await import("$server/database/databaseManager.ts");
      await dbManager.closeAllClients();
    } catch {
      // Ignore errors if dbManager is not available
    }
  });

  describe("Real-world scenarios", () => {
    it("should create PSBT for P2WPKH with realistic data", async () => {
      const utxoString = `${controlledTestData.utxos.p2wpkh.txid}:0`;
      const salePrice = 0.0005; // 0.0005 BTC = 50,000 sats
      const sellerAddress = controlledTestData.addresses.p2wpkh;

      const psbtHex = await psbtService.createPSBT(
        utxoString,
        salePrice,
        sellerAddress,
      );

      assertExists(psbtHex);
      assertEquals(psbtHex.startsWith("70736274ff"), true); // PSBT magic bytes

      // Parse and validate the PSBT
      const psbt = bitcoin.Psbt.fromHex(psbtHex);
      assertEquals(psbt.data.inputs.length, 1);
      assertEquals(psbt.txOutputs.length, 2); // Sale output + change

      // Verify input has witness UTXO (P2WPKH)
      assertExists(psbt.data.inputs[0].witnessUtxo);
      assertEquals(
        psbt.data.inputs[0].witnessUtxo.value,
        controlledTestData.utxos.p2wpkh.value,
      );

      // Verify outputs
      assertEquals(psbt.txOutputs[0].value, 50000n); // Sale price in sats
      assertEquals(psbt.txOutputs[1].value > 0n, true); // Change output
    });

    it("should create PSBT for P2PKH with realistic data", async () => {
      const utxoString = `${controlledTestData.utxos.p2pkh.txid}:0`;
      const salePrice = 0.002; // 0.002 BTC = 200,000 sats
      const sellerAddress = controlledTestData.addresses.p2pkh;

      const psbtHex = await psbtService.createPSBT(
        utxoString,
        salePrice,
        sellerAddress,
      );

      assertExists(psbtHex);
      const psbt = bitcoin.Psbt.fromHex(psbtHex);

      // P2PKH should have nonWitnessUtxo
      assertExists(psbt.data.inputs[0].nonWitnessUtxo);
      assertEquals(psbt.txOutputs[0].value, 200000n); // Sale price
    });

    it("should validate UTXO ownership correctly", async () => {
      const utxoString = `${controlledTestData.utxos.p2wpkh.txid}:0`;
      const correctAddress = controlledTestData.addresses.p2wpkh;
      const wrongAddress = controlledTestData.addresses.p2pkh;

      // Correct address should validate
      const isValidCorrect = await psbtService.validateUTXOOwnership(
        utxoString,
        correctAddress,
      );
      assertEquals(isValidCorrect, true);

      // Wrong address should not validate
      const isValidWrong = await psbtService.validateUTXOOwnership(
        utxoString,
        wrongAddress,
      );
      assertEquals(isValidWrong, false);
    });

    it("should handle insufficient UTXO value", async () => {
      const utxoString = `${controlledTestData.utxos.p2wpkh.txid}:0`;
      const oversizedSalePrice = 0.01; // 1,000,000 sats > 100,000 sats UTXO
      const sellerAddress = controlledTestData.addresses.p2wpkh;

      await assertRejects(
        async () => {
          await psbtService.createPSBT(
            utxoString,
            oversizedSalePrice,
            sellerAddress,
          );
        },
        Error,
        // Should fail due to insufficient funds
      );
    });

    it("should process counterparty PSBT correctly", async () => {
      // Create a buyer's PSBT first
      const buyerPsbt = new bitcoin.Psbt();
      buyerPsbt.addInput({
        hash: Buffer.from(controlledTestData.utxos.p2wpkh.txid, "hex")
          .reverse(),
        index: 0,
        witnessUtxo: {
          value: controlledTestData.utxos.p2wpkh.value,
          script: Buffer.from(controlledTestData.utxos.p2wpkh.script, "hex"),
        },
      });

      // Payment to seller
      buyerPsbt.addOutput({
        address: controlledTestData.addresses.p2pkh,
        value: 50000, // 0.0005 BTC
      });

      const result = await psbtService.processCounterpartyPSBT(
        buyerPsbt.toHex(),
        `${controlledTestData.utxos.p2pkh.txid}:0`,
        controlledTestData.addresses.p2pkh,
      );

      assertExists(result);
      assertExists(result.psbtHex);
      assertEquals(result.isComplete, false);

      // Verify seller's input was added
      const resultPsbt = bitcoin.Psbt.fromHex(result.psbtHex);
      assertEquals(resultPsbt.data.inputs.length, 2); // Buyer + seller inputs
    });

    it("should handle service fees in PSBT processing", async () => {
      const buyerPsbt = new bitcoin.Psbt();
      buyerPsbt.addInput({
        hash: Buffer.from(controlledTestData.utxos.p2wpkh.txid, "hex")
          .reverse(),
        index: 0,
        witnessUtxo: {
          value: controlledTestData.utxos.p2wpkh.value,
          script: Buffer.from(controlledTestData.utxos.p2wpkh.script, "hex"),
        },
      });

      buyerPsbt.addOutput({
        address: controlledTestData.addresses.p2pkh,
        value: 50000,
      });

      const serviceFee = 1000; // 1000 sats service fee
      const result = await psbtService.processCounterpartyPSBT(
        buyerPsbt.toHex(),
        `${controlledTestData.utxos.p2pkh.txid}:0`,
        controlledTestData.addresses.p2pkh,
        { serviceFee },
      );

      const resultPsbt = bitcoin.Psbt.fromHex(result.psbtHex);

      // Should have buyer input + seller input + payment output + service fee output
      assertEquals(resultPsbt.data.inputs.length, 2);
      assertEquals(resultPsbt.txOutputs.length, 2); // Payment + service fee
    });

    it("should build PSBT from raw transaction hex", async () => {
      const rawHex = controlledTestData
        .rawTransactions[controlledTestData.utxos.p2wpkh.txid];

      const result = await psbtService.buildPsbtFromUserFundedRawHex(rawHex);

      assertExists(result);
      assertEquals(result.startsWith("70736274ff"), true); // PSBT magic

      const psbt = bitcoin.Psbt.fromHex(result);
      assertEquals(psbt.data.inputs.length > 0, true);
      assertEquals(psbt.txOutputs.length > 0, true);
    });
  });

  describe("Error handling with realistic scenarios", () => {
    it("should handle nonexistent UTXO", async () => {
      await assertRejects(
        async () => {
          await psbtService.createPSBT(
            "nonexistent:0",
            0.001,
            controlledTestData.addresses.p2wpkh,
          );
        },
        Error,
        "UTXO not found",
      );
    });

    it("should reject PSBT without seller payment", async () => {
      const buyerPsbt = new bitcoin.Psbt();
      buyerPsbt.addInput({
        hash: Buffer.from(controlledTestData.utxos.p2wpkh.txid, "hex")
          .reverse(),
        index: 0,
        witnessUtxo: {
          value: controlledTestData.utxos.p2wpkh.value,
          script: Buffer.from(controlledTestData.utxos.p2wpkh.script, "hex"),
        },
      });

      // Payment to someone else, not the seller
      buyerPsbt.addOutput({
        address: controlledTestData.addresses.p2wpkh,
        value: 50000,
      });

      await assertRejects(
        async () => {
          await psbtService.processCounterpartyPSBT(
            buyerPsbt.toHex(),
            `${controlledTestData.utxos.p2pkh.txid}:0`,
            controlledTestData.addresses.p2sh, // Different address - seller not paid
          );
        },
        Error,
        "does not pay to the seller address",
      );
    });

    it("should handle invalid raw transaction hex", async () => {
      await assertRejects(
        async () => {
          await psbtService.buildPsbtFromUserFundedRawHex("invalid-hex");
        },
        Error,
      );
    });
  });

  describe("Fee calculations", () => {
    it("should calculate realistic fees for different transaction sizes", async () => {
      const testCases = [
        {
          utxo: controlledTestData.utxos.p2wpkh,
          address: controlledTestData.addresses.p2wpkh,
          salePrice: 0.0001,
          expectedMaxFee: 2000, // P2WPKH has lower fees
        },
        {
          utxo: controlledTestData.utxos.p2pkh,
          address: controlledTestData.addresses.p2pkh,
          salePrice: 0.001,
          expectedMaxFee: 3000, // P2PKH has higher fees
        },
      ];

      for (const testCase of testCases) {
        const psbtHex = await psbtService.createPSBT(
          `${testCase.utxo.txid}:0`,
          testCase.salePrice,
          testCase.address,
        );

        const psbt = bitcoin.Psbt.fromHex(psbtHex);
        const totalOutput = psbt.txOutputs.reduce(
          (sum, out) => sum + Number(out.value),
          0,
        );
        const totalInput = testCase.utxo.value;
        const fee = totalInput - totalOutput;

        assertEquals(fee > 0, true, `Fee should be positive`);
        assertEquals(
          fee < testCase.expectedMaxFee,
          true,
          `Fee should be less than ${testCase.expectedMaxFee}, got ${fee}`,
        );
      }
    });
  });

  describe("formatPsbtForLogging", () => {
    it("should format complex PSBT correctly", () => {
      const mockPsbt = {
        data: {
          inputs: [{
            witnessUtxo: {
              value: 100000n,
              script: Buffer.from(
                controlledTestData.utxos.p2wpkh.script,
                "hex",
              ),
            },
            redeemScript: Buffer.from("0014abcd", "hex"),
          }, {
            nonWitnessUtxo: Buffer.from("02000000", "hex"),
          }],
        },
        txOutputs: [{
          address: controlledTestData.addresses.p2wpkh,
          value: 50000n,
          script: Buffer.from("0014abcd", "hex"),
        }],
      };

      const formatted = formatPsbtForLogging(mockPsbt as any);

      assertExists(formatted.inputs);
      assertExists(formatted.outputs);
      assertEquals(formatted.inputs.length, 2);
      assertEquals(formatted.outputs.length, 1);
      assertEquals(formatted.inputs[0].witnessUtxo?.value, 100000);
      assertEquals(formatted.inputs[0].redeemScript, "0014abcd");
      assertEquals(formatted.inputs[1].nonWitnessUtxo, "02000000");
      assertEquals(formatted.outputs[0].script, "0014abcd");
    });
  });
});
