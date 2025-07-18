import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { stub } from "https://deno.land/std@0.208.0/testing/mock.ts";
import { handler } from "$routes/api/v2/olga/mint.ts";
import { mintAddressUTXOs } from "../fixtures/utxoFixtures.mint.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import * as bitcoin from "bitcoinjs-lib";

console.log(
  "Starting test with UTXOs:",
  mintAddressUTXOs.utxos.map((u) => ({
    value: u.value,
    txid: u.txid.substring(0, 8) + "...",
  })),
);

const createTestImage = (sizeInKB: number = 31): string => {
  const targetSize = sizeInKB * 1024;
  const pngHeader = new Uint8Array([
    0x89,
    0x50,
    0x4E,
    0x47,
    0x0D,
    0x0A,
    0x1A,
    0x0A,
    0x00,
    0x00,
    0x00,
    0x0D,
    0x49,
    0x48,
    0x44,
    0x52,
    0x00,
    0x00,
    0x00,
    0x64,
    0x00,
    0x00,
    0x00,
    0x64,
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);

  const dataSize = targetSize - pngHeader.length - 12;
  const dummyData = new Uint8Array(dataSize);
  for (let i = 0; i < dataSize; i++) {
    dummyData[i] = i % 256;
  }

  const iendChunk = new Uint8Array([
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4E,
    0x44,
    0xAE,
    0x42,
    0x60,
    0x82,
  ]);

  const fullImage = new Uint8Array(targetSize);
  fullImage.set(pngHeader, 0);
  fullImage.set(dummyData, pngHeader.length);
  fullImage.set(iendChunk, pngHeader.length + dataSize);

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

const getRawTransactionHexStub = stub(
  CommonUTXOService.prototype,
  "getRawTransactionHex",
  () => Promise.resolve("0200000001..."),
);

const mockTxHex = "02000000" +
  "00" +
  "01" +
  "0000000000000000" +
  "29" +
  "6a" +
  "28" +
  "434e545250525459" +
  "0000000000000014" +
  "0000000000000001" +
  "00000000000000000000000000000000" +
  "00000000";

const createIssuanceStub = stub(
  XcpManager,
  "createIssuance",
  () =>
    Promise.resolve({
      result: {
        rawtransaction: mockTxHex,
      },
    }),
);

const getXcpBalancesByAddressStub = stub(
  XcpManager,
  "getXcpBalancesByAddress",
  () =>
    Promise.resolve({
      balances: [],
      total: 0,
    }),
);

try {
  const requestBody = {
    sourceWallet: mintAddressUTXOs.address,
    assetName: "TESTSTAMP",
    qty: 1,
    locked: true,
    divisible: false,
    filename: "test-31kb.png",
    file: createTestImage(31),
    satsPerVB: 1.1,
    service_fee: 50,
    service_fee_address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
    prefix: "stamp",
    dryRun: false,
  };

  console.log("Request body prepared, calling handler...");

  const request = mockRequest(requestBody);
  const response = await handler.POST!(request, {} as any);

  console.log("Response status:", response.status);

  if (response.status !== 200) {
    const errorResult = await response.json();
    console.error("Error response:", errorResult);
  } else {
    const result = await response.json();
    console.log("Success! Transaction details:");
    console.log("- Size:", result.est_tx_size, "vbytes");
    console.log("- Fee:", result.est_miner_fee, "sats");
    console.log(
      "- Fee rate:",
      (result.est_miner_fee / result.est_tx_size).toFixed(2),
      "sat/vb",
    );
    console.log("- Change:", result.change_value, "sats");
  }
} finally {
  getSpendableUTXOsStub.restore();
  getSpecificUTXOStub.restore();
  getRawTransactionHexStub.restore();
  createIssuanceStub.restore();
  getXcpBalancesByAddressStub.restore();
}
