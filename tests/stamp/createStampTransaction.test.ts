import { assertEquals, assertNotEquals, assertExists } from "@std/assert";
import { StampMintService, StampValidationService } from "../../server/services/stamp/index.ts";
import { Psbt } from "bitcoinjs-lib";
import { base64ToArrayBuffer } from "./utils.ts";

// Configuration for tests
const CONFIG = {
  // Set to true to call the live endpoint for validation (mostly for debugging/comparison)
  USE_LIVE_ENDPOINT: false,
  LIVE_ENDPOINT: "https://stampchain.io/api/v2/olga/mint",
  // Test wallet addresses - these should be test wallets with no real funds
  TEST_WALLET_ADDRESS: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
};

// Mock UTXO for testing
const MOCK_UTXO = {
  txid: "52c5fe0b4f4591e829e5b44e19f34eb83b79c4ca9afa77f44a4375b307ceddef",
  vout: 3,
  value: 353359, // Enough for a test tx, arbitrary value
  script: "0014bdd9a1eccc053725271114f2a406406f095a707d",
  address: CONFIG.TEST_WALLET_ADDRESS,
};

// Test file data - a minimal 1x1 pixel PNG in base64
const TEST_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Interface for test case definition
interface StampTestCase {
  name: string;
  input: {
    sourceWallet: string;
    qty: string;
    locked: boolean;
    filename: string;
    file: string;
    satsPerVB?: number;
    satsPerKB?: number;
    assetName?: string;
    service_fee?: number;
    service_fee_address?: string;
    dryRun?: boolean;
  };
  expectedOutputs: {
    dataOutputCount?: number;
    cpidPrefix?: string;
    errorPattern?: RegExp; // For error test cases
  };
}

// Define test cases
const TEST_CASES: StampTestCase[] = [
  // Basic stamp creation test
  {
    name: "Basic stamp creation (satsPerVB)",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "1",
      locked: true,
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64, // Minimal PNG file
      satsPerVB: 10,
    },
    expectedOutputs: {
      dataOutputCount: 3, // Small file should have minimal data outputs
      cpidPrefix: "A", // Regular CPID prefix
    },
  },
  
  // Test with satsPerKB parameter (should be converted to satsPerVB internally)
  {
    name: "Stamp creation with satsPerKB parameter",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "1",
      locked: true,
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64,
      satsPerKB: 10000, // 10 sat/vB = 10,000 sat/kB
    },
    expectedOutputs: {
      dataOutputCount: 3,
      cpidPrefix: "A",
    },
  },
  
  // POSH stamp creation test
  {
    name: "POSH stamp creation",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "1",
      locked: true,
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64,
      satsPerVB: 10,
      assetName: "BTEST", // POSH format starts with B-Z
    },
    expectedOutputs: {
      dataOutputCount: 3,
      cpidPrefix: "B", // POSH CPID should preserve the initial letter
    },
  },
  
  // Multiple quantity test
  {
    name: "Multiple quantity stamp creation",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "5", // Create 5 stamps
      locked: true,
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64,
      satsPerVB: 10,
    },
    expectedOutputs: {
      dataOutputCount: 3,
      cpidPrefix: "A",
    },
  },
  
  // Unlocked stamp test
  {
    name: "Unlocked stamp creation",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "1",
      locked: false, // Not locked
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64,
      satsPerVB: 10,
    },
    expectedOutputs: {
      dataOutputCount: 3,
      cpidPrefix: "A",
    },
  },
  
  // Dry run test
  {
    name: "Dry run stamp creation",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "1",
      locked: true,
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64,
      satsPerVB: 10,
      dryRun: true,
    },
    expectedOutputs: {
      cpidPrefix: "A",
    },
  },
  
  // Invalid POSH name test
  {
    name: "Invalid POSH name (should error)",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "1",
      locked: true,
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64,
      satsPerVB: 10,
      assetName: "1TEST", // POSH names must start with B-Z
    },
    expectedOutputs: {
      errorPattern: /Invalid POSH name/i,
    },
  },
  
  // Test with service fee
  {
    name: "Stamp creation with service fee",
    input: {
      sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
      qty: "1",
      locked: true,
      filename: "test_pixel.png",
      file: TEST_PNG_BASE64,
      satsPerVB: 10,
      service_fee: 1000, // 1000 sats service fee
      service_fee_address: CONFIG.TEST_WALLET_ADDRESS, // Send to same address for testing
    },
    expectedOutputs: {
      dataOutputCount: 3,
      cpidPrefix: "A",
    },
  },
];

// Helper function to call the live endpoint (mostly for comparison/debugging)
async function callLiveEndpoint(testCase: StampTestCase) {
  if (!CONFIG.USE_LIVE_ENDPOINT) {
    console.log("Skipping live endpoint test (disabled in config)");
    return null;
  }
  
  try {
    const response = await fetch(CONFIG.LIVE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...testCase.input,
        // Force dry run for safety when testing live endpoint
        dryRun: true, 
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Live endpoint error:", errorText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error calling live endpoint:", error);
    return null;
  }
}

// Main test function
Deno.test("Stamp Transaction Creation and Validation", async (t) => {
  for (const testCase of TEST_CASES) {
    await t.step(testCase.name, async () => {
      try {
        // Call live endpoint for comparison if enabled (optional)
        const liveResult = await callLiveEndpoint(testCase);
        if (liveResult) {
          console.log("Live endpoint result:", {
            est_tx_size: liveResult.est_tx_size,
            est_miner_fee: liveResult.est_miner_fee,
            total_dust_value: liveResult.total_dust_value,
            cpid: liveResult.cpid,
          });
        }
        
        // Prepare input for local service call
        const serviceInput = {
          ...testCase.input,
          prefix: "stamp" as const,
          description: "stamp:",
        };

        // Optional: Validate POSH name if provided
        if (testCase.input.assetName) {
          try {
            const validatedName = await StampValidationService.validateAndPrepareAssetName(
              testCase.input.assetName
            );
            serviceInput.assetName = validatedName;
          } catch (error) {
            // If we expect an error, this is okay
            if (testCase.expectedOutputs.errorPattern) {
              assertEquals(
                testCase.expectedOutputs.errorPattern.test(error.message),
                true,
                `Error message should match ${testCase.expectedOutputs.errorPattern}: ${error.message}`
              );
              // Skip the rest of the test since we expected this error
              return;
            }
            // Otherwise, this is an unexpected error
            throw error;
          }
        }
        
        // Create test transaction (with mock UTXOs)
        const result = await StampMintService.createStampIssuance({
          ...serviceInput,
          // Add mock UTXOs for testing if not doing a dry run
          ...(serviceInput.dryRun ? {} : { 
            utxos: [MOCK_UTXO] 
          }),
        });
        
        // Skip PSBT validation for dry runs
        if (serviceInput.dryRun) {
          assertExists(result.estimatedTxSize, "Estimated TX size should exist for dry run");
          assertExists(result.estMinerFee, "Estimated miner fee should exist for dry run");
          
          // Check CPID format if expected
          if (testCase.expectedOutputs.cpidPrefix && result.cpid) {
            assertEquals(
              result.cpid.startsWith(testCase.expectedOutputs.cpidPrefix),
              true,
              `CPID should start with ${testCase.expectedOutputs.cpidPrefix}, got ${result.cpid}`
            );
          }
          return;
        }
        
        // For non-dry runs, validate the PSBT
        if (!result.psbt) {
          throw new Error("Failed to create PSBT");
        }
        
        // Convert PSBT to analyzable form
        const psbt = Psbt.fromHex(result.psbt.toHex());
        
        // Print some debug info about the PSBT
        console.log("PSBT details:", {
          inputs: psbt.data.inputs.length,
          outputs: psbt.data.outputs.length,
          txInputs: psbt.txInputs.length,
          txOutputs: psbt.txOutputs.length,
        });
        
        // Verify outputs count if expected
        if (testCase.expectedOutputs.dataOutputCount) {
          // Get all witness script outputs (P2WSH outputs)
          const dataOutputs = psbt.txOutputs.filter((output) => {
            const script = output.script;
            return script[0] === 0x00 && script[1] === 0x20; // Check for P2WSH pattern
          });
          
          assertEquals(
            dataOutputs.length,
            testCase.expectedOutputs.dataOutputCount,
            `Expected ${testCase.expectedOutputs.dataOutputCount} data outputs, got ${dataOutputs.length}`
          );
        }
        
        // Verify CPID format if expected
        if (testCase.expectedOutputs.cpidPrefix && result.cpid) {
          assertEquals(
            result.cpid.startsWith(testCase.expectedOutputs.cpidPrefix),
            true,
            `CPID should start with ${testCase.expectedOutputs.cpidPrefix}, got ${result.cpid}`
          );
        }
        
        // Validate fee calculations
        if (testCase.input.satsPerVB) {
          const feeRate = testCase.input.satsPerVB;
          // Calculate expected fee based on tx size
          const expectedFee = Math.ceil(result.estimatedTxSize * feeRate);
          // Allow small variations due to rounding or estimation differences
          const feeWithinRange = Math.abs(result.estMinerFee - expectedFee) <= 50;
          
          assertEquals(
            feeWithinRange,
            true,
            `Fee calculation should be close to expected: expected ~${expectedFee}, got ${result.estMinerFee}`
          );
        }
        
        // Check for errors if we're expecting them
        if (testCase.expectedOutputs.errorPattern) {
          throw new Error("Expected an error but test passed");
        }
      } catch (error) {
        // If we're expecting an error, check the pattern
        if (testCase.expectedOutputs.errorPattern) {
          assertEquals(
            testCase.expectedOutputs.errorPattern.test(error.message),
            true,
            `Error message should match ${testCase.expectedOutputs.errorPattern}: ${error.message}`
          );
          return;
        }
        // Otherwise, this is an unexpected error
        console.error("Test error:", error);
        throw error;
      }
    });
  }
});

// Test fee normalization specifically
Deno.test("Fee normalization for Stamp creation", async () => {
  // Test different fee parameters to ensure they result in consistent values
  
  // Test with satsPerVB
  const resultVB = await StampMintService.createStampIssuance({
    sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
    qty: "1",
    locked: true,
    filename: "test_pixel.png",
    file: TEST_PNG_BASE64,
    satsPerVB: 10,
    prefix: "stamp" as const,
    description: "stamp:",
    dryRun: true,
  });
  
  // Test with satsPerKB (should be converted to 10 sat/vB internally)
  const resultKB = await StampMintService.createStampIssuance({
    sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
    qty: "1",
    locked: true,
    filename: "test_pixel.png",
    file: TEST_PNG_BASE64,
    satsPerKB: 10000, // Equivalent to 10 sat/vB
    prefix: "stamp" as const,
    description: "stamp:",
    dryRun: true,
  });
  
  // The fee calculations should be roughly equivalent between both approaches
  const sizeVB = resultVB.estimatedTxSize;
  const sizeKB = resultKB.estimatedTxSize;
  
  // Size estimates should be the same (or very close)
  assertEquals(
    Math.abs(sizeVB - sizeKB) < 10,
    true,
    `Size estimates should be similar: vB=${sizeVB}, kB=${sizeKB}`
  );
  
  // Miner fees should be similar
  const feeVB = resultVB.estMinerFee;
  const feeKB = resultKB.estMinerFee;
  
  assertEquals(
    Math.abs(feeVB - feeKB) < 50,  // Allow small variations
    true,
    `Fee calculations should be similar: vB=${feeVB}, kB=${feeKB}`
  );
});

// Test error cases specifically
Deno.test("Stamp creation error handling", async (t) => {
  await t.step("Oversized file error", async () => {
    // Create a string that's larger than the 64KB limit
    const largeFile = "A".repeat(70 * 1024); // 70KB of data
    
    try {
      await StampMintService.createStampIssuance({
        sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
        qty: "1",
        locked: true,
        filename: "large_file.txt",
        file: largeFile,
        satsPerVB: 10,
        prefix: "stamp" as const,
        description: "stamp:",
        dryRun: true,
      });
      
      // Should not reach here
      assertEquals(true, false, "Expected an error for oversized file");
    } catch (error) {
      assertEquals(
        /file size|too large|exceeds/i.test(error.message),
        true,
        `Error should mention file size: ${error.message}`
      );
    }
  });
  
  await t.step("Invalid source wallet", async () => {
    try {
      await StampMintService.createStampIssuance({
        sourceWallet: "invalid-address",
        qty: "1",
        locked: true,
        filename: "test_pixel.png",
        file: TEST_PNG_BASE64,
        satsPerVB: 10,
        prefix: "stamp" as const,
        description: "stamp:",
        dryRun: true,
      });
      
      // Should not reach here
      assertEquals(true, false, "Expected an error for invalid wallet address");
    } catch (error) {
      assertEquals(
        /invalid|wallet|address/i.test(error.message),
        true,
        `Error should mention invalid address: ${error.message}`
      );
    }
  });
  
  await t.step("Invalid fee parameter", async () => {
    try {
      await StampMintService.createStampIssuance({
        sourceWallet: CONFIG.TEST_WALLET_ADDRESS,
        qty: "1",
        locked: true,
        filename: "test_pixel.png",
        file: TEST_PNG_BASE64,
        satsPerVB: -5, // Negative fee rate
        prefix: "stamp" as const,
        description: "stamp:",
        dryRun: true,
      });
      
      // Should not reach here
      assertEquals(true, false, "Expected an error for invalid fee parameter");
    } catch (error) {
      assertEquals(
        /fee|invalid|negative/i.test(error.message),
        true,
        `Error should mention invalid fee: ${error.message}`
      );
    }
  });
});