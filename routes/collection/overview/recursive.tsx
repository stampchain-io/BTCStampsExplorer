import { StampPageProps } from "globals";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { StampContent } from "$islands/stamp/StampContent.tsx";
import { CollectionOverviewHeader } from "$islands/collection/CollectionOverviewHeader.tsx";
import { CollectionService } from "$server/services/collectionService.ts";
import { STAMP_FILTER_TYPES, SUBPROTOCOLS } from "globals";
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
      const filterBy = "recursive"?.split(",").filter(
        Boolean,
      ) as STAMP_FILTER_TYPES[];
      const selectedTab = "all";
      const page = parseInt(url.searchParams.get("page") || "1");
      const requestedPageSize = parseInt(url.searchParams.get("limit") || "24");
      const page_size = Math.min(requestedPageSize, MAX_PAGE_SIZE);
      let result;
      const ident: SUBPROTOCOLS[] = [];
      let collectionId;
      result = await StampController.getStamps({
        page,
        limit: page_size,
        sortBy: sortBy as "DESC" | "ASC",
        type: selectedTab,
        filterBy,
        ident,
        collectionId,
      });
      const { data: stamps = [], ...restResult } = result;
      const data = {
        ...restResult,
        stamps: Array.isArray(stamps) ? stamps : [],
        selectedTab: selectedTab,
        page,
        limit: page_size,
      };
      return ctx.render({
        ...data,
        partial: url.searchParams.has("_fresh"),
      });
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
export function CollectionOverviewRecursive(props: StampPageProps) {
  const {
    stamps,
    page,
    totalPages,
    limit,
    selectedTab,
  } = props.data;
  // Ensure stamps is an array
  const stampsArray = Array.isArray(stamps) ? stamps : [];
  return (
    <div class="w-full flex flex-col items-center" f-client-nav>
      <div data-partial="/stamp">
        <CollectionOverviewHeader />
        <StampContent
          stamps={stampsArray}
          isRecentSales={false}
        />
        <Pagination
          page={page}
          pages={totalPages}
          page_size={limit}
          type={selectedTab}
          data_length={stampsArray.length}
        />
      </div>
    </div>
  );
}
export default CollectionOverviewRecursive;
