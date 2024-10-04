import { useEffect, useState } from "preact/hooks";
import { SRC20HoldersInfo } from "$components/src20/SRC20HoldersInfo.tsx";
import { SRC20TX } from "$components/src20/SRC20TX.tsx";

type SRC20DetailsTabProps = {
  holders: any[];
  tick: string;
};

export function SRC20DetailsTab(props: SRC20DetailsTabProps) {
  const { holders, tick } = props;
  const [selected, setSelected] = useState(0);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [mints, setMints] = useState<any[]>([]);
  const [transfersPage, setTransfersPage] = useState(1);
  const [mintsPage, setMintsPage] = useState(1);
  const limit = 50; // Number of items to fetch per page

  // Function to fetch more transfers
  const fetchMoreTransfers = async (page: number) => {
    try {
      const response = await fetch(
        `/api/v2/src20/tick/${tick}?op=TRANSFER&page=${page}&limit=${limit}&sort=DESC`,
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching more transfers:", error);
      return [];
    }
  };

  // Function to fetch more mints
  const fetchMoreMints = async (page: number) => {
    try {
      const response = await fetch(
        `/api/v2/src20/tick/${tick}?op=MINT&page=${page}&limit=${limit}&sort=DESC`,
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching more mints:", error);
      return [];
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      if (selected === 1 && transfers.length === 0) {
        const initialTransfers = await fetchMoreTransfers(1);
        setTransfers(initialTransfers);
      } else if (selected === 2 && mints.length === 0) {
        const initialMints = await fetchMoreMints(1);
        setMints(initialMints);
      }
    };
    fetchInitialData();
  }, [selected]);

  const updateSelected = (index: number) => {
    setSelected(index);
  };

  return (
    <>
      <div class="flex gap-12 text-2xl cursor-pointer mb-5">
        {["Holders", "Transfers", "Mints"].map((tab, index) => (
          <p
            key={tab}
            class={`pb-4 border-b-4 ${
              selected === index
                ? "text-[#7A00F5] border-[#7A00F5]"
                : "text-[#625F5F] border-transparent"
            }`}
            onClick={() => updateSelected(index)}
          >
            {tab}
          </p>
        ))}
      </div>

      {selected === 0 && <SRC20HoldersInfo holders={holders} />}
      {selected === 1 && (
        <SRC20TX
          txs={transfers}
          type="TRANSFER"
          fetchMoreData={fetchMoreTransfers}
        />
      )}
      {selected === 2 && (
        <SRC20TX txs={mints} type="MINT" fetchMoreData={fetchMoreMints} />
      )}
    </>
  );
}
