import { assertEquals } from "@std/assert";
import { SRC20Service } from "../../server/services/src20/index.ts";
import { decodeSRC20OLGATransaction } from "../../utils/decodeSrc20OlgaTx.ts";
import { Psbt } from "bitcoinjs-lib";

declare global {
  let mockTxData: {
    vout: Array<{
      scriptPubKey: {
        type: string;
        hex: string;
      };
    }>;
  };
}

interface TestCase {
  name: string;
  input: {
    sourceAddress: string;
    toAddress: string;
    op: string;
    tick: string;
    amt?: string;
    max?: string;
    lim?: string;
    dec?: string;
    satsPerVB: number;
  };
  expectedOutputs: {
    dataOutputCount: number;
    dataPrefix: string;
    expectedDecodedData: {
      p: string;
      op: string;
      tick: string;
      amt?: string;
      max?: string;
      lim?: string;
      dec?: string;
    };
  };
}

const TEST_CASES: TestCase[] = [
  {
    name: "Valid mint transaction",
    input: {
      sourceAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
      toAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
      op: "mint",
      tick: "$ever",
      amt: "100000000",
      satsPerVB: 10,
    },
    expectedOutputs: {
      dataOutputCount: 3,
      dataPrefix: "stamp:",
      expectedDecodedData: {
        p: "SRC-20",
        op: "MINT",
        tick: "$ever",
        amt: "100000000",
      },
    },
  },
  {
    name: "Valid deploy transaction",
    input: {
      sourceAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
      toAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
      op: "deploy",
      tick: "TEST",
      max: "1000000",
      lim: "1000",
      dec: "18",
      satsPerVB: 10,
    },
    expectedOutputs: {
      dataOutputCount: 3,
      dataPrefix: "stamp:",
      expectedDecodedData: {
        p: "SRC-20",
        op: "DEPLOY",
        tick: "TEST",
        max: "1000000",
        lim: "1000",
        dec: "18",
      },
    },
  },
];

async function validateTransaction(psbtHex: string, testCase: TestCase) {
  // Decode PSBT using bitcoinjs-lib
  const psbt = Psbt.fromHex(psbtHex);

  // Get all witness script outputs (P2WSH outputs)
  const dataOutputs = psbt.txOutputs.filter((output) => {
    const script = output.script;
    return script[0] === 0x00 && script[1] === 0x20; // Check for P2WSH pattern
  });

  console.log("PSBT Outputs:", psbt.txOutputs);
  console.log("Filtered Data Outputs:", dataOutputs);

  // Validate output count
  assertEquals(
    dataOutputs.length,
    testCase.expectedOutputs.dataOutputCount,
    `Expected ${testCase.expectedOutputs.dataOutputCount} data outputs`,
  );

  // Create mock transaction data for the decoder
  const mockTx = {
    vout: [
      // Add a dummy first output (non-data output)
      {
        scriptPubKey: {
          type: "witness_v0_pubkeyhash",
          hex: "0014000000000000000000000000000000000000",
        },
      },
      // Then add our data outputs
      ...dataOutputs.map((output) => ({
        scriptPubKey: {
          type: "witness_v0_scripthash",
          hex: Array.from(output.script)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""),
        },
      })),
    ],
  };

  // Set mock data for QuicknodeService
  globalThis.mockTxData = mockTx;

  try {
    // Decode the transaction using the actual decoder
    const decodedData = await decodeSRC20OLGATransaction("mock_txid");
    const parsedData = JSON.parse(decodedData);

    console.log("Decoded Data:", parsedData);
    console.log("Expected Data:", testCase.expectedOutputs.expectedDecodedData);

    // Validate decoded data matches expected output
    assertEquals(
      parsedData,
      testCase.expectedOutputs.expectedDecodedData,
      "Decoded data does not match expected output",
    );
  } catch (error) {
    console.error("Validation Error:", error);
    throw new Error(
      `Decoding failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

Deno.test("SRC-20 Transaction Creation and Decoding", async (t) => {
  for (const testCase of TEST_CASES) {
    await t.step(testCase.name, async () => {
      // First do a dry run to validate fee calculation
      const dryRunResult = await SRC20Service.PSBTService.preparePSBT({
        ...testCase.input,
        src20Action: {
          op: testCase.input.op.toUpperCase(),
          p: "SRC-20",
          tick: testCase.input.tick,
          ...(testCase.input.amt && { amt: testCase.input.amt }),
          ...(testCase.input.max && { max: testCase.input.max }),
          ...(testCase.input.lim && { lim: testCase.input.lim }),
          ...(testCase.input.dec && { dec: testCase.input.dec }),
        },
        service_fee: 0,
        service_fee_address: "",
        changeAddress: testCase.input.sourceAddress,
        dryRun: true,
      });

      console.log("Dry Run Result:", {
        estimatedTxSize: dryRunResult.estimatedTxSize,
        totalInputValue: dryRunResult.totalInputValue,
        totalOutputValue: dryRunResult.totalOutputValue,
        totalDustValue: dryRunResult.totalDustValue,
        estMinerFee: dryRunResult.estMinerFee,
      });

      // Now create actual PSBT
      const result = await SRC20Service.PSBTService.preparePSBT({
        ...testCase.input,
        src20Action: {
          op: testCase.input.op.toUpperCase(),
          p: "SRC-20",
          tick: testCase.input.tick,
          ...(testCase.input.amt && { amt: testCase.input.amt }),
          ...(testCase.input.max && { max: testCase.input.max }),
          ...(testCase.input.lim && { lim: testCase.input.lim }),
          ...(testCase.input.dec && { dec: testCase.input.dec }),
        },
        service_fee: 0,
        service_fee_address: "",
        changeAddress: testCase.input.sourceAddress,
        // Mock UTXO for testing
        utxos: [{
          txid:
            "52c5fe0b4f4591e829e5b44e19f34eb83b79c4ca9afa77f44a4375b307ceddef",
          vout: 3,
          value: 353359,
          script: "0014bdd9a1eccc053725271114f2a406406f095a707d",
          address: testCase.input.sourceAddress,
        }],
      });

      if (!result.psbt) {
        throw new Error("Failed to create PSBT");
      }

      // Validate that the transaction can be properly decoded
      await validateTransaction(result.psbt.toHex(), testCase);
    });
  }
});
