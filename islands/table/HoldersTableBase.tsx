/* ===== SRC20 HOLDER TABLE COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { ScrollContainer } from "$layout";
import {
  cellAlign,
  colGroup,
  row,
  tableLabel,
  tableValue,
  tableValueLink,
  textLoader,
} from "$table";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

/* ===== TYPES ===== */
interface Holder {
  address: string | null;
  amt: number;
  percentage: number;
}

interface HoldersTableBaseProps {
  holders?: Holder[];
}

/* ===== CONSTANTS ===== */
const PAGE_SIZE = 20;

/* ===== COMPONENT ===== */
const HoldersTableBase = (
  { holders = [] }: HoldersTableBaseProps,
) => {
  /* ===== STATE ===== */
  const [data, setData] = useState<Holder[]>(holders.slice(0, PAGE_SIZE) || []);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const headers = ["ADDRESS", "AMOUNT", "PERCENT"];
  const totalCounts = holders.length;

  /* ===== DATA HANDLERS ===== */
  const fetchData = (nextPage: number) => {
    if (!hasMore) return;
    setIsLoading(true);
    setData((prevData: Holder[]) => [
      ...prevData,
      ...holders.slice((nextPage - 1) * PAGE_SIZE, nextPage * PAGE_SIZE),
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
    <ScrollContainer
      class="h-48 mobileLg:h-64 mt-3 mobileMd:mt-6 w-full"
      onScroll={handleScroll}
    >
      <table className={tableValue}>
        {/* ===== TABLE STRUCTURE ===== */}
        <colgroup>
          {colGroup([
            { width: "w-[50%]" },
            { width: "w-[25%]" },
            { width: "w-[25%]" },
          ]).map((col) => (
            <col
              key={col.key}
              className={col.className}
            />
          ))}
        </colgroup>

        {/* ===== TABLE HEADER ===== */}
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                scope="col"
                class={`${tableLabel} ${cellAlign(i, headers.length)}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        {/* ===== TABLE CONTENT ===== */}
        <tbody className={tableValue}>
          {!isLoading && data.map((holder, index) => {
            if (!holder.address) {
              return (
                <tr className={row}>
                  <td class={cellAlign(0, headers.length)}>UNKNOWN</td>
                  <td class={cellAlign(1, headers.length)}>
                    {holder.amt}
                  </td>
                  <td class={cellAlign(2, headers.length)}>
                    {holder.percentage}%
                  </td>
                </tr>
              );
            }

            return (
              <tr key={index} className={row}>
                <td class={cellAlign(0, headers.length)}>
                  <a
                    target="_top"
                    href={`/wallet/${holder.address}`}
                    className={tableValueLink}
                  >
                    <span className="mobileLg:hidden">
                      {abbreviateAddress(holder.address, 8)}
                    </span>
                    <span className="hidden mobileLg:inline">
                      {holder.address}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(1, headers.length)}>
                  {holder.amt}
                </td>
                <td class={cellAlign(2, headers.length)}>
                  {holder.percentage}%
                </td>
              </tr>
            );
          })}

          {/* ===== LOADING INDICATOR ===== */}
          {isLoading && (
            <tr colSpan={3}>
              <td colSpan={3}>
                <div class={textLoader}>
                  <span>L</span>
                  <span>O</span>
                  <span>A</span>
                  <span>D</span>
                  <span>I</span>
                  <span>N</span>
                  <span>G</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ScrollContainer>
  );
};

export default HoldersTableBase;
