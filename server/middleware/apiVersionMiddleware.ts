import { logger } from "$lib/utils/monitoring/logging/logger.ts";

// Use any types to avoid Fresh version compatibility issues
type Context = any;
type Next = any;

/**
 * API Version Middleware
 *
 * Handles API version headers and manages version-specific transformations
 * Supports semantic versioning (e.g., 2.2, 2.3) through API-Version header
 *
 * Task 4.1: Implement API Version Header Middleware and Validation
 */

export interface VersionConfig {
  supportedVersions: string[];
  defaultVersion: string;
  deprecatedVersions: string[];
  versionEndOfLife: Record<string, string>; // version -> EOL date
}

// Version configuration
export const VERSION_CONFIG: VersionConfig = {
  supportedVersions: ["2.2", "2.3"],
  defaultVersion: "2.3", // Latest version by default
  deprecatedVersions: ["2.1"],
  versionEndOfLife: {
    "2.1": "2025-06-01",
    "2.2": "2025-12-01"
  }
};

// ✅ ENDPOINT DEPRECATION CONFIGURATION
// Endpoints that are deprecated in specific versions
export const DEPRECATED_ENDPOINTS: Record<string, {
  deprecatedInVersion: string;
  reason: string;
  alternative: string;
  endOfLife: string;
}> = {
  "/api/v2/cursed": {
    deprecatedInVersion: "2.3",
    reason: "Redundant endpoint - use /api/v2/stamps with type=cursed filter instead",
    alternative: "/api/v2/stamps?type=cursed",
    endOfLife: "2025-12-01"
  },
  "/api/v2/cursed/": {
    deprecatedInVersion: "2.3",
    reason: "Redundant endpoint - use /api/v2/stamps with type=cursed filter instead",
    alternative: "/api/v2/stamps?type=cursed",
    endOfLife: "2025-12-01"
  }
};

// Helper function to check if an endpoint is deprecated in a specific version
export function isEndpointDeprecated(pathname: string, version: string): boolean {
  // Check exact matches and path patterns
  for (const [deprecatedPath, config] of Object.entries(DEPRECATED_ENDPOINTS)) {
    if (pathname.startsWith(deprecatedPath) || pathname === deprecatedPath) {
      // Check if the endpoint is deprecated in this version or later
      const deprecatedVersion = config.deprecatedInVersion;
      return version >= deprecatedVersion;
    }
  }
  return false;
}

// Get deprecation info for an endpoint
export function getEndpointDeprecationInfo(pathname: string) {
  for (const [deprecatedPath, config] of Object.entries(DEPRECATED_ENDPOINTS)) {
    if (pathname.startsWith(deprecatedPath) || pathname === deprecatedPath) {
      return config;
    }
  }
  return null;
}

// Fields added in each version
const VERSION_FIELDS: Record<string, string[]> = {
  "2.3": [
      // v2.3 Enhanced Schema - Nested market data object (CLEAN structure)
      "market_data", // ✅ FIXED: Use snake_case to match actual API field names
    "dispenserInfo",
    "cacheStatus",
    "cacheInfo",
    "holderCount",
    "uniqueHolderCount",
    "dataQualityScore",
    "priceSource",
    "fee_rate_sat_vb", // v2.3+ transaction fee rate (transaction endpoints only)
    "fee", // v2.3+ transaction fee (transaction endpoints only)
    // ✅ v2.3 IMAGE FIELDS: Add image-related fields that should be stripped from v2.2
    "stamp_url", // Image URL for SRC-20 tokens (v2.3+ only)
    "deploy_img", // Deploy image URL for SRC-20 tokens (v2.3+ only)
  ],
  "2.2": [] // Base version - no market data fields at all
};

// Fields that should be REMOVED in specific versions (for root-level price cleanup)
const VERSION_FIELDS_TO_REMOVE: Record<string, string[]> = {
  "2.3": [
    "floorPrice", // Moved to marketData.floorPriceBTC
    "floorPriceUSD", // Moved to marketData.floorPriceUSD
    "marketCapUSD" // Moved to marketData calculation
  ],
  "2.2": [] // Base version - no removals needed
};

export interface VersionContext {
  version: string;
  isDeprecated: boolean;
  endOfLife?: string;
  enhancedFields: string[];
}

/**
 * Parse API version from request headers
 */
function parseApiVersion(headers: Headers): string {
  const versionHeader = headers.get("api-version") ||
                       headers.get("x-api-version") ||
                       headers.get("accept-version");

  if (!versionHeader) {
    return VERSION_CONFIG.defaultVersion;
  }

  // Extract major.minor version (ignore patch)
  const versionMatch = versionHeader.match(/^(\d+\.\d+)/);
  if (!versionMatch) {
    logger.warn("api", { message: `Invalid API version format: ${versionHeader}` });
    return VERSION_CONFIG.defaultVersion;
  }

  const requestedVersion = versionMatch[1];

  // Check if version is supported
  if (!VERSION_CONFIG.supportedVersions.includes(requestedVersion)) {
    logger.warn("api", { message: `Unsupported API version requested: ${requestedVersion}` });
    return VERSION_CONFIG.defaultVersion;
  }

  return requestedVersion;
}

/**
 * Get version context including deprecation status and available fields
 */
function getVersionContext(version: string): VersionContext {
  const isDeprecated = VERSION_CONFIG.deprecatedVersions.includes(version);
  const endOfLife = VERSION_CONFIG.versionEndOfLife[version];

  // Get all fields available for this version
  const enhancedFields: string[] = [];
  const versionNum = parseFloat(version);

  for (const [v, fields] of Object.entries(VERSION_FIELDS)) {
    if (parseFloat(v) <= versionNum) {
      enhancedFields.push(...fields);
    }
  }

  return {
    version,
    isDeprecated,
    endOfLife,
    enhancedFields
  };
}

/**
 * API Version Middleware
 *
 * Adds version information to request state and response headers
 */
export async function apiVersionMiddleware(
  ctx: Context,
  next: Next
): Promise<Response> {
  const { req, state } = ctx;

  // Handle case where req might be undefined
  let headers: Headers;
  if (req && req.headers) {
    headers = req.headers;
  } else if (ctx.state.request && ctx.state.request.headers) {
    headers = ctx.state.request.headers;
  } else {
    logger.warn("api", {
      message: "Request object or headers missing in apiVersionMiddleware",
      contextKeys: Object.keys(ctx),
      stateKeys: Object.keys(ctx.state || {})
    });
    // Use empty headers as fallback
    headers = new Headers();
  }

  // Parse API version from headers
  const version = parseApiVersion(headers);
  const versionContext = getVersionContext(version);

  // Store version context in state for downstream use
  state.apiVersion = version;
  state.versionContext = versionContext;

  // Log version usage
  const requestUrl = req?.url || ctx.state.request?.url || "unknown";
  logger.info("api", {
    message: `API request with version ${version}`,
    path: requestUrl,
    deprecated: versionContext.isDeprecated
  });

  // Process request
  const response = await next();

  // Add version headers to response
  response.headers.set("API-Version", version);
  response.headers.set("API-Version-Supported", VERSION_CONFIG.supportedVersions.join(", "));

  // Add deprecation warning if applicable
  if (versionContext.isDeprecated) {
    response.headers.set("Deprecation", "true");
    response.headers.set("Sunset", versionContext.endOfLife || "");
    response.headers.set(
      "Link",
      `<https://stampchain.io/docs/api/migration>; rel="deprecation"`
    );

    logger.warn("api", {
      message: `Deprecated API version ${version} used`,
      endOfLife: versionContext.endOfLife
    });
  }

  // Add version info to response headers for debugging
  response.headers.set("X-API-Version-Used", version);
  response.headers.set("X-API-Version-Default", VERSION_CONFIG.defaultVersion);

  return response;
}

/**
 * Get fields that should be stripped for a specific version
 */
export function getFieldsToStrip(version: string): Set<string> {
  const versionNum = parseFloat(version);
  const fieldsToStrip = new Set<string>();

  // Add fields from newer versions that should be stripped
  for (const [v, fields] of Object.entries(VERSION_FIELDS)) {
    if (parseFloat(v) > versionNum) {
      fields.forEach(field => fieldsToStrip.add(field));
    }
  }

  // Add fields that should be specifically removed for this version
  const fieldsToRemove = VERSION_FIELDS_TO_REMOVE[version];
  if (fieldsToRemove) {
    fieldsToRemove.forEach(field => fieldsToStrip.add(field));
  }

  return fieldsToStrip;
}

/**
 * Version validation helper for use in route handlers
 */
export function validateVersionSupport(
  version: string,
  requiredVersion?: string
): { valid: boolean; message?: string } {
  if (!VERSION_CONFIG.supportedVersions.includes(version)) {
    return {
      valid: false,
      message: `API version ${version} is not supported. Supported versions: ${VERSION_CONFIG.supportedVersions.join(", ")}`
    };
  }

  if (requiredVersion && parseFloat(version) < parseFloat(requiredVersion)) {
    return {
      valid: false,
      message: `This endpoint requires API version ${requiredVersion} or higher. You are using version ${version}.`
    };
  }

  return { valid: true };
}

/**
 * Middleware to enforce minimum version for specific endpoints
 */
export function requireApiVersion(minVersion: string) {
  return async (ctx: Context, next: Next): Promise<Response> => {
    const version = ctx.state.apiVersion || VERSION_CONFIG.defaultVersion;
    const validation = validateVersionSupport(version, minVersion);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: validation.message,
          supportedVersions: VERSION_CONFIG.supportedVersions
        }),
        {
          status: 406, // Not Acceptable
          headers: {
            "Content-Type": "application/json",
            "API-Version": version,
            "API-Version-Required": minVersion
          }
        }
      );
    }

    return await next();
  };
}
