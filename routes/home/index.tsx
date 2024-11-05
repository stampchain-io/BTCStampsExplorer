import { StampRow } from "globals";
import { Handlers } from "$fresh/server.ts";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
// import { HomeStampChainSelected } from "$islands/home/HomeStampChainSelected.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import { SRC20DeployTable } from "$islands/src20/all/SRC20DeployTable.tsx";
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
    carouselStamps: StampRow[];
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
    carouselStamps = [],
  } = props.data || {};

  return (
    <div class="layout-container flex flex-col gap-10 text-white">
      <HomeHeader />
      <HomeCarousel carouselStamps={carouselStamps} />
      <HomeStampPreview
        stamps_art={stamps_art}
        stamps_posh={stamps_posh}
        stamps_src721={stamps_src721}
        stamps_recent={stamps_recent}
        collectionData={collectionData}
      />
      <SRC20DeployTable data={src20s} />
      <SRC20TrendingMints data={trendingSrc20s} />
      <StampChainModule />
      <PartnersModule />
    </div>
  );
}
