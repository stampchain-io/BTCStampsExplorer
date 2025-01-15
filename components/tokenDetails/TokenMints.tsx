import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { SRC20Row } from "$globals";
import { row, tableLabel, tableValue } from "$components/shared/types.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";

interface TokenMintsProps {
  mints: SRC20Row[];
}

export function TokenMints({ mints }: TokenMintsProps) {
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
                <th class={`${tableLabel} text-left`}>AMOUNT</th>
                <th class={`${tableLabel} text-center`}>ADDRESS</th>
                <th class={`${tableLabel} text-center`}>DATE</th>
                <th class={`${tableLabel} text-center`}>TX HASH</th>
                <th class={`${tableLabel} text-right`}>BLOCK</th>
              </tr>
            </thead>
            <tbody>
              {mints?.map((mint) => (
                <tr key={mint.tx_hash} class={row}>
                  <td class="text-left">{mint.amt}</td>
                  <td class="text-center">
                    {abbreviateAddress(mint.destination)}
                  </td>
                  <td class="text-center">
                    {formatDate(new Date(mint.block_time))}
                  </td>
                  <td class="text-center">{abbreviateAddress(mint.tx_hash)}</td>
                  <td class="text-right">{mint.block_index}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
