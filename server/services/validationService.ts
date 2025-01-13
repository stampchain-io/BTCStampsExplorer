import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export type SortDirection = "ASC" | "DESC";

export interface SortValidationOptions {
  defaultDirection?: SortDirection;
  allowedDirections?: SortDirection[];
}

const DEFAULT_OPTIONS: SortValidationOptions = {
  defaultDirection: "DESC",
  allowedDirections: ["ASC", "DESC"],
};

/**
 * Validates and normalizes sort direction parameter
 * @param sortParam - The sort parameter from URL
 * @param options - Optional configuration for validation
 * @returns Either a Response (for error) or the validated sort direction
 */
export function validateSortDirection(
  sortParam: string | null | undefined,
  options: SortValidationOptions = DEFAULT_OPTIONS,
): Response | SortDirection {
  const { defaultDirection, allowedDirections } = { ...DEFAULT_OPTIONS, ...options };

  // If no sort parameter, return default
  if (!sortParam) {
    return defaultDirection;
  }

  const normalizedSort = sortParam.toUpperCase() as SortDirection;

  // Validate sort direction
  if (!allowedDirections?.includes(normalizedSort)) {
    return ResponseUtil.badRequest(
      `Invalid sort parameter. Must be one of: ${allowedDirections?.join(", ")}`,
    );
  }

  return normalizedSort;
} 