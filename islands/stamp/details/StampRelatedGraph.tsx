import StampHolders from "$components/stampDetails/StampHolders.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

interface Holder {
  address: string | null;
  quantity: number;
}

interface StampRelatedGraphProps {
  holders: Holder[];
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
      <td className="pr-3 tablet:pr-6 py-2 tablet:py-4">
        <a href={`/wallet/${holder.address}`}>
          {holder.address ? abbreviateAddress(holder.address) : "Unknown"}
        </a>
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {holder.quantity}
      </td>
      <td className="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
        {holderPercent}%
      </td>
    </tr>
  );
}

export function StampRelatedGraph({ holders }: StampRelatedGraphProps) {
  const totalHolders = holders.length;
  const totalQuantity = holders.reduce(
    (sum, holder) => sum + holder.quantity,
    0,
  );

  return (
    <div className="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
      <div className="absolute top-6 right-6 text-center">
        <p className="text-stamp-text-secondary font-light uppercase">
          HOLDERS
        </p>
        <p className="text-stamp-text-primary font-light uppercase tablet:text-[32px]">
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col items-center tablet:flex-row w-full gap-6">
        <div className="mt-5 tablet:mt-0">
          <StampHolders holders={holders} />
        </div>
        <div className="relative shadow-md w-full max-w-full mt-6 tablet:mt-20">
          <div className="max-h-96 overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-stamp-text-secondary mobileLg:rounded-lg">
              <thead className="text-lg uppercase">
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      className={`${
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
