/* ===== SKELETON LOADER COMPONENTS ===== */
import { Icon } from "$icon";
import { containerColForm, containerRowForm, loaderSkeleton } from "$layout";
import type { SkeletonLoaderProps } from "$types/ui.d.ts";

/* ===== BASIC SKELETON COMPONENTS ===== */
/* Skeleton container */
export function SkeletonContainer({
  height = "h-full",
  width = "w-full",
  rounded = "rounded-2xl",
  className = "flex p-5 gap-5",
  children,
}: {
  height?: string;
  width?: string;
  rounded?: string;
  className?: string;
  children?: any;
}) {
  return (
    <div
      class={`${loaderSkeleton} ${height} ${width} ${rounded} ${className}`}
    >
      {children}
    </div>
  );
}

/* Skeleton for form inputs */
export function SkeletonInput({
  height = "h-10",
  width = "w-full",
  rounded = "rounded-lg",
  className = "",
}: {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      class={`${loaderSkeleton} ${height} ${width} ${rounded} ${className}`}
    />
  );
}

/* Skeleton for buttons */
export function SkeletonButton({
  width = "w-32",
  rounded = "rounded-lg",
  size = "mdR",
  className = "",
}: {
  height?: string;
  width?: string;
  rounded?: string;
  size?: "smR" | "mdR" | "lgR";
  className?: string;
}) {
  const sizes = {
    smR: "h-9 tablet:h-8",
    mdR: "h-10 tablet:h-9",
    lgR: "h-11 tablet:h-10",
  };

  return (
    <div
      class={`${loaderSkeleton} ${width} ${rounded} ${
        sizes[size]
      } ${className}`}
    />
  );
}

/* Skeleton for toggle switches */
export function SkeletonToggle({
  height = "h-5",
  width = "w-10",
  rounded = "rounded-full",
  className = "",
}: {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      class={`${loaderSkeleton} ${height} ${width} ${rounded} ${className}`}
    />
  );
}

/* Skeleton for text lines */
export function SkeletonText({
  lines = 1,
  height = "h-4",
  widths = ["w-full"],
  rounded = "rounded",
  className = "",
}: {
  lines?: number;
  height?: string;
  widths?: string[];
  rounded?: string;
  className?: string;
}) {
  const lineWidths = Array.from(
    { length: lines },
    (_, i) => widths[i] || widths[widths.length - 1] || "w-full",
  );

  return (
    <div class={`space-y-2 ${className}`}>
      {lineWidths.map((width, index) => (
        <div
          class={`${loaderSkeleton} ${index} ${height} ${width} ${rounded}`}
        />
      ))}
    </div>
  );
}

/* Skeleton for image previews */
export function SkeletonImage({
  size = "w-[100px] h-[100px]",
  rounded = "rounded-lg",
  className = "",
}: {
  size?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      class={`flex items-center justify-center ${loaderSkeleton} ${size} ${rounded} ${className}`}
    >
      <Icon
        type="icon"
        name="uploadImage"
        weight="extraLight"
        size="xxl"
        color="grey"
        className="opacity-20"
      />
    </div>
  );
}

/* ===== TOOL-SPECIFIC SKELETON LOADERS ===== */

/* Skeleton loader for stamping tool form */
export function StampingToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      <SkeletonContainer>
        {/* Left Column Skeleton - Image upload and decimals */}
        <div class={`${containerColForm} !w-[100px]`}>
          {/* Image upload skeleton */}
          <SkeletonImage />

          {/* Decimals input skeleton */}
          <SkeletonInput />
        </div>

        {/* Right Column Skeleton - Token details */}
        <div class={`${containerColForm}`}>
          <div class={`${containerRowForm}`}>
            {/* Ticker name input skeleton */}
            <SkeletonInput width="w-full flex-1" />

            {/* Toggle switch skeleton */}
            <SkeletonToggle />
          </div>
        </div>
      </SkeletonContainer>
    </div>
  );
}

/* Skeleton loader for SRC20 deploy tool */
export function DeployToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      <SkeletonContainer>
        {/* Left Column Skeleton - Image upload and decimals */}
        <div class={`${containerColForm} !w-[100px]`}>
          {/* Image upload skeleton */}
          <SkeletonImage />

          {/* Decimals input skeleton */}
          <SkeletonInput />
        </div>

        {/* Right Column Skeleton - Token details */}
        <div class={`${containerColForm}`}>
          <div class={`${containerRowForm}`}>
            {/* Ticker name input skeleton */}
            <SkeletonInput width="w-full flex-1" />

            {/* Toggle switch skeleton */}
            <SkeletonToggle />
          </div>

          {/* Supply input skeleton */}
          <SkeletonInput />

          {/* Limit per mint input skeleton */}
          <SkeletonInput />
        </div>
      </SkeletonContainer>
    </div>
  );
}

/* Skeleton loader for SRC20 mint tool */
export function MintToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      <SkeletonContainer>
        {/* Left Column Skeleton - Image upload and decimals */}
        <div class={`${containerColForm} !w-[100px]`}>
          {/* Image upload skeleton */}
          <SkeletonImage />

          {/* Decimals input skeleton */}
          <SkeletonInput />
        </div>

        {/* Right Column Skeleton - Token details */}
        <div class={`${containerColForm}`}>
          <div class={`${containerRowForm}`}>
            {/* Ticker name input skeleton */}
            <SkeletonInput width="w-full flex-1" />

            {/* Toggle switch skeleton */}
            <SkeletonToggle />
          </div>

          {/* Supply input skeleton */}
          <SkeletonInput />

          {/* Limit per mint input skeleton */}
          <SkeletonInput />
        </div>
      </SkeletonContainer>
    </div>
  );
}

/* Skeleton loader for SRC20 transfer tool */
export function TransferToolSkeleton({ className = "" }: SkeletonLoaderProps) {
  return (
    <div class={`space-y-6 ${className}`}>
      <SkeletonContainer>
        <div class={`${containerColForm}`}>
          <div class={`${containerRowForm}`}>
            {/* Ticker name input skeleton */}
            <SkeletonInput width="w-full flex-1" />

            {/* Amount input skeleton */}
            <SkeletonInput width="w-full flex-1" />
          </div>

          {/* Address input skeleton */}
          <SkeletonInput />
        </div>
      </SkeletonContainer>
    </div>
  );
}

/* Skeleton loader for send tool */
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
      <SkeletonContainer height="h-12" width="w-full" rounded="rounded-lg" />

      {/* Action button */}
      <SkeletonButton size="mdR" width="w-full" />
    </div>
  );
}

/* Skeleton loader for register tool (SRC101) */
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
      <SkeletonContainer height="h-12" width="w-full" rounded="rounded-lg" />

      {/* Action button */}
      <SkeletonButton size="mdR" width="w-full" />
    </div>
  );
}
