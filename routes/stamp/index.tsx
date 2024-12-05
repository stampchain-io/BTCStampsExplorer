import { StampPageProps } from "globals";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { StampContent } from "$islands/stamp/StampContent.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";
import { CollectionService } from "$server/services/collectionService.ts";
import { STAMP_FILTER_TYPES, STAMP_TYPES, SUBPROTOCOLS } from "globals";

import { ResponseUtil } from "$lib/utils/responseUtil.ts";

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

        result = await StampController.getStamps({
          page,
          limit: page_size,
          sortBy: sortBy as "DESC" | "ASC",
          type: selectedTab,
          filterBy,
          ident,
          collectionId,
        });
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
      };

      return ctx.render({
        ...data,
        partial: url.searchParams.has("_fresh"),
      });
    } catch (error) {
      console.error(error);
      return ResponseUtil.internalError(
        error,
        "Internal Server Error",
      );
    }
  },
};

export function StampPage(props: StampPageProps) {
  const {
    stamps,
    page,
    totalPages,
    limit,
    filterBy,
    sortBy,
    selectedTab,
  } = props.data;

  const stampsArray = Array.isArray(stamps) ? stamps : [];
  const isRecentSales = selectedTab === "recent_sales";

  return (
    <div class="w-full" f-client-nav data-partial="/stamp">
      <StampHeader
        filterBy={filterBy as STAMP_FILTER_TYPES[]}
        sortBy={sortBy}
      />
      <StampContent
        stamps={stampsArray}
        isRecentSales={isRecentSales}
      />
      <Pagination
        page={page}
        pages={totalPages}
        page_size={limit}
        type={selectedTab}
        data_length={stampsArray.length}
      />
    </div>
  );
}

export default StampPage;
