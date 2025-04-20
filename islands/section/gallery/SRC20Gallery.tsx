/* ===== SRC20 GALLERY COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { SRC20Row } from "$globals";
import { subtitlePurple, titlePurpleLD } from "$text";
import { ViewAllButton } from "$button";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { Timeframe } from "$layout";
import { SRC20MintedTable, SRC20MintingTable } from "$table";
import { useSignal } from "@preact/signals";

/* ===== COLUMN CONFIGURATIONS ===== */

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
}

/* ===== IMAGE MODAL COMPONENT ===== */
const ImageModal = (
  { imgSrc, isOpen, onClose }: {
    imgSrc: string | null;
    isOpen: boolean;
    onClose: () => void;
  },
) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      class="fixed z-20 inset-0 bg-blue-500 bg-opacity-50 flex justify-center items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        class="bg-red-500 p-2 rounded-lg"
      >
        {imgSrc && <img class="w-60 h-60 rounded" src={imgSrc} alt="Token" />}
      </div>
    </div>
  );
};

/* ===== COMPONENT ===== */
export function SRC20Gallery({
  title,
  subTitle,
  viewType,
  fromPage,
  initialData,
  pagination,
  address,
  useClientFetch = fromPage === "home" || fromPage === "wallet",
}: SRC20GalleryProps) {
  const [data, setData] = useState<SRC20Row[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("24H");
  const imageModalSrc = useSignal<string>("");

  useEffect(() => {
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

          if (fromPage === "home") {
            endpoint = viewType === "minting"
              ? `/api/internal/src20/trending?type=minting&transactionCount=1000`
              : `/api/internal/src20/trending?type=market`;
          } else if (fromPage === "wallet" && address) {
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
  ]);

  const handlePageChange = (page: number) => {
    if (pagination?.onPageChange) {
      pagination.onPageChange(page);
    } else if (!useClientFetch) {
      const url = new URL(globalThis.location.href);
      url.searchParams.set("page", page.toString());
      globalThis.location.href = url.toString();
    }
  };

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  };

  const handleImageClick = (imgSrc: string) => {
    imageModalSrc.value = imgSrc;
  };

  if (isLoading || isTransitioning) {
    return <div class="src20-skeleton loading-skeleton h-[400px]" />;
  }

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
            viewType === "minting" ? "tablet:text-right text-left" : ""
          }`}
        >
          {subTitle}
        </h2>
      )}

      {viewType === "minted"
        ? (
          <SRC20MintedTable
            data={data}
            fromPage={fromPage}
            timeframe={timeframe}
            onImageClick={handleImageClick}
          />
        )
        : (
          <SRC20MintingTable
            data={data}
            fromPage={fromPage}
            timeframe={timeframe}
            onImageClick={handleImageClick}
          />
        )}

      {imageModalSrc.value && (
        <div
          class="fixed flex items-center justify-center inset-0 bg-black/50 backdrop-blur z-50"
          onClick={() => imageModalSrc.value = ""}
        >
          <img
            src={imageModalSrc.value}
            class="max-w-[90vw] max-h-[90vh] rounded-lg"
            alt="Token preview"
          />
        </div>
      )}

      {fromPage === "home" && (
        <div class="flex justify-end -mt-3 mobileMd:-mt-6">
          <ViewAllButton
            href={`/src20${viewType === "minting" ? "/minting" : ""}`}
          />
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div class="mt-9 mobileLg:mt-[72px]">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            prefix={fromPage === "wallet" ? "src20" : ""}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
