import type { MarketDataStatusProps } from "$types/ui.d.ts";
/**
 * @fileoverview MarketDataStatus - Simple component to display market data availability
 * @description Shows user-friendly messages about market data status with appropriate styling
 */

export function MarketDataStatus({
  status: _status,
  className = "",
  showDetails = false,
  overallStatus,
  stampsMarketData,
  src20MarketData,
}: MarketDataStatusProps) {
  // Don't show anything if market data is fully available
  if (overallStatus === "full") {
    return null;
  }

  const getStatusMessage = () => {
    switch (overallStatus) {
      case "partial":
        return "Some market data may be unavailable";
      case "unavailable":
        return "Market data is currently unavailable";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case "partial":
        return "text-yellow-400 border-yellow-400/20 bg-yellow-400/5";
      case "unavailable":
        return "text-red-400 border-red-400/20 bg-red-400/5";
      default:
        return "text-gray-400 border-gray-400/20 bg-gray-400/5";
    }
  };

  const getStatusIcon = () => {
    return overallStatus === "partial" ? "⚠️" : "ℹ️";
  };

  return (
    <div
      class={`
      flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs
      ${getStatusColor()}
      ${className}
    `}
    >
      <span>{getStatusIcon()}</span>
      <span>
        {getStatusMessage()}
      </span>

      {showDetails && (
        <span class="opacity-75 ml-2">
          Stamps: {stampsMarketData?.status || "unknown"} • SRC-20:{" "}
          {src20MarketData?.status || "unknown"}
        </span>
      )}
    </div>
  );
}
