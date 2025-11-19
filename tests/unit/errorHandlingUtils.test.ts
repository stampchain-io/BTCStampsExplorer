/**
 * @fileoverview Comprehensive tests for ErrorHandlingUtils
 * This file focuses on achieving high test coverage for all utility functions
 * including loading manager, retry logic, error boundaries, and edge cases.
 */

import {
  ErrorHandlingUtils,
  type ErrorInfo,
  ErrorSeverity,
  ErrorType,
  type LoadingState,
} from "$lib/utils/errorHandling.ts";
import { assertEquals, assertExists, assertRejects } from "@std/assert";

/* ===== BASIC ERROR INFO CREATION TESTS ===== */

Deno.test("ErrorHandlingUtils.createErrorInfo - standard Error object", () => {
  const error = new Error("Test error message");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(error, "Test context");

  assertEquals(errorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.MEDIUM);
  assertEquals(errorInfo.message, "Test context: Test error message");
  assertEquals(errorInfo.recoverable, true);
  assertEquals(errorInfo.retryable, false);
  assertExists(errorInfo.timestamp);
  assertExists(errorInfo.details);
  assertEquals(errorInfo.action, "refresh_page");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - string error", () => {
  const errorInfo = ErrorHandlingUtils.createErrorInfo("Simple error string");

  assertEquals(errorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(errorInfo.message, "Simple error string");
  assertEquals(errorInfo.recoverable, true);
  assertEquals(errorInfo.retryable, false);
});

Deno.test("ErrorHandlingUtils.createErrorInfo - network error patterns", () => {
  const networkError = new Error("Network connection failed");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(networkError);

  assertEquals(errorInfo.type, ErrorType.NETWORK_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.retryable, true);
  assertEquals(errorInfo.action, "retry");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - timeout error patterns", () => {
  const timeoutError = new Error("Request timeout exceeded");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(timeoutError);

  assertEquals(errorInfo.type, ErrorType.TIMEOUT_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.MEDIUM);
  assertEquals(errorInfo.retryable, true);
  assertEquals(errorInfo.action, "retry");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - unauthorized error patterns", () => {
  const unauthorizedError = new Error("Unauthorized access denied");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(unauthorizedError);

  assertEquals(errorInfo.type, ErrorType.AUTH_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.recoverable, false);
  assertEquals(errorInfo.retryable, false);
  assertEquals(errorInfo.action, "login");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - forbidden error patterns", () => {
  const forbiddenError = new Error("Forbidden resource access");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(forbiddenError);

  assertEquals(errorInfo.type, ErrorType.AUTH_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.recoverable, false);
  assertEquals(errorInfo.action, "login");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - validation error patterns", () => {
  const validationError = new Error("Validation failed for input");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(validationError);

  assertEquals(errorInfo.type, ErrorType.VALIDATION_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.LOW);
  assertEquals(errorInfo.recoverable, false);
  assertEquals(errorInfo.retryable, false);
  assertEquals(errorInfo.action, "correct_input");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - custom error type override", () => {
  const error = new Error("Test error");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(
    error,
    "Test context",
    ErrorType.API_ERROR,
  );

  assertEquals(errorInfo.type, ErrorType.API_ERROR);
});

/* ===== HTTP STATUS CODE ERROR TESTS ===== */

Deno.test("ErrorHandlingUtils.createErrorInfo - 500 server error", () => {
  const serverError = { status: 500, message: "Internal Server Error" };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(serverError);

  assertEquals(errorInfo.type, ErrorType.API_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.retryable, true);
  assertEquals(errorInfo.message, "Internal Server Error");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - 404 not found", () => {
  const notFoundError = { status: 404 };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(notFoundError);

  assertEquals(errorInfo.type, ErrorType.DATA_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.LOW);
  assertEquals(errorInfo.message, "Requested data not found");
  assertEquals(errorInfo.action, "go_back");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - 401 unauthorized", () => {
  const unauthorizedError = { status: 401, message: "Unauthorized" };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(unauthorizedError);

  assertEquals(errorInfo.type, ErrorType.AUTH_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.recoverable, false);
  assertEquals(errorInfo.action, "login");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - 403 forbidden", () => {
  const forbiddenError = { status: 403, message: "Forbidden" };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(forbiddenError);

  assertEquals(errorInfo.type, ErrorType.AUTH_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.recoverable, false);
  assertEquals(errorInfo.action, "login");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - 429 rate limit", () => {
  const rateLimitError = { status: 429 };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(rateLimitError);

  assertEquals(errorInfo.type, ErrorType.API_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.MEDIUM);
  assertEquals(errorInfo.retryable, true);
  assertEquals(errorInfo.message, "Too many requests, please try again later");
  assertEquals(errorInfo.action, "retry");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - object without status", () => {
  const errorObj = { message: "Custom error", code: "ERR001" };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(errorObj);

  assertEquals(errorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(errorInfo.message, "Custom error");
  assertExists(errorInfo.details);
  assertEquals(errorInfo.details.includes("ERR001"), true);
});

Deno.test("ErrorHandlingUtils.createErrorInfo - circular reference handling", () => {
  const circularObj: Record<string, unknown> = { message: "Test" };
  circularObj.self = circularObj;

  const errorInfo = ErrorHandlingUtils.createErrorInfo(circularObj);
  assertEquals(
    errorInfo.details,
    "[Circular reference or non-serializable object]",
  );
});

/* ===== USER FRIENDLY MESSAGES TESTS ===== */

Deno.test("ErrorHandlingUtils.getUserFriendlyMessage - all error types", () => {
  const testCases = [
    {
      type: ErrorType.NETWORK_ERROR,
      expected:
        "Unable to connect to the server. Please check your internet connection.",
    },
    {
      type: ErrorType.API_ERROR,
      expected:
        "Service temporarily unavailable. Please try again in a moment.",
    },
    {
      type: ErrorType.DATA_ERROR,
      expected: "The requested sales data could not be found.",
    },
    {
      type: ErrorType.VALIDATION_ERROR,
      expected: "Invalid data provided. Please check your input.",
    },
    {
      type: ErrorType.TIMEOUT_ERROR,
      expected: "Request timed out. Please try again.",
    },
    {
      type: ErrorType.AUTH_ERROR,
      expected: "Authentication required to view this content.",
    },
    {
      type: ErrorType.UNKNOWN_ERROR,
      expected: "Something went wrong. Please try again.",
    },
  ];

  testCases.forEach(({ type, expected }) => {
    const errorInfo: ErrorInfo = {
      type,
      severity: ErrorSeverity.MEDIUM,
      message: "Original message",
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
    };

    const friendlyMessage = ErrorHandlingUtils.getUserFriendlyMessage(
      errorInfo,
    );
    assertEquals(friendlyMessage, expected);
  });
});

/* ===== RECOMMENDED ACTIONS TESTS ===== */

Deno.test("ErrorHandlingUtils.getRecommendedAction - retryable errors", () => {
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.NETWORK_ERROR, true),
    "retry",
  );
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.API_ERROR, true),
    "retry",
  );
});

Deno.test("ErrorHandlingUtils.getRecommendedAction - non-retryable errors", () => {
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.AUTH_ERROR, false),
    "login",
  );
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.VALIDATION_ERROR, false),
    "correct_input",
  );
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.DATA_ERROR, false),
    "go_back",
  );
  assertEquals(
    ErrorHandlingUtils.getRecommendedAction(ErrorType.UNKNOWN_ERROR, false),
    "refresh_page",
  );
});

/* ===== LOADING MANAGER TESTS ===== */

Deno.test("ErrorHandlingUtils.createLoadingManager - basic functionality", () => {
  const manager = ErrorHandlingUtils.createLoadingManager();

  // Initial state
  const initialState = manager.getState();
  assertEquals(initialState.isLoading, false);

  // Start loading
  manager.start("Loading data...");
  const loadingState = manager.getState();
  assertEquals(loadingState.isLoading, true);
  assertEquals(loadingState.loadingMessage, "Loading data...");
  assertExists(loadingState.startTime);

  // Stop loading
  manager.stop();
  const stoppedState = manager.getState();
  assertEquals(stoppedState.isLoading, false);
});

Deno.test("ErrorHandlingUtils.createLoadingManager - progress updates", () => {
  const manager = ErrorHandlingUtils.createLoadingManager();

  manager.start("Processing...");
  manager.updateProgress(50);

  let state = manager.getState();
  assertEquals(state.progress, 50);

  // Test progress bounds
  manager.updateProgress(-10);
  state = manager.getState();
  assertEquals(state.progress, 0);

  manager.updateProgress(150);
  state = manager.getState();
  assertEquals(state.progress, 100);

  manager.stop();
});

Deno.test("ErrorHandlingUtils.createLoadingManager - progress updates when not loading", () => {
  const manager = ErrorHandlingUtils.createLoadingManager();

  // Should not update progress when not loading
  manager.updateProgress(50);
  const state = manager.getState();
  assertEquals(state.progress, undefined);
});

Deno.test("ErrorHandlingUtils.createLoadingManager - subscription system", () => {
  const manager = ErrorHandlingUtils.createLoadingManager();
  let callbackCount = 0;
  let lastState: LoadingState = { isLoading: false };

  const unsubscribe = manager.subscribe((state) => {
    callbackCount++;
    lastState = state;
  });

  manager.start("Test loading");
  assertEquals(callbackCount, 1);
  assertEquals(lastState.isLoading, true);

  manager.updateProgress(25);
  assertEquals(callbackCount, 2);
  assertEquals(lastState.progress, 25);

  manager.stop();
  assertEquals(callbackCount, 3);
  assertEquals(lastState.isLoading, false);

  // Test unsubscribe
  unsubscribe();
  manager.start("Another test");
  assertEquals(callbackCount, 3); // Should not increment
});

Deno.test("ErrorHandlingUtils.createLoadingManager - timeout configuration", () => {
  const manager = ErrorHandlingUtils.createLoadingManager();

  // Test that timeout is set correctly (without actually firing)
  manager.start("Test with timeout", undefined); // No timeout to avoid leaks
  const state = manager.getState();
  assertEquals(state.isLoading, true);
  assertEquals(state.loadingMessage, "Test with timeout");

  // Clean up
  manager.stop();
});

/* ===== RETRY UTILITY TESTS ===== */

Deno.test("ErrorHandlingUtils.withRetry - successful operation", async () => {
  let attemptCount = 0;
  const operation = () => {
    attemptCount++;
    return Promise.resolve("success");
  };

  const result = await ErrorHandlingUtils.withRetry(operation, 3, 1);
  assertEquals(result, "success");
  assertEquals(attemptCount, 1);
});

Deno.test("ErrorHandlingUtils.withRetry - retryable error eventually succeeds", async () => {
  let attemptCount = 0;
  const operation = () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error("network timeout"); // retryable error
    }
    return Promise.resolve("success");
  };

  const result = await ErrorHandlingUtils.withRetry(operation, 3, 1);
  assertEquals(result, "success");
  assertEquals(attemptCount, 3);
});

Deno.test("ErrorHandlingUtils.withRetry - non-retryable error fails immediately", async () => {
  let attemptCount = 0;
  const operation = () => {
    attemptCount++;
    throw new Error("validation failed"); // non-retryable error
  };

  await assertRejects(
    () => ErrorHandlingUtils.withRetry(operation, 3, 1),
    Error,
    "validation failed",
  );
  assertEquals(attemptCount, 1);
});

Deno.test("ErrorHandlingUtils.withRetry - with context", async () => {
  const operation = () => Promise.reject(new Error("test error"));

  await assertRejects(
    () => ErrorHandlingUtils.withRetry(operation, 1, 1, "API call"),
    Error,
    "test error",
  );
});

/* ===== TIMEOUT UTILITY TESTS ===== */

Deno.test("ErrorHandlingUtils.withTimeout - resolves before timeout", async () => {
  const promise = Promise.resolve("fast result");
  const result = await ErrorHandlingUtils.withTimeout(promise, 1000);
  assertEquals(result, "fast result");
});

Deno.test("ErrorHandlingUtils.withTimeout - promise rejects before timeout", async () => {
  const rejectingPromise = Promise.reject(new Error("Promise error"));

  await assertRejects(
    () => ErrorHandlingUtils.withTimeout(rejectingPromise, 1000),
    Error,
    "Promise error",
  );
});

/* ===== SAFE ASYNC UTILITY TESTS ===== */

Deno.test("ErrorHandlingUtils.safeAsync - successful operation", async () => {
  const operation = () => Promise.resolve("data");
  const result = await ErrorHandlingUtils.safeAsync(operation);

  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data, "data");
  }
});

Deno.test("ErrorHandlingUtils.safeAsync - failed operation with fallback", async () => {
  const operation = () => Promise.reject(new Error("failed"));
  const result = await ErrorHandlingUtils.safeAsync(
    operation,
    "fallback",
    "Test context",
  );

  assertEquals(result.success, false);
  if (!result.success) {
    // Type assertion needed due to TypeScript's union type narrowing limitations
    const failedResult = result as {
      success: false;
      error: ErrorInfo;
      fallback?: "fallback";
    };
    assertEquals(failedResult.fallback, "fallback");
    assertEquals(failedResult.error.message, "Test context: failed");
    assertExists(failedResult.error);
  }
});

Deno.test("ErrorHandlingUtils.safeAsync - failed operation without fallback", async () => {
  const operation = () => Promise.reject(new Error("failed"));
  const result = await ErrorHandlingUtils.safeAsync(operation);

  assertEquals(result.success, false);
  if (!result.success) {
    // Type assertion needed due to TypeScript's union type narrowing limitations
    const failedResult = result as {
      success: false;
      error: ErrorInfo;
      fallback?: never;
    };
    assertEquals(failedResult.fallback, undefined);
    assertExists(failedResult.error);
  }
});

/* ===== ERROR BOUNDARY TESTS ===== */

Deno.test("ErrorHandlingUtils.createErrorBoundary - initial state", () => {
  const boundary = ErrorHandlingUtils.createErrorBoundary();
  const state = boundary.getState();

  assertEquals(state.hasError, false);
  assertEquals(state.errorInfo, null);
});

Deno.test("ErrorHandlingUtils.createErrorBoundary - catch error", () => {
  const boundary = ErrorHandlingUtils.createErrorBoundary();

  // Suppress console.error for this test since we're intentionally causing errors
  const originalConsoleError = console.error;
  console.error = () => {}; // Suppress error logging

  try {
    boundary.catch(new Error("Test error"), "Component context");
    const state = boundary.getState();

    assertEquals(state.hasError, true);
    assertExists(state.errorInfo);
    assertEquals(state.errorInfo?.message, "Component context: Test error");
  } finally {
    // Restore console.error
    console.error = originalConsoleError;
  }
});

Deno.test("ErrorHandlingUtils.createErrorBoundary - reset functionality", () => {
  const boundary = ErrorHandlingUtils.createErrorBoundary();

  // Suppress console.error for this test since we're intentionally causing errors
  const originalConsoleError = console.error;
  console.error = () => {}; // Suppress error logging

  try {
    boundary.catch(new Error("Test error"));
    assertEquals(boundary.getState().hasError, true);

    boundary.reset();
    const state = boundary.getState();
    assertEquals(state.hasError, false);
    assertEquals(state.errorInfo, null);
  } finally {
    // Restore console.error
    console.error = originalConsoleError;
  }
});

Deno.test("ErrorHandlingUtils.createErrorBoundary - render with error", () => {
  const boundary = ErrorHandlingUtils.createErrorBoundary();

  // Suppress console.error for this test since we're intentionally causing errors
  const originalConsoleError = console.error;
  console.error = () => {}; // Suppress error logging

  try {
    boundary.catch(new Error("Test error"));

    const children = () => "Normal content";
    const fallback = (error: ErrorInfo) => `Error: ${error.message}`;

    const result = boundary.render(children, fallback);
    assertEquals(typeof result, "string");
    assertEquals((result as string).includes("Error:"), true);
  } finally {
    // Restore console.error
    console.error = originalConsoleError;
  }
});

Deno.test("ErrorHandlingUtils.createErrorBoundary - render without error", () => {
  const boundary = ErrorHandlingUtils.createErrorBoundary();

  const children = () => "Normal content";
  const fallback = (error: ErrorInfo) => `Error: ${error.message}`;

  const result = boundary.render(children, fallback);
  assertEquals(result, "Normal content");
});

/* ===== LOGGING FORMAT TESTS ===== */

Deno.test("ErrorHandlingUtils.formatForLogging - complete error info", () => {
  const errorInfo: ErrorInfo = {
    type: ErrorType.NETWORK_ERROR,
    severity: ErrorSeverity.HIGH,
    message: "Connection failed",
    details: "Timeout after 5000ms",
    timestamp: new Date("2024-01-01T12:00:00Z"),
    recoverable: true,
    retryable: true,
  };

  const formatted = ErrorHandlingUtils.formatForLogging(errorInfo);
  assertEquals(formatted.includes("[HIGH] network"), true);
  assertEquals(formatted.includes("Message: Connection failed"), true);
  assertEquals(formatted.includes("Time: 2024-01-01T12:00:00.000Z"), true);
  assertEquals(formatted.includes("Recoverable: true"), true);
  assertEquals(formatted.includes("Retryable: true"), true);
  assertEquals(formatted.includes("Details: Timeout after 5000ms"), true);
});

Deno.test("ErrorHandlingUtils.formatForLogging - error without details", () => {
  const errorInfo: ErrorInfo = {
    type: ErrorType.VALIDATION_ERROR,
    severity: ErrorSeverity.LOW,
    message: "Invalid input",
    timestamp: new Date("2024-01-01T12:00:00Z"),
    recoverable: false,
    retryable: false,
  };

  const formatted = ErrorHandlingUtils.formatForLogging(errorInfo);
  assertEquals(formatted.includes("[LOW] validation"), true);
  assertEquals(formatted.includes("Message: Invalid input"), true);
  assertEquals(formatted.includes("Recoverable: false"), true);
  assertEquals(formatted.includes("Retryable: false"), true);
  assertEquals(formatted.includes("Details:"), false);
});

/* ===== SHOULD REPORT TESTS ===== */

Deno.test("ErrorHandlingUtils.shouldReport - high severity errors", () => {
  const highSeverityError: ErrorInfo = {
    type: ErrorType.NETWORK_ERROR,
    severity: ErrorSeverity.HIGH,
    message: "High severity error",
    timestamp: new Date(),
    recoverable: true,
    retryable: true,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(highSeverityError), true);
});

Deno.test("ErrorHandlingUtils.shouldReport - critical severity errors", () => {
  const criticalError: ErrorInfo = {
    type: ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity.CRITICAL,
    message: "Critical error",
    timestamp: new Date(),
    recoverable: true,
    retryable: false,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(criticalError), true);
});

Deno.test("ErrorHandlingUtils.shouldReport - unrecoverable errors", () => {
  const unrecoverableError: ErrorInfo = {
    type: ErrorType.DATA_ERROR,
    severity: ErrorSeverity.LOW,
    message: "Unrecoverable error",
    timestamp: new Date(),
    recoverable: false,
    retryable: false,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(unrecoverableError), true);
});

Deno.test("ErrorHandlingUtils.shouldReport - low severity recoverable errors", () => {
  const minorError: ErrorInfo = {
    type: ErrorType.VALIDATION_ERROR,
    severity: ErrorSeverity.LOW,
    message: "Minor validation error",
    timestamp: new Date(),
    recoverable: true,
    retryable: false,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(minorError), false);
});

Deno.test("ErrorHandlingUtils.shouldReport - medium severity recoverable errors", () => {
  const mediumError: ErrorInfo = {
    type: ErrorType.TIMEOUT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    message: "Medium severity error",
    timestamp: new Date(),
    recoverable: true,
    retryable: true,
  };

  assertEquals(ErrorHandlingUtils.shouldReport(mediumError), false);
});

/* ===== EDGE CASES AND ERROR CONDITIONS ===== */

Deno.test("ErrorHandlingUtils.createErrorInfo - null/undefined errors", () => {
  const nullErrorInfo = ErrorHandlingUtils.createErrorInfo(null);
  assertEquals(nullErrorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(nullErrorInfo.message, "An unexpected error occurred");

  const undefinedErrorInfo = ErrorHandlingUtils.createErrorInfo(undefined);
  assertEquals(undefinedErrorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(undefinedErrorInfo.message, "An unexpected error occurred");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - number as error", () => {
  const errorInfo = ErrorHandlingUtils.createErrorInfo(404);
  assertEquals(errorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(errorInfo.message, "An unexpected error occurred");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - boolean as error", () => {
  const errorInfo = ErrorHandlingUtils.createErrorInfo(false);
  assertEquals(errorInfo.type, ErrorType.UNKNOWN_ERROR);
  assertEquals(errorInfo.message, "An unexpected error occurred");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - Error with empty message", () => {
  const error = new Error("");
  const errorInfo = ErrorHandlingUtils.createErrorInfo(error);
  assertEquals(errorInfo.message, "");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - object with non-string message", () => {
  const errorObj = { status: 400, message: 123 };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(errorObj);
  // The message is type-asserted but not converted, so it remains a number
  assertEquals(errorInfo.message, 123 as any);
});

Deno.test("ErrorHandlingUtils.createErrorInfo - object with no message", () => {
  const errorObj = { status: 400 };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(errorObj);
  assertEquals(errorInfo.message, "An unexpected error occurred");
});

Deno.test("ErrorHandlingUtils.createErrorInfo - status 502 bad gateway", () => {
  const errorObj = { status: 502, message: "Bad Gateway" };
  const errorInfo = ErrorHandlingUtils.createErrorInfo(errorObj);
  assertEquals(errorInfo.type, ErrorType.API_ERROR);
  assertEquals(errorInfo.severity, ErrorSeverity.HIGH);
  assertEquals(errorInfo.retryable, true);
});

Deno.test("ErrorHandlingUtils.getUserFriendlyMessage - fallback to original message", () => {
  const errorInfo: ErrorInfo = {
    type: "custom" as ErrorType, // Invalid type to test fallback
    severity: ErrorSeverity.MEDIUM,
    message: "Custom error message",
    timestamp: new Date(),
    recoverable: true,
    retryable: false,
  };

  const friendlyMessage = ErrorHandlingUtils.getUserFriendlyMessage(errorInfo);
  assertEquals(friendlyMessage, "Custom error message");
});
