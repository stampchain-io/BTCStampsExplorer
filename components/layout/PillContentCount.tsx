/* ===== PILL CONTENT COUNT COMPONENT ===== */
import { containerPillCount } from "$components/layout/styles.ts";
import type { ComponentChildren } from "preact";

/* ===== COMPONENT =====
 * Floating count badge shown above a tab/selector row - reflects only the
 * currently active tab/section's own count. Callers compute
 * the count/label/fallback locally and pass the finished node as `value`;
 * this component only owns the pill's visual style and default position. */
export function PillContentCount({
  value,
  class: customClass,
}: {
  value: ComponentChildren;
  class?: string;
}) {
  return (
    <div
      class={`absolute -top-1 right-0 ${containerPillCount} ${
        customClass ?? ""
      }`}
    >
      {value}
    </div>
  );
}
