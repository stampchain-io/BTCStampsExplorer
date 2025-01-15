import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { SRC20Row } from "$globals";
import { TABLE_STYLES } from "$components/shared/types.ts";

interface TokenMintsProps {
  mints: SRC20Row[];
}

export function TokenMints({ mints }: TokenMintsProps) {
  return (
    <table class="w-full">
      <thead>
        <tr>
          <th class={TABLE_STYLES.header}>AMOUNT</th>
          <th class={TABLE_STYLES.header}>ADDRESS</th>
          <th class={TABLE_STYLES.header}>DATE</th>
          <th class={TABLE_STYLES.header}>TX HASH</th>
          <th class={TABLE_STYLES.header}>BLOCK</th>
        </tr>
      </thead>
      <tbody>
        {mints?.map((mint) => (
          <tr key={mint.tx_hash} class={TABLE_STYLES.row}>
            <td class={TABLE_STYLES.cell}>{mint.amt}</td>
            <td class={TABLE_STYLES.cell}>
              {abbreviateAddress(mint.destination)}
            </td>
            <td class={TABLE_STYLES.cell}>
              {formatDate(new Date(mint.block_time))}
            </td>
            <td class={TABLE_STYLES.cell}>
              <span
                class="cursor-pointer hover:text-white"
                onClick={() => navigator.clipboard.writeText(mint.tx_hash)}
              >
                {abbreviateAddress(mint.tx_hash)}
              </span>
            </td>
            <td class={TABLE_STYLES.cell}>{mint.block_index}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
