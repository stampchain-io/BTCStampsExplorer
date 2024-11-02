import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { SRC20Balance } from "globals";

dayjs.extend(relativeTime);

type SRC20BalanceTableProps = {
  src20Balances: SRC20Balance[];
};

/**
 * Renders a table displaying SRC20 balances.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Array<SRC20Balance>} props.src20Balances - The array of SRC20 balances to display.
 * @returns {JSX.Element} The rendered SRC20BalanceTable component.
 */

export const SRC20BalanceTable = (props: SRC20BalanceTableProps) => {
  const { src20Balances } = props;

  return (
    <div class="relative overflow-x-auto shadow-md mobileLg:rounded-lg max-h-196">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <caption class="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
          SRC20 Balances for {src20Balances[0].address}
        </caption>
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {/* <th scope="col" class="px-6 py-3">address</th> */}
            <th scope="col" class="px-6 py-3">tick</th>
            <th scope="col" class="px-6 py-3">amount</th>
            <th scope="col" class="px-6 py-3">last update</th>
          </tr>
        </thead>
        <tbody>
          {src20Balances.map((src20: SRC20Balance) => {
            const tickValue = src20.tick.startsWith("\\u") &&
                !isNaN(parseInt(src20.tick.replace("\\u", "0x"), 16))
              ? String.fromCodePoint(
                parseInt(src20.tick.replace("\\u", "0x"), 16),
              )
              : src20.tick;

            return (
              <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                {
                  /* <td className="px-6 py-4">
                  {src20.address}
                </td> */
                }
                <td className="px-6 py-4">
                  {tickValue}
                </td>
                <td className="px-6 py-4 text-sm">
                  {Number(src20.amt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {dayjs(Number(src20.block_time)).fromNow()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
