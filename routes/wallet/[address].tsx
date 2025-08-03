/* ===== WALLET PAGE ===== */
/*@baba-367*/

import { MetaTags } from "$components/layout/MetaTags.tsx";
import { WalletProfileContent } from "$content";
import { Handlers } from "$fresh/server.ts";
import type { SRC20Balance, SRC20Row } from "$types/src20.d.ts";
import type { Dispenser, StampRow } from "$types/stamp.d.ts";
import type { WalletStampWithValue } from "$types/wallet.d.ts";

import WalletDispenserDetails from "$islands/content/WalletDispenserDetails.tsx";
import WalletProfileDetails from "$islands/content/WalletProfileDetails.tsx";
import { getBTCBalanceInfo } from "$lib/utils/data/processing/balanceUtils.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { StampController } from "$server/controller/stampController.ts";
import { CreatorService } from "$server/services/creator/creatorService.ts";
import { PaginatedResponse } from "$types/pagination.d.ts";
import type { WalletPageProps } from "$types/ui.d.ts";
import { WalletOverviewInfo } from "$types/wallet.d.ts";

/* ===== SERVER HANDLER ===== */
/**
 * We add stampsSortBy to the query to handle the ASC / DESC sorting on stamps.
 * This is optional; if not provided, default to "DESC".
 */
export const handler: Handlers = {
  async GET(req, ctx) {
    /* ===== PARAMETER EXTRACTION ===== */
    const { address } = ctx.params;
    const url = new URL(req.url);

    // Get sort parameters for each section with enhanced sorting support
    const stampsSortBy = url.searchParams.get("stampsSortBy") || "DESC";
    const src20SortBy = url.searchParams.get("src20SortBy") || "DESC";
    const dispensersSortBy = url.searchParams.get("dispensersSortBy") || "DESC";

    // Validate and normalize stamps sort parameter for enhanced sorting
    const validStampsSortOptions = [
      "ASC",
      "DESC",
      "value_desc",
      "value_asc",
      "quantity_desc",
      "quantity_asc",
      "stamp_desc",
      "stamp_asc",
      "recent_desc",
      "recent_asc",
    ];
    const normalizedStampsSortBy = validStampsSortOptions.includes(stampsSortBy)
      ? stampsSortBy
      : "DESC";

    // For backward compatibility, convert src20 and dispensers to uppercase
    const normalizedSrc20SortBy = (src20SortBy.toUpperCase() === "ASC" ||
        src20SortBy.toUpperCase() === "DESC")
      ? src20SortBy.toUpperCase() as "ASC" | "DESC"
      : "DESC" as "ASC" | "DESC";
    const normalizedDispensersSortBy =
      (dispensersSortBy.toUpperCase() === "ASC" ||
          dispensersSortBy.toUpperCase() === "DESC")
        ? dispensersSortBy.toUpperCase() as "ASC" | "DESC"
        : "DESC" as "ASC" | "DESC";

    // Extract pagination parameters with grid-friendly defaults
    const stampsParams = {
      page: parseInt(url.searchParams.get("stamps_page") || "1"),
      limit: parseInt(url.searchParams.get("stamps_limit") || "36"), // Changed from 32 to 36 for even grid rows (6x6)
      sortBy: url.searchParams.get("stampsSortBy") as "ASC" | "DESC" || "DESC",
    };

    const src20Params = {
      page: parseInt(url.searchParams.get("src20_page") || "1"),
      limit: parseInt(url.searchParams.get("src20_limit") || "20"),
      sortBy: url.searchParams.get("src20SortBy") as "ASC" | "DESC" || "DESC",
    };

    const dispensersParams = {
      page: parseInt(url.searchParams.get("dispensers_page") || "1"),
      limit: parseInt(url.searchParams.get("dispensers_limit") || "10"),
      sortBy: url.searchParams.get("dispensersSortBy") as "ASC" | "DESC" ||
        "DESC",
    };

    const anchor = url.searchParams.get("anchor");

    /* ===== DATA FETCHING ===== */
    try {
      const [
        stampsResponse,
        src20Response,
        btcInfoResponse,
        dispensersResponse,
        stampsCreatedCount,
        src101FetchResponse,
        creatorNameResponse,
        // Add a separate fetch for ALL stamps for accurate value calculation
        allStampsForValuesResponse,
      ] = await Promise.allSettled([
        // Stamps with enhanced sorting and pagination - use the enhanced API endpoint
        fetch(
          `${url.origin}/api/v2/stamps/balance/${address}?enhanced=true&page=${
            stampsParams.page || 1
          }&limit=${stampsParams.limit || 32}&sortBy=${normalizedStampsSortBy}`,
          {
            headers: {
              "X-API-Version": "2.3",
            },
          },
        ).then(async (res) => {
          if (!res.ok) {
            console.error(
              "Enhanced stamps fetch failed:",
              res.status,
              res.statusText,
            );
            // Fallback to basic endpoint
            return StampController.getStampBalancesByAddress(
              address,
              stampsParams.limit || 32,
              stampsParams.page || 1,
              (normalizedStampsSortBy === "ASC" ||
                  normalizedStampsSortBy === "DESC")
                ? normalizedStampsSortBy as "ASC" | "DESC"
                : "DESC",
            );
          }
          return await res.json();
        }),

        // SRC20 tokens with sorting and pagination
        Src20Controller.handleSrc20BalanceRequest({
          address,
          includePagination: true,
          limit: src20Params.limit || 10,
          page: src20Params.page || 1,
          includeMintData: true,
          includeMarketData: true, // 🚀 FIX: Use controller's built-in market data
          sortBy: normalizedSrc20SortBy,
        }),

        // BTC info
        getBTCBalanceInfo(address, {
          includeUSD: true,
        }),

        // Dispensers with sorting and pagination
        StampController.getDispensersWithStampsByAddress(
          address,
          dispensersParams.page || 1,
          dispensersParams.limit || 10,
          {
            sortBy: normalizedDispensersSortBy,
          },
        ),

        StampController.getStampsCreatedCount(address),

        // SRC101 Balance request via fetch
        fetch(
          `${url.origin}/api/v2/src101/balance/${address}?limit=100&offset=0`,
          {
            headers: {
              "X-API-Version": "2.3",
            },
          },
        ).then(async (res) => {
          if (!res.ok) {
            console.error("SRC101 fetch failed:", res.status, res.statusText);
            return null;
          }
          const data = await res.json();
          console.log("Raw SRC-101 Response:", data);

          // If we have pagination info and there's more data, fetch the rest
          if (data.pagination?.total > 100) {
            const remainingPages = Math.ceil(data.pagination.total / 100) - 1;
            const additionalRequests = Array.from(
              { length: remainingPages },
              (_, i) =>
                fetch(
                  `${url.origin}/api/v2/src101/balance/${address}?limit=100&offset=${
                    (i + 1) * 100
                  }`,
                  {
                    headers: {
                      "X-API-Version": "2.3",
                    },
                  },
                )
                  .then((r) => r.json()),
            );

            const additionalData = await Promise.all(additionalRequests);
            // Combine all data
            data.data = [
              ...data.data,
              ...additionalData.flatMap((d) => d.data || []),
            ];
          }

          return data;
        }),

        // Fetch creator name
        CreatorService.getCreatorNameByAddress(address),

        // CRITICAL FIX: Fetch ALL stamps for accurate value calculation
        // This ensures the wallet dashboard shows correct total values
        fetch(
          `${url.origin}/api/v2/stamps/balance/${address}?enhanced=true&page=1&limit=1000&sortBy=DESC`,
          {
            headers: {
              "X-API-Version": "2.3",
            },
          },
        ).then(async (res) => {
          if (!res.ok) {
            console.error(
              "All stamps fetch for values failed:",
              res.status,
              res.statusText,
            );
            // Fallback to basic endpoint with high limit
            return StampController.getStampBalancesByAddress(
              address,
              1000, // High limit to get all stamps
              1,
              "DESC",
            );
          }
          const data = await res.json();

          // If we have pagination info and there's more data, fetch the rest
          if (data.pagination && data.pagination.total > 1000) {
            const totalPages = Math.ceil(data.pagination.total / 1000);
            const additionalRequests = Array.from(
              { length: totalPages - 1 },
              (_, i) =>
                fetch(
                  `${url.origin}/api/v2/stamps/balance/${address}?enhanced=true&page=${
                    i + 2
                  }&limit=1000&sortBy=DESC`,
                  {
                    headers: {
                      "X-API-Version": "2.3",
                    },
                  },
                )
                  .then((r) => r.json()),
            );

            const additionalData = await Promise.all(additionalRequests);
            // Combine all data
            data.data = [
              ...data.data,
              ...additionalData.flatMap((d) => d.data || []),
            ];

            console.log(
              `[WalletPage] Fetched ${data.data.length} stamps across ${totalPages} pages for value calculation`,
            );
          }

          return data;
        }),
      ]);

      /* ===== DATA PROCESSING ===== */
      // Process responses and handle errors
      const stampsData = stampsResponse.status === "fulfilled"
        ? {
          data: stampsResponse.value.data as unknown as StampRow[],
          total: stampsResponse.value.pagination?.total ||
            stampsResponse.value.totalPages * stampsResponse.value.limit ||
            stampsResponse.value.data.length,
          page: stampsResponse.value.pagination?.page ||
            stampsResponse.value.page || 1,
          limit: stampsResponse.value.pagination?.limit ||
            stampsResponse.value.limit || 32,
          totalPages: stampsResponse.value.pagination?.totalPages ||
            stampsResponse.value.totalPages || 0,
        }
        : { data: [], total: 0, page: 1, limit: 32, totalPages: 0 };

      // CRITICAL FIX: Calculate stamp values using ALL stamps, not just current page
      const stampValues = allStampsForValuesResponse.status === "fulfilled"
        ? await StampController.calculateWalletStampValues(
          allStampsForValuesResponse.value.data,
        )
        : { stampValues: {}, totalValue: 0 };

      console.log(
        `[WalletPage] Calculated stamp values for ${
          allStampsForValuesResponse.status === "fulfilled"
            ? allStampsForValuesResponse.value.data.length
            : 0
        } stamps, total value: ${stampValues.totalValue} BTC`,
      );

      // Process SRC20 data - now includes market data from controller
      const baseSrc20Data = src20Response.status === "fulfilled"
        ? src20Response.value
        : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      // 🚀 PERFORMANCE FIX: No more manual enrichment needed!
      // Market data is already included via includeMarketData: true
      const src20Data = {
        ...baseSrc20Data,
        data: baseSrc20Data.data, // Data already enriched by controller
      } as PaginatedResponse<SRC20Row>;

      // Calculate total SRC20 value from enriched tokens with better error handling
      const src20Value = Array.isArray(src20Data.data)
        ? src20Data.data.reduce((total, token: any) => {
          try {
            // For v2.3, market data is in token.market_data
            const marketData = token.market_data;
            if (marketData?.floor_price_btc && token.amt) {
              const quantity = typeof token.amt === "bigint"
                ? Number(token.amt)
                : token.amt;
              const valueInBTC = marketData.floor_price_btc * quantity;
              return total + valueInBTC;
            }
          } catch (marketDataError) {
            // Log market data errors but don't break the calculation
            console.warn(
              `Market data calculation error for token ${token.tick}:`,
              marketDataError,
            );
          }
          return total;
        }, 0)
        : 0;

      // Add market data availability flags for graceful degradation
      const marketDataStatus = {
        stampsMarketData: stampsResponse.status === "fulfilled" &&
            stampsResponse.value.stampValues
          ? "available"
          : "unavailable",
        src20MarketData: src20Response.status === "fulfilled" &&
            (baseSrc20Data.data?.length === 0 || // Empty wallet is OK
              baseSrc20Data.data?.some((token: any) => token.market_data))
          ? "available"
          : "unavailable",
        overallStatus: "partial", // Can be "full", "partial", or "unavailable"
      };

      // Update overall market data status
      if (
        marketDataStatus.stampsMarketData === "available" &&
        marketDataStatus.src20MarketData === "available"
      ) {
        marketDataStatus.overallStatus = "full";
      } else if (
        marketDataStatus.stampsMarketData === "unavailable" &&
        marketDataStatus.src20MarketData === "unavailable"
      ) {
        marketDataStatus.overallStatus = "unavailable";
      }

      const dispensersData = dispensersResponse.status === "fulfilled"
        ? dispensersResponse.value.dispensers
        : [];

      const btcInfo = btcInfoResponse.status === "fulfilled"
        ? btcInfoResponse.value
        : null;

      // Calculate dispenser counts from the full response
      const allDispensers = dispensersResponse.status === "fulfilled"
        ? dispensersResponse.value.dispensers
        : [];
      const openDispensers = allDispensers.filter((d) => d.give_remaining > 0);
      const closedDispensers = allDispensers.filter((d) =>
        d.give_remaining === 0
      );

      // Process SRC-101 response to get all BitNames
      const src101Data = src101FetchResponse.status === "fulfilled" &&
          src101FetchResponse.value &&
          typeof src101FetchResponse.value === "object"
        ? {
          names: (src101FetchResponse.value.data || [])
            .filter((item: any) => item?.tokenid_utf8)
            .map((item: any) => item.tokenid_utf8),
          total: src101FetchResponse.value.last_block || 0,
        }
        : { names: [], total: 0 };

      console.log("Final Processed SRC-101 Data:", src101Data);

      /* ===== WALLET DATA ASSEMBLY ===== */
      // Get creator name from response
      const creatorName = creatorNameResponse.status === "fulfilled"
        ? creatorNameResponse.value
        : null;

      // Build wallet data
      const walletData = {
        balance: btcInfo?.balance ?? 0, // BTC balance only
        usdValue: (btcInfo?.balance ?? 0) * (btcInfo?.btcPrice ?? 0), // USD value of BTC only
        address,
        btcPrice: btcInfo?.btcPrice ?? 0,
        fee: 0,
        creatorName,
        txCount: btcInfo?.txCount ?? 0,
        unconfirmedBalance: btcInfo?.unconfirmedBalance ?? 0,
        unconfirmedTxCount: btcInfo?.unconfirmedTxCount ?? 0,
        stampValue: stampValues.totalValue,
        src20Value: src20Value,
        marketDataStatus, // Add market data status for UI feedback
        dispensers: {
          open: openDispensers.length,
          closed: closedDispensers.length,
          total: allDispensers.length,
          items: dispensersData,
        },
        src101: src101Data,
      };

      /* ===== RESPONSE RENDERING ===== */
      return ctx.render({
        data: {
          data: {
            stamps: {
              data: stampsData.data,
              pagination: {
                page: stampsParams.page,
                limit: stampsParams.limit,
                total: stampsData.total || 0,
                totalPages: stampsData.totalPages ||
                  Math.ceil((stampsData.total || 0) / stampsParams.limit),
              },
            },
            src20: {
              data: src20Data.data,
              pagination: {
                page: src20Params.page,
                limit: src20Params.limit,
                total: src20Data.total || 0,
                totalPages: src20Data.totalPages ||
                  Math.ceil((src20Data.total || 0) / src20Params.limit),
              },
            },
            dispensers: {
              data: dispensersData,
              pagination: {
                page: dispensersParams.page,
                limit: dispensersParams.limit,
                total: dispensersData.length,
                totalPages: Math.ceil(
                  dispensersData.length / dispensersParams.limit,
                ),
              },
            },
            src101: src101FetchResponse.status === "fulfilled"
              ? src101FetchResponse.value
              : null,
          },
          address,
          walletData,
          stampsTotal: stampsData.total,
          src20Total: src20Data.total,
          stampsCreated: stampsCreatedCount.status === "fulfilled"
            ? stampsCreatedCount.value
            : 0,
          anchor,
        },
        stampsSortBy: normalizedStampsSortBy,
        src20SortBy: normalizedSrc20SortBy,
        dispensersSortBy: normalizedDispensersSortBy,
      });
    } catch (error) {
      /* ===== ERROR HANDLING ===== */
      console.error("Wallet page error:", error);

      // Log more specific error details for debugging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          address: address,
          timestamp: new Date().toISOString(),
        });
      }

      // Return safe default state with empty data and market data unavailable status
      return ctx.render({
        data: {
          data: {
            stamps: {
              data: [],
              pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
            },
            src20: {
              data: [],
              pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
            },
            dispensers: {
              data: [],
              pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
            },
          },
          address,
          walletData: {
            balance: 0,
            usdValue: 0,
            address,
            btcPrice: 0,
            fee: 0,
            creatorName: null,
            txCount: 0,
            unconfirmedBalance: 0,
            unconfirmedTxCount: 0,
            stampValue: 0,
            src20Value: 0,
            btcBalance: 0,
            marketDataStatus: {
              stampsMarketData: "unavailable",
              src20MarketData: "unavailable",
              overallStatus: "unavailable",
            },
            dispensers: {
              open: 0,
              closed: 0,
              total: 0,
              items: [],
            },
            src101: { names: [], total: 0 },
          },
          stampsTotal: 0,
          src20Total: 0,
          stampsCreated: 0,
          anchor: "",
        },
        stampsSortBy: "DESC",
        src20SortBy: "DESC",
        dispensersSortBy: "DESC",
      });
    }
  },
};

/* ===== HELPERS ===== */
// Helper function to determine if address should be treated as dispenser-only
function isDispenserOnlyAddress(data: {
  address: string;
  walletData: any;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  anchor: string;
  data?: {
    stamps: { data: WalletStampWithValue[] };
    src20: { data: SRC20Balance[] };
    dispensers: { data: Dispenser[] };
  };
}) {
  // Safety check: if data.data doesn't exist or is missing dispensers, return false
  if (
    !data.data?.dispensers?.data || !data.data?.stamps?.data ||
    !data.data?.src20?.data
  ) {
    return false;
  }

  // Check if address has dispensers
  const hasDispensers = data.data.dispensers.data.length > 0;

  // Check if address has other assets
  const hasOtherStamps =
    data.data.stamps.data.length > (data.data.dispensers.data.length || 0);
  const hasSrc20Tokens = data.data.src20.data.length > 0;
  const hasCreatedStamps = data.stampsCreated > 0;

  // Only treat as dispenser if it ONLY has dispenser activity
  return hasDispensers && !hasOtherStamps && !hasSrc20Tokens &&
    !hasCreatedStamps;
}

/* ===== PAGE COMPONENT ===== */
export default function WalletPage(props: { data: WalletPageProps }) {
  const pageData = props.data;
  const routeData = pageData.data as any; // Type assertion to handle nested structure
  const isDispenserOnly = isDispenserOnlyAddress(routeData);

  /* ===== RENDER ===== */
  return (
    <div>
      <MetaTags
        title={`BTC Stamps Explorer - ${routeData.address || "Address"}`}
        description={`Explore Bitcoin stamps and SRC-20 tokens for address ${
          routeData.address || ""
        }`}
      />
      {isDispenserOnly
        ? (
          <WalletDispenserDetails
            walletData={routeData as WalletOverviewInfo}
            stampsTotal={routeData.stampsTotal || 0}
            src20Total={routeData.src20Total || 0}
            stampsCreated={routeData.stampsCreated || 0}
            setShowItem={() => {}}
          />
        )
        : (
          <>
            <WalletProfileDetails
              walletData={routeData.walletData as WalletOverviewInfo}
              stampsTotal={routeData.stampsTotal}
              src20Total={routeData.src20Total}
              stampsCreated={routeData.stampsCreated}
              setShowItem={() => {}}
            />
            <WalletProfileContent
              stamps={routeData.data?.stamps || routeData.stamps}
              src20={routeData.data?.src20 || routeData.src20}
              dispensers={routeData.data?.dispensers || routeData.dispensers}
              address={routeData.address}
              anchor={routeData.anchor}
              stampsSortBy={props.data.stampsSortBy ?? "DESC"}
              src20SortBy={props.data.src20SortBy ?? "DESC"}
              // ===== ADVANCED SORTING FEATURE =====
              enableAdvancedSorting
              showSortingMetrics={false} // Can be enabled for debugging
              sortingConfig={{
                enableUrlSync: true,
                enablePersistence: true,
                enableMetrics: false, // Can be enabled for performance monitoring
              }}
            />
          </>
        )}
    </div>
  );
}
