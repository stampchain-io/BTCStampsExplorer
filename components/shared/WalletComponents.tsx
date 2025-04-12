import { ComponentChildren } from "preact";
import { alignmentClasses, type AlignmentType } from "$layout";
import { labelLg, labelSm, valueSm, valueXl } from "$text";

interface StatBaseProps {
  label: string | ComponentChildren;
  value: string | ComponentChildren;
  align?: AlignmentType;
}

interface StatItemProps extends StatBaseProps {
  class?: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

interface StatTitleProps extends StatBaseProps {
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

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
      <h5 class={`${labelLg} ${alignmentClass}`}>
        {label}
      </h5>
      <h6
        class={`${valueXl} ${alignmentClass} group-hover:text-stamp-grey transition-colors duration-300`}
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
