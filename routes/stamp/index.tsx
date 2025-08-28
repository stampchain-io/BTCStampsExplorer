/* ===== STAMP OVERVIEW PAGE ===== */

import { StampOverviewContent } from "$content";
import { Handlers } from "$fresh/server.ts";

import { FRONTEND_STAMP_TYPE_VALUES } from "$constants";
import { StampOverviewHeader } from "$header";

import {
  queryParamsToFilters,
  queryParamsToServicePayload,
  StampFilters,
} from "$islands/filter/FilterOptionsStamp.tsx";
import type { StampPageProps } from "$types/api.d.ts";
import type { StampRow, StampSaleRow } from "$types/stamp.d.ts";

// ✅ PROPER SEPARATION: Use HTTP client for API calls
import { FetchHttpClient } from "$server/interfaces/httpClient.ts";

/* ===== CONSTANTS ===== */
const MAX_PAGE_SIZE = 120;

// ✅ PROPER SEPARATION: Create httpClient instance
const httpClient = new FetchHttpClient();

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req: Request, ctx) {
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    try {
      /* ===== URL PARAMS ===== */
      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = Math.min(
        parseInt(url.searchParams.get("limit") || "60"),
        MAX_PAGE_SIZE,
      );
      const sortBy = url.searchParams.get("sortBy") || "DESC";

      // ✅ IMPROVED: Handle view parameter for different stamp display modes
      const viewMode = url.searchParams.get("view") || "all";
      const recentSales = viewMode === "sales" ||
        url.searchParams.get("recentSales") === "true"; // Backward compatibility

      // ✅ NEW: Handle type parameter for stamp filtering (classic, cursed, posh, etc.)
      // Note: SRC-20 excluded from frontend options as they're handled separately in the app
      const stampType = url.searchParams.get("type") || "classic"; // Default to classic
      const typeFilter = FRONTEND_STAMP_TYPE_VALUES.includes(stampType as any)
        ? stampType
        : "classic";

      /* ===== DATA FETCHING BASED ON MODE ===== */
      let stampsData: {
        data: StampRow[];
        pagination: {
          total: number;
          page?: number | undefined;
          totalPages?: number | undefined;
        };
      } = {
        data: [],
        pagination: { total: 0 },
      };
      let recentSalesData: StampSaleRow[] = [];

      if (recentSales) {
        // ✅ FIX: When recentSales=true, fetch from optimized internal API endpoint
        try {
          const recentSalesParams = new URLSearchParams({
            page: page.toString(),
            limit: page_size.toString(),
            sortBy: "DESC", // Recent sales should always be DESC (newest first)
            dayRange: "30", // Use 30-day range like homepage
            fullDetails: "true", // Enable enhanced transaction information
            type: typeFilter, // Add stamp type filtering
          });

          const recentSalesResponse = await httpClient.get(
            `${baseUrl}/api/internal/stamp-recent-sales?${recentSalesParams}`,
            {
              headers: {},
            },
          );

          if (!recentSalesResponse.ok) {
            console.error(
              "[Recent Sales API Error]",
              recentSalesResponse.status,
            );
            throw new Error(
              `Recent sales API failed: ${recentSalesResponse.status}`,
            );
          }

          // Extract data (handle API wrapper format)
          const salesResult = recentSalesResponse.data?.data ||
            recentSalesResponse.data || [];
          recentSalesData = Array.isArray(salesResult) ? salesResult : [];

          // ✅ FIX: Format as stamps data for StampOverviewContent
          stampsData = {
            data: recentSalesData.map((sale) => ({
              stamp: sale.stamp_number,
              cpid: sale.cpid,
              tx_hash: sale.tx_hash,
              tx_index: 0, // Default to 0, as transaction index is not available in StampSaleRow
              block_index: sale.block_index,
              block_time: sale.timestamp,
              stamp_base64: "", // Default empty string for StampSaleRow
              stamp_url: "", // Default empty string for StampSaleRow
              stamp_mimetype: "", // Default empty string for StampSaleRow
              stamp_hash: "", // Default empty string for StampSaleRow
              file_hash: "", // Default empty string for StampSaleRow
              file_size_bytes: null, // Not available in StampSaleRow
              ident: "STAMP" as const, // Default to STAMP for sales data
              creator: sale.seller,
              creator_name: null, // Not available in StampSaleRow
              divisible: false, // Assuming not divisible, as it's not in StampSaleRow
              keyburn: null, // Not available in StampSaleRow
              locked: 0, // Assuming not locked, as it's not in StampSaleRow
              supply: 0, // Assuming zero supply, as it's not in StampSaleRow
              unbound_quantity: 0, // Default to 0
              sale_data: {
                btc_amount: sale.price_btc,
                block_index: sale.block_index,
                tx_hash: sale.tx_hash,
              },
            })),
            pagination: {
              total: recentSalesResponse.data?.total || recentSalesData.length,
              page: page,
              totalPages: recentSalesResponse.data?.totalPages ||
                Math.ceil(
                  (recentSalesResponse.data?.total || recentSalesData.length) /
                    page_size,
                ),
            },
          };

          console.log(
            `[Stamp Route] Recent sales mode: fetched ${recentSalesData.length} sales`,
          );
        } catch (recentSalesError) {
          console.error(
            "[Recent Sales Error]",
            (recentSalesError as Error).message || "Unknown error",
          );
          // Fallback to empty data for recent sales
          stampsData = { data: [], pagination: { total: 0 } };
          recentSalesData = [];
        }
      } else {
        // ✅ IMPROVED: Handle type-based filtering vs POSH collection
        try {
          // If a specific type is requested, fetch stamps by type instead of collection
          if (typeFilter !== "all") {
            /* ===== TYPE-BASED STAMP FILTERING ===== */
            try {
              // Get filter and sort parameters from URL
              const filterBy = url.searchParams.getAll("filterBy");

              // Build stamps API parameters for type filtering
              const params = new URLSearchParams({
                page: page.toString(),
                limit: page_size.toString(),
                sortBy,
                type: typeFilter, // Add type parameter for filtering
              });

              if (filterBy.length > 0) {
                params.set("filterBy", filterBy.join(","));
              }

              // Add other query parameters from filters
              const queryParams = queryParamsToServicePayload(url.search);
              Object.entries(queryParams).forEach(([key, value]) => {
                if (value !== undefined && !params.has(key)) {
                  params.set(key, value.toString());
                }
              });

              const stampsResponse = await httpClient.get(
                `${baseUrl}/api/v2/stamps?${params}`,
              );

              if (!stampsResponse.ok) {
                throw new Error(
                  `Stamps API error: ${stampsResponse.status} ${stampsResponse.statusText}`,
                );
              }

              // Extract data (correct API response structure)
              const apiData = stampsResponse.data || {};
              stampsData = {
                data: apiData.data || [],
                pagination: {
                  total: apiData.total || 0,
                  page: apiData.page || page,
                  totalPages: apiData.totalPages || 0,
                },
              };

              console.log(
                `[Stamp Route] Type filtering mode: fetched ${
                  stampsData.data?.length || 0
                } stamps for type '${typeFilter}'`,
              );
            } catch (typeError) {
              console.error("[Type Filtering Error]:", {
                message: (typeError as Error).message || "Unknown error",
                type: typeFilter,
                url: url.pathname,
                timestamp: new Date().toISOString(),
              });
              // Use fallback data
              stampsData = { data: [], pagination: { total: 0 } };
            }
          } else {
            /* ===== DEFAULT: POSH COLLECTION ===== */
            let poshCollection = null;
            try {
              const poshResponse = await httpClient.get(
                `${baseUrl}/api/v2/collections/by-name/posh`,
              );

              if (poshResponse.ok) {
                poshCollection = poshResponse.data?.data || poshResponse.data;
              }
            } catch (poshError) {
              console.error(
                "[POSH Collection API Error]",
                (poshError as Error).message || "Unknown error",
              );
            }

            /* ===== STAMPS FOR COLLECTION ===== */
            if (poshCollection) {
              try {
                // Get filter and sort parameters from URL
                const filterBy = url.searchParams.getAll("filterBy");

                // Build stamps API parameters
                const params = new URLSearchParams({
                  page: page.toString(),
                  limit: page_size.toString(),
                  sortBy,
                  collectionId: poshCollection.collection_id.toString(),
                });

                if (filterBy.length > 0) {
                  params.set("filterBy", filterBy.join(","));
                }

                // Add other query parameters
                const queryParams = queryParamsToServicePayload(url.search);
                Object.entries(queryParams).forEach(([key, value]) => {
                  if (value !== undefined && !params.has(key)) {
                    params.set(key, value.toString());
                  }
                });

                const stampsResponse = await httpClient.get(
                  `${baseUrl}/api/v2/stamps?${params}`,
                );

                if (!stampsResponse.ok) {
                  throw new Error(
                    `Stamps API error: ${stampsResponse.status} ${stampsResponse.statusText}`,
                  );
                }

                // Extract data (correct API response structure)
                const apiData = stampsResponse.data || {};
                stampsData = {
                  data: apiData.data || [],
                  pagination: {
                    total: apiData.total || 0,
                    page: apiData.page || page,
                    totalPages: apiData.totalPages || 0,
                  },
                };
              } catch (stampError) {
                console.error("[Stamp Gallery Error] Stamp Gallery:", {
                  message: (stampError as Error).message || "Unknown error",
                  url: url.pathname,
                  timestamp: new Date().toISOString(),
                });
                // Use fallback data
                stampsData = { data: [], pagination: { total: 0 } };
              }
            }
          }
        } catch (collectionError) {
          console.error(
            "[Collection Error]",
            (collectionError as Error).message || "Unknown error",
          );
          stampsData = { data: [], pagination: { total: 0 } };
        }
      }

      /* ===== RENDER PAGE ===== */
      return ctx.render({
        stamps: stampsData.data || [],
        pagination: stampsData.pagination || { total: 0 },
        recentSales: recentSalesData || [], // Keep for backward compatibility
        filters: queryParamsToFilters(url.search),
        page,
        page_size,
        sortBy,
        // ✅ FIX: Set selectedTab properly like explorer route
        selectedTab: recentSales ? "recent_sales" : "all",
        totalPages: stampsData.pagination?.totalPages ||
          Math.ceil((stampsData.pagination?.total || 0) / page_size),
      });
    } catch (error) {
      console.error(
        "[Stamp Handler Error]",
        (error as Error).message || "Unknown error",
      );

      // Ultimate fallback
      return ctx.render({
        stamps: [],
        pagination: { total: 0 },
        recentSales: [],
        filters: queryParamsToFilters(url.search),
        page: 1,
        page_size: 60,
        sortBy: "DESC",
        selectedTab: "all",
        totalPages: 0,
      });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export function StampOverviewPage(props: StampPageProps) {
  const {
    stamps,
    page,
    totalPages,
    sortBy: _sortBy,
    selectedTab,
    filters,
    search: _search,
  } = props.data;
  const stampsArray = Array.isArray(stamps) ? stamps : [];
  const isRecentSales = selectedTab === "recent_sales";

  /* ===== RENDER ===== */
  return (
    <div class="w-full" f-client-nav data-partial="/stamp">
      {/* Header Component with Filter Controls */}
      <StampOverviewHeader
        currentFilters={filters as StampFilters}
      />

      {/* Main Content with Pagination */}
      <StampOverviewContent
        stamps={stampsArray}
        isRecentSales={isRecentSales}
        pagination={{
          page,
          totalPages,
          // Use link-based navigation for better Fresh compatibility
        }}
      />
    </div>
  );
}

export default StampOverviewPage;
