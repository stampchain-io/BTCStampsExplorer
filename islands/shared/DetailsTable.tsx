import { useEffect, useState } from "preact/hooks";
import { ComponentType } from "preact";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import { TabData, TABLE_STYLES, TableProps } from "$components/shared/types.ts";

import { StampListingsAll } from "$components/stampDetails/StampListingsAll.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampTransfers } from "$components/stampDetails/StampTransfers.tsx";

const PAGE_SIZE = 20;

const DetailsTable: ComponentType<TableProps> = ({ type, configs, cpid }) => {
  const [selectedTab, setSelectedTab] = useState<string>(configs[0].id);
  const [tabData, setTabData] = useState<TabData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCounts, setTotalCounts] = useState({
    dispensers: 0,
    sales: 0,
    transfers: 0,
  });

  const mapDispensesWithRates = (dispenses: any[], dispensers: any[]) => {
    if (!dispenses || !dispensers) return [];

    const dispenserRates = new Map(
      dispensers.map((d) => [d.tx_hash, d.satoshirate]),
    );

    return dispenses.map((dispense) => ({
      ...dispense,
      satoshirate: dispenserRates.get(dispense.dispenser_tx_hash) || 0,
    }));
  };

  const fetchData = async (
    pageNum: number,
    tabId: string,
    isTabChange = false,
  ) => {
    if (isLoading) return;
    if (!isTabChange && !hasMore) return;

    setIsLoading(true);
    try {
      if (type === "stamps" && cpid) {
        const encodedCpid = encodeURIComponent(cpid);
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: PAGE_SIZE.toString(),
          sort: "DESC",
        });

        switch (tabId) {
          case "dispensers": {
            const response = await fetch(
              `/api/v2/stamps/${encodedCpid}/dispensers?${params}`,
            );
            const data = await response.json();
            setTabData((prev) => ({
              ...prev,
              dispensers: data.data || [],
            }));
            setHasMore(data.data?.length === PAGE_SIZE);
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

            const [dispenseData, dispensersData] = await Promise.all([
              dispenseResponse.json(),
              dispensersResponse.json(),
            ]);

            setTabData((prev) => ({
              ...prev,
              dispenses: dispenseData.data || [],
              dispensers: dispensersData.data || [],
            }));
            setHasMore(dispenseData.data?.length === PAGE_SIZE);
            break;
          }
          case "transfers": {
            const response = await fetch(
              `/api/v2/stamps/${encodedCpid}/sends?${params}`,
            );
            const data = await response.json();
            setTabData((prev) => ({
              ...prev,
              sends: data.data || [],
            }));
            setHasMore(data.data?.length === PAGE_SIZE);
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ${tabId} data:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    if (type === "stamps") {
      switch (selectedTab) {
        case "dispensers":
          return <StampListingsAll dispensers={tabData.dispensers || []} />;
        case "sales": {
          const dispensesWithRates = mapDispensesWithRates(
            tabData.dispenses || [],
            tabData.dispensers || [],
          );
          return <StampSales dispenses={dispensesWithRates} />;
        }
        case "transfers":
          return <StampTransfers sends={tabData.sends || []} />;
        default:
          return null;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!selectedTab) return;
    setPage(1);
    setHasMore(true);
    fetchData(1, selectedTab, true);
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
      fetchData(nextPage, selectedTab);
    }
  };

  useEffect(() => {
    const fetchTotalCounts = async () => {
      if (!cpid) return;

      try {
        const encodedCpid = encodeURIComponent(cpid);
        const countParams = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          sort: "DESC",
        });

        const [dispensersCount, salesCount, transfersCount] = await Promise.all(
          [
            fetch(`/api/v2/stamps/${encodedCpid}/dispensers?${countParams}`),
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
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchTotalCounts();
  }, [cpid]);

  return (
    <div class={TABLE_STYLES.container}>
      <div class="flex justify-between items-start w-full mb-6">
        {configs.map(({ id }) => {
          const count = totalCounts[id as keyof typeof totalCounts];
          return (
            <div
              key={id}
              class={`cursor-pointer group ${
                id === "dispensers"
                  ? "text-left"
                  : id === "sales"
                  ? "text-center"
                  : "text-right"
              }`}
              onClick={() => setSelectedTab(id)}
            >
              <span
                class={`${TABLE_STYLES.dataLabel} group-hover:text-stamp-grey-light`}
              >
                {id === "dispensers"
                  ? "LISTINGS"
                  : id === "sales"
                  ? "SALES"
                  : "TRANSFERS"}
              </span>
              <div
                class={`${TABLE_STYLES.dataValueXLlink} text-stamp-grey-darker ${
                  selectedTab === id ? "text-stamp-grey-light" : ""
                } group-hover:text-stamp-grey-light`}
              >
                {count}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollContainer>
        <div onScroll={handleScroll} class="overflow-auto overscroll-contain">
          {renderTabContent()}
          {isLoading && <div class="text-center p-6">Loading...</div>}
        </div>
      </ScrollContainer>
    </div>
  );
};

export default DetailsTable;
