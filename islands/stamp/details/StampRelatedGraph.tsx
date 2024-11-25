import { useEffect, useState } from "preact/hooks";
import StampHolders from "$components/stampDetails/StampHolders.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

interface Holder {
  address: string | null;
  quantity: number;
}

interface StampRelatedGraphProps {
  stampId: string;
  initialHolders?: Holder[];
}

const tableHeaders = [
  { key: "address", label: "Address" },
  { key: "amount", label: "Amount" },
  { key: "percent", label: "Percent" },
];

function HolderRow(
  { holder, totalQuantity }: { holder: Holder; totalQuantity: number },
) {
  const holderPercent = ((holder.quantity / totalQuantity) * 100).toFixed(2);

  return (
    <tr>
      <td class="pr-3 tablet:pr-6 py-2 tablet:py-4">
        <a href={`/wallet/${holder.address}`}>
          {holder.address ? abbreviateAddress(holder.address) : "Unknown"}
        </a>
      </td>
      <td class="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {holder.quantity}
      </td>
      <td class="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
        {holderPercent}%
      </td>
    </tr>
  );
}

export function StampRelatedGraph(
  { stampId, initialHolders = [] }: StampRelatedGraphProps,
) {
  const [holders, setHolders] = useState<Holder[]>(initialHolders);
  const [isLoading, setIsLoading] = useState(!initialHolders.length);

  useEffect(() => {
    const fetchHolders = async () => {
      if (holders.length > 0) return;

      setIsLoading(true);
      try {
        console.log("Fetching holders for stamp:", stampId);
        const response = await fetch(`/api/v2/stamps/${stampId}/holders`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Holders data received:", data);
        if (data.data) {
          setHolders(data.data);
        } else {
          console.warn("No holders data in response:", data);
        }
      } catch (error) {
        console.error("Error fetching holders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (stampId) {
      console.log("Starting holders fetch for stampId:", stampId);
      fetchHolders();
    } else {
      console.warn("No stampId provided for holders fetch");
    }
  }, [stampId]);

  useEffect(() => {
    console.log("Current holders:", holders);
    console.log("Is loading:", isLoading);
  }, [holders, isLoading]);

  if (isLoading) {
    return (
      <div class="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
        <div class="text-center py-10">Loading holders data...</div>
      </div>
    );
  }

  if (!holders.length) {
    return (
      <div class="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
        <div class="text-center py-10">No holder data available</div>
      </div>
    );
  }

  const totalHolders = holders.length;
  const totalQuantity = holders.reduce(
    (sum, holder) => sum + holder.quantity,
    0,
  );

  return (
    <div class="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
      <div class="absolute top-6 right-6 text-center">
        <p class="text-stamp-text-secondary font-light uppercase">
          HOLDERS
        </p>
        <p class="text-stamp-text-primary font-light uppercase tablet:text-[32px]">
          {totalHolders}
        </p>
      </div>
      <div class="flex flex-col items-center tablet:flex-row w-full gap-6">
        <div class="mt-5 tablet:mt-0">
          <StampHolders holders={holders} />
        </div>
        <div class="relative shadow-md w-full max-w-full mt-6 tablet:mt-20">
          <div class="max-h-96 overflow-x-auto">
            <table class="w-full text-sm text-left rtl:text-right text-stamp-text-secondary mobileLg:rounded-lg">
              <thead class="text-lg uppercase">
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      class={`${
                        key === "address"
                          ? "pr-3 tablet:pr-6"
                          : key === "percent"
                          ? "pl-3 tablet:pl-6"
                          : "px-3 tablet:px-6"
                      } py-1 tablet:py-3 font-light`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holders.map((holder, index) => (
                  <HolderRow
                    key={index}
                    holder={holder}
                    totalQuantity={totalQuantity}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
