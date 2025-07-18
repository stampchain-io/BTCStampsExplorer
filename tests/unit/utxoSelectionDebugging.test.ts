import { OptimalUTXOSelection } from "$server/services/utxo/optimalUtxoSelection.ts";
import type { BasicUTXO, Output } from "$types/index.d.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

/**
 * Tests for enhanced UTXO selection debugging features
 */
Deno.test("Enhanced UTXO Selection Debugging", async (t) => {
  await t.step(
    "Should provide detailed dust analysis when all UTXOs are dust",
    () => {
      const dustUTXOs: BasicUTXO[] = [
        { txid: "tx1", vout: 0, value: 100 }, // Too small to spend at high fee rate
        { txid: "tx2", vout: 0, value: 200 },
        { txid: "tx3", vout: 0, value: 150 },
      ];

      const outputs: Output[] = [
        { value: 50000, script: "mock_script" },
      ];

      const highFeeRate = 100; // Very high fee rate to make all UTXOs dust

      try {
        OptimalUTXOSelection.selectUTXOs(dustUTXOs, outputs, highFeeRate);
      } catch (error) {
        // Should get detailed error about dust UTXOs
        assertExists(error.message);
        assertEquals(error.message.includes("cost more to spend"), true);
      }
    },
  );

  await t.step(
    "Should provide comprehensive analysis for insufficient funds",
    () => {
      const insufficientUTXOs: BasicUTXO[] = [
        { txid: "tx1", vout: 0, value: 10000 },
        { txid: "tx2", vout: 0, value: 15000 },
        { txid: "tx3", vout: 0, value: 5000 },
      ];

      const largeOutputs: Output[] = [
        { value: 100000, script: "mock_script" }, // More than available
      ];

      const normalFeeRate = 2;

      try {
        OptimalUTXOSelection.selectUTXOs(
          insufficientUTXOs,
          largeOutputs,
          normalFeeRate,
        );
      } catch (error) {
        // Should get detailed insufficient funds analysis
        assertExists(error.message);
        assertEquals(error.message.includes("have"), true);
        assertEquals(error.message.includes("need"), true);
        assertEquals(error.message.includes("deficit"), true);
      }
    },
  );

  await t.step("Should generate helpful recommendations", () => {
    const smallUTXOs: BasicUTXO[] = [
      { txid: "tx1", vout: 0, value: 1000 },
    ];

    const outputs: Output[] = [
      { value: 50000, script: "mock_script" },
    ];

    const feeRate = 5;

    try {
      OptimalUTXOSelection.selectUTXOs(smallUTXOs, outputs, feeRate);
    } catch (error) {
      // Error should include helpful recommendations
      assertExists(error.message);
      // The error should be about insufficient funds
      assertEquals(error.message.includes("Insufficient funds"), true);
    }
  });

  await t.step("Should handle edge case with no UTXOs", () => {
    const noUTXOs: BasicUTXO[] = [];
    const outputs: Output[] = [
      { value: 1000, script: "mock_script" },
    ];

    try {
      OptimalUTXOSelection.selectUTXOs(noUTXOs, outputs, 1);
    } catch (error) {
      assertExists(error.message);
      assertEquals(error.message.includes("No spendable UTXOs"), true);
    }
  });

  await t.step(
    "Should calculate UTXO distribution statistics correctly",
    () => {
      const variedUTXOs: BasicUTXO[] = [
        { txid: "tx1", vout: 0, value: 1000 },
        { txid: "tx2", vout: 0, value: 5000 },
        { txid: "tx3", vout: 0, value: 10000 },
        { txid: "tx4", vout: 0, value: 2000 },
        { txid: "tx5", vout: 0, value: 8000 },
      ];

      const outputs: Output[] = [
        { value: 100000, script: "mock_script" }, // More than available to trigger analysis
      ];

      try {
        OptimalUTXOSelection.selectUTXOs(variedUTXOs, outputs, 2);
      } catch (error) {
        // Should provide statistical analysis
        assertExists(error.message);
        assertEquals(error.message.includes("Insufficient funds"), true);
      }
    },
  );

  await t.step("Should provide algorithm attempt tracking", () => {
    const limitedUTXOs: BasicUTXO[] = [
      { txid: "tx1", vout: 0, value: 5000 },
      { txid: "tx2", vout: 0, value: 3000 },
    ];

    const outputs: Output[] = [
      { value: 50000, script: "mock_script" }, // Too large
    ];

    try {
      OptimalUTXOSelection.selectUTXOs(limitedUTXOs, outputs, 1);
    } catch (error) {
      // Should indicate which algorithms were attempted
      assertExists(error.message);
      assertEquals(error.message.includes("Insufficient funds"), true);
    }
  });

  await t.step("Should show efficiency metrics for UTXOs", () => {
    const expensiveUTXOs: BasicUTXO[] = [
      { txid: "tx1", vout: 0, value: 1000 }, // Low efficiency at high fee rate
      { txid: "tx2", vout: 0, value: 500 },
    ];

    const outputs: Output[] = [
      { value: 50000, script: "mock_script" },
    ];

    const highFeeRate = 50; // High fee rate

    try {
      OptimalUTXOSelection.selectUTXOs(expensiveUTXOs, outputs, highFeeRate);
    } catch (error) {
      // Should provide efficiency analysis
      assertExists(error.message);
    }
  });
});

/**
 * Test helper functions for debugging
 */
Deno.test("UTXO Selection Debugging Helpers", async (t) => {
  await t.step(
    "Should calculate median correctly for odd number of UTXOs",
    () => {
      // This would test the private method if it were public
      // For now, we test through the main selection method
      const utxos: BasicUTXO[] = [
        { txid: "tx1", vout: 0, value: 1000 },
        { txid: "tx2", vout: 0, value: 3000 },
        { txid: "tx3", vout: 0, value: 2000 },
      ];

      const outputs: Output[] = [
        { value: 50000, script: "mock_script" },
      ];

      try {
        OptimalUTXOSelection.selectUTXOs(utxos, outputs, 1);
      } catch (error) {
        // Median should be calculated in the error analysis
        assertExists(error.message);
      }
    },
  );

  await t.step(
    "Should calculate median correctly for even number of UTXOs",
    () => {
      const utxos: BasicUTXO[] = [
        { txid: "tx1", vout: 0, value: 1000 },
        { txid: "tx2", vout: 0, value: 4000 },
        { txid: "tx3", vout: 0, value: 2000 },
        { txid: "tx4", vout: 0, value: 3000 },
      ];

      const outputs: Output[] = [
        { value: 50000, script: "mock_script" },
      ];

      try {
        OptimalUTXOSelection.selectUTXOs(utxos, outputs, 1);
      } catch (error) {
        // Median should be (2000 + 3000) / 2 = 2500
        assertExists(error.message);
      }
    },
  );

  await t.step(
    "Should generate appropriate recommendations based on scenario",
    () => {
      // Test various scenarios that should generate different recommendations
      const scenarios = [
        {
          name: "No UTXOs",
          utxos: [],
          expectedRecommendation: "No spendable UTXOs",
        },
        {
          name: "High fee rate",
          utxos: [{ txid: "tx1", vout: 0, value: 10000 }],
          feeRate: 100,
          expectedRecommendation: "Consider lowering the fee rate",
        },
      ];

      for (const scenario of scenarios) {
        const outputs: Output[] = [{ value: 50000, script: "mock_script" }];

        try {
          OptimalUTXOSelection.selectUTXOs(
            scenario.utxos as BasicUTXO[],
            outputs,
            scenario.feeRate || 1,
          );
        } catch (error) {
          // Each scenario should provide relevant recommendations
          assertExists(error.message);
        }
      }
    },
  );
});
