import { BREAKPOINTS } from "../utils/constants.ts";
import { useWindowSize } from "./useWindowSize.ts";

type Breakpoints = "desktop" | "tablet" | "mobileLg" | "mobileMd" | "mobileSm";

export function useBreakpoints() {
  const size = useWindowSize();
  function isMobile() {
    return size.width < BREAKPOINTS.tablet;
  }
  function isLessThan(breakpoint: Breakpoints) {
    return size.width < BREAKPOINTS[breakpoint];
  }
  function isGreaterThan(breakpoint: Breakpoints) {
    return size.width >= BREAKPOINTS[breakpoint];
  }
  function isBetween(start: Breakpoints, end: Breakpoints) {
    return size.width >= BREAKPOINTS[start] && size.width < BREAKPOINTS[end];
  }

  let breakpoint = "mobileSm";
  if (size.width >= BREAKPOINTS.desktop) {
    breakpoint = "desktop";
  } else if (size.width >= BREAKPOINTS.tablet) {
    breakpoint = "tablet";
  } else if (size.width >= BREAKPOINTS.mobileLg) {
    breakpoint = "mobileLg";
  } else if (size.width >= BREAKPOINTS.mobileMd) {
    breakpoint = "mobileMd";
  }

  return {
    breakpoint,
    isMobile,
    isLessThan,
    isGreaterThan,
    isBetween,
  };
}
