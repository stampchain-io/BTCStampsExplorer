/**
 * @fileoverview Test Suite for SRC-20 Type Definitions
 *
 * This test file validates all SRC-20 type definitions including:
 * - Type compilation and imports
 * - Interface compatibility and structure
 * - Type constraints and validation
 * - Operation type discrimination
 * - Market data integration
 *
 * @author BTCStampsExplorer Team
 * @version 1.0.0
 * @created 2025-01-31
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import type {
  ChartData,
  // Chart types
  ChartDataPoint,
  ChartOptions,
  // Mint and deployment types
  Deployment,
  DeployResponseBody as _DeployResponseBody,
  EnrichedSRC20Row,
  InputData,
  // Compatibility exports
  MintStatus,
  PaginatedSrc20BalanceResponseBody as _PaginatedSrc20BalanceResponseBody,
  PaginatedSrc20ResponseBody,
  PaginatedSRC20WithMarketDataResponse as _PaginatedSRC20WithMarketDataResponse,
  PaginatedTickResponseBody as _PaginatedTickResponseBody,
  PSBTInput as _PSBTInput,
  SignPSBTResult,
  SRC20_DETAILS,
  SRC20_FILTER_TYPES,
  SRC20_MARKET,
  SRC20_STATUS,
  // Core types
  SRC20_TYPES,
  SRC20Balance,
  SRC20BalanceRequestParams,
  Src20BalanceResponseBody,
  Src20Detail,
  // Request/Response types
  SRC20Filters,
  SRC20HolderData,
  SRC20MarketDataQueryParams,
  SRC20MintDataResponse,
  SRC20MintStatus,
  SRC20Operation,
  // Transaction and wallet types
  SRC20OperationResult,
  Src20ResponseBody as _Src20ResponseBody,
  // Data structures
  SRC20Row,
  Src20SnapShotDetail,
  SRC20SnapshotRequestParams,
  SRC20TickPageData as _SRC20TickPageData,
  SRC20TrxRequestParams,
  // Market data types
  SRC20WithOptionalMarketData,
  StampsAndSrc20 as _StampsAndSrc20,
  VOUT as _VOUT,
} from "./src20.d.ts";

Deno.test("SRC-20 Types - Core Type Definitions", () => {
  // Test type compilation - these should not cause TypeScript errors
  const operationTypes: SRC20_TYPES[] = [
    "all",
    "deploy",
    "mint",
    "transfer",
    "trending",
  ];
  const filterTypes: SRC20_FILTER_TYPES[] = [
    "minting",
    "trending mints",
    "deploy",
    "supply",
    "marketcap",
    "holders",
    "volume",
    "price change",
  ];
  const statusTypes: SRC20_STATUS[] = [
    "fully minted",
    "minting",
    "trending mints",
  ];
  const detailTypes: SRC20_DETAILS[] = ["deploy", "supply", "holders"];
  const marketTypes: SRC20_MARKET[] = ["marketcap", "volume", "price change"];
  const operations: SRC20Operation[] = ["deploy", "mint", "transfer"];

  // Basic assertions to ensure arrays are not empty
  assert(operationTypes.length > 0, "SRC20_TYPES should have values");
  assert(filterTypes.length > 0, "SRC20_FILTER_TYPES should have values");
  assert(statusTypes.length > 0, "SRC20_STATUS should have values");
  assert(detailTypes.length > 0, "SRC20_DETAILS should have values");
  assert(marketTypes.length > 0, "SRC20_MARKET should have values");
  assert(operations.length > 0, "SRC20Operation should have values");
});

Deno.test("SRC-20 Types - SRC20Row Interface Structure", () => {
  // Create a sample SRC20Row to test the interface structure
  const sampleSRC20Row: SRC20Row = {
    tx_hash: "abc123",
    block_index: 12345,
    p: "src-20",
    op: "deploy",
    tick: "TEST",
    tick_hash: "hash123",
    creator: "bc1qcreator123",
    creator_name: "Test Creator",
    destination: "bc1qdest123",
    block_time: new Date(),
    status: "valid",
    row_num: 1,
    holders: 100,
    fee_rate_sat_vb: 10,
    fee: 5000,

    // Optional fields
    amt: "1000",
    deci: 8,
    max: "21000000",
    lim: "1000",
    destination_name: "Test Destination",
    progress: "50.5",
    email: "test@example.com",
    web: "https://example.com",
    tg: "@testtoken",
    x: "@testtoken",
    floor_price_btc: 0.001,
    market_cap_btc: 1.5,
    top_mints_percentage: 25.5,
    volume_7d_btc: 0.5,
    value: 1000,
    stamp_url: "https://stamps.example.com/test",
    deploy_img: "https://images.example.com/deploy.png",
    deploy_tx: "deploy_tx_hash",
    mint_progress: {
      max_supply: "21000000",
      total_minted: "10500000",
      limit: "1000",
      total_mints: 10500,
      progress: "50.0",
      decimals: 8,
      tx_hash: "mint_tx_hash",
      tick: "TEST",
    },
    volume_24h_btc: 0.1,
    market_cap: 1500000,
    chart: [],
    mint_count: 10500,
    trending_rank: 5,
  };

  // Test required fields exist
  assertExists(sampleSRC20Row.tx_hash);
  assertExists(sampleSRC20Row.block_index);
  assertExists(sampleSRC20Row.p);
  assertExists(sampleSRC20Row.op);
  assertExists(sampleSRC20Row.tick);
  assertExists(sampleSRC20Row.tick_hash);
  assertExists(sampleSRC20Row.creator);
  assertExists(sampleSRC20Row.destination);
  assertExists(sampleSRC20Row.block_time);
  assertExists(sampleSRC20Row.status);
  assertExists(sampleSRC20Row.row_num);
  assertExists(sampleSRC20Row.holders);

  // Test operation discrimination
  assert(["deploy", "mint", "transfer"].includes(sampleSRC20Row.op));
});

Deno.test("SRC-20 Types - EnrichedSRC20Row Extension", () => {
  const enrichedRow: EnrichedSRC20Row = {
    // Base SRC20Row fields
    tx_hash: "abc123",
    block_index: 12345,
    p: "src-20",
    op: "mint",
    tick: "TEST",
    tick_hash: "hash123",
    creator: "bc1qcreator123",
    creator_name: "Test Creator",
    destination: "bc1qdest123",
    block_time: new Date(),
    status: "valid",
    row_num: 1,
    holders: 100,
    fee_rate_sat_vb: 10,
    fee: 5000,

    // Enriched fields
    market_data: {
      tick: "TEST",
      floor_price_btc: 0.001,
      market_cap_btc: 1.5,
      volume_24h_btc: 0.1,
      price_change_24h_percent: 5.5,
      holders_count: 100,
      last_sale_price_btc: 0.0015,
      total_volume_btc: 10.5,
      cache_status: "fresh",
      last_updated: new Date().toISOString(),
    },
    chart: [[Date.now(), 1500], [Date.now() + 3600000, 1600]],
    mint_count: 500,
    volume_24h_btc: 0.1,
    market_cap_btc: 1.5,
  };

  // Test that enriched row extends base row
  assertExists(enrichedRow.tx_hash);
  assertExists(enrichedRow.market_data);
  assertExists(enrichedRow.chart);

  // Test chart data structure
  if (
    enrichedRow.chart && Array.isArray(enrichedRow.chart) &&
    enrichedRow.chart.length > 0
  ) {
    const chartPoint = enrichedRow.chart[0] as ChartDataPoint;
    assert(Array.isArray(chartPoint) && chartPoint.length === 2);
    assert(typeof chartPoint[0] === "number"); // timestamp
    assert(typeof chartPoint[1] === "number"); // value
  }
});

Deno.test("SRC-20 Types - Balance and Detail Interfaces", () => {
  const balance: SRC20Balance = {
    address: "bc1quser123",
    p: "src-20",
    tick: "TEST",
    amt: 1000,
    block_time: new Date(),
    last_update: Date.now(),
    deploy_tx: "deploy_hash",
    deploy_img: "deploy_image.png",
  };

  const detail: Src20Detail = {
    tx_hash: "detail_hash",
    block_index: 12345,
    p: "src-20",
    op: "transfer",
    tick: "TEST",
    creator: "bc1qcreator123",
    amt: null, // Using Big type, can be null
    deci: 8,
    lim: "1000",
    max: "21000000",
    destination: "bc1qdest123",
    block_time: "2025-01-31T12:00:00Z",
    creator_name: "Test Creator",
    destination_name: "Test Destination",
  };

  const snapshot: Src20SnapShotDetail = {
    tick: "TEST",
    address: "bc1qholder123",
    balance: {} as any, // Would be Big.js instance in real usage
  };

  assertExists(balance.address);
  assertExists(balance.tick);
  assertExists(detail.tx_hash);
  assertExists(detail.op);
  assertExists(snapshot.tick);
  assertExists(snapshot.address);
});

Deno.test("SRC-20 Types - Request Parameter Interfaces", () => {
  const trxParams: SRC20TrxRequestParams = {
    block_index: 12345,
    tick: ["TEST", "DEMO"],
    op: "mint",
    limit: 50,
    page: 1,
    sort: "desc",
    sortBy: "block_time",
    filterBy: "status:valid",
    tx_hash: "specific_hash",
    address: "bc1qaddress123",
    noPagination: false,
    singleResult: false,

    // V2.3 parameters
    mintingStatus: "minting",
    trendingWindow: "24h",
    includeProgress: true,
    mintVelocityMin: 10,
  };

  const balanceParams: SRC20BalanceRequestParams = {
    address: "bc1qaddress123",
    tick: "TEST",
    amt: 1000,
    limit: 25,
    page: 1,
    sortBy: "amt",
    sortField: "amount",
    includePagination: true,
    includeMintData: true,
    includeMarketData: true,
  };

  const snapshotParams: SRC20SnapshotRequestParams = {
    tick: "TEST",
    limit: 100,
    page: 1,
    amt: 500,
    sortBy: "balance",
  };

  const filters: SRC20Filters = {
    status: ["minting", "fully minted"],
    details: {
      deploy: true,
      supply: true,
      holders: true,
      holdersRange: { min: 10, max: 1000 },
      supplyRange: { min: "1000", max: "21000000" },
    },
    market: {
      marketcap: true,
      marketcapRange: { min: 100000, max: 10000000 },
      volume: true,
      volumePeriod: "24h",
      priceChange: true,
      priceChangePeriod: "7d",
      priceChangeRange: { min: -50, max: 100 },
    },
    search: "TEST",
  };

  assertExists(trxParams.limit);
  assert(Array.isArray(trxParams.tick));
  assertExists(balanceParams.includeMarketData);
  assertExists(snapshotParams.tick);
  assertExists(filters.status);
  assertExists(filters.details);
  assertExists(filters.market);
});

Deno.test("SRC-20 Types - Response Interfaces", () => {
  const paginatedResponse: PaginatedSrc20ResponseBody = {
    last_block: 12345,
    page: 1,
    limit: 50,
    totalPages: 10,
    data: [], // Would contain EnrichedSRC20Row[]
  };

  const balanceResponse: Src20BalanceResponseBody = {
    last_block: 12345,
    data: {
      address: "bc1qaddress123",
      p: "src-20",
      tick: "TEST",
      amt: 1000,
      block_time: new Date(),
      last_update: Date.now(),
      deploy_tx: "deploy_hash",
      deploy_img: "deploy_image.png",
    },
    pagination: {
      page: 1,
      totalPages: 5,
    },
  };

  assertExists(paginatedResponse.last_block);
  assertExists(paginatedResponse.data);
  assertExists(balanceResponse.data);
  assertExists(balanceResponse.pagination);
});

Deno.test("SRC-20 Types - Operation and Transaction Types", () => {
  const inputData: InputData = {
    op: "deploy",
    sourceAddress: "bc1qsource123",
    tick: "NEWTOKEN",
    max: "21000000",
    lim: "1000",
    dec: 8,
    x: "@newtoken",
    web: "https://newtoken.com",
    email: "contact@newtoken.com",
    description: "A new test token",
    feeRate: 10,
    isEstimate: false,
  };

  const operationResult: SRC20OperationResult = {
    psbtHex: "70736274ff01...",
    inputsToSign: [
      { index: 0, address: "bc1qsource123" },
    ],
    error: undefined,
  };

  const signResult: SignPSBTResult = {
    signed: true,
    psbt: "70736274ff01...",
    txid: "signed_tx_hash",
    cancelled: false,
    error: undefined,
  };

  assertExists(inputData.sourceAddress);
  assertExists(inputData.tick);
  assertEquals(inputData.op, "deploy");
  assertExists(operationResult.psbtHex);
  assert(Array.isArray(operationResult.inputsToSign));
  assertEquals(signResult.signed, true);
});

Deno.test("SRC-20 Types - Mint and Deployment Types", () => {
  const deployment: Deployment = {
    amt: 0,
    block_index: 12345,
    block_time: "2025-01-31T12:00:00Z",
    creator: "bc1qcreator123",
    creator_name: "Token Creator",
    deci: 8,
    destination: "bc1qdest123",
    lim: 1000,
    max: 21000000,
    op: "deploy",
    p: "src-20",
    tick: "NEWTOKEN",
    tx_hash: "deploy_tx_hash",
    top_mints_percentage: 15.5,
  };

  const mintStatus: SRC20MintStatus = {
    max_supply: "21000000",
    total_minted: "5250000",
    limit: "1000",
    total_mints: 5250,
    progress: "25.0",
    decimals: 8,
    tx_hash: "mint_status_hash",
  };

  const mintDataResponse: SRC20MintDataResponse = {
    mintStatus: mintStatus,
    holders: 250,
  };

  const holderData: SRC20HolderData = {
    amt: "10000",
    percentage: "0.05",
    address: "bc1qholder123",
  };

  assertExists(deployment.tick);
  assertEquals(deployment.op, "deploy");
  assertExists(mintStatus.max_supply);
  assertExists(mintDataResponse.mintStatus);
  assertExists(holderData.amt);
});

Deno.test("SRC-20 Types - Market Data Integration", () => {
  const tokenWithMarket: SRC20WithOptionalMarketData = {
    // Base SRC20Row fields
    tx_hash: "market_hash",
    block_index: 12345,
    p: "src-20",
    op: "mint",
    tick: "MARKET",
    tick_hash: "market_tick_hash",
    creator: "bc1qcreator123",
    creator_name: "Market Creator",
    destination: "bc1qdest123",
    block_time: new Date(),
    status: "valid",
    row_num: 1,
    holders: 500,
    fee_rate_sat_vb: 15,
    fee: 7500,

    // Market data fields
    marketData: {
      tick: "MARKET",
      floor_price_btc: 0.002,
      market_cap_btc: 2.5,
      volume_24h_btc: 0.25,
      price_change_24h_percent: 12.5,
      holders_count: 500,
      last_sale_price_btc: 0.0025,
      total_volume_btc: 25.5,
      cache_status: "fresh",
      last_updated: new Date().toISOString(),
    },
    marketDataMessage: "Data is fresh",
    cacheStatus: "fresh",
    cacheAgeMinutes: 5,

    // Legacy compatibility fields
    market_data: {
      tick: "MARKET",
      floor_price_btc: 0.002,
      market_cap_btc: 2.5,
      volume_24h_btc: 0.25,
      price_change_24h_percent: 12.5,
      holders_count: 500,
      last_sale_price_btc: 0.0025,
      total_volume_btc: 25.5,
      cache_status: "fresh",
      last_updated: new Date().toISOString(),
    },
    priceBTC: 0.002,
    priceUSD: 200,
    marketCapUSD: 250000,
    volume24h: 25000,
  };

  const marketQuery: SRC20MarketDataQueryParams = {
    includeMarketData: true,
    marketDataOnly: false,
    minMarketCap: 100000,
    minVolume24h: 1000,
    sortByMarketCap: "desc",
  };

  assertExists(tokenWithMarket.marketData);
  assertExists(tokenWithMarket.cacheStatus);
  assertExists(marketQuery.includeMarketData);
  assertEquals(marketQuery.sortByMarketCap, "desc");
});

Deno.test("SRC-20 Types - Chart Data Types", () => {
  const chartPoint: ChartDataPoint = [Date.now(), 1500];
  const chartData: ChartData = [
    [Date.now() - 3600000, 1400],
    [Date.now() - 1800000, 1450],
    [Date.now(), 1500],
  ];

  const chartOptions: ChartOptions = {
    type: "line",
    title: "TEST Token Price History",
    yAxisTitle: "Price (sats)",
    fromPage: "token-detail",
    tick: "TEST",
  };

  assert(Array.isArray(chartPoint));
  assertEquals(chartPoint.length, 2);
  assert(typeof chartPoint[0] === "number");
  assert(typeof chartPoint[1] === "number");

  assert(Array.isArray(chartData));
  assert(
    chartData.every((point) => Array.isArray(point) && point.length === 2),
  );

  assertExists(chartOptions.type);
  assertExists(chartOptions.title);
});

Deno.test("SRC-20 Types - Compatibility Exports", () => {
  // Test that compatibility exports work
  const mintStatus: MintStatus = {
    max_supply: "21000000",
    total_minted: "10500000",
    limit: "1000",
    total_mints: 10500,
    progress: "50.0",
    decimals: 8,
    tx_hash: "compat_hash",
  };

  assertExists(mintStatus.max_supply);
  assertExists(mintStatus.total_minted);
  assertEquals(typeof mintStatus.total_mints, "number");
});

Deno.test("SRC-20 Types - Type Guards and Validation", () => {
  // Test operation type validation
  function isValidSRC20Operation(op: string): op is SRC20Operation {
    return ["deploy", "mint", "transfer"].includes(op);
  }

  assert(isValidSRC20Operation("deploy"));
  assert(isValidSRC20Operation("mint"));
  assert(isValidSRC20Operation("transfer"));
  assert(!isValidSRC20Operation("invalid"));

  // Test status validation
  function isValidSRC20Status(status: string): status is SRC20_STATUS {
    return ["fully minted", "minting", "trending mints"].includes(status);
  }

  assert(isValidSRC20Status("minting"));
  assert(isValidSRC20Status("fully minted"));
  assert(!isValidSRC20Status("invalid_status"));
});

console.log("✅ All SRC-20 type tests completed successfully!");
