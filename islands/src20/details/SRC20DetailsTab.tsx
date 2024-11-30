import { useEffect, useState } from "preact/hooks";
import { SRC20TX } from "./SRC20TX.tsx";
import { SRC20Row } from "globals";

interface SRC20DetailsTabProps {
  tick: string;
}

type TabType = "MINT" | "TRANSFER";

const TABS: TabType[] = ["MINT", "TRANSFER"];
const LIMIT = 50;

export function SRC20DetailsTab({ tick }: SRC20DetailsTabProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>("MINT");
  const [transactions, setTransactions] = useState<
    Record<TabType, SRC20Row[]>
  >({
    TRANSFER: [],
    MINT: [],
  });

  const [totalCounts, setTotalCounts] = useState({
    TRANSFER: 0,
    MINT: 0,
  });

  const fetchMoreTransactions = async (
    page: number,
    type: TabType,
  ): Promise<SRC20Row[]> => {
    try {
      const response = await fetch(
        `/api/v2/src20/tick/${tick}?op=${type}&page=${page}&limit=${LIMIT}&sort=DESC`,
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching more ${type.toLowerCase()}s:`, error);
      return [];
    }
  };

  const fetchTotalCounts = async () => {
    try {
      const [transferCount, mintCount] = await Promise.all([
        fetch(`/api/v2/src20/tick/${tick}?op=TRANSFER&limit=1`),
        fetch(`/api/v2/src20/tick/${tick}?op=MINT&limit=1`),
      ]);

      const [transferData, mintData] = await Promise.all([
        transferCount.json(),
        mintCount.json(),
      ]);

      setTotalCounts({
        TRANSFER: transferData.total || 0,
        MINT: mintData.total || 0,
      });
    } catch (error) {
      console.error("Error fetching total counts:", error);
    }
  };

  useEffect(() => {
    fetchTotalCounts();
    const fetchInitialData = async () => {
      if (transactions[selectedTab].length === 0) {
        const initialTransactions = await fetchMoreTransactions(1, selectedTab);
        setTransactions((prev) => ({
          ...prev,
          [selectedTab]: initialTransactions,
        }));
      }
    };
    fetchInitialData();
  }, [selectedTab, tick]);

  return (
    <div class="w-full h-full dark-gradient p-3 mobileMd:p-6">
      <div class="flex justify-between gap-12 text-2xl mb-5">
        {TABS.map((tab, index) => (
          <div
            class={`flex-1 ${index === 0 ? "text-left" : "text-right"} group`}
          >
            <p
              key={tab}
              class={`text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase cursor-pointer ${
                selectedTab === tab
                  ? "text-stamp-grey-darker hover:text-[#cccccc]"
                  : "hover:text-[#cccccc]"
              }`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase() + "s"}
            </p>
            <div
              class={`text-3xl mobileLg:text-4xl font-black text-stamp-grey -mt-1 group-hover:text-stamp-grey-light ${
                selectedTab === tab
                  ? "text-stamp-grey-light"
                  : "text-stamp-grey-darker"
              } cursor-pointer`}
              onClick={() => setSelectedTab(tab)}
            >
              {totalCounts[tab]}
            </div>
          </div>
        ))}
      </div>

      <SRC20TX
        txs={transactions[selectedTab]}
        type={selectedTab}
        fetchMoreData={(page) => fetchMoreTransactions(page, selectedTab)}
      />
    </div>
  );
}
