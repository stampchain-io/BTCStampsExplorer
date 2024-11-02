import { abbreviateAddress } from "$lib/utils/util.ts";

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
      {
        /* <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Vaults ({vaults.length})
      </p> */
      }
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 mobileLg:rounded-lg">
          <thead className="text-lg font-semibold uppercase">
            <tr>
              <th scope="col" className="pr-6 py-3">
                Image
              </th>
              <th scope="col" className="px-6 py-3">
                Details
              </th>
              <th scope="col" className="px-6 py-3">
                Quantity
              </th>
              <th scope="col" className="pl-6 py-3">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {vaults.map((vault, index) => (
              <tr
                key={index}
              >
                <td className="pr-3 tablet:pr-6 py-2 tablet:py-4">
                  {abbreviateAddress(vault.source)}
                </td>
                <td className="px-3 tablet:px-6 py-2 tablet:py-4">
                  {abbreviateAddress(vault.destination)}
                </td>
                <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
                  {vault.dispense_quantity}
                </td>
                <td className="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
                  {vault.satoshirate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
