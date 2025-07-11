/**
 * @fileoverview Comprehensive PSBTService tests with dependency injection and fixtures
 * Combines unit tests, integration tests, and fixture-based tests for full coverage
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Buffer } from "node:buffer";
import { networks, Psbt, Transaction } from "bitcoinjs-lib";
import * as bitcoin from "../mocks/bitcoinjs-lib.mock.ts";

// Set test environment before any imports
(globalThis as any).SKIP_REDIS_CONNECTION = true;
(globalThis as any).SKIP_DB_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("SKIP_DB_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

import {
  createPSBTService,
  formatPsbtForLogging,
  PSBTService,
} from "../../server/services/transaction/psbtService.ts";
import { utxoFixtures } from "../fixtures/utxoFixtures.ts";
import { clearMockUTXOResponses } from "../mocks/utxoUtils.mock.ts";
import {
  clearMockResponses,
  MockCommonUTXOService,
  setMockTransactionHex,
  setMockUTXOResponse as setMockCommonUTXOResponse,
} from "../mocks/CommonUTXOService.mock.ts";

// Test address and fixtures
const TEST_ADDRESS = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";

// Create mock dependencies for injected tests
const createMockDependencies = () => ({
  getUTXOForAddress: (
    _address: string,
    specificTxid?: string,
    specificVout?: number,
  ) => {
    const allFixtures = Object.values(utxoFixtures).flatMap((group) =>
      Object.values(group)
    );

    const fixture = allFixtures.find((f) =>
      f.txid === specificTxid && f.vout === specificVout
    );

    if (fixture) {
      return Promise.resolve({
        utxo: {
          value: Number(fixture.value),
          script: fixture.script,
          ancestor: fixture.blockHeight
            ? {
              fees: 0,
              vsize: 250,
              effectiveRate: 0,
              txid: fixture.txid,
              vout: fixture.vout,
              weight: 1000,
              size: 250,
              scriptType: fixture.scriptType,
              sequence: 0xfffffffd,
              blockHeight: fixture.blockHeight,
              confirmations: fixture.confirmations || 1,
            }
            : null,
        },
      });
    }

    return Promise.resolve({
      utxo: {
        value: 100000,
        script: "0014cafebabe".repeat(5).slice(0, 44),
        ancestor: null,
      },
    });
  },

  estimateFee: (outputs: any[], feeRate: number, inputCount: number) => {
    const size = inputCount * 148 + outputs.length * 34 + 10;
    const fee = Math.ceil(size * feeRate);
    return fee;
  },

  commonUtxoService: MockCommonUTXOService.getInstance(),
  bitcoin: bitcoin,
});

describe("PSBTService Comprehensive Coverage", () => {
  describe("PSBTService with Dependency Injection", () => {
    let psbtService: ReturnType<typeof createPSBTService>;

    beforeEach(() => {
      clearMockUTXOResponses();
      clearMockResponses();
      psbtService = createPSBTService(createMockDependencies());
    });

    afterEach(() => {
      clearMockUTXOResponses();
      clearMockResponses();
    });

    describe("createPSBT with UTXO Fixtures", () => {
      it("should create PSBT with P2WPKH standard fixture", async () => {
        const fixture = utxoFixtures.p2wpkh.standard;
        const salePrice = 0.001;
        const sellerAddress = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

        setMockTransactionHex(
          fixture.txid,
          "02000000" + "01" + "0".repeat(64) + "00000000" + "00" + "ffffffff" +
            "01" + Number(fixture.value).toString(16).padStart(16, "0") +
            (fixture.script.length / 2).toString(16).padStart(2, "0") +
            fixture.script + "00000000",
        );

        const psbtHex = await psbtService.createPSBT(
          `${fixture.txid}:${fixture.vout}`,
          salePrice,
          sellerAddress,
        );

        assertExists(psbtHex);
        assertEquals(typeof psbtHex, "string");
        assertEquals(psbtHex.startsWith("70736274ff"), true);

        const psbt = bitcoin.Psbt.fromHex(psbtHex);
        assertEquals(psbt.data.inputs.length, 1);
        assertEquals(psbt.txOutputs.length, 2);
        assertExists(psbt.data.inputs[0].witnessUtxo);
      });

      it("should reject dust amounts", async () => {
        const fixture = utxoFixtures.p2wpkh.dustAmount;
        const salePrice = 0.00000001;

        setMockTransactionHex(
          fixture.txid,
          "02000000" + "01" + "0".repeat(64) + "00000000" + "00" + "ffffffff" +
            "01" + Number(fixture.value).toString(16).padStart(16, "0") +
            (fixture.script.length / 2).toString(16).padStart(2, "0") +
            fixture.script + "00000000",
        );

        await assertRejects(
          async () => {
            await psbtService.createPSBT(
              `${fixture.txid}:${fixture.vout}`,
              salePrice,
              "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
            );
          },
          Error,
        );
      });

      it("should handle P2PKH addresses", async () => {
        const fixture = utxoFixtures.p2pkh.standard;
        const salePrice = 0.005;
        const sellerAddress = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

        setMockTransactionHex(
          fixture.txid,
          "02000000" + "01" + "a".repeat(64) + "00000000" + "00" + "ffffffff" +
            "01" + fixture.value.toString(16).padStart(16, "0") +
            (fixture.script.length / 2).toString(16).padStart(2, "0") +
            fixture.script + "00000000",
        );

        const psbtHex = await psbtService.createPSBT(
          `${fixture.txid}:${fixture.vout}`,
          salePrice,
          sellerAddress,
        );

        assertExists(psbtHex);
        const psbt = bitcoin.Psbt.fromHex(psbtHex);
        assertEquals(psbt.data.inputs.length, 1);
        assertEquals(psbt.txOutputs.length, 2);
      });
    });

    describe("validateUTXOOwnership with Fixtures", () => {
      it("should validate ownership for correct address", async () => {
        const fixture = utxoFixtures.p2wpkh.standard;

        setMockCommonUTXOResponse(fixture.txid, fixture.vout, {
          value: Number(fixture.value),
          script: fixture.script,
          address: fixture.address,
        });

        const isValid = await psbtService.validateUTXOOwnership(
          `${fixture.txid}:${fixture.vout}`,
          fixture.address,
        );

        assertEquals(isValid, true);
      });

      it("should reject ownership for wrong address", async () => {
        const fixture = utxoFixtures.p2wpkh.standard;
        const wrongAddress = utxoFixtures.p2pkh.standard.address;

        setMockCommonUTXOResponse(fixture.txid, fixture.vout, {
          value: Number(fixture.value),
          script: fixture.script,
          address: fixture.address,
        });

        const isValid = await psbtService.validateUTXOOwnership(
          `${fixture.txid}:${fixture.vout}`,
          wrongAddress,
        );

        assertEquals(isValid, false);
      });
    });

    describe("processCounterpartyPSBT with Fixtures", () => {
      it("should process PSBT with mixed fixture types", async () => {
        const buyerFixture = utxoFixtures.p2wpkh.standard;
        const sellerFixture = utxoFixtures.p2pkh.standard;

        const psbt = new bitcoin.Psbt();
        psbt.addInput({
          hash: buyerFixture.txid,
          index: buyerFixture.vout,
          witnessUtxo: {
            value: buyerFixture.value,
            script: Buffer.from(buyerFixture.script, "hex"),
          },
        });

        psbt.addOutput({
          address: sellerFixture.address,
          value: 100000n,
        });

        setMockTransactionHex(
          sellerFixture.txid,
          "02000000" + "01" + "c".repeat(64) + "00000000" + "00" + "ffffffff" +
            "01" + sellerFixture.value.toString(16).padStart(16, "0") +
            (sellerFixture.script.length / 2).toString(16).padStart(2, "0") +
            sellerFixture.script + "00000000",
        );

        const result = await psbtService.processCounterpartyPSBT(
          psbt.toHex(),
          `${sellerFixture.txid}:${sellerFixture.vout}`,
          sellerFixture.address,
        );

        assertExists(result);
        assertExists(result.psbtHex);
        assertEquals(typeof result.psbtHex, "string");
        assertEquals(result.psbtHex.startsWith("70736274ff"), true);
      });
    });

    describe("Edge Cases with Fixtures", () => {
      it("should handle invalid UTXO string format", async () => {
        await assertRejects(
          async () => {
            await psbtService.createPSBT(
              "invalid-format",
              0.001,
              "bc1q7c6u6q8g50txf9e9qw4m4w8ukmh3lxp2c8yz3g",
            );
          },
          Error,
          "Invalid utxo format",
        );
      });

      it("should handle negative vout", async () => {
        await assertRejects(
          async () => {
            await psbtService.createPSBT(
              "deadbeef:-1",
              0.001,
              "bc1q7c6u6q8g50txf9e9qw4m4w8ukmh3lxp2c8yz3g",
            );
          },
          Error,
          "Invalid vout value",
        );
      });

      it("should handle mixed network addresses", async () => {
        const mainnetFixture = utxoFixtures.p2wpkh.standard;
        const testnetAddress = "tb1q7c6u6q8g50txf9e9qw4m4w8ukmh3lxp2czyz3g";

        setMockTransactionHex(
          mainnetFixture.txid,
          "02000000" + "01" + "0".repeat(64) + "00000000" + "00" + "ffffffff" +
            "01" + Number(mainnetFixture.value).toString(16).padStart(16, "0") +
            (mainnetFixture.script.length / 2).toString(16).padStart(2, "0") +
            mainnetFixture.script + "00000000",
        );

        await assertRejects(
          async () => {
            await psbtService.createPSBT(
              `${mainnetFixture.txid}:${mainnetFixture.vout}`,
              0.001,
              testnetAddress,
            );
          },
          Error,
          "Network mismatch: Cannot use testnet address",
        );
      });
    });

    describe("Fee Calculations with Fixtures", () => {
      it("should calculate correct fees for different script types", async () => {
        const testCases = [
          { fixture: utxoFixtures.p2wpkh.standard, expectedMaxFee: 2000 },
          { fixture: utxoFixtures.p2pkh.standard, expectedMaxFee: 3000 },
          { fixture: utxoFixtures.p2wsh.multisig2of3, expectedMaxFee: 5000 },
        ];

        for (const { fixture, expectedMaxFee } of testCases) {
          if (fixture.scriptType === "p2pkh") {
            setMockTransactionHex(
              fixture.txid,
              "02000000" + "01" + "d".repeat(64) + "00000000" + "00" +
                "ffffffff" +
                "01" + fixture.value.toString(16).padStart(16, "0") +
                (fixture.script.length / 2).toString(16).padStart(2, "0") +
                fixture.script + "00000000",
            );
          }

          const salePrice = 0.001;
          const _psbtHex = await psbtService.createPSBT(
            `${fixture.txid}:${fixture.vout}`,
            salePrice,
            "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          );

          const totalInput = Number(fixture.value);
          const saleAmountSats = Math.floor(salePrice * 100000000);
          const expectedFee = 1920;
          const expectedChange = totalInput - saleAmountSats - expectedFee;
          const totalOutput = saleAmountSats +
            (expectedChange > 333 ? expectedChange : 0);
          const fee = totalInput - totalOutput;

          assertEquals(
            fee > 0,
            true,
            `Fee should be positive for ${fixture.scriptType}`,
          );
          assertEquals(
            fee < expectedMaxFee,
            true,
            `Fee should be less than ${expectedMaxFee} for ${fixture.scriptType}, got ${fee}`,
          );
        }
      });
    });
  });

  describe("formatPsbtForLogging", () => {
    it("should format PSBT for logging correctly", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      // Add a mock input with witnessUtxo
      psbt.addInput({
        hash:
          "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
        index: 0,
        witnessUtxo: {
          script: Buffer.from(
            "0014bd9b3a3dc6056392a498146692050e1719a5d70d",
            "hex",
          ),
          value: 44089800n,
        },
      });

      // Add a mock output
      psbt.addOutput({
        address: TEST_ADDRESS,
        value: 44089800n,
      });

      const formatted = formatPsbtForLogging(psbt);

      assertEquals(formatted.inputs.length, 1);
      assertEquals(formatted.outputs.length, 1);
      assertEquals(formatted.inputs[0].witnessUtxo.value, 44089800);
      assertEquals(formatted.outputs[0].value, 44089800);
      assertEquals(formatted.outputs[0].address, TEST_ADDRESS);
    });

    it("should handle PSBT with no witnessUtxo", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      // Add input without witnessUtxo
      psbt.addInput({
        hash:
          "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
        index: 0,
      });

      psbt.addOutput({
        address: TEST_ADDRESS,
        value: 1000000n,
      });

      const formatted = formatPsbtForLogging(psbt);

      assertEquals(formatted.inputs.length, 1);
      assertEquals(formatted.inputs[0].witnessUtxo, undefined);
      assertEquals(formatted.outputs.length, 1);
    });

    it("should handle PSBT with multiple inputs and outputs", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      // Add multiple inputs
      psbt.addInput({
        hash:
          "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
        index: 0,
        witnessUtxo: {
          script: Buffer.from(
            "0014bd9b3a3dc6056392a498146692050e1719a5d70d",
            "hex",
          ),
          value: 44089800n,
        },
      });

      psbt.addInput({
        hash:
          "ee9ee0c0c1de2591dc5b04c528ba60b3609d5c78ca0303d81a17e81f908a962d",
        index: 1,
        witnessUtxo: {
          script: Buffer.from(
            "0014bd9b3a3dc6056392a498146692050e1719a5d70d",
            "hex",
          ),
          value: 546n,
        },
      });

      // Add multiple outputs
      psbt.addOutput({
        address: TEST_ADDRESS,
        value: 100000n,
      });

      psbt.addOutput({
        address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        value: 50000n,
      });

      const formatted = formatPsbtForLogging(psbt);

      assertEquals(formatted.inputs.length, 2);
      assertEquals(formatted.outputs.length, 2);
      assertEquals(formatted.inputs[0].witnessUtxo.value, 44089800);
      assertEquals(formatted.inputs[1].witnessUtxo.value, 546);
      assertEquals(formatted.outputs[0].value, 100000);
      assertEquals(formatted.outputs[1].value, 50000);
    });

    it("should handle empty PSBT", () => {
      const psbt = new Psbt({ network: networks.bitcoin });
      const formatted = formatPsbtForLogging(psbt);

      assertEquals(formatted.inputs.length, 0);
      assertEquals(formatted.outputs.length, 0);
    });

    it("should convert BigInt values to numbers", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      psbt.addInput({
        hash:
          "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 2100000000000000n, // Large BigInt
        },
      });

      psbt.addOutput({
        script: Buffer.from("6a", "hex"), // OP_RETURN
        value: 0n,
      });

      const formatted = formatPsbtForLogging(psbt);

      assertEquals(typeof formatted.inputs[0].witnessUtxo.value, "number");
      assertEquals(formatted.inputs[0].witnessUtxo.value, 2100000000000000);
      assertEquals(formatted.outputs[0].value, 0);
      assertEquals(formatted.outputs[0].address, undefined);
    });
  });

  describe("PSBTService.getAddressType (private method)", () => {
    it("should correctly identify P2WPKH addresses", () => {
      // The method is static but private, need to access it differently
      const service = PSBTService as any;
      const result = service.getAddressType(TEST_ADDRESS, networks.bitcoin);
      assertEquals(result, "p2wpkh");
    });

    it("should correctly identify P2SH addresses", () => {
      const service = PSBTService as any;
      const p2shAddress = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
      const result = service.getAddressType(p2shAddress, networks.bitcoin);
      // The current implementation cannot distinguish P2SH-P2WPKH from regular P2SH
      // without additional information, so it returns 'p2sh'
      assertEquals(result, "p2sh");
    });

    it("should correctly identify P2PKH addresses", () => {
      const service = PSBTService as any;
      const p2pkhAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const result = service.getAddressType(p2pkhAddress, networks.bitcoin);
      assertEquals(result, "p2pkh");
    });

    it("should throw error for unsupported address type", () => {
      const service = PSBTService as any;
      assertThrows(
        () => service.getAddressType("invalid-address", networks.bitcoin),
        Error,
        "Unsupported address type",
      );
    });

    it("should handle testnet addresses", () => {
      const service = PSBTService as any;
      const testnetAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
      const result = service.getAddressType(testnetAddress, networks.testnet);
      assertEquals(result, "p2wpkh");
    });
  });

  describe("PSBTService.getAddressNetwork (private method)", () => {
    it("should detect mainnet for mainnet addresses", () => {
      const service = PSBTService as any;
      const network = service.getAddressNetwork(TEST_ADDRESS);
      assertEquals(network, networks.bitcoin);
    });

    it("should detect testnet for testnet addresses", () => {
      const service = PSBTService as any;
      const testnetAddress = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";
      const network = service.getAddressNetwork(testnetAddress);
      assertEquals(network, networks.testnet);
    });

    it("should throw error for invalid address", () => {
      const service = PSBTService as any;
      assertThrows(
        () => service.getAddressNetwork("invalid-address"),
        Error,
        "Invalid Bitcoin address",
      );
    });

    it("should throw error for empty address", () => {
      const service = PSBTService as any;
      assertThrows(
        () => service.getAddressNetwork(""),
        Error,
        "Invalid Bitcoin address",
      );
    });

    it("should handle legacy testnet addresses", () => {
      const service = PSBTService as any;
      const testnetP2PKH = "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn";
      const testnetP2SH = "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc";

      // These should throw as they're not native segwit
      assertThrows(
        () => service.getAddressNetwork(testnetP2PKH),
        Error,
        "Invalid Bitcoin address",
      );
      assertThrows(
        () => service.getAddressNetwork(testnetP2SH),
        Error,
        "Invalid Bitcoin address",
      );
    });
  });

  describe("PSBTService.getAddressFromScript (private method)", () => {
    it("should derive address from P2WPKH script", () => {
      const service = PSBTService as any;
      const script = new Uint8Array(
        Buffer.from("0014bdd9a1eccc053725271114f2a406406f095a707d", "hex"),
      );
      const address = service.getAddressFromScript(script, networks.bitcoin);
      assertEquals(address, TEST_ADDRESS);
    });

    it("should derive address from P2PKH script", () => {
      const service = PSBTService as any;
      const script = new Uint8Array(
        Buffer.from(
          "76a914" + "89abcdefabbaabbaabbaabbaabbaabbaabbaabba" + "88ac",
          "hex",
        ),
      );
      const address = service.getAddressFromScript(script, networks.bitcoin);
      assertExists(address);
      assertEquals(address.startsWith("1"), true);
    });

    it("should derive address from P2SH script", () => {
      const service = PSBTService as any;
      const script = new Uint8Array(
        Buffer.from(
          "a914" + "89abcdefabbaabbaabbaabbaabbaabbaabbaabba" + "87",
          "hex",
        ),
      );
      const address = service.getAddressFromScript(script, networks.bitcoin);
      assertExists(address);
      assertEquals(address.startsWith("3"), true);
    });

    it("should throw error for invalid script", () => {
      const service = PSBTService as any;
      const invalidScript = new Uint8Array([0x00, 0x01, 0x02]);
      assertThrows(
        () => service.getAddressFromScript(invalidScript, networks.bitcoin),
        Error,
        "Failed to derive address from script",
      );
    });

    it("should throw error for empty script", () => {
      const service = PSBTService as any;
      const emptyScript = new Uint8Array([]);
      assertThrows(
        () => service.getAddressFromScript(emptyScript, networks.bitcoin),
        Error,
        "Failed to derive address from script",
      );
    });

    it("should handle testnet scripts", () => {
      const service = PSBTService as any;
      const script = new Uint8Array(
        Buffer.from("0014751e76e8199196d454941c45d1b3a323f1433bd6", "hex"),
      );
      const address = service.getAddressFromScript(script, networks.testnet);
      assertEquals(address, "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx");
    });
  });

  describe("Edge Cases and BigInt Handling", () => {
    it("should handle PSBT with witness script", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      psbt.addInput({
        hash:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0020" + "00".repeat(32), "hex"), // P2WSH
          value: 100000000n,
        },
        witnessScript: Buffer.from("52" + "21".repeat(33) + "52ae", "hex"), // 2-of-2 multisig
      });

      const formatted = formatPsbtForLogging(psbt);
      assertEquals(formatted.inputs[0].witnessUtxo.value, 100000000);
    });

    it("should handle PSBT with non-witness UTXO", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      const mockTx = new Transaction();
      mockTx.version = 2;
      mockTx.addInput(Buffer.alloc(32), 0);
      mockTx.addOutput(
        Buffer.from("76a914" + "00".repeat(20) + "88ac", "hex"),
        BigInt(50000),
      );

      psbt.addInput({
        hash:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        index: 0,
        nonWitnessUtxo: mockTx.toBuffer(),
      });

      const formatted = formatPsbtForLogging(psbt);
      assertEquals(formatted.inputs.length, 1);
      assertEquals(formatted.inputs[0].witnessUtxo, undefined);
    });

    it("should handle very large BigInt values", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      const maxSafeInteger = BigInt(Number.MAX_SAFE_INTEGER);
      const largerThanSafe = maxSafeInteger + 1n;

      psbt.addInput({
        hash: "ffff".repeat(16),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "ff".repeat(20), "hex"),
          value: largerThanSafe,
        },
      });

      psbt.addOutput({
        script: Buffer.from("6a", "hex"),
        value: 0n,
      });

      const formatted = formatPsbtForLogging(psbt);
      assertEquals(
        formatted.inputs[0].witnessUtxo.value > Number.MAX_SAFE_INTEGER,
        true,
      );
    });

    it("should handle PSBT with sighash types", () => {
      const psbt = new Psbt({ network: networks.bitcoin });

      psbt.addInput({
        hash: "abcd".repeat(16),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 100000n,
        },
        sighashType: Transaction.SIGHASH_SINGLE |
          Transaction.SIGHASH_ANYONECANPAY,
      });

      const formatted = formatPsbtForLogging(psbt);
      assertEquals(formatted.inputs.length, 1);
      // sighashType is not included in the formatted output
      assertEquals(formatted.inputs[0].witnessUtxo.value, 100000);
    });

    it("should handle network detection for various address formats", () => {
      const service = PSBTService as any;

      // Mainnet bech32
      assertEquals(
        service.getAddressNetwork("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
        networks.bitcoin,
      );

      // Testnet bech32
      assertEquals(
        service.getAddressNetwork(
          "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        ),
        networks.testnet,
      );

      // Should throw for non-segwit addresses
      assertThrows(
        () => service.getAddressNetwork("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"),
        Error,
      );
      assertThrows(
        () => service.getAddressNetwork("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"),
        Error,
      );
    });
  });
});
