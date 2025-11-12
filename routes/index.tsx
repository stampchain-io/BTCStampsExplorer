/* ===== HOME PAGE ROUTE ===== */
import { Handlers, PageProps } from "$fresh/server.ts";
import type { CollectionRow } from "$server/types/collection.d.ts";
import type { SRC20Row } from "$types/src20.d.ts";
import type { StampRow, StampSaleRow } from "$types/stamp.d.ts";

import { HomeHeader } from "$header";
import {
  body,
  containerBackground,
  containerGap,
  gapSectionSlim,
  Micro5FontLoader,
} from "$layout";
import { ResponseUtil } from "$lib/utils/api/responses/responseUtil.ts";
import {
  CarouselHome,
  GetStampingCta,
  PartnersBanner,
  SRC20Gallery,
  StampchainContactCta,
  StampOverviewGallery,
  StampSalesGallery,
} from "$section";
import { StampController } from "$server/controller/stampController.ts";

/* ===== TYPES ===== */
// Define the shape of pageData from StampController.getHomePageData()
interface StampControllerData {
  carouselStamps: StampRow[];
  stamps_src721: StampRow[];
  stamps_art: StampRow[];
  stamps_posh: StampRow[];
  collectionData: CollectionRow[];
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
  // Performance optimization - single BTC price fetch
  btcPrice?: number;
  btcPriceSource?: string;
  // Recent sales data for SSR optimization
  recentSalesData?: {
    data: StampSaleRow[];
    total: number;
    page: number;
    totalPages: number;
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

    console.log(`[HOMEPAGE] Starting homepage request`);

    try {
      /* ===== SINGLE BTC PRICE FETCH ===== */
      // 🚀 PERFORMANCE: Use singleton BTC price service to eliminate duplicate fetches
      const { btcPriceSingleton } = await import(
        "$server/services/price/btcPriceSingleton.ts"
      );
      const btcPriceData = await btcPriceSingleton.getPrice();
      const btcPrice = btcPriceData.price;
      console.log(
        `[HOMEPAGE] Singleton BTC price: $${btcPrice} from ${btcPriceData.source}`,
      );

      // Store BTC price in context for components to use
      ctx.state.btcPrice = btcPrice;
      ctx.state.btcPriceSource = btcPriceData.source;

      /* ===== DATA FETCHING ===== */
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.log(`[HOMEPAGE] Request timed out after 15 seconds`);
        controller.abort();
      }, 15000); // Increased timeout for ECS

      console.log(`[HOMEPAGE] Starting parallel data fetches...`);
      const startTime = Date.now();

      // ECS-specific: Add individual timeouts and fallbacks for each data source
      const fetchWithFallback = async (
        fetchFn: () => Promise<any>,
        fallbackData: any,
        name: string,
      ) => {
        try {
          const result = await Promise.race([
            fetchFn(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`${name} timeout`)), 30000)
            ),
          ]);
          console.log(`[HOMEPAGE] ${name} completed successfully`);
          return result;
        } catch (error) {
          console.warn(`[HOMEPAGE] ${name} failed, using fallback:`, error);
          return fallbackData;
        }
      };

      // ✅ ARCHITECTURE: Use API endpoints for SRC20 data
      const fetchSRC20FromAPI = async (
        endpoint: string,
        baseUrl: string,
      ): Promise<any> => {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              "X-API-Version": "2.3", // Use latest API version with market data
            },
          });

          if (!response.ok) {
            console.error(
              `[HOMEPAGE] API call failed: ${endpoint} - ${response.status}`,
            );
            return { data: [], total: 0, page: 1, totalPages: 0 };
          }

          const result = await response.json();

          // ✅ FIXED: Handle API response structure properly
          if (result.data && Array.isArray(result.data)) {
            // Standard API response with pagination info
            return {
              data: result.data,
              total: result.total || 0,
              page: result.page || 1,
              totalPages: result.totalPages || 0,
            };
          } else if (Array.isArray(result)) {
            // Direct array response (for some internal endpoints)
            return {
              data: result,
              total: result.length,
              page: 1,
              totalPages: 1,
            };
          } else {
            // Fallback for other response structures
            return result.data || result ||
              { data: [], total: 0, page: 1, totalPages: 0 };
          }
        } catch (error) {
          console.error(`[HOMEPAGE] API call error: ${endpoint}`, error);
          return { data: [], total: 0, page: 1, totalPages: 0 };
        }
      };

      // ✅ PRODUCTION FIX: Use request origin instead of hardcoded localhost
      const url = new URL(req.url);
      const baseUrl = `${url.protocol}//${url.host}`;

      const [pageData, mintedData, mintingData, recentSalesData] = await Promise
        .allSettled([
          fetchWithFallback(
            () =>
              StampController.getHomePageData(btcPrice, btcPriceData.source),
            {
              carouselStamps: [],
              stamps_art: [],
              stamps_src721: [],
              stamps_posh: [],
              collectionData: [],
            },
            "StampController.getHomePageData",
          ),
          fetchWithFallback(
            () =>
              fetchSRC20FromAPI(
                "/api/v2/src20?op=DEPLOY&mintingStatus=minted&sortBy=TRENDING_24H_DESC&limit=5&page=1&includeMarketData=true&includeProgress=true",
                baseUrl,
              ),
            { data: [], total: 0, page: 1, totalPages: 0 },
            "fetchTopMintedTokens",
          ),
          fetchWithFallback(
            () =>
              fetchSRC20FromAPI(
                "/api/v2/src20?op=DEPLOY&mintingStatus=minting&sortBy=TRENDING_MINTING_DESC&limit=5&page=1&includeMarketData=true&includeProgress=true",
                baseUrl,
              ),
            { data: [], total: 0, page: 1, totalPages: 0 },
            "fetchTrendingActiveMintingTokensV2",
          ),
          fetchWithFallback(
            () =>
              fetchSRC20FromAPI(
                "/api/internal/stamp-recent-sales?page=1&limit=8",
                baseUrl,
              ),
            { data: [], total: 0, page: 1, totalPages: 0 },
            "fetchRecentSalesData",
          ),
        ]);

      clearTimeout(timeout);

      const duration = Date.now() - startTime;
      console.log(`[HOMEPAGE] All data fetches completed in ${duration}ms`);

      // Extract results from Promise.allSettled
      const pageResult = pageData.status === "fulfilled" ? pageData.value : {
        carouselStamps: [],
        stamps_art: [],
        stamps_src721: [],
        stamps_posh: [],
        collectionData: [],
      };
      const mintedResult = mintedData.status === "fulfilled"
        ? mintedData.value
        : { data: [], total: 0, page: 1, totalPages: 0 };
      const mintingResult = mintingData.status === "fulfilled"
        ? mintingData.value
        : { data: [], total: 0, page: 1, totalPages: 0 };
      const recentSalesResult = recentSalesData.status === "fulfilled"
        ? recentSalesData.value
        : { data: [], total: 0, page: 1, totalPages: 0 };

      /* ===== RESPONSE RENDERING ===== */
      const response = await ctx.render({
        ...pageResult,
        src20Data: {
          minted: mintedResult as any,
          minting: mintingResult as any,
        },
        recentSalesData: recentSalesResult as any,
        // 🚀 PERFORMANCE: Pass BTC price to components to avoid redundant fetches
        btcPrice: btcPrice,
        btcPriceSource: btcPriceData.source,
      });

      return response;
    } catch (error) {
      console.error("[HOMEPAGE] Critical error:", error);
      if (error instanceof Error) {
        console.error("[HOMEPAGE] Error stack:", error.stack);
      }

      // ECS-specific: Return minimal working page instead of failing completely
      return await ctx.render({
        carouselStamps: [],
        stamps_art: [],
        stamps_src721: [],
        stamps_posh: [],
        collectionData: [],
        error: "Service temporarily unavailable", // This will show a friendly error message
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
    recentSalesData,
  } = data || {};

  /* ===== RENDER ===== */
  return (
    <>
      {/* ===== CRITICAL RESOURCES ===== */}
      {/* Preload carousel CSS for above-fold content */}
      <link rel="preload" href="/carousel.css" as="style" />
      <link rel="stylesheet" href="/carousel.css" />
      {/* Homepage animation optimizations */}
      <link rel="preload" href="/homepage-animations.css" as="style" />
      <link rel="stylesheet" href="/homepage-animations.css" />
      {/* Load Micro5 font only when needed */}
      <Micro5FontLoader />

      {/* ===== MAIN CONTENT ===== */}
      <div
        class={`${body} ${gapSectionSlim}`}
      >
        {/* ===== CRITICAL ABOVE FOLD CONTENT ===== */}
        <HomeHeader />

        {/* ===== DEFERRED IMPORTANT CONTENT ===== */}
        <div style="content-visibility:auto;">
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
        <div style="content-visibility: auto; contain-intrinsic-size: 0 800px;">
          <div class="flex flex-col">
            <StampSalesGallery
              title="RECENT SALES"
              subTitle="HOT STAMPS"
              variant="home"
              initialData={recentSalesData?.data || []}
              displayCounts={{
                mobileSm: 3,
                mobileMd: 4,
                mobileLg: 5,
                tablet: 6,
                desktop: 7,
              }}
            />
          </div>
          <div class="my-6 mobileLg:my-9">
            <GetStampingCta />
          </div>

          <div
            class={`flex flex-col tablet:flex-row ${containerBackground} ${containerGap}`}
          >
            <div class="w-full tablet:w-1/2">
              <SRC20Gallery
                title="SRC-20 TOKENS"
                subTitle="TOP TICKERS"
                viewType="minted"
                fromPage="home"
                {...(src20Data?.minted && { serverData: src20Data.minted })}
                timeframe="24H"
              />
            </div>
            <div class="w-full tablet:w-1/2">
              <SRC20Gallery
                title="SRC-20 TOKENS"
                subTitle="TRENDING MINTS"
                viewType="minting"
                fromPage="home"
                {...(src20Data?.minting && { serverData: src20Data.minting })}
                timeframe="24H"
              />
            </div>
          </div>
        </div>

        <div class={`flex flex-col ${containerGap}`}>
          <StampchainContactCta />
          <PartnersBanner />
        </div>
      </div>
    </>
  );
}
