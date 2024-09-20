import { StampRow } from "globals";
import { Handlers } from "$fresh/server.ts";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeTable } from "$islands/home/HomeTable.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
import { HomeStampChainSelected } from "$islands/home/HomeStampChainSelected.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";

import { StampController } from "$lib/controller/stampController.ts";

type HomePageProps = {
  data: {
    stamps_recent: { recentSales: StampRow[] };
    stamps_src721: StampRow[];
    stamps_art: StampRow[];
    stamps_src20: StampRow[];
    stamps_posh: StampRow[];
    src20s: any[];
    collectionData: CollectionRow[];
  };
};

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      const result = await StampController.getHomePageData();
      return ctx.render(result);
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

export default function Home(props: HomePageProps) {
  const {
    stamps_recent = { recentSales: [] },
    stamps_src721 = [],
    stamps_art = [],
    stamps_src20 = [],
    stamps_posh = [],
    collectionData = [],
  } = props.data || {};

  return (
    <div class="relative flex flex-col gap-10 md:gap-24 text-white py-10 md:py-24">
      <div class="background-gradient"></div>
      <HomeHeader />
      <HomeCarousel />
      {
        /* <div class="flex flex-col gap-10">
        <HomeTable data={src20s} />
      </div> */
      }
      <HomeStampPreview
        stamps_art={stamps_art}
        stamps_posh={stamps_posh}
        stamps_src721={stamps_src721}
        stamps_recent={stamps_recent.recentSales}
        stamps_src20={stamps_src20}
        collectionData={collectionData}
      />
      {/* <HomeStampChainSelected />  // Leaving this out for initial release - Add later */}
      <PartnersModule />
    </div>
  );
}
