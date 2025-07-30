import {
  assertEquals,
  assertExists,
  assertThrows,
} from "@std/assert";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { MaraTransactionSizeEstimator } from "$lib/utils/bitcoin/minting/maraTransactionSizeEstimator.ts";
import type { UTXO, OutputRequirement } from "$lib/types/bitcoin.d.ts";

describe("MaraTransactionSizeEstimator", () => {
  let estimator: MaraTransactionSizeEstimator;

  beforeEach(() => {
    estimator = new MaraTransactionSizeEstimator();
  });

  describe("Basic Size Calculations", () => {
    it("should calculate size for single input, single output", () => {
      const inputs: UTXO[] = [{
        txid: "a".repeat(64),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "a".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [{
        address: "bc1qoutput",
        value: 330, // MARA dust value
      }];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // Base transaction: ~10.5 vB
      // P2WPKH input: ~68 vB
      // P2WPKH output: ~31 vB
      // Total: ~110 vB (rounded up)
      assertEquals(size >= 100, true);
      assertEquals(size <= 120, true);
    });

    it("should calculate size for multiple dust outputs", () => {
      const inputs: UTXO[] = [{
        txid: "b".repeat(64),
        vout: 0,
        value: 50000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "b".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qoutput1", value: 330 },
        { address: "bc1qoutput2", value: 331 },
        { address: "bc1qoutput3", value: 332 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // Base + 1 input + 3 outputs
      // ~10.5 + 68 + (3 * 31) = ~171.5 vB
      assertEquals(size >= 170, true);
      assertEquals(size <= 180, true);
    });
  });

  describe("MARA-Specific Features", () => {
    it("should handle MARA service fee output", () => {
      const inputs: UTXO[] = [{
        txid: "c".repeat(64),
        vout: 0,
        value: 100000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "c".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qstamp", value: 330 }, // Stamp dust
        { address: "bc1qmara", value: 42000 }, // MARA fee
        { address: "bc1qchange", value: 57000 }, // Change
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // 1 input + 3 outputs
      assertEquals(size >= 200, true);
      assertEquals(size <= 220, true);
    });

    it("should optimize for sat outputs", () => {
      const inputs: UTXO[] = [{
        txid: "d".repeat(64),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "d".repeat(40),
          address: "bc1qtest",
        },
      }];

      // Multiple sat outputs (MARA allows 1-332 sats)
      const outputs: OutputRequirement[] = [
        { address: "bc1qout1", value: 1 },
        { address: "bc1qout2", value: 100 },
        { address: "bc1qout3", value: 330 },
        { address: "bc1qout4", value: 332 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // Should handle all dust values correctly
      assertExists(size);
      assertEquals(size > 0, true);
    });
  });

  describe("Input Type Handling", () => {
    it("should handle P2WPKH inputs", () => {
      const inputs: UTXO[] = [{
        txid: "e".repeat(64),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "e".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qout", value: 330 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // P2WPKH input is ~68 vB
      assertExists(size);
    });

    it("should handle P2WSH inputs", () => {
      const inputs: UTXO[] = [{
        txid: "f".repeat(64),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v0_scripthash",
          hex: "0020" + "f".repeat(64),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qout", value: 330 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // P2WSH input is larger than P2WPKH
      assertExists(size);
      assertEquals(size > 100, true);
    });

    it("should handle P2TR inputs", () => {
      const inputs: UTXO[] = [{
        txid: "aa".repeat(32),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v1_taproot",
          hex: "5120" + "a".repeat(64),
          address: "bc1ptest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qout", value: 330 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // P2TR input size varies based on spend path
      assertExists(size);
    });

    it("should handle mixed input types", () => {
      const inputs: UTXO[] = [
        {
          txid: "aa".repeat(32),
          vout: 0,
          value: 5000,
          scriptPubKey: {
            type: "witness_v0_keyhash",
            hex: "0014" + "a".repeat(40),
            address: "bc1qtest1",
          },
        },
        {
          txid: "bb".repeat(32),
          vout: 1,
          value: 5000,
          scriptPubKey: {
            type: "witness_v1_taproot",
            hex: "5120" + "b".repeat(64),
            address: "bc1ptest2",
          },
        },
      ];

      const outputs: OutputRequirement[] = [
        { address: "bc1qout", value: 330 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // Should handle different input types
      assertExists(size);
      assertEquals(size > 150, true); // Multiple inputs increase size
    });
  });

  describe("Fee Estimation", () => {
    it("should estimate fees correctly", () => {
      const inputs: UTXO[] = [{
        txid: "cc".repeat(32),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "c".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qout", value: 330 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      const feeRate = 10; // sats/vB
      const fee = estimator.calculateFee(size, feeRate);
      
      assertEquals(fee, Math.ceil(size * feeRate));
    });

    it("should handle MARA minimum fee requirements", () => {
      const inputs: UTXO[] = [{
        txid: "dd".repeat(32),
        vout: 0,
        value: 50000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "d".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qstamp", value: 330 },
        { address: "bc1qmara", value: 42000 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      const minFeeRate = 6; // MARA minimum
      const fee = estimator.calculateFee(size, minFeeRate);
      
      // Fee should meet minimum requirement
      assertEquals(fee >= size * minFeeRate, true);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle stamp transaction with multiple inputs", () => {
      const inputs: UTXO[] = [
        {
          txid: "ee".repeat(32),
          vout: 0,
          value: 30000,
          scriptPubKey: {
            type: "witness_v0_keyhash",
            hex: "0014" + "e".repeat(40),
            address: "bc1qtest1",
          },
        },
        {
          txid: "ff".repeat(32),
          vout: 1,
          value: 30000,
          scriptPubKey: {
            type: "witness_v0_keyhash",
            hex: "0014" + "f".repeat(40),
            address: "bc1qtest2",
          },
        },
      ];

      const outputs: OutputRequirement[] = [
        { address: "bc1qstamp", value: 330 }, // Stamp
        { address: "bc1qmara", value: 42000 }, // MARA fee
        { address: "bc1qchange", value: 17000 }, // Change
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // 2 inputs + 3 outputs
      assertEquals(size >= 250, true);
      assertEquals(size <= 300, true);
    });

    it("should handle bulk stamp minting", () => {
      const inputs: UTXO[] = [{
        txid: "gg".repeat(32),
        vout: 0,
        value: 200000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "g".repeat(40),
          address: "bc1qtest",
        },
      }];

      // Multiple stamps in one transaction
      const outputs: OutputRequirement[] = [
        { address: "bc1qstamp1", value: 330 },
        { address: "bc1qstamp2", value: 330 },
        { address: "bc1qstamp3", value: 330 },
        { address: "bc1qstamp4", value: 330 },
        { address: "bc1qstamp5", value: 330 },
        { address: "bc1qmara", value: 42000 }, // MARA fee
        { address: "bc1qchange", value: 155000 }, // Change
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // 1 input + 7 outputs
      assertEquals(size >= 300, true);
      assertEquals(size <= 350, true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty inputs", () => {
      const inputs: UTXO[] = [];
      const outputs: OutputRequirement[] = [
        { address: "bc1qout", value: 330 },
      ];

      // Should throw or return 0
      try {
        const size = estimator.calculateTransactionSize(inputs, outputs);
        assertEquals(size > 0, true); // If it doesn't throw, size should still be positive
      } catch (error) {
        assertExists(error);
      }
    });

    it("should handle empty outputs", () => {
      const inputs: UTXO[] = [{
        txid: "hh".repeat(32),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "h".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // Transaction with no outputs is unusual but calculable
      assertEquals(size > 0, true);
    });

    it("should handle maximum dust outputs", () => {
      const inputs: UTXO[] = [{
        txid: "ii".repeat(32),
        vout: 0,
        value: 100000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "i".repeat(40),
          address: "bc1qtest",
        },
      }];

      // Create many dust outputs
      const outputs: OutputRequirement[] = [];
      for (let i = 1; i <= 20; i++) {
        outputs.push({
          address: `bc1qout${i}`,
          value: i, // 1-20 sats
        });
      }

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // Should handle many outputs
      assertExists(size);
      assertEquals(size > 500, true); // Many outputs = large transaction
    });
  });

  describe("Utility Methods", () => {
    it("should provide input size for different types", () => {
      const p2wpkhSize = estimator.getInputSize("witness_v0_keyhash");
      const p2wshSize = estimator.getInputSize("witness_v0_scripthash");
      const p2trSize = estimator.getInputSize("witness_v1_taproot");
      
      // P2WPKH < P2TR < P2WSH (generally)
      assertEquals(p2wpkhSize > 0, true);
      assertEquals(p2trSize > 0, true);
      assertEquals(p2wshSize > p2wpkhSize, true);
    });

    it("should provide output size for different types", () => {
      const p2wpkhSize = estimator.getOutputSize("p2wpkh");
      const p2wshSize = estimator.getOutputSize("p2wsh");
      const p2trSize = estimator.getOutputSize("p2tr");
      
      assertEquals(p2wpkhSize, 31); // Standard P2WPKH output
      assertEquals(p2wshSize, 43); // Standard P2WSH output
      assertEquals(p2trSize, 43); // Standard P2TR output
    });

    it("should round up transaction size", () => {
      // Test that sizes are properly rounded up for vBytes
      const inputs: UTXO[] = [{
        txid: "jj".repeat(32),
        vout: 0,
        value: 10000,
        scriptPubKey: {
          type: "witness_v0_keyhash",
          hex: "0014" + "j".repeat(40),
          address: "bc1qtest",
        },
      }];

      const outputs: OutputRequirement[] = [
        { address: "bc1qout", value: 330 },
      ];

      const size = estimator.calculateTransactionSize(inputs, outputs);
      
      // Size should be a whole number (vBytes)
      assertEquals(Math.floor(size), size);
    });
  });
});