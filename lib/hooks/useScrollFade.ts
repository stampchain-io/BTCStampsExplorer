import { useEffect, useRef, useState } from "preact/hooks";

// Ignores negligible/decorative *end* overflow — e.g. a hidden tooltip
// (opacity-0, pointer-events-none) absolutely positioned past its icon's
// edge still contributes to scrollWidth even though nothing is visibly cut
// off — so the right fade only appears when content is genuinely cut off
// and worth scrolling for. scrollLeft itself is a real, reliable measure of
// scroll progress (not affected by that artifact), so the left fade doesn't
// need the same tolerance.
const RIGHT_OVERFLOW_TOLERANCE_PX = 6;
const LEFT_SCROLL_TOLERANCE_PX = 0;

/**
 * Tracks horizontal scroll position of a row so edge fade masks can be
 * shown only while there is actually more content to scroll to in that
 * direction. Recomputes on mount, on scroll, and whenever the row's size
 * or content changes (e.g. option count changing with active tab).
 */
export function useScrollFade<T extends HTMLElement = HTMLDivElement>(
  deps: unknown[] = [],
) {
  const rowRef = useRef<T>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollFade = () => {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollLeft(row.scrollLeft > LEFT_SCROLL_TOLERANCE_PX);
    setCanScrollRight(
      row.scrollWidth - row.clientWidth - row.scrollLeft >
        RIGHT_OVERFLOW_TOLERANCE_PX,
    );
  };

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    updateScrollFade();
    const observer = new ResizeObserver(updateScrollFade);
    observer.observe(row);
    return () => observer.disconnect();
  }, deps);

  return { rowRef, canScrollLeft, canScrollRight, updateScrollFade };
}
