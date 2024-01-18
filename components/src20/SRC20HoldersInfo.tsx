import { Chart } from "$fresh_charts/mod.ts";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";
import { short_address } from "utils/util.ts";

interface HoldersInfoProps {
  holders: {}[];
  total_holders: number;
  total_mints: number;
}
export const SRC20HoldersInfo = (props: HoldersInfoProps) => {
  const { holders, total_holders, total_mints, total_sends } = props;
  const labels = holders.map((holder) => holder.percentage);

  return (
    <div class="mx-auto w-full p-4 flex flex-col md:flex-row space-between">
      <div class="flex flex-col gap-2 items-center w-full text-white">
        <div class="flex flex-col gap-2 items-center w-full">
          <div class="text-3xl font-bold text-center">
            {total_holders}
          </div>
          <div class="text-xl font-bold text-center">
            Total Holders
          </div>
        </div>
        <Chart
          type="pie"
          width={350}
          options={{
            responsive: true,
            devicePixelRatio: 1,
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
          data={{
            datasets: [{
              label: "Holders",
              data: labels,
              borderColor: transparentize("#fefefe", 0.9),
              backgroundColor: [
                transparentize(ChartColors.Red, 0.6),
                transparentize(ChartColors.Orange, 0.6),
                transparentize(ChartColors.Yellow, 0.6),
                transparentize(ChartColors.Green, 0.6),
                transparentize(ChartColors.Blue, 0.6),
              ],
              borderWidth: 1,
            }],
          }}
        />
      </div>

      <div class="flex flex-col gap-2 items-center w-full text-white">
        <div class="flex flex-row text-center items-center w-full">
          <div class="flex flex-col gap-2 items-center w-full">
            <div class="text-3xl font-bold text-center">
              {total_mints}
            </div>
            <div class="text-xl font-bold text-center">
              Total Mints
            </div>
          </div>
          <div class="flex flex-col gap-2 items-center w-full">
            <div class="text-3xl font-bold text-center">
              {total_sends}
            </div>
            <div class="text-xl font-bold text-center">
              Total Sends
            </div>
          </div>
          <div class="flex flex-col gap-2 items-center w-full">
            <div class="text-3xl font-bold text-center">
              {total_sends + total_mints}
            </div>
            <div class="text-xl font-bold text-center">
              TXs
            </div>
          </div>
        </div>
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg max-h-80 py-4 w-full">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <caption class="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
              Holders
            </caption>
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" class="px-6 py-3">address</th>
                <th scope="col" class="px-6 py-3">amount</th>
                <th scope="col" class="px-6 py-3">%</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((src20) => {
                return (
                  <tr class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                    <td class="px-6 py-4">
                      {short_address(src20.address)}
                    </td>
                    <td class="px-6 py-4">
                      {src20.amt}
                    </td>
                    <td class="px-6 py-4 text-sm">
                      {src20.percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
