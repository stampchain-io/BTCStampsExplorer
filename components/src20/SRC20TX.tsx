import { short_address } from "utils/util.ts";

interface SRC20TXProps {
  txs: unknown[];
  total: number;
  type: "TRANSFER" | "MINT";
}

export const SRC20TX = (props: SRC20TXProps) => {
  const { txs, total, type } = props;
  if (type === "TRANSFER") {
    return (
      <div class="relative overflow-x-auto shadow-md sm:rounded-lg max-h-80 py-4 w-full">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <caption class="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
            Transfers
          </caption>
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-6 py-3">block</th>
              <th scope="col" class="px-6 py-3">from</th>
              <th scope="col" class="px-6 py-3">to</th>
              <th scope="col" class="px-6 py-3">amount</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => {
              return (
                <tr class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
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
      <div class="relative overflow-x-auto shadow-md sm:rounded-lg max-h-80 py-4 w-full">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <caption class="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
            Mints
          </caption>
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-6 py-3">block</th>
              <th scope="col" class="px-6 py-3">address</th>
              <th scope="col" class="px-6 py-3">amount</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => {
              return (
                <tr class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
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
