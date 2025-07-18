/* ===== STAMP OVERVIEW PAGE ===== */
import { StampOverviewContent } from "$content";
import { Handlers } from "$fresh/server.ts";
import {
  STAMP_FILTER_TYPES,
  STAMP_TYPES,
  StampPageProps,
  SUBPROTOCOLS,
} from "$globals";
import { StampOverviewHeader } from "$header";
import {
  queryParamsToFilters,
  queryParamsToServicePayload,
  StampFilters,
} from "$islands/filter/FilterOptionsStamp.tsx";
import { StampController } from "$server/controller/stampController.ts";
import { CollectionService } from "$server/services/collectionService.ts";

/* ===== CONSTANTS ===== */
const MAX_PAGE_SIZE = 120;

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req: Request, ctx) {
    const url = new URL(req.url);
    console.log("[Stamp Handler]", {
      url: url.toString(),
      pathname: url.pathname,
      params: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(req.headers),
    });

    // Only process requests for /stamp route
    if (url.searchParams.has("_fresh") && !url.pathname.startsWith("/stamp")) {
      return new Response(null, { status: 204 });
    }

    try {
      /* ===== QUERY PARAMETERS ===== */
      const sortBy = url.searchParams.get("sortBy") || "DESC";
      const filterBy = url.searchParams.get("filterBy")
        ? (url.searchParams.get("filterBy")?.split(",").filter(
          Boolean,
        ) as STAMP_FILTER_TYPES[])
        : [];
      const selectedTab =
        (url.searchParams.get("type") || "all") as STAMP_TYPES;
      const page = parseInt(url.searchParams.get("page") || "1");
      const requestedPageSize = parseInt(url.searchParams.get("limit") || "60");
      const page_size = Math.min(requestedPageSize, MAX_PAGE_SIZE);
      const recentSales = url.searchParams.get("recentSales") === "true";

      /* ===== DATA FETCHING ===== */
      let result;
      if (recentSales) {
        // Handle recent sales view
        result = await StampController.getRecentSales(page, page_size);
      } else {
        // Handle regular stamp listing
        const ident: SUBPROTOCOLS[] = [];
        let collectionId;

        // Special handling for POSH stamps
        if (selectedTab === "posh") {
          const poshCollection = await CollectionService.getCollectionByName(
            "posh",
          );
          if (poshCollection) {
            collectionId = poshCollection.collection_id;
          } else {
            throw new Error("Posh collection not found");
          }
        }

        // Fetch stamps with filters
        // Filter out undefined values from queryParamsToServicePayload
        const queryParams = queryParamsToServicePayload(url.search);
        const filteredQueryParams = Object.entries(queryParams).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, any>,
        );

        const payload = {
          page,
          limit: page_size,
          sortBy: sortBy as "DESC" | "ASC",
          type: selectedTab,
          filterBy,
          ident,
          collectionId,
          url: url.origin,
          ...filteredQueryParams,
        };
        console.log("stamp controller payload", payload);

        result = await StampController.getStamps(payload);
      }

      /* ===== RESPONSE FORMATTING ===== */
      const { data: stamps = [], ...restResult } = result;
      const data = {
        ...restResult,
        stamps: Array.isArray(stamps) ? stamps : [],
        filterBy,
        sortBy,
        selectedTab: recentSales ? "recent_sales" : selectedTab,
        page,
        limit: page_size,
        filters: queryParamsToFilters(url.search),
        search: url.search,
      };

      return ctx.render({
        ...data,
        partial: url.searchParams.has("_fresh"),
      });
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
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
