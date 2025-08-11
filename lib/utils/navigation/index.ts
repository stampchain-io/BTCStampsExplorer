/**
 * Barrel export for navigation utilities
 *
 * This file re-exports all utilities from this directory
 * to provide clean import paths and enable tree-shaking.
 */

export * from "./freshNavigationUtils.ts";

// Explicitly export the new pagination handler for clarity
export { createFreshPaginationHandler } from "./freshNavigationUtils.ts";
