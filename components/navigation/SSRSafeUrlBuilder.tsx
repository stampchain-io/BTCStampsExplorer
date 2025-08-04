import { IS_BROWSER } from "$fresh/runtime.ts";

interface UrlBuilderProps {
  baseUrl?: string;
  params?: Record<string, string | number | boolean | undefined>;
  removeParams?: string[];
  anchor?: string;
}

/**
 * SSR-safe URL building utility component
 * Provides consistent URL manipulation across the codebase
 */
export class SSRSafeUrlBuilder {
  private url: URL;

  constructor(props: UrlBuilderProps = {}) {
    if (IS_BROWSER && globalThis.location && !props.baseUrl) {
      this.url = new URL(globalThis.location.href);
    } else {
      this.url = new URL(props.baseUrl || "/", "http://localhost");
    }

    // Apply params
    if (props.params) {
      Object.entries(props.params).forEach(([key, value]) => {
        if (value !== undefined) {
          this.url.searchParams.set(key, String(value));
        }
      });
    }

    // Remove params
    if (props.removeParams) {
      props.removeParams.forEach((param) => {
        this.url.searchParams.delete(param);
      });
    }

    // Set anchor
    if (props.anchor) {
      this.url.hash = props.anchor;
    }
  }

  /**
   * Add or update URL parameters
   */
  setParam(key: string, value: string | number | boolean): SSRSafeUrlBuilder {
    this.url.searchParams.set(key, String(value));
    return this;
  }

  /**
   * Remove URL parameters
   */
  deleteParam(key: string): SSRSafeUrlBuilder {
    this.url.searchParams.delete(key);
    return this;
  }

  /**
   * Set anchor/hash
   */
  setAnchor(anchor: string): SSRSafeUrlBuilder {
    this.url.hash = anchor;
    return this;
  }

  /**
   * Get the built URL string
   */
  toString(): string {
    return this.url.toString();
  }

  /**
   * Get the URL object
   */
  toURL(): URL {
    return new URL(this.url);
  }

  /**
   * Navigate to the built URL
   */
  navigate(options?: { replace?: boolean }): void {
    if (!IS_BROWSER || !globalThis.location) return;

    const url = this.toString();
    if (options?.replace) {
      globalThis.location.replace(url);
    } else {
      globalThis.location.href = url;
    }
  }

  /**
   * Static factory method for current URL
   */
  static fromCurrent(): SSRSafeUrlBuilder {
    return new SSRSafeUrlBuilder();
  }

  /**
   * Static factory method with base URL
   */
  static fromUrl(url: string): SSRSafeUrlBuilder {
    return new SSRSafeUrlBuilder({ baseUrl: url });
  }
}

/**
 * Helper function for quick URL building
 */
export function buildSSRSafeUrl(props: UrlBuilderProps): string {
  return new SSRSafeUrlBuilder(props).toString();
}
