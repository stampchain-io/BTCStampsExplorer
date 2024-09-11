import { StampRow } from "globals";
import { Handlers } from "$fresh/server.ts";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeTable } from "$islands/home/HomeTable.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
import { HomeStampChainSelected } from "$islands/home/HomeStampChainSelected.tsx";
import { HomePartners } from "$islands/home/HomePartners.tsx";

import { StampController } from "$lib/controller/stampController.ts";

type HomePageProps = {
  data: {
    stamps_recent: { recentSales: StampRow[] };
    stamps_src721: StampRow[];
    stamps_art: StampRow[];
    stamps_src20: StampRow[];
    stamps_posh: StampRow[];
    src20s: any[];
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
    stamps_src721 = [], // FIXME: need to filter only for Recursive type 721's
    stamps_art = [],
    stamps_src20 = [],
    stamps_posh = [],
    src20s = [],
  } = props.data || {};

  return (
    <div class="flex flex-col gap-10 md:gap-24 text-white py-10 md:py-24">
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
      />
      {/* <HomeStampChainSelected />  // Leaving this out for initial release - Add later */}
      <HomePartners />
    </div>
  );
}
