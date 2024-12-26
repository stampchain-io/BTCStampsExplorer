import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "../shared/ScrollContainer.tsx";

interface SendRow {
  source: string;
  destination: string;
  quantity: number;
  tx_hash: string;
  block_time: string;
  cpid?: string;
}

interface StampTransfersProps {
  sends: SendRow[];
}

const tableHeaders = [
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "quantity", label: "Quantity" },
  { key: "txHash", label: "Tx Hash" },
  { key: "created", label: "Date" },
];

const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";
const row = "h-8 hover:bg-stamp-purple/10";

function TransferRow({ send }: { send: SendRow }) {
  const handleClick = (e: MouseEvent, address: string) => {
    e.preventDefault();
    window.location.href = `/wallet/${address}`;
  };

  return (
    <tr key={send.tx_hash} class={row}>
      <td className="text-left">
        {send.source
          ? (
            <a
              href={`/wallet/${send.source}`}
              onClick={(e) => handleClick(e, send.source)}
              className="hover:text-stamp-purple-bright cursor-pointer"
            >
              <span className="tablet:hidden">
                {abbreviateAddress(send.source, 4)}
              </span>
              <span className="hidden tablet:inline">
                {abbreviateAddress(send.source, 6)}
              </span>
            </a>
          )
          : "NULL"}
      </td>
      <td className="text-center">
        {send.destination
          ? (
            <a
              href={`/wallet/${send.destination}`}
              onClick={(e) => handleClick(e, send.destination)}
              className="hover:text-stamp-purple-bright cursor-pointer"
            >
              <span className="tablet:hidden">
                {abbreviateAddress(send.destination, 4)}
              </span>
              <span className="hidden tablet:inline">
                {abbreviateAddress(send.destination, 6)}
              </span>
            </a>
          )
          : "NULL"}
      </td>
      <td className="text-center">
        {send.quantity}
      </td>
      <td className="text-center">
        {abbreviateAddress(send.tx_hash)}
      </td>
      <td className="text-right uppercase">
        {formatDate(new Date(send.block_time), {
          includeRelative: false,
        })}
      </td>
    </tr>
  );
}

export function StampTransfers({ sends }: StampTransfersProps) {
  return (
    <div class="relative w-full">
      <ScrollContainer class="max-h-48">
        <div class="w-[480px] min-[480px]:w-full">
          <table class={tableValue}>
            <colgroup>
              <col className="w-[20%]" /> {/* From column */}
              <col className="w-[20%]" /> {/* To */}
              <col className="w-[20%]" /> {/* Quantity */}
              <col className="w-[20%]" /> {/* Tx hash */}
              <col className="w-[20%]" /> {/* Created */}
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
                        : key === "created"
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
              {sends.map((send) => (
                <TransferRow
                  key={send.tx_hash}
                  send={send}
                />
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
