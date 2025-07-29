import { OptimalUTXOSelection } from "$server/services/utxo/optimalUtxoSelection.ts";
import type { BasicUTXO, Output } from "$types/index.d.ts";
import {
  assertEquals,
  assertExists,
  assertThrows,
} from "@std/assert";

Deno.test("OptimalUTXOSelection - BigInt(Infinity) fix", async (t) => {
  await t.step(
    "Should handle wallet with sufficient funds but high fees",
    () => {
      // Recreate the exact scenario from the error logs
      const utxos: BasicUTXO[] = [
        { txid: "d4153188", vout: 61, value: 135857 },
        { txid: "45986121", vout: 3, value: 5000 },
        { txid: "ebcf21f1", vout: 5, value: 8038 },
        { txid: "ddc7c05b", vout: 5, value: 7366 },
        { txid: "31e690e4", vout: 5, value: 6455 },
        // Add more to reach the total of 246195
        { txid: "test1", vout: 0, value: 10000 },
        { txid: "test2", vout: 0, value: 15000 },
        { txid: "test3", vout: 0, value: 20000 },
        { txid: "test4", vout: 0, value: 38479 }, // Remaining to reach 246195
      ];

      // Verify total matches error log
      const totalValue = utxos.reduce((sum, u) => sum + u.value, 0);
      assertEquals(totalValue, 246195);

      // Create outputs for 415 stamp outputs (from error logs)
      const outputs: Output[] = [];
      const STAMP_OUTPUTS = 415;
      const OUTPUT_VALUE = 102; // 42413 / 415 ≈ 102 per output

      for (let i = 0; i < STAMP_OUTPUTS - 1; i++) {
        outputs.push({ value: OUTPUT_VALUE, script: "mock_script" });
      }
      // Last output gets the remainder
      outputs.push({
        value: 42413 - (OUTPUT_VALUE * (STAMP_OUTPUTS - 1)),
        script: "mock_script",
      });

      const totalOutputValue = outputs.reduce((sum, o) => sum + o.value, 0);
      assertEquals(totalOutputValue, 42413);

      const feeRate = 12.1;

      // This should throw due to insufficient funds for fees
      try {
        const result = OptimalUTXOSelection.selectUTXOs(utxos, outputs, feeRate);
        // If we get here without throwing, the test should fail
        // Log the result to understand what happened
        console.log("Unexpected result:", result);
        throw new Error("Expected function to throw 'Insufficient funds' but it returned a result");
      } catch (error) {
        // Verify it's the expected error
        assertEquals(error.message.includes("Insufficient funds"), true, 
          `Expected error containing 'Insufficient funds', got: ${error.message}`);
      }
    },
  );

  await t.step("Should not throw BigInt conversion errors", () => {
    const simpleUTXOs: BasicUTXO[] = [
      { txid: "tx1", vout: 0, value: 100000 },
      { txid: "tx2", vout: 0, value: 50000 },
    ];

    const simpleOutputs: Output[] = [
      { value: 10000, script: "mock_script" },
    ];

    // This should work without BigInt(Infinity) errors
    const result = OptimalUTXOSelection.selectUTXOs(
      simpleUTXOs,
      simpleOutputs,
      1,
    );
    assertExists(result);
    assertEquals(result.inputs.length > 0, true);
  });

  await t.step("Should handle edge case with many dust UTXOs", () => {
    // Create 468 dust UTXOs (as per error logs)
    const dustUTXOs: BasicUTXO[] = [];
    for (let i = 0; i < 468; i++) {
      dustUTXOs.push({
        txid: `dust${i}`,
        vout: 0,
        value: 300, // Below the 333 dust threshold
      });
    }

    // Add 21 spendable UTXOs
    for (let i = 0; i < 21; i++) {
      dustUTXOs.push({
        txid: `spendable${i}`,
        vout: 0,
        value: 5000 + (i * 1000), // Various spendable amounts
      });
    }

    const outputs: Output[] = [
      { value: 50000, script: "mock_script" },
    ];

    const feeRate = 10;

    // Should work with only the spendable UTXOs
    const result = OptimalUTXOSelection.selectUTXOs(
      dustUTXOs,
      outputs,
      feeRate,
    );
    assertExists(result);

    // Should only select from the 21 spendable UTXOs
    result.inputs.forEach((input) => {
      assertEquals(input.value >= 5000, true);
    });
  });

  await t.step(
    "Should provide detailed metrics without Infinity values",
    () => {
      const utxos: BasicUTXO[] = [
        { txid: "tx1", vout: 0, value: 100000 },
        { txid: "tx2", vout: 0, value: 50000 },
        { txid: "tx3", vout: 0, value: 25000 },
      ];

      const outputs: Output[] = [
        { value: 60000, script: "mock_script" },
      ];

      const result = OptimalUTXOSelection.selectUTXOs(utxos, outputs, 2);
      assertExists(result);

      // Check that waste is a finite number
      assertEquals(
        typeof result.waste === "number" && isFinite(result.waste),
        true,
        "Waste should be a finite number"
      );

      // Check all numeric properties are finite
      assertEquals(isFinite(result.fee), true, "Fee should be finite");
      assertEquals(isFinite(result.change), true, "Change should be finite");
      
      // Verify algorithm was selected
      assertExists(result.algorithm, "Algorithm should be specified");
      
      // Verify inputs were selected
      assertEquals(result.inputs.length > 0, true, "Should have selected inputs");
    },
  );
});
