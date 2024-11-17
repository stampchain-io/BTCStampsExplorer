import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import SRC20Holders from "$components/src20/SRC20Holders.tsx";

interface Holder {
  address: string;
  amt: number;
  percentage: number;
}

interface SRC20RelatedGraphProps {
  holders: Holder[];
}

const tableHeaders = [
  { key: "address", label: "Address" },
  { key: "amount", label: "Amount" },
  { key: "percent", label: "Percent" },
];

function HolderRow({ holder }: { holder: Holder }) {
  return (
    <tr>
      <td className="pr-3 tablet:pr-6 py-2 tablet:py-4">
        <a href={`/wallet/${holder.address}`}>
          {abbreviateAddress(holder.address)}
        </a>
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {holder.amt}
      </td>
      <td className="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
        {holder.percentage}%
      </td>
    </tr>
  );
}

export function SRC20RelatedGraph({ holders }: SRC20RelatedGraphProps) {
  const totalHolders = holders.length;

  return (
    <div className="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
      <div className="absolute top-6 right-6 text-center">
        <p className="text-[#666666] font-light uppercase">
          HOLDERS
        </p>
        <p className="text-[#999999] font-light uppercase tablet:text-[32px]">
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col items-center tablet:flex-row w-full gap-6">
        <div className="mt-5 tablet:mt-0">
          <SRC20Holders holders={holders} />
        </div>
        <div className="relative shadow-md w-full max-w-full mt-6 tablet:mt-20">
          <div className="max-h-96 overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-[#666666] mobileLg:rounded-lg">
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
                  <HolderRow key={index} holder={holder} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
