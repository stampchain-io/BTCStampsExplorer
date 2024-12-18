/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { StampRow, StampWithSaleData } from "$types/utils.d.ts";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { ViewAllButton } from "$components/shared/ViewAllButton.tsx";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { BREAKPOINTS } from "$lib/utils/constants.ts";
import { ModulesStyles } from "$islands/modules/Styles.ts";

interface StampSectionProps {
  title?: string;
  subTitle?: string;
  type?: string;
  stamps: StampRow[];
  layout?: "grid" | "list";
  isRecentSales?: boolean;
  filterBy?: string | string[];
  showDetails?: boolean;
  gridClass?: string;
  displayCounts?: {
    desktop?: number;
    tablet?: number;
    mobileLg?: number;
    mobileMd?: number;
    mobileSm?: number;
  };
  pagination?: {
    page: number;
    page_size: number;
    data_length: number;
    prefix?: string;
    onPageChange?: (page: number) => void;
  };
  showMinDetails?: boolean;
  variant?: "default" | "grey";
  viewAllLink?: string;
  alignRight?: boolean;
}

export default function StampSection({
  title,
  subTitle,
  type,
  stamps,
  layout,
  isRecentSales,
  filterBy,
  showDetails = false,
  gridClass,
  displayCounts,
  pagination,
  showMinDetails = false,
  variant = "default",
  viewAllLink,
  alignRight = false,
}: StampSectionProps) {
  const stampArray = Array.isArray(stamps) ? stamps : [];
  const [displayCount, setDisplayCount] = useState(stampArray.length);
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowSize();

  // Build the "See All"  link parameters
  const params = new URLSearchParams();
  if (isRecentSales) {
    params.append("recentSales", "true");
  } else if (type) {
    params.append("type", type);
  }
  if (filterBy) {
    const filterArray = Array.isArray(filterBy) ? filterBy : [filterBy];
    if (filterArray.length > 0) {
      params.append("filterBy", filterArray.join(","));
    }
  }
  const seeAllLink = viewAllLink ? viewAllLink : `/stamp?${params.toString()}`;

  // Handle display count updates
  useEffect(() => {
    const updateDisplayCount = () => {
      if (displayCounts) {
        if (width >= BREAKPOINTS.desktop) {
          setDisplayCount(displayCounts.desktop || stampArray.length);
        } else if (width >= BREAKPOINTS.tablet) {
          setDisplayCount(
            displayCounts.tablet || displayCounts.desktop || stampArray.length,
          );
        } else if (width >= BREAKPOINTS.mobileLg) {
          setDisplayCount(
            displayCounts.mobileLg || displayCounts.tablet ||
              displayCounts.desktop || stampArray.length,
          );
        } else {
          setDisplayCount(
            displayCounts.mobileSm ||
              displayCounts.mobileMd ||
              displayCounts.mobileLg ||
              displayCounts.tablet ||
              displayCounts.desktop ||
              stampArray.length,
          );
        }
      } else {
        setDisplayCount(stampArray.length);
      }
    };
    updateDisplayCount();
  }, [width, displayCounts, stampArray.length]);

  // Handle pagination loading state
  useEffect(() => {
    if (pagination) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [pagination?.page]);

  const stampWithSaleData = (stamp: StampRow): StampWithSaleData => ({
    ...stamp,
    sale_data: stamp.sale_data
      ? {
          ...stamp.sale_data,
          btc_amount: stamp.sale_data.price || 0,
        }
      : undefined,
  });

  return (
    <div class="w-full">
      {title && (
        <div
          class={`flex flex-col items-start ${
            alignRight && "tablet:items-end"
          }`}
        >
          <h1
            class={`${
              alignRight
                ? ModulesStyles.titlePurpleDL
                : ModulesStyles.titlePurpleDL
            } tablet:hidden`}
          >
            {title}
          </h1>
          <h1
            class={`hidden tablet:block ${
              alignRight
                ? ModulesStyles.titlePurpleLD
                : ModulesStyles.titlePurpleDL
            }`}
          >
            {title}
          </h1>
        </div>
      )}
      {subTitle && (
        <div
          class={`flex flex-col items-start ${
            alignRight && "tablet:items-end"
          }`}
        >
          <h2 className={ModulesStyles.subTitlePurple}>
            {subTitle}
          </h2>
        </div>
      )}

      <div class={gridClass}>
        {isLoading ? <div>Loading...</div> : (
          stampArray.slice(0, displayCount).map((stamp: StampRow) => (
            <div
              key={isRecentSales && stamp.sale_data
                ? `${stamp.tx_hash}-${stamp.sale_data.tx_hash}`
                : stamp.tx_hash}
            >
              <StampCard
                stamp={stampWithSaleData(stamp)}
                isRecentSale={isRecentSales}
                showDetails={showDetails}
                showMinDetails={showMinDetails}
                variant={variant}
              />
            </div>
          ))
        )}
      </div>

      {pagination
        ? (
          <div class="mt-9 mobileLg:mt-[72px]">
            <Pagination
              page={pagination.page}
              page_size={pagination.page_size}
              type="stamp_card_id"
              data_length={pagination.data_length}
              pages={Math.ceil(pagination.data_length / pagination.page_size)}
              prefix={pagination.prefix}
              onPageChange={pagination.onPageChange}
            />
          </div>
        )
        : <ViewAllButton href={seeAllLink} />}
    </div>
  );
}
