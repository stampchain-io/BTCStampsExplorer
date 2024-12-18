import { useEffect, useState } from "preact/hooks";
import { SRC20Row } from "$globals";
import { SRC20TokenMintingCard } from "$islands/src20/cards/SRC20TokenMintingCard.tsx";
import { SRC20TokenOutmintedCard } from "$islands/src20/cards/SRC20TokenOutmintedCard.tsx";
import { ModulesStyles } from "$islands/modules/Styles.ts";
import { ViewAllButton } from "$components/shared/ViewAllButton.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";

interface SRC20SectionProps {
  title?: string;
  subTitle?: string;
  type: "all" | "trending";
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  page?: number;
  sortBy?: "ASC" | "DESC";
  initialData?: SRC20Row[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  address?: string;
  onPageChange?: (page: number) => void;
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

export function SRC20Section(
  {
    title,
    subTitle,
    type,
    fromPage,
    page,
    sortBy,
    initialData,
    pagination,
    address,
    onPageChange,
  }: SRC20SectionProps,
) {
  const [data, setData] = useState<SRC20Row[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(pagination?.page || 1);

  useEffect(() => {
    if (!initialData) {
      const endpoint = fromPage === "wallet" && address
        ? `/api/v2/src20/balance/${address}?page=${
          pagination?.page || currentPage
        }&limit=${pagination?.limit || 5}`
        : type === "trending"
        ? `/api/internal/src20/trending?limit=5&page=${page}&sortBy=${sortBy}`
        : `/api/internal/src20/details?op=DEPLOY&limit=5&page=${page}&sortBy=${sortBy}`;

      fetch(endpoint)
        .then((res) => res.json())
        .then((response) => {
          setData(response.data || []);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error(`SRC20 ${type} fetch error:`, error);
          setIsLoading(false);
        });
    }
  }, [type, page, sortBy, initialData, fromPage, address, pagination, currentPage]);

  useEffect(() => {
    if (data.length > 0 && fromPage === "wallet") {
      const fetchMintData = async () => {
        const updatedData = await Promise.all(
          data.map(async (token) => {
            try {
              const response = await fetch(
                `/api/v2/src20/tick/${encodeURIComponent(token.tick)}/mintData`,
              );
              const mintData = await response.json();

              return {
                ...token,
                progress: mintData.mintStatus?.progress || "0",
                holders: mintData.holders || 0,
                max_supply: mintData.mintStatus?.max_supply,
                total_minted: mintData.mintStatus?.total_minted,
                limit: mintData.mintStatus?.limit,
              };
            } catch (error) {
              console.error(
                `Error fetching mint data for ${token.tick}:`,
                error,
              );
              return token;
            }
          }),
        );
        setData(updatedData);
      };

      fetchMintData();
    }
  }, [data, fromPage]);

  const handleCloseModal = () => setModalOpen(false);
  const handleImageClick = (imgSrc: string) => {
    setModalImg(imgSrc);
    setModalOpen(!isModalOpen);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  if (isLoading) {
    return <div class="loading-skeleton h-[400px]" />;
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
            src20.progress === "100"
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

        {pagination && pagination.totalPages > 1 && (
          <div class="mt-6">
            <Pagination
              page={currentPage}
              page_size={pagination.limit}
              key="Token"
              type="Token_id"
              data_length={pagination.total}
              pages={pagination.totalPages}
              prefix="src20"
              onChange={handlePageChange}
            />
          </div>
        )}

        {fromPage === "home" && (
          <div className="flex justify-end -mt-3 mobileMd:-mt-6">
            <ViewAllButton href={`/src20?type=${type}`} />
          </div>
        )}
      </div>
    </div>
  );
}
