/**
 * Type tests for Bitcoin base types
 *
 * Tests the core Bitcoin and foundational types migrated to base.d.ts
 */

import { assertEquals } from "@std/assert";
import { validateTypeCompilation } from "../utils/typeValidation.ts";
import type {
  BlockRow,
  BtcInfo,
  Config,
  ROOT_DOMAIN_TYPES,
  SUBPROTOCOLS,
  WalletDataTypes,
  XCPParams,
} from "$types/base.d.ts";

Deno.test("Base types - Type compilation", async () => {
  await validateTypeCompilation("lib/types/base.d.ts");
});

Deno.test("Base types - ROOT_DOMAIN_TYPES", () => {
  // Test that ROOT_DOMAIN_TYPES has the expected values
  const validDomains: ROOT_DOMAIN_TYPES[] = [
    ".btc",
    ".sats",
    ".xbt",
    ".x",
    ".pink",
  ];

  // This test validates at compile time
  assertEquals(validDomains.length, 5);
});

Deno.test("Base types - SUBPROTOCOLS", () => {
  // Test that SUBPROTOCOLS has the expected values
  const validProtocols: SUBPROTOCOLS[] = [
    "STAMP",
    "SRC-20",
    "SRC-721",
    "SRC-101",
  ];

  // This test validates at compile time
  assertEquals(validProtocols.length, 4);
});

Deno.test("Base types - BlockRow structure", () => {
  // Test BlockRow interface structure
  const testBlock: BlockRow = {
    block_index: 810000,
    block_hash:
      "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054",
    block_time: new Date(),
    previous_block_hash:
      "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a053",
    difficulty: 51234338590905.38,
    ledger_hash: "test_ledger_hash",
    txlist_hash: "test_txlist_hash",
    messages_hash: "test_messages_hash",
    indexed: 1,
    issuances: 5,
    sends: 10,
  };

  assertEquals(testBlock.indexed, 1);
  assertEquals(typeof testBlock.block_index, "number");
});

Deno.test("Base types - BtcInfo structure", () => {
  // Test BtcInfo interface structure
  const testBtcInfo: BtcInfo = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    balance: 5000000000, // 50 BTC in satoshis
    txCount: 2,
    unconfirmedBalance: 0,
    unconfirmedTxCount: 0,
  };

  assertEquals(typeof testBtcInfo.address, "string");
  assertEquals(typeof testBtcInfo.balance, "number");
});

Deno.test("Base types - WalletDataTypes structure", () => {
  // Test WalletDataTypes interface structure
  const testWallet: WalletDataTypes = {
    accounts: ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    publicKey:
      "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f",
    btcBalance: {
      confirmed: 5000000000,
      unconfirmed: 0,
      total: 5000000000,
    },
    network: "mainnet",
    provider: "Test Wallet",
  };

  assertEquals(testWallet.network, "mainnet");
  assertEquals(testWallet.btcBalance.total, 5000000000);
});

Deno.test("Base types - XCPParams structure", () => {
  // Test XCPParams interface structure
  const testXCPParams: XCPParams = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    asset: "TESTASSET",
    quantity: 1000,
    divisible: true,
    lock: false,
    description: "Test asset for unit testing",
    fee_per_kb: 1000,
  };

  assertEquals(testXCPParams.divisible, true);
  assertEquals(typeof testXCPParams.quantity, "number");
});

Deno.test("Base types - Config structure", () => {
  // Test Config interface structure
  const testConfig: Config = {
    MINTING_SERVICE_FEE_ENABLED: true,
    MINTING_SERVICE_FEE: "0.001",
    MINTING_SERVICE_FEE_ADDRESS: "1MintingServiceAddressExample",
  };

  assertEquals(testConfig.MINTING_SERVICE_FEE_ENABLED, true);
  assertEquals(typeof testConfig.MINTING_SERVICE_FEE, "string");
});
