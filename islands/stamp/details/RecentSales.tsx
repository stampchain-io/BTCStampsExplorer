import { useEffect, useState } from "preact/hooks";
import StampSection from "$islands/stamp/StampSection.tsx";
import type { StampRow } from "globals";

interface RecentSalesProps {
  initialData?: StampRow[];
}

export function RecentSales({ initialData = [] }: RecentSalesProps) {
  const [recentSales, setRecentSales] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData.length);

  useEffect(() => {
    const fetchRecentSales = async () => {
      try {
        const response = await fetch('/api/v2/stamps/recent?page=1&limit=6');
        const data = await response.json();
        setRecentSales(data.data);
      } catch (error) {
        console.error('Error fetching recent sales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialData.length) {
      fetchRecentSales();
    }
  }, [initialData]);

  if (isLoading) {
    return <div>Loading recent sales...</div>;
  }

  const sectionProps = {
    title: "RECENT SALES",
    subTitle: "LATEST TRANSACTIONS",
    type: "stamps",
    stamps: recentSales,
    layout: "grid" as const,
    showDetails: false,
    gridClass: `
      grid w-full gap-3 mobileLg:gap-4
      grid-cols-2 mobileSm:grid-cols-3 
      mobileLg:grid-cols-4 desktop:grid-cols-6
    `,
    displayCounts: {
      "mobileSm": 3,
      "mobileLg": 4,
      "tablet": 4,
      "desktop": 6,
    },
  };

  return (
    <div>
      <h1 class="text-3xl tablet:text-7xl text-left mb-2 bg-clip-text text-transparent purple-gradient1 font-black">
        LATEST STAMPS
      </h1>
      <div class="flex flex-col gap-12">
        <StampSection {...sectionProps} />
      </div>
    </div>
  );
} 