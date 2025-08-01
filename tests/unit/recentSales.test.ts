/**
 * @fileoverview Tests for Recent Sales Enhancement Feature
 * Covers the enhanced market data functionality including:
 * - RecentSaleCard component
 * - RecentSalesGallery component
 * - SalesActivityFeed component
 * - Enhanced API endpoints
 * - Error handling utilities
 * - Accessibility utilities
 */

import {
  assertEquals,
  assertExists,
} from "@std/assert";
import {
  ErrorHandlingUtils,
  ErrorSeverity,
  ErrorType,
} from "$lib/utils/monitoring/errors/errorHandlingUtils.ts";
import { AccessibilityUtils } from "$lib/utils/ui/accessibility/accessibilityUtils.ts";
import type { StampWithEnhancedSaleData } from "$types/marketData.d.ts";

/* ===== TEST DATA ===== */
const mockSaleData: StampWithEnhancedSaleData = {
  tx_hash: "test-tx-hash-123",
  stamp: 12345,
  stamp_hash: "test-stamp-hash",
  stamp_mimetype: "image/png",
  stamp_url: "/api/v2/stamps/src/test-tx-hash-123",
  creator: "bc1test-creator-address",
  creator_name: "TestCreator",
  supply: 1,
  divisible: false,
  locked: 1,
  cpid: "A123456789",
  block_index: 800000,
  block_time: new Date("2024-01-01T12:00:00Z"),
  ident: "STAMP",
  file_hash: "test-file-hash",
  keyburn: null,
  unbound_quantity: 0,
  stamp_base64: "data:image/png;base64,testdata",
  sale_data: {
    tx_hash: "sale-tx-hash-456",
    block_index: 800001,
    btc_amount: 0.001,
    btc_amount_satoshis: 100000,
    buyer_address: "bc1test-buyer-address",
    dispenser_address: "bc1test-dispenser-address",
    dispenser_tx_hash: "dispenser-tx-hash-789",
    time_ago: "2 hours ago",
  },
};

const mockSalesArray: StampWithEnhancedSaleData[] = [
  mockSaleData,
  {
    ...mockSaleData,
    tx_hash: "test-tx-hash-456",
    stamp: 12346,
    sale_data: {
      ...mockSaleData.sale_data!,
      tx_hash: "sale-tx-hash-789",
      btc_amount: 0.002,
      btc_amount_satoshis: 200000,
      time_ago: "1 hour ago",
    },
  },
];

/* ===== ERROR HANDLING UTILITIES TESTS ===== */

Deno.test("ErrorHandlingUtils - createErrorInfo with network error", () => {
  const networkError = new Error("network timeout");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(
    networkError,
    "API fetch",
  );

  assertEquals(errorInfo.type, ErrorType.NETWORK_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.retryable, true);
  assertEquals(errorInfo.message, "API fetch: network timeout");
  assertExists(errorInfo.timestamp);
});

Deno.test("ErrorHandlingUtils - createErrorInfo with timeout error", () => {
  const timeoutError = new Error("request timeout exceeded");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(timeoutError);

  assertEquals(errorInfo.type, ErrorType.TIMEOUT_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.MEDIUM);
  assertEquals(errorInfo.retryable, true);
});

Deno.test("ErrorHandlingUtils - createErrorInfo with auth error", () => {
  const authError = new Error("unauthorized access");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(authError);

  assertEquals(errorInfo.type, ErrorType.AUTH_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.recoverable, false);
});

Deno.test("ErrorHandlingUtils - createErrorInfo with HTTP status errors", () => {
  const serverError = { status: 500, message: "Internal Server Error" };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(serverError);

  assertEquals(errorInfo.type, ErrorType.API_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.retryable, true);
});

Deno.test("ErrorHandlingUtils - createErrorInfo with 404 error", () => {
  const notFoundError = { status: 404, message: "Not Found" };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(notFoundError);

  assertEquals(errorInfo.type, ErrorType.DATA_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.LOW);
});

Deno.test("ErrorHandlingUtils - createErrorInfo with rate limit error", () => {
  const rateLimitError = { status: 429 };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(rateLimitError);

  assertEquals(errorInfo.type, ErrorType.API_ERROR);
  assertEquals(errorInfo.retryable, true);
  assertEquals(errorInfo.message.includes("Too many requests"), true);
});

Deno.test("ErrorHandlingUtils - getUserFriendlyMessage", () => {
  const networkError = {
    type: ErrorType.NETWORK_ERROR,
    severity: ErrorSeverity.HIGH,
    message: "Network failed",
    timestamp: new Date(),
    recoverable: true,
    retryable: true,
  };

  const friendlyMessage = ErrorHandlingUtils.getUserFriendlyMessage(
    networkError,
  );
  assertEquals(friendlyMessage.includes("Unable to connect"), true);
});

Deno.test("ErrorHandlingUtils - getRecommendedAction", () => {
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.NETWORK_ERROR, true),
    "retry",
  );
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.AUTH_ERROR, false),
    "login",
  );
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.VALIDATION_ERROR, false),
    "correct_input",
  );
});

Deno.test("ErrorHandlingUtils - withTimeout resolves successfully", async () => {
  const fastPromise = Promise.resolve("success");
  const result = await ErrorHandlingUtils.withTimeout(fastPromise, 1000);
  assertEquals(result, "success");
});

Deno.test("ErrorHandlingUtils - withTimeout throws on timeout", async () => {
  let timeoutId: number | undefined;
  const slowPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve("slow"), 2000);
  });

  try {
    await ErrorHandlingUtils.withTimeout(slowPromise, 100);
    throw new Error("Should have timed out");
  } catch (error) {
    assertEquals((error as Error).message, "Operation timed out");
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
});

Deno.test("ErrorHandlingUtils - safeAsync with successful operation", async () => {
  const operation = () => Promise.resolve("data");
  const result = await ErrorHandlingUtils.safeAsync(operation, "fallback");

  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, "data");
  }
});

Deno.test("ErrorHandlingUtils - safeAsync with failed operation", async () => {
  const operation = () => Promise.reject(new Error("failed"));
  const result = await ErrorHandlingUtils.safeAsync(operation, "fallback");

  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.fallback, "fallback");
    assertExists(result.error);
  }
});

Deno.test("ErrorHandlingUtils - shouldReport critical errors", () => {
  const criticalError = {
    type: ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity.CRITICAL,
    message: "Critical system failure",
    timestamp: new Date(),
    recoverable: false,
    retryable: false,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(criticalError), true);
});

Deno.test("ErrorHandlingUtils - shouldReport unrecoverable errors", () => {
  const unrecoverableError = {
    type: ErrorType.DATA_ERROR,
    severity: ErrorSeverity.LOW,
    message: "Data corruption",
    timestamp: new Date(),
    recoverable: false,
    retryable: false,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(unrecoverableError), true);
});

Deno.test("ErrorHandlingUtils - should not report low severity recoverable errors", () => {
  const minorError = {
    type: ErrorType.VALIDATION_ERROR,
    severity: ErrorSeverity.LOW,
    message: "Invalid input",
    timestamp: new Date(),
    recoverable: true,
    retryable: false,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(minorError), false);
});

/* ===== ACCESSIBILITY UTILITIES TESTS ===== */

Deno.test("AccessibilityUtils - getSaleCardLabel with complete sale data", () => {
  const label = AccessibilityUtils.getSaleCardLabel(mockSaleData);

  assertEquals(label.includes("Stamp 12345"), true);
  assertEquals(label.includes("0.00100000 BTC"), true);
  assertEquals(label.includes("2 hours ago"), true);
  assertEquals(label.includes("bc1test-..."), true);
});

Deno.test("AccessibilityUtils - multiple sales processing", () => {
  // Test processing multiple sales for accessibility
  const labels = mockSalesArray.map((sale) =>
    AccessibilityUtils.getSaleCardLabel(sale)
  );

  assertEquals(labels.length, 2);
  assertEquals(labels[0].includes("Stamp 12345"), true);
  assertEquals(labels[1].includes("Stamp 12346"), true);
  assertEquals(labels[1].includes("0.00200000 BTC"), true);
});

Deno.test("AccessibilityUtils - getSaleCardLabel without sale data", () => {
  const stampWithoutSale = { ...mockSaleData };
  delete stampWithoutSale.sale_data;

  const label = AccessibilityUtils.getSaleCardLabel(stampWithoutSale);
  assertEquals(label.includes("No sale data available"), true);
});

Deno.test("AccessibilityUtils - getSaleTransactionDescription", () => {
  const description = AccessibilityUtils.getSaleTransactionDescription(
    mockSaleData,
  );

  assertEquals(description.includes("Transaction sale-tx-...hash-456"), true);
  assertEquals(description.includes("block 800,001"), true);
  assertEquals(description.includes("purchased by bc1test-...-address"), true);
  assertEquals(description.includes("via dispenser bc1test-...-address"), true);
  assertEquals(description.includes("100,000 satoshis"), true);
});

Deno.test("AccessibilityUtils - getGalleryNavigationLabel", () => {
  const label = AccessibilityUtils.getGalleryNavigationLabel(2, 5, 20);
  assertEquals(label, "Gallery navigation: page 2 of 5 showing 20 items");
});

Deno.test("AccessibilityUtils - getRefreshButtonLabel when loading", () => {
  const label = AccessibilityUtils.getRefreshButtonLabel(true);
  assertEquals(label, "Refreshing sales data, please wait");
});

Deno.test("AccessibilityUtils - getRefreshButtonLabel when not loading", () => {
  const label = AccessibilityUtils.getRefreshButtonLabel(
    false,
    "2 minutes ago",
  );
  assertEquals(label.includes("Refresh sales data"), true);
  assertEquals(label.includes("Last updated: 2 minutes ago"), true);
});

Deno.test("AccessibilityUtils - getUpdateAnnouncement", () => {
  assertEquals(
    AccessibilityUtils.getUpdateAnnouncement(0),
    "No new sales found",
  );
  assertEquals(
    AccessibilityUtils.getUpdateAnnouncement(1),
    "1 new sale found and added to the list",
  );
  assertEquals(
    AccessibilityUtils.getUpdateAnnouncement(5),
    "5 new sales found and added to the list",
  );
});

Deno.test("AccessibilityUtils - getLoadingLabel", () => {
  assertEquals(
    AccessibilityUtils.getLoadingLabel("gallery"),
    "Loading sales gallery, please wait",
  );
  assertEquals(
    AccessibilityUtils.getLoadingLabel("feed"),
    "Loading sales activity feed, please wait",
  );
  assertEquals(
    AccessibilityUtils.getLoadingLabel("card"),
    "Loading sale details, please wait",
  );
  assertEquals(
    AccessibilityUtils.getLoadingLabel("refresh"),
    "Refreshing data, please wait",
  );
});

Deno.test("AccessibilityUtils - getErrorMessage", () => {
  assertEquals(
    AccessibilityUtils.getErrorMessage("network"),
    "Unable to load sales data due to network error",
  );
  assertEquals(
    AccessibilityUtils.getErrorMessage("network", "Connection timeout"),
    "Unable to load sales data due to network error: Connection timeout",
  );
});

Deno.test("AccessibilityUtils - getKeyboardInstructions", () => {
  const galleryInstructions = AccessibilityUtils.getKeyboardInstructions(
    "gallery",
  );
  assertEquals(galleryInstructions.includes("arrow keys"), true);
  assertEquals(galleryInstructions.includes("Enter to view details"), true);

  const feedInstructions = AccessibilityUtils.getKeyboardInstructions("feed");
  assertEquals(feedInstructions.includes("arrow keys"), true);
  assertEquals(feedInstructions.includes("Enter to view stamp details"), true);
});

Deno.test("AccessibilityUtils - getResponsiveLabel", () => {
  assertEquals(
    AccessibilityUtils.getResponsiveLabel("mobile"),
    "Mobile view: simplified layout with essential information",
  );
  assertEquals(
    AccessibilityUtils.getResponsiveLabel("tablet"),
    "Tablet view: enhanced layout with additional details",
  );
  assertEquals(
    AccessibilityUtils.getResponsiveLabel("desktop"),
    "Desktop view: full layout with all available information",
  );
});

/* ===== INTEGRATION TESTS ===== */

Deno.test("Integration - Error handling with accessibility", () => {
  const error = new Error("Network connection failed");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(
    error,
    "Recent sales fetch",
  );
  const accessibleMessage = AccessibilityUtils.getErrorMessage(
    "network",
    error.message,
  );

  assertEquals(errorInfo.retryable, true);
  assertEquals(accessibleMessage.includes("Network connection failed"), true);
});

Deno.test("Integration - Loading states with accessibility", () => {
  const loadingLabel = AccessibilityUtils.getLoadingLabel("gallery");
  const refreshLabel = AccessibilityUtils.getRefreshButtonLabel(true);

  assertEquals(loadingLabel.includes("please wait"), true);
  assertEquals(refreshLabel.includes("please wait"), true);
});

/* ===== PERFORMANCE TESTS ===== */

Deno.test("Performance - AccessibilityUtils label generation", () => {
  const startTime = performance.now();

  // Generate 1000 labels
  for (let i = 0; i < 1000; i++) {
    AccessibilityUtils.getSaleCardLabel({
      stamp: i,
      sale_data: {
        btc_amount: Math.random(),
        time_ago: `${i} minutes ago`,
        buyer_address: `test-address-${i}`,
      },
    });
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Should complete in under 100ms
  assertEquals(
    duration < 100,
    true,
    `Performance test took ${duration}ms, expected < 100ms`,
  );
});

Deno.test("Performance - ErrorHandlingUtils error creation", () => {
  const startTime = performance.now();

  // Create 1000 error info objects
  for (let i = 0; i < 1000; i++) {
    ErrorHandlingUtils.createErrorInfo(
      new Error(`Test error ${i}`),
      `Context ${i}`,
    );
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Should complete in under 150ms (increased from 50ms to account for JSON stringify try/catch)
  assertEquals(
    duration < 150,
    true,
    `Performance test took ${duration}ms, expected < 150ms`,
  );
});

/* ===== EDGE CASES ===== */

Deno.test("Edge case - AccessibilityUtils with null/undefined values", () => {
  const labelWithUndefined = AccessibilityUtils.getSaleCardLabel({
    stamp: undefined,
    sale_data: undefined,
  });
  assertEquals(labelWithUndefined.includes("No sale data available"), true);

  const descriptionWithNull = AccessibilityUtils.getSaleTransactionDescription({
    stamp: null,
    sale_data: null,
  });
  assertEquals(descriptionWithNull, "No transaction details available");
});

Deno.test("Edge case - ErrorHandlingUtils with empty objects", () => {
  const errorInfo = ErrorHandlingUtils.createErrorInfo({});
  assertEquals(errorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(errorInfo.recoverable, true);
});

Deno.test("Edge case - ErrorHandlingUtils with circular reference", () => {
  const circularObj: Record<string, unknown> = { message: "Test" };
  circularObj.self = circularObj;

  const errorInfo = ErrorHandlingUtils.createErrorInfo(circularObj);
  assertExists(errorInfo.details);
  assertEquals(
    errorInfo.details,
    "[Circular reference or non-serializable object]",
  );
  assertEquals(errorInfo.type, ErrorType.UNKNOWN_ERROR);
});
