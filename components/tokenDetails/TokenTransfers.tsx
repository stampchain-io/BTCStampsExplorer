import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { SRC20Row } from "$globals";
import { row, tableLabel, tableValue } from "$components/shared/types.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";

interface TokenTransfersProps {
  sends: SRC20Row[];
}

export function TokenTransfers({ sends }: TokenTransfersProps) {
  return (
    <div class="relative w-full">
      <ScrollContainer>
        <div class="w-[480px] min-[480px]:w-full">
          <table class={tableValue}>
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr>
                <th class={`${tableLabel} text-left`}>FROM</th>
                <th class={`${tableLabel} text-center`}>TO</th>
                <th class={`${tableLabel} text-center`}>AMOUNT</th>
                <th class={`${tableLabel} text-center`}>DATE</th>
                <th class={`${tableLabel} text-right`}>TX HASH</th>
              </tr>
            </thead>
            <tbody>
              {sends?.map((send) => (
                <tr key={send.tx_hash} class={row}>
                  <td class="text-left">
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
                  <td class="text-center">
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
                  <td class="text-center">{send.amt}</td>
                  <td class="text-center">
                    {formatDate(new Date(send.block_time))}
                  </td>
                  <td class="text-right">
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
