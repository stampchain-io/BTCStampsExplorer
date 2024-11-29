import { StampRow } from "globals";

import { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import { StampImage } from "$islands/stamp/details/StampImage.tsx";
import { StampInfo } from "$islands/stamp/details/StampInfo.tsx";
import { StampRelatedInfo } from "$islands/stamp/details/StampRelatedInfo.tsx";
import { StampRelatedGraph } from "$islands/stamp/details/StampRelatedGraph.tsx";
import { RecentSales } from "$islands/stamp/details/RecentSales.tsx";

import { StampController } from "$server/controller/stampController.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { DispenserManager } from "$server/services/xcpService.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";

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
    lowestPriceDispenser: any; // Add this property
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
  lowestPriceDispenser: any;
}

// Update CollectionRow interface to be simpler since we only need basic info
interface CollectionRow {
  collection_id: string;
  name: string;
}

export const handler: Handlers<StampData> = {
  async GET(req: Request, ctx) {
    try {
      const { id } = ctx.params;
      const url = new URL(req.url);

      // Fetch stamp details and collections in parallel
      const [stampData, collectionsData] = await Promise.all([
        StampController.getStampDetailsById(id),
        CollectionController.getCollectionNames({
          limit: 50,
          page: 1,
        }),
      ]);

      // Check for null/undefined stamp data
      if (!stampData?.data?.stamp) {
        return ctx.renderNotFound();
      }

      const collections = collectionsData?.data || [];

      // Only fetch dispensers for STAMP or SRC-721
      let dispensers = [];
      let lowestPriceDispenser = null;
      let floorPrice = null;

      if (
        stampData.data.stamp.ident === "STAMP" ||
        stampData.data.stamp.ident === "SRC-721"
      ) {
        // Fetch dispensers separately
        const dispensersData = await DispenserManager.getDispensersByCpid(
          stampData.data.stamp.cpid,
        );
        dispensers = dispensersData?.dispensers || [];

        // Find the lowest price open dispenser
        const openDispensers = dispensers.filter((d) => d.give_remaining > 0);
        lowestPriceDispenser = openDispensers.reduce(
          (lowest, dispenser) => {
            if (!lowest || dispenser.satoshirate < lowest.satoshirate) {
              return dispenser;
            }
            return lowest;
          },
          null,
        );

        // Calculate floor price from lowest price dispenser
        floorPrice = lowestPriceDispenser
          ? Number(
            formatSatoshisToBTC(lowestPriceDispenser.satoshirate, {
              includeSymbol: false,
            }),
          )
          : null;
      }

      const btcPrice = await fetchBTCPriceInUSD(url.origin);

      // Calculate USD values
      const stampWithPrices = {
        ...stampData.data.stamp,
        floorPrice,
        floorPriceUSD: floorPrice !== null ? floorPrice * btcPrice : null,
        marketCapUSD: typeof stampData.data.stamp.marketCap === "number"
          ? stampData.data.stamp.marketCap * btcPrice
          : null,
      };

      return ctx.render({
        ...stampData.data,
        stamp: stampWithPrices,
        collections,
        last_block: stampData.last_block,
      });
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      if (error.message?.includes("Stamp not found")) {
        return ctx.renderNotFound();
      }
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
    stamps_recent,
    dispensers = [],
    dispenses = [],
    lowestPriceDispenser = null,
  } = props.data;

  const title = stamp.name
    ? `${stamp.name}`
    : `Bitcoin Stamp #${stamp.stamp} - stampchain.io`;

  const bodyClassName = "flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36";

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

      <div class={bodyClassName}>
        <div class="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3 mobileMd:gap-6">
          <div class="desktop:col-span-1">
            <StampImage
              stamp={stamp}
              flag={true}
            />
          </div>
          <div class="desktop:col-span-2">
            <StampInfo
              stamp={stamp}
              lowestPriceDispenser={lowestPriceDispenser}
            />
          </div>
        </div>

        <StampRelatedGraph
          stampId={stamp.stamp?.toString() || ""}
          cpid={stamp.cpid}
          initialHolders={holders || []}
        />

        <StampRelatedInfo
          stampId={stamp.stamp?.toString() || ""}
          cpid={stamp.cpid}
        />

        <RecentSales
          title="LATEST STAMPS"
          subTitle="LATEST TRANSACTIONS"
          variant="detail"
          displayCounts={{
            mobileSm: 3,
            mobileLg: 4,
            tablet: 4,
            desktop: 6,
          }}
        />
      </div>
    </>
  );
}
