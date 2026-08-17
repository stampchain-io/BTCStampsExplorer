/* ===== SHARED EMPTY STATE COMPONENT ===== */
// Reused across wallet/explorer/marketplace/stamp overview pages so the
// icon + copy + container styling for "no results" states stays in one
// place. Import concrete modules (not the `$layout`/`$icon` barrels) to
// avoid circular re-export chains (icon barrel -> LoadingIcon -> $layout).
import { Icon } from "$components/icon/IconBase.tsx";
import type { IconVariants } from "$components/icon/styles.ts";
import {
  colContainerBackground,
  rowContainerBackground,
} from "$components/layout/styles.ts";
import { valueDarkSm } from "$text";

/* ===== TYPES ===== */
export interface EmptyStateProps {
  label: string;
  icon?: IconVariants["name"] | IconVariants["name"][];
  className?: string;
}

/* ===== COMPONENT ===== */
export function EmptyState({ label, icon, className = "" }: EmptyStateProps) {
  const icons = icon ? (Array.isArray(icon) ? icon : [icon]) : [];

  return (
    <div
      class={`${
        icons.length ? colContainerBackground : rowContainerBackground
      } ${className}`}
    >
      {icons.length > 0 && (
        <div class="flex items-center gap-2">
          {icons.map((iconName) => (
            <Icon
              key={iconName}
              type="icon"
              name={iconName}
              weight="custom"
              size="custom"
              color="grey"
              className="w-20 h-20 flex-shrink-0 [stroke-width:0.35]"
            />
          ))}
        </div>
      )}
      <h6 class={`${valueDarkSm} mb-1`}>{label}</h6>
    </div>
  );
}
