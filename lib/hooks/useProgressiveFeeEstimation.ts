import type { FeeDetails } from "$lib/types/base.d.ts";
import { debounce } from "$lib/utils/performance/debounce.ts";
import { logger, type LogNamespace } from "$lib/utils/logger.ts";
import { useEffect, useState } from "preact/hooks";

// ✨ Dependency injection interfaces for testability
export interface FeeEstimationService {
  estimateFees(endpoint: string, payload: any): Promise<any>;
}

export interface LoggerService {
  debug(category: LogNamespace, data: any): void;
  warn(category: LogNamespace, data: any): void;
  error(category: LogNamespace, data: any): void;
}

// Default implementations
export const defaultFeeEstimationService: FeeEstimationService = {
  async estimateFees(endpoint: string, payload: any) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Estimation failed: ${response.statusText}`);
    }

    return await response.json();
  },
};

export const defaultLoggerService: LoggerService = {
  debug: (category: LogNamespace, data: any) => logger.debug(category, data),
  warn: (category: LogNamespace, data: any) => logger.warn(category, data),
  error: (category: LogNamespace, data: any) => logger.error(category, data),
};

export interface ProgressiveFeeEstimationOptions {
  // Common parameters
  feeRate: number;
  walletAddress?: string;
  isConnected?: boolean;

  // Tool-specific parameters
  toolType:
    | "stamp"
    | "src20"
    | "src20-mint"
    | "src20-deploy"
    | "src20-transfer"
    | "src101"
    | "fairmint"
    | "transfer"
    | "send";

  // Stamp-specific
  file?: string;
  filename?: string;
  quantity?: number;
  locked?: boolean;
  divisible?: boolean;
  isPoshStamp?: boolean;

  // SRC20-specific
  tick?: string;
  amt?: string;
  operation?: "deploy" | "mint" | "transfer";
  // SRC20-deploy specific
  max?: string;
  lim?: string;
  dec?: string;

  // Transfer-specific
  recipientAddress?: string;
  asset?: string;
  transferQuantity?: number;

  // SRC101-specific
  to?: string;
  op?: string;

  // Fairmint-specific
  jsonData?: string;

  // ✨ Dependency injection for testing
  feeEstimationService?: FeeEstimationService;
  loggerService?: LoggerService;
  debounceMs?: number;
  isSubmitting?: boolean; // Added for testing
}

export interface ProgressiveFeeEstimationResult {
  feeDetails: FeeDetails;
  isEstimating: boolean;
  estimationError: string | null;
  refresh: () => void;
  // ✨ Additional test-friendly properties
  estimationCount: number;
  lastEstimationTime: number | null;
  cacheStatus: "fresh" | "stale" | "empty";
  feeDetailsVersion: number;
  // Background exact fee calculation state
  isPreFetching: boolean;
  preFetchedFees: FeeDetails | null;
}

/**
 * Shared hook for progressive fee estimation across all Bitcoin transaction tools
 *
 * ✨ Features:
 * - Phase 1: Immediate client-side estimates without wallet
 * - Phase 2: Upgraded exact fees with connected wallet
 * - Automatic re-estimation when fee rate or other parameters change
 * - Debounced API calls to prevent excessive requests
 * - Consistent error handling and logging
 * - Full dependency injection support for testing
 * - Preact-optimized with proper signal handling
 * - Cache status monitoring for performance insights
 *
 * ✨ Testability:
 * - Injectable services for mocking
 * - Estimation count tracking
 * - Cache status monitoring
 * - Configurable debounce timing
 *
 * @example
 * ```tsx
 * // Production usage
 * const { feeDetails, isEstimating, refresh } = useProgressiveFeeEstimation({
 *   toolType: "stamp",
 *   feeRate: formState.fee,
 *   file: fileData,
 *   filename: file?.name,
 *   walletAddress: wallet?.address,
 *   isConnected: isConnected,
 * });
 *
 * // Test usage with mocks
 * const mockService = { estimateFees: vi.fn().mockResolvedValue(mockResponse) };
 * const { feeDetails } = useProgressiveFeeEstimation({
 *   toolType: "stamp",
 *   feeRate: 10,
 *   feeEstimationService: mockService,
 *   debounceMs: 0, // No debounce in tests
 * });
 * ```
 */
export function useProgressiveFeeEstimation(
  options: ProgressiveFeeEstimationOptions,
): ProgressiveFeeEstimationResult {
  // State management
  const [feeDetails, setFeeDetails] = useState<FeeDetails>({
    minerFee: 0,
    totalValue: 0,
    dustValue: 0,
    hasExactFees: false,
  });
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationError, setEstimationError] = useState<string | null>(null);
  const [estimationCount, setEstimationCount] = useState(0);
  const [lastEstimationTime, setLastEstimationTime] = useState<number | null>(
    null,
  );
  const [cacheStatus, setCacheStatus] = useState<"fresh" | "stale" | "empty">(
    "empty",
  );

  // 🎯 PREACT REACTIVITY FIX: Version counter to force change detection
  const [feeDetailsVersion, setFeeDetailsVersion] = useState(0);

  // Background UTXO pre-fetching state
  const [isPreFetching, setIsPreFetching] = useState(false);
  const [preFetchedFees, setPreFetchedFees] = useState<FeeDetails | null>(null);

  // DI services with defaults
  const feeEstimationService = options.feeEstimationService ||
    defaultFeeEstimationService;
  const loggerService = options.loggerService || defaultLoggerService;

  // Progressive fee estimation function with DI support
  const estimateFeesDebounced = debounce(async (
    estimationOptions: ProgressiveFeeEstimationOptions,
  ) => {
    const { feeRate } = estimationOptions;

    // Skip estimation if required parameters are missing
    if (!feeRate || feeRate <= 0) {
      return;
    }

    setIsEstimating(true);
    setEstimationError(null);
    setEstimationCount((prev) => prev + 1);
    setLastEstimationTime(Date.now());

    try {
      // 🚀 PHASE 1: ALWAYS get instant estimates (dryRun=true)
      // This provides immediate feedback regardless of wallet status
      const phase1Request = buildEstimationRequest(estimationOptions, true); // Always dryRun for instant estimates

      const phase1Response = await feeEstimationService.estimateFees(
        phase1Request.endpoint,
        phase1Request.payload,
      );

      if (phase1Response) {
        const phase1FeeDetails: FeeDetails = {
          minerFee: Number(phase1Response.est_miner_fee) || 0,
          totalValue: Number(phase1Response.total_output_value) || 0,
          dustValue: Number(phase1Response.total_dust_value) || 0,
          hasExactFees: false, // Always false for dryRun estimates
        };

        setFeeDetails(phase1FeeDetails);
        setFeeDetailsVersion((prev) => prev + 1);
        setCacheStatus("fresh");
        loggerService.debug("ui", {
          message:
            `${estimationOptions.toolType} fee estimation completed (Phase 1)`,
          data: {
            minerFee: phase1Response.est_miner_fee,
            dustValue: phase1Response.total_dust_value,
            totalValue: phase1Response.total_output_value,
            isEstimate: phase1Response.is_estimate,
            method: phase1Response.estimation_method,
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown estimation error";
      setEstimationError(errorMessage);
      loggerService.error("ui", {
        message: "Fee estimation failed",
        error: errorMessage,
      });
    } finally {
      setIsEstimating(false);
    }
  }, 300); // Fast debounce for instant estimates

  // 🎯 PHASE 2: Background exact calculation with real UTXOs and connected wallet
  // Uses dryRun=false for precise fee calculation with actual UTXO selection
  const preFetchExactFeesDebounced = debounce(async (
    estimationOptions: ProgressiveFeeEstimationOptions,
  ) => {
    // 🚨 CRITICAL: Check if minting started during debounce delay
    // If user clicked STAMP while this was debouncing, abort to prevent interference
    if (estimationOptions.isSubmitting) {
      loggerService.debug("ui", {
        message: "Background pre-fetching aborted - minting in progress",
        toolType: estimationOptions.toolType,
      });
      return;
    }

    // Only pre-fetch if wallet is connected and we have required params
    if (!estimationOptions.walletAddress || !estimationOptions.feeRate) {
      return;
    }

    setIsPreFetching(true);

    try {
      // 🚀 PHASE 2: Exact calculation with real UTXOs and connected wallet
      // Uses dryRun=false to get precise fees with actual UTXO selection
      const phase2Request = buildEstimationRequest(estimationOptions, false); // dryRun=false for exact fees

      const phase2Response = await feeEstimationService.estimateFees(
        phase2Request.endpoint,
        phase2Request.payload,
      );

      // 🚨 CRITICAL: Check again after async operation completes
      // If minting started while we were fetching, don't update UI state
      if (estimationOptions.isSubmitting) {
        loggerService.debug("ui", {
          message:
            "Background pre-fetching result discarded - minting in progress",
          toolType: estimationOptions.toolType,
        });
        return;
      }

      if (phase2Response) {
        const exactFeeDetails: FeeDetails = {
          minerFee: Number(phase2Response.est_miner_fee) || 0,
          totalValue: Number(phase2Response.total_output_value) || 0,
          dustValue: Number(phase2Response.total_dust_value) || 0,
          hasExactFees: true, // True for real UTXO calculations (dryRun=false)
        };

        // 🎯 Update UI with exact fees (removes ~ and (est) indicators)
        setFeeDetails(exactFeeDetails);
        setPreFetchedFees(exactFeeDetails);
        setFeeDetailsVersion((prev) => prev + 1);

        loggerService.debug("ui", {
          message: `Exact fee calculation completed (Phase 2)`,
          data: {
            toolType: estimationOptions.toolType,
            minerFee: phase2Response.est_miner_fee,
            dustValue: phase2Response.total_dust_value,
            totalValue: phase2Response.total_output_value,
            isEstimate: phase2Response.is_estimate,
            method: phase2Response.estimation_method,
          },
        });
      }
    } catch (error) {
      // Silent failure for background exact calculation - user still has initial estimates
      loggerService.warn("ui", {
        message: "Background exact fee calculation failed",
        error: error instanceof Error ? error.message : "Unknown error",
        walletAddress: estimationOptions.walletAddress,
      });
    } finally {
      setIsPreFetching(false);
    }
  }, 2000); // 2-second delay for background pre-fetching

  // Trigger estimation when parameters change (Preact-optimized)
  useEffect(() => {
    // 🚀 PHASE 1: Always get instant estimates
    estimateFeesDebounced(options);

    // Mark cache as stale after 30 seconds
    const staleTimer = setTimeout(() => {
      setCacheStatus("stale");
    }, 30000);

    return () => {
      clearTimeout(staleTimer);
    };
  }, [
    options.toolType,
    options.feeRate,
    // Tool-specific dependencies for instant estimates
    options.file,
    options.filename,
    options.quantity,
    options.locked,
    options.divisible,
    options.isPoshStamp,
    options.tick,
    options.amt,
    options.operation,
    options.recipientAddress,
    options.asset,
    options.transferQuantity,
    options.to,
    options.op,
    options.jsonData,
  ]);

  // 🎯 SEPARATE useEffect for background exact fee calculation
  // Only triggers when wallet connects or core transaction params change
  useEffect(() => {
    // Only start exact calculation if wallet is connected
    if (options.walletAddress && options.feeRate) {
      preFetchExactFeesDebounced(options);
    }
  }, [
    // 🎯 SMART TRIGGERS: Only wallet connection and core transaction changes
    options.walletAddress, // Wallet connects/disconnects
    options.toolType, // Tool type changes
    options.file, // File changes (major transaction change)
    options.filename, // Filename changes (major transaction change)
    options.quantity, // Quantity changes (major transaction change)
    // Note: Deliberately EXCLUDE feeRate to prevent constant pre-fetching on slider moves
  ]);

  const refresh = () => {
    setEstimationCount((prev) => prev + 1);
    estimateFeesDebounced(options);

    // Also refresh exact fees if wallet connected
    if (options.walletAddress) {
      preFetchExactFeesDebounced(options);
    }
  };

  return {
    feeDetails,
    isEstimating,
    estimationError,
    refresh,
    estimationCount,
    lastEstimationTime,
    cacheStatus,
    feeDetailsVersion,
    // New background pre-fetching state
    isPreFetching,
    preFetchedFees,
  };
}

/**
 * Build estimation request based on tool type and phase
 * ✨ Pure function for easy testing
 */
export function buildEstimationRequest(
  options: ProgressiveFeeEstimationOptions,
  isDryRun: boolean,
): { endpoint: string; payload: any } {
  const { toolType, feeRate, walletAddress } = options;

  switch (toolType) {
    case "stamp": {
      const { file, filename, quantity, locked, divisible, isPoshStamp } =
        options;
      return {
        endpoint: "/api/v2/olga/mint",
        payload: {
          filename: filename || "dummy.png",
          file: file ||
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          qty: Number(quantity) || 1,
          locked: locked || false,
          divisible: divisible || false,
          feeRate: feeRate, // Fixed: API expects 'feeRate', not 'satsPerVB'
          description: "stamp:",
          prefix: "stamp",
          service_fee: 0,
          isPoshStamp: isPoshStamp || false,
          dryRun: isDryRun, // Use the isDryRun parameter instead of hardcoding
          // 🎯 CRITICAL: Don't provide assetName for estimation (dryRun=true)
          // Let the API generate a random available asset name to avoid conflicts
          ...(isDryRun ? {} : { sourceWallet: walletAddress }),
        },
      };
    }

    case "src20": {
      const { tick, amt, operation } = options;
      // SRC20 endpoints vary by operation
      if (operation === "mint") {
        return {
          endpoint: "/api/v2/src20/mint",
          payload: {
            tick: tick || "",
            amt: amt || "1",
            satsPerVB: feeRate,
            dryRun: true,
            ...(isDryRun ? {} : { sourceWallet: walletAddress }),
          },
        };
      }
      // Add other SRC20 operations as needed
      throw new Error(`SRC20 operation ${operation} not implemented`);
    }

    case "src20-mint": {
      const { tick, amt } = options;
      return {
        endpoint: "/api/v2/src20/mint",
        payload: {
          tick: tick || "",
          amt: amt || "1",
          satsPerVB: feeRate,
          dryRun: isDryRun,
          ...(isDryRun ? {} : { sourceWallet: walletAddress }),
        },
      };
    }

    case "src20-deploy": {
      const { tick, max, lim, dec } = options;
      return {
        endpoint: "/api/v2/src20/deploy",
        payload: {
          tick: tick || "",
          max: max || "21000000",
          lim: lim || "1000",
          dec: dec || "18",
          satsPerVB: feeRate,
          dryRun: isDryRun,
          ...(isDryRun ? {} : { sourceWallet: walletAddress }),
        },
      };
    }

    case "src20-transfer": {
      const { tick, amt, recipientAddress } = options;
      return {
        endpoint: "/api/v2/src20/transfer",
        payload: {
          tick: tick || "",
          amt: amt || "1",
          to: recipientAddress || "",
          satsPerVB: feeRate,
          dryRun: isDryRun,
          ...(isDryRun ? {} : { sourceWallet: walletAddress }),
        },
      };
    }

    case "src101": {
      const { to, op } = options;
      return {
        endpoint: "/api/v2/src101/create",
        payload: {
          to: to || "",
          op: op || "",
          satsPerVB: feeRate,
          dryRun: true,
          ...(isDryRun ? {} : { sourceWallet: walletAddress }),
        },
      };
    }

    case "fairmint": {
      const { jsonData } = options;
      return {
        endpoint: "/api/v2/fairmint/create",
        payload: {
          jsonData: jsonData || "{}",
          satsPerVB: feeRate,
          dryRun: true,
          ...(isDryRun ? {} : { sourceWallet: walletAddress }),
        },
      };
    }

    case "transfer":
    case "send": {
      const { recipientAddress, asset, transferQuantity } = options;
      return {
        endpoint: "/api/v2/create/send",
        payload: {
          address: walletAddress || "",
          destination: recipientAddress || "",
          asset: asset || "",
          quantity: transferQuantity || 1,
          satsPerVB: feeRate,
          dryRun: true,
          options: {
            return_psbt: false,
            fee_per_kb: feeRate * 1000,
            allow_unconfirmed_inputs: true,
          },
        },
      };
    }

    default:
      throw new Error(`Unsupported tool type: ${toolType}`);
  }
}

// ✨ Test utilities for dependency injection
export const createMockFeeEstimationService = (
  mockResponse: any,
): FeeEstimationService => ({
  estimateFees(_endpoint: string, _payload: any) {
    return Promise.resolve(mockResponse);
  },
});

export const createMockLoggerService = (): LoggerService & { logs: any[] } => {
  const logs: any[] = [];
  return {
    logs,
    debug: (category: LogNamespace, data: any) =>
      logs.push({ level: "debug", category, data }),
    warn: (category: LogNamespace, data: any) =>
      logs.push({ level: "warn", category, data }),
    error: (category: LogNamespace, data: any) =>
      logs.push({ level: "error", category, data }),
  };
};
