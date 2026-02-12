/**
 * Shared hooks and helpers for search modals
 *
 * Used by SearchStampModal and SearchSRC20Modal.
 *
 * @module searchHooks
 */
import { useEffect } from "preact/hooks";
import type { RefObject } from "preact";

/**
 * Auto-focus an input element after mount.
 * Works on both fresh mounts and component reuse
 * (e.g. when modal reopens before the close animation
 * finishes).
 */
export function useAutoFocus(
  inputRef: RefObject<HTMLInputElement>,
  autoFocus: boolean,
): void {
  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [autoFocus]);
}

/**
 * Schedule focus on the search input after the modal
 * renders.  Queries the DOM directly via a data attribute
 * so it works regardless of ref wiring or component
 * mount/reuse lifecycle.
 */
export function scheduleFocus(): void {
  let attempts = 0;
  const tryFocus = () => {
    const el = document.querySelector<HTMLInputElement>(
      "[data-search-input]",
    );
    if (el) {
      el.focus();
      return;
    }
    if (++attempts < 10) {
      requestAnimationFrame(tryFocus);
    }
  };
  requestAnimationFrame(tryFocus);
}

/**
 * Execute a search callback after a debounce delay whenever
 * `searchTerm` changes.
 */
export function useDebouncedSearch(
  searchTerm: string,
  onSearch: () => void,
  delay = 300,
): void {
  useEffect(() => {
    if (!searchTerm.trim()) return;

    const timer = setTimeout(() => {
      onSearch();
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm]);
}

/**
 * SSR-safe navigation helper.
 * Returns `false` when running outside a browser environment.
 */
export function navigateSSRSafe(url: string): boolean {
  if (typeof globalThis === "undefined" || !globalThis?.location) {
    return false;
  }
  globalThis.location.href = url;
  return true;
}
