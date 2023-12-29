import { api_get_balance } from "$lib/controller/wallet.ts";
import { StampCard } from "$components/StampCard.tsx";
import BtcAddressInfo from "$components/BtcAddressInfo.tsx";
import { SRC20BalanceTable } from "$components/SRC20BalanceTable.tsx";


type WalletPageProps = {
  params: {
    stamps: any[];
    src20: any[];
    btc: any;
  };
};

export const handler: Handlers<any> = {
  async GET(req: Request, ctx: HandlerContext) {
    const { address } = ctx.params;
    const { stamps, src20, btc } = await api_get_balance(address);
    const data = {
      stamps,
      src20,
      btc,
    }
    return await ctx.render(data);
  },
};

export default function Wallet(props: WalletPageProps) {
  const { stamps, src20, btc } = props.data;

  return (
    <div class="flex flex-col text-center w-full text-white gap-4">
      <div>
        <div>
          <BtcAddressInfo btc={btc} />
        </div>
        <div class="max-h-[400px] overflow-auto">
          <SRC20BalanceTable src20Balances={src20} />
        </div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 py-6 transition-opacity duration-700 ease-in-out max-h-[600px] overflow-auto">
          {
            stamps.sort((a, b) => a.stamp - b.stamp).map((stamp: any) => (
              <StampCard stamp={stamp} />
            ))
          }
        </div>
      </div>

    </div>
  )
};