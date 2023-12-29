import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);


type SRC20BalanceTableProps = {
  src20Balances: SRC20Balance[];
};

export const SRC20BalanceTable = (props: SRC20BalanceTableProps) => {
  const { src20Balances } = props;

  return (
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg max-h-96">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <caption class="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
          SRC20 Balances
        </caption>
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">address</th>
            <th scope="col" class="px-6 py-3">tick</th>
            <th scope="col" class="px-6 py-3">amount</th>
            <th scope="col" class="px-6 py-3">last update</th>
          </tr>
        </thead>
        <tbody>
          {src20Balances.map((src20: SRC20Balance) => {
            return (
              <tr class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                <td class="px-6 py-4">
                  {src20.address}
                </td>
                <td class="px-6 py-4">
                  {src20.tick}
                </td>
                <td class="px-6 py-4">
                  {Number(src20.amt).toFixed(4)}
                </td>
                <td class="px-6 py-4 text-sm">
                  {dayjs(Number(src20.block_time)).fromNow()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )
}