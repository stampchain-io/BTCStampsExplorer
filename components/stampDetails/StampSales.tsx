import {
  abbreviateAddress,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "../shared/ScrollContainer.tsx";

interface Dispense {
  source: string;
  destination: string;
  dispense_quantity: number;
  satoshirate: number;
  confirmed: boolean;
  close_block_index: number;
}

interface StampSalesProps {
  dispenses: Dispense[];
}

const tableHeaders = [
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "quantity", label: "Quantity" },
  { key: "price", label: "Price" },
  { key: "confirmed", label: "Confirmed" },
];

const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";
const row = "h-8 hover:bg-stamp-purple/10";

function DispenseRow({ dispense }: { dispense: Dispense }) {
  const handleClick = (e: MouseEvent, address: string) => {
    e.preventDefault();
    globalThis.location.href = `/wallet/${address}`;
  };

  return (
    <tr class={row}>
      <td className="text-left">
        <a
          href={`/wallet/${dispense.source}`}
          onClick={(e) => handleClick(e, dispense.source)}
          className="hover:text-stamp-purple-bright cursor-pointer"
        >
          <span className="tablet:hidden">
            {abbreviateAddress(dispense.source, 4)}
          </span>
          <span className="hidden tablet:inline">
            {abbreviateAddress(dispense.source, 6)}
          </span>
        </a>
      </td>
      <td className="text-center">
        <a
          href={`/wallet/${dispense.destination}`}
          onClick={(e) => handleClick(e, dispense.destination)}
          className="hover:text-stamp-purple-bright cursor-pointer"
        >
          <span className="tablet:hidden">
            {abbreviateAddress(dispense.destination, 4)}
          </span>
          <span className="hidden tablet:inline">
            {abbreviateAddress(dispense.destination, 6)}
          </span>
        </a>
      </td>
      <td className="text-center">
        {dispense.dispense_quantity}
      </td>
      <td className="text-center">
        {formatSatoshisToBTC(dispense.satoshirate)}
      </td>
      <td className="text-right">
        {dispense.confirmed ? "YES" : "NO"}
      </td>
    </tr>
  );
}

export function StampSales({ dispenses }: StampSalesProps) {
  return (
    <div class="relative w-full">
      <ScrollContainer class="max-h-48">
        <div class="w-[480px] min-[480px]:w-full">
          <table className={tableValue}>
            <colgroup>
              <col className="w-[20%]" /> {/* From column */}
              <col className="w-[20%]" /> {/* To */}
              <col className="w-[20%]" /> {/* Quantity */}
              <col className="w-[20%]" /> {/* Price */}
              <col className="w-[20%]" /> {/* Confirmed */}
            </colgroup>
            <thead>
              <tr>
                {tableHeaders.map(({ key, label }) => (
                  <th
                    key={key}
                    scope="col"
                    class={`${tableLabel} pb-1.5 ${
                      key === "from"
                        ? "text-left"
                        : key === "confirmed"
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
              {dispenses.map((dispense, index) => (
                <DispenseRow key={index} dispense={dispense} />
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
