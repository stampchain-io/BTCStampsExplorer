import { handler } from "$routes/api/v2/olga/mint.ts";
import { StampValidationService } from "$server/services/stamp/stampValidationService.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import { CounterpartyApiManager } from "$server/services/counterpartyApiService.ts";
import * as bitcoin from "bitcoinjs-lib";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { stub } from "https://deno.land/std@0.208.0/testing/mock.ts";
import { mintAddressUTXOs } from "../fixtures/utxoFixtures.mint.ts";

/**
 * Comprehensive test for the Olga mint endpoint with real UTXO data
 */
Deno.test("Mint Endpoint - 31KB Image with Real UTXOs", async (t) => {
  // Create a base64 encoded "image" of specified size
  const createTestImage = (sizeInKB: number = 31): string => {
    // PNG header (8 bytes) + IHDR chunk (25 bytes) + data chunk header (8 bytes)
    const pngHeader = new Uint8Array([
      0x89,
      0x50,
      0x4E,
      0x47,
      0x0D,
      0x0A,
      0x1A,
      0x0A, // PNG signature
      0x00,
      0x00,
      0x00,
      0x0D, // IHDR chunk length
      0x49,
      0x48,
      0x44,
      0x52, // "IHDR"
      0x00,
      0x00,
      0x00,
      0x64, // Width: 100
      0x00,
      0x00,
      0x00,
      0x64, // Height: 100
      0x08,
      0x02, // Bit depth: 8, Color type: 2 (RGB)
      0x00,
      0x00,
      0x00, // Compression, filter, interlace
      0x00,
      0x00,
      0x00,
      0x00, // CRC placeholder
    ]);

    // Create dummy data to reach target size
    const targetSize = sizeInKB * 1024;
    const dataSize = targetSize - pngHeader.length - 12; // 12 for IEND chunk
    const dummyData = new Uint8Array(dataSize);

    // Fill with pattern
    for (let i = 0; i < dataSize; i++) {
      dummyData[i] = i % 256;
    }

    // IEND chunk
    const iendChunk = new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x00, // Length
      0x49,
      0x45,
      0x4E,
      0x44, // "IEND"
      0xAE,
      0x42,
      0x60,
      0x82, // CRC
    ]);

    // Combine all parts
    const fullImage = new Uint8Array(targetSize);
    fullImage.set(pngHeader, 0);
    fullImage.set(dummyData, pngHeader.length);
    fullImage.set(iendChunk, pngHeader.length + dataSize);

    // Convert to base64
    const binary = Array.from(fullImage).map((b) => String.fromCharCode(b))
      .join("");
    return btoa(binary);
  };

  const mockRequest = (body: Record<string, unknown>) => {
    return new Request("http://localhost/api/v2/olga/mint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  await t.step(
    "Successfully mints 31KB stamp with 1.1 sat/vb fee rate",
    async () => {
      // Mock CommonUTXOService to return our fixture UTXOs
      const getSpendableUTXOsStub = stub(
        CommonUTXOService.prototype,
        "getSpendableUTXOs",
        () =>
          Promise.resolve(mintAddressUTXOs.utxos.map((utxo) => ({
            ...utxo,
            scriptDesc: utxo.scriptType || "p2wpkh",
          }))),
      );

      // Mock getSpecificUTXO for full UTXO details
      const getSpecificUTXOStub = stub(
        CommonUTXOService.prototype,
        "getSpecificUTXO",
        (txid: string, vout: number) => {
          const utxo = mintAddressUTXOs.utxos.find((u) =>
            u.txid === txid && u.vout === vout
          );
          if (!utxo) return Promise.resolve(null);
          return Promise.resolve({
            ...utxo,
            scriptDesc: utxo.scriptType || "p2wpkh",
          });
        },
      );

      // Mock getRawTransactionHex for non-witness inputs (if any)
      const getRawTransactionHexStub = stub(
        CommonUTXOService.prototype,
        "getRawTransactionHex",
        () => Promise.resolve("0200000001..."), // Dummy raw tx hex
      );

      // Mock XCP API calls
      // The XCP API returns a raw transaction for issuance
      // This is a minimal valid transaction with no inputs (as XCP would create)
      // and one OP_RETURN output for the issuance data
      const mockTxHex = "02000000" + // Version 2
        "00" + // 0 inputs (XCP will add inputs later)
        "01" + // 1 output (OP_RETURN for issuance data)
        "0000000000000000" + // 0 value for OP_RETURN
        "29" + // Script length (41 bytes)
        "6a" + // OP_RETURN
        "28" + // Push 40 bytes
        // 40 bytes of dummy issuance data (XCP encoded)
        "434e545250525459" + // "CNTRPRTY" prefix
        "0000000000000014" + // Message ID 20 (issuance)
        "0000000000000001" + // Asset quantity
        "00000000000000000000000000000000" + // Rest of data
        "00000000"; // Locktime

      const createIssuanceStub = stub(
        CounterpartyApiManager,
        "createIssuance",
        () =>
          Promise.resolve({
            result: {
              rawtransaction: mockTxHex,
            },
          }),
      );

      const getXcpBalancesByAddressStub = stub(
        CounterpartyApiManager,
        "getXcpBalancesByAddress",
        () =>
          Promise.resolve({
            balances: [], // No stamp UTXOs to filter
            total: 0,
          }),
      );

      // Mock asset validation to avoid hitting real API
      const checkAssetAvailabilityStub = stub(
        StampValidationService,
        "checkAssetAvailability",
        () => Promise.resolve(true), // Return asset is available (doesn't exist)
      );

      try {
        const requestBody = {
          sourceWallet: mintAddressUTXOs.address,
          assetName: "TESTSTAMP", // Valid alphabetic asset name
          qty: 1,
          locked: true,
          divisible: false,
          filename: "test-31kb.png",
          file: createTestImage(31),
          satsPerVB: 1.1,
          service_fee: 50, // Small 50 sat service fee
          service_fee_address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
          prefix: "stamp",
          dryRun: false,
        };

        const request = mockRequest(requestBody);
        const response = await handler.POST!(request, {} as any);

        assertEquals(response.status, 200);

        const result = await response.json();

        // Verify response structure
        assertExists(result.hex, "Response should include PSBT hex");
        assertExists(result.cpid, "Response should include CPID");
        assertExists(
          result.est_tx_size,
          "Response should include estimated tx size",
        );
        assertExists(result.input_value, "Response should include input value");
        assertExists(
          result.est_miner_fee,
          "Response should include estimated miner fee",
        );
        assertExists(
          result.change_value,
          "Response should include change value",
        );
        assertExists(
          result.txDetails,
          "Response should include transaction details",
        );

        // Verify asset name
        assertEquals(result.cpid, requestBody.assetName);

        // Parse and verify PSBT
        const psbt = bitcoin.Psbt.fromHex(result.hex);

        // Verify inputs
        assertEquals(
          psbt.inputCount > 0,
          true,
          "PSBT should have at least one input",
        );

        // Verify outputs (OP_RETURN + CIP33 data outputs + service fee + change)
        assertEquals(
          psbt.txOutputs.length > 3,
          true,
          "PSBT should have multiple outputs",
        );

        // Verify fee rate calculation
        const feeRate = result.est_miner_fee / result.est_tx_size;
        assertEquals(
          Math.abs(feeRate - 1.1) < 0.1,
          true,
          `Fee rate should be close to 1.1 sat/vb, got ${feeRate}`,
        );

        console.log("Mint test results:");
        console.log(`  Transaction size: ${result.est_tx_size} vbytes`);
        console.log(`  Fee: ${result.est_miner_fee} sats`);
        console.log(`  Fee rate: ${feeRate.toFixed(2)} sat/vb`);
        console.log(`  Inputs selected: ${psbt.inputCount}`);
        console.log(`  Total outputs: ${psbt.txOutputs.length}`);
      } finally {
        getSpendableUTXOsStub.restore();
        getSpecificUTXOStub.restore();
        getRawTransactionHexStub.restore();
        createIssuanceStub.restore();
        getXcpBalancesByAddressStub.restore();
        checkAssetAvailabilityStub.restore();
      }
    },
  );

  await t.step("Dry run mode returns estimates without PSBT", async () => {
    const getSpendableUTXOsStub = stub(
      CommonUTXOService.prototype,
      "getSpendableUTXOs",
      () => Promise.resolve(mintAddressUTXOs.utxos),
    );

    const getXcpBalancesByAddressStub = stub(
      CounterpartyApiManager,
      "getXcpBalancesByAddress",
      () => Promise.resolve({ balances: [], total: 0 }),
    );

    // The XCP API returns a raw transaction for issuance
    // This is a minimal valid transaction with no inputs (as XCP would create)
    // and one OP_RETURN output for the issuance data
    const mockTxHex = "02000000" + // Version 2
      "00" + // 0 inputs (XCP will add inputs later)
      "01" + // 1 output (OP_RETURN for issuance data)
      "0000000000000000" + // 0 value for OP_RETURN
      "29" + // Script length (41 bytes)
      "6a" + // OP_RETURN
      "28" + // Push 40 bytes
      // 40 bytes of dummy issuance data (XCP encoded)
      "434e545250525459" + // "CNTRPRTY" prefix
      "0000000000000014" + // Message ID 20 (issuance)
      "0000000000000001" + // Asset quantity
      "00000000000000000000000000000000" + // Rest of data
      "00000000"; // Locktime

    const createIssuanceStub = stub(
      CounterpartyApiManager,
      "createIssuance",
      () =>
        Promise.resolve({
          result: {
            rawtransaction: mockTxHex,
          },
        }),
    );

    try {
      const requestBody = {
        sourceWallet: mintAddressUTXOs.address,
        assetName: "TESTDRYRUN",
        qty: 1,
        locked: true,
        divisible: false,
        filename: "test.png",
        file: createTestImage(31), // Use 31KB image
        satsPerVB: 1.1,
        service_fee: 50, // Small 50 sat service fee
        service_fee_address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
        dryRun: true, // Enable dry run
      };

      const request = mockRequest(requestBody);
      const response = await handler.POST!(request, {} as any);

      assertEquals(response.status, 200);

      const result = await response.json();

      // In dry run, hex should be empty
      assertEquals(result.hex, "");

      // But estimates should still be provided
      assertExists(result.est_tx_size);
      assertExists(result.est_miner_fee);
      assertExists(result.input_value);
      assertExists(result.change_value);
    } finally {
      getSpendableUTXOsStub.restore();
      getXcpBalancesByAddressStub.restore();
      createIssuanceStub.restore();
    }
  });

  await t.step("Handles insufficient funds error gracefully", async () => {
    // Mock to return no UTXOs
    const getSpendableUTXOsStub = stub(
      CommonUTXOService.prototype,
      "getSpendableUTXOs",
      () => Promise.resolve([]),
    );

    const getXcpBalancesByAddressStub = stub(
      CounterpartyApiManager,
      "getXcpBalancesByAddress",
      () => Promise.resolve({ balances: [], total: 0 }),
    );

    // The XCP API returns a raw transaction for issuance
    // This is a minimal valid transaction with no inputs (as XCP would create)
    // and one OP_RETURN output for the issuance data
    const mockTxHex = "02000000" + // Version 2
      "00" + // 0 inputs (XCP will add inputs later)
      "01" + // 1 output (OP_RETURN for issuance data)
      "0000000000000000" + // 0 value for OP_RETURN
      "29" + // Script length (41 bytes)
      "6a" + // OP_RETURN
      "28" + // Push 40 bytes
      // 40 bytes of dummy issuance data (XCP encoded)
      "434e545250525459" + // "CNTRPRTY" prefix
      "0000000000000014" + // Message ID 20 (issuance)
      "0000000000000001" + // Asset quantity
      "00000000000000000000000000000000" + // Rest of data
      "00000000"; // Locktime

    const createIssuanceStub = stub(
      CounterpartyApiManager,
      "createIssuance",
      () =>
        Promise.resolve({
          result: {
            rawtransaction: mockTxHex,
          },
        }),
    );

    try {
      const requestBody = {
        sourceWallet: mintAddressUTXOs.address,
        assetName: "TESTINSUFFICIENT",
        qty: 1,
        locked: true,
        divisible: false,
        filename: "test.png",
        file: createTestImage(15), // Use 15KB image
        satsPerVB: 1.1,
        service_fee: 50, // Use 50 sat service fee
        service_fee_address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
      };

      const request = mockRequest(requestBody);
      const response = await handler.POST!(request, {} as any);

      // Should return 400 for insufficient funds
      assertEquals(response.status, 400);

      const result = await response.json();
      assertExists(result.error);
      assertEquals(
        result.error.includes("Insufficient funds") ||
          result.error.includes("No UTXOs") ||
          result.error.includes("Invalid asset name"),
        true,
      );
    } finally {
      getSpendableUTXOsStub.restore();
      getXcpBalancesByAddressStub.restore();
      createIssuanceStub.restore();
    }
  });

  await t.step("Validates required fields", async () => {
    const invalidRequests = [
      { ...{}, description: "Missing all fields" },
      {
        sourceWallet: mintAddressUTXOs.address,
        description: "Missing file data",
      },
      {
        file: "data",
        filename: "test.png",
        description: "Missing source wallet",
      },
    ];

    for (const { description, ...body } of invalidRequests) {
      const request = mockRequest(body);
      const response = await handler.POST!(request, {} as any);

      assertEquals(response.status, 400, `Should fail for: ${description}`);
      const result = await response.json();
      assertExists(result.error, `Error should exist for: ${description}`);
    }
  });
});
