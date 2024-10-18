import { StampRow } from "globals";
import { Handlers } from "$fresh/server.ts";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
// import { HomeTable } from "$islands/home/HomeTable.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
// import { HomeStampChainSelected } from "$islands/home/HomeStampChainSelected.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import { SRC20DeployTable } from "$islands/src20/all/SRC20DeployTable.tsx";
// Import your Button component if you have one
// import { Button } from "$components/Button.tsx";
import { ViewAllButton } from "$components/ViewAllButton.tsx";
import { SRC20TrendingMints } from "$islands/src20/trending/SRC20TrendingMints.tsx";
import { StampChainModule } from "$islands/modules/StampChain.tsx";
import { StampController } from "$lib/controller/stampController.ts";
type HomePageProps = {
  data: {
    stamps_recent: { recentSales: StampRow[] };
    stamps_src721: StampRow[];
    stamps_art: StampRow[];
    stamps_posh: StampRow[];
    src20s: any[];
    trendingSrc20s: any[]; // <-- Add this line
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
    stamps_recent = [],
    stamps_src721 = [],
    stamps_art = [],
    stamps_posh = [],
    collectionData = [],
    src20s = [],
    trendingSrc20s = [],
  } = props.data || {};

  return (
    <div class="relative flex flex-col gap-10 md:gap-24 text-white py-10 md:py-24">
      <HomeHeader />

      <HomeCarousel />

      <HomeStampPreview
        stamps_art={stamps_art}
        stamps_posh={stamps_posh}
        stamps_src721={stamps_src721}
        stamps_recent={stamps_recent}
        collectionData={collectionData}
      />

      <div className="flex flex-col gap-4 md:gap-8">
        <h1 className="text-5xl 2xl:text-6xl  font-black purple-gradient1">
          SRC-20 TOKENS
        </h1>
        {/* SRC20DeployTable section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[#AA00FF] text-4xl lg:text-5xl font-extralight">
            ALL TOKENS
          </h2>
        </div>
        <div class="flex flex-col gap-4">
          <SRC20DeployTable data={src20s} />
          <ViewAllButton href="/src20" />
        </div>
      </div>
      {/* SRC20TrendingMints section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[#AA00FF] text-4xl lg:text-5xl font-extralight">
          MINTING
        </h2>
      </div>
      <div class="flex flex-col gap-4">
        <SRC20TrendingMints data={trendingSrc20s} />
        <ViewAllButton href="/src20?type=trending" />
      </div>

      <StampChainModule />

      <PartnersModule />
    </div>
  );
}
