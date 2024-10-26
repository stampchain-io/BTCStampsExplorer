import {
  abbreviateAddress,
  formatDate,
  formatNumber,
} from "$lib/utils/util.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import { SRC20Row } from "globals";

type SRC20TXProps = {
  txs: SRC20Row[];
  type: "MINT" | "TRANSFER";
  fetchMoreData: (page: number) => Promise<SRC20Row[]>;
};

export function SRC20TX(props: SRC20TXProps) {
  const { txs, type, fetchMoreData } = props;
  const [data, setData] = useState<SRC20Row[]>(txs || []);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = async () => {
    if (!containerRef.current || isFetching || !hasMoreData) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      // User scrolled to the bottom
      setIsFetching(true);
      const nextPage = page + 1;
      const newData = await fetchMoreData(nextPage);

      if (newData && newData.length > 0) {
        setData((prevData) => [...prevData, ...newData]);
        setPage(nextPage);
      } else {
        setHasMoreData(false);
      }
      setIsFetching(false);
    }
  };

  useEffect(() => {
    // Reset data when txs prop changes
    setData(txs || []);
    setPage(1);
    setHasMoreData(true);
  }, [txs]);

  const tableHeaders = () => {
    if (type === "TRANSFER") {
      return (
        <tr class="w-full table table-fixed">
          <th scope="col" class="px-6 py-3">from</th>
          <th scope="col" class="px-6 py-3">to</th>
          <th scope="col" class="px-6 py-3">amount</th>
          <th scope="col" class="px-6 py-3">date</th>
        </tr>
      );
    } else if (type === "MINT") {
      return (
        <tr class="w-full table table-fixed">
          <th scope="col" class="px-6 py-3">block</th>
          <th scope="col" class="px-6 py-3">address</th>
          <th scope="col" class="px-6 py-3">amount</th>
        </tr>
      );
    }
    return null;
  };

  const renderRows = () => {
    return data.map((tx) => {
      // Ensure amt is a valid number
      let amtValue = Number(tx.amt);
      if (isNaN(amtValue)) {
        console.warn(`Invalid amount value: ${tx.amt}`);
        amtValue = 0;
      }

      // Format the amt value
      const formattedAmt = formatNumber(amtValue, 0);

      if (type === "TRANSFER") {
        return (
          <tr key={tx.tx_hash} class="w-full table table-fixed text-xs">
            <td class="px-3 py-2">{abbreviateAddress(tx.creator)}</td>
            <td class="px-3 py-2">{abbreviateAddress(tx.destination)}</td>
            <td class="px-3 py-2">{formattedAmt}</td>
            <td class="px-3 py-2">{formatDate(new Date(tx.block_time))}</td>
          </tr>
        );
      } else if (type === "MINT") {
        return (
          <tr key={tx.tx_hash} class="w-full table table-fixed text-xs">
            <td class="px-3 py-2">{tx.block_index}</td>
            <td class="px-3 py-2">{abbreviateAddress(tx.destination)}</td>
            <td class="px-3 py-2">{formattedAmt}</td>
          </tr>
        );
      }
      return null;
    });
  };

  return (
    <div
      class="relative shadow-md sm:rounded-lg w-full overflow-y-auto max-h-[250px]"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <table class="w-full text-sm text-left rtl:text-right">
        <thead class="table-fixed text-lg font-semibold uppercase text-[#666666]">
          {tableHeaders()}
        </thead>
        <tbody class="table-fixed text-[#999999]">{renderRows()}</tbody>
      </table>
      {isFetching && (
        <div class="flex justify-center items-center py-4 text-[#999999]">
          Loading more data...
        </div>
      )}
      {!hasMoreData && (
        <div class="flex justify-center items-center py-4 text-[#999999]">
          No more data to load.
        </div>
      )}
    </div>
  );
}
