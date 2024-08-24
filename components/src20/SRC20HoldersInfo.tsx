import { Chart } from "$fresh_charts/mod.ts";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";
import { abbreviateAddress, stripTrailingZeros } from "utils/util.ts";

interface HoldersInfoProps {
  holders: {}[];
}
export const SRC20HoldersInfo = (props: HoldersInfoProps) => {
  const { holders } = props;

  return (
    <div class="mx-auto w-full flex flex-col md:flex-row space-between">
      <div class="flex flex-col gap-2 items-center w-full text-white">
        <div class="relative shadow-md sm:rounded-lg w-full">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead class="table-fixed bg-[#2B0E49] text-lg font-semibold uppercase text-[#C184FF] border-b border-[#B9B9B9]">
              <tr class="w-full table table-fixed">
                <th scope="col" class="px-6 py-3">address</th>
                <th scope="col" class="px-6 py-3">amount</th>
                <th scope="col" class="px-6 py-3">%</th>
              </tr>
            </thead>
            <tbody class="table-fixed overflow-x-auto max-h-80 block">
              {holders?.map((src20) => {
                return (
                  <tr class="w-full table table-fixed bg-[#2B0E49] text-xs text-[#F5F5F5] border-b border-[#B9B9B9]">
                    <td class="px-6 py-4">
                      <span class="address-hover" title={src20.address}>
                        {abbreviateAddress(src20.address)}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      {stripTrailingZeros(src20.amt)}
                    </td>
                    <td class="px-6 py-4">
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
