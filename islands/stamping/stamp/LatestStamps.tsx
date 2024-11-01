import { StampCard } from "$islands/stamp/StampCard.tsx";
import type { StampRow } from "globals";
import { useEffect, useState } from "preact/hooks";

interface LatestStampsProps {
  stamps: StampRow[];
}

export default function LatestStamps({ stamps }: LatestStampsProps) {
  const [displayCount, setDisplayCount] = useState(8);

  useEffect(() => {
    const updateDisplayCount = () => {
      const width = globalThis.innerWidth;
      if (width >= 1440) setDisplayCount(8);
      else if (width >= 1025) setDisplayCount(6);
      else if (width >= 769) setDisplayCount(8);
      else if (width >= 569) setDisplayCount(6);
      else if (width >= 420) setDisplayCount(6);
      else setDisplayCount(4);
    };

    updateDisplayCount();
    globalThis.addEventListener("resize", updateDisplayCount);
    return () => globalThis.removeEventListener("resize", updateDisplayCount);
  }, []);

  return (
    <div className="w-full md:w-1/2 flex flex-col gap-4 items-start md:items-end">
      <h1 className="bg-text-purple-4 bg-clip-text text-fill-transparent text-3xl md:text-6xl font-black">
        LATEST STAMPS
      </h1>

      <div className="grid w-full gap-4
                    grid-cols-2                    /* Default: 2 columns x 2 rows = 4 */
                    mobile-sm:grid-cols-3          /* 420px+: 3 columns x 2 rows = 6 */
                    mobile-md:grid-cols-3          /* 569px+: 3 columns x 2 rows = 6 */
                    mobile-lg:grid-cols-4          /* 769px+: 4 columns x 2 rows = 8 */
                    tablet:grid-cols-3             /* 1025px+: 3 columns x 2 rows = 6 */
                    desktop:grid-cols-4            /* 1440px+: 4 columns x 2 rows = 8 */
                    grid-rows-2                    /* Always 2 rows */
      ">
        {stamps.slice(0, displayCount).map((stamp) => (
          <StampCard
            key={stamp.cpid}
            stamp={stamp}
            kind="stamp"
            isRecentSale={false}
            showInfo={false}
          />
        ))}
      </div>

      <div className="w-full flex justify-end items-end">
        <a
          href="/stamps"
          className="text-stamp-purple-dark hover:text-stamp-primary-hover 
                     text-sm md:text-base font-extrabold border-2 
                     border-stamp-purple-dark hover:border-stamp-primary-hover 
                     py-1 text-center min-w-[120px] rounded-md cursor-pointer 
                     transition-colors duration-200"
        >
          View All
        </a>
      </div>
    </div>
  );
}
