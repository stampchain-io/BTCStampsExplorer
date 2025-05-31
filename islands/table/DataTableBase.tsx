/* ===== DATA TABLE BASE COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { containerBackground, ScrollContainer } from "$layout";
import { TabData, TableProps, TableType } from "$components/layout/types.ts";
import {
  SRC20MintsTable,
  SRC20TransfersTable,
  StampListingsAllTable,
  StampSalesTable,
  StampTransfersTable,
} from "$table";
import { labelSm, loaderText, value3xlTransparent } from "$text";

/* ===== CONSTANTS ===== */
const PAGE_SIZE = 20;

/* ===== COMPONENT ===== */
export default function DataTableBase({
  type,
  configs,
  cpid,
  tick,
  initialCounts = {},
}: TableProps) {
  /* ===== STATE ===== */
  const [selectedTab, setSelectedTab] = useState<string>(configs[0].id);
  const [tabData, setTabData] = useState<TabData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCounts, setTotalCounts] = useState(initialCounts);

  /* ===== DATA HANDLERS ===== */
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

        const operation = tabId === "dispensers"
          ? "dispensers"
          : tabId === "sales"
          ? "dispenses"
          : "sends";

        const response = await fetch(
          `/api/v2/stamps/${encodedCpid}/${operation}?${params}`,
        );

        // Handle 404 responses (no data found) gracefully
        if (!response.ok) {
          if (response.status === 404) {
            setTabData((prev) => ({
              ...prev,
              [operation]: isTabChange ? [] : prev[operation] || [],
            }));
            setHasMore(false);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setTabData((prev) => ({
          ...prev,
          [operation]: isTabChange
            ? data.data
            : [...(prev[operation] || []), ...data.data],
        }));

        setHasMore(data.data?.length === PAGE_SIZE);
      } else if (type === "src20" && tick) {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: PAGE_SIZE.toString(),
          sort: "DESC",
        });

        const operation = tabId === "mints" ? "MINT" : "TRANSFER";
        const response = await fetch(
          `/api/v2/src20/tick/${tick}?op=${operation}&${params}`,
        );
        const data = await response.json();

        setTabData((prev) => ({
          ...prev,
          [tabId]: isTabChange
            ? data.data
            : [...(prev[tabId] || []), ...data.data],
        }));

        setHasMore(data.data?.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error(`Error fetching ${tabId} data:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===== RENDER HELPERS ===== */
  const renderTabContent = () => {
    if (type === "stamps") {
      switch (selectedTab) {
        case "dispensers":
          return (
            <StampListingsAllTable dispensers={tabData.dispensers || []} />
          );
        case "sales": {
          const dispensesWithRates = mapDispensesWithRates(
            tabData.dispenses || [],
            tabData.dispensers || [],
          );
          return <StampSalesTable dispenses={dispensesWithRates} />;
        }
        case "transfers":
          return <StampTransfersTable sends={tabData.sends || []} />;
        default:
          return null;
      }
    } else if (type === "src20") {
      switch (selectedTab) {
        case "mints":
          return <SRC20MintsTable mints={tabData.mints || []} />;
        case "transfers":
          return <SRC20TransfersTable sends={tabData.transfers || []} />;
        default:
          return null;
      }
    }
    return null;
  };

  /* ===== EFFECTS ===== */
  useEffect(() => {
    if (!selectedTab) return;
    setPage(1);
    setHasMore(true);
    fetchData(1, selectedTab, true);
  }, [selectedTab]);

  /* ===== EVENT HANDLERS ===== */
  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    const scrollPosition = target.scrollTop + target.clientHeight;
    const scrollThreshold = target.scrollHeight - 20;
    if (
      scrollPosition >= scrollThreshold &&
      !isLoading &&
      hasMore
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, selectedTab);
    }
  };

  /* ===== DATA INITIALIZATION ===== */
  useEffect(() => {
    if (Object.keys(initialCounts).length > 0) return;

    const fetchCounts = async () => {
      if (!tick && !cpid) return;

      try {
        if (type === "stamps" && cpid) {
          const encodedCpid = encodeURIComponent(cpid);
          const countParams = new URLSearchParams({
            limit: PAGE_SIZE.toString(),
            sort: "DESC",
          });

          const [dispensersCount, salesCount, transfersCount] = await Promise
            .all([
              fetch(`/api/v2/stamps/${encodedCpid}/dispensers?${countParams}`),
              fetch(`/api/v2/stamps/${encodedCpid}/dispenses?${countParams}`),
              fetch(`/api/v2/stamps/${encodedCpid}/sends?${countParams}`),
            ]);

          // Handle 404s gracefully for count fetching
          const dispensersData = dispensersCount.ok
            ? await dispensersCount.json()
            : { total: 0 };
          const salesData = salesCount.ok
            ? await salesCount.json()
            : { total: 0 };
          const transfersData = transfersCount.ok
            ? await transfersCount.json()
            : { total: 0 };

          setTotalCounts({
            dispensers: dispensersData.total || 0,
            sales: salesData.total || 0,
            transfers: transfersData.total || 0,
          });
        } else if (type === "src20" && tick) {
          const encodedTick = encodeURIComponent(tick);
          const [transferCount, mintCount] = await Promise.all([
            fetch(`/api/v2/src20/tick/${encodedTick}?op=TRANSFER&limit=1`),
            fetch(`/api/v2/src20/tick/${encodedTick}?op=MINT&limit=1`),
          ]);

          const [transferData, mintData] = await Promise.all([
            transferCount.json(),
            mintCount.json(),
          ]);

          setTotalCounts((prev) => ({
            ...prev,
            transfers: transferData.total || 0,
            mints: mintData.total || 0,
          }));
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, [type, cpid, tick]);

  /* ===== HELPER FUNCTIONS ===== */
  const getTabAlignment = (id: string, totalTabs: number) => {
    // For 3 tabs
    if (totalTabs === 3) {
      if (id === configs[0].id) return "text-left";
      if (id === configs[1].id) return "text-center";
      return "text-right";
    }

    // For 2 tabs
    if (totalTabs === 2) {
      return id === configs[0].id ? "text-left" : "text-right";
    }

    // For 1 tab
    return "text-left";
  };

  const getTabLabel = (type: TableType, id: string) => {
    switch (type) {
      case "stamps":
        return id === "dispensers"
          ? "LISTINGS"
          : id === "sales"
          ? "SALES"
          : "TRANSFERS";
      case "src20":
        return id === "mints" ? "MINTS" : "TRANSFERS";
      case "src101":
        // Add bitname specific labels
        return id.toUpperCase();
      case "vault":
        // Add vault specific labels
        return id.toUpperCase();
      default:
        return id.toUpperCase();
    }
  };

  /* ===== RENDER ===== */
  return (
    <div class={containerBackground}>
      {/* ===== TABS SECTION ===== */}
      <div class="flex justify-between items-start w-full mb-6">
        {configs.map(({ id }) => {
          const count = totalCounts[id as keyof typeof totalCounts];
          const alignment = getTabAlignment(id, configs.length);

          return (
            <div
              key={id}
              class={`cursor-pointer group ${alignment}`}
              onClick={() => setSelectedTab(id)}
            >
              <span
                class={`${labelSm} group-hover:text-stamp-grey-light`}
              >
                {getTabLabel(type, id)}
              </span>
              <div
                class={`${value3xlTransparent} text-stamp-grey-darker ${
                  selectedTab === id ? "text-stamp-grey-light" : ""
                } group-hover:text-stamp-grey-light`}
              >
                {count || 0}
              </div>
            </div>
          );
        })}
      </div>
      {/* ===== TABLE CONTENT ===== */}
      <ScrollContainer class="max-h-48" onScroll={handleScroll}>
        <div class="">
          {renderTabContent()}
          {/* ===== LOADING INDICATOR ===== */}
          {isLoading && (
            <div class={loaderText}>
              <span>L</span>
              <span>O</span>
              <span>A</span>
              <span>D</span>
              <span>I</span>
              <span>N</span>
              <span>G</span>
            </div>
          )}
        </div>
      </ScrollContainer>
    </div>
  );
}
