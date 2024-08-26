import { StampPageProps } from "globals";
import { Pagination } from "$islands/pagination/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { StampContent } from "$islands/stamp/StampContent.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";
import { CollectionService } from "$lib/services/collectionService.ts";
import { SUBPROTOCOLS } from "globals";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      let orderBy = url.searchParams.get("order")?.toUpperCase() == "ASC"
        ? "ASC"
        : "DESC";
      const sortBy = url.searchParams.get("sortBy") || "none";
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const selectedTab = url.searchParams.get("ident") || "all";
      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = parseInt(
        url.searchParams.get("limit") || "24",
      );

      let ident: SUBPROTOCOLS[] = [];
      let collectionId;
      const type: "stamps" | "cursed" | "all" | undefined = "all";

      if (selectedTab === "posh") {
        orderBy = "ASC"; // FIXME: this will override that set in the urlParams
        const poshCollection = await CollectionService.getCollectionByName(
          "posh",
        );

        if (poshCollection) {
          collectionId = poshCollection.collection_id;
        } else {
          throw new Error("Posh collection not found");
        }
      } else {
        ident = selectedTab === "all"
          ? ["STAMP", "SRC-721", "SRC-20"]
          : ["STAMP", "SRC-721"];
      }

      const result = await StampController.getStamps({
        page,
        limit: page_size,
        orderBy: orderBy as "ASC" | "DESC",
        sortBy,
        type,
        filterBy,
        ident,
        collectionId,
      });
      const { data: stamps, ...restResult } = result;
      const data = {
        ...restResult,
        stamps,
        filterBy,
        sortBy,
        selectedTab,
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

  return (
    <div class="w-full flex flex-col items-center">
      <StampHeader
        filterBy={filterBy}
        sortBy={sortBy}
        selectedTab={selectedTab}
      />
      <StampContent
        stamps={stamps}
      />
      <Pagination
        page={page}
        pages={totalPages}
        page_size={limit}
        type={"stamp"}
        data_length={stamps.length}
      />
    </div>
  );
}
export default StampPage;
