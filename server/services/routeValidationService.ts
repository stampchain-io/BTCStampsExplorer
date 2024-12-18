import { ResponseUtil } from "$lib/utils/responseUtil.ts";

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

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  limit: 50,
  page: 1,
} as const;

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
      error: ResponseUtil.badRequest(
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
  const normalizedSort = sortParam?.toUpperCase() as SortDirection;

  // If no sort parameter, return default
  if (!sortParam) {
    return {
      isValid: true,
      data: "DESC",
    };
  }

  // Validate sort direction
  if (!["ASC", "DESC"].includes(normalizedSort)) {
    return {
      isValid: false,
      error: ResponseUtil.badRequest(
        `Invalid sort parameter. Must be one of: ASC, DESC`,
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
    return ResponseUtil.notFound(`No ${context} found`);
  }
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
      error: ResponseUtil.badRequest(
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
        error: ResponseUtil.badRequest(
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
          error: ResponseUtil.badRequest(
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