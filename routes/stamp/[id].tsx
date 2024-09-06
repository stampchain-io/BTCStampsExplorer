import { StampRow, StampSectionProps } from "globals";
import { Handlers } from "$fresh/server.ts";
import StampSection from "$components/stamp/StampSection.tsx";
import { StampImage } from "$components/stampDetails/StampImage.tsx";
import { StampShare } from "$components/stampDetails/StampShare.tsx";
import { StampInfo } from "$components/stampDetails/StampInfo.tsx";
import { StampRelatedInfo } from "$islands/stamp/details/StampRelatedInfo.tsx";
import { StampController } from "$lib/controller/stampController.ts";
import { StampService } from "$lib/services/stampService.ts";
import { Head } from "$fresh/runtime.ts";

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
    stamps_recent: StampRow[];
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
}

export const handler: Handlers<StampData> = {
  async GET(_req: Request, ctx) {
    try {
      const { id } = ctx.params;
      const stampData = await StampController.getStampDetailsById(id);
      const result = await StampController.getRecentSales();

      if (!stampData) {
        return new Response("Stamp not found", { status: 404 });
      }

      return ctx.render({
        ...stampData.data,
        ...result,
        last_block: stampData.last_block,
      });
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function StampPage(props: StampDetailPageProps) {
  const { stamp, holders, sends, dispensers, dispenses, stamps_recent } =
    props.data;

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
      type: "recent",
      stamps: stamps_recent,
      layout: "row",
    },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-12">
          <div class="flex flex-col gap-8 justify-between sm:col-span-3">
            <StampImage
              stamp={stamp}
              className="w-[calc(100%-80px)] md:w-full"
            />
            {/* <StampShare stamp={stamp} /> */}
          </div>
          <div className={"sm:col-span-2"}>
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
          <h1 class="text-3xl md:text-7xl text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
            LATEST STAMPS
          </h1>
          <div class="flex flex-col gap-12">
            {sections.map((section) => (
              <StampSection key={section.type} {...section} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
