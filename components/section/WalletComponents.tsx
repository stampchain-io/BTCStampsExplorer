/* @baba - move/refactor to layout folder */
import type { StatItemProps, StatTitleProps } from "$types/ui.d.ts";
import { alignmentClasses } from "$layout";
import { labelSm, value3xl, valueSm } from "$text";

export function StatItem({
  label,
  value,
  align = "left",
  class: customClass,
  href,
  target = "_self",
}: StatItemProps) {
  const alignmentClass = alignmentClasses[align];
  const content = (
    <div class={`flex flex-col -space-y-1 ${customClass || ""}`}>
      <h5 class={`${labelSm} ${alignmentClass}`}>
        {label}
      </h5>
      <h6
        class={`${valueSm} ${alignmentClass} group-hover:text-stamp-grey transition-colors duration-300`}
      >
        {value}
      </h6>
    </div>
  );

  return href
    ? (
      <a href={href} target={target} class="group">
        {content}
      </a>
    )
    : content;
}

export function StatTitle({
  label,
  value,
  align = "left",
  href,
  target = "_self",
}: StatTitleProps) {
  const alignmentClass = alignmentClasses[align];
  const content = (
    <div class="flex flex-col -space-y-1">
      <h5 class={`${labelSm} ${alignmentClass}`}>
        {label}
      </h5>
      <h6
        class={`${value3xl} ${alignmentClass} group-hover:text-stamp-grey transition-colors duration-300`}
      >
        {value}
      </h6>
    </div>
  );

  return href
    ? (
      <a href={href} target={target} class="group">
        {content}
      </a>
    )
    : content;
}
