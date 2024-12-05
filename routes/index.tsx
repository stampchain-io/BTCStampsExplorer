import { StampRow } from "globals";
import { Handlers, PageProps } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
import { SRC20Section } from "$islands/src20/SRC20Section.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import { StampChainModule } from "$islands/modules/StampChain.tsx";
import { GetStampingModule } from "$islands/modules/GetStamping.tsx";
import { RecentSales } from "$islands/stamp/details/RecentSales.tsx";

import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { getRecommendedFees } from "$lib/utils/mempool.ts";

import { StampController } from "$server/controller/stampController.ts";

// Define Collection type properly (assuming this is from your data)
interface Collection {
  collection_id: string;
  collection_name: string;
  collection_description: string;
  creators: string[];
  stamp_count: number;
  total_editions: number;
  // Add any other required properties
}

// Define the shape of pageData from StampController.getHomePageData()
interface StampControllerData {
  stamps_src721: StampRow[];
  stamps_art: StampRow[];
  stamps_posh: StampRow[];
  src20s: any[];
  trendingSrc20s: any[];
  collectionData: Collection[];
  carouselStamps: StampRow[];
  // Make stamps_recent optional since it might not be in the response
  stamps_recent?: { recentSales: StampRow[] };
}

interface HomePageData extends StampControllerData {
  btcPrice: number;
  recommendedFee: number;
  error?: string;
}

type HomePageProps = {
  data: HomePageData;
};

export const handler: Handlers<HomePageData> = {
  async GET(req: Request, ctx) {
    const headers = Object.fromEntries(req.headers);
    const url = new URL(req.url);

    // Early return for non-document requests
    if (headers["sec-fetch-dest"] && headers["sec-fetch-dest"] !== "document") {
      return ResponseUtil.custom(null, 204);
    }

    // Handle CSS requests more efficiently
    if (
      headers.accept?.includes("text/css") && url.pathname === "/carousel.css"
    ) {
      const cssFile = await Deno.readFile("./static/carousel.css");
      return ResponseUtil.custom(cssFile, 200, {
        headers: {
          "Content-Type": "text/css",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    try {
      const [pageData, btcPrice, fees] = await Promise.all([
        StampController.getHomePageData(),
        fetchBTCPriceInUSD(url.origin),
        getRecommendedFees(),
      ]);

      // Debug the response
      console.log("PageData received:", JSON.stringify(pageData, null, 2));

      // Validate the shape of pageData
      const isValidPageData = (data: unknown): data is StampControllerData => {
        if (!data || typeof data !== "object") return false;
        const d = data as Partial<StampControllerData>;
        return (
          Array.isArray(d.stamps_src721) &&
          Array.isArray(d.stamps_art) &&
          Array.isArray(d.stamps_posh) &&
          Array.isArray(d.src20s) &&
          Array.isArray(d.trendingSrc20s) &&
          Array.isArray(d.carouselStamps) &&
          Array.isArray(d.collectionData)
        );
      };

      if (!isValidPageData(pageData)) {
        console.error("Invalid page data structure:", pageData);
        return ResponseUtil.badRequest(
          "Invalid data structure received from server",
        );
      }

      const data: HomePageData = {
        stamps_recent: { recentSales: [] }, // Add default if missing
        ...pageData,
        btcPrice: Number(btcPrice || 0),
        recommendedFee: Number(fees?.fastestFee || 0),
      };

      return ctx.render(data);
    } catch (error) {
      console.error("Error in handler:", error);

      const errorData: HomePageData = {
        stamps_recent: { recentSales: [] },
        stamps_src721: [],
        stamps_art: [],
        stamps_posh: [],
        src20s: [],
        trendingSrc20s: [],
        collectionData: [],
        carouselStamps: [],
        btcPrice: 0,
        recommendedFee: 6,
        error: error instanceof Error ? error.message : "Internal server error",
      };

      return ctx.render(errorData);
    }
  },
};

export default function Home({ data }: PageProps<HomePageData>) {
  const {
    stamps_src721 = [],
    stamps_art = [],
    stamps_posh = [],
    collectionData = [],
    src20s = [],
    trendingSrc20s = [],
    carouselStamps = [],
    btcPrice = 0,
    recommendedFee = 0,
    error,
  } = data || {};

  // Optionally handle error state
  if (error) {
    console.error("Page Error:", error);
  }

  return (
    <div class="layout-container flex flex-col gap-24 mobileLg:gap-36 text-white">
      <HomeHeader />
      <HomeCarousel carouselStamps={carouselStamps} />

      <HomeStampPreview
        stamps_art={stamps_art}
        stamps_posh={stamps_posh}
        stamps_src721={stamps_src721}
        collectionData={collectionData}
      />
      <GetStampingModule
        btcPrice={Number(btcPrice)}
        recommendedFee={Number(recommendedFee)}
      />
      <RecentSales
        title="RECENT SALES"
        subTitle="HOT STAMPS"
        variant="home"
        displayCounts={{
          mobileSm: 4,
          mobileLg: 5,
          tablet: 6,
          desktop: 6,
        }}
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
