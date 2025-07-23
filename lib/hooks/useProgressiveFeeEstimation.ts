import type { FeeDetails } from "$lib/types/base.d.ts";
import { debounce } from "$lib/utils/debounce.ts";
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
  toolType: "stamp" | "src20" | "src101" | "fairmint" | "transfer";

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
  const {
    feeEstimationService = defaultFeeEstimationService,
    loggerService = defaultLoggerService,
    debounceMs = 500,
  } = options;

  const [feeDetails, setFeeDetails] = useState<FeeDetails>({
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
    estimatedSize: 0,
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

  // Progressive fee estimation function with DI support
  const estimateFeesDebounced = debounce(async (
    estimationOptions: ProgressiveFeeEstimationOptions,
  ) => {
    const { toolType, feeRate, walletAddress, isConnected } = estimationOptions;

    // Skip estimation if required parameters are missing
    if (!feeRate || feeRate <= 0) {
      return;
    }

    setIsEstimating(true);
    setEstimationError(null);
    setEstimationCount((prev) => prev + 1);
    setLastEstimationTime(Date.now());

    try {
      // Phase 1: Get endpoint and payload based on tool type
      const { endpoint, payload } = buildEstimationRequest(
        estimationOptions,
        true,
      );

      loggerService.debug("ui", {
        message: `${toolType} fee estimation (Phase 1 - dryRun: true)`,
        data: {
          toolType,
          feeRate,
          endpoint,
          hasWallet: !!walletAddress,
          estimationCount: estimationCount + 1,
        },
      });

      // Make Phase 1 estimation call using injected service
      const estimateData = await feeEstimationService.estimateFees(
        endpoint,
        payload,
      );

      // Set Phase 1 estimation data
      const phase1FeeDetails: FeeDetails = {
        minerFee: Number(estimateData.est_miner_fee) || 0,
        dustValue: Number(estimateData.total_dust_value) || 0,
        totalValue: Number(estimateData.total_output_value) || 0,
        hasExactFees: false, // This is an estimate
        estimatedSize: Number(estimateData.est_tx_size) || 0,
      };

      setFeeDetails(phase1FeeDetails);
      setCacheStatus("fresh");

      loggerService.debug("ui", {
        message: `${toolType} fee estimation completed (Phase 1)`,
        data: {
          minerFee: estimateData.est_miner_fee,
          dustValue: estimateData.total_dust_value,
          totalValue: estimateData.total_output_value,
          isEstimate: estimateData.is_estimate,
          method: estimateData.estimation_method,
        },
      });

      // Phase 2: If wallet is connected, try to upgrade to exact fees
      if (isConnected && walletAddress) {
        try {
          const { payload: exactPayload } = buildEstimationRequest(
            estimationOptions,
            false,
          );

          loggerService.debug("ui", {
            message: `Upgrading to exact fees (Phase 2 - with wallet)`,
            data: {
              toolType,
              walletAddress,
              walletConnected: true,
            },
          });

          const exactData = await feeEstimationService.estimateFees(
            endpoint,
            exactPayload,
          );

          // Update with exact fees (hasExactFees: true)
          const phase2FeeDetails: FeeDetails = {
            minerFee: Number(exactData.est_miner_fee) || 0,
            dustValue: Number(exactData.total_dust_value) || 0,
            totalValue: Number(exactData.total_output_value) || 0,
            hasExactFees: true, // This is exact with real wallet
            estimatedSize: Number(exactData.est_tx_size) || 0,
          };

          setFeeDetails(phase2FeeDetails);

          loggerService.debug("ui", {
            message: `Exact fee estimation completed (Phase 2)`,
            data: {
              toolType,
              minerFee: exactData.est_miner_fee,
              dustValue: exactData.total_dust_value,
              totalValue: exactData.total_output_value,
              isEstimate: exactData.is_estimate,
              method: exactData.estimation_method,
            },
          });
        } catch (exactError) {
          // If exact calculation fails, keep the estimates and log the error
          loggerService.warn("ui", {
            message: "Exact fee calculation failed, keeping estimates",
            error: exactError instanceof Error
              ? exactError.message
              : String(exactError),
          });
          // Estimates are already set above, so we just continue
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      setEstimationError(errorMessage);
      setCacheStatus("empty");

      loggerService.error("ui", {
        message: `${toolType} fee estimation failed`,
        error: errorMessage,
        estimationCount: estimationCount + 1,
      });

      // Reset to safe state on error
      setFeeDetails({
        minerFee: 0,
        dustValue: 0,
        totalValue: 0,
        hasExactFees: false,
        estimatedSize: 0,
      });
    } finally {
      setIsEstimating(false);
    }
  }, debounceMs);

  // Trigger estimation when parameters change (Preact-optimized)
  useEffect(() => {
    console.log(
      "🔄 useProgressiveFeeEstimation: useEffect triggered with feeRate:",
      options.feeRate,
    );
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
    options.walletAddress,
    options.isConnected,
    // Tool-specific dependencies
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

  const refresh = () => {
    setEstimationCount((prev) => prev + 1);
    estimateFeesDebounced(options);
  };

  return {
    feeDetails,
    isEstimating,
    estimationError,
    refresh,
    estimationCount,
    lastEstimationTime,
    cacheStatus,
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
          dryRun: true, // Always use dryRun for estimation
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

    case "transfer": {
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
