/* ===== COLLECTION OVERVIEW PAGE ===== */

import type { StampFilterType } from "$constants";
import { StampOverviewContent } from "$content";
import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import type { CollectionOverviewPageProps } from "$types/index.d.ts";

import { CollectionOverviewHeader } from "$header";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { CollectionDetailGallery } from "$section";
import { CollectionController } from "$server/controller/collectionController.ts";
import { StampController } from "$server/controller/stampController.ts";
import { CollectionService } from "$server/services/core/collectionService.ts";

/* ===== CONSTANTS ===== */
const MAX_PAGE_SIZE = 120;

/* ===== TYPES ===== */

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<CollectionOverviewPageProps> = {
  async GET(req: Request, ctx: FreshContext) {
    try {
      const overview = ctx.params.overview || "artist";

      // Explicitly reject "detail" to avoid conflict with detail/[id].tsx route
      if (overview === "detail") {
        return ctx.renderNotFound();
      }

      // Validate overview parameter first
      if (!["artist", "posh", "recursive"].includes(overview)) {
        return ctx.renderNotFound();
      }

      const url = new URL(req.url);
      const sortBy = url.searchParams.get("sortBy")?.toUpperCase() == "ASC"
        ? "ASC"
        : "DESC";
      const page = parseInt(url.searchParams.get("page") || "1");
      const requestedPageSize = parseInt(url.searchParams.get("limit") || "60");
      const page_size = Math.min(requestedPageSize, MAX_PAGE_SIZE);

      // Handle both new view parameter and legacy recentSales parameter
      const viewMode = url.searchParams.get("view") || "all";
      const isRecentSales = viewMode === "sales" ||
        url.searchParams.get("recentSales") === "true";

      switch (overview) {
        case "artist": {
          const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
          const collectionsData = await CollectionController
            .getCollectionStamps(
              {
                limit: page_size,
                page: page,
              },
            );

          return ctx.render({
            selectedTab: "artist",
            collections: collectionsData.data,
            page: collectionsData.page,
            pages: collectionsData.totalPages,
            page_size: collectionsData.limit,
            filterBy,
            sortBy,
            isRecentSales,
          });
        }

        case "posh": {
          const filterBy = url.searchParams.get("filterBy")
            ? (url.searchParams.get("filterBy")?.split(",").filter(
              Boolean,
            ) as StampFilterType[])
            : [];

          const poshCollection = await CollectionService.getCollectionByName(
            "posh",
          );
          if (!poshCollection) {
            return ctx.renderNotFound();
          }

          const result = await StampController.getStamps({
            page,
            limit: page_size,
            sortBy: sortBy as "DESC" | "ASC",
            type: "posh",
            filterBy,
            ident: [],
            collectionId: poshCollection.collection_id,
          });

          return ctx.render({
            selectedTab: "posh",
            stamps: Array.isArray(result.data) ? result.data : [],
            page,
            pages: (result as any).totalPages,
            page_size,
            filterBy,
            sortBy,
            isRecentSales,
            partial: url.searchParams.has("_fresh"),
          });
        }

        case "recursive": {
          const result = await StampController.getStamps({
            page,
            limit: page_size,
            sortBy: sortBy as "DESC" | "ASC",
            type: "all",
            filterBy: ["recursive"] as StampFilterType[],
            ident: [],
            collectionId: undefined,
          });

          return ctx.render({
            selectedTab: "recursive",
            stamps: Array.isArray(result.data) ? result.data : [],
            page,
            pages: (result as any).totalPages,
            page_size,
            filterBy: ["recursive"],
            sortBy,
            isRecentSales,
            partial: url.searchParams.has("_fresh"),
          });
        }

        default:
          return ctx.renderNotFound();
      }
    } catch (error) {
      console.error("Error in collection overview:", error);
      if ((error as Error).message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function CollectionOverviewPage(
  { data }: PageProps<CollectionOverviewPageProps>,
) {
  const {
    selectedTab,
    stamps,
    collections,
    page,
    pages,
    isRecentSales = false,
  } = data;

  /* ===== HELPERS ===== */
  const collectionOverviewContent = () => {
    switch (selectedTab) {
      case "artist":
        return (
          <>
            <CollectionDetailGallery collections={collections || []} />
            <div class="mt-12 mobileLg:mt-[72px]">
              <Pagination
                page={page ?? 1}
                totalPages={pages ?? 1}
                // Remove onPageChange to let Pagination component use its built-in Fresh navigation
                prefix=""
              />
            </div>
          </>
        );

      case "posh":
      case "recursive":
        return (
          <div
            class="w-full flex flex-col items-center"
            f-client-nav
            data-partial="/collection"
          >
            <div>
              <StampOverviewContent
                stamps={stamps || []}
                isRecentSales={isRecentSales}
                pagination={{
                  page: page ?? 1,
                  totalPages: pages ?? 1,
                  // Remove onPageChange to let Pagination component use its built-in Fresh navigation
                  prefix: "",
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ===== COMPONENT ===== */
  return (
    <div class="flex flex-col">
      <CollectionOverviewHeader />
      {collectionOverviewContent()}
    </div>
  );
}
