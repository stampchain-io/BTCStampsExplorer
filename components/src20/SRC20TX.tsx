import { short_address } from "utils/util.ts";

interface SRC20TXProps {
  txs: unknown[];
  type: "TRANSFER" | "MINT";
}

export const SRC20TX = (props: SRC20TXProps) => {
  const { txs, type } = props;
  if (type === "TRANSFER") {
    return (
      <div class="relative shadow-md sm:rounded-lg w-full">
        <table class="text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="table-fixed bg-[#2B0E49] text-lg font-semibold uppercase text-[#C184FF] border-b border-[#B9B9B9]">
            <tr class="w-full table table-fixed">
              <th scope="col" class="px-6 py-3">block</th>
              <th scope="col" class="px-6 py-3">from</th>
              <th scope="col" class="px-6 py-3">to</th>
              <th scope="col" class="px-6 py-3">amount</th>
            </tr>
          </thead>
          <tbody class="table-fixed overflow-x-auto max-h-80 block">
            {txs.map((tx) => {
              return (
                <tr class="w-full table table-fixed bg-[#2B0E49] text-xs text-[#F5F5F5] border-b border-[#B9B9B9]">
                  <td class="px-6 py-4">
                    {tx.block_index}
                  </td>
                  <td class="px-6 py-4">
                    {short_address(tx.creator)}
                  </td>
                  <td class="px-6 py-4">
                    {short_address(tx.destination)}
                  </td>
                  <td class="px-6 py-4">
                    {tx.amt}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  if (type === "MINT") {
    return (
      <div class="relative shadow-md sm:rounded-lg w-full">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="table-fixed bg-[#2B0E49] text-lg font-semibold uppercase text-[#C184FF] border-b border-[#B9B9B9]">
            <tr class="w-full table table-fixed">
              <th scope="col" class="px-6 py-3">block</th>
              <th scope="col" class="px-6 py-3">address</th>
              <th scope="col" class="px-6 py-3">amount</th>
            </tr>
          </thead>
          <tbody class="table-fixed overflow-x-auto max-h-80 block">
            {txs.map((tx) => {
              return (
                <tr class="w-full table table-fixed bg-[#2B0E49] text-xs text-[#F5F5F5] border-b border-[#B9B9B9]">
                  <td class="px-6 py-4">
                    {tx.block_index}
                  </td>
                  <td class="px-6 py-4">
                    {short_address(tx.destination)}
                  </td>
                  <td class="px-6 py-4">
                    {tx.amt}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
};
