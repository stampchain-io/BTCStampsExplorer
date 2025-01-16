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
                  <td class="text-left">{abbreviateAddress(send.creator)}</td>
                  <td class="text-center">
                    {abbreviateAddress(send.destination)}
                  </td>
                  <td class="text-center">{send.amt}</td>
                  <td class="text-center">
                    {formatDate(new Date(send.block_time))}
                  </td>
                  <td class="text-right">{abbreviateAddress(send.tx_hash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
