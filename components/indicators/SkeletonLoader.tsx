/* ===== SKELETON LOADER COMPONENTS ===== */
import type { SkeletonLoaderProps } from "$types/ui.d.ts";

/* ===== BASIC SKELETON COMPONENTS ===== */

/**
 * Basic skeleton element with customizable dimensions
 */
export function SkeletonElement({
  height = "h-4",
  width = "w-full",
  rounded = "rounded",
  className = "",
}: {
  height?: string;
  width?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      class={`animate-pulse bg-stamp-grey-darker ${height} ${width} ${rounded} ${className}`}
    />
  );
}

/**
 * Skeleton for form inputs
 */
export function SkeletonInput({
  label = true,
  width = "w-full",
  className = "",
}: {
  label?: boolean;
  width?: string;
  className?: string;
}) {
  return (
    <div class={`space-y-1.5 ${className}`}>
      {label && <SkeletonElement height="h-4" width="w-20" />}
      <SkeletonElement height="h-[38px]" width={width} rounded="rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for buttons
 */
export function SkeletonButton({
  size = "md",
  width = "w-32",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  width?: string;
  className?: string;
}) {
  const heights = {
    sm: "h-[34px]",
    md: "h-[38px]",
    lg: "h-[42px]",
  };

  return (
    <SkeletonElement
      height={heights[size]}
      width={width}
      rounded="rounded-lg"
      className={className}
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({
  lines = 1,
  widths = ["w-full"],
  className = "",
}: {
  lines?: number;
  widths?: string[];
  className?: string;
}) {
  const lineWidths = Array.from(
    { length: lines },
    (_, i) => widths[i] || widths[widths.length - 1] || "w-full",
  );

  return (
    <div class={`space-y-2 ${className}`}>
      {lineWidths.map((width, index) => (
        <SkeletonElement key={index} height="h-4" width={width} />
      ))}
    </div>
  );
}

/**
 * Skeleton for image previews
 */
export function SkeletonImage({
  size = "w-32 h-32",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <div
      class={`animate-pulse bg-stamp-grey-darker ${size} rounded-lg flex items-center justify-center ${className}`}
    >
      <svg
        class="w-8 h-8 text-stamp-grey"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z" />
      </svg>
    </div>
  );
}

/* ===== TOOL-SPECIFIC SKELETON LOADERS ===== */

/**
 * Skeleton loader for stamping tool form
 */
export function StampingToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      {/* File upload section */}
      <div class="space-y-3">
        <SkeletonText lines={1} widths={["w-24"]} />
        <div class="flex gap-4">
          <SkeletonImage size="w-32 h-32" />
          <div class="flex-1 space-y-3">
            <SkeletonButton width="w-40" />
            <SkeletonText lines={2} widths={["w-full", "w-3/4"]} />
          </div>
        </div>
      </div>

      {/* Form inputs */}
      <div class="space-y-4">
        <SkeletonInput />
        <SkeletonInput />
        <div class="grid grid-cols-2 gap-4">
          <SkeletonInput />
          <SkeletonInput />
        </div>
      </div>

      {/* Toggle switches */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <SkeletonText lines={1} widths={["w-32"]} />
          <SkeletonElement height="h-5" width="w-10" rounded="rounded-full" />
        </div>
        <div class="flex items-center justify-between">
          <SkeletonText lines={1} widths={["w-28"]} />
          <SkeletonElement height="h-5" width="w-10" rounded="rounded-full" />
        </div>
      </div>

      {/* Action buttons */}
      <div class="flex gap-3">
        <SkeletonButton size="lg" width="flex-1" />
        <SkeletonButton size="lg" width="w-32" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for SRC20 deploy tool
 */
export function DeployToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      {/* Token info inputs */}
      <div class="space-y-4">
        <SkeletonInput />
        <SkeletonInput />
        <div class="grid grid-cols-2 gap-4">
          <SkeletonInput />
          <SkeletonInput />
        </div>
      </div>

      {/* Settings toggles */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <SkeletonText lines={1} widths={["w-24"]} />
          <SkeletonElement height="h-5" width="w-10" rounded="rounded-full" />
        </div>
      </div>

      {/* Fee section placeholder */}
      <div class="space-y-2">
        <SkeletonText lines={1} widths={["w-16"]} />
        <SkeletonElement height="h-12" width="w-full" rounded="rounded-lg" />
      </div>

      {/* Action button */}
      <SkeletonButton size="lg" width="w-full" />
    </div>
  );
}

/**
 * Skeleton loader for SRC20 mint tool
 */
export function MintToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      {/* Token info display */}
      <div class="space-y-3">
        <div class="flex items-center gap-4">
          <SkeletonImage size="w-16 h-16" />
          <div class="flex-1">
            <SkeletonText lines={2} widths={["w-32", "w-48"]} />
          </div>
        </div>

        {/* Progress bar */}
        <div class="space-y-2">
          <div class="flex justify-between">
            <SkeletonText lines={1} widths={["w-20"]} />
            <SkeletonText lines={1} widths={["w-16"]} />
          </div>
          <SkeletonElement
            height="h-1.5"
            width="w-full"
            rounded="rounded-full"
          />
        </div>
      </div>

      {/* Form inputs */}
      <div class="space-y-4">
        <SkeletonInput />
        <SkeletonInput />
      </div>

      {/* Fee section */}
      <SkeletonElement height="h-12" width="w-full" rounded="rounded-lg" />

      {/* Action button */}
      <SkeletonButton size="lg" width="w-full" />
    </div>
  );
}

/**
 * Skeleton loader for SRC20 transfer tool
 */
export function TransferToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      {/* Token selector */}
      <div class="space-y-3">
        <SkeletonText lines={1} widths={["w-32"]} />
        <SkeletonElement
          height="h-[42px]"
          width="w-full"
          rounded="rounded-lg"
        />
      </div>

      {/* Form inputs */}
      <div class="space-y-4">
        <SkeletonInput />
        <SkeletonInput />
      </div>

      {/* Balance display */}
      <div class="space-y-2">
        <SkeletonText lines={1} widths={["w-20"]} />
        <SkeletonText lines={1} widths={["w-32"]} />
      </div>

      {/* Fee section */}
      <SkeletonElement height="h-12" width="w-full" rounded="rounded-lg" />

      {/* Action button */}
      <SkeletonButton size="lg" width="w-full" />
    </div>
  );
}

/**
 * Skeleton loader for send tool
 */
export function SendToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      {/* Stamp selector/info */}
      <div class="space-y-3">
        <SkeletonText lines={1} widths={["w-28"]} />
        <div class="flex gap-4">
          <SkeletonImage size="w-20 h-20" />
          <div class="flex-1">
            <SkeletonText lines={3} widths={["w-full", "w-3/4", "w-1/2"]} />
          </div>
        </div>
      </div>

      {/* Form inputs */}
      <div class="space-y-4">
        <SkeletonInput />
        <SkeletonInput />
      </div>

      {/* Fee section */}
      <SkeletonElement height="h-12" width="w-full" rounded="rounded-lg" />

      {/* Action button */}
      <SkeletonButton size="lg" width="w-full" />
    </div>
  );
}

/**
 * Skeleton loader for register tool (SRC101)
 */
export function RegisterToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      {/* Domain input */}
      <SkeletonInput />

      {/* Registration info */}
      <div class="space-y-3">
        <SkeletonText lines={2} widths={["w-full", "w-2/3"]} />
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <SkeletonText lines={1} widths={["w-16"]} />
            <SkeletonText lines={1} widths={["w-24"]} />
          </div>
          <div class="space-y-1">
            <SkeletonText lines={1} widths={["w-20"]} />
            <SkeletonText lines={1} widths={["w-32"]} />
          </div>
        </div>
      </div>

      {/* Fee section */}
      <SkeletonElement height="h-12" width="w-full" rounded="rounded-lg" />

      {/* Action button */}
      <SkeletonButton size="lg" width="w-full" />
    </div>
  );
}
