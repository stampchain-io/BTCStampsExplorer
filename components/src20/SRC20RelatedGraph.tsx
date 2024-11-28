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
      <td class="text-left py-0">
        <a href={`/wallet/${holder.address}`}>
          {abbreviateAddress(holder.address)}
        </a>
      </td>
      <td class="text-center py-0">
        {holder.amt}
      </td>
      <td class="text-right py-0">
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
        <p className="text-base mobileLg:text-lg text-stamp-grey-darker font-light">
          HOLDERS
        </p>
        <p className="text-2xl mobileLg:text-3xl text-stamp-grey-light font-black -mt-1">
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col items-center tablet:flex-row w-full gap-6">
        <div className="mt-5 tablet:mt-0">
          <SRC20Holders holders={holders} />
        </div>
        <div className="relative shadow-md w-full max-w-full mt-6 tablet:mt-20">
          <div className="max-h-64 overflow-x-auto pr-3 mobileMd:pr-6">
            <table className="w-full text-sm mobileLg:text-base text-left rtl:text-right text-[#cccccc]">
              <thead className="text-base mobileLg:text-lg text-stamp-grey-darker font-light uppercase">
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      class={`py-0 mobileLg:py-1 font-light ${
                        key === "address"
                          ? "text-left"
                          : key === "percent"
                          ? "text-right"
                          : "text-center"
                      }`}
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
