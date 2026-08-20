/* ===== HOLDERS TABLE COMPONENT ===== */
import { colGroup } from "$components/layout/types.ts";
import {
  cellCenterL2Detail,
  cellLeftL2Detail,
  cellRightL2Detail,
  container2,
  ScrollContainer,
} from "$layout";
import { abbreviateAddress } from "$lib/utils/ui/formatting/formatUtils.ts";
import { labelXxs, textXs } from "$text";
import type { HoldersTableProps } from "$types/ui.d.ts";
import { useEffect, useMemo, useState } from "preact/hooks";

/* ===== TYPES ===== */
// Import HolderRow from wallet types
import type { HolderRow } from "$types/wallet.d.ts";

// Transform HolderRow to match expected shape
interface Holder {
  address: string | null;
  amt: number | string;
  percentage: number | string;
}

/* ===== CONSTANTS ===== */
const PAGE_SIZE = 20;

/* ===== COMPONENT ===== */
const HoldersTableBase = (
  { holders }: HoldersTableProps,
) => {
  // Transform HolderRow[] to Holder[] - memoized to prevent recreation on every render
  const safeHolders: Holder[] = useMemo(
    () =>
      (holders ?? []).map((h: HolderRow) => ({
        address: h.address,
        amt: h.amt ?? h.quantity ?? 0,
        percentage: h.percentage ?? 0,
      })),
    [holders],
  );

  /* ===== STATE ===== */
  const [data, setData] = useState<Holder[]>(safeHolders.slice(0, PAGE_SIZE));
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const headers = ["ADDRESS", "AMOUNT", "PERCENT"];
  const totalCounts = safeHolders.length;

  /* ===== DATA HANDLERS ===== */
  const fetchData = (nextPage: number) => {
    if (!hasMore) return;
    setIsLoading(true);
    setData((prevData: Holder[]) => [
      ...prevData,
      ...safeHolders.slice((nextPage - 1) * PAGE_SIZE, nextPage * PAGE_SIZE),
    ]);
    setIsLoading(false);
  };

  /* ===== EVENT HANDLERS ===== */
  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    const scrollPosition = target.scrollTop + target.clientHeight;
    const scrollThreshold = target.scrollHeight - 20;
    console.log(
      scrollPosition >= scrollThreshold,
      !isLoading,
      hasMore,
    );
    if (
      scrollPosition >= scrollThreshold &&
      !isLoading &&
      hasMore
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  /* ===== EFFECTS ===== */
  useEffect(() => {
    setHasMore(totalCounts > data.length);
  }, [data]);

  /* ===== RENDER ===== */
  return (
    <div class="w-full">
      <ScrollContainer
        class="min-h-[72px] max-h-[296px] w-full scrollbar-background-layer1"
        onScroll={handleScroll}
      >
        <div class="overflow-x-clip overflow-y-clip tablet:overflow-x-clip flow-root scrollbar-hide">
          <table
            class={`w-full -my-2 border-separate border-spacing-y-2 ${textXs}`}
          >
            {/* ===== TABLE STRUCTURE ===== */}
            <colgroup>
              {colGroup([
                { width: "min-w-[200px] w-auto" }, // ADDRESS
                { width: "min-w-[80px] w-auto" }, // AMOUNT
                { width: "min-w-[80px] w-auto" }, // PERCENT
              ]).map((col) => (
                <col
                  key={col.key}
                  class={col.className}
                />
              ))}
            </colgroup>

            {/* ===== TABLE HEADER ===== */}
            <thead>
              <tr class={container2}>
                {headers.map((header, i) => {
                  const isFirst = i === 0;
                  const isLast = i === (headers?.length ?? 0) - 1;

                  // Apply row border classes for segmented styling
                  const rowClass = isFirst
                    ? cellLeftL2Detail
                    : isLast
                    ? cellRightL2Detail
                    : cellCenterL2Detail;

                  return (
                    <th
                      key={header}
                      scope="col"
                      class={`sticky top-0 z-10 !py-1.5 ${rowClass} ${labelXxs}`}
                    >
                      {header}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* ===== TABLE CONTENT ===== */}
            <tbody>
              {!isLoading && data.map((holder, index) => {
                if (!holder.address) {
                  return (
                    <tr
                      key={`unknown-${index}`}
                      class={`${container2} group`}
                    >
                      {/* ADDRESS */}
                      <td
                        class={cellLeftL2Detail}
                      >
                        UNKNOWN
                      </td>
                      {/* AMOUNT */}
                      <td
                        class={`${cellCenterL2Detail} text-color-primary-400`}
                      >
                        {Number(holder.amt).toLocaleString()}
                      </td>
                      {/* PERCENT */}
                      <td
                        class={cellRightL2Detail}
                      >
                        {holder.percentage}%
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={index}
                    class={`${container2} group`}
                  >
                    {/* ADDRESS */}
                    <td
                      class={cellLeftL2Detail}
                    >
                      <a
                        target="_top"
                        href={`/wallet/${holder.address}`}
                        className="link-neutral-200"
                      >
                        <span class="mobileLg:hidden">
                          {abbreviateAddress(holder.address, 8)}
                        </span>
                        <span class="hidden mobileLg:inline">
                          {holder.address}
                        </span>
                      </a>
                    </td>
                    {/* AMOUNT */}
                    <td
                      class={`${cellCenterL2Detail} text-color-primary-400`}
                    >
                      {Number(holder.amt).toLocaleString()}
                    </td>
                    {/* PERCENT */}
                    <td
                      class={cellRightL2Detail}
                    >
                      {holder.percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* ===== LOADING INDICATOR ===== */}
          {isLoading && (
            <div class="flex flex-col w-full mb-2 gap-2">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  class="loading-skeleton running w-full rounded-2xl h-[34px]"
                />
              ))}
            </div>
          )}
        </div>
      </ScrollContainer>
    </div>
  );
};

export default HoldersTableBase;
