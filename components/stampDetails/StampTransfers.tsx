import { abbreviateAddress } from "$lib/utils/util.ts";
import dayjs from "$dayjs/";

interface SendRow {
  source: string;
  destination: string;
  quantity: number;
  memo: string;
  tx_hash: string;
  block_time: number;
  is_btc_stamp: boolean;
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

function TransferRow({ send }: { send: SendRow }) {
  const kind = send.is_btc_stamp
    ? "stamp"
    : (send.cpid && send.cpid.startsWith("A"))
    ? "cursed"
    : "named";

  return (
    <tr key={send.tx_hash}>
      <td className="pr-3 tablet:pr-6 py-2 tablet:py-4">
        {send.source ? abbreviateAddress(send.source) : "NULL"}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4">
        {send.destination ? abbreviateAddress(send.destination) : "NULL"}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {send.quantity}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {send.memo || "transfer"}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {abbreviateAddress(send.tx_hash)}
      </td>
      <td className="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
        {dayjs(send.block_time).fromNow()}
      </td>
    </tr>
  );
}

export function StampTransfers({ sends }: StampTransfersProps) {
  return (
    <div className="relative shadow-md max-w-[256px]">
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-[#666666] mobileLg:rounded-lg">
          <thead className="text-lg uppercase">
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className={`${
                    key === "from"
                      ? "pr-6"
                      : key === "created"
                      ? "pl-6"
                      : "px-6"
                  } py-3 font-light`}
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
