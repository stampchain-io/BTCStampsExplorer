import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { SRC20Row } from "$globals";
import { TABLE_STYLES } from "$components/shared/types.ts";

interface TokenTransfersProps {
  sends: SRC20Row[];
}

export function TokenTransfers({ sends }: TokenTransfersProps) {
  return (
    <table class="w-full">
      <thead>
        <tr>
          <th class={TABLE_STYLES.header}>FROM</th>
          <th class={TABLE_STYLES.header}>TO</th>
          <th class={TABLE_STYLES.header}>AMOUNT</th>
          <th class={TABLE_STYLES.header}>DATE</th>
          <th class={TABLE_STYLES.header}>TX HASH</th>
        </tr>
      </thead>
      <tbody>
        {sends?.map((send) => (
          <tr key={send.tx_hash} class={TABLE_STYLES.row}>
            <td class={TABLE_STYLES.cell}>{abbreviateAddress(send.creator)}</td>
            <td class={TABLE_STYLES.cell}>
              {abbreviateAddress(send.destination)}
            </td>
            <td class={TABLE_STYLES.cell}>{send.amt}</td>
            <td class={TABLE_STYLES.cell}>
              {formatDate(new Date(send.block_time))}
            </td>
            <td class={TABLE_STYLES.cell}>
              <span
                class="cursor-pointer hover:text-white"
                onClick={() => navigator.clipboard.writeText(send.tx_hash)}
              >
                {abbreviateAddress(send.tx_hash)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
