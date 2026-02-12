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
 */
export function useAutoFocus(
  inputRef: RefObject<HTMLInputElement>,
  autoFocus: boolean,
): void {
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [autoFocus]);
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
