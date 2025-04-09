/* ===== RECENT SALES COMPONENT ===== */
/*@baba-move Refreshing to ViewAllButton-remove default (not used)*/
import { useEffect, useState } from "preact/hooks";
import StampSection from "$islands/stamp/StampSection.tsx";
import type { StampRow } from "$globals";
import { titlePurpleLD } from "$text";

/* ===== TYPES ===== */
interface DisplayCountBreakpoints {
  mobileSm: number;
  mobileMd: number;
  mobileLg: number;
  tablet: number;
  desktop: number;
}

interface RecentSaleStamp extends StampRow {
  sale_data?: {
    btc_amount: number;
    block_index: number;
    tx_hash: string;
  };
}

interface RecentSalesProps {
  initialData?: RecentSaleStamp[];
  title?: string;
  subTitle?: string;
  variant?: "home" | "detail";
  displayCounts?: DisplayCountBreakpoints;
  gridClass?: string;
}

/* ===== COMPONENT ===== */
export function RecentSalesGallery({
  initialData = [],
  title = "LATEST STAMPS",
  subTitle,
  variant = "detail",
  displayCounts,
  gridClass,
}: RecentSalesProps) {
  /* ===== STATE ===== */
  const [recentSales, setRecentSales] = useState<RecentSaleStamp[]>(
    initialData,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ===== DATA FETCHING ===== */
  const fetchRecentSales = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/v2/stamps/recentSales?page=1&limit=8");
      if (!response.ok) {
        throw new Error("Failed to fetch recent sales");
      }
      const data = await response.json();
      const salesWithData = (data.data || []).map((stamp: RecentSaleStamp) => {
        if (!stamp.sale_data) {
          console.warn(`Stamp ${stamp.tx_hash} missing sale_data`);
        }
        return stamp;
      });
      setRecentSales(salesWithData);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      setError("Failed to load recent sales");
    } finally {
      setIsLoading(false);
    }
  };

  /* ===== EFFECTS ===== */
  useEffect(() => {
    if (initialData.length === 0) {
      fetchRecentSales();
    }

    const refreshInterval = setInterval(fetchRecentSales, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  /* ===== ERROR HANDLING ===== */
  if (error) {
    return <div class="text-red-500">{error}</div>;
  }

  /* ===== DISPLAY CONFIGURATIONS ===== */
  const defaultHomeDisplayCounts: DisplayCountBreakpoints = {
    mobileSm: 3,
    mobileMd: 4,
    mobileLg: 5,
    tablet: 6,
    desktop: 7,
  };

  const defaultDetailDisplayCounts: DisplayCountBreakpoints = {
    mobileSm: 3,
    mobileMd: 3,
    mobileLg: 4,
    tablet: 4,
    desktop: 6,
  };

  /* ===== GRID STYLES ===== */
  const defaultHomeGridClass = `
    grid w-full gap-3 mobileMd:gap-6
    grid-cols-3 mobileMd:grid-cols-3 mobileLg:grid-cols-5 tablet:grid-cols-6 desktop:grid-cols-7
    auto-rows-fr
  `;

  const defaultDetailGridClass = `
    grid w-full gap-3 mobileLg:gap-6
    grid-cols-2 mobileSm:grid-cols-3 
    mobileLg:grid-cols-4 desktop:grid-cols-6
  `;

  /* ===== SECTION PROPS ===== */
  const sectionProps = variant === "home"
    ? {
      subTitle: subTitle || "HOT STAMPS",
      type: "recent",
      stamps: recentSales,
      fromPage: "home",
      layout: "grid" as const,
      isRecentSales: true,
      showDetails: false,
      viewAllLink: "/stamp?recentSales=true",
      showMinDetails: true,
      variant: "grey" as const,
      gridClass: gridClass || defaultHomeGridClass,
      displayCounts: displayCounts || defaultHomeDisplayCounts,
    }
    : {
      subTitle: subTitle || "LATEST TRANSACTIONS",
      type: "stamps",
      stamps: recentSales,
      layout: "grid" as const,
      isRecentSales: true,
      showDetails: false,
      showMinDetails: true,
      gridClass: gridClass || defaultDetailGridClass,
      displayCounts: displayCounts || defaultDetailDisplayCounts,
    };

  /* ===== RENDER ===== */
  return (
    <div>
      <h3
        class={variant === "home"
          ? titlePurpleLD
          : "text-3xl tablet:text-7xl text-left mb-2 bg-clip-text text-transparent purple-gradient1 font-black"}
      >
        {title}
      </h3>
      <div class="flex flex-col gap-12">
        <StampSection {...sectionProps} />
        {isLoading && <div class="text-sm text-gray-400">Refreshing...</div>}
      </div>
    </div>
  );
}
