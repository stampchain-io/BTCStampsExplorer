/* ===== PLACEHOLDER IMAGE ICON COMPONENT ===== */
import {
  placeholderBasePaths,
  placeholderTextPaths,
} from "$components/icon/paths.ts";
import {
  placeholderPalette,
  PlaceholderVariant,
} from "$components/icon/styles.ts";
import { JSX } from "preact/jsx-runtime";

type Props = {
  variant: PlaceholderVariant; // required: "no-image" | "audio" | "library" | "error"
  className?: string; // extra wrapper classes
  strokeWidth?: number; // default 0.5, should be the same as the LoadingIcon
};

export function PlaceholderImage({
  variant,
  className = "",
  strokeWidth = 0.5,
}: Props): JSX.Element {
  const { bg, stroke, fill } = placeholderPalette(variant);

  return (
    <div
      class={`p-[25%] w-full h-full rounded-2xl aspect-square ${bg} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        class="w-full h-full"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        {/* Base paths use stroke, no fill */}
        {placeholderBasePaths.map((d, i) => (
          <path
            d={d}
            key={`b-${i}`}
            class={`${stroke} fill-none`}
            stroke-width={strokeWidth}
          />
        ))}
        {/* Text path uses fill, no stroke */}
        <path
          d={placeholderTextPaths[variant]}
          class={`${fill} stroke-none`}
        />
      </svg>
    </div>
  );
}
