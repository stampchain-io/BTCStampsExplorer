import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";

export type SortDirection = "ASC" | "DESC";

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  error?: Response;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  requiredFields?: string[];
}

// Re-export DEFAULT_PAGINATION from $constants
export { DEFAULT_PAGINATION } from "$constants";

/**
 * Validates required path parameters
 * @param params Object containing parameters to validate
 * @returns ValidationResult with error response if validation fails
 */
export function validateRequiredParams(
  params: Record<string, string | undefined>,
): ValidationResult<Record<string, string>> {
  const missingParams = Object.entries(params)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingParams.length > 0) {
    return {
      isValid: false,
      error: ApiResponseUtil.badRequest(
        `Missing required parameters: ${missingParams.join(", ")}`,
      ),
    };
  }

  return {
    isValid: true,
    data: params as Record<string, string>,
  };
}

/**
 * Validates sort parameter for SRC-20 endpoints with operation-specific restrictions
 * @param url URL object containing search parameters
 * @param operation The SRC-20 operation type (DEPLOY, MINT, TRANSFER)
 * @param paramName Name of the sort parameter (default: "sortBy")
 * @returns ValidationResult with validated sort direction or error response
 */
export function validateSRC20SortParam(
  url: URL,
  operation?: string,
  paramName = "sortBy",
): ValidationResult<string> {
  const sortParam = url.searchParams.get(paramName);

  // If no sort parameter, return default
  if (!sortParam) {
    return {
      isValid: true,
      data: "DESC",
    };
  }

  const normalizedSort = sortParam.toUpperCase();
  const normalizedOp = operation?.toUpperCase();

  // Basic sorting (always valid)
  const basicSortValues = [
    "ASC", "DESC", // Basic sorting
    "DEPLOY_DESC", "DEPLOY_ASC", // Deploy date (block_index)
    "BLOCK_DESC", "BLOCK_ASC", // Block index
    "TICK_DESC", "TICK_ASC", // Alphabetical by tick name
    "CREATOR_DESC", "CREATOR_ASC", // Sort by creator
  ];

  // DEPLOY-only sorting (requires market data and token metrics)
  const deployOnlySortValues = [
    "HOLDERS_DESC", "HOLDERS_ASC", // Holder count sorting
    // Market Data Sorting (DEPLOY only)
    "MARKET_CAP_DESC", "MARKET_CAP_ASC", // Market cap (BTC)
    "VALUE_DESC", "VALUE_ASC", // Floor price / market value
    "PRICE_DESC", "PRICE_ASC", // Alias for value
    "VOLUME_24H_DESC", "VOLUME_24H_ASC", // 24h trading volume
    "VOLUME_7D_DESC", "VOLUME_7D_ASC", // 7d trading volume
    "VOLUME_30D_DESC", "VOLUME_30D_ASC", // 30d trading volume
    "CHANGE_24H_DESC", "CHANGE_24H_ASC", // 24h price change %
    "CHANGE_7D_DESC", "CHANGE_7D_ASC", // 7d price change %
    // Token Metrics Sorting (DEPLOY only) - CIRCULATING removed
    "SUPPLY_DESC", "SUPPLY_ASC", // Max supply
    "PROGRESS_DESC", "PROGRESS_ASC", // Mint progress %
    "LIMIT_DESC", "LIMIT_ASC", // Mint limit per tx
    "DECIMALS_DESC", "DECIMALS_ASC", // Token decimals
    // 🚀 NEW V2.3 TRENDING AND MINT VELOCITY SORTING
    "TRENDING_MINTING_DESC", "TRENDING_MINTING_ASC", // Trending mint activity (percentage-based)
    "MINT_VELOCITY_DESC", "MINT_VELOCITY_ASC", // Mint velocity (mints per hour)
    "TRENDING_24H_DESC", "TRENDING_24H_ASC", // 24h trending activity
    "TRENDING_7D_DESC", "TRENDING_7D_ASC", // 7d trending activity
    "TRENDING_30D_DESC", "TRENDING_30D_ASC", // 30d trending activity
  ];

  // MINT/TRANSFER specific sorting
  const mintTransferSortValues = [
    "AMOUNT_DESC", "AMOUNT_ASC", // Transaction amount
    "RECENT_DESC", "RECENT_ASC", // Recent activity
  ];

  // Combine valid values based on operation
  let validSortValues = [...basicSortValues];

  if (normalizedOp === "DEPLOY") {
    validSortValues = [...basicSortValues, ...deployOnlySortValues];
  } else if (normalizedOp === "MINT" || normalizedOp === "TRANSFER") {
    validSortValues = [...basicSortValues, ...mintTransferSortValues];
  } else {
    // No operation specified - allow all for backward compatibility
    validSortValues = [...basicSortValues, ...deployOnlySortValues, ...mintTransferSortValues];
  }

  // Validate sort parameter
  if (!validSortValues.includes(normalizedSort)) {
    const operationNote = normalizedOp ? ` for ${normalizedOp} operations` : "";
    return {
      isValid: false,
      error: ApiResponseUtil.badRequest(
        `Invalid sort parameter${operationNote}. Must be one of: ${validSortValues.join(", ")}`,
      ),
    };
  }

  return {
    isValid: true,
    data: normalizedSort,
  };
}

/**
 * Validates sort parameter and returns appropriate response
 * @param url URL object containing search params
 * @param paramName Name of the sort parameter (default: "sort")
 * @returns ValidationResult with validated sort direction or error response
 */
export function validateSortParam(
  url: URL,
  paramName = "sort",
): ValidationResult<string> {
  const sortParam = url.searchParams.get(paramName);

  // If no sort parameter, return default
  if (!sortParam) {
    return {
      isValid: true,
      data: "DESC",
    };
  }

  const normalizedSort = sortParam.toUpperCase();

  // Extended validation for SRC-20 advanced sorting
  const validSortValues = [
    "ASC", "DESC", // Basic sorting
    "HOLDERS_DESC", "HOLDERS_ASC", // Holder count sorting
    // Market Data Sorting
    "MARKET_CAP_DESC", "MARKET_CAP_ASC", // Market cap (BTC)
    "VALUE_DESC", "VALUE_ASC", // Floor price / market value
    "PRICE_DESC", "PRICE_ASC", // Alias for value
    "VOLUME_24H_DESC", "VOLUME_24H_ASC", // 24h trading volume
    "VOLUME_7D_DESC", "VOLUME_7D_ASC", // 7d trading volume
    "VOLUME_30D_DESC", "VOLUME_30D_ASC", // 30d trading volume
    "CHANGE_24H_DESC", "CHANGE_24H_ASC", // 24h price change %
    "CHANGE_7D_DESC", "CHANGE_7D_ASC", // 7d price change %
    // Token Metrics Sorting - CIRCULATING removed
    "SUPPLY_DESC", "SUPPLY_ASC", // Max supply
    "PROGRESS_DESC", "PROGRESS_ASC", // Mint progress %
    "LIMIT_DESC", "LIMIT_ASC", // Mint limit per tx
    "DECIMALS_DESC", "DECIMALS_ASC", // Token decimals
    // Activity & Time Sorting
    "DEPLOY_DESC", "DEPLOY_ASC", // Deploy date (block_index)
    "RECENT_DESC", "RECENT_ASC", // Recent activity
    "BLOCK_DESC", "BLOCK_ASC", // Block index
    // Alphabetical Sorting
    "TICK_DESC", "TICK_ASC", // Alphabetical by tick name
    "CREATOR_DESC", "CREATOR_ASC", // Sort by creator
  ];

  // Validate sort parameter
  if (!validSortValues.includes(normalizedSort)) {
    return {
      isValid: false,
      error: ApiResponseUtil.badRequest(
        `Invalid sort parameter. Must be one of: ${validSortValues.join(", ")}`,
      ),
    };
  }

  return {
    isValid: true,
    data: normalizedSort,
  };
}

/**
 * Checks if result is empty and returns appropriate response
 * @param result Result to check
 * @param context Optional context for error message
 * @returns Response if empty, undefined if not empty
 */
export function checkEmptyResult(
  result: unknown,
  context = "data",
): Response | undefined {
  if (!result || (typeof result === "object" && Object.keys(result).length === 0)) {
    console.log(`Empty result received for ${context}:`, result);
    return ApiResponseUtil.notFound(`No ${context} found`);
  }
  return undefined;
}

/**
 * Validates file upload request
 * @param body Request body
 * @param options Validation options
 * @returns ValidationResult with validated data or error response
 */
export function validateFileUpload(
  body: Record<string, unknown>,
  options: FileValidationOptions = {},
): ValidationResult<Record<string, unknown>> {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
    requiredFields = [],
  } = options;

  // Check required fields
  const missingFields = requiredFields.filter((field) => !body[field]);
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: ApiResponseUtil.badRequest(
        `Missing required fields: ${missingFields.join(", ")}`,
      ),
    };
  }

  // Check file data if present
  if (body.fileData) {
    const fileData = String(body.fileData);

    // Check file size
    const base64Data = fileData.includes(";base64,")
      ? fileData.split(";base64,")[1]
      : fileData;
    const sizeInBytes = (base64Data.length * 3) / 4; // Base64 size estimation
    if (sizeInBytes > maxSizeBytes) {
      return {
        isValid: false,
        error: ApiResponseUtil.badRequest(
          `File size exceeds maximum allowed size of ${maxSizeBytes} bytes`,
        ),
      };
    }

    // Check mime type if present in data URL format
    if (fileData.includes(";base64,")) {
      const mimeType = fileData.split(";")[0].split(":")[1];
      if (!allowedMimeTypes.includes(mimeType)) {
        return {
          isValid: false,
          error: ApiResponseUtil.badRequest(
            `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
          ),
        };
      }
    }
  }

  return {
    isValid: true,
    data: body,
  };
}
