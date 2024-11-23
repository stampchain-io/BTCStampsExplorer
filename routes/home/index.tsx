import { StampRow } from "globals";
import { Handlers } from "$fresh/server.ts";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
// import { HomeStampChainSelected } from "$islands/home/HomeStampChainSelected.tsx";
import { SRC20Section } from "$islands/src20/SRC20Section.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import { StampChainModule } from "$islands/modules/StampChain.tsx";
import { GetStampingModule } from "$islands/modules/GetStamping.tsx";

import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { getRecommendedFees } from "$lib/utils/mempool.ts";

import { StampController } from "$server/controller/stampController.ts";

type HomePageProps = {
  data: {
    stamps_recent: { recentSales: StampRow[] };
    stamps_src721: StampRow[];
    stamps_art: StampRow[];
    stamps_posh: StampRow[];
    src20s: any[];
    trendingSrc20s: any[];
    collectionData: CollectionRow[];
    carouselStamps: StampRow[];
    btcPrice: number;
    recommendedFee: number;
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
      const baseUrl = `${url.protocol}//${url.host}`;

      const [pageData, btcPrice, fees] = await Promise.all([
        StampController.getHomePageData(),
        fetchBTCPriceInUSD(baseUrl),
        getRecommendedFees(),
      ]);

      console.log("BTC Price received:", btcPrice); // Debug log

      const data = {
        ...pageData,
        btcPrice: Number(btcPrice || 0),
        recommendedFee: Number(fees?.fastestFee || 0),
      };

      console.log("Final data being sent to render:", {
        btcPrice: data.btcPrice,
        recommendedFee: data.recommendedFee,
      });

      return ctx.render(data);
    } catch (error) {
      console.error("Error in handler:", error);
      return ctx.render({
        error: `Error: Internal server error`,
        btcPrice: 0,
        recommendedFee: 6,
      });
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
    carouselStamps = [],
    btcPrice = 0,
    recommendedFee = 0,
  } = props.data || {};

  return (
    <div class="layout-container flex flex-col gap-24 mobileLg:gap-36 text-white">
      <HomeHeader />
      <HomeCarousel carouselStamps={carouselStamps} />
      <HomeStampPreview
        stamps_art={stamps_art}
        stamps_posh={stamps_posh}
        stamps_src721={stamps_src721}
        stamps_recent={stamps_recent}
        collectionData={collectionData}
      />
      <GetStampingModule
        btcPrice={Number(btcPrice)}
        recommendedFee={Number(recommendedFee)}
      />
      <div class="flex flex-col gap-12 mobileLg:gap-[72px]">
        <SRC20Section
          title="SRC-20 TOKENS"
          subTitle="TOP TICKERS"
          type="all"
          data={src20s}
        />
        <SRC20Section
          subTitle="TRENDING MINTS"
          type="trending"
          data={trendingSrc20s}
        />
      </div>
      <div class="flex flex-col gap-6 mobileLg:gap-12">
        <StampChainModule />
        <PartnersModule />
      </div>
    </div>
  );
}
