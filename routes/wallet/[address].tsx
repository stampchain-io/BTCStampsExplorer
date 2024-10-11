import { Src20Controller } from "$lib/controller/src20Controller.ts";

import BtcAddressInfo from "$components/BtcAddressInfo.tsx";
import { SRC20BalanceTable } from "$components/SRC20BalanceTable.tsx";

import { Handlers } from "$fresh/server.ts";

import { StampCard } from "$islands/stamp/StampCard.tsx";
import WalletHeader from "$islands/Wallet/details/WalletHeader.tsx";
import WalletDetails from "$islands/Wallet/details/WalletDetails.tsx";
import WalletContent from "$islands/Wallet/details/WalletContent.tsx";

import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";

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

export default function Wallet(props: WalletPageProps) {
  const { stamps, src20, btc } = props.data.data;
  const { selectedTab, address } = props.data;

  const filterBy: STAMP_FILTER_TYPES[] = [];
  const sortBy = "DESC";
  const type: STAMP_TYPES = "all";

  return (
    <div class="flex flex-col gap-8">
      <WalletHeader
        filterBy={filterBy}
        sortBy={sortBy}
        selectedTab={selectedTab}
        address={address}
        type={type}
      />
      <WalletDetails />
      <WalletContent stamps={stamps} src20={src20} />
    </div>
  );
}
