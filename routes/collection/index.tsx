/* ===== COLLECTION LANDING PAGE ===== */
import {
  CollectionGalleryProps,
  StampGalleryProps,
  StampRow,
  SUBPROTOCOLS,
} from "$globals";
import { FreshContext, Handlers } from "$fresh/server.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { StampController } from "$server/controller/stampController.ts";
import { CollectionRow } from "$server/types/collection.d.ts";
import { body, gapSection } from "$layout";
import {
  ArtistGallery,
  CollectionGallery,
  RecursiveContactCta,
  StampGallery,
  StampPoshCta,
} from "$section";

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
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const selectedTab = url.searchParams.get("ident") || "all";
      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = parseInt(url.searchParams.get("limit") || "20");

      const result = await StampController.getCollectionPageData({ sortBy });
      const collectionsData = await CollectionController.getCollectionStamps({
        limit: page_size,
        page: page,
        creator: "",
        sortBy,
      });

      let collections: CollectionRow[] = [];
      const type: "stamps" | "cursed" | "all" = "all";
      const ident: SUBPROTOCOLS[] = selectedTab === "all"
        ? ["STAMP", "SRC-721", "SRC-20"] as SUBPROTOCOLS[]
        : ["STAMP", "SRC-721"] as SUBPROTOCOLS[];

      await Promise.all(
        collectionsData?.data.map(async (item) => {
          const collectionResult = await StampController.getStamps({
            page,
            limit: page_size,
            sortBy,
            type,
            filterBy,
            ident,
            collectionId: item.collection_id,
          });
          collections.push({
            ...item,
            img: collectionResult.data?.[0]?.stamp_url,
          });
        }),
      );
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
  const CollectionsSection: StampGalleryProps[] = [
    {
      title: "COLLECTIONS",
      subTitle: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      layout: "grid",
      showDetails: false,
      gridClass: `
      grid w-full gap-6
      grid-cols-3
      mobileSm:grid-cols-3
      mobileMd:grid-cols-4
      mobileLg:grid-cols-5
      tablet:grid-cols-6
      desktop:grid-cols-7
      auto-rows-fr
    `,
      displayCounts: {
        "mobileSm": 6, // 3 columns x 2 rows
        "mobileMd": 8, // 4 columns x 2 rows
        "mobileLg": 10, // 5 columns x 2 rows
        "tablet": 12, // 6 columns x 2 rows
        "desktop": 14, // 87columns x 2 rows
      },
      viewAllLink: "/collection/overview/posh",
    },
    {
      subTitle: "RECENT RECURSIVE",
      type: "recursive",
      stamps: stamps_src721,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full gap-6
        grid-cols-4
        mobileSm:grid-cols-4
        mobileMd:grid-cols-5
        mobileLg:grid-cols-6
        tablet:grid-cols-7
        desktop:grid-cols-8
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 8, // 4 columns x 2 rows
        "mobileMd": 10, // 5 columns x 2 rows
        "mobileLg": 12, // 6 columns x 2 rows
        "tablet": 14, // 7 columns x 2 rows
        "desktop": 16, // 8 columns x 2 rows
      },
      viewAllLink: "/collection/overview/recursive",
    },
  ];

  const EspeciallyPoshSection: CollectionGalleryProps = {
    title: "ESPECIALLY POSH",
    subTitle: "STAMP COLLECTIONS",
    collections: collections,
    gridClass: `
      grid gap-6
      grid-cols-3 
      tablet:grid-cols-4 
      desktop:grid-cols-5
    `,
    displayCounts: {
      "mobileSm": 3, // 2 columns x 1 rows
      "mobileLg": 3, // 2 columns x 1 rows
      "tablet": 4, // 3 columns x 1 rows
      "desktop": 5, // 4 columns x 1 rows
    },
  };

  const CuttingEdgeSection: CollectionGalleryProps = {
    title: "CUTTING EDGE",
    subTitle: "SRC-721r COLLECTIONS",
    collections: collections,
    gridClass: `
      grid gap-6
      grid-cols-3 
      tablet:grid-cols-4 
      desktop:grid-cols-5
    `,
    displayCounts: {
      "mobileSm": 3, // 2 columns x 1 rows
      "mobileLg": 3, // 2 columns x 1 rows
      "tablet": 4, // 3 columns x 1 rows
      "desktop": 5, // 4 columns x 1 rows
    },
  };

  const PopularArtistGallery: CollectionGalleryProps = {
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

  /* ===== COMPONENT ===== */
  return (
    <div className={`${body} ${gapSection}`}>
      <StampGallery
        fromPage="collection"
        sortBy={sortBy}
        {...CollectionsSection[0]}
      />
      <div class="relative">
        <CollectionGallery {...EspeciallyPoshSection} />
        <StampPoshCta />
      </div>
      <StampGallery {...CollectionsSection[1]} />
      <div class="relative">
        <CollectionGallery {...CuttingEdgeSection} />
        <RecursiveContactCta />
      </div>
      <ArtistGallery {...PopularArtistGallery} />
    </div>
  );
}
