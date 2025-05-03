import { StampPageProps } from "$globals";
import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { StampContent } from "$islands/stamp/StampContent.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";
import { CollectionService } from "$server/services/collectionService.ts";
import { STAMP_FILTER_TYPES, STAMP_TYPES, SUBPROTOCOLS } from "$globals";

const MAX_PAGE_SIZE = 120;

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    const url = new URL(req.url);

    // Only process requests for /stamp route
    if (url.searchParams.has("_fresh") && !url.pathname.startsWith("/stamp")) {
      return new Response(null, { status: 204 });
    }

    try {
      const sortBy = url.searchParams.get("sortBy") || "DESC";
      const view = url.searchParams.get("view") || "small";
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
          url: url.origin,
        });
      }

      const { data: stamps = [], ...restResult } = result;
      const data = {
        ...restResult,
        stamps: Array.isArray(stamps) ? stamps : [],
        filterBy,
        sortBy,
        view: view,
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
    view,
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
        view={view}
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
  );
}

export default StampPage;
