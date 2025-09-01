/* ===== PERFORMANCE UTILITIES COMPONENT ===== */
/*@baba-check styles*/
import { ComponentChildren } from "preact";

interface ContentVisibilityProps {
  children: ComponentChildren;
  priority?: "critical" | "high" | "medium" | "low";
  containIntrinsicSize?: string;
  className?: string;
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Smart content visibility component
 * Provides better perceived performance through strategic content loading
 */
export function OptimizedContent({
  children,
  priority = "medium",
  containIntrinsicSize = "0 200px",
  className = "",
}: ContentVisibilityProps) {
  const getVisibilityStyle = () => {
    switch (priority) {
      case "critical":
        return "content-visibility: visible; contain-intrinsic-size: 0 0;";
      case "high":
        return `content-visibility: auto; contain-intrinsic-size: ${containIntrinsicSize};`;
      case "medium":
        return `content-visibility: auto; contain-intrinsic-size: ${containIntrinsicSize};`;
      case "low":
        return `content-visibility: auto; contain-intrinsic-size: ${containIntrinsicSize}; contain: layout style paint;`;
      default:
        return `content-visibility: auto; contain-intrinsic-size: ${containIntrinsicSize};`;
    }
  };

  return (
    <div
      class={className}
      style={getVisibilityStyle()}
    >
      {children}
    </div>
  );
}

interface LazySectionProps {
  children: ComponentChildren;
  fallbackHeight?: string;
  className?: string;
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Lazy loading section with skeleton
 * Defers rendering of below-fold content until needed
 */
export function LazySection({
  children,
  fallbackHeight = "400px",
  className = "",
}: LazySectionProps) {
  return (
    <div
      class={className}
      style={{
        "content-visibility": "auto",
        "contain-intrinsic-size": `0 ${fallbackHeight}`,
        "contain": "layout style paint",
      }}
    >
      {children}
    </div>
  );
}

interface CriticalResourceProps {
  href: string;
  as: "style" | "script" | "font" | "image";
  rel?: string;
  type?: string;
  media?: string;
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Critical resource preloader
 * Ensures critical resources are loaded early for better LCP
 */
export function CriticalResource({
  href,
  as,
  rel = "preload",
  type,
  media,
}: CriticalResourceProps) {
  const props: any = {
    rel,
    href,
    as,
  };

  if (type) props.type = type;
  if (media) props.media = media;

  return <link {...props} />;
}

/**
 * 🚀 PERFORMANCE OPTIMIZATION: Resource hints for external domains
 * Reduces DNS lookup time and connection establishment
 */
export function ResourceHints() {
  return (
    <>
      {/* DNS prefetch for external APIs */}
      <link rel="dns-prefetch" href="//stampchain.io" />
      <link rel="dns-prefetch" href="//dev.stampchain.io" />

      {/* Preconnect for critical external resources */}
      <link rel="preconnect" href="https://esm.sh" crossorigin="anonymous" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
      />
    </>
  );
}
