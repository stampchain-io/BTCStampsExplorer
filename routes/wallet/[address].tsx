import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { StampCard } from "$components/StampCard.tsx";
import BtcAddressInfo from "$components/BtcAddressInfo.tsx";
import { SRC20BalanceTable } from "$components/SRC20BalanceTable.tsx";
import { Handlers } from "$fresh/server.ts";

type WalletPageProps = {
  data: {
    stamps: any[];
    src20: any[];
    btc: any;
  };
};

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    const { address } = ctx.params;
    const response = await Src20Controller.handleWalletBalanceRequest(address);
    const responseData = await response.json();

    const data = {
      data: responseData.data,
      page: 1,
      limit: 10,
      totalPages: 1,
      total: 1,
    };

    return await ctx.render(data);
  },
};

/**
 * Renders the wallet page with the provided data.
 *
 * @param {WalletPageProps} props - The props containing the data for the wallet page.
 * @returns {JSX.Element} The rendered wallet page.
 */

export default function Wallet(props: WalletPageProps) {
  const { stamps, src20, btc } = props.data.data;
  return (
    <div className="flex flex-col text-center w-full text-white gap-4">
      <div>
        <div>
          {btc && btc.address
            ? <BtcAddressInfo btc={btc} />
            : <p>No BTC at This Address</p>}
        </div>
        {src20 && src20.length > 0
          ? (
            <div className="max-h-[400px] overflow-auto">
              <SRC20BalanceTable src20Balances={src20} />
            </div>
          )
          : <p>No SRC-20 Tokens at This Address</p>}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 py-6 transition-opacity duration-700 ease-in-out max-h-[4096px] overflow-auto">
          {stamps && stamps.length > 0
            ? (
              stamps.sort((a, b) => a.stamp - b.stamp).map((stamp: any) => (
                <StampCard stamp={stamp} />
              ))
            )
            : <p>No Stamps at this Address</p>}
        </div>
      </div>
    </div>
  );
}
