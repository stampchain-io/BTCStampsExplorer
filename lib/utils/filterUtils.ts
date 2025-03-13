import { useRef } from "preact/hooks";

/**
 * Creates a debounced version of a callback function
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<number | null>(null);

  function debouncedCallback(...args: Parameters<T>) {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }

  return debouncedCallback;
}
