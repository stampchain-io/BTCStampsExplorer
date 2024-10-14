import { useEffect, useState } from "preact/hooks";
import { SRC20TX } from "./SRC20TX.tsx";
import { SRC20Row } from "globals";

interface SRC20DetailsTabProps {
  tick: string;
}

type TabType = "TRANSFER" | "MINT";

const TABS: TabType[] = ["TRANSFER", "MINT"];
const LIMIT = 50;

export function SRC20DetailsTab({ tick }: SRC20DetailsTabProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>("TRANSFER");
  const [transactions, setTransactions] = useState<
    Record<TabType, SRC20Row[]>
  >({
    TRANSFER: [],
    MINT: [],
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

  useEffect(() => {
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
    <div class="w-full h-full bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-3 md:p-6">
      <div class="flex justify-between gap-12 text-2xl cursor-pointer mb-5">
        {TABS.map((tab) => (
          <p
            key={tab}
            class={selectedTab === tab ? "text-[#666666]" : "text-[#999999]"}
            onClick={() => setSelectedTab(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase() + "s"}
          </p>
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
