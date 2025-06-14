/* ===== COLLECTION LANDING PAGE ===== */
import {
  CollectionGalleryProps,
  STAMP_FILTER_TYPES,
  StampGalleryProps,
  StampRow,
} from "$globals";
import { FreshContext, Handlers } from "$fresh/server.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { StampController } from "$server/controller/stampController.ts";
import { CollectionRow } from "$server/types/collection.d.ts";
import { body, gapSection } from "$layout";
import {
  CollectionDetailGallery,
  RecursiveContactCta,
  StampGallery,
  StampPoshCta,
} from "$section";
import { CollectionOverviewHeader } from "$header";

/* ===== TYPES ===== */
type CollectionLandingPageProps = {
  data: {
    collections: CollectionRow[];
    total: number;
    _page: number;
    _pages: number;
    _page_size: number;
    _filterBy: string[];
    sortBy: "ASC" | "DESC";
    stamps_src721: StampRow[];
    stamps_posh: StampRow[];
  };
};

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const sortBy = url.searchParams.get("sortBy")?.toUpperCase() == "ASC"
        ? "ASC"
        : "DESC";
      const filterBy = url.searchParams.get("filterBy")?.split(",").filter(
        Boolean,
      ) as STAMP_FILTER_TYPES[] || [];
      const selectedTab = url.searchParams.get("ident") || "all";
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "60");

      const result = await StampController.getCollectionPageData({ sortBy });
      const collectionsData = await CollectionController.getCollectionStamps({
        limit: limit,
        page: page,
        creator: "",
        sortBy,
      });

      const collections: CollectionRow[] = [];
      const type: "stamps" | "cursed" | "all" = "all";

      // Process collections sequentially to avoid overwhelming the counterparty API
      for (const item of collectionsData?.data || []) {
        try {
          const collectionResult = await StampController.getStamps({
            page,
            limit: limit,
            sortBy,
            type,
            filterBy,
            collectionId: item.collection_id,
            skipDispenserLookup: true,
            skipPriceCalculation: true,
          } as any); // Temporary type assertion to bypass TypeScript issue
          collections.push({
            ...item,
            img: collectionResult.data?.[0]?.stamp_url,
          });

          // Add a small delay between requests (reduced since we're skipping dispenser calls)
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(
            `Failed to load collection ${item.collection_id}:`,
            error,
          );
          // Add collection without image if it fails
          collections.push({
            ...item,
            img: "",
          });
        }
      }
      const data = {
        collections: collections,
        page: collectionsData.page,
        pages: collectionsData.totalPages,
        page_size: collectionsData.limit,
        filterBy,
        sortBy,
        selectedTab,
        stamps_src721: result.stamps_src721,
        stamps_posh: result.stamps_posh,
      };
      return await ctx.render(data);
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function CollectionLandingPage(
  props: CollectionLandingPageProps,
) {
  const {
    collections,
    sortBy,
    stamps_src721 = [],
    stamps_posh = [],
  } = props.data;

  /* ===== SECTION CONFIGURATIONS ===== */
  const CollectionSection: StampGalleryProps[] = [
    {
      subTitle: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full gap-6
        grid-cols-2
        mobileSm:grid-cols-2
        mobileMd:grid-cols-3
        mobileLg:grid-cols-4
        tablet:grid-cols-5
        desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 8, // 2 columns x 4 rows
        "mobileMd": 12, // 3 columns x 4 rows
        "mobileLg": 16, // 4 columns x 4 rows
        "tablet": 20, // 5 columns x 4 rows
        "desktop": 24, // 6 columns x 4 rows
      },
      viewAllLink: "/collection/posh",
    },
    {
      subTitle: "RECENT RECURSIVE",
      type: "recursive",
      stamps: stamps_src721,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full gap-6
        grid-cols-3
        mobileSm:grid-cols-3
        mobileMd:grid-cols-4
        mobileLg:grid-cols-5
        tablet:grid-cols-6
        desktop:grid-cols-8
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 6, // 3 columns x 2 rows
        "mobileMd": 8, // 4 columns x 2 rows
        "mobileLg": 10, // 5 columns x 2 rows
        "tablet": 12, // 6 columns x 2 rows
        "desktop": 16, // 8 columns x 2 rows
      },
      viewAllLink: "/collection/recursive",
    },
  ];

  const CollectionDetailSection: CollectionGalleryProps = {
    title: "POPULAR ARTIST",
    subTitle: "COLLECTIONS",
    collections: collections,
    gridClass: `
      grid gap-3 mobileLg:gap-6
      grid-cols-1
    `,
    displayCounts: {
      "mobileSm": 5, // 1 columns x 5 rows
      "mobileLg": 5, // 1 columns x 5 rows
      "tablet": 5, // 1 columns x 5 rows
      "desktop": 5, // 1 columns x 5 rows
    },
  };

  {
    /*
  const EspeciallyPoshSection: CollectionGalleryProps = {
    title: "ESPECIALLY POSH",
    subTitle: "STAMP COLLECTIONS",
    collections: collections,
    gridClass: `
      grid gap-3 mobileLg:gap-6
      grid-cols-2 tablet:grid-cols-3
    `,
    displayCounts: {
      "mobileSm": 2, // 2 columns x 1 rows
      "mobileLg": 2, // 2 columns x 1 rows
      "tablet": 3, // 3 columns x 1 rows
      "desktop": 3, // 3 columns x 1 rows
    },
  };

  const CuttingEdgeSection: CollectionGalleryProps = {
    title: "CUTTING EDGE",
    subTitle: "SRC-721r COLLECTIONS",
    collections: collections,
    gridClass: `
      grid gap-3 mobileLg:gap-6
      grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4
    `,
    displayCounts: {
      "mobileSm": 2, // 2 columns x 1 rows
      "mobileLg": 2, // 2 columns x 1 rows
      "tablet": 3, // 3 columns x 1 rows
      "desktop": 4, // 4 columns x 1 rows
    },
  };
    */
  }

  /* ===== COMPONENT ===== */
  return (
    <div className={`${body} ${gapSection}`}>
      <div>
        <CollectionOverviewHeader />
        <StampGallery
          sortBy={sortBy}
          {...CollectionSection[0]}
        />
        <StampPoshCta />
      </div>
      <div>
        <StampGallery {...CollectionSection[1]} />
        <RecursiveContactCta />
      </div>
      <CollectionDetailGallery {...CollectionDetailSection} />
      {
        /*
        <CollectionGallery {...EspeciallyPoshSection} />
        <CollectionGallery {...CuttingEdgeSection} />
      */
      }
    </div>
  );
}
