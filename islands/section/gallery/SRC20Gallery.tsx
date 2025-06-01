/* ===== SRC20 GALLERY COMPONENT ===== */
// @baba - add token cards specific to wallet page
import { useEffect, useState } from "preact/hooks";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { SRC20Row } from "$globals";
import { subtitlePurple, titlePurpleLD } from "$text";
import { ViewAllButton } from "$button";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { Timeframe } from "$layout";
import {
  SRC20Card,
  SRC20CardMinting,
  SRC20CardSm,
  SRC20CardSmMinting,
} from "$card";
import { useLoadingSkeleton } from "$lib/hooks/useLoadingSkeleton.ts";

/* ===== TYPES ===== */
interface SRC20GalleryProps {
  title?: string;
  subTitle?: string;
  viewType: "minted" | "minting";
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  initialData?: SRC20Row[];
  pagination?: {
    page: number;
    totalPages: number;
    prefix?: string;
    limit?: number;
    onPageChange?: (page: number) => void;
  };
  address?: string;
  useClientFetch?: boolean;
  timeframe: "24H" | "3D" | "7D";
  serverData?: {
    data: SRC20Row[];
    total: number;
    page: number;
    totalPages: number;
  };
}

/* ===== COMPONENT ===== */
export function SRC20Gallery({
  title,
  subTitle,
  viewType,
  fromPage,
  initialData,
  pagination,
  address,
  useClientFetch = fromPage === "wallet",
  timeframe,
  serverData,
}: SRC20GalleryProps) {
  const [data, setData] = useState<SRC20Row[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData && !serverData);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [enriched, setEnriched] = useState(false);

  // Helper to fetch chart data for a tick
  async function fetchChartData(tick: string): Promise<[number, number][]> {
    try {
      const url = `https://api.stampscan.xyz/utxo/combinedListings?tick=${
        encodeURIComponent(tick)
      }`;
      const resp = await fetch(url);
      if (!resp.ok) return [];
      const chartRaw = await resp.json();
      console.log("Raw chart data for", tick, chartRaw);
      const mapped: [number, number][] = (chartRaw || [])
        .map((item: any) => {
          const ts = new Date(item.date).getTime();
          const price = Number(item.unit_price_btc) * 100_000_000;
          if (isNaN(ts) || isNaN(price)) return null;
          return [ts, price];
        })
        .filter(Boolean);
      return mapped.sort((a, b) => a[0] - b[0]);
    } catch {
      return [];
    }
  }

  // Enrich tokens with chart data (SSR-friendly: only runs on server or initial render)
  useEffect(() => {
    if (
      !enriched &&
      viewType === "minted" &&
      fromPage === "src20" &&
      data.length > 0
    ) {
      // Only enrich tokens that do not already have chart data
      const tokensToEnrich = data.filter((token: any) =>
        !token.chart || token.chart.length === 0
      );
      if (tokensToEnrich.length === 0) {
        setEnriched(true);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      console.log(
        "Enriching tokens with chart data:",
        tokensToEnrich.map((t) => t.tick),
      );
      Promise.all(
        data.map(async (token: any) => {
          if (token.chart && token.chart.length > 0) return token;
          return {
            ...token,
            chart: await fetchChartData(token.tick),
          };
        }),
      ).then((enrichedTokens) => {
        setData(enrichedTokens);
        setEnriched(true);
        setIsLoading(false);
      });
    }
  }, [data, viewType, fromPage, enriched]);

  useEffect(() => {
    if (serverData) {
      setData(serverData.data);
      return;
    }

    if (!initialData?.length && useClientFetch) {
      setIsTransitioning(true);
      setIsLoading(true);
      const fetchData = async () => {
        try {
          let endpoint = "";
          const params = new URLSearchParams({
            limit: String(pagination?.limit || 5),
            page: String(pagination?.page || 1),
            timeframe: timeframe,
          });

          if (fromPage === "wallet" && address) {
            endpoint = `/api/v2/src20/balance/${address}`;
          }

          if (endpoint) {
            const response = await fetch(`${endpoint}&${params.toString()}`);
            const result = await response.json();
            setData(
              result.data?.map((item: SRC20Row) => ({
                ...item,
                tick: unicodeEscapeToEmoji(item.tick),
              })) || [],
            );
          }
        } catch (error) {
          console.error(`SRC20 ${viewType} fetch error:`, error);
        } finally {
          setIsLoading(false);
          setIsTransitioning(false);
        }
      };

      fetchData();
    }
  }, [
    viewType,
    timeframe,
    pagination?.page,
    initialData,
    fromPage,
    address,
    useClientFetch,
    serverData,
  ]);

  useEffect(() => {
    if (initialData?.length) {
      setData(initialData);
    }
  }, [initialData]);

  const handlePageChange = (page: number) => {
    if (pagination?.onPageChange) {
      pagination.onPageChange(page);
    } else if (!useClientFetch) {
      const url = new URL(globalThis.location.href);
      url.searchParams.set("page", page.toString());
      globalThis.location.href = url.toString();
    }
  };

  const _handleTimeframeChange = (_newTimeframe: Timeframe) => {
  };

  const handleImageClick = (_imgSrc: string) => {
  };

  // Always call hooks at the top level
  const skeletonClasses = useLoadingSkeleton(
    isLoading || isTransitioning,
    "src20-skeleton h-[400px]",
  );

  if (isLoading || isTransitioning) {
    return <div class={skeletonClasses} />;
  }

  console.log("Gallery Pagination:", {
    hasPagination: !!pagination,
    totalPages: pagination?.totalPages,
    currentPage: pagination?.page,
    shouldShow: pagination && pagination.totalPages > 1,
  });

  return (
    <div class="w-full">
      {title && (
        <h1
          class={`${titlePurpleLD} ${
            fromPage === "home" && viewType === "minting" ? "opacity-0" : ""
          }`}
        >
          {title}
        </h1>
      )}
      {subTitle && (
        <h2
          class={`${subtitlePurple} mb-6 ${
            viewType === "minting" ? "text-left tablet:text-right" : ""
          }`}
        >
          {subTitle}
        </h2>
      )}

      {viewType === "minted"
        ? (
          fromPage === "src20"
            ? (
              <SRC20Card
                data={data}
                fromPage={fromPage}
                timeframe={timeframe}
                onImageClick={handleImageClick}
              />
            )
            : (
              <SRC20CardSm
                data={data}
                fromPage={fromPage}
                timeframe={timeframe}
                onImageClick={handleImageClick}
              />
            )
        )
        : fromPage === "src20"
        ? (
          <SRC20CardMinting
            data={data}
            fromPage={fromPage}
            timeframe={timeframe}
            onImageClick={handleImageClick}
          />
        )
        : (
          <SRC20CardSmMinting
            data={data}
            fromPage={fromPage}
            timeframe={timeframe}
            onImageClick={handleImageClick}
          />
        )}

      {fromPage === "home" && (
        <div class="flex justify-end -mt-3 mobileMd:-mt-6">
          <ViewAllButton
            href={`/src20${viewType === "minting" ? "/minting" : ""}`}
          />
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div class="mt-12 mobileLg:mt-[72px]">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            prefix={fromPage === "wallet" ? "src20" : ""}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
