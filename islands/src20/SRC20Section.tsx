import { useEffect, useState } from "preact/hooks";
import { SRC20Row } from "$globals";
import { SRC20TokenMintingCard } from "$islands/src20/cards/SRC20TokenMintingCard.tsx";
import { SRC20TokenOutmintedCard } from "$islands/src20/cards/SRC20TokenOutmintedCard.tsx";
import { ModulesStyles } from "$islands/modules/Styles.ts";
import { ViewAllButton } from "$components/shared/ViewAllButton.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { useLoading } from "$islands/loading/LoadingProvider.tsx";

interface SRC20SectionProps {
  title?: string;
  subTitle?: string;
  type: "all" | "trending";
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  sortBy?: "ASC" | "DESC";
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
      class="fixed z-20 inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div onClick={(e) => e.stopPropagation()}>
        {imgSrc && <img class="w-60 h-60" src={imgSrc} alt="Modal" />}
      </div>
    </div>
  );
};

export function SRC20Section({
  title,
  subTitle,
  type,
  fromPage,
  sortBy,
  initialData,
  pagination,
  address,
  useClientFetch = fromPage === "home" || fromPage === "wallet",
}: SRC20SectionProps) {
  const { setLoading } = useLoading();
  const [data, setData] = useState<SRC20Row[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!initialData?.length && useClientFetch) {
      setIsTransitioning(true);
      setIsLoading(true);
      setLoading(true);
      const fetchData = async () => {
        try {
          let endpoint = "";
          const params = new URLSearchParams({
            limit: String(pagination?.limit || 5),
            page: String(pagination?.page || 1),
            sortBy: sortBy || "ASC",
          });

          if (fromPage === "home") {
            endpoint = type === "trending"
              ? `/api/internal/src20/trending?type=minting&transactionCount=1000`
              : `/api/internal/src20/trending?type=market`;
          } else if (fromPage === "wallet" && address) {
            endpoint = `/api/v2/src20/balance/${address}`;
          }

          if (endpoint) {
            const response = await fetch(`${endpoint}&${params.toString()}`);
            const result = await response.json();

            const formattedData = result.data?.map((item: SRC20Row) => ({
              ...item,
              tick: unicodeEscapeToEmoji(item.tick),
            })) || [];

            setData(formattedData);
          }
        } catch (error) {
          console.error(`SRC20 ${type} fetch error:`, error);
        } finally {
          setIsLoading(false);
          setIsTransitioning(false);
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [
    type,
    pagination?.page,
    sortBy,
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

  const handleCloseModal = () => setModalOpen(false);
  const handleImageClick = (imgSrc: string | null) => {
    if (imgSrc) {
      setModalImg(imgSrc);
      setModalOpen(!isModalOpen);
    }
  };

  if (isLoading || isTransitioning) {
    return <div class="src20-skeleton loading-skeleton h-[400px]" />;
  }

  return (
    <div>
      {title && (
        <h1 class={ModulesStyles.titlePurpleDL}>
          {title}
        </h1>
      )}
      {subTitle && (
        <h2
          class={ModulesStyles.subTitlePurple +
            " mb-3 mobileMd:mb-6 desktop:mb-9"}
        >
          {subTitle}
        </h2>
      )}

      <div class="grid grid-cols-1 gap-3 mobileLg:gap-6 items-end max-w-desktop w-full mx-auto">
        <ImageModal
          imgSrc={modalImg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />

        <div class="flex flex-col gap-6">
          {data.map((src20) => (
            parseFloat(src20?.progress || "0") >= 100
              ? (
                <SRC20TokenOutmintedCard
                  src20={src20}
                  fromPage={fromPage}
                  onImageClick={handleImageClick}
                />
              )
              : (
                <SRC20TokenMintingCard
                  src20={src20}
                  fromPage={fromPage}
                  onImageClick={handleImageClick}
                />
              )
          ))}
        </div>

        {fromPage === "home" && (
          <div class="flex justify-end -mt-3 mobileMd:-mt-6">
            <ViewAllButton href={`/src20?type=${type}`} />
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div class="mt-9 mobileLg:mt-[72px]">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              prefix={fromPage === "wallet" ? "src20" : ""}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
