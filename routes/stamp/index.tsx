/* ===== STAMP OVERVIEW PAGE ===== */

import { StampOverviewContent } from "$content";
import { Handlers } from "$fresh/server.ts";

import { StampOverviewHeader } from "$header";
import {
  queryParamsToFilters,
  queryParamsToServicePayload,
  StampFilters,
} from "$islands/filter/FilterOptionsStamp.tsx";

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
      const validTypes = [
        "classic",
        "cursed",
        "posh",
      ]; // Removed "all" and "stamps"
      const typeFilter = validTypes.includes(stampType) ? stampType : "classic";

      /* ===== DATA FETCHING BASED ON MODE ===== */
      let stampsData: {
        data: any[];
        pagination: {
          total: number;
          page?: number | undefined;
          totalPages?: number | undefined;
        };
      } = {
        data: [],
        pagination: { total: 0 },
      };
      let recentSalesData: any[] = [];

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
            data: recentSalesData,
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
          onPageChange: (newPage: number) => {
            const url = new URL(globalThis.location.href);
            url.searchParams.set("page", newPage.toString());

            // Use Fresh.js partial navigation
            const link = document.createElement("a");
            link.href = url.toString();
            link.setAttribute("f-partial", "");
            link.click();
          },
        }}
      />
    </div>
  );
}

export default StampOverviewPage;
