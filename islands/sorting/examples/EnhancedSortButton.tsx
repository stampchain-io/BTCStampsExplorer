/**
 * @fileoverview EnhancedSortButton - Example of enhancing existing components
 * @description Shows how to upgrade the existing SortButton component with
 * world-class sorting infrastructure while maintaining backward compatibility
 */

import {
  useSorting,
  useSortingMetrics,
} from "$islands/sorting/SortingProvider.tsx";
import { useMemo } from "preact/hooks";
import type { EnhancedSortButtonProps } from "$types/ui.d.ts";

export function EnhancedSortButton({
  enableAdvancedSorting = false,
  showMetrics = false,
  className = "",
}: EnhancedSortButtonProps) {
  // Always call hooks at the top level
  const sortingContext = useSorting();
  const metrics = useSortingMetrics();

  // Conditionally use the context based on enableAdvancedSorting
  const activeSortingContext = enableAdvancedSorting ? sortingContext : null;

  const buttonText = useMemo(() => {
    if (!enableAdvancedSorting || !activeSortingContext) {
      return "Sort";
    }
    return `Sort by ${activeSortingContext.sortBy}`;
  }, [enableAdvancedSorting, activeSortingContext]);

  const metricsDisplay = useMemo(() => {
    if (!showMetrics || !metrics) return null;
    return (
      <div className="text-xs text-gray-500">
        Sort time: {metrics.sortTime}ms
      </div>
    );
  }, [showMetrics, metrics]);

  return (
    <div className={`sort-button-container ${className}`}>
      <button
        type="button"
        className="sort-button"
        onClick={() => {
          if (activeSortingContext) {
            // Handle sort logic
            console.log("Sorting...");
          }
        }}
      >
        {buttonText}
      </button>
      {metricsDisplay}
    </div>
  );
}

// Example usage components
export function ExampleBasicSortButton() {
  return <EnhancedSortButton className="basic-sort" />;
}

export function ExampleAdvancedSortButton() {
  return (
    <EnhancedSortButton
      enableAdvancedSorting
      className="advanced-sort"
    />
  );
}

export function ExampleSortButtonWithMetrics() {
  return (
    <EnhancedSortButton
      enableAdvancedSorting
      showMetrics
      className="sort-with-metrics"
    />
  );
}

export function ExampleSortButtonGroup() {
  return (
    <div className="sort-button-group">
      <button
        type="button"
        className="sort-option"
        onClick={() => console.log("Sort A-Z")}
      >
        A-Z
      </button>
      <button
        type="button"
        className="sort-option"
        onClick={() => console.log("Sort Z-A")}
      >
        Z-A
      </button>
    </div>
  );
}
