import { StampRow } from "$globals";
import { Handlers, PageProps } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { HomeHeader } from "$components/home/HomeHeader.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
import { SRC20Section } from "$islands/src20/SRC20Section.tsx";
import { GetStampingModule } from "$islands/modules/GetStamping.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import { StampChainModule } from "$islands/modules/StampChain.tsx";
import { RecentSales } from "$islands/stamp/details/RecentSales.tsx";
import { HomeCarousel } from "$components/home/HomeCarousel.tsx";
import { StampController } from "$server/controller/stampController.ts";
import { Micro5FontLoader } from "$islands/home/FontLoader.tsx";
import type { Collection } from "$globals";

// Define the shape of pageData from StampController.getHomePageData()
interface StampControllerData {
  carouselStamps: StampRow[];
  stamps_src721: StampRow[];
  stamps_art: StampRow[];
  stamps_posh: StampRow[];
  collectionData: Collection[];
}

interface HomePageData extends StampControllerData {
  error?: string;
}

export const handler: Handlers<HomePageData> = {
  async GET(req: Request, ctx) {
    const headers = Object.fromEntries(req.headers);
    if (headers["sec-fetch-dest"] && headers["sec-fetch-dest"] !== "document") {
      return ResponseUtil.custom(null, 204);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const pageData = await StampController.getHomePageData();
      clearTimeout(timeout);

      const response = await ctx.render(pageData);
      response.headers.set("Cache-Control", "public, max-age=300"); // 5 min cache
      response.headers.set("Priority", "high"); // Signal high priority to CDN
      return response;
    } catch (error) {
      console.error("Handler error:", error);
      // Return minimal data for fast initial render
      return ctx.render({
        carouselStamps: [],
        stamps_art: [],
        stamps_src721: [],
        stamps_posh: [],
        collectionData: [],
        error: "Failed to load complete data",
      });
    }
  },
};

export default function Home({ data }: PageProps<HomePageData>) {
  const {
    carouselStamps = [],
    stamps_art = [],
    stamps_src721 = [],
    stamps_posh = [],
    collectionData = [],
  } = data || {};

  return (
    <>
      {/* Preload carousel CSS for above-fold content */}
      <link rel="preload" href="/carousel.css" as="style" />
      <link rel="stylesheet" href="/carousel.css" />

      {/* Load Micro5 font only when needed */}
      <Micro5FontLoader />

      <div>
        <img
          src="/img/home/stamps-collage-purpleGradient-4000.webp"
          alt="About Bitcoin Stamps and contact Stampchain"
          class="
          absolute
          top-[48px]
          left-0
          w-full
          h-[450px] mobileMd:h-[500px] mobileLg:h-[600px] tablet:h-[700px] desktop:h-[850px]
          object-cover
          pointer-events-none
          z-[-999]
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.3),rgba(0,0,0,0.6),rgba(0,0,0,0.4),rgba(0,0,0,0))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.3),rgba(0,0,0,0.6),rgba(0,0,0,0.4),rgba(0,0,0,0))]
        "
        />

        <div class="layout-container flex flex-col gap-24 mobileLg:gap-36 mt-0 min-[420px]:mt-3 mobileMd:mt-6 tablet:mt-3">
          {/* Critical above-fold content */}
          <HomeHeader />

          {/* Important but can be deferred slightly */}
          <div style="content-visibility: auto;">
            <HomeCarousel carouselStamps={carouselStamps} />
          </div>

          {/* Defer non-critical content */}
          <div style="content-visibility: auto; contain-intrinsic-size: 0 500px;">
            <HomeStampPreview
              stamps_art={stamps_art}
              stamps_posh={stamps_posh}
              stamps_src721={stamps_src721}
              collectionData={collectionData}
            />
          </div>

          {/* Lazy load below-the-fold content */}
          <div style="margin-top: -48px; content-visibility: auto; contain-intrinsic-size: 0 800px;">
            <GetStampingModule />
            <div class="flex flex-col pt-12 mobileLg:pt-24 desktop:pt-36">
              <RecentSales
                title="RECENT SALES"
                subTitle="HOT STAMPS"
                variant="home"
                displayCounts={{
                  mobileSm: 3,
                  mobileMd: 4,
                  mobileLg: 5,
                  tablet: 6,
                  desktop: 7,
                }}
              />
            </div>
            <div class="flex flex-col pt-12 mobileLg:pt-24 desktop:pt-36 gap-12 mobileLg:gap-[72px]">
              <SRC20Section
                title="SRC-20 TOKENS"
                subTitle="TOP TICKERS"
                type="all"
                fromPage="home"
              />
              <SRC20Section
                subTitle="TRENDING MINTS"
                type="trending"
                fromPage="home"
              />
            </div>
          </div>
          <div class="flex flex-col gap-6 mobileLg:gap-12">
            <StampChainModule />
            <PartnersModule />
          </div>
        </div>
      </div>
    </>
  );
}
