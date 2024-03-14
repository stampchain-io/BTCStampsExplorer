import { useFeePolling } from "hooks/useFeePolling.tsx";

export const MempoolWeather = () => {
  const { fees, loading, progress, interval } = useFeePolling();

  const determineProgressColor = (progress) => {
    if (progress <= 33) return "bg-green-300";
    if (progress <= 66) return "bg-yellow-300";
    return "bg-red-300";
  };

  const determineWeatherIcon = (fee) => {
    if (fee < 25) {
      return "☀️";
    } else if (fee >= 25 && fee < 50) {
      return "⛅️";
    } else if (fee >= 50 && fee < 75) {
      return "🌥️";
    } else if (fee >= 75 && fee < 100) {
      return "🌧️";
    } else if (fee >= 100 && fee < 150) {
      return "🌦️";
    } else if (fee >= 150 && fee < 200) {
      return "🌩️";
    } else if (fee >= 200 && fee < 250) {
      return "❄️";
    } else if (fee >= 250 && fee < 300) {
      return "🌨️";
    } else if (fee >= 300 && fee < 350) {
      return "🌪️";
    } else {
      return "💥";
    }
  };

  const TableRowSkeleton = () => (
    <div class="animate-pulse flex space-x-2">
      <div class="rounded bg-gray-700 h-2 w-full"></div>
    </div>
  );

  return (
    <div
      style={{ marginTop: "-22px" }}
      class="flex flex-col p-1 w-full text-[11px] mb-4 text-white rounded-lg"
    >
      {/* <div class={`h-1.5 rounded flex-grow ${determineProgressColor(progress)}`} style={{ width: `${progress}%` }}></div> */}
      <div class="flex items-center">
        {loading
          ? (
            <div class="flex flex-col space-y-1 animate-pulse p-2 flex-grow">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          )
          : (
            <>
              <div class="text-3xl sm:text-4xl py-1 px-4">
                {!loading && determineWeatherIcon(fees._hourFee)}
              </div>
              <div class="flex-grow">
                <table class="min-w-full divide-y divide-gray-200">
                  <tbody>
                    <tr>
                      <th class="px-1 py-.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                        SPEED
                      </th>
                      <td class="px-1 py-.5 whitespace-nowrap">
                        <div class="flex items-center">🐢</div>
                      </td>
                      <td class="px-1 py-.5 whitespace-nowrap">
                        <div class="flex items-center">🐇</div>
                      </td>
                      <td class="px-1 py-.5 whitespace-nowrap">
                        <div class="flex items-center">🚀</div>
                      </td>
                      <td class="px-1 py-.5 whitespace-nowrap">
                        <div class="flex items-center uppercase justify-end">
                          Block
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th class="px-1 py-.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                        FEE (sat/vB)
                      </th>
                      <td class="px-1 py-.5 whitespace-nowrap">
                        {fees.economyFee}
                      </td>
                      <td class="px-1 py-.5 whitespace-nowrap">
                        {fees.fastestFee}
                      </td>
                      <td class="px-1 py-.5 whitespace-nowrap">
                        {fees.recomendedFee}
                      </td>
                      <td class="flex items-center px-1 py-.5 whitespace-nowrap justify-end">
                        {fees.block}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
      </div>
    </div>
  );
};
