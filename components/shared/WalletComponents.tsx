import { ComponentChildren } from "preact";
import {
  alignmentClasses,
  type AlignmentType,
  dataLabel,
  dataLabelSm,
  dataValueSm,
  dataValueXl,
} from "$components/shared/WalletStyles.ts";

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
      <p class={`${dataLabelSm} ${alignmentClass}`}>
        {label}
      </p>
      <p
        class={`${dataValueSm} ${alignmentClass} group-hover:text-stamp-grey transition-colors duration-300`}
      >
        {value}
      </p>
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
      <p class={`${dataLabel} ${alignmentClass}`}>
        {label}
      </p>
      <p
        class={`${dataValueXl} ${alignmentClass} group-hover:text-stamp-grey transition-colors duration-300`}
      >
        {value}
      </p>
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
