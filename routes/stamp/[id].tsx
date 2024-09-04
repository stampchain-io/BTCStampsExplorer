import { StampRow } from "globals";
import { Handlers } from "$fresh/server.ts";
import { Stamp } from "$components/Stamp.tsx";
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

      if (!stampData) {
        return new Response("Stamp not found", { status: 404 });
      }
      // TODO: Get holders for src-20 tokens
      return ctx.render({
        ...stampData.data,
        last_block: stampData.last_block,
      }); // Spread the stampData to avoid the extra nesting
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function StampPage(props: StampDetailPageProps) {
  const { stamp, holders, sends, dispensers, dispenses } = props.data;

  const title = stamp.name
    ? `${stamp.name}`
    : `Bitcoin Stamp #${stamp.stamp} - stampchain.io`;

  const dispensesWithRates = StampService.mapDispensesWithRates(
    dispenses,
    dispensers,
  );

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        <div class="flex flex-col gap-8 justify-between">
          <Stamp stamp={stamp} className="w-[calc(100%-80px)] md:w-full" />
          <StampShare stamp={stamp} />
        </div>
        <StampInfo stamp={stamp} />
      </div>

      <StampRelatedInfo
        sends={sends}
        dispensers={dispensers}
        holders={holders}
        dispensesWithRates={dispensesWithRates}
      />
    </>
  );
}
