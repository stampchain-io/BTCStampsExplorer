import { useEffect, useState } from "preact/hooks";

import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampTransfers } from "$components/stampDetails/StampTransfers.tsx";

interface StampRelatedInfoProps {
  stampId: string;
}

type TabType = "dispensers" | "sales" | "transfers";

const tabs: Array<{ id: TabType; label: string }> = [
  { id: "dispensers", label: "DISPENSERS" },
  { id: "sales", label: "SALES" },
  { id: "transfers", label: "TRANSFERS" },
];

const PAGE_SIZE = 20;

// Move rate calculation to frontend
function mapDispensesWithRates(dispenses: any[], dispensers: any[]) {
  if (!dispenses || !dispensers) return [];

  const dispenserRates = new Map(
    dispensers.map((d) => [d.tx_hash, d.satoshirate]),
  );

  return dispenses.map((dispense) => ({
    ...dispense,
    satoshirate: dispenserRates.get(dispense.dispenser_tx_hash) || 0,
  }));
}

export function StampRelatedInfo({ stampId }: StampRelatedInfoProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>("dispensers");
  const [dispensers, setDispensers] = useState<any[]>([]);
  const [dispenses, setDispenses] = useState<any[]>([]);
  const [sends, setSends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async (pageNum: number) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      console.log(`Fetching ${selectedTab} data for page ${pageNum}`);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: PAGE_SIZE.toString(),
        sort: "DESC",
      });

      let response;
      switch (selectedTab) {
        case "dispensers": {
          response = await fetch(
            `/api/v2/stamps/${stampId}/dispensers?${params}`,
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Dispensers data:", data);
          if (data.data) {
            setDispensers((prev) =>
              pageNum === 1 ? data.data : [...prev, ...data.data]
            );
            setHasMore(data.data.length === PAGE_SIZE);
          }
          break;
        }
        case "sales": {
          const [dispenseResponse, dispensersResponse] = await Promise.all([
            fetch(`/api/v2/stamps/${stampId}/dispenses?${params}`),
            fetch(
              `/api/v2/stamps/${stampId}/dispensers?${new URLSearchParams({
                limit: "1000",
                sort: "DESC",
              })}`,
            ),
          ]);

          if (!dispenseResponse.ok) {
            throw new Error(`HTTP error! status: ${dispenseResponse.status}`);
          }
          if (!dispensersResponse.ok) {
            throw new Error(`HTTP error! status: ${dispensersResponse.status}`);
          }

          const [dispenseData, dispensersData] = await Promise.all([
            dispenseResponse.json(),
            dispensersResponse.json(),
          ]);

          console.log("Sales data:", {
            dispenses: dispenseData,
            dispensers: dispensersData,
          });

          if (dispenseData.data) {
            setDispenses((prev) =>
              pageNum === 1
                ? dispenseData.data
                : [...prev, ...dispenseData.data]
            );
            setHasMore(dispenseData.data.length === PAGE_SIZE);
          }
          if (dispensersData.data) {
            setDispensers(dispensersData.data);
          }
          break;
        }
        case "transfers": {
          response = await fetch(`/api/v2/stamps/${stampId}/sends?${params}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Transfers data:", data);
          if (data.data) {
            setSends((prev) =>
              pageNum === 1 ? data.data : [...prev, ...data.data]
            );
            setHasMore(data.data.length === PAGE_SIZE);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset state when tab changes
    setPage(1);
    setHasMore(true);
    setIsLoading(false);
    fetchData(1);
  }, [selectedTab]);

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    if (
      target.scrollHeight - target.scrollTop === target.clientHeight &&
      !isLoading &&
      hasMore
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  const dispensesWithRates = mapDispensesWithRates(dispenses, dispensers);

  const renderTabContent = () => {
    switch (selectedTab) {
      case "dispensers": {
        return <StampDispensers dispensers={dispensers} />;
      }
      case "sales": {
        return <StampSales dispenses={dispensesWithRates} />;
      }
      case "transfers": {
        return <StampTransfers sends={sends} />;
      }
    }
  };

  return (
    <div class="dark-gradient p-2 tablet:p-6">
      <div class="flex justify-between w-full overflow-y-auto text-[#666666] text-sm tablet:text-[19px]">
        {tabs.map(({ id, label }) => (
          <p
            key={id}
            class={`cursor-pointer pb-4 hover:text-[#8800CC] ${
              selectedTab === id ? "text-[#8800CC] font-bold" : ""
            }`}
            onClick={() => setSelectedTab(id)}
          >
            {label}
          </p>
        ))}
      </div>
      <div onScroll={handleScroll} class="overflow-y-auto max-h-[600px]">
        {renderTabContent()}
        {isLoading && <div class="text-center p-4">Loading...</div>}
      </div>
    </div>
  );
}
