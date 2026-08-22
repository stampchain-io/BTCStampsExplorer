import type { SUBPROTOCOLS } from "$types/base.d.ts";
/* ===== COLLECTION DETAILS PAGE ===== */

import type { StampFilterType } from "$constants";
import { CollectionDetailContent } from "$content";
import { FreshContext, Handlers } from "$fresh/server.ts";
import type { CollectionDetailsPageProps } from "$types/ui.d.ts";

import { PaginationButtons } from "$button";
import { CollectionDetailHeader } from "$header";
import { containerBackground } from "$layout";
import { StampController } from "$server/controller/stampController.ts";
import { CollectionService } from "$server/services/core/collectionService.ts";
/* ===== TYPES ===== */

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
        f as StampFilterType
      ) || [];
      const selectedTab = url.searchParams.get("ident") || "all";
      const ident: SUBPROTOCOLS[] = selectedTab === "all"
        ? ["STAMP", "SRC-721", "SRC-20"] as SUBPROTOCOLS[]
        : ["STAMP", "SRC-721"] as SUBPROTOCOLS[];
      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = parseInt(url.searchParams.get("limit") || "20");

      const type: "stamps" | "cursed" | "all" = "all";

      // "market=listings" scopes the collection's stamp grid down to stamps
      // that currently have an open dispenser (same filter as the /marketplace
      // "LISTINGS" mode)
      const market: "all" | "listings" =
        url.searchParams.get("market") === "listings" ? "listings" : "all";

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
        ...(market === "listings"
          ? {
            market: "listings" as const,
            dispensers: true,
            listings: "all" as const,
          }
          : {}),
      });

      const data = {
        id,
        collection,
        stamps: result.data,
        page: (result as any).page,
        pages: (result as any).totalPages,
        page_size: (result as any).limit,
        filterBy,
        sortBy,
        selectedTab,
        market,
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
    id,
    stamps,
    page,
    pages,
    collection,
    market = "all",
    sortBy,
  } = props.data;

  /* ===== COMPONENT ===== */
  return (
    <div
      class="flex flex-col gap-5"
      f-client-nav
      data-partial={`/collection/${id}`}
    >
      <CollectionDetailHeader collection={collection} stamps={stamps} />
      <div class={containerBackground}>
        <CollectionDetailContent
          stamps={stamps}
          market={market}
          sortBy={sortBy}
          totalStamps={collection?.stamp_count}
          totalEditions={collection?.total_editions}
          listedStamps={collection?.marketData?.listedStamps ?? null}
        />
        <PaginationButtons
          page={page}
          totalPages={pages}
          // Remove onPageChange to let PaginationButtons component use its built-in Fresh navigation
        />
      </div>
    </div>
  );
}
