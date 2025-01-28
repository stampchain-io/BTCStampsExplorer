import { StampPageProps } from "$globals";
import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { StampContent } from "$islands/stamp/StampContent.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";
import { CollectionService } from "$server/services/collectionService.ts";
import { STAMP_FILTER_TYPES, STAMP_TYPES, SUBPROTOCOLS } from "$globals";
import {
  queryParamsToFilters,
  queryParamsToServicePayload,
  // StampFilters,
} from "../../islands/filterpane/StampFilterPane.tsx";
import { StampFilterWrapped } from "../../islands/filterpane/StampFilterWrapped.tsx";
import { flags } from "../../lib/flags/flags.ts";

const MAX_PAGE_SIZE = 120;

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
      const sortBy = url.searchParams.get("sortBy") || "DESC";
      const filterBy = url.searchParams.get("filterBy")
        ? (url.searchParams.get("filterBy")?.split(",").filter(
          Boolean,
        ) as STAMP_FILTER_TYPES[])
        : [];
      const selectedTab =
        (url.searchParams.get("type") || "all") as STAMP_TYPES;
      const page = parseInt(url.searchParams.get("page") || "1");
      const requestedPageSize = parseInt(url.searchParams.get("limit") || "24");
      const page_size = Math.min(requestedPageSize, MAX_PAGE_SIZE);
      const recentSales = url.searchParams.get("recentSales") === "true";

      let result;
      if (recentSales) {
        result = await StampController.getRecentSales(page, page_size);
      } else {
        const ident: SUBPROTOCOLS[] = [];
        let collectionId;

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

        const payload = {
          page,
          limit: page_size,
          sortBy: sortBy as "DESC" | "ASC",
          type: selectedTab,
          filterBy,
          ident,
          collectionId,
          url: url.origin,
          ...queryParamsToServicePayload(url.search),
        };
        console.log("stamp controller payload", payload);

        result = await StampController.getStamps(payload);
      }

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

export function StampPage(props: StampPageProps) {
  const {
    stamps,
    page,
    totalPages,
    filterBy,
    sortBy,
    selectedTab,
    filters,
    search,
  } = props.data;
  const stampsArray = Array.isArray(stamps) ? stamps : [];
  const isRecentSales = selectedTab === "recent_sales";

  return (
    <div class="w-full" f-client-nav data-partial="/stamp">
      <StampHeader
        filters={filters}
        filterBy={filterBy as STAMP_FILTER_TYPES[]}
        sortBy={sortBy}
        search={search}
      />
      <div class="flex gap-10">
        <div class="pt-4">
          {flags.getBooleanFlag("NEW_ART_STAMP_FILTERS", false) && (
            <StampFilterWrapped
              onFilterChange={(str) => {
                // const url = new URL(globalThis.location.href);
                console.log("hello");
                globalThis.location.href = globalThis.location.pathname + "?" +
                  str;
              }}
              filters={filters}
            />
          )}
        </div>

        <StampContent
          stamps={stampsArray}
          isRecentSales={isRecentSales}
          pagination={{
            page,
            totalPages,
            onPageChange: (newPage: number) => {
              const url = new URL(globalThis.location.href);
              url.searchParams.set("page", newPage.toString());
              globalThis.location.href = url.toString();
            },
          }}
        />
      </div>
    </div>
  );
}

export default StampPage;
