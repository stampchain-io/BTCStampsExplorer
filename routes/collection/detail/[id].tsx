/* ===== COLLECTION DETAILS PAGE ===== */
import { FreshContext, Handlers } from "$fresh/server.ts";
import { STAMP_FILTER_TYPES, StampRow, SUBPROTOCOLS } from "$globals";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { CollectionDetailContent } from "$content";
import { StampController } from "$server/controller/stampController.ts";
import { CollectionService } from "$server/services/collectionService.ts";
import { CollectionDetailHeader } from "$header";
/* ===== TYPES ===== */
type CollectionDetailsPageProps = {
  data: {
    id: string;
    collection: any;
    stamps: StampRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    selectedTab: "all" | "classic" | "posh";
    sortBy: string;
    filterBy: string[];
  };
};

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    try {
      // Decode the collection name to handle spaces and special characters
      const id = decodeURIComponent(ctx.params.id);

      const url = new URL(req.url);
      const sortBy = url.searchParams.get("sortBy")?.toUpperCase() === "ASC"
        ? "ASC"
        : "DESC";
      const filterBy = url.searchParams.get("filterBy")?.split(",").map((f) =>
        f as STAMP_FILTER_TYPES
      ) || [];
      const selectedTab = url.searchParams.get("ident") || "all";
      const ident: SUBPROTOCOLS[] = selectedTab === "all"
        ? ["STAMP", "SRC-721", "SRC-20"] as SUBPROTOCOLS[]
        : ["STAMP", "SRC-721"] as SUBPROTOCOLS[];
      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = parseInt(url.searchParams.get("limit") || "20");

      const type: "stamps" | "cursed" | "all" = "all";

      const collection = await CollectionService.getCollectionByName(id);

      if (!collection) {
        return ctx.renderNotFound();
      }

      const collectionId = collection.collection_id;
      const result = await StampController.getStamps({
        page,
        limit: page_size,
        sortBy,
        type,
        filterBy,
        ident,
        collectionId,
      });

      const data = {
        id,
        collection,
        stamps: result.data,
        page: result.page,
        pages: result.totalPages,
        page_size: result.limit,
        filterBy,
        sortBy,
        selectedTab,
      };
      return await ctx.render(data);
    } catch (error) {
      console.error("Error in collection details:", error);
      if ((error as Error).message?.includes("Collection not found")) {
        return ctx.renderNotFound();
      }
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function CollectionDetailPage(
  props: CollectionDetailsPageProps,
) {
  const {
    id: _id,
    stamps,
    page,
    pages,
    collection,
  } = props.data;

  /* ===== COMPONENT ===== */
  return (
    <div class="flex flex-col gap-6">
      <CollectionDetailHeader collection={collection} stamps={stamps} />
      <CollectionDetailContent stamps={stamps} />
      <div class="mt-12 mobileLg:mt-[72px]">
        <Pagination
          page={page}
          totalPages={pages}
          onPageChange={(newPage) => {
            const url = new URL(globalThis.location.href);
            url.searchParams.set("page", newPage.toString());
            globalThis.location.href = url.toString();
          }}
        />
      </div>
    </div>
  );
}
