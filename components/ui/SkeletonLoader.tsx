/* ===== ENHANCED SKELETON LOADING COMPONENTS ===== */
/*@baba-check styles*/
import { ComponentChildren } from "preact";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  animation?: "pulse" | "wave" | "none";
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Skeleton loader for better perceived performance
 * Provides immediate visual feedback while content loads
 */
export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "4px",
  className = "",
  animation = "pulse",
}: SkeletonProps) {
  const animationClass = animation === "pulse"
    ? "animate-pulse"
    : animation === "wave"
    ? "animate-pulse"
    : ""; // wave not implemented yet

  return (
    <div
      class={`${animationClass} bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: SRC20 Card Skeleton
 * Matches the actual SRC20CardMinted layout for seamless loading
 */
export function SRC20CardSkeleton() {
  return (
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div class="flex items-center justify-between mb-3">
        <Skeleton width="120px" height="20px" />
        <Skeleton width="80px" height="24px" borderRadius="12px" />
      </div>

      {/* Progress bar */}
      <div class="mb-3">
        <Skeleton width="100%" height="8px" borderRadius="4px" />
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 gap-4 mb-3">
        <div>
          <Skeleton width="60px" height="14px" className="mb-1" />
          <Skeleton width="80px" height="18px" />
        </div>
        <div>
          <Skeleton width="60px" height="14px" className="mb-1" />
          <Skeleton width="80px" height="18px" />
        </div>
      </div>

      {/* Price info */}
      <div class="flex justify-between items-center">
        <Skeleton width="100px" height="24px" />
        <Skeleton width="60px" height="16px" />
      </div>
    </div>
  );
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Stamp Card Skeleton
 * Matches the actual StampCard layout
 */
export function StampCardSkeleton() {
  return (
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Image placeholder */}
      <div class="aspect-square bg-gray-200 dark:bg-gray-700">
        <Skeleton width="100%" height="100%" borderRadius="0" />
      </div>

      {/* Content */}
      <div class="p-3">
        <Skeleton width="80%" height="18px" className="mb-2" />
        <Skeleton width="60%" height="14px" className="mb-3" />

        {/* Stats */}
        <div class="flex justify-between">
          <Skeleton width="70px" height="16px" />
          <Skeleton width="50px" height="16px" />
        </div>
      </div>
    </div>
  );
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Wallet Stamp Card Skeleton
 * Matches the wallet dashboard stamp layout with dispenser info
 */
export function WalletStampCardSkeleton() {
  return (
    <div class="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      {/* Stamp Image */}
      <div class="w-16 h-16 flex-shrink-0">
        <div class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-2xl">
          <Skeleton width="100%" height="100%" borderRadius="0.5rem" />
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 min-w-0">
        <Skeleton width="70%" height="20px" className="mb-2" />
        <Skeleton width="50%" height="16px" className="mb-3" />

        {/* Dispenser info */}
        <div class="flex justify-between items-center">
          <Skeleton width="80px" height="14px" />
          <Skeleton width="60px" height="14px" />
        </div>
      </div>
    </div>
  );
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Gallery Skeleton Grid
 * Creates a grid of skeleton cards for gallery loading states
 */
interface GallerySkeletonProps {
  count?: number;
  type?: "src20" | "stamp";
  className?: string;
}

export function GallerySkeleton({
  count = 6,
  type = "src20",
  className = "",
}: GallerySkeletonProps) {
  const CardSkeleton = type === "src20" ? SRC20CardSkeleton : StampCardSkeleton;

  return (
    <div
      class={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Table Row Skeleton
 * For data table loading states
 */
export function TableRowSkeleton({
  columns = 4,
  className = "",
}: { columns?: number; className?: string }) {
  return (
    <tr class={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} class="p-3">
          <Skeleton width="80%" height="16px" />
        </td>
      ))}
    </tr>
  );
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Text Block Skeleton
 * For article/content loading states
 */
export function TextBlockSkeleton({
  lines = 3,
  className = "",
}: { lines?: number; className?: string }) {
  return (
    <div class={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? "60%" : "100%"}
          height="16px"
        />
      ))}
    </div>
  );
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Smart Loading Wrapper
 * Automatically shows skeleton while loading, then content
 */
interface SmartLoaderProps {
  isLoading: boolean;
  skeleton: ComponentChildren;
  children: ComponentChildren;
  className?: string;
}

export function SmartLoader({
  isLoading,
  skeleton,
  children,
  className = "",
}: SmartLoaderProps) {
  return (
    <div class={className}>
      {isLoading ? skeleton : children}
    </div>
  );
}
