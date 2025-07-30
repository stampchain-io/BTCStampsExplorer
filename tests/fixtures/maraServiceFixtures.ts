import type {
  MaraFeeRateResponse,
  MaraSubmissionResponse,
} from "$/server/services/mara/types.ts";

export const maraServiceFixtures = {
  feeRateResponses: {
    standard: {
      fee_rate: 3.0,
      block_height: 800000,
      network: "mainnet",
      min_fee_rate: 3.0,
      timestamp: Date.now(),
    } as MaraFeeRateResponse,
    
    belowMinimum: {
      fee_rate: 0.5,
      block_height: 800000,
      network: "mainnet",
    } as Partial<MaraFeeRateResponse>,
    
    testnet: {
      fee_rate: 1.5,
      block_height: 100000,
      network: "testnet",
      min_fee_rate: 1.5,
      timestamp: Date.now(),
    } as MaraFeeRateResponse,
  },
  
  submissionResponses: {
    success: {
      message: "a".repeat(64), // Valid 64-char txid
      status: "success",
    },
    
    error: {
      message: "Transaction rejected: insufficient fee",
      status: "error",
    },
    
    invalidTxid: {
      message: "invalid-txid",
      status: "success",
    },
  },
  
  errorResponses: {
    serverError: {
      error: "Server error",
    },
    
    invalidTransaction: {
      error: "Invalid transaction",
    },
    
    htmlError: "<!DOCTYPE html><html><body>Error</body></html>",
  },
  
  validTransactionHex: "0200000001" + "a".repeat(100),
};

export function createMockMaraHttpClient() {
  return {
    get: () => Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      data: maraServiceFixtures.feeRateResponses.standard,
    }),
    post: () => Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      data: maraServiceFixtures.submissionResponses.success,
    }),
  };
}

export function createMockCircuitBreaker() {
  const state = {
    isOpen: false,
    failureCount: 0,
    successCount: 0,
    requestCount: 0,
  };
  
  return {
    execute: async (fn: () => Promise<any>) => {
      state.requestCount++;
      try {
        const result = await fn();
        state.successCount++;
        return result;
      } catch (error) {
        state.failureCount++;
        if (state.failureCount >= 3) {
          state.isOpen = true;
        }
        throw error;
      }
    },
    isOpen: () => state.isOpen,
    getMetrics: () => ({
      totalRequests: state.requestCount,
      successfulRequests: state.successCount,
      failedRequests: state.failureCount,
      openCount: state.isOpen ? 1 : 0,
      state: state.isOpen ? "open" : "closed",
      failureCount: state.failureCount,
      successCount: state.successCount,
      requestCount: state.requestCount,
    }),
    reset: () => {
      state.isOpen = false;
      state.failureCount = 0;
      state.successCount = 0;
      state.requestCount = 0;
    },
  };
}