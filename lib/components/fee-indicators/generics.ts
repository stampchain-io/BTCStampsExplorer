/**
 * TypeScript Generics for Fee Indicators
 *
 * Provides type-safe generic interfaces for different tool contexts
 * Based on StampingTool reference implementation
 */

import type { ComponentChildren } from "preact";
import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";

/**
 * Tool types supported by the fee indicator system
 */
export type ToolType =
  | "stamp"
  | "src20"
  | "src101"
  | "fairmint"
  | "trade"
  | "custom";

/**
 * Tool-specific configuration
 */
export interface ToolConfig<T extends ToolType = ToolType> {
  /** Tool identifier */
  type: T;
  /** Tool display name */
  name: string;
  /** Pattern to use for fee indicators */
  pattern: "props" | "component" | "inline";
  /** Custom configuration */
  custom?: Record<string, unknown>;
}

/**
 * Generic fee indicator props for any tool
 */
export interface GenericFeeIndicatorProps<T extends ToolType = ToolType> {
  /** Tool configuration */
  toolConfig: ToolConfig<T>;
  /** Current estimation phase */
  currentPhase?: "instant" | "cached" | "exact";
  /** Phase results */
  phase1Result?: ProgressiveFeeEstimationResult | null;
  phase2Result?: ProgressiveFeeEstimationResult | null;
  phase3Result?: ProgressiveFeeEstimationResult | null;
  /** Loading states */
  isPreFetching?: boolean;
  isEstimating?: boolean;
  /** Connection state */
  isConnected?: boolean;
  /** Submission state */
  isSubmitting?: boolean;
  /** Error handling */
  error?: Error | null;
  onClearError?: () => void;
  /** Custom styling */
  className?: string;
  /** Children elements */
  children?: ComponentChildren;
}

/**
 * Tool-specific props extensions
 */
export interface StampToolProps extends GenericFeeIndicatorProps<"stamp"> {
  /** File being stamped */
  file?: File | null;
  /** Issuance quantity */
  issuance?: number;
}

export interface SRC20ToolProps extends GenericFeeIndicatorProps<"src20"> {
  /** Token ticker */
  ticker?: string;
  /** Operation type */
  operation?: "deploy" | "mint" | "transfer";
}

export interface SRC101ToolProps extends GenericFeeIndicatorProps<"src101"> {
  /** Bitname being registered */
  bitname?: string;
  /** Root domain */
  root?: string;
}

export interface FairmintToolProps
  extends GenericFeeIndicatorProps<"fairmint"> {
  /** Asset being minted */
  asset?: string;
  /** Quantity to mint */
  quantity?: number;
}

export interface TradeToolProps extends GenericFeeIndicatorProps<"trade"> {
  /** Trade type */
  tradeType?: "buy" | "sell" | "swap";
  /** Asset pairs */
  fromAsset?: string;
  toAsset?: string;
}

/**
 * Union type for all tool-specific props
 */
export type ToolSpecificProps =
  | StampToolProps
  | SRC20ToolProps
  | SRC101ToolProps
  | FairmintToolProps
  | TradeToolProps
  | GenericFeeIndicatorProps<"custom">;

/**
 * Factory function for creating tool-specific fee indicators
 */
export function createFeeIndicator<T extends ToolType>(
  toolConfig: ToolConfig<T>,
): (props: GenericFeeIndicatorProps<T>) => ComponentChildren {
  // This would be implemented to return the appropriate component
  // based on the tool configuration pattern
  return (props) => {
    // Implementation would go here
    return null;
  };
}

/**
 * Type guard for tool-specific props
 */
export function isToolProps<T extends ToolType>(
  props: ToolSpecificProps,
  toolType: T,
): props is Extract<ToolSpecificProps, { toolConfig: { type: T } }> {
  return props.toolConfig.type === toolType;
}

/**
 * Hook factory for tool-specific fee estimation
 */
export interface ToolFeeEstimationHook<T extends ToolType> {
  (params: ToolSpecificParams<T>): UseTransactionFeeEstimatorReturn;
}

/**
 * Tool-specific parameters for fee estimation
 */
export type ToolSpecificParams<T extends ToolType> = T extends "stamp" ? {
    toolType: T;
    file?: File | null;
    fileSize?: number;
    fileType?: string;
    issuance?: number;
    feeRate: number;
    walletAddress?: string;
    isConnected: boolean;
    isSubmitting: boolean;
  }
  : T extends "src20" ? {
      toolType: T;
      ticker?: string;
      operation?: "deploy" | "mint" | "transfer";
      amount?: number;
      feeRate: number;
      walletAddress?: string;
      isConnected: boolean;
      isSubmitting: boolean;
    }
  : T extends "src101" ? {
      toolType: T;
      bitname?: string;
      root?: string;
      feeRate: number;
      walletAddress?: string;
      isConnected: boolean;
      isSubmitting: boolean;
    }
  : T extends "fairmint" ? {
      toolType: T;
      asset?: string;
      quantity?: number;
      feeRate: number;
      walletAddress?: string;
      isConnected: boolean;
      isSubmitting: boolean;
    }
  : {
    toolType: T;
    feeRate: number;
    walletAddress?: string;
    isConnected: boolean;
    isSubmitting: boolean;
    [key: string]: unknown;
  };

/**
 * Return type from fee estimation hook
 */
interface UseTransactionFeeEstimatorReturn {
  feeDetails: ProgressiveFeeEstimationResult | null;
  currentPhase: "instant" | "cached" | "exact";
  phase1Result: ProgressiveFeeEstimationResult | null;
  phase2Result: ProgressiveFeeEstimationResult | null;
  phase3Result: ProgressiveFeeEstimationResult | null;
  isPreFetching: boolean;
  isEstimating: boolean;
  error: Error | null;
  clearError: () => void;
}
