import { ComponentChildren } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface SSRSafeLinkProps {
  href: string;
  children: ComponentChildren;
  class?: string;
  onClick?: (e: MouseEvent) => void;
  /** Use Fresh partial navigation */
  partial?: boolean;
  /** Query parameters to update */
  params?: Record<string, string>;
  /** Query parameters to remove */
  removeParams?: string[];
  /** Scroll to anchor after navigation */
  anchor?: string;
}

/**
 * SSR-safe link component that handles navigation consistently
 * Automatically manages URL construction and partial navigation
 */
export function SSRSafeLink({
  href,
  children,
  class: className,
  onClick,
  partial = true,
  params,
  removeParams,
  anchor,
}: SSRSafeLinkProps) {
  const handleClick = (e: MouseEvent) => {
    if (onClick) {
      onClick(e);
    }

    // Handle dynamic URL construction if params are provided
    if (params || removeParams || anchor) {
      e.preventDefault();

      if (!IS_BROWSER || !globalThis.location) {
        return;
      }

      const url = new URL(href, globalThis.location.href);

      // Update params
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      // Remove params
      if (removeParams) {
        removeParams.forEach((param) => {
          url.searchParams.delete(param);
        });
      }

      // Add anchor
      if (anchor) {
        url.hash = anchor;
      }

      // Navigate with SSR safety check
      if (IS_BROWSER && globalThis.location) {
        globalThis.location.href = url.toString();
      }
    }
  };

  // Build f-partial props for Fresh navigation
  const fPartialProps = partial ? { "f-partial": "/partials" } : {};

  return (
    <a
      href={href}
      class={className}
      onClick={handleClick as any}
      {...fPartialProps}
    >
      {children}
    </a>
  );
}
