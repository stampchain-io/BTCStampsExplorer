import { convertToEmoji } from "utils/util.ts";

export const TickInfo = ({
  deployment,
  mint_status,
  total_holders,
}) => {
  if (
    !deployment ||
    !mint_status ||
    !total_holders
  ) {
    return null;
  }

  deployment = deployment[0];
  return (
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg flex flex-col md:flex-row gap-4 items-center justify-center">
      <img
        src={`/content/${deployment.tx_hash}.svg`}
        class="w-full h-full md:w-20 md:h-20"
      />
      <table class="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-400 uppercase">
        <tbody>
          <tr class="border-b">
            <th scope="row" class="whitespace-nowrap px-6 py-3">Tick</th>
            <td class="whitespace-nowrap">{convertToEmoji(deployment.tick)}</td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">Block</th>
            <td class="whitespace-nowrap">
              {deployment.block_index}
            </td>
            <th scope="row" class="px-6 py-3">Time</th>
            <td class="whitespace-nowrap">
              {new Date(deployment.block_time).toLocaleString("default", {
                month: "short",
                year: "numeric",
              })}
            </td>
          </tr>
          <tr>
            <th scope="row" class="whitespace-nowrap px-6 py-3">
              Total Supply
            </th>
            <td class="whitespace-nowrap">
              {deployment.max}
            </td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">
              Total Holders
            </th>
            <td class="whitespace-nowrap">
              {total_holders}
            </td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">
              Total minted
            </th>
            <td class="whitespace-nowrap">
              {mint_status.progress}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TickInfo;
