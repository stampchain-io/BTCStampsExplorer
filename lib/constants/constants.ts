import { ROOT_DOMAIN_TYPES } from "$types/base.d.ts";

/* ===== BREAKPOINTS ===== */
export const BREAKPOINTS = {
  desktop: 1440,
  tablet: 1024,
  mobileLg: 768,
  mobileMd: 568,
  mobileSm: 360,
};

/* ===== FEE CONSTANTS ===== */
export const MIN_FEE_RATE_SATS_PER_VB = 0.1; // Minimum allowed fee rate in sats/vB

/* ===== CAROUSEL STAMPS ===== */
// Update constants.test.ts to reflect these defs
export const CAROUSEL_STAMP_IDS = [
  42158,
  336082,
  57356,
  1163993,
  74607,
];

/* ===== TOP LEVEL DOMAINS - FOR BITNAME ===== */
export const ROOT_DOMAINS: ROOT_DOMAIN_TYPES[] = [
  ".btc",
  ".sats",
  ".xbt",
  ".x",
  ".pink",
];
