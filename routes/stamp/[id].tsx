import { StampRow, StampSectionProps } from "globals";

import { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import StampSection from "$components/stamp/StampSection.tsx";
import { StampShare } from "$components/stampDetails/StampShare.tsx";

import { GetStampingModule } from "$islands/modules/GetStamping.tsx";
import { CollectionList } from "$islands/collection/CollectionList.tsx";
import { StampImage } from "$islands/stamp/details/StampImage.tsx";
import { StampInfo } from "$islands/stamp/details/StampInfo.tsx";
import { StampRelatedInfo } from "$islands/stamp/details/StampRelatedInfo.tsx";

import { StampController } from "$lib/controller/stampController.ts";
import { StampService } from "$lib/services/stampService.ts";
import { CollectionService } from "$lib/services/collectionService.ts";
import { ArtistCollection } from "$islands/collection/ArtistCollection.tsx";

interface StampDetailPageProps {
  data: {
    stamp: StampRow;
    total: number;
    sends: any;
    dispensers: any;
    dispenses: any;
    holders: any;
    vaults: any;
    last_block: number;
    stamps_recent: any;
    collections: CollectionRow[];
  };
}

interface StampData {
  stamp: StampRow;
  total: number;
  sends: any;
  dispensers: any;
  dispenses: any;
  holders: any;
  last_block: number;
  stamps_recent: any;
  collections: CollectionRow[];
}

export const handler: Handlers<StampData> = {
  async GET(_req: Request, ctx) {
    try {
      const url = new URL(_req.url);
      const { id } = ctx.params;
      const stampData = await StampController.getStampDetailsById(id);
      const result = await StampController.getRecentSales(1, 6);
      console.log("result: ", result);

      if (!stampData) {
        return new Response("Stamp not found", { status: 404 });
      }

      const page = parseInt(url.searchParams.get("page") || "1");
      const page_size = parseInt(
        url.searchParams.get("limit") || "20",
      );
      const collectionsData = await CollectionService.getCollectionNames({
        limit: page_size,
        page: page,
        creator: "",
      });

      const { collections, pages, pag, limit } = {
        collections: collectionsData.data,
        pages: collectionsData.totalPages,
        pag: collectionsData.page,
        limit: collectionsData.limit,
      };

      return ctx.render({
        ...stampData.data,
        stamps_recent: result,
        collections,
        last_block: stampData.last_block,
      });
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function StampPage(props: StampDetailPageProps) {
  const {
    collections,
    stamp,
    holders,
    sends,
    dispensers,
    dispenses,
    stamps_recent,
  } = props.data;

  const title = stamp.name
    ? `${stamp.name}`
    : `Bitcoin Stamp #${stamp.stamp} - stampchain.io`;

  const dispensesWithRates = StampService.mapDispensesWithRates(
    dispenses,
    dispensers,
  );

  const sections: StampSectionProps[] = [
    {
      title: "RECENT SALES",
      type: "stamps",
      isRecentSales: true,
      stamps: stamps_recent.data,
      layout: "row",
    },
  ];

  console.log(sections);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta
          property="og:description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
        <meta property="og:image" content={stamp.stamp_url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className={"flex flex-col gap-10 md:gap-20 xl:gap-50"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          <div class="flex flex-col gap-8 justify-between items-center">
            <StampImage
              stamp={stamp}
              className="w-[calc(100%-80px)] md:w-full"
              flag={true}
            />
            {/* <StampShare stamp={stamp} /> */}
          </div>
          <div>
            <StampInfo stamp={stamp} />
          </div>
        </div>

        <StampRelatedInfo
          sends={sends}
          dispensers={dispensers}
          holders={holders}
          dispensesWithRates={dispensesWithRates}
        />

        <div>
          <h1 class="text-3xl md:text-7xl text-left bg-clip-text text-transparent bg-gradient-to-r from-[#666666] via-[#999999] to-[#CCCCCC] font-black mb-2">
            ARTIST COLLECTIONS
          </h1>
          <ArtistCollection />
          <p className="font-extralight text-2xl md:text-5xl text-[#CCCCCC] mb-9">
            OTHER COLLECTIONS
          </p>
          <CollectionList collections={collections} />
        </div>

        <div>
          <h1 class="text-3xl md:text-7xl text-left mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
            LATEST STAMPS
          </h1>
          <div class="flex flex-col gap-12">
            {sections.map((section) => (
              <StampSection key={section.type} {...section} />
            ))}
          </div>
        </div>

        <GetStampingModule />
      </div>
    </>
  );
}
