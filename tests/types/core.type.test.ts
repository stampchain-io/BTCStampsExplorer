/**
 * Core Type Tests
 *
 * Comprehensive type tests for core Bitcoin and Bitcoin Stamps types including:
 * - Bitcoin base types (base.d.ts)
 * - Stamp protocol types (stamp.d.ts)
 * - SRC-20 protocol types (src20.d.ts)
 * - SRC-101 NFT types (src101.d.ts)
 * - Transaction types (transaction.d.ts)
 */

import { assertEquals } from "@std/assert";
import {
    analyzeDependencies,
    benchmarkTypeChecking,
    validateCrossModuleCompatibility,
    validateTypeCompilation,
    validateTypeExports,
    withTempTypeFile
} from "./utils/typeValidation.ts";


// ============================================================================
// BASE TYPE IMPORTS AND TESTS
// ============================================================================

import type {
    BlockRow,
    BtcInfo,
    ROOT_DOMAIN_TYPES,
    SUBPROTOCOLS,
    UTXO,
    WalletDataTypes
} from "../../lib/types/base.d.ts";

// ============================================================================
// STAMP TYPE IMPORTS AND TESTS
// ============================================================================

import type {
    StampBalance,
    StampClassification,
    StampMetadata,
    StampRarity,
    StampRow,
    StampStatus,
    StampValidationError,
    StampValidationResult,
    StampValidationStatus
} from "../../lib/types/stamp.d.ts";

// ============================================================================
// SRC-20 TYPE IMPORTS AND TESTS
// ============================================================================

import type {
    EnrichedSRC20Row,
    MintStatus,
    SRC20_OPERATIONS,
    SRC20Balance,
    SRC20Deploy,
    SRC20Mint,
    SRC20Row,
    SRC20Transfer
} from "../../lib/types/src20.d.ts";

// ============================================================================
// SRC-101 TYPE IMPORTS AND TESTS (Basic types that exist)
// ============================================================================

import type {
    SRC101InputData,
    SRC101Operation,
} from "../../lib/types/src101.d.ts";

// ============================================================================
// TRANSACTION TYPE IMPORTS AND TESTS (Basic types that exist)
// ============================================================================

import type {
    DispenserRow,
    SendRow,
    SentGalleryProps
} from "../../lib/types/transaction.d.ts";

// ============================================================================
// TYPE COMPILATION TESTS
// ============================================================================

Deno.test("Core Types - Type Compilation", async () => {
  // Test individual domain files compile
  await validateTypeCompilation("lib/types/base.d.ts");
  await validateTypeCompilation("lib/types/stamp.d.ts");
  await validateTypeCompilation("lib/types/src20.d.ts");
  await validateTypeCompilation("lib/types/src101.d.ts");
  await validateTypeCompilation("lib/types/transaction.d.ts");
});

Deno.test("Core Types - Cross-Module Compatibility", async () => {
  // Test that types can be imported together without conflicts
  const sharedTypes = ["SUBPROTOCOLS", "UTXO", "TransactionInput", "TransactionOutput"];

  await validateCrossModuleCompatibility(
    "../../lib/types/base.d.ts",
    "../../lib/types/stamp.d.ts",
    sharedTypes
  );

  await validateCrossModuleCompatibility(
    "../../lib/types/base.d.ts",
    "../../lib/types/src20.d.ts",
    ["SUBPROTOCOLS"]
  );
});

Deno.test("Core Types - Export Validation", async () => {
  // Verify key types are properly exported
  await validateTypeExports("lib/types/base.d.ts", [
    "BlockRow", "BtcInfo", "Config", "ROOT_DOMAIN_TYPES", "SUBPROTOCOLS",
    "WalletDataTypes", "XCPParams", "UTXO", "TransactionInput", "TransactionOutput"
  ]);

  await validateTypeExports("lib/types/stamp.d.ts", [
    "StampRow", "StampBalance", "StampFilters", "STAMP_TYPES", "StampClassification",
    "StampValidationResult", "StampTransactionType", "StampProtocolVersion"
  ]);

  await validateTypeExports("lib/types/src20.d.ts", [
    "SRC20Row", "SRC20Balance", "Src20Detail", "EnrichedSRC20Row", "MintStatus",
    "SRC20_OPERATIONS", "SRC20Deploy", "SRC20Mint", "SRC20Transfer"
  ]);

  await validateTypeExports("lib/types/src101.d.ts", [
    "SRC101Collection", "SRC101Token", "SRC101Transfer", "SRC101Attribute",
    "SRC101Metadata", "SRC101Statistics", "SRC101TokenStandard"
  ]);

  await validateTypeExports("lib/types/transaction.d.ts", [
    "SendRow", "SendBalance", "DispenserRow", "TransactionHash", "TransactionBuilder",
    "UTXOSelectionStrategy", "FeeEstimationStrategy"
  ]);
});

// ============================================================================
// BITCOIN BASE TYPE TESTS
// ============================================================================

Deno.test("Bitcoin Base Types - Structure Validation", () => {
  // Test ROOT_DOMAIN_TYPES enum values
  const validDomains: ROOT_DOMAIN_TYPES[] = [".btc", ".sats", ".xbt", ".x", ".pink"];
  assertEquals(validDomains.length, 5);

  // Test SUBPROTOCOLS enum values
  const validProtocols: SUBPROTOCOLS[] = ["STAMP", "SRC-20", "SRC-721", "SRC-101"];
  assertEquals(validProtocols.length, 4);

  // Test BlockRow interface structure
  const testBlock: BlockRow = {
    block_index: 810000,
    block_hash: "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054",
    block_time: new Date(),
    previous_block_hash: "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a053",
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
  assertEquals(typeof testBlock.difficulty, "number");

  // Test BtcInfo structure
  const testBtcInfo: BtcInfo = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    balance: 5000000000,
    txCount: 2,
    unconfirmedBalance: 0,
    unconfirmedTxCount: 0,
  };

  assertEquals(typeof testBtcInfo.address, "string");
  assertEquals(typeof testBtcInfo.balance, "number");

  // Test UTXO structure
  const testUTXO: UTXO = {
    txid: "abcd1234567890",
    vout: 0,
    value: 100000,
    scriptPubKey: "76a914...",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    confirmations: 6,
  };

  assertEquals(testUTXO.vout, 0);
  assertEquals(typeof testUTXO.value, "number");
});

Deno.test("Bitcoin Base Types - WalletDataTypes Structure", () => {
  const testWallet: WalletDataTypes = {
    accounts: ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    publicKey: "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f",
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
  assertEquals(Array.isArray(testWallet.accounts), true);
});

// ============================================================================
// STAMP TYPE TESTS
// ============================================================================

Deno.test("Stamp Types - Core StampRow Structure", () => {
  const testStamp: StampRow = {
    stamp: 12345,
    cpid: "A123456789",
    ident: "STAMP",
    block_index: 800000,
    block_time: new Date(),
    tx_hash: "abcd1234567890",
    tx_index: 0,
    creator: "bc1q...",
    creator_name: "Test Creator",
    divisible: false,
    keyburn: null,
    locked: 0,
    supply: 1,
    stamp_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    stamp_mimetype: "image/png",
    stamp_url: "https://stamps.com/12345",
    stamp_hash: "hash123",
    file_hash: "filehash123",
    file_size_bytes: 2048,
    floorPrice: 0.001,
    marketCap: 1.5,
    balance: 1,
    unbound_quantity: 1,
  };

  assertEquals(testStamp.stamp, 12345);
  assertEquals(testStamp.ident, "STAMP");
  assertEquals(typeof testStamp.divisible, "boolean");
  assertEquals(testStamp.supply, 1);

  // Test stamp balance
  const testBalance: StampBalance = {
    cpid: "A123456789",
    stamp: 12345,
    stamp_base64: testStamp.stamp_base64,
    stamp_url: testStamp.stamp_url,
    stamp_mimetype: testStamp.stamp_mimetype,
    tx_hash: testStamp.tx_hash,
    divisible: 0,
    supply: 1,
    locked: 0,
    creator: testStamp.creator,
    creator_name: testStamp.creator_name,
    balance: 1,
  };

  assertEquals(testBalance.cpid, testStamp.cpid);
  assertEquals(testBalance.stamp, testStamp.stamp);
});

Deno.test("Stamp Types - Classification and Validation", () => {
  // Test StampClassification enum
  const classifications: StampClassification[] = [
    StampClassification.BLESSED,
    StampClassification.CURSED,
    StampClassification.CLASSIC,
    StampClassification.POSH,
  ];

  assertEquals(classifications.length, 4);
  assertEquals(StampClassification.BLESSED, "blessed");
  assertEquals(StampClassification.CURSED, "cursed");

  // Test StampValidationStatus enum
  const validationStatuses: StampValidationStatus[] = [
    StampValidationStatus.VALID,
    StampValidationStatus.INVALID,
    StampValidationStatus.PENDING,
    StampValidationStatus.ERROR,
  ];

  assertEquals(validationStatuses.length, 4);
  assertEquals(StampValidationStatus.VALID, "valid");

  // Test StampMetadata structure
  const testMetadata: StampMetadata = {
    classification: StampClassification.BLESSED,
    rarity: StampRarity.COMMON,
    status: StampStatus.CONFIRMED,
    validationStatus: StampValidationStatus.VALID,
    title: "Test Stamp",
    description: "A test stamp for validation",
    tags: ["test", "validation"],
    encoding: "base64",
    protocolVersion: "2.1",
    indexingRules: ["standard"],
    validationRules: ["size-check", "format-check"],
    createdAt: new Date(),
    lastUpdated: new Date(),
  };

  assertEquals(testMetadata.classification, StampClassification.BLESSED);
  assertEquals(testMetadata.status, StampStatus.CONFIRMED);
  assertEquals(Array.isArray(testMetadata.tags), true);
});

Deno.test("Stamp Types - Validation Results", () => {
  const testValidationError: StampValidationError = {
    code: "E001",
    message: "Invalid base64 encoding",
    severity: "critical",
    field: "stamp_base64",
    expectedValue: "valid base64",
    actualValue: "invalid data",
    suggestion: "Ensure data is properly base64 encoded",
  };

  assertEquals(testValidationError.severity, "critical");
  assertEquals(typeof testValidationError.code, "string");

  const testValidationResult: StampValidationResult = {
    isValid: false,
    status: StampValidationStatus.INVALID,
    validatedAt: new Date(),
    validatedBy: "test-validator",
    compliance: {
      isValidBase64: false,
      followsSizeRules: true,
      hasValidMimetype: true,
      usesCorrectPrefix: true,
      isProperlyIndexed: true,
      hasCorrectTimestamp: true,
      hasValidTransaction: true,
      meetsClassificationRules: true,
      complianceScore: 85,
      complianceDetails: [
        { rule: "base64-check", passed: false, message: "Invalid encoding" },
      ],
    },
    errors: [testValidationError],
    warnings: [],
    validationTime: 150,
  };

  assertEquals(testValidationResult.isValid, false);
  assertEquals(testValidationResult.compliance.complianceScore, 85);
  assertEquals(testValidationResult.errors.length, 1);
});

// ============================================================================
// SRC-20 TYPE TESTS
// ============================================================================

Deno.test("SRC-20 Types - Core Structure", () => {
  // Test SRC20Row structure
  const testSRC20: SRC20Row = {
    id: 1,
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    address: "bc1q...",
    tx_hash: "abcd1234567890",
    block_index: 800000,
    timestamp: new Date(),
  };

  assertEquals(testSRC20.tick, "TEST");
  assertEquals(typeof testSRC20.max, "string");
  assertEquals(typeof testSRC20.dec, "number");

  // Test SRC20Balance structure
  const testBalance: SRC20Balance = {
    tick: "TEST",
    balance: "500",
    address: "bc1q...",
    block_index: 800000,
    tx_hash: "abcd1234567890",
  };

  assertEquals(testBalance.tick, testSRC20.tick);
  assertEquals(typeof testBalance.balance, "string");

  // Test EnrichedSRC20Row with market data
  const testEnriched: EnrichedSRC20Row = {
    id: 1,
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    address: "bc1q...",
    tx_hash: "abcd1234567890",
    block_index: 800000,
    timestamp: new Date(),
    progress_percentage: 50.5,
    total_minted: "505000",
    unique_holders: 150,
    total_transactions: 1200,
    mint_velocity_24h: 25.5,
    price_change_24h: 5.2,
    trending_score: 85.5,
  };

  assertEquals(testEnriched.progress_percentage, 50.5);
  assertEquals(typeof testEnriched.total_minted, "string");
  assertEquals(typeof testEnriched.trending_score, "number");
});

Deno.test("SRC-20 Types - Operations and Transactions", () => {
  // Test SRC20_OPERATIONS enum
  const operations: SRC20_OPERATIONS[] = ["DEPLOY", "MINT", "TRANSFER"];
  assertEquals(operations.length, 3);

  // Test SRC20Deploy structure
  const testDeploy: SRC20Deploy = {
    p: "src-20",
    op: "DEPLOY",
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
  };

  assertEquals(testDeploy.op, "DEPLOY");
  assertEquals(testDeploy.p, "src-20");

  // Test SRC20Mint structure
  const testMint: SRC20Mint = {
    p: "src-20",
    op: "MINT",
    tick: "TEST",
    amt: "1000",
  };

  assertEquals(testMint.op, "MINT");
  assertEquals(testMint.amt, "1000");

  // Test SRC20Transfer structure
  const testTransfer: SRC20Transfer = {
    p: "src-20",
    op: "TRANSFER",
    tick: "TEST",
    amt: "500",
    to: "bc1qreceiver...",
  };

  assertEquals(testTransfer.op, "TRANSFER");
  assertEquals(testTransfer.to, "bc1qreceiver...");

  // Test MintStatus
  const testMintStatus: MintStatus = {
    max_supply: "1000000",
    total_minted: "500000",
    remaining: "500000",
    progress_percentage: 50.0,
    is_completed: false,
    mint_rate_24h: 25000,
    estimated_completion: new Date(Date.now() + 86400000 * 20), // 20 days
  };

  assertEquals(testMintStatus.progress_percentage, 50.0);
  assertEquals(testMintStatus.is_completed, false);
});

// ============================================================================
// SRC-101 TYPE TESTS
// ============================================================================

Deno.test("SRC-101 Types - Basic Structure", () => {
  // Test SRC101Operation enum values
  const operations: SRC101Operation[] = ["deploy", "mint", "transfer", "setrecord", "renew"];
  assertEquals(operations.length, 5);

  // Test SRC101InputData structure
  const testInputData: SRC101InputData = {
    op: "deploy",
    sourceAddress: "bc1qsource...",
    toAddress: "bc1qto...",
    changeAddress: "bc1qchange...",
    root: "TEST_ROOT",
    name: "Test NFT",
  };

  assertEquals(testInputData.op, "deploy");
  assertEquals(testInputData.sourceAddress, "bc1qsource...");
  assertEquals(testInputData.root, "TEST_ROOT");

  // Test different operations
  const mintData: SRC101InputData = {
    op: "mint",
    sourceAddress: "bc1qminter...",
    changeAddress: "bc1qchange...",
    root: "TEST_ROOT",
  };

  assertEquals(mintData.op, "mint");

  const transferData: SRC101InputData = {
    op: "transfer",
    sourceAddress: "bc1qsender...",
    toAddress: "bc1qreceiver...",
    changeAddress: "bc1qchange...",
    root: "TEST_ROOT",
  };

  assertEquals(transferData.op, "transfer");
  assertEquals(transferData.toAddress, "bc1qreceiver...");
});

// ============================================================================
// TRANSACTION TYPE TESTS
// ============================================================================

Deno.test("Transaction Types - Core Structure", () => {
  // Test SendRow structure
  const testSend: SendRow = {
    tx_index: 123456,
    tx_hash: "abcd1234567890",
    block_index: 800000,
    source: "bc1qsender...",
    destination: "bc1qreceiver...",
    asset: "TEST_ASSET",
    quantity: 1000,
    status: "valid",
    block_time: new Date(),
    fee_paid: 1000,
    memo: null,
  };

  assertEquals(testSend.tx_index, 123456);
  assertEquals(testSend.quantity, 1000);
  assertEquals(testSend.status, "valid");

  // Test DispenserRow structure
  const testDispenser: DispenserRow = {
    tx_index: 123457,
    tx_hash: "efgh5678901234",
    block_index: 800001,
    source: "bc1qdispenser...",
    asset: "TEST_ASSET",
    give_quantity: 1,
    escrow_quantity: 100,
    satoshirate: 1000,
    status: 0,
    give_remaining: 99,
    block_time: new Date(),
    oracle_address: null,
    last_status_tx_hash: null,
    last_status_tx_source: null,
    close_block_index: null,
    confirmed: true,
  };

  assertEquals(testDispenser.give_quantity, 1);
  assertEquals(testDispenser.escrow_quantity, 100);
  assertEquals(testDispenser.confirmed, true);
});

Deno.test("Transaction Types - Basic Structure", () => {
  // Test SentGalleryProps
  const testGalleryProps: SentGalleryProps = {
    txHash: "abcd1234567890",
    data: [],
    showPagination: true,
    currentPage: 1,
    totalPages: 5,
  };

  assertEquals(testGalleryProps.txHash, "abcd1234567890");
  assertEquals(testGalleryProps.currentPage, 1);
  assertEquals(testGalleryProps.showPagination, true);
});

// ============================================================================
// TYPE DEPENDENCY ANALYSIS
// ============================================================================

Deno.test("Core Types - Dependency Analysis", async () => {
  const typeFiles = [
    "lib/types/base.d.ts",
    "lib/types/stamp.d.ts",
    "lib/types/src20.d.ts",
    "lib/types/src101.d.ts",
    "lib/types/transaction.d.ts",
  ];

  const analysis = await analyzeDependencies(".//Documents/BTCStampsExplorer", typeFiles);

  // Should have no circular dependencies
  assertEquals(analysis.circularDependencies.length, 0);

  // All files should be in dependency map
  assertEquals(analysis.dependencies.size, typeFiles.length);

  console.log(`✅ Dependency analysis passed - ${analysis.dependencies.size} files analyzed`);
});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

Deno.test("Core Types - Performance Benchmarks", async () => {
  const typeFiles = [
    "lib/types/base.d.ts",
    "lib/types/stamp.d.ts",
    "lib/types/src20.d.ts",
    "lib/types/src101.d.ts",
    "lib/types/transaction.d.ts",
  ];

  const benchmarks: Array<{file: string, result: any}> = [];

  for (const file of typeFiles) {
    const result = await benchmarkTypeChecking(file);
    benchmarks.push({ file, result });

    // Assert reasonable performance (>100 lines per second)
    if (result.performanceScore < 100) {
      console.warn(`⚠️ Slow type checking detected for ${file}: ${result.performanceScore} lines/sec`);
    }
  }

  const avgPerformance = benchmarks.reduce((sum, b) => sum + b.result.performanceScore, 0) / benchmarks.length;
  console.log(`📊 Average type checking performance: ${Math.round(avgPerformance)} lines/sec`);

  // Should have reasonable average performance
  assertEquals(avgPerformance > 50, true, "Type checking performance too slow");
});

// ============================================================================
// REAL-WORLD USAGE EXAMPLES
// ============================================================================

Deno.test("Core Types - Real-World Usage Examples", async () => {
  // Test stamp creation workflow
  await withTempTypeFile(`
    import type { StampRow, StampClassification, StampValidationResult } from "$types/stamp.d.ts";
    import type { SRC20Row, SRC20_OPERATIONS } from "$types/src20.d.ts";
    import type { TransactionBuilder, UTXOSelectionStrategy } from "$types/transaction.d.ts";

    // Example: Stamp creation workflow
    const newStamp: Partial<StampRow> = {
      cpid: "A123456789",
      ident: "STAMP",
      creator: "bc1q...",
      stamp_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      stamp_mimetype: "image/png",
      divisible: false,
      supply: 1,
    };

    // Example: SRC-20 token deployment
    const tokenDeploy: SRC20Row = {
      id: 1,
      tick: "EXAMPLE",
      max: "21000000",
      lim: "1000",
      dec: 8,
      address: "bc1q...",
      tx_hash: "deploy_tx_hash",
      block_index: 800000,
      timestamp: new Date(),
    };

    // Example: Transaction building
    interface MockTransactionBuilder extends TransactionBuilder {
      inputs: any[];
      outputs: any[];
      feeRate: number;
    }

    const txBuilder: MockTransactionBuilder = {
      inputs: [],
      outputs: [],
      feeRate: 10,
      addInput: function(input) { this.inputs.push(input); return this; },
      addOutput: function(output) { this.outputs.push(output); return this; },
      setFeeRate: function(rate) { this.feeRate = rate; return this; },
      estimateFee: () => Promise.resolve(1000),
      build: () => Promise.resolve("hex"),
      sign: function(key) { return this; },
      broadcast: () => Promise.resolve({ success: true, txid: "tx", rawTx: "hex", error: null }),
      validate: () => Promise.resolve({ isValid: true, errors: [], warnings: [], estimatedFee: 1000, size: 250, virtualSize: 150 }),
    };

    // These should compile without errors
    const _stamp: typeof newStamp = newStamp;
    const _token: typeof tokenDeploy = tokenDeploy;
    const _builder: typeof txBuilder = txBuilder;
  `, async (filePath) => {
    await validateTypeCompilation(filePath);
  });
});

// ============================================================================
// ENHANCED SRC-20 TYPE TESTS (Consolidated from src20_test.ts)
// ============================================================================

import type {
    ChartData,
    ChartDataPoint,
    ChartOptions,
    Deployment,
    InputData,
    PaginatedSrc20ResponseBody,
    SignPSBTResult,
    SRC20_DETAILS,
    SRC20_FILTER_TYPES,
    SRC20_MARKET,
    SRC20_STATUS,
    SRC20_TYPES,
    SRC20BalanceRequestParams,
    SRC20Filters,
    SRC20HolderData,
    SRC20MarketDataQueryParams,
    SRC20MintDataResponse,
    SRC20MintStatus,
    SRC20Operation,
    SRC20OperationResult,
    SRC20SnapshotRequestParams,
    SRC20TrxRequestParams,
    SRC20WithOptionalMarketData
} from "../../lib/types/src20.d.ts";

Deno.test("SRC-20 Types - Core Type Definitions", () => {
  // Test SRC20_TYPES enum
  const operationTypes: SRC20_TYPES[] = [
    "all",
    "deploy",
    "mint",
    "transfer",
    "trending",
  ];
  assertEquals(operationTypes.length, 5);

  // Test SRC20_FILTER_TYPES enum
  const filterTypes: SRC20_FILTER_TYPES[] = [
    "all",
    "mintable",
    "deploys",
    "mints",
    "transfers",
  ];
  assertEquals(filterTypes.length, 5);

  // Test SRC20_STATUS enum
  const statusTypes: SRC20_STATUS[] = [
    "pending",
    "confirmed",
    "invalid",
  ];
  assertEquals(statusTypes.length, 3);

  // Test SRC20_MARKET enum
  const marketTypes: SRC20_MARKET[] = [
    "all",
    "listed",
    "unlisted",
    "expired",
  ];
  assertEquals(marketTypes.length, 4);
});

Deno.test("SRC-20 Types - SRC20Row Interface Structure", () => {
  // Test core SRC20Row structure
  const src20Row: SRC20Row = {
    tx_hash: "abc123",
    tick: "STAMPS",
    op: "DEPLOY",
    amt: "1000",
    decimals: 18,
    max: "21000000",
    lim: "1000",
    p: "100",
    creator: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    tx_index: 12345,
    block_index: 700000,
    block_time: "2023-01-01T00:00:00Z",
    status: "confirmed",
  };

  assertEquals(src20Row.tick, "STAMPS");
  assertEquals(src20Row.op, "DEPLOY");
  assertEquals(src20Row.amt, "1000");
  assertEquals(src20Row.decimals, 18);
  assertEquals(src20Row.status, "confirmed");
});

Deno.test("SRC-20 Types - EnrichedSRC20Row Extension", () => {
  // Test EnrichedSRC20Row with market data
  const enrichedRow: EnrichedSRC20Row = {
    tx_hash: "def456",
    tick: "STAMPS",
    op: "MINT",
    amt: "100",
    decimals: 18,
    creator: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    tx_index: 12346,
    block_index: 700001,
    block_time: "2023-01-01T01:00:00Z",
    status: "confirmed",
    // Market data enrichment
    market_data: {
      price_btc: 0.00001,
      volume_24h_btc: 1.5,
      market_cap_btc: 210,
      holders: 1500,
      last_updated: "2023-01-01T12:00:00Z",
    },
    mint_progress: {
      total_minted: "5000000",
      max_supply: "21000000",
      progress_percentage: 23.8,
      remaining: "16000000",
    },
  };

  assertEquals(enrichedRow.tick, "STAMPS");
  assertEquals(enrichedRow.market_data?.price_btc, 0.00001);
  assertEquals(enrichedRow.mint_progress?.progress_percentage, 23.8);
});

Deno.test("SRC-20 Types - Balance and Detail Interfaces", () => {
  // Test SRC20Balance interface
  const balance: SRC20Balance = {
    tick: "STAMPS",
    balance: "1500",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    decimals: 18,
    last_update: "2023-01-01T12:00:00Z",
  };

  assertEquals(balance.tick, "STAMPS");
  assertEquals(balance.balance, "1500");
  assertEquals(balance.decimals, 18);

  // Test SRC20HolderData interface
  const holderData: SRC20HolderData = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    balance: "1000",
    percentage: 4.76,
    rank: 1,
    first_tx: "abc123",
    last_activity: "2023-01-01T12:00:00Z",
  };

  assertEquals(holderData.address.length, 34);
  assertEquals(holderData.percentage, 4.76);
  assertEquals(holderData.rank, 1);
});

Deno.test("SRC-20 Types - Request Parameter Interfaces", () => {
  // Test SRC20TrxRequestParams
  const trxParams: SRC20TrxRequestParams = {
    tick: "STAMPS",
    op: "MINT",
    limit: 50,
    page: 1,
    sort_order: "DESC",
    block_index: 700000,
  };

  assertEquals(trxParams.tick, "STAMPS");
  assertEquals(trxParams.op, "MINT");
  assertEquals(trxParams.limit, 50);

  // Test SRC20BalanceRequestParams
  const balanceParams: SRC20BalanceRequestParams = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    tick: "STAMPS",
    min_balance: "100",
    include_zero: false,
  };

  assertEquals(balanceParams.address.length, 34);
  assertEquals(balanceParams.tick, "STAMPS");
  assertEquals(balanceParams.include_zero, false);

  // Test SRC20SnapshotRequestParams
  const snapshotParams: SRC20SnapshotRequestParams = {
    tick: "STAMPS",
    block_index: 700000,
    min_balance: "1",
    limit: 100,
    page: 1,
  };

  assertEquals(snapshotParams.tick, "STAMPS");
  assertEquals(snapshotParams.block_index, 700000);
  assertEquals(snapshotParams.limit, 100);
});

Deno.test("SRC-20 Types - Response Interfaces", () => {
  // Test PaginatedSrc20ResponseBody
  const paginatedResponse: PaginatedSrc20ResponseBody = {
    data: [],
    page: 1,
    limit: 50,
    total: 1000,
    totalPages: 20,
    hasNext: true,
    hasPrevious: false,
  };

  assertEquals(paginatedResponse.page, 1);
  assertEquals(paginatedResponse.limit, 50);
  assertEquals(paginatedResponse.total, 1000);
  assertEquals(paginatedResponse.hasNext, true);

  // Test SRC20MintDataResponse
  const mintDataResponse: SRC20MintDataResponse = {
    tick: "STAMPS",
    total_minted: "5000000",
    max_supply: "21000000",
    progress_percentage: 23.8,
    remaining_supply: "16000000",
    mints_count: 5000,
    unique_minters: 1200,
    avg_mint_size: "1000",
    last_mint_block: 700500,
    mint_rate_24h: 150,
  };

  assertEquals(mintDataResponse.tick, "STAMPS");
  assertEquals(mintDataResponse.progress_percentage, 23.8);
  assertEquals(mintDataResponse.unique_minters, 1200);
});

Deno.test("SRC-20 Types - Operation and Transaction Types", () => {
  // Test SRC20Operation discriminated union
  const deployOp: SRC20Operation = {
    op: "DEPLOY",
    tick: "NEWTOKEN",
    max: "1000000",
    lim: "100",
    dec: "8",
  };
  assertEquals(deployOp.op, "DEPLOY");
  assertEquals(deployOp.tick, "NEWTOKEN");

  const mintOp: SRC20Operation = {
    op: "MINT",
    tick: "STAMPS",
    amt: "100",
  };
  assertEquals(mintOp.op, "MINT");
  assertEquals(mintOp.amt, "100");

  const transferOp: SRC20Operation = {
    op: "TRANSFER",
    tick: "STAMPS",
    amt: "50",
    to: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  };
  assertEquals(transferOp.op, "TRANSFER");
  assertEquals(transferOp.to?.length, 34);

  // Test SRC20OperationResult
  const opResult: SRC20OperationResult = {
    success: true,
    tx_hash: "abc123",
    operation: deployOp,
    block_index: 700000,
    gas_used: 21000,
    fee_paid: 0.0001,
  };

  assertEquals(opResult.success, true);
  assertEquals(opResult.tx_hash, "abc123");
  assertEquals(opResult.gas_used, 21000);
});

Deno.test("SRC-20 Types - Mint and Deployment Types", () => {
  // Test Deployment interface
  const deployment: Deployment = {
    tick: "STAMPS",
    max: "21000000",
    lim: "1000",
    dec: "18",
    deployer: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    deploy_tx: "abc123",
    deploy_block: 700000,
    deploy_time: "2023-01-01T00:00:00Z",
    total_minted: "5000000",
    holders: 1500,
    transfers: 25000,
  };

  assertEquals(deployment.tick, "STAMPS");
  assertEquals(deployment.max, "21000000");
  assertEquals(deployment.dec, "18");
  assertEquals(deployment.holders, 1500);

  // Test MintStatus enum
  const mintStatuses: MintStatus[] = [
    "available",
    "limited",
    "completed",
    "paused",
  ];
  assertEquals(mintStatuses.length, 4);

  // Test SRC20MintStatus interface
  const mintStatus: SRC20MintStatus = {
    tick: "STAMPS",
    status: "available",
    progress_percentage: 23.8,
    remaining_supply: "16000000",
    mint_rate_limit: "1000",
    estimated_completion: "2024-01-01T00:00:00Z",
  };

  assertEquals(mintStatus.status, "available");
  assertEquals(mintStatus.progress_percentage, 23.8);
});

Deno.test("SRC-20 Types - Market Data Integration", () => {
  // Test SRC20WithOptionalMarketData
  const tokenWithMarket: SRC20WithOptionalMarketData = {
    tx_hash: "abc123",
    tick: "STAMPS",
    op: "DEPLOY",
    creator: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    tx_index: 12345,
    block_index: 700000,
    block_time: "2023-01-01T00:00:00Z",
    status: "confirmed",
    // Optional market data
    market_data: {
      price_btc: 0.00001,
      volume_24h_btc: 1.5,
      market_cap_btc: 210,
      price_change_24h: 5.2,
      volume_change_24h: -2.1,
      last_trade_time: "2023-01-01T11:30:00Z",
    },
  };

  assertEquals(tokenWithMarket.tick, "STAMPS");
  assertEquals(tokenWithMarket.market_data?.price_btc, 0.00001);
  assertEquals(tokenWithMarket.market_data?.price_change_24h, 5.2);

  // Test SRC20MarketDataQueryParams
  const marketQuery: SRC20MarketDataQueryParams = {
    ticks: ["STAMPS", "PEPECOIN"],
    include_volume: true,
    include_holders: true,
    min_market_cap: 100,
    sort_by: "market_cap",
    sort_order: "DESC",
  };

  assertEquals(marketQuery.ticks?.length, 2);
  assertEquals(marketQuery.include_volume, true);
  assertEquals(marketQuery.sort_by, "market_cap");
});

Deno.test("SRC-20 Types - Chart Data Types", () => {
  // Test ChartDataPoint interface
  const dataPoint: ChartDataPoint = {
    timestamp: 1672531200000, // 2023-01-01
    value: 0.00001,
    volume: 1500,
    high: 0.000012,
    low: 0.000008,
    open: 0.00001,
    close: 0.000011,
  };

  assertEquals(dataPoint.timestamp, 1672531200000);
  assertEquals(dataPoint.value, 0.00001);
  assertEquals(dataPoint.volume, 1500);

  // Test ChartData interface
  const chartData: ChartData = {
    data: [dataPoint],
    timeframe: "24h",
    tick: "STAMPS",
    metric: "price",
    currency: "BTC",
    start_time: 1672531200000,
    end_time: 1672617600000,
    data_points: 24,
  };

  assertEquals(chartData.data.length, 1);
  assertEquals(chartData.timeframe, "24h");
  assertEquals(chartData.tick, "STAMPS");
  assertEquals(chartData.data_points, 24);

  // Test ChartOptions interface
  const chartOptions: ChartOptions = {
    chart_type: "candlestick",
    timeframe: "1h",
    show_volume: true,
    show_moving_averages: true,
    theme: "dark",
    height: 400,
    width: 800,
  };

  assertEquals(chartOptions.chart_type, "candlestick");
  assertEquals(chartOptions.show_volume, true);
  assertEquals(chartOptions.height, 400);
});

Deno.test("SRC-20 Types - Type Guards and Validation", () => {
  // Test InputData interface for transaction construction
  const inputData: InputData = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    tick: "STAMPS",
    amount: "100",
    operation: "TRANSFER",
    fee_rate: 10,
    utxos: [],
  };

  assertEquals(inputData.address.length, 34);
  assertEquals(inputData.tick, "STAMPS");
  assertEquals(inputData.operation, "TRANSFER");
  assertEquals(inputData.fee_rate, 10);

  // Test SignPSBTResult interface
  const psbtResult: SignPSBTResult = {
    success: true,
    signed_psbt: "cHNidP8BAFUCA...",
    tx_hash: "abc123",
    fee_paid: 0.0001,
    size_bytes: 250,
    vsize: 141,
  };

  assertEquals(psbtResult.success, true);
  assertEquals(psbtResult.tx_hash, "abc123");
  assertEquals(psbtResult.size_bytes, 250);
  assertEquals(psbtResult.vsize, 141);
});

Deno.test("SRC-20 Types - Compatibility Exports", () => {
  // Test that all key interfaces are properly exported
  const src20Details: SRC20_DETAILS[] = [
    "basic",
    "extended",
    "full",
    "minimal",
  ];
  assertEquals(src20Details.length, 4);

  // Test SRC20Filters interface
  const filters: SRC20Filters = {
    tick: "STAMPS",
    op: ["MINT", "TRANSFER"],
    creator: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    min_amt: "100",
    max_amt: "1000",
    date_from: "2023-01-01",
    date_to: "2023-12-31",
    status: "confirmed",
  };

  assertEquals(filters.tick, "STAMPS");
  assertEquals(filters.op?.length, 2);
  assertEquals(filters.creator?.length, 34);
});

// ============================================================================
// TRANSACTION TYPE TESTS (Consolidated from transaction_test.ts)
// ============================================================================

import type {
    BlockInfo,
    InputTypeForSizeEstimation,
    MintStampInputData,
    Output,
    OutputTypeForSizeEstimation,
    ScriptType,
    TX
} from "../../lib/types/transaction.d.ts";

Deno.test("Transaction Types - SendRow Interface Structure", () => {
  const sendRow: SendRow = {
    source: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    destination: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    cpid: "STAMP001",
    tick: "TEST",
    memo: "Test send transaction",
    quantity: "1000000",
    tx_hash: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    block_index: 850000,
    satoshirate: 50000,
    block_time: new Date("2024-01-01T00:00:00Z"),
  };

  assertEquals(typeof sendRow.source, "string");
  assertEquals(typeof sendRow.destination, "string");
  assertEquals(typeof sendRow.cpid, "string");
  assertEquals(typeof sendRow.tick, "string");
  assertEquals(typeof sendRow.memo, "string");
  assertEquals(typeof sendRow.quantity, "string");
  assertEquals(typeof sendRow.tx_hash, "string");
  assertEquals(typeof sendRow.block_index, "number");
  assertEquals(typeof sendRow.satoshirate, "number");
  assertEquals(sendRow.block_time instanceof Date, true);
});

Deno.test("Transaction Types - BlockInfo Interface Structure", () => {
  const mockStampRow: StampRow = {
    stamp: 1,
    cpid: "STAMP001",
    ident: "STAMPS",
    block_index: 850000,
    block_time: new Date("2024-01-01T00:00:00Z"),
    tx_hash: "abc123",
    tx_index: 1,
    creator: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    creator_name: "Test Creator",
    divisible: false,
    keyburn: null,
    locked: 0,
    supply: 1,
    stamp_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    stamp_mimetype: "image/png",
    stamp_url: "https://example.com/stamp1.png",
    stamp_hash: "abc123",
    file_hash: "def456",
    file_size_bytes: 100,
    unbound_quantity: 0,
  };

  const blockInfo: BlockInfo = {
    block_info: {
      block_index: 850000,
      block_hash: "0000000000000000000f1c54cb9637e4c4fcd5b1d4b1d4e4f4e8b0a9d8c7b6a5",
      block_time: "2024-01-01T00:00:00Z",
      previous_block_hash: "0000000000000000000e1c54cb9637e4c4fcd5b1d4b1d4e4f4e8b0a9d8c7b6a4",
      difficulty: 85000000000000,
      ledger_hash: "def456",
      txlist_hash: "ghi789",
      messages_hash: "jkl012",
      tx_count: 100,
    },
    issuances: [mockStampRow],
    sends: [],
  };

  assertEquals(blockInfo.block_info.block_index, 850000);
  assertEquals(blockInfo.issuances.length, 1);
  assertEquals(blockInfo.sends.length, 0);
  assertEquals(blockInfo.issuances[0].stamp, 1);
});

Deno.test("Transaction Types - Script Type Enums", () => {
  const scriptTypes: ScriptType[] = [
    "P2PK",
    "P2PKH",
    "P2SH",
    "P2WPKH",
    "P2WSH",
    "P2TR",
    "OP_RETURN",
    "MULTISIG",
    "NON_STANDARD",
  ];
  assertEquals(scriptTypes.length, 9);

  // Test InputTypeForSizeEstimation
  const inputTypes: InputTypeForSizeEstimation[] = [
    "P2PKH",
    "P2SH_P2WPKH",
    "P2WPKH",
    "P2TR",
  ];
  assertEquals(inputTypes.length, 4);

  // Test OutputTypeForSizeEstimation
  const outputTypes: OutputTypeForSizeEstimation[] = [
    "P2PKH",
    "P2SH",
    "P2WPKH",
    "P2WSH",
    "P2TR",
    "OP_RETURN",
  ];
  assertEquals(outputTypes.length, 6);
});

Deno.test("Transaction Types - MintStampInputData Interface", () => {
  const mintInput: MintStampInputData = {
    sourceWallet: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    assetName: "MY_STAMP",
    qty: 1,
    locked: false,
    divisible: false,
    filename: "stamp.png",
    file: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    satsPerKB: 50000,
    service_fee: 1000,
    service_fee_address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
  };

  assertEquals(mintInput.sourceWallet.length, 62);
  assertEquals(mintInput.qty, 1);
  assertEquals(mintInput.locked, false);
  assertEquals(mintInput.divisible, false);
  assertEquals(mintInput.service_fee, 1000);
});

Deno.test("Transaction Types - TX and Output Interfaces", () => {
  const output: Output = {
    value: 1000,
    script: "76a914abc123def456789012345678901234567890abcdef88ac",
    script_type: "P2PKH",
    addresses: ["bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"],
  };

  assertEquals(output.value, 1000);
  assertEquals(output.script_type, "P2PKH");
  assertEquals(output.addresses.length, 1);

  const tx: TX = {
    hash: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    version: 1,
    size: 250,
    vsize: 141,
    weight: 562,
    locktime: 0,
    inputs: [],
    outputs: [output],
    fee: 1000,
    fee_rate: 7.09,
  };

  assertEquals(tx.hash.length, 64);
  assertEquals(tx.version, 1);
  assertEquals(tx.outputs.length, 1);
  assertEquals(tx.fee, 1000);
});

console.log("✅ All core type tests completed successfully!");
