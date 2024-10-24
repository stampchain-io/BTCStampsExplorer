import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { Handlers } from "$fresh/server.ts";

import WalletHeader from "$islands/Wallet/details/WalletHeader.tsx";
import WalletDetails from "$islands/Wallet/details/WalletDetails.tsx";
import WalletContent from "$islands/Wallet/details/WalletContent.tsx";

import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";
import { WalletData } from "$lib/types/index.d.ts";

type WalletPageProps = {
  data: {
    data: {
      stamps: any[];
      src20: any[];
    };
    selectedTab: string;
    address: string;
    walletData: WalletData;
    stampsTotal: number;
    src20Total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      total: number;
    };
  };
};

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { address } = ctx.params;

    const url = new URL(_req.url);
    const { page, limit } = getPaginationParams(url);
    const selectedTab = url.searchParams.get("ident") || "my_items";

    const responseData = await Src20Controller.handleWalletBalanceRequest(
      address,
      limit,
      page,
    );

    const data = {
      ...responseData,
      selectedTab,
    };

    return ctx.render(data);
  },
};

export default function Wallet(props: WalletPageProps) {
  const { data } = props;
  const { stamps, src20 } = data.data;
  const {
    selectedTab,
    address,
    btc,
    pagination,
  } = data;

  const filterBy: STAMP_FILTER_TYPES[] = [];
  const sortBy = "DESC";
  const type: STAMP_TYPES = "all";
  const stampsTotal = stamps.length;
  const src20Total = src20.length;
  const { page, limit, totalPages, total } = pagination;
  const stampsCreated =
    stamps.filter((stamp) => stamp.creator === address).length;
  const showItem: string = "stamp";
  // const [showItem, setShowItem] = useState<string>("stamp");

  const handleShowItem = (itemType: string) => {
    console.log(itemType);
  };

  return (
    <div class="flex flex-col gap-8">
      <WalletHeader
        filterBy={filterBy}
        sortBy={sortBy}
        selectedTab={selectedTab}
        address={address}
        type={type}
      />
      <WalletDetails
        walletData={btc}
        stampsTotal={stampsTotal}
        src20Total={src20Total}
        stampsCreated={stampsCreated}
        setShowItem={handleShowItem}
      />
      <WalletContent
        stamps={stamps}
        src20={src20}
        page={page}
        limit={limit}
        totalPages={totalPages}
        total={total}
        address={address}
        showItem={showItem}
      />
    </div>
  );
}
