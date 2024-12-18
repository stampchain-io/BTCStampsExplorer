import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";

interface SendRow {
  source: string;
  destination: string;
  quantity: number;
  memo: string;
  tx_hash: string;
  block_time: string; // Changed from number to string
  cpid?: string;
}

interface StampTransfersProps {
  sends: SendRow[];
}

const tableHeaders = [
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "quantity", label: "Quantity" },
  { key: "memo", label: "Memo" },
  { key: "txHash", label: "Tx Hash" },
  { key: "created", label: "Date" },
];

const tableLabelClassName =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValueClassName =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";

function TransferRow({ send }: { send: SendRow }) {
  return (
    <tr key={send.tx_hash}>
      <td className="text-left py-0">
        {send.source
          ? (
            <>
              <span className="tablet:hidden">
                {abbreviateAddress(send.source, 4)}
              </span>
              <span className="hidden tablet:inline">
                {abbreviateAddress(send.source, 6)}
              </span>
            </>
          )
          : "NULL"}
      </td>
      <td className="text-center py-0">
        {send.destination
          ? (
            <>
              <span className="tablet:hidden">
                {abbreviateAddress(send.destination, 4)}
              </span>
              <span className="hidden tablet:inline">
                {abbreviateAddress(send.destination, 6)}
              </span>
            </>
          )
          : "NULL"}
      </td>
      <td className="text-center py-0">
        {send.quantity}
      </td>
      <td className="text-center uppercase py-0">
        {send.memo || "transfer"}
      </td>
      <td className="text-center py-0">
        {abbreviateAddress(send.tx_hash)}
      </td>
      <td className="text-right uppercase py-0">
        {formatDate(new Date(send.block_time), {
          includeRelative: false,
        })}
      </td>
    </tr>
  );
}

export function StampTransfers({ sends }: StampTransfersProps) {
  return (
    <div className="relative max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table className={`${tableValueClassName} w-full table-fixed`}>
          <colgroup>
            <col className="w-[18%]" /> {/* From column */}
            <col className="w-[18%]" /> {/* To */}
            <col className="w-[10%]" /> {/* Quantity */}
            <col className="w-[18%]" /> {/* Memo */}
            <col className="w-[18%]" /> {/* Tx hash */}
            <col className="w-[18%]" /> {/* Created */}
          </colgroup>
          <thead>
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  class={`${tableLabelClassName} pb-1.5 ${
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
    </div>
  );
}
