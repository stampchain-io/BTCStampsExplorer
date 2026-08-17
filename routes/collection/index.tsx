/* ===== COLLECTION LANDING PAGE ===== */

import { PaginationButtons } from "$button";
import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import { CollectionOverviewHeader } from "$header";
import { containerBackground } from "$layout";
import { CollectionGallery } from "$section";
import { CollectionController } from "$server/controller/collectionController.ts";
import type { CollectionOverviewPageProps } from "$types/index.d.ts";

/* ===== CONSTANTS ===== */
const MAX_PAGE_SIZE = 120;

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<CollectionOverviewPageProps> = {
  async GET(req: Request, ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const sortBy = url.searchParams.get("sortBy")?.toUpperCase() == "DESC"
        ? "DESC"
        : "ASC";
      const page = parseInt(url.searchParams.get("page") || "1");
      const requestedPageSize = parseInt(url.searchParams.get("limit") || "60");
      const page_size = Math.min(requestedPageSize, MAX_PAGE_SIZE);
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];

      const collectionsData = await CollectionController.getCollectionStamps({
        limit: page_size,
        page,
        sortBy,
      });

      return ctx.render({
        collections: collectionsData.data,
        page: collectionsData.page,
        pages: collectionsData.totalPages,
        page_size: collectionsData.limit,
        filterBy,
        sortBy,
      });
    } catch (error) {
      console.error("Error in collection overview:", error);
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function CollectionLandingPage(
  { data }: PageProps<CollectionOverviewPageProps>,
) {
  const { collections, page, pages, sortBy = "ASC" } = data;

  /* ===== COMPONENT ===== */
  return (
    <div
      class={containerBackground}
      f-client-nav
      data-partial="/collection"
    >
      <CollectionOverviewHeader sortBy={sortBy} />
      <CollectionGallery collections={collections || []} />
      <PaginationButtons
        page={page ?? 1}
        totalPages={pages ?? 1}
        // Remove onPageChange to let PaginationButtons component use its built-in Fresh navigation
        prefix=""
      />
    </div>
  );
}
