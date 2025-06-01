import { useMemo } from "preact/hooks";

/**
 * Hook to generate optimized loading skeleton class names
 * Automatically manages animation states based on loading status
 */
export function useLoadingSkeleton(isLoading: boolean, additionalClasses = "") {
  const skeletonClasses = useMemo(() => {
    const baseClasses = "loading-skeleton";
    const statusClass = isLoading ? "running" : "completed";
    const additional = additionalClasses ? ` ${additionalClasses}` : "";

    return `${baseClasses} ${statusClass}${additional}`;
  }, [isLoading, additionalClasses]);

  return skeletonClasses;
}

/**
 * Utility function to get skeleton classes for components that don't use hooks
 */
export function getSkeletonClasses(isLoading: boolean, additionalClasses = "") {
  const baseClasses = "loading-skeleton";
  const statusClass = isLoading ? "running" : "completed";
  const additional = additionalClasses ? ` ${additionalClasses}` : "";

  return `${baseClasses} ${statusClass}${additional}`;
}

/**
 * Utility to conditionally render skeleton or content
 * Returns the appropriate class names for skeleton elements
 */
export function renderSkeletonOrContent(
  isLoading: boolean,
  skeletonClassName = "",
  contentRenderer?: () => any,
) {
  if (isLoading) {
    return {
      isLoading: true,
      className: getSkeletonClasses(true, skeletonClassName),
    };
  }

  return {
    isLoading: false,
    className: "",
    content: contentRenderer?.(),
  };
}
