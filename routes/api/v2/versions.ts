import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "../../../lib/utils/apiResponseUtil.ts";
import { VERSION_CONFIG } from "../../../server/middleware/apiVersionMiddleware.ts";

/**
 * API Version Discovery Endpoint
 *
 * GET /api/v2/versions - Returns available API versions and their status
 * GET /api/v2/versions/changelog - Returns version changelog
 */

const CHANGELOG = [
  {
    version: "2.3.0",
    releaseDate: "2025-01-15",
    status: "current",
    changes: {
      added: [
        "marketData object with floor price and volume information",
        "dispenserInfo for stamp dispenser statistics",
        "cacheStatus to indicate data freshness",
        "holderCount and uniqueHolderCount fields",
        "Advanced market data filtering parameters",
        "dataQualityScore for data reliability metrics",
        "from_timestamp and to_timestamp query parameters for date filtering (validation only)",
      ],
      improved: [
        "Response performance with intelligent caching",
        "Pagination consistency across all endpoints",
        "List query performance by excluding stamp_base64 field from list responses",
        "Input validation for ident parameter to return empty results for invalid values",
        "Security validation for SQL injection attempts in SRC101 endpoints",
        "XSS detection in address-related endpoints",
        "Transaction hash format validation requiring 64-character hex strings",
      ],
      optimized: [
        "stamp_base64 field is now excluded from list endpoints for 50-70% smaller responses",
        "stamp_base64 remains available in single stamp detail endpoints (/stamps/[identifier])",
      ],
      fixed: [],
      deprecated: [],
      removed: [
        "floorPrice, floorPriceUSD, marketCapUSD moved into marketData object in stamp detail endpoints",
      ],
      migrationGuide: "https://stampchain.io/docs/api/migration/v2.2-to-v2.3",
    },
  },
  {
    version: "2.2.0",
    releaseDate: "2024-06-01",
    status: "supported",
    endOfLife: "2025-12-01",
    changes: {
      added: [
        "SRC-101 token support",
        "Collections endpoints",
        "Cursed stamps functionality",
      ],
      improved: [
        "Error handling and response formats",
        "Query parameter validation",
      ],
      fixed: [
        "Pagination limit enforcement",
        "SQL injection vulnerabilities",
      ],
      deprecated: [],
    },
  },
  {
    version: "2.1.0",
    releaseDate: "2024-01-01",
    status: "deprecated",
    endOfLife: "2025-06-01",
    changes: {
      added: [
        "Initial SRC-20 token endpoints",
        "Basic stamp management",
      ],
      improved: [],
      fixed: [],
      deprecated: [
        "Legacy stamp format endpoints",
      ],
    },
  },
];

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Changelog endpoint
    if (path.endsWith("/changelog")) {
      return ApiResponseUtil.success({
        changelog: CHANGELOG,
        currentVersion: VERSION_CONFIG.defaultVersion,
        deprecationPolicy: {
          notice: "6 months",
          support: "12 months after deprecation",
        },
      });
    }

    // Version discovery endpoint
    const currentVersion = ctx.state.apiVersion ||
      VERSION_CONFIG.defaultVersion;

    const versions = VERSION_CONFIG.supportedVersions.map((version) => {
      const changelogEntry = CHANGELOG.find((entry) =>
        entry.version.startsWith(version)
      );
      const isDeprecated = VERSION_CONFIG.deprecatedVersions.includes(version);
      const endOfLife = VERSION_CONFIG.versionEndOfLife[version];

      return {
        version,
        status: version === VERSION_CONFIG.defaultVersion
          ? "current"
          : isDeprecated
          ? "deprecated"
          : "supported",
        releaseDate: changelogEntry?.releaseDate,
        endOfLife,
        links: {
          documentation: `https://stampchain.io/docs/api/v${version}`,
          changelog:
            `https://stampchain.io/api/v2/versions/changelog#${version}`,
          migration: isDeprecated
            ? `https://stampchain.io/docs/api/migration/${version}`
            : undefined,
        },
      };
    });

    // Add deprecated versions to the list
    VERSION_CONFIG.deprecatedVersions.forEach((version: any) => {
      if (!versions.some((v) => v.version === version)) {
        const changelogEntry = CHANGELOG.find((entry) =>
          entry.version.startsWith(version)
        );
        versions.push({
          version,
          status: "deprecated",
          releaseDate: changelogEntry?.releaseDate,
          endOfLife: VERSION_CONFIG.versionEndOfLife[version],
          links: {
            documentation: `https://stampchain.io/docs/api/v${version}`,
            changelog:
              `https://stampchain.io/api/v2/versions/changelog#${version}`,
            migration: `https://stampchain.io/docs/api/migration/${version}`,
          },
        });
      }
    });

    // Sort versions by version number descending
    versions.sort((a, b) => b.version.localeCompare(a.version));

    const response = {
      current: VERSION_CONFIG.defaultVersion,
      requestedVersion: currentVersion,
      versions,
      headers: {
        "API-Version": "Specify desired API version",
        "Accept-Version": "Alternative version header",
        "X-API-Version": "Legacy version header",
      },
      links: {
        changelog: "https://stampchain.io/api/v2/versions/changelog",
        documentation: "https://stampchain.io/docs/api",
      },
    };

    // Add deprecation notice if using deprecated version
    if (VERSION_CONFIG.deprecatedVersions.includes(currentVersion)) {
      response.deprecationNotice = {
        message:
          `API version ${currentVersion} is deprecated and will be removed on ${
            VERSION_CONFIG.versionEndOfLife[currentVersion]
          }`,
        migrationGuide:
          `https://stampchain.io/docs/api/migration/${currentVersion}`,
        currentVersion: VERSION_CONFIG.defaultVersion,
      };
    }

    return ApiResponseUtil.success(response);
  },
};
