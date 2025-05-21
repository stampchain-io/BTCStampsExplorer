/* ===== SRC20 GALLERY COMPONENT ===== */
// deno-lint-ignore-file react-rules-of-hooks
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

  if (isLoading || isTransitioning) {
    return <div class="src20-skeleton loading-skeleton h-[400px]" />;
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
