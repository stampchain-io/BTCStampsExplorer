/* ===== HOME PAGE ROUTE ===== */
import { StampRow } from "$globals";
import type { Collection } from "$globals";
import { Handlers, PageProps } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { StampController } from "$server/controller/stampController.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";

import { Micro5FontLoader } from "$layout";
import { HomeHeader } from "$header";
import {
  CarouselHome,
  GetStampingCta,
  PartnersBanner,
  SRC20Gallery,
  StampchainContactCta,
  StampOverviewGallery,
  StampSalesGallery,
} from "$section";

/* ===== TYPES ===== */
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
  src20Data?: {
    minted: {
      data: SRC20Row[];
      total: number;
      page: number;
      totalPages: number;
    };
    minting: {
      data: SRC20Row[];
      total: number;
      page: number;
      totalPages: number;
    };
  };
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<HomePageData> = {
  async GET(req: Request, ctx) {
    /* ===== REQUEST VALIDATION ===== */
    const headers = Object.fromEntries(req.headers);
    if (headers["sec-fetch-dest"] && headers["sec-fetch-dest"] !== "document") {
      return ResponseUtil.custom(null, 204);
    }

    try {
      /* ===== DATA FETCHING ===== */
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const [pageData, mintedData, mintingData] = await Promise.all([
        StampController.getHomePageData(),
        Src20Controller.fetchFullyMintedByMarketCapV2(5, 1),
        Src20Controller.fetchTrendingActiveMintingTokensV2(5, 1, 1000),
      ]);

      clearTimeout(timeout);

      /* ===== RESPONSE CONFIGURATION ===== */
      const response = await ctx.render({
        ...pageData,
        src20Data: {
          minted: {
            data: mintedData.data,
            total: mintedData.total,
            page: mintedData.page,
            totalPages: mintedData.totalPages,
          },
          minting: {
            data: mintingData.data,
            total: mintingData.total,
            page: mintingData.page,
            totalPages: mintingData.totalPages,
          },
        },
      });
      response.headers.set("Cache-Control", "public, max-age=300"); // 5 min cache
      response.headers.set("Priority", "high"); // Signal high priority to CDN
      return response;
    } catch (error) {
      /* ===== ERROR HANDLING ===== */
      console.error("Handler error:", error);
      // Return minimal data for fast initial render
      return ctx.render({
        carouselStamps: [],
        stamps_art: [],
        stamps_src721: [],
        stamps_posh: [],
        collectionData: [],
        error: "Failed to load complete data",
        src20Data: {
          minted: { data: [], total: 0, page: 1, totalPages: 0 },
          minting: { data: [], total: 0, page: 1, totalPages: 0 },
        },
      });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function Home({ data }: PageProps<HomePageData>) {
  /* ===== DATA EXTRACTION ===== */
  const {
    carouselStamps = [],
    stamps_art = [],
    stamps_src721 = [],
    stamps_posh = [],
    collectionData = [],
    src20Data,
  } = data || {};

  /* ===== RENDER ===== */
  return (
    <>
      {/* ===== CRITICAL RESOURCES ===== */}
      {/* Preload carousel CSS for above-fold content */}
      <link rel="preload" href="/carousel.css" as="style" />
      <link rel="stylesheet" href="/carousel.css" />
      {/* Load Micro5 font only when needed */}
      <Micro5FontLoader />

      <div>
        {/* ===== HERO BACKGROUND ===== */}
        <img
          src="/img/stamps-collage-purpleOverlay-4000.webp"
          alt="About Bitcoin Stamps and contact Stampchain"
          class="
          absolute
          top-0
          left-0
          w-full
          h-[450px] mobileMd:h-[500px] mobileLg:h-[600px] tablet:h-[700px] desktop:h-[850px]
          object-cover
          pointer-events-none
          z-[-999]
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.3),rgba(0,0,0,0.5),rgba(0,0,0,0.3),rgba(0,0,0,0))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.3),rgba(0,0,0,0.5),rgba(0,0,0,0.3),rgba(0,0,0,0))]
        "
        />

        {/* ===== MAIN CONTENT ===== */}
        <div class="layout-container flex flex-col gap-24 mobileLg:gap-36 mt-0 min-[420px]:mt-3 mobileMd:mt-6 tablet:mt-3">
          {/* ===== CRITICAL ABOVE FOLD CONTENT ===== */}
          <HomeHeader />

          {/* ===== DEFERRED IMPORTANT CONTENT ===== */}
          <div style="content-visibility:auto; margin-top:-96px; margin-bottom:-48px;">
            <CarouselHome carouselStamps={carouselStamps} />
          </div>

          {/* ===== NON-CRITICAL CONTENT ===== */}
          <div style="content-visibility: auto; contain-intrinsic-size: 0 500px;">
            <StampOverviewGallery
              stamps_art={stamps_art}
              stamps_posh={stamps_posh}
              stamps_src721={stamps_src721}
              collectionData={collectionData}
            />
          </div>

          {/* ===== BELOW FOLD CONTENT - LAZY LOAD ===== */}
          <div style="margin-top: -48px; content-visibility: auto; contain-intrinsic-size: 0 800px;">
            <GetStampingCta />

            <div class="flex flex-col pt-12 mobileLg:pt-24 desktop:pt-36">
              <StampSalesGallery
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

            <div class="flex flex-row pt-12 mobileLg:pt-24 desktop:pt-36 gap-12 mobileLg:gap-[72px]">
              <SRC20Gallery
                title="SRC-20 TOKENS"
                subTitle="TOP TICKERS"
                viewType="minted"
                fromPage="home"
                serverData={src20Data?.minted}
                useClientFetch={false}
              />
              <SRC20Gallery
                title="SRC-20 TOKENS"
                subTitle="TRENDING MINTS"
                viewType="minting"
                fromPage="home"
                serverData={src20Data?.minting}
                useClientFetch={false}
              />
            </div>
          </div>

          <div class="flex flex-col gap-6 mobileLg:gap-12">
            <StampchainContactCta />
            <PartnersBanner />
          </div>
        </div>
      </div>
    </>
  );
}
