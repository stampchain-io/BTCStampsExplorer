import {
  Collection,
  CollectionSectionProps,
  StampRow,
  StampSectionProps,
} from "$globals";

import StampSection from "$islands/stamp/StampSection.tsx";
import CollectionSection from "$islands/collection/CollectionSection.tsx";
import { ModulesStyles } from "$islands/modules/Styles.ts";

interface HomeStampPreviewProps {
  stamps_art?: StampRow[];
  stamps_posh?: StampRow[];
  stamps_src721?: StampRow[];
  collectionData?: Collection[];
}

export function HomeStampPreview({
  stamps_src721 = [],
  stamps_art = [],
  stamps_posh = [],
  collectionData = [],
}: HomeStampPreviewProps) {
  const LatestArtStampsSection: StampSectionProps[] = [
    {
      subTitle: "ON-CHAIN MARVELS",
      type: "classic",
      stamps: stamps_art,
      fromPage: "home",
      layout: "grid",
      showDetails: false,
      showEdition: true,
      viewAllLink: "/stamp/art",
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-2 mobileLg:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5
        auto-rows-fr
      `,
      displayCounts: {
        mobileSm: 8,
        mobileLg: 12,
        tablet: 16,
        desktop: 20,
      },
    },
  ];

  const FeaturedArtistsSection: CollectionSectionProps = {
    title: "FEATURED ARTISTS",
    subTitle: "RECURSIVE COLLECTIONS",
    collections: collectionData,
    gridClass: `
      grid
      grid-cols-2 tablet:grid-cols-3 gap-3 mobileLg:gap-6
    `,
    displayCounts: {
      mobileSm: 2,
      mobileLg: 2,
      tablet: 3,
      desktop: 3,
    },
  };

  const CollectionsSection: StampSectionProps[] = [
    {
      title: "COLLECTIONS",
      subTitle: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      fromPage: "home",
      layout: "grid",
      showDetails: false,
      showEdition: true,
      viewAllLink: "/stamp/posh",
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-2 mobileLg:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5
        auto-rows-fr
      `,
      displayCounts: {
        mobileSm: 4,
        mobileLg: 6,
        tablet: 8,
        desktop: 10,
      },
    },
    {
      subTitle: "RECENT RECURSIVE",
      filterBy: "recursive",
      stamps: stamps_src721,
      fromPage: "home",
      layout: "grid",
      showDetails: false,
      viewAllLink: "/collection/overview/recursive",
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-4 mobileLg:grid-cols-5 tablet:grid-cols-6 desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        mobileSm: 8,
        mobileLg: 10,
        tablet: 12,
        desktop: 12,
      },
    },
  ];

  const CuttingEdgeSection: CollectionSectionProps = {
    title: "CUTTING EDGE",
    subTitle: "RECURSIVE COLLECTIONS",
    collections: collectionData,
    gridClass: `
      grid
      grid-cols-2 tablet:grid-cols-3 gap-3 mobileLg:gap-6
    `,
    displayCounts: {
      mobileSm: 2,
      mobileLg: 2,
      tablet: 3,
      desktop: 3,
    },
  };

  return (
    <div className="
        flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36
        max-w-desktop w-full mx-auto
      ">
      {/* LATEST ART STAMPS */}
      <div className="flex flex-col">
        <div className="w-full">
          <h1 className={ModulesStyles.titlePurpleDL}>
            <span className="block mobileLg:hidden">LATEST STAMPS</span>
            <span className="hidden mobileLg:block">LATEST ART STAMPS</span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 mobileMd:gap-6">
          {LatestArtStampsSection.map((section, index) => (
            <StampSection key={index} {...section} />
          ))}
        </div>
      </div>

      {/* FEATURED ARTISTS */}
      <CollectionSection {...FeaturedArtistsSection} />

      {/* COLLECTIONS */}
      {CollectionsSection.map((section, index) => (
        <StampSection key={index} {...section} />
      ))}

      {/* CUTTING EDGE */}
      <CollectionSection {...CuttingEdgeSection} />
    </div>
  );
}
