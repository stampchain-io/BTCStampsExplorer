import { StampPageProps } from "globals";
import { Pagination } from "$islands/pagination/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { StampContent } from "$islands/stamp/StampContent.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";
import { CollectionService } from "$lib/services/collectionService.ts";
import { FILTER_TYPES, STAMP_TYPES, SUBPROTOCOLS } from "globals";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const sortBy = url.searchParams.get("sortBy") || "DESC";
      const filterBy = url.searchParams.get("filterBy")
        ? (url.searchParams.get("filterBy")?.split(",").filter(
          Boolean,
        ) as FILTER_TYPES[])
        : [];
      const selectedTab =
        (url.searchParams.get("type") || "all") as STAMP_TYPES;
      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = parseInt(url.searchParams.get("limit") || "24");
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
      return ctx.render(data);
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      return new Response("Internal Server Error", { status: 500 });
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

  // Ensure stamps is an array
  const stampsArray = Array.isArray(stamps) ? stamps : [];
  const isRecentSales = selectedTab === "recent_sales";

  return (
    <div class="w-full flex flex-col items-center">
      <StampHeader
        filterBy={filterBy as FILTER_TYPES[]}
        sortBy={sortBy}
        selectedTab={selectedTab}
        type={selectedTab}
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
