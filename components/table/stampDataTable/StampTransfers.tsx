import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import { rowTable } from "$layout";
import { labelXs, valueDark, valueSm, valueSmLink } from "$text";

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

export function StampTransfersTable({ sends }: StampTransfersProps) {
  const headers = ["FROM", "TO", "QUANTITY", "TX HASH", "DATE"];

  return (
    <div class="w-[500px] min-[500px]:w-full">
      <table class={`${valueSm} w-full`}>
        <colgroup>
          {colGroup().map((col) => (
            <col key={col.key} className={col.className} />
          ))}
        </colgroup>
        {sends.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  class={`${labelXs} pb-1.5 ${cellAlign(i, headers.length)}`}
                >
                  {header}
                </th>
              ))}
              <th class="min-w-3 min-[660px]:hidden block" />
            </tr>
          </thead>
        )}
        <tbody>
          {sends.length
            ? sends?.map((send, index) => (
              <tr key={`${send.tx_hash}-${index}`} class={rowTable}>
                <td class={cellAlign(0, headers.length)}>
                  {send.source
                    ? (
                      <a
                        href={`/wallet/${send.source}`}
                        onClick={(e) => {
                          e.preventDefault();
                          globalThis.location.href = `/wallet/${send.source}`;
                        }}
                        className={valueSmLink}
                      >
                        <span className="tablet:hidden">
                          {abbreviateAddress(send.source, 4)}
                        </span>
                        <span className="hidden tablet:inline">
                          {abbreviateAddress(send.source, 6)}
                        </span>
                      </a>
                    )
                    : "N/A"}
                </td>
                <td class={cellAlign(1, headers.length)}>
                  {send.destination
                    ? (
                      <a
                        href={`/wallet/${send.destination}`}
                        onClick={(e) => {
                          e.preventDefault();
                          globalThis.location.href =
                            `/wallet/${send.destination}`;
                        }}
                        className={valueSmLink}
                      >
                        <span className="tablet:hidden">
                          {abbreviateAddress(send.destination, 4)}
                        </span>
                        <span className="hidden tablet:inline">
                          {abbreviateAddress(send.destination, 6)}
                        </span>
                      </a>
                    )
                    : "N/A"}
                </td>
                <td class={cellAlign(2, headers.length)}>
                  {send.quantity}
                </td>
                <td class={cellAlign(3, headers.length)}>
                  <a
                    href={`https://www.blockchain.com/explorer/transactions/btc/${send.tx_hash}`}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      globalThis.open(
                        `https://www.blockchain.com/explorer/transactions/btc/${send.tx_hash}`,
                        "_blank",
                      );
                    }}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(send.tx_hash, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(send.tx_hash, 6)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(4, headers.length)}>
                  {formatDate(
                    new Date(send.block_time),
                  )}
                </td>
              </tr>
            ))
            : (
              <tr>
                <td
                  class={`${valueDark} w-full`}
                >
                  NO TRANSFERS
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
