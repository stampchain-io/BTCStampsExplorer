import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";

interface SendRow {
  source: string;
  destination: string;
  quantity: number;
  memo: string;
  tx_hash: string;
  block_time: number;
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
  { key: "txHash", label: "Tx hash" },
  { key: "created", label: "Created" },
];

const tableTextClassName =
  "w-full text-sm mobileLg:text-base text-stamp-grey-light font-light";
const dataLabelClassName =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";

function TransferRow({ send }: { send: SendRow }) {
  return (
    <tr key={send.tx_hash}>
      <td className="text-left w-full">
        {send.source ? abbreviateAddress(send.source) : "NULL"}
      </td>
      <td className="text-center">
        {send.destination ? abbreviateAddress(send.destination) : "NULL"}
      </td>
      <td className="text-center">
        {send.quantity}
      </td>
      <td className="text-center uppercase">
        {send.memo || "transfer"}
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
    <div className="relative max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table className={`${tableTextClassName} w-full table-fixed`}>
          <colgroup>
            <col className="w-[20%]" /> {/* From column */}
            <col className="w-[20%]" /> {/* To */}
            <col className="w-[20%]" /> {/* Quantity */}
            <col className="w-[20%]" /> {/* Memo */}
            <col className="w-[20%]" /> {/* Tx hash */}
            <col className="w-[20%]" /> {/* Created */}
          </colgroup>
          <thead>
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className={`${dataLabelClassName} ${
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
