import { abbreviateAddress } from "utils/util.ts";

export function StampVaults(
  { vaults }: {
    vaults: {
      source: string;
      destination: string;
      dispense_quantity: number;
      satoshirate: number;
    }[];
  },
) {
  return (
    <div className="relative shadow-md max-w-256">
      <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Vaults ({vaults.length})
      </p>
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
          <thead className="text-lg font-semibold uppercase text-[#C184FF] bg-[#2B0E49] border-b border-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3">
                Image
              </th>
              <th scope="col" className="px-6 py-3">
                Details
              </th>
              <th scope="col" className="px-6 py-3">
                Quantity
              </th>
              <th scope="col" className="px-6 py-3">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {vaults.map((vault, index) => (
              <tr
                className="odd:bg-gray-900 even:bg-gray-800"
                key={index}
              >
                <td className="px-6 py-4">
                  {abbreviateAddress(vault.source)}
                </td>
                <td className="px-6 py-4">
                  {abbreviateAddress(vault.destination)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {vault.dispense_quantity}
                </td>
                <td className="px-6 py-4 text-sm">{vault.satoshirate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
