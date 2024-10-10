import { Src20Controller } from "$lib/controller/src20Controller.ts";

import BtcAddressInfo from "$components/BtcAddressInfo.tsx";
import { SRC20BalanceTable } from "$components/SRC20BalanceTable.tsx";

import { Handlers } from "$fresh/server.ts";

import { StampCard } from "$islands/stamp/StampCard.tsx";
import WalletHeader from "$islands/Wallet/details/WalletHeader.tsx";
import WalletDetails from "$islands/Wallet/details/WalletDetails.tsx";
import WalletContent from "$islands/Wallet/details/WalletContent.tsx";

type WalletPageProps = {
  data: {
    data: {
      stamps: any[];
      src20: any[];
      btc: any;
    };
    selectedTab: string;
    address: string;
  };
};

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    const url = new URL(req.url);
    const selectedTab = url.searchParams.get("ident") || "my_items";

    const { address } = ctx.params;
    const responseData = await Src20Controller.handleWalletBalanceRequest(
      address,
    );

    const data = {
      data: responseData.data,
      page: 1,
      limit: 10,
      totalPages: 1,
      total: 1,
      selectedTab: selectedTab,
      address: address,
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
  const { selectedTab, address } = props.data;
  return (
    <div class="flex flex-col gap-8">
      <WalletHeader selectedTab={selectedTab} address={address} />
      <WalletDetails />
      <WalletContent />
    </div>
  );
}
