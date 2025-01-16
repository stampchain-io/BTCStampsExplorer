import {
  generateColGroup,
  getCellAlignment,
  row,
  tableLabel,
  tableValue,
} from "$components/shared/types.ts";
import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import { SRC20Row } from "$globals";

interface TokenTransfersProps {
  sends: SRC20Row[];
}

export function TokenTransfers({ sends }: TokenTransfersProps) {
  const headers = ["FROM", "TO", "AMOUNT", "DATE", "TX HASH"];

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
                {headers.map((header, i) => (
                  <th
                    key={i}
                    class={`${tableLabel} ${
                      getCellAlignment(i, headers.length)
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sends?.map((send) => (
                <tr key={send.tx_hash} class={row}>
                  <td class={getCellAlignment(0, headers.length)}>
                    <a
                      href={`/wallet/${send.creator}`}
                      onClick={(e) => {
                        e.preventDefault();
                        globalThis.location.href = `/wallet/${send.creator}`;
                      }}
                      className="hover:text-stamp-purple-bright cursor-pointer"
                    >
                      <span class="tablet:hidden">
                        {abbreviateAddress(send.creator, 4)}
                      </span>
                      <span class="hidden tablet:inline">
                        {abbreviateAddress(send.creator, 8)}
                      </span>
                    </a>
                  </td>
                  <td class={getCellAlignment(1, headers.length)}>
                    <a
                      href={`/wallet/${send.destination}`}
                      onClick={(e) => {
                        e.preventDefault();
                        globalThis.location.href =
                          `/wallet/${send.destination}`;
                      }}
                      className="hover:text-stamp-purple-bright cursor-pointer"
                    >
                      <span class="tablet:hidden">
                        {abbreviateAddress(send.destination, 4)}
                      </span>
                      <span class="hidden tablet:inline">
                        {abbreviateAddress(send.destination, 8)}
                      </span>
                    </a>
                  </td>
                  <td class={getCellAlignment(2, headers.length)}>
                    {send.amt}
                  </td>
                  <td class={getCellAlignment(3, headers.length)}>
                    {formatDate(new Date(send.block_time))}
                  </td>
                  <td class={getCellAlignment(4, headers.length)}>
                    <span class="tablet:hidden">
                      {abbreviateAddress(send.tx_hash, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(send.tx_hash, 8)}
                    </span>
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
