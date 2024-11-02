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
import { StampController } from "$server/controller/stampController.ts";

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
    const headers = Object.fromEntries(_req.headers);
    const url = new URL(_req.url);

    // Only handle CSS requests for carousel when on home route
    if (
      headers.accept?.includes("text/css") &&
      url.pathname === "/carousel.css"
    ) {
      const cssFile = await Deno.readFile("./static/carousel.css");
      return new Response(cssFile, {
        headers: { "Content-Type": "text/css" },
      });
    }

    // Skip other asset requests
    if (headers["sec-fetch-dest"] === "style") {
      return new Response(null, { status: 204 });
    }

    // Only process actual page requests
    if (headers["sec-fetch-dest"] !== "document") {
      return new Response(null, { status: 204 });
    }

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
    <div class="relative flex flex-col gap-10 tablet:gap-24 text-white py-10 tablet:py-24">
      <HomeHeader />

      <HomeCarousel />

      <HomeStampPreview
        stamps_art={stamps_art}
        stamps_posh={stamps_posh}
        stamps_src721={stamps_src721}
        stamps_recent={stamps_recent}
        collectionData={collectionData}
      />

      {/* SRC-20 TOKENS Section */}
      <div className="
        flex flex-col gap-8 mobile-768:gap-16
        px-3 tablet:px-6 desktop:px-12 
        max-w-desktop w-full mx-auto
      ">
        <div className="flex flex-col gap-4 mobile-768:gap-8">
          <div
            class={`
              w-full
              pb-0 pt-[18px]
              mobile-360:pb-0 mobile-360:pt-[18px]
              mobile-768:pb-0 mobile-768:pt-[36px]
              tablet:pb-0 tablet:pt-[72px]
              desktop:pb-0 desktop:pt-[72px]
            `}
          >
            <h1 className="
              text-4xl
              mobile-360:text-4xl
              mobile-768:text-5xl
              tablet:text-5xl
              desktop:text-6xl
              font-black bg-text-purple-2 bg-clip-text text-transparent
            ">
              SRC-20 TOKENS
            </h1>
          </div>

          {/* ALL TOKENS Section */}
          <div className="flex flex-col gap-4">
            <h2 class="
              text-2xl
              mobile-360:text-2xl
              mobile-768:text-4xl
              tablet:text-4xl
              desktop:text-5xl
              font-extralight bg-text-purple-2 bg-clip-text text-transparent
            ">
              ALL TOKENS
            </h2>
            <SRC20DeployTable data={src20s} />
            <ViewAllButton href="/src20" />
          </div>

          {/* MINTING Section */}
          <div className="flex flex-col gap-4">
            <h2 class="
              text-2xl
              mobile-360:text-2xl
              mobile-768:text-4xl
              tablet:text-4xl
              desktop:text-5xl
              font-extralight bg-text-purple-2 bg-clip-text text-transparent
            ">
              MINTING
            </h2>
            <SRC20TrendingMints data={trendingSrc20s} />
            <ViewAllButton href="/src20?type=trending" />
          </div>
        </div>
      </div>

      <StampChainModule />

      <PartnersModule />
    </div>
  );
}
