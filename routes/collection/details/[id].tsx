import { FreshContext, Handlers } from "$fresh/server.ts";

import { STAMP_FILTER_TYPES, StampRow, SUBPROTOCOLS } from "$globals";

import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { CollectionDetailsHeader } from "$islands/collection/CollectionDetailsHeader.tsx";
import { CollectionDetailsContent } from "$islands/collection/CollectionDetailsContent.tsx";

import { StampController } from "$server/controller/stampController.ts";
import { CollectionService } from "$server/services/collectionService.ts";

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

export default function CollectionDetails(props: CollectionDetailsPageProps) {
  const {
    id,
    stamps,
    page,
    pages,
    page_size,
    collection,
  } = props.data;

  return (
    <div class="flex flex-col gap-3 mobileMd:gap-6">
      <CollectionDetailsHeader collection={collection} stamps={stamps} />
      <CollectionDetailsContent stamps={stamps} />
      <Pagination
        page={page}
        pages={pages}
        page_size={page_size}
        type={"collection/" + id}
        data_length={stamps.length}
      />
    </div>
  );
}
