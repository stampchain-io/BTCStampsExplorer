/**
 * Type-Safe Error Handling Utilities for TS18046 Resolution
 *
 * Provides utilities to safely convert unknown errors to typed Error instances,
 * extract error messages, and handle error logging in a type-safe manner.
 */

import {
  APIError,
  BaseError,
  getUserFriendlyMessage as getBaseUserFriendlyMessage,
  NetworkError,
  ValidationError,
} from "$types/errors.ts";

import {
  hasMessage,
  hasName,
  hasProperty,
  hasStack,
  hasStatusCode,
  isApplicationError,
  isError,
  isErrorLike,
  isFetchError,
  isNetworkErrorByMessage,
  isObject,
  isRecognizableError,
  isStandardError,
  isString,
  isTimeoutError,
  isValidationErrorByMessage,
} from "./errorTypeGuards.ts";

// ===== CORE ERROR CONVERSION UTILITIES =====

/**
 * Safely convert unknown error to Error instance
 * This is the primary utility for resolving TS18046 errors
 */
export function handleUnknownError(error: unknown, context?: string): Error {
  // If it's already a standard Error, return it
  if (isStandardError(error)) {
    return context ? new Error(`${context}: ${error.message}`) : error;
  }

  // If it's an ApplicationError (BaseError subclass), convert to standard Error
  if (isApplicationError(error)) {
    const message = context ? `${context}: ${error.message}` : error.message;
    const standardError = new Error(message);
    standardError.name = error.name;
    if (error.stack) {
      standardError.stack = error.stack;
    }
    return standardError;
  }

  // If it has error-like properties, create Error from them
  if (isErrorLike(error)) {
    const message = context ? `${context}: ${error.message}` : error.message;
    const standardError = new Error(message);
    if (error.name) standardError.name = error.name;
    if (error.stack) standardError.stack = error.stack;
    return standardError;
  }

  // If it's a fetch Response error
  if (isFetchError(error)) {
    const message = context
      ? `${context}: HTTP ${error.status} ${error.statusText}`
      : `HTTP ${error.status} ${error.statusText}`;
    const standardError = new Error(message);
    standardError.name = "FetchError";
    return standardError;
  }

  // If it's a string, convert to Error
  if (isString(error)) {
    const message = context ? `${context}: ${error}` : error;
    return new Error(message);
  }

  // If it's an object with some properties, try to extract meaningful info
  if (isObject(error)) {
    let message = "Unknown error occurred";

    // Try to extract message from common error object structures
    if (hasMessage(error)) {
      message = error.message;
    } else if (hasProperty(error, "error") && isString(error.error)) {
      message = error.error;
    } else if (hasProperty(error, "msg") && isString(error.msg)) {
      message = error.msg;
    } else if (hasProperty(error, "reason") && isString(error.reason)) {
      message = error.reason;
    } else {
      // Fallback to JSON string representation
      try {
        message = JSON.stringify(error);
      } catch {
        message = "[Object object - not serializable]";
      }
    }

    const finalMessage = context ? `${context}: ${message}` : message;
    const standardError = new Error(finalMessage);

    // Try to preserve additional properties
    if (hasName(error)) standardError.name = error.name;
    if (hasStack(error)) standardError.stack = error.stack;

    return standardError;
  }

  // Fallback for primitives or null/undefined
  const fallbackMessage = context
    ? `${context}: Unknown error of type ${typeof error}`
    : `Unknown error of type ${typeof error}`;

  return new Error(fallbackMessage);
}

/**
 * Safely extract error message from unknown error
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "Unknown error occurred",
): string {
  if (isStandardError(error)) {
    return error.message;
  }

  if (isApplicationError(error)) {
    return error.message;
  }

  if (isErrorLike(error)) {
    return error.message;
  }

  if (isFetchError(error)) {
    return `HTTP ${error.status} ${error.statusText}`;
  }

  if (isString(error)) {
    return error;
  }

  if (isObject(error)) {
    if (hasMessage(error)) return error.message;
    if (hasProperty(error, "error") && isString(error.error)) {
      return error.error;
    }
    if (hasProperty(error, "msg") && isString(error.msg)) return error.msg;
    if (hasProperty(error, "reason") && isString(error.reason)) {
      return error.reason;
    }

    // Try to create a meaningful representation
    try {
      return JSON.stringify(error);
    } catch {
      return "[Complex object]";
    }
  }

  return fallback;
}

/**
 * Type-safe error logging utility
 */
export function logError(
  error: unknown,
  context?: string,
  level: "error" | "warn" | "info" = "error",
): void {
  const standardError = handleUnknownError(error, context);
  const message = extractErrorMessage(error, "Unknown error");

  const logData = {
    message,
    name: standardError.name,
    stack: standardError.stack,
    context,
    timestamp: new Date().toISOString(),
    originalType: typeof error,
    isRecognizable: isRecognizableError(error),
  };

  switch (level) {
    case "error":
      console.error("Error:", logData);
      break;
    case "warn":
      console.warn("Warning:", logData);
      break;
    case "info":
      console.info("Info:", logData);
      break;
  }
}

// ===== ERROR CLASSIFICATION UTILITIES =====

/**
 * Classify unknown error and return appropriate ApplicationError type
 */
export function classifyAndConvertError(
  error: unknown,
  context?: string,
): BaseError {
  // If already an ApplicationError, return it (possibly with updated context)
  if (isApplicationError(error)) {
    if (context && !error.message.includes(context)) {
      // Create new instance with updated message
      return new BaseError(
        `${context}: ${error.message}`,
        error.code,
        error.statusCode,
        error.details,
      );
    }
    return error;
  }

  // Convert standard Error to appropriate ApplicationError subtype
  if (isError(error)) {
    const message = context ? `${context}: ${error.message}` : error.message;

    // Check for validation patterns
    if (isValidationErrorByMessage(error)) {
      return new ValidationError(message);
    }

    // Check for network patterns
    if (isNetworkErrorByMessage(error) || isTimeoutError(error)) {
      return new NetworkError(message);
    }

    // Default to BaseError
    return new BaseError(message, "UNKNOWN_ERROR", 500);
  }

  // Handle fetch Response errors
  if (isFetchError(error)) {
    return new APIError(
      context ? `${context}: HTTP Error` : "HTTP Error",
      error.status,
    );
  }

  // Handle objects with status codes
  if (hasStatusCode(error)) {
    const status = "status" in error ? error.status : (error as any).statusCode;
    const message = hasMessage(error) ? error.message : "API Error";
    return new APIError(
      context ? `${context}: ${message}` : message,
      status,
    );
  }

  // Fallback: convert to BaseError
  const message = extractErrorMessage(error, "Unknown error occurred");
  return new BaseError(
    context ? `${context}: ${message}` : message,
    "UNKNOWN_ERROR",
    500,
    { originalError: error },
  );
}

/**
 * Get user-friendly message from unknown error
 */
export function getUserFriendlyMessage(error: unknown): string {
  // If it's already an ApplicationError, use existing utility
  if (isApplicationError(error)) {
    return getBaseUserFriendlyMessage(error);
  }

  // Convert to ApplicationError and get friendly message
  const appError = classifyAndConvertError(error);
  return getBaseUserFriendlyMessage(appError);
}

// ===== SAFE PROPERTY ACCESS UTILITIES =====

// hasProperty is now imported from errorTypeGuards.ts

/**
 * Safely get property value with fallback
 */
export function safeGetProperty<T>(
  obj: unknown,
  prop: string,
  fallback: T,
): T {
  if (hasProperty(obj, prop)) {
    const value = obj[prop];
    return value as T ?? fallback;
  }
  return fallback;
}

/**
 * Safely get nested property value with fallback
 */
export function safeGetNestedProperty<T>(
  obj: unknown,
  path: string[],
  fallback: T,
): T {
  let current = obj;

  for (const prop of path) {
    if (!hasProperty(current, prop)) {
      return fallback;
    }
    current = current[prop];
  }

  return (current as T) ?? fallback;
}

/**
 * Safely access property with type validation
 */
export function safeGetTypedProperty<T>(
  obj: unknown,
  prop: string,
  typeGuard: (value: unknown) => value is T,
  fallback: T,
): T {
  if (hasProperty(obj, prop)) {
    const value = obj[prop];
    if (typeGuard(value)) {
      return value;
    }
  }
  return fallback;
}

// ===== ASYNC ERROR HANDLING UTILITIES =====

/**
 * Safely execute async operation with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: string,
): Promise<{ success: true; data: T } | { success: false; error: Error }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (unknownError) {
    const error = handleUnknownError(unknownError, context);
    return { success: false, error };
  }
}

/**
 * Retry operation with exponential backoff and type-safe error handling
 */
export async function retryWithSafeErrorHandling<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  context?: string,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (unknownError) {
      lastError = handleUnknownError(unknownError, context);

      // Don't retry on final attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// ===== STANDARDIZED CATCH BLOCK PATTERNS =====

/**
 * Standard catch block handler for async operations
 * Usage: .catch(createCatchHandler("API call"))
 */
export function createCatchHandler(context?: string) {
  return (unknownError: unknown): never => {
    const error = handleUnknownError(unknownError, context);
    throw error;
  };
}

/**
 * Standard catch block handler that returns default value instead of throwing
 */
export function createSafeCatchHandler<T>(defaultValue: T, context?: string) {
  return (unknownError: unknown): T => {
    logError(unknownError, context, "warn");
    return defaultValue;
  };
}

/**
 * Create a catch handler that logs and re-throws as ApplicationError
 */
export function createLoggingCatchHandler(context?: string) {
  return (unknownError: unknown): never => {
    logError(unknownError, context);
    const appError = classifyAndConvertError(unknownError, context);
    throw appError;
  };
}

// ===== ERROR BOUNDARY UTILITIES =====

/**
 * Safe error handler for React error boundaries
 */
export function handleReactError(
  error: unknown,
  errorInfo: unknown,
  componentName?: string,
): Error {
  const context = componentName
    ? `React component ${componentName}`
    : "React component";
  const standardError = handleUnknownError(error, context);

  // Add React-specific error info if available
  if (isObject(errorInfo) && hasProperty(errorInfo, "componentStack")) {
    const componentStack = safeGetProperty(errorInfo, "componentStack", "");
    if (isString(componentStack)) {
      standardError.stack =
        `${standardError.stack}\n\nComponent Stack:${componentStack}`;
    }
  }

  return standardError;
}

/**
 * Create error boundary error handler
 */
export function createErrorBoundaryHandler(componentName?: string) {
  return (error: unknown, errorInfo: unknown) => {
    const standardError = handleReactError(error, errorInfo, componentName);
    logError(
      standardError,
      `Error boundary in ${componentName || "Unknown component"}`,
    );
    return standardError;
  };
}

// ===== ERROR HANDLING UTILITIES CLASS =====
// Imported from monitoring/errors/errorHandlingUtils.ts

import { ErrorSeverity, ErrorType } from "$lib/constants/errorConstants.ts";
import type { LoadingState } from "$types/ui.d.ts";

// Re-export enums for convenience
export { ErrorSeverity, ErrorType };

/* ===== ERROR HANDLING UTILITIES FOR RECENT SALES ===== */

export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  name: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
  action?: string;
}

export class ErrorHandlingUtils {
  /**
   * Create standardized error info from various error sources
   */
  static createErrorInfo(
    error: unknown,
    context?: string,
    customType?: ErrorType,
  ): ErrorInfo {
    let type = customType || ErrorType.UNKNOWN_ERROR;
    let message = "An unexpected error occurred";
    let details = "";
    let severity = ErrorSeverity.MEDIUM;
    let recoverable = true;
    let retryable = false;

    if (error instanceof Error) {
      message = error.message;
      details = error.stack || "";

      // Classify error based on message patterns
      if (error.message.toLowerCase().includes("network")) {
        type = ErrorType.NETWORK_ERROR;
        retryable = true;
        severity = ErrorSeverity.HIGH;
      } else if (error.message.toLowerCase().includes("timeout")) {
        type = ErrorType.TIMEOUT_ERROR;
        retryable = true;
        severity = ErrorSeverity.MEDIUM;
      } else if (
        error.message.toLowerCase().includes("unauthorized") ||
        error.message.toLowerCase().includes("forbidden")
      ) {
        type = ErrorType.AUTH_ERROR;
        recoverable = false;
        severity = ErrorSeverity.HIGH;
      } else if (error.message.toLowerCase().includes("validation")) {
        type = ErrorType.VALIDATION_ERROR;
        recoverable = false;
        severity = ErrorSeverity.LOW;
      }
    } else if (typeof error === "string") {
      message = error;
    } else if (error && typeof error === "object") {
      // Handle fetch response errors
      const errorObj = error as Record<string, unknown>;
      if (errorObj.status) {
        const status = Number(errorObj.status);
        if (status >= 500) {
          type = ErrorType.API_ERROR;
          severity = ErrorSeverity.HIGH;
          retryable = true;
        } else if (status === 404) {
          type = ErrorType.DATA_ERROR;
          message = "Requested data not found";
          severity = ErrorSeverity.LOW;
        } else if (status === 401 || status === 403) {
          type = ErrorType.AUTH_ERROR;
          recoverable = false;
          severity = ErrorSeverity.HIGH;
        } else if (status === 429) {
          type = ErrorType.API_ERROR;
          message = "Too many requests, please try again later";
          retryable = true;
          severity = ErrorSeverity.MEDIUM;
        }
      }

      message = errorObj.message as string || message;
      try {
        details = JSON.stringify(errorObj);
        // deno-lint-ignore no-unused-vars
      } catch (unknownJsonError) {
        // Handle circular references or other JSON.stringify errors
        handleUnknownError(unknownJsonError, "JSON stringify failed");
        details = "[Circular reference or non-serializable object]";
      }
    }

    // Add context to message
    if (context) {
      message = `${context}: ${message}`;
    }

    return {
      type,
      severity,
      message,
      name: error instanceof Error ? error.name : String(type),
      details,
      timestamp: new Date(),
      recoverable,
      retryable,
      action: ErrorHandlingUtils.getRecommendedAction(type, retryable),
    };
  }

  /**
   * Get user-friendly error messages for different error types
   */
  static getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    const baseMessages = {
      [ErrorType.NETWORK_ERROR]:
        "Unable to connect to the server. Please check your internet connection.",
      [ErrorType.API_ERROR]:
        "Service temporarily unavailable. Please try again in a moment.",
      [ErrorType.DATA_ERROR]: "The requested sales data could not be found.",
      [ErrorType.VALIDATION_ERROR]:
        "Invalid data provided. Please check your input.",
      [ErrorType.TIMEOUT_ERROR]: "Request timed out. Please try again.",
      [ErrorType.AUTH_ERROR]: "Authentication required to view this content.",
      [ErrorType.UNKNOWN_ERROR]: "Something went wrong. Please try again.",
    };

    return baseMessages[errorInfo.type] || errorInfo.message;
  }

  /**
   * Get recommended action for error recovery
   */
  static getRecommendedAction(type: ErrorType, retryable: boolean): string {
    if (retryable) {
      return "retry";
    }

    switch (type) {
      case ErrorType.AUTH_ERROR:
        return "login";
      case ErrorType.VALIDATION_ERROR:
        return "correct_input";
      case ErrorType.DATA_ERROR:
        return "go_back";
      default:
        return "refresh_page";
    }
  }

  /**
   * Create loading state manager
   */
  static createLoadingManager() {
    let currentState: LoadingState = { isLoading: false };
    const listeners: Array<(state: LoadingState) => void> = [];

    const manager = {
      start: (message?: string, timeout?: number) => {
        currentState = {
          isLoading: true,
          loadingMessage: message,
          startTime: new Date(),
          timeout,
        };
        listeners.forEach((listener) => listener(currentState));

        // Auto-timeout if specified
        if (timeout) {
          setTimeout(() => {
            if (currentState.isLoading) {
              manager.stop();
              throw new Error(`Operation timed out after ${timeout}ms`);
            }
          }, timeout);
        }
      },

      stop: () => {
        currentState = { isLoading: false };
        listeners.forEach((listener) => listener(currentState));
      },

      updateProgress: (progress: number) => {
        if (currentState.isLoading) {
          currentState.progress = Math.max(0, Math.min(100, progress));
          listeners.forEach((listener) => listener(currentState));
        }
      },

      getState: () => ({ ...currentState }),

      subscribe: (listener: (state: LoadingState) => void) => {
        listeners.push(listener);
        return () => {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        };
      },
    };

    return manager;
  }

  /**
   * Retry utility with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    context?: string,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (unknownError) {
        const error = handleUnknownError(unknownError, "Operation failed");
        lastError = error;
        const errorInfo = this.createErrorInfo(error, context);

        // Don't retry if error is not retryable
        if (!errorInfo.retryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Timeout wrapper for promises
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage = "Operation timed out",
  ): Promise<T> {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });

    return Promise.race([
      promise.then((result) => {
        // Clear the timeout when the promise resolves
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        return result;
      }).catch((unknownError) => {
        const error = handleUnknownError(unknownError, "Promise rejected");
        // Clear the timeout when the promise rejects
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        throw error;
      }),
      timeoutPromise,
    ]);
  }

  /**
   * Safe async operation wrapper
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    context?: string,
  ): Promise<
    { success: true; data: T } | {
      success: false;
      error: ErrorInfo;
      fallback?: T;
    }
  > {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (unknownError) {
      const error = handleUnknownError(unknownError, "Safe operation failed");
      const errorInfo = this.createErrorInfo(error, context);
      return {
        success: false,
        error: errorInfo,
        ...(fallbackValue !== undefined && { fallback: fallbackValue }),
      };
    }
  }

  /**
   * Error boundary utilities for components
   */
  static createErrorBoundary() {
    let hasError = false;
    let errorInfo: ErrorInfo | null = null;

    return {
      reset: () => {
        hasError = false;
        errorInfo = null;
      },

      catch: (error: unknown, context?: string) => {
        hasError = true;
        errorInfo = this.createErrorInfo(error, context);
        console.error("Error caught by boundary:", errorInfo);
      },

      getState: () => ({ hasError, errorInfo }),

      render: (
        children: () => unknown,
        fallback: (error: ErrorInfo) => unknown,
      ) => {
        if (hasError && errorInfo) {
          return fallback(errorInfo);
        }
        return children();
      },
    };
  }

  /**
   * Format error for logging/debugging
   */
  static formatForLogging(errorInfo: ErrorInfo): string {
    return [
      `[${errorInfo.severity.toUpperCase()}] ${errorInfo.type}`,
      `Message: ${errorInfo.message}`,
      `Time: ${errorInfo.timestamp.toISOString()}`,
      `Recoverable: ${errorInfo.recoverable}`,
      `Retryable: ${errorInfo.retryable}`,
      errorInfo.details && `Details: ${errorInfo.details}`,
    ].filter(Boolean).join(" | ");
  }

  /**
   * Check if error should be reported to monitoring service
   */
  static shouldReport(errorInfo: ErrorInfo): boolean {
    // Report high/critical severity errors, or any unrecoverable errors
    return errorInfo.severity === ErrorSeverity.HIGH ||
      errorInfo.severity === ErrorSeverity.CRITICAL ||
      !errorInfo.recoverable;
  }
}
