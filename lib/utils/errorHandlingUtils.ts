/* ===== ERROR HANDLING UTILITIES FOR RECENT SALES ===== */

export enum ErrorType {
  NETWORK_ERROR = "network",
  API_ERROR = "api",
  DATA_ERROR = "data",
  VALIDATION_ERROR = "validation",
  TIMEOUT_ERROR = "timeout",
  AUTH_ERROR = "auth",
  UNKNOWN_ERROR = "unknown",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
  action?: string;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string | undefined;
  progress?: number | undefined;
  startTime?: Date | undefined;
  timeout?: number | undefined;
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
      } catch (jsonError) {
        // Handle circular references or other JSON.stringify errors
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
      } catch (error) {
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
      }).catch((error) => {
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
    } catch (error) {
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
