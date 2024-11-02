import { abbreviateAddress, stripTrailingZeros } from "$lib/utils/util.ts";

type SRC20HoldersInfoProps = {
  holders: any[];
};

export function SRC20HoldersInfo(props: SRC20HoldersInfoProps) {
  const { holders } = props;

  return (
    <div class="relative shadow-md mobileLg:rounded-lg w-full overflow-y-auto max-h-[600px]">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500">
        <thead class="table-fixed text-lg font-semibold uppercase text-[#C184FF] border-b border-[#B9B9B9]">
          <tr class="w-full table table-fixed">
            <th scope="col" class="px-6 py-3">address</th>
            <th scope="col" class="px-6 py-3">amount</th>
            <th scope="col" class="px-6 py-3">% of total</th>
          </tr>
        </thead>
        <tbody class="table-fixed">
          {holders.map((holder) => (
            <tr
              key={holder.address}
              class="w-full table table-fixed text-xs text-[#F5F5F5] border-b border-[#B9B9B9]"
            >
              <td class="px-6 py-4">{abbreviateAddress(holder.address)}</td>
              <td class="px-6 py-4">{stripTrailingZeros(holder.amt)}</td>
              <td class="px-6 py-4">{holder.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
