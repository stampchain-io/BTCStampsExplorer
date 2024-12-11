import { useCallback, useEffect, useState } from "preact/hooks";

import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampTransfers } from "$components/stampDetails/StampTransfers.tsx";

interface StampRelatedInfoProps {
  stampId: string;
  cpid: string;
}

type TabType = "dispensers" | "sales" | "transfers";

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

// Remove the static tabs array and create a function to get tabs with counts
function getTabsWithCounts(dispensers: any[], dispenses: any[], sends: any[]) {
  return [
    { id: "dispensers", label: `DISPENSERS (${dispensers.length})` },
    { id: "sales", label: `SALES (${dispenses.length})` },
    { id: "transfers", label: `TRANSFERS (${sends.length})` },
  ] as const;
}

const PAGE_SIZE = 20;

export function StampRelatedInfo({ stampId, cpid }: StampRelatedInfoProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>("dispensers");
  const [dispensers, setDispensers] = useState<any[]>([]);
  const [dispenses, setDispenses] = useState<any[]>([]);
  const [sends, setSends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Add new state for total counts
  const [totalCounts, setTotalCounts] = useState({
    dispensers: 0,
    sales: 0,
    transfers: 0,
  });

  const fetchData = useCallback(
    async (pageNum: number, isTabChange = false) => {
      if (isLoading) return;
      if (!isTabChange && !hasMore) return;

      setIsLoading(true);
      try {
        const encodedCpid = encodeURIComponent(cpid);

        // Fetch total counts if it's the first page
        if (pageNum === 1) {
          const countParams = new URLSearchParams({
            limit: "1",
            sort: "DESC",
          });

          // Fetch counts for all tabs
          const [dispensersCount, salesCount, transfersCount] = await Promise
            .all(
              [
                fetch(
                  `/api/v2/stamps/${encodedCpid}/dispensers?${countParams}`,
                ),
                fetch(`/api/v2/stamps/${encodedCpid}/dispenses?${countParams}`),
                fetch(`/api/v2/stamps/${encodedCpid}/sends?${countParams}`),
              ],
            );

          const [dispensersData, salesData, transfersData] = await Promise.all([
            dispensersCount.json(),
            salesCount.json(),
            transfersCount.json(),
          ]);

          setTotalCounts({
            dispensers: dispensersData.total || 0,
            sales: salesData.total || 0,
            transfers: transfersData.total || 0,
          });
        }

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
              `/api/v2/stamps/${encodedCpid}/dispensers?${params}`,
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
              fetch(`/api/v2/stamps/${encodedCpid}/dispenses?${params}`),
              fetch(
                `/api/v2/stamps/${encodedCpid}/dispensers?${new URLSearchParams(
                  {
                    limit: "1000",
                    sort: "DESC",
                  },
                )}`,
              ),
            ]);

            if (!dispenseResponse.ok) {
              throw new Error(`HTTP error! status: ${dispenseResponse.status}`);
            }
            if (!dispensersResponse.ok) {
              throw new Error(
                `HTTP error! status: ${dispensersResponse.status}`,
              );
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
            response = await fetch(
              `/api/v2/stamps/${encodedCpid}/sends?${params}`,
            );
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
    },
    [cpid, hasMore, isLoading, selectedTab],
  );

  const handleTabChange = useCallback((newTab: TabType) => {
    if (selectedTab === newTab) return;
    setSelectedTab(newTab);
  }, [selectedTab]);

  // Remove the separate effects and combine into one
  useEffect(() => {
    if (!selectedTab) return;

    setPage(1);
    setHasMore(true);
    const timer = setTimeout(() => {
      fetchData(1, true);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedTab]); // Only depend on selectedTab change

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
  const dataLabelClassName =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXLlinkClassName =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey -mt-1";

  // Update getTabsWithCounts to use totalCounts
  function getTabsWithCounts() {
    return [
      {
        id: "dispensers",
        label: (
          <div class="flex flex-col text-left">
            DISPENSERS
            <div
              class={`${dataValueXLlinkClassName} ${
                selectedTab === "dispensers"
                  ? "text-stamp-grey-light"
                  : "text-stamp-grey-darker"
              } group-hover:text-stamp-grey-light`}
            >
              {totalCounts.dispensers}
            </div>
          </div>
        ),
      },
      {
        id: "sales",
        label: (
          <div class="flex flex-col text-center">
            SALES
            <div
              class={`${dataValueXLlinkClassName} ${
                selectedTab === "sales"
                  ? "text-stamp-grey-light"
                  : "text-stamp-grey-darker"
              } group-hover:text-stamp-grey-light`}
            >
              {totalCounts.sales}
            </div>
          </div>
        ),
      },
      {
        id: "transfers",
        label: (
          <div class="flex flex-col text-right">
            TRANSFERS
            <div
              class={`${dataValueXLlinkClassName} ${
                selectedTab === "transfers"
                  ? "text-stamp-grey-light"
                  : "text-stamp-grey-darker"
              } group-hover:text-stamp-grey-light`}
            >
              {totalCounts.transfers}
            </div>
          </div>
        ),
      },
    ] as const;
  }

  return (
    <div class="dark-gradient p-3 mobileMd:p-6">
      <div class="flex justify-between w-full overflow-y-auto text-base mobileLg:text-lg text-stamp-grey-darker font-light -mb-1 mobileLg:mb-2">
        {getTabsWithCounts().map(({ id, label }) => (
          <p
            key={id}
            class={`cursor-pointer pb-4 hover:text-stamp-grey-light group ${
              selectedTab === id ? "text-stamp-grey-darker" : ""
            }`}
            onClick={() => handleTabChange(id as TabType)}
          >
            {label}
          </p>
        ))}
      </div>
      <div onScroll={handleScroll} class="overflow-y-auto max-h-48">
        {renderTabContent()}
        {isLoading && <div class="text-center p-6">Loading...</div>}
      </div>
    </div>
  );
}
