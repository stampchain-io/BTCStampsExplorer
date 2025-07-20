import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { VERSION_CONFIG } from "$server/middleware/apiVersionMiddleware.ts";

/**
 * API Version Changelog Endpoint
 *
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
        "Enhanced transaction details in recent sales data including buyer_address, dispenser_address, time_ago, btc_amount_satoshis, and dispenser_tx_hash",
        "dayRange query parameter for /api/v2/stamps/recentSales to filter sales by days (default: 30)",
        "fullDetails query parameter for /api/v2/stamps/recentSales to enable enhanced transaction information",
        "btcPriceUSD field in recent sales response for real-time USD conversions",
        "metadata object in recent sales response with dayRange and lastUpdated timestamp",
        "activityLevel field in StampMarketData (HOT, WARM, COOL, DORMANT, COLD) for trading activity indicators",
        "lastActivityTime field in StampMarketData with Unix timestamp of last trading activity",
        "Enhanced transaction details in StampMarketData including lastSaleTxHash, lastSaleBuyerAddress, lastSaleDispenserAddress",
        "lastSaleBtcAmount, lastSaleDispenserTxHash, and lastSaleBlockIndex fields for complete sale information",
        "Enhanced stamps balance endpoint (/api/v2/stamps/balance/{address}) with optional advanced features via enhanced=true parameter",
        "sortBy parameter for enhanced stamps balance with options: value_desc, value_asc, quantity_desc, quantity_asc, stamp_desc, stamp_asc, recent_desc, recent_asc",
        "Individual stamp values and unit prices in enhanced stamp balance responses",
        "Market data integration with bulk optimization for better performance",
        "UTXO attachment information for stamp balance responses",
        "Enhanced SRC20 balance endpoints (/api/v2/src20/balance/{address} and /api/v2/src20/balance/{address}/{tick}) with optional market data enrichment via includeMarketData=true parameter",
        "Market data fields in SRC20 balance responses: floor_unit_price, market_cap, volume24, change24, and nested market_data object with detailed pricing information",
        "Backward compatible SRC20 balance API - existing clients receive unchanged responses, new clients can opt-in to enhanced market data",
        "fee_rate_sat_vb field in transaction-related endpoints with improved fee calculation logic (fee = total_inputs - total_outputs)",
        "API-Version header support for all SRC-20 endpoints (consistent with stamps endpoints)",
        "PaginatedSrc20WithMarketDataResponseBody schema for proper v2.3 market data structure",
        "Frontend components updated with X-API-Version: 2.3 headers for all SRC20 API calls",
        "Schema validation improvements ensuring consistent API versioning across all endpoints",
      ],
      improved: [
        "Response performance with intelligent caching",
        "Pagination consistency across all endpoints",
        "List query performance by excluding stamp_base64 field from list responses",
        "Input validation for ident parameter to return empty results for invalid values",
        "Security validation for SQL injection attempts in SRC101 endpoints",
        "XSS detection in address-related endpoints",
        "Transaction hash format validation requiring 64-character hex strings",
        "Recent sales performance by using local market data cache instead of external XCP API calls",
        "Data accuracy with transaction-level details from stamp_market_data table",
        "Time calculations with user-friendly relative timestamps (e.g., '2h ago', '5d ago')",
        "OpenAPI schema consistency with proper oneOf patterns for v2.2/v2.3 response variations",
        "SRC-20 and Stamps endpoint parity with unified API versioning approach",
        "Frontend component reliability with consistent X-API-Version header implementation",
      ],
      optimized: [
        "stamp_base64 field is now excluded from list endpoints for 50-70% smaller responses",
        "stamp_base64 remains available in single stamp detail endpoints (/stamps/[identifier])",
      ],
      fixed: [
        "Fee field scope clarification - fee_rate_sat_vb and fee fields now properly limited to transaction-specific endpoints only",
        "OpenAPI schema validation errors in path parameter definitions",
        "Market data schema inconsistencies between SRC-20 and Stamps endpoints",
      ],
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
  GET(_req, _ctx) {
    return ApiResponseUtil.success({
      changelog: CHANGELOG,
      currentVersion: VERSION_CONFIG.defaultVersion,
      deprecationPolicy: {
        notice: "6 months",
        support: "12 months after deprecation",
      },
    });
  },
};
