import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import {
  generateColGroup,
  row,
  tableLabel,
  tableValue,
} from "$components/shared/types.ts";

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

export function StampTransfers({ sends }: StampTransfersProps) {
  return (
    <div class="relative w-full">
      <ScrollContainer>
        <div class="w-[500px] min-[500px]:w-full">
          <table class={tableValue}>
            <colgroup>
              {generateColGroup().map((col) => (
                <col key={col.key} className={col.className} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th class={`${tableLabel} text-left`}>FROM</th>
                <th class={`${tableLabel} text-center`}>TO</th>
                <th class={`${tableLabel} text-center`}>QUANTITY</th>
                <th class={`${tableLabel} text-center`}>TX HASH</th>
                <th class={`${tableLabel} text-right`}>DATE</th>
              </tr>
            </thead>
            <tbody>
              {sends?.map((send, index) => (
                <tr key={`${send.tx_hash}-${index}`} class={row}>
                  <td class="text-left">
                    {send.source
                      ? (
                        <a
                          href={`/wallet/${send.source}`}
                          onClick={(e) => {
                            e.preventDefault();
                            globalThis.location.href = `/wallet/${send.source}`;
                          }}
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
                      : "N/A"}
                  </td>
                  <td class="text-center">
                    {send.destination
                      ? (
                        <a
                          href={`/wallet/${send.destination}`}
                          onClick={(e) => {
                            e.preventDefault();
                            globalThis.location.href =
                              `/wallet/${send.destination}`;
                          }}
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
                      : "N/A"}
                  </td>
                  <td class="text-center">{send.quantity}</td>
                  <td class="text-center">
                    <span class="tablet:hidden">
                      {abbreviateAddress(send.tx_hash, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(send.tx_hash, 6)}
                    </span>
                  </td>
                  <td class="text-right">
                    {formatDate(new Date(send.block_time))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
