import {
  CollectionOverviewSectionProps,
  CollectionSectionProps,
  StampRow,
  StampSectionProps,
} from "globals";
import { FreshContext, Handlers } from "$fresh/server.ts";

import StampSection from "$islands/stamp/StampSection.tsx";
import CollectionSection from "$islands/collection/CollectionSection.tsx";

import { CollectionController } from "$server/controller/collectionController.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RecursiveLayeringModule } from "$islands/modules/RecursiveLayering.tsx";
import { NamedAssetsModule } from "$islands/modules/NamedAssets.tsx";
import CollectionOverviewSection from "$islands/collection/CollectionOverviewSection.tsx";

type CollectionPageProps = {
  data: {
    collections: CollectionRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    filterBy: string[];
    stamps_src721: StampRow[];
    stamps_posh: StampRow[];
  };
};

export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    try {
      const result = await StampController.getCollectionPageData();

      const url = new URL(req.url);
      const sortBy = url.searchParams.get("sortBy")?.toUpperCase() == "ASC"
        ? "ASC"
        : "DESC";
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const selectedTab = url.searchParams.get("ident") || "all";
      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = parseInt(url.searchParams.get("limit") || "20");

      const collectionsData = await CollectionController.getCollectionStamps({
        limit: page_size,
        page: page,
        creator: "",
      });
      const data = {
        collections: collectionsData.data,
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

export default function Collection(props: CollectionPageProps) {
  const {
    collections,
    page,
    pages,
    page_size,
    filterBy,
    stamps_src721 = [],
    stamps_posh = [],
  } = props.data;

  const CollectionsSection: StampSectionProps[] = [
    {
      title: "COLLECTIONS",
      subTitle: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full
        gap-3
        mobileMd:gap-6
        grid-cols-2
        mobileLg:grid-cols-3
        tablet:grid-cols-4
        desktop:grid-cols-5
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 6, // 2 columns x 3 rows
        "mobileLg": 9, // 3 columns x 3 rows
        "tablet": 12, // 4 columns x 3 rows
        "desktop": 20, // 5 columns x 4 rows
      },
      viewAllLink: "/collection/overview/posh",
    },
    {
      subTitle: "RECENT RECURSIVE",
      type: "recursive",
      stamps: stamps_src721,
      layout: "row",
      showDetails: false,
      gridClass: `
        grid w-full
        gap-3
        mobileMd:gap-6
        grid-cols-3
        mobileSm:grid-cols-3
        mobileLg:grid-cols-4
        tablet:grid-cols-5
        desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 6, // 3 columns x 2 rows
        "mobileLg": 8, // 4 columns x 2 rows
        "tablet": 10, // 5 columns x 2 rows
        "desktop": 12, // 6 columns x 2 rows
      },
      viewAllLink: "/collection/overview/recursive",
    },
  ];

  const EspeciallyPoshSection: CollectionSectionProps = {
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

  const CuttingEdgeSection: CollectionSectionProps = {
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

  const PopularArtistSection: CollectionOverviewSectionProps = {
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

  return (
    <div class="text-stamp-grey-light flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
      <StampSection {...CollectionsSection[0]} />
      <div class="relative">
        <CollectionSection {...EspeciallyPoshSection} />
        <NamedAssetsModule />
      </div>
      <StampSection {...CollectionsSection[1]} />
      <div class="relative">
        <CollectionSection {...CuttingEdgeSection} />
        <RecursiveLayeringModule />
      </div>
      <CollectionOverviewSection {...PopularArtistSection} />
    </div>
  );
}
