/**
 * BTC Value Display Components
 *
 * Preact components for displaying BTC values with loading states,
 * error handling, and proper formatting.
 */

import {
  useBTCValue,
  useStampValue,
  useTotalBTCValue,
  useValueSummary,
} from "$lib/hooks/useBTCValue.ts";
import type { WalletStampWithValue } from "$lib/types/wallet.d.ts";
import { memo } from "preact/compat";

interface BTCValueDisplayProps {
  value: number | null;
  loading?: boolean;
  error?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showSymbol?: boolean;
  fallback?: string;
}

/**
 * Generic BTC value display component
 */
export const BTCValueDisplay = memo(function BTCValueDisplay({
  value,
  loading = false,
  error,
  className = "",
  size = "md",
  showSymbol = true,
  fallback = "0 BTC",
}: BTCValueDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold",
  };

  if (loading) {
    return (
      <div class={`${sizeClasses[size]} ${className}`}>
        <span class="animate-pulse text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div class={`${sizeClasses[size]} ${className}`}>
        <span class="text-red-500" title={error}>Error</span>
      </div>
    );
  }

  const displayValue = value !== null && value > 0
    ? `${value.toFixed(8).replace(/\.?0+$/, "")}${showSymbol ? " BTC" : ""}`
    : fallback;

  return (
    <div class={`${sizeClasses[size]} ${className}`}>
      <span class={value && value > 0 ? "text-green-600" : "text-gray-500"}>
        {displayValue}
      </span>
    </div>
  );
});

interface StampBTCValueProps {
  quantity: number;
  unitPrice: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
}

/**
 * Component for displaying individual stamp BTC value
 */
export const StampBTCValue = memo(function StampBTCValue({
  quantity,
  unitPrice,
  className = "",
  size = "md",
  showBreakdown = false,
}: StampBTCValueProps) {
  const { value, formatted, hasValue } = useBTCValue(quantity, unitPrice);

  if (showBreakdown && hasValue) {
    return (
      <div class={`${className}`}>
        <BTCValueDisplay value={value} size={size} />
        <div class="text-xs text-gray-500 mt-1">
          {quantity} × {unitPrice?.toFixed(8).replace(/\.?0+$/, "")} BTC
        </div>
      </div>
    );
  }

  return (
    <BTCValueDisplay
      value={value}
      size={size}
      className={className}
      fallback={hasValue ? formatted : "No value"}
    />
  );
});

interface WalletStampValueProps {
  stamp: WalletStampWithValue;
  className?: string;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
  showSource?: boolean;
}

/**
 * Component for displaying wallet stamp value with price source
 */
export const WalletStampValue = memo(function WalletStampValue({
  stamp,
  className = "",
  size = "md",
  showBreakdown = false,
  showSource = false,
}: WalletStampValueProps) {
  const stampValue = useStampValue(stamp);
  const {
    quantity,
    totalValue,
    formattedValue,
    formattedUnitPrice,
    hasValue,
    dataSource,
  } = stampValue;

  // Assign to expected variable names for compatibility
  const formattedTotalValue = formattedValue;
  const priceSource = dataSource;

  const sourceLabels = {
    market: "Market Data", // v2.3 calculated price from marketData.lastPriceBTC
    unit: "Last Price", // Legacy unitPrice field
    recent: "Recent Sale", // Legacy recentSalePrice field
    floor: "Floor Price", // Legacy floorPrice field
  };

  return (
    <div class={className}>
      <BTCValueDisplay
        value={totalValue}
        size={size}
        fallback={hasValue ? formattedTotalValue : "No value"}
      />

      {showBreakdown && hasValue && (
        <div class="text-xs text-gray-500 mt-1">
          {quantity} × {formattedUnitPrice}
        </div>
      )}

      {showSource && priceSource && (
        <div class="text-xs text-blue-500 mt-1">
          {sourceLabels[priceSource as keyof typeof sourceLabels]}
        </div>
      )}
    </div>
  );
});

interface TotalBTCValueProps {
  stamps: WalletStampWithValue[];
  className?: string;
  size?: "sm" | "md" | "lg";
  showStats?: boolean;
}

/**
 * Component for displaying total portfolio BTC value
 */
export const TotalBTCValue = memo(function TotalBTCValue({
  stamps,
  className = "",
  size = "lg",
  showStats = false,
}: TotalBTCValueProps) {
  const { total, formatted, hasValue } = useTotalBTCValue(stamps);

  return (
    <div class={className}>
      <BTCValueDisplay
        value={total}
        size={size}
        fallback={hasValue ? formatted : "0 BTC"}
      />

      {showStats && (
        <div class="text-sm text-gray-500 mt-2">
          {stamps.length} collections,{" "}
          {stamps.reduce((sum, s) => sum + (s.balance || 0), 0)} stamps
        </div>
      )}
    </div>
  );
});

interface BTCValueSummaryProps {
  stamps: WalletStampWithValue[];
  className?: string;
}

/**
 * Component for displaying comprehensive BTC value summary
 */
export const BTCValueSummary = memo(function BTCValueSummary({
  stamps,
  className = "",
}: BTCValueSummaryProps) {
  const {
    formattedTotal,
    totalStamps,
    valuedStamps,
    stampsWithValue,
    totalCollections,
    hasValue,
    valueCoverage,
  } = useValueSummary(stamps);

  return (
    <div class={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold">Portfolio Value</h3>
        <div class="text-lg font-semibold">
          {formattedTotal}
        </div>
      </div>

      {hasValue && (
        <div class="space-y-2 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>Total Stamps:</span>
            <span>{totalStamps}</span>
          </div>
          <div class="flex justify-between">
            <span>Valued Stamps:</span>
            <span>{valuedStamps} ({valueCoverage.toFixed(1)}%)</span>
          </div>
          <div class="flex justify-between">
            <span>Collections:</span>
            <span>{totalCollections}</span>
          </div>
          <div class="flex justify-between">
            <span>Collections with Value:</span>
            <span>{stampsWithValue}</span>
          </div>
        </div>
      )}
    </div>
  );
});
