import { StampRow, StampSectionProps } from "globals";
import { FreshContext, Handlers } from "$fresh/server.ts";

import { ViewAllButton } from "$components/shared/ViewAllButton.tsx";
import StampSection from "$islands/stamp/StampSection.tsx";
import { CollectionOverviewCard } from "$components/collection/CollectionOverviewCard.tsx";
import { CollectionListCard } from "$components/collection/CollectionListCard.tsx";

import { CollectionController } from "$server/controller/collectionController.ts";
import { StampController } from "$server/controller/stampController.ts";
import CollectionSection from "$islands/collection/CollectionSection.tsx";

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

  const SectionsCollections: StampSectionProps[] = [
    {
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

  const titlePurpleDLClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";
  const titleGreyDLClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient3";
  const subTitleGreyClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const subTitlePurpleClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3";
  const bodyTextLightClassName =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const buttonGreyFlatClassName =
    "inline-flex items-center justify-center bg-stamp-grey border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:bg-stamp-grey-light transition-colors";
  const buttonGreyOutlineClassName =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  return (
    <div className="text-stamp-grey-light flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
      <section className="flex flex-col">
        <div className="relative">
          <h1 className={titlePurpleDLClassName}>
            COLLECTIONS
          </h1>
        </div>
        <div className="flex flex-col pb-12 mobileLg:pb-24 desktop:pb-36">
          <StampSection
            key={SectionsCollections[0].type}
            {...SectionsCollections[0]}
          />
        </div>
        <div className="relative">
          <h1 className={titleGreyDLClassName}>
            ESPECIALLY POSH
            <h2 className={`${subTitleGreyClassName} mb-1.5 mobileLg:mb-3`}>
              STAMP COLLECTIONS
            </h2>
          </h1>
          <CollectionSection
            collections={collections}
            gridClass="grid grid-cols-2 tablet:grid-cols-3 gap-3 mobileLg:gap-6"
            displayCounts={{
              "mobileSm": 2, // 2 columns x 1 rows
              "mobileLg": 2, // 2 columns x 1 rows
              "tablet": 3, // 3 columns x 1 rows
              "desktop": 3, // 3 columns x 1 rows
            }}
          />
          <div className="flex flex-col mt-6 mobileLg:mt-12">
            <h2 className={subTitleGreyClassName}>
              NAMED ASSETS
            </h2>
            <div
              className={`grid grid-cols-1 tablet:grid-cols-2 gap-3 mobileLg:gap-6 ${bodyTextLightClassName}`}
            >
              <p>
                Posh stamps are an advanced version of cursed stamps integrated
                with the Counterparty asset-naming system.<br />
                <br />
                While they require additional steps to acquire XCP to conform to
                the Counterparty Meta-Protocol rules,{" "}
                <span className="font-bold">
                  this allows artists to create a vanity name on-chain for their
                  stamps and collections.
                </span>
              </p>
              <p>
                <span className="font-bold">
                  With the Stampchain stamping tool we've made it smooth and
                  frictionless to create Posh stamps.
                </span>
                <br />
                We handle the XCP fee and you pay in BTC.<br />
                <br />
                Your most treasured art can now have unique names, instead of
                just arbitrary numbers.
              </p>
            </div>
          </div>
          <a
            href="/stamping/stamp"
            f-partial="/stamping/stamp"
            className={`${buttonGreyFlatClassName} float-right`}
          >
            STAMP
          </a>
        </div>
      </section>
      <section className="flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
        <StampSection
          key={SectionsCollections[1].type}
          {...SectionsCollections[1]}
        />
        <div className="relative">
          <h1 className={titleGreyDLClassName}>
            CUTTING EDGE
            <h2 className={subTitleGreyClassName}>
              SRC-721r COLLECTIONS
            </h2>
          </h1>
          <CollectionSection
            collections={collections}
            gridClass="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-3 mobileLg:gap-6"
            displayCounts={{
              "mobileSm": 2, // 2 columns x 1 rows
              "mobileLg": 2, // 2 columns x 1 rows
              "tablet": 3, // 3 columns x 1 rows
              "desktop": 4, // 4 columns x 1 rows
            }}
          />
          <div className="flex flex-col mt-6 mobileLg:mt-12">
            <h2 className={subTitleGreyClassName}>
              RECURSIVE LAYERING
            </h2>
            <div
              className={`grid grid-cols-1 tablet:grid-cols-2 gap-3 mobileLg:gap-6 ${bodyTextLightClassName}`}
            >
              <p>
                <span className="font-bold">
                  SRC-721r allows for recursive NFT creation
                </span>{" "}
                by leveraging multiple layers of data utilizing not just JSON,
                but also on-chain JS libraries to build complex recursion and
                on-chain web applications.<br />
                <br />
                Its structure maximizes cost efficiency, making it suitable for
                larger, more detailed and animated art collections.
              </p>
              <p>
                Get in contact with us if you're planning a large PFP collection
                or dreaming of complex multilayered art compositions.<br />
                <br />
                <span className="font-bold">
                  We would love to get involved and can definitely help you out
                  !
                </span>
              </p>
            </div>
          </div>
          <a
            href="/about#contact"
            f-partial="/about#contact"
            className={`${buttonGreyOutlineClassName} float-right`}
          >
            CONTACT
          </a>
        </div>
      </section>
      <section className="flex flex-col">
        <div className="relative">
          <h1 className={titlePurpleDLClassName}>
            POPULAR ARTIST
            <h2 className={subTitlePurpleClassName}>
              COLLECTIONS
            </h2>
          </h1>
        </div>
        <div className="flex flex-col gap-3 mobileLg:gap-6">
          {collections.slice(0, 5).map((collection) => (
            <CollectionOverviewCard
              key={collection.collection_id}
              collection={collection}
            />
          ))}
        </div>
        <ViewAllButton href="/collection/overview/artist" />
      </section>
    </div>
  );
}
