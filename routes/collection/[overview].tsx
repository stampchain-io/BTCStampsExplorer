/* ===== COLLECTION OVERVIEW PAGE ===== */
import { STAMP_FILTER_TYPES } from "$globals";
import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { StampController } from "$server/controller/stampController.ts";
import { CollectionService } from "$server/services/collectionService.ts";
import { CollectionRow } from "$server/types/collection.d.ts";
import { StampOverviewContent } from "$content";
import { CollectionDetailGallery } from "$section";
import { CollectionOverviewHeader } from "$header";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";

/* ===== CONSTANTS ===== */
const MAX_PAGE_SIZE = 120;

/* ===== TYPES ===== */
interface CollectionOverviewPageProps {
  selectedTab: "artist" | "posh" | "recursive";
  stamps?: any[];
  collections?: CollectionRow[];
  page: number;
  pages: number;
  _page_size: number;
  sortBy: string;
  filterBy: string[];
  partial?: boolean;
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<CollectionOverviewPageProps> = {
  async GET(req: Request, ctx: FreshContext) {
    try {
      const overview = ctx.params.overview || "artist";

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

      switch (overview) {
        case "artist": {
          const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
          const collectionsData = await CollectionController
            .getCollectionStamps(
              {
                limit: page_size,
                page: page,
                creator: "",
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
          });
        }

        case "posh": {
          const filterBy = url.searchParams.get("filterBy")
            ? (url.searchParams.get("filterBy")?.split(",").filter(
              Boolean,
            ) as STAMP_FILTER_TYPES[])
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
            pages: result.totalPages,
            page_size,
            filterBy,
            sortBy,
            partial: url.searchParams.has("_fresh"),
          });
        }

        case "recursive": {
          const result = await StampController.getStamps({
            page,
            limit: page_size,
            sortBy: sortBy as "DESC" | "ASC",
            type: "all",
            filterBy: ["recursive"] as STAMP_FILTER_TYPES[],
            ident: [],
            collectionId: undefined,
          });

          return ctx.render({
            selectedTab: "recursive",
            stamps: Array.isArray(result.data) ? result.data : [],
            page,
            pages: result.totalPages,
            page_size,
            filterBy: ["recursive"],
            sortBy,
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
    _page_size,
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
                page={page}
                totalPages={pages}
                prefix=""
              />
            </div>
          </>
        );

      case "posh":
      case "recursive":
        return (
          <div class="w-full flex flex-col items-center" f-client-nav>
            <div data-partial="/stamp">
              <StampOverviewContent
                stamps={stamps || []}
                isRecentSales={false}
                pagination={{
                  page,
                  totalPages: pages,
                  prefix: "",
                }}
              />
            </div>
          </div>
        );
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
