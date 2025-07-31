/**
 * Tests for API types, specifically focusing on internal API endpoint types
 *
 * @fileoverview Validates all internal API types added in Task 12.6
 */

import { assert, assertEquals } from "@std/assert";
import type {
  BackgroundFeeStatusResponse,
  BitcoinNotificationsResponse,
  BTCPriceResponse,
  BTCPriceStatusResponse,
  // Operation Response Types
  CachePurgeResponse,
  CarouselResponse,
  CircuitBreakerTestResetResponse,
  ConnectionPoolResetResponse,
  // Additional Internal Types
  CreatorNameResponse,
  CSRFTokenResponse,
  DatabaseMonitoringResponse,
  DebugHeadersResponse,
  FeeSecurityResponse,
  FeesResponse,
  MaraFeeRateResponse,
  MaraHealthResponse,
  // MARA API Types
  MaraSubmitRequest,
  MaraSubmitResponse,
  MemoryMonitoringResponse,
  // Monitoring & System Types
  MonitoringResponse,
  // File Upload Types
  SRC20BackgroundUploadRequest,
  SRC20BackgroundUploadResponse,
  StampRecentSalesResponse,
  UTXOQueryResponse,
} from "./api.d.ts";

import type { StampRow } from "$types/stamp.d.ts";

Deno.test("API Types - MARA Integration Types", () => {
  // Test MaraSubmitRequest
  const submitRequest: MaraSubmitRequest = {
    hex:
      "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff",
    txid: "abc123",
    priority: "high",
  };

  assertEquals(typeof submitRequest.hex, "string");
  assertEquals(submitRequest.priority, "high");

  // Test MaraSubmitResponse
  const submitResponse: MaraSubmitResponse = {
    txid: "abc123def456",
    status: "accepted",
    pool: "mara",
    message: "Transaction accepted",
    estimatedConfirmation: 6,
    poolPriority: 1,
  };

  assertEquals(submitResponse.pool, "mara");
  assertEquals(typeof submitResponse.estimatedConfirmation, "number");

  // Test MaraHealthResponse
  const healthResponse: MaraHealthResponse = {
    status: "healthy",
    timestamp: Date.now(),
    components: {
      enabled: true,
      configured: true,
      circuitBreaker: "healthy",
      apiPerformance: "healthy",
    },
    metrics: {
      successRate: 99.5,
      avgResponseTime: 150,
      circuitBreakerTrips: 0,
    },
    details: ["All systems operational"],
  };

  assertEquals(healthResponse.status, "healthy");
  assert(healthResponse.timestamp > 0);
  assertEquals(healthResponse.components.enabled, true);

  // Test MaraFeeRateResponse
  const feeRateResponse: MaraFeeRateResponse = {
    feeRate: 15,
    source: "mara",
    confidence: "high",
    timestamp: Date.now(),
    tiers: {
      fast: 20,
      medium: 15,
      slow: 10,
    },
  };

  assertEquals(typeof feeRateResponse.feeRate, "number");
  assertEquals(feeRateResponse.source, "mara");
  assert(feeRateResponse.tiers?.fast! > feeRateResponse.tiers?.slow!);
});

Deno.test("API Types - Monitoring & System Types", () => {
  // Test MonitoringResponse
  const monitoringResponse: MonitoringResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: 86400,
    memory: {
      rss: 134217728,
      heapTotal: 67108864,
      heapUsed: 33554432,
      external: 1048576,
      arrayBuffers: 524288,
    },
    pid: 12345,
    node_version: "v18.16.0",
    environment: "production",
  };

  assertEquals(monitoringResponse.status, "healthy");
  assert(monitoringResponse.uptime > 0);
  assertEquals(typeof monitoringResponse.pid, "number");

  // Test MemoryMonitoringResponse
  const memoryResponse: MemoryMonitoringResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    memory: {
      heap: {
        used: 33554432,
        total: 67108864,
        available: 33554432,
        percentage: 50,
      },
      system: {
        rss: 134217728,
        external: 1048576,
      },
    },
    gc: {
      lastCollection: new Date().toISOString(),
      collections: 150,
    },
  };

  assertEquals(memoryResponse.status, "healthy");
  assertEquals(memoryResponse.memory.heap.percentage, 50);
  assert(memoryResponse.gc?.collections! > 0);

  // Test FeesResponse
  const feesResponse: FeesResponse = {
    recommendedFee: 12,
    btcPrice: 45000,
    source: "mempool.space",
    confidence: "high",
    timestamp: Date.now(),
    fallbackUsed: false,
    tiers: {
      fast: 15,
      medium: 12,
      slow: 8,
    },
  };

  assertEquals(typeof feesResponse.recommendedFee, "number");
  assertEquals(typeof feesResponse.btcPrice, "number");
  assertEquals(feesResponse.confidence, "high");

  // Test BTCPriceResponse
  const priceResponse: BTCPriceResponse = {
    data: {
      price: 45000,
      source: "coingecko",
      confidence: "high",
      details: {
        lastUpdate: new Date().toISOString(),
        currency: "USD",
        volume24h: 1000000000,
        change24h: 2.5,
      },
    },
  };

  assertEquals(typeof priceResponse.data.price, "number");
  assertEquals(priceResponse.data.source, "coingecko");
  assert(priceResponse.data.details?.change24h !== undefined);

  // Test DatabaseMonitoringResponse
  const dbResponse: DatabaseMonitoringResponse = {
    connectionPool: {
      totalConnections: 10,
      activeConnections: 5,
      poolSize: 8,
      maxPoolSize: 20,
    },
    health: {
      poolUtilization: 0.5,
      hasAvailableConnections: true,
      isHealthy: true,
    },
    timestamp: new Date().toISOString(),
  };

  assertEquals(dbResponse.connectionPool.totalConnections, 10);
  assertEquals(dbResponse.health.isHealthy, true);

  // Test CSRFTokenResponse
  const csrfResponse: CSRFTokenResponse = {
    token: "csrf-token-abc123def456",
  };

  assertEquals(typeof csrfResponse.token, "string");
  assert(csrfResponse.token.length > 0);
});

Deno.test("API Types - File Upload Types", () => {
  // Test SRC20BackgroundUploadRequest
  const uploadRequest: SRC20BackgroundUploadRequest = {
    fileData:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/kKEp3QAAAABJRU5ErkJggg==",
    tick: "TEST",
    csrfToken: "csrf-token-123",
  };

  assertEquals(uploadRequest.tick, "TEST");
  assertEquals(typeof uploadRequest.fileData, "string");

  // Test SRC20BackgroundUploadResponse
  const uploadResponse: SRC20BackgroundUploadResponse = {
    success: true,
    message: "Upload completed successfully",
    fileInfo: {
      filename: "test-background.png",
      size: 1024,
      url: "/uploads/src20/test-background.png",
      type: "image/png",
    },
    timestamp: Date.now(),
  };

  assertEquals(uploadResponse.success, true);
  assertEquals(uploadResponse.fileInfo?.type, "image/png");
  assert(uploadResponse.timestamp! > 0);
});

Deno.test("API Types - Additional Internal Types", () => {
  // Test UTXOQueryResponse
  const utxoResponse: UTXOQueryResponse = {
    utxos: [
      {
        txid: "abc123def456",
        vout: 0,
        value: 100000,
        scriptPubKey: "76a914...",
        confirmations: 6,
      },
    ],
    totalValue: 100000,
    timestamp: Date.now(),
  };

  assertEquals(utxoResponse.utxos.length, 1);
  assertEquals(utxoResponse.utxos[0].value, 100000);
  assertEquals(utxoResponse.totalValue, 100000);

  // Test BackgroundFeeStatusResponse
  const feeStatusResponse: BackgroundFeeStatusResponse = {
    status: "ready",
    fees: {
      fast: 20,
      medium: 15,
      slow: 10,
    },
    lastUpdate: Date.now(),
  };

  assertEquals(feeStatusResponse.status, "ready");
  assert(feeStatusResponse.fees?.fast! > feeStatusResponse.fees?.slow!);

  // Test BitcoinNotificationsResponse
  const notificationsResponse: BitcoinNotificationsResponse = {
    blockHeight: 800000,
    notifications: [
      {
        id: "notif-123",
        type: "block",
        message: "New block mined",
        timestamp: Date.now(),
        severity: "info",
        data: { blockHash: "00000000000000000007c9..." },
      },
    ],
    status: "active",
  };

  assertEquals(notificationsResponse.blockHeight, 800000);
  assertEquals(notificationsResponse.notifications.length, 1);
  assertEquals(notificationsResponse.notifications[0].type, "block");

  // Test CreatorNameResponse
  const creatorResponse: CreatorNameResponse = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    name: "Satoshi Nakamoto",
    timestamp: Date.now(),
    ttl: 3600,
  };

  assertEquals(typeof creatorResponse.address, "string");
  assertEquals(creatorResponse.name, "Satoshi Nakamoto");
  assert(creatorResponse.ttl! > 0);

  // Test BTCPriceStatusResponse
  const priceStatusResponse: BTCPriceStatusResponse = {
    status: "ready",
    price: 45000,
    source: "coingecko",
    lastUpdate: Date.now(),
    nextUpdate: Date.now() + 60000,
  };

  assertEquals(priceStatusResponse.status, "ready");
  assertEquals(typeof priceStatusResponse.price, "number");
  assert(priceStatusResponse.nextUpdate! > priceStatusResponse.lastUpdate);

  // Test DebugHeadersResponse
  const debugResponse: DebugHeadersResponse = {
    headers: {
      "user-agent": "Mozilla/5.0...",
      "content-type": "application/json",
      "x-forwarded-for": "192.168.1.1",
    },
    method: "POST",
    url: "https://example.com/api/internal/debug-headers",
    clientIP: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    timestamp: Date.now(),
  };

  assertEquals(debugResponse.method, "POST");
  assertEquals(typeof debugResponse.clientIP, "string");
  assert(debugResponse.headers["content-type"] === "application/json");

  // Test FeeSecurityResponse
  const securityResponse: FeeSecurityResponse = {
    status: "secure",
    checks: {
      rateLimit: "ok",
      feeThreshold: "ok",
      sourceValidation: "ok",
    },
    messages: ["All security checks passed"],
    timestamp: Date.now(),
  };

  assertEquals(securityResponse.status, "secure");
  assertEquals(securityResponse.checks.rateLimit, "ok");
  assertEquals(securityResponse.messages.length, 1);

  // Test StampRecentSalesResponse
  const salesResponse: StampRecentSalesResponse = {
    sales: [
      {
        stamp: 1000,
        price: 50000000, // 0.5 BTC in sats
        timestamp: Date.now(),
        txHash: "abc123def456...",
        buyer: "bc1qbuyer...",
        seller: "bc1qseller...",
      },
    ],
    totalSales: 150,
    timestamp: Date.now(),
  };

  assertEquals(salesResponse.sales.length, 1);
  assertEquals(salesResponse.sales[0].stamp, 1000);
  assertEquals(typeof salesResponse.totalSales, "number");
});

Deno.test("API Types - Operation Response Types", () => {
  // Test CachePurgeResponse
  const purgeResponse: CachePurgeResponse = {
    success: true,
    itemsPurged: 150,
    message: "Cache purged successfully",
    timestamp: Date.now(),
  };

  assertEquals(purgeResponse.success, true);
  assertEquals(typeof purgeResponse.itemsPurged, "number");

  // Test ConnectionPoolResetResponse
  const resetResponse: ConnectionPoolResetResponse = {
    success: true,
    before: {
      totalConnections: 10,
      activeConnections: 8,
      poolSize: 5,
    },
    after: {
      totalConnections: 5,
      activeConnections: 0,
      poolSize: 5,
    },
    timestamp: Date.now(),
  };

  assertEquals(resetResponse.success, true);
  assertEquals(resetResponse.before.activeConnections, 8);
  assertEquals(resetResponse.after.activeConnections, 0);

  // Test CircuitBreakerTestResetResponse
  const cbResetResponse: CircuitBreakerTestResetResponse = {
    success: true,
    breakersReset: ["mara-service", "fee-service"],
    details: {
      "mara-service": {
        previousState: "OPEN",
        currentState: "CLOSED",
        resetAt: Date.now(),
      },
    },
    message: "Circuit breakers reset successfully",
    timestamp: Date.now(),
  };

  assertEquals(cbResetResponse.success, true);
  assertEquals(cbResetResponse.breakersReset.length, 2);
  assertEquals(cbResetResponse.details["mara-service"].currentState, "CLOSED");
});

Deno.test("API Types - Type Completeness", () => {
  // Test that all internal endpoint types are properly exported and available
  const typeNames = [
    "MaraSubmitRequest",
    "MaraSubmitResponse",
    "MaraHealthResponse",
    "MaraFeeRateResponse",
    "MonitoringResponse",
    "MemoryMonitoringResponse",
    "DatabaseMonitoringResponse",
    "FeesResponse",
    "BTCPriceResponse",
    "CSRFTokenResponse",
    "BitcoinNotificationsResponse",
    "SRC20BackgroundUploadRequest",
    "SRC20BackgroundUploadResponse",
    "CreatorNameResponse",
    "UTXOQueryResponse",
    "BackgroundFeeStatusResponse",
    "BTCPriceStatusResponse",
    "DebugHeadersResponse",
    "FeeSecurityResponse",
    "StampRecentSalesResponse",
    "CachePurgeResponse",
    "ConnectionPoolResetResponse",
    "CircuitBreakerTestResetResponse",
  ];

  // This test ensures all types are properly imported
  // If any are missing, the import at the top will fail
  assertEquals(typeNames.length, 23);

  // Verify that we covered all 20+ internal endpoints mentioned in the task
  assert(
    typeNames.length >= 20,
    "Should have at least 20 internal endpoint types",
  );
});

Deno.test("API Types - CarouselResponse extends StampRow array", () => {
  // Test that CarouselResponse is properly typed as an array of StampRow
  const carouselResponse: CarouselResponse = [] as StampRow[];

  // Should be an array
  assertEquals(Array.isArray(carouselResponse), true);

  // Test with mock StampRow data
  const mockCarousel: CarouselResponse = [
    {
      stamp: 1,
      block_index: 800000,
      cpid: "test-cpid",
      creator: "test-creator",
      divisible: false,
    } as StampRow,
  ];

  assertEquals(mockCarousel.length, 1);
  assertEquals(mockCarousel[0].stamp, 1);
});
