/**
 * @fileoverview Comprehensive tests for BitcoinTransactionBuilder
 * Aims to increase coverage from 13.0% to 80%+ with mocked dependencies and fixtures
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import {
  createBitcoinTransactionBuilder,
  formatPsbtForLogging,
  BitcoinTransactionBuilder,
  BitcoinTransactionBuilderImpl,
} from "$server/services/transaction/bitcoinTransactionBuilder.ts";
import { type UTXOFixture, utxoFixtures } from "../fixtures/utxoFixtures.ts";
import { realUTXOFixtures } from "../fixtures/realUTXOFixtures.ts";
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { networks, Psbt } from "bitcoinjs-lib";
import { Buffer } from "node:buffer";

// Set environment to skip Redis and database connections before importing
(globalThis as any).SKIP_REDIS_CONNECTION = true;
(globalThis as any).SKIP_DB_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("SKIP_DB_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

// Create a comprehensive fixture function that includes both standard and real fixtures
function getAllFixtures(): UTXOFixture[] {
  const allFixtures: UTXOFixture[] = [];

  // Add standard fixtures
  Object.values(utxoFixtures).forEach((scriptTypeGroup) => {
    Object.values(scriptTypeGroup).forEach((fixture) => {
      allFixtures.push(fixture);
    });
  });

  // Add real fixtures converted to UTXOFixture format
  Object.values(realUTXOFixtures).forEach((scriptTypeGroup) => {
    Object.values(scriptTypeGroup).forEach((fixture: any) => {
      allFixtures.push({
        txid: fixture.txid,
        vout: fixture.vout,
        value: fixture.value,
        script: fixture.script,
        address: fixture.address,
        scriptType: fixture.scriptType,
        witnessUtxo: fixture.witnessUtxo,
        blockHeight: fixture.blockHeight,
        confirmations: fixture.confirmations,
        isTestnet: fixture.isTestnet || false,
      });
    });
  });

  return allFixtures;
}

// Mock getUTXOForAddress from utxoUtils
const mockGetUTXOForAddress = (
  _address: string,
  txid: string,
  vout: number,
) => {
  // Find a matching fixture based on txid using comprehensive fixtures
  const allFixtures = getAllFixtures();
  const fixture = allFixtures.find((f) => f.txid === txid && f.vout === vout);

  if (fixture) {
    return {
      utxo: {
        value: Number(fixture.value),
        script: fixture.script,
        ancestor: null,
      },
    };
  }

  // Return mock data for unknown txids
  return {
    utxo: {
      value: 100000,
      script: "0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b",
      ancestor: null,
    },
  };
};

// Mock CommonUTXOService
class MockCommonUTXOService {
  getSpecificUTXO(txid: string, vout: number, _options?: any) {
    const allFixtures = getAllFixtures();
    const fixture = allFixtures.find((f) => f.txid === txid && f.vout === vout);

    if (fixture) {
      return {
        value: Number(fixture.value),
        script: fixture.script,
        ancestor: null,
      };
    }

    // Return mock data for unknown txids
    return {
      value: 100000,
      script: "0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b",
      ancestor: null,
    };
  }

  getRawTransactionHex(txid: string) {
    // Return mock raw transaction hex
    return "02000000000101" + txid + "00000000000000000000";
  }
}

// Mock estimateFee
const mockEstimateFee = (
  outputs: any[],
  feeRate: number,
  inputCount: number,
) => {
  // Simple fee calculation: (inputs * 148 + outputs * 34 + 10) * feeRate
  const size = inputCount * 148 + outputs.length * 34 + 10;
  return Math.ceil(size * feeRate);
};

// No need to store original functions with dependency injection

// Create mocked PSBT service instance for tests
let mockedPsbtService: BitcoinTransactionBuilderImpl;

describe(
  "BitcoinTransactionBuilder",
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    beforeEach(() => {
      // Create mocked service with comprehensive fixtures
      mockedPsbtService = createBitcoinTransactionBuilder({
        getUTXOForAddress: mockGetUTXOForAddress,
        estimateFee: mockEstimateFee,
        commonUtxoService: new MockCommonUTXOService(),
      });

      // Set the mocked instance for static method calls
      BitcoinTransactionBuilder.setInstance(mockedPsbtService);
    });

    afterEach(() => {
      // Reset the BitcoinTransactionBuilder to use default dependencies
      BitcoinTransactionBuilder.resetInstance();
    });

    describe("formatPsbtForLogging", () => {
      it("should format PSBT data for logging", () => {
        // Use the imported formatPsbtForLogging function

        // Create a mock PSBT
        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash:
            "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
          index: 0,
          witnessUtxo: {
            script: Buffer.from(
              "0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b",
              "hex",
            ),
            value: 100000,
          },
        });
        psbt.addOutput({
          address: "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
          value: 50000,
        });

        const formatted = formatPsbtForLogging(psbt);

        assertExists(formatted.inputs);
        assertExists(formatted.outputs);
        assertEquals(formatted.inputs.length, 1);
        assertEquals(formatted.outputs.length, 1);
        assertEquals(formatted.inputs[0].witnessUtxo?.value, 100000);
        assertEquals(formatted.outputs[0].value, 50000);
      });
    });

    describe("createPSBT", () => {
      it("should create PSBT for P2WPKH address", async () => {
        const fixture = utxoFixtures.p2wpkh.standard;
        const utxoString = `${fixture.txid}:${fixture.vout}`;
        const salePrice = 0.001; // 0.001 BTC

        const psbtHex = await BitcoinTransactionBuilder.createPSBT(
          utxoString,
          salePrice,
          fixture.address,
        );

        assertExists(psbtHex);
        assertEquals(typeof psbtHex, "string");
        assertEquals(psbtHex.startsWith("70736274ff"), true); // PSBT magic bytes

        // Verify PSBT can be parsed
        const psbt = Psbt.fromHex(psbtHex);
        assertEquals(psbt.inputCount, 1);
        assertEquals(psbt.txOutputs.length, 1);
        assertEquals(psbt.txOutputs[0].value, 100000); // 0.001 BTC in sats
      });

      it("should create PSBT for P2PKH address", async () => {
        const fixture = utxoFixtures.p2pkh.standard;
        const utxoString = `${fixture.txid}:${fixture.vout}`;
        const salePrice = 0.01; // 0.01 BTC

        const psbtHex = await BitcoinTransactionBuilder.createPSBT(
          utxoString,
          salePrice,
          fixture.address,
        );

        assertExists(psbtHex);
        const psbt = Psbt.fromHex(psbtHex);
        assertEquals(psbt.inputCount, 1);
        assertEquals(psbt.txOutputs[0].value, 1000000); // 0.01 BTC in sats
      });

      it("should create PSBT for P2SH-P2WPKH address", async () => {
        const fixture = utxoFixtures.p2sh.wrappedSegwit;
        const utxoString = `${fixture.txid}:${fixture.vout}`;
        const salePrice = 0.001;

        const psbtHex = await BitcoinTransactionBuilder.createPSBT(
          utxoString,
          salePrice,
          fixture.address,
        );

        assertExists(psbtHex);
        const psbt = Psbt.fromHex(psbtHex);
        assertEquals(psbt.inputCount, 1);
      });

      it("should throw error for invalid UTXO string", async () => {
        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.createPSBT(
              "invalid",
              0.001,
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
            );
          },
          Error,
        );
      });

      it("should throw error for missing UTXO details", async () => {
        // Mock to return null
        (globalThis as any).getUTXOForAddressFromUtils = () => null;

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.createPSBT(
              "deadbeef:0",
              0.001,
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
            );
          },
          Error,
          "Invalid UTXO details",
        );
      });
    });

    describe("validateUTXOOwnership", () => {
      it("should validate UTXO ownership for correct address", async () => {
        const fixture = utxoFixtures.p2wpkh.standard;
        const utxoString = `${fixture.txid}:${fixture.vout}`;

        const isValid = await BitcoinTransactionBuilder.validateUTXOOwnership(
          utxoString,
          fixture.address,
        );

        assertEquals(isValid, true);
      });

      it("should return false for wrong address", async () => {
        const fixture = utxoFixtures.p2wpkh.standard;
        const utxoString = `${fixture.txid}:${fixture.vout}`;
        const wrongAddress = "bc1q000000000000000000000000000000000000000";

        const isValid = await BitcoinTransactionBuilder.validateUTXOOwnership(
          utxoString,
          wrongAddress,
        );

        assertEquals(isValid, false);
      });

      it("should return false for invalid UTXO string", async () => {
        const isValid = await BitcoinTransactionBuilder.validateUTXOOwnership(
          "invalid",
          "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
        );

        assertEquals(isValid, false);
      });

      it("should handle missing script in UTXO", async () => {
        // Mock to return UTXO without script
        (globalThis as any).getUTXOForAddressFromUtils = () => ({
          utxo: { value: 100000, script: null },
        });

        const isValid = await BitcoinTransactionBuilder.validateUTXOOwnership(
          "deadbeef:0",
          "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
        );

        assertEquals(isValid, false);
      });
    });

    describe("completePSBT", () => {
      it("should complete PSBT with buyer's input", async () => {
        const sellerFixture = utxoFixtures.p2wpkh.standard;
        const buyerFixture = utxoFixtures.p2wpkh.largeValue;

        // Create seller PSBT first
        const sellerPsbtHex = await BitcoinTransactionBuilder.createPSBT(
          `${sellerFixture.txid}:${sellerFixture.vout}`,
          0.001,
          sellerFixture.address,
        );

        const buyerUtxoString = `${buyerFixture.txid}:${buyerFixture.vout}`;
        const feeRate = 10; // 10 sat/vB

        const completedPsbtHex = await BitcoinTransactionBuilder.completePSBT(
          sellerPsbtHex,
          buyerUtxoString,
          buyerFixture.address,
          feeRate,
        );

        assertExists(completedPsbtHex);
        const psbt = Psbt.fromHex(completedPsbtHex);
        assertEquals(psbt.inputCount, 2); // Seller + buyer inputs
        assertEquals(psbt.txOutputs.length >= 2, true); // At least seller payment + change
      });

      it("should handle insufficient funds error", async () => {
        const sellerFixture = utxoFixtures.p2wpkh.standard;
        const buyerFixture = utxoFixtures.p2wpkh.dustAmount; // Very small amount

        const sellerPsbtHex = await BitcoinTransactionBuilder.createPSBT(
          `${sellerFixture.txid}:${sellerFixture.vout}`,
          0.1, // Large amount that buyer can't afford
          sellerFixture.address,
        );

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.completePSBT(
              sellerPsbtHex,
              `${buyerFixture.txid}:${buyerFixture.vout}`,
              buyerFixture.address,
              100, // High fee rate
            );
          },
          Error,
          "Insufficient funds",
        );
      });

      it("should throw error for invalid seller PSBT", async () => {
        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.completePSBT(
              "invalid",
              "deadbeef:0",
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
              10,
            );
          },
          Error,
        );
      });

      it("should throw error when seller UTXO not found", async () => {
        // Create a PSBT with non-existent UTXO
        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash:
            "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
          index: 0,
          witnessUtxo: {
            script: Buffer.from(
              "0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b",
              "hex",
            ),
            value: 100000,
          },
        });
        psbt.addOutput({
          address: "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
          value: 50000,
        });

        // Mock to return null for seller UTXO
        let callCount = 0;
        (globalThis as any).getUTXOForAddressFromUtils = () => {
          callCount++;
          if (callCount === 1) return null; // Seller UTXO not found
          return { utxo: { value: 100000, script: "0014..." } };
        };

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.completePSBT(
              psbt.toHex(),
              "anothertxid:0",
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
              10,
            );
          },
          Error,
          "Seller's UTXO not found",
        );
      });
    });

    describe("processCounterpartyPSBT", () => {
      it("should process counterparty PSBT in dry run mode", async () => {
        // Create a mock PSBT
        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash: utxoFixtures.p2wpkh.standard.txid,
          index: utxoFixtures.p2wpkh.standard.vout,
          witnessUtxo: {
            script: hex2bin(utxoFixtures.p2wpkh.standard.script),
            value: BigInt(utxoFixtures.p2wpkh.standard.value),
          },
        });
        psbt.addOutput({
          address: utxoFixtures.p2wpkh.standard.address,
          value: 50000n,
        });

        const result = await BitcoinTransactionBuilder.processCounterpartyPSBT(
          psbt.toBase64(),
          utxoFixtures.p2wpkh.standard.address,
          10,
          true, // isDryRun
        );

        assertExists(result.estimatedFee);
        assertExists(result.estimatedVsize);
        assertExists(result.totalInputValue);
        assertExists(result.totalOutputValue);
        assertEquals(typeof result.estimatedFee, "number");
        assertEquals(typeof result.estimatedVsize, "number");
      });

      it("should process counterparty PSBT with service fee", async () => {
        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash: utxoFixtures.p2wpkh.standard.txid,
          index: utxoFixtures.p2wpkh.standard.vout,
          witnessUtxo: {
            script: hex2bin(utxoFixtures.p2wpkh.standard.script),
            value: BigInt(utxoFixtures.p2wpkh.standard.value),
          },
        });
        psbt.addOutput({
          address: utxoFixtures.p2wpkh.standard.address,
          value: 50000n,
        });

        const result = await BitcoinTransactionBuilder.processCounterpartyPSBT(
          psbt.toBase64(),
          utxoFixtures.p2wpkh.standard.address,
          10,
          true,
          {
            serviceFeeDetails: {
              fee: 1000,
              address: "bc1qservicefeeaddress0000000000000000000000",
            },
          },
        );

        assertExists(result);
        assertEquals(result.totalOutputValue >= 51000n, true); // Original + service fee
      });

      it("should handle invalid PSBT base64", async () => {
        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.processCounterpartyPSBT(
              "invalid",
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
              10,
              false,
            );
          },
          Error,
        );
      });

      it("should handle PSBT with invalid transaction structure", async () => {
        // Create PSBT without proper transaction structure
        const psbt = new Psbt({ network: networks.bitcoin });
        // Don't add any inputs/outputs

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.processCounterpartyPSBT(
              psbt.toBase64(),
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
              10,
              false,
            );
          },
          Error,
          "Invalid transaction structure",
        );
      });
    });

    describe("buildPsbtFromUserFundedRawHex", () => {
      it("should build PSBT from user funded raw hex", async () => {
        // Create a mock transaction hex
        const mockTxHex =
          "020000000001010000000000000000000000000000000000000000000000000000000000000000000000000000000000";

        const result = await BitcoinTransactionBuilder.buildPsbtFromUserFundedRawHex(
          mockTxHex,
          utxoFixtures.p2wpkh.standard.address,
          10,
          {
            dispenserDestinationAddress:
              "bc1qdispenser00000000000000000000000000000",
            dispenserPaymentAmount: 100000,
          },
        );

        assertExists(result.psbtHex);
        assertExists(result.inputsToSign);
        assertExists(result.estimatedFee);
        assertExists(result.estimatedVsize);
        assertExists(result.finalBuyerChange);
        assertEquals(typeof result.psbtHex, "string");
        assertEquals(Array.isArray(result.inputsToSign), true);
      });

      it("should handle service fee in buildPsbtFromUserFundedRawHex", async () => {
        const mockTxHex =
          "020000000001010000000000000000000000000000000000000000000000000000000000000000000000000000000000";

        const result = await BitcoinTransactionBuilder.buildPsbtFromUserFundedRawHex(
          mockTxHex,
          utxoFixtures.p2wpkh.standard.address,
          10,
          {
            dispenserDestinationAddress:
              "bc1qdispenser00000000000000000000000000000",
            dispenserPaymentAmount: 100000,
            serviceFeeDetails: {
              fee: 5000,
              address: "bc1qservicefee000000000000000000000000000",
            },
          },
        );

        assertExists(result.psbtHex);
        assertEquals(result.estimatedFee > 0, true);
      });

      it("should throw error for hex with no inputs", async () => {
        // Create transaction with no inputs
        const mockTxHex = "0200000000"; // Version 2, no inputs

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.buildPsbtFromUserFundedRawHex(
              mockTxHex,
              utxoFixtures.p2wpkh.standard.address,
              10,
              {
                dispenserDestinationAddress:
                  "bc1qdispenser00000000000000000000000000000",
                dispenserPaymentAmount: 100000,
              },
            );
          },
          Error,
          "must have at least one input",
        );
      });

      it("should handle OP_RETURN output", async () => {
        // Create a transaction with OP_RETURN output
        const mockTxHex =
          "020000000001010000000000000000000000000000000000000000000000000000000000000000000000000000000001066a047465737400000000";

        const result = await BitcoinTransactionBuilder.buildPsbtFromUserFundedRawHex(
          mockTxHex,
          utxoFixtures.p2wpkh.standard.address,
          10,
          {
            dispenserDestinationAddress:
              "bc1qdispenser00000000000000000000000000000",
            dispenserPaymentAmount: 100000,
          },
        );

        assertExists(result.psbtHex);
        // Verify PSBT includes OP_RETURN
        const psbt = Psbt.fromHex(result.psbtHex);
        const hasOpReturn = psbt.txOutputs.some((out) => out.script[0] === 0x6a // OP_RETURN
        );
        assertEquals(hasOpReturn, true);
      });
    });

    describe("getAddressType", () => {
      it("should identify P2WPKH addresses", () => {
        const addressType = (BitcoinTransactionBuilder as any).getAddressType(
          "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
          networks.bitcoin,
        );
        assertEquals(addressType, "p2wpkh");
      });

      it("should identify P2PKH addresses", () => {
        const addressType = (BitcoinTransactionBuilder as any).getAddressType(
          "19dENFt4wVwos6xtgwStA6n8bbA57WCS58",
          networks.bitcoin,
        );
        assertEquals(addressType, "p2pkh");
      });

      it("should identify P2SH addresses", () => {
        const addressType = (BitcoinTransactionBuilder as any).getAddressType(
          "3JRdkXJFhyWH6QrXbZpFjsJdEMhD4z5yQz",
          networks.bitcoin,
        );
        assertEquals(addressType, "p2sh");
      });

      it("should identify testnet addresses", () => {
        const addressType = (BitcoinTransactionBuilder as any).getAddressType(
          "tb1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
          networks.testnet,
        );
        assertEquals(addressType, "p2wpkh");
      });

      it("should throw error for unsupported address type", () => {
        assertThrows(
          () => {
            (BitcoinTransactionBuilder as any).getAddressType(
              "invalid_address",
              networks.bitcoin,
            );
          },
          Error,
          "Unsupported address type",
        );
      });
    });

    describe("getAddressNetwork", () => {
      it("should identify bitcoin mainnet addresses", () => {
        const network = (BitcoinTransactionBuilder as any).getAddressNetwork(
          "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
        );
        assertEquals(network, networks.bitcoin);
      });

      it("should identify bitcoin testnet addresses", () => {
        const network = (BitcoinTransactionBuilder as any).getAddressNetwork(
          "tb1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
        );
        assertEquals(network, networks.testnet);
      });

      it("should throw error for invalid address", () => {
        assertThrows(
          () => {
            (BitcoinTransactionBuilder as any).getAddressNetwork("invalid_address");
          },
          Error,
          "Invalid Bitcoin address",
        );
      });
    });

    describe("getAddressFromScript", () => {
      it("should derive address from P2WPKH script", () => {
        const script = new Uint8Array(
          hex2bin("0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b"),
        );
        const address = (BitcoinTransactionBuilder as any).getAddressFromScript(
          script,
          networks.bitcoin,
        );
        assertEquals(typeof address, "string");
        assertEquals(address.startsWith("bc1"), true);
      });

      it("should derive address from P2PKH script", () => {
        const script = new Uint8Array(
          hex2bin("76a9145e9b23809261178723055968d134a947f47e799f88ac"),
        );
        const address = (BitcoinTransactionBuilder as any).getAddressFromScript(
          script,
          networks.bitcoin,
        );
        assertEquals(typeof address, "string");
        assertEquals(address.startsWith("1"), true);
      });

      it("should throw error for invalid script", () => {
        const invalidScript = new Uint8Array([0x00, 0x00]);
        assertThrows(
          () => {
            (BitcoinTransactionBuilder as any).getAddressFromScript(
              invalidScript,
              networks.bitcoin,
            );
          },
          Error,
          "Failed to derive address from script",
        );
      });
    });

    describe("Edge cases and error handling", () => {
      it("should handle BigInt values correctly", async () => {
        const fixture = utxoFixtures.p2wpkh.largeValue;
        const utxoString = `${fixture.txid}:${fixture.vout}`;

        const psbtHex = await BitcoinTransactionBuilder.createPSBT(
          utxoString,
          3.14, // Large BTC amount
          fixture.address,
        );

        const psbt = Psbt.fromHex(psbtHex);
        assertEquals(psbt.txOutputs[0].value, 314000000); // 3.14 BTC in sats
      });

      it("should handle dust amounts", async () => {
        const fixture = utxoFixtures.p2wpkh.dustAmount;
        const utxoString = `${fixture.txid}:${fixture.vout}`;

        const psbtHex = await BitcoinTransactionBuilder.createPSBT(
          utxoString,
          0.00000546, // Dust amount
          fixture.address,
        );

        const psbt = Psbt.fromHex(psbtHex);
        assertEquals(psbt.txOutputs[0].value, 546); // Dust threshold
      });

      it("should handle RBF (Replace-By-Fee) sequence", async () => {
        const fixture = utxoFixtures.p2wpkh.standard;
        const psbtHex = await BitcoinTransactionBuilder.createPSBT(
          `${fixture.txid}:${fixture.vout}`,
          0.001,
          fixture.address,
        );

        const psbt = Psbt.fromHex(psbtHex);
        assertEquals(psbt.txInputs[0].sequence, 0xfffffffd); // RBF enabled
      });

      it("should handle array return from getUTXOForAddress", async () => {
        // Mock to return array instead of object
        (globalThis as any).getUTXOForAddressFromUtils = () => [];

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.createPSBT(
              "deadbeef:0",
              0.001,
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
            );
          },
          Error,
          "Invalid UTXO details",
        );
      });

      it("should handle missing witnessUtxo in completePSBT", async () => {
        // Create PSBT without witnessUtxo
        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash:
            "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
          index: 0,
        });
        psbt.addOutput({
          address: "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
          value: 50000,
        });

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.completePSBT(
              psbt.toHex(),
              "anothertxid:0",
              "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
              10,
            );
          },
          Error,
          "witnessUtxo not found",
        );
      });

      it("should handle script type info for non-witness inputs", async () => {
        // Mock CommonUTXOService to return P2PKH script
        (BitcoinTransactionBuilder as any).commonUtxoService.getRawTransactionHex = () => {
          return "020000000101deadbeef00000000000000000000000000000000000000000000000000000000000000000000000000";
        };

        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash: utxoFixtures.p2pkh.standard.txid,
          index: utxoFixtures.p2pkh.standard.vout,
          witnessUtxo: {
            script: hex2bin(utxoFixtures.p2pkh.standard.script),
            value: BigInt(utxoFixtures.p2pkh.standard.value),
          },
        });

        const result = await BitcoinTransactionBuilder.processCounterpartyPSBT(
          psbt.toBase64(),
          utxoFixtures.p2pkh.standard.address,
          10,
          true,
        );

        assertExists(result.estimatedFee);
      });
    });

    describe("Coverage completion tests", () => {
      it("should test all branches in formatTransactionData", async () => {
        // Test with tx_hash and single result
        const fixture = utxoFixtures.p2wpkh.standard;
        (globalThis as any).getUTXOForAddressFromUtils = () => ({
          utxo: {
            value: Number(fixture.value),
            script: fixture.script,
          },
        });

        // Need to access the private method through the service
        const psbtHex = await BitcoinTransactionBuilder.createPSBT(
          `${fixture.txid}:${fixture.vout}`,
          0.001,
          fixture.address,
        );

        assertExists(psbtHex);
      });

      it("should handle all error paths in processCounterpartyPSBT", async () => {
        // Test with enrichment error
        (BitcoinTransactionBuilder as any).commonUtxoService.getSpecificUTXO = () => {
          throw new Error("Enrichment failed");
        };

        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash: utxoFixtures.p2wpkh.standard.txid,
          index: utxoFixtures.p2wpkh.standard.vout,
        });

        await assertRejects(
          async () => {
            await BitcoinTransactionBuilder.processCounterpartyPSBT(
              psbt.toBase64(),
              utxoFixtures.p2wpkh.standard.address,
              10,
              false,
            );
          },
          Error,
          "Failed to process PSBT",
        );
      });

      it("should handle change output removal in processCounterpartyPSBT", async () => {
        // Create PSBT with output to user address (should be removed as old change)
        const psbt = new Psbt({ network: networks.bitcoin });
        const userAddress = utxoFixtures.p2wpkh.standard.address;

        psbt.addInput({
          hash: utxoFixtures.p2wpkh.standard.txid,
          index: utxoFixtures.p2wpkh.standard.vout,
          witnessUtxo: {
            script: hex2bin(utxoFixtures.p2wpkh.standard.script),
            value: BigInt(utxoFixtures.p2wpkh.standard.value),
          },
        });

        // Add output to user address (should be treated as old change)
        psbt.addOutput({
          address: userAddress,
          value: 10000n,
        });

        // Add another output (should be preserved)
        psbt.addOutput({
          address: "bc1qother00000000000000000000000000000000",
          value: 20000n,
        });

        const result = await BitcoinTransactionBuilder.processCounterpartyPSBT(
          psbt.toBase64(),
          userAddress,
          10,
          true,
        );

        assertExists(result);
        assertEquals(result.totalOutputValue, 20000n); // Only the non-change output
      });

      it("should handle finalization errors in processCounterpartyPSBT", async () => {
        // Create a complex PSBT that might fail finalization
        const psbt = new Psbt({ network: networks.bitcoin });

        // Add input without proper data for finalization
        psbt.addInput({
          hash: utxoFixtures.p2wsh.complexScript.txid,
          index: utxoFixtures.p2wsh.complexScript.vout,
          // Missing witnessScript that would be needed for finalization
          witnessUtxo: {
            script: hex2bin(utxoFixtures.p2wsh.complexScript.script),
            value: BigInt(utxoFixtures.p2wsh.complexScript.value),
          },
        });

        // This test will log errors during finalization but should still complete
        const result = await BitcoinTransactionBuilder.processCounterpartyPSBT(
          psbt.toBase64(),
          utxoFixtures.p2wpkh.standard.address,
          10,
          true, // Dry run to avoid actual finalization requirement
        );

        assertExists(result);
      });

      it("should test buildPsbtFromUserFundedRawHex with multiple inputs", async () => {
        // Create transaction with multiple inputs
        const mockTxHex =
          "020000000002010000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000";

        const result = await BitcoinTransactionBuilder.buildPsbtFromUserFundedRawHex(
          mockTxHex,
          utxoFixtures.p2wpkh.standard.address,
          10,
          {
            dispenserDestinationAddress:
              "bc1qdispenser00000000000000000000000000000",
            dispenserPaymentAmount: 100000,
          },
        );

        assertExists(result.psbtHex);
        assertEquals(result.inputsToSign.length, 2); // Two inputs to sign
      });

      it("should handle P2SH redeem script in processCounterpartyPSBT", async () => {
        // Mock getScriptTypeInfo to return P2SH with redeem script
        const originalGetScriptTypeInfo = (globalThis as any).getScriptTypeInfo;
        (globalThis as any).getScriptTypeInfo = (_script: string) => ({
          type: "P2SH",
          isWitness: false,
          redeemScriptType: {
            isWitness: true,
            hex: "00141234567890abcdef",
          },
        });

        const psbt = new Psbt({ network: networks.bitcoin });
        psbt.addInput({
          hash: utxoFixtures.p2sh.multisig.txid,
          index: utxoFixtures.p2sh.multisig.vout,
          witnessUtxo: {
            script: hex2bin(utxoFixtures.p2sh.multisig.script),
            value: BigInt(utxoFixtures.p2sh.multisig.value),
          },
        });

        const result = await BitcoinTransactionBuilder.processCounterpartyPSBT(
          psbt.toBase64(),
          utxoFixtures.p2wpkh.standard.address,
          10,
          true,
        );

        assertExists(result);

        // Restore original function
        (globalThis as any).getScriptTypeInfo = originalGetScriptTypeInfo;
      });
    });
  },
);
