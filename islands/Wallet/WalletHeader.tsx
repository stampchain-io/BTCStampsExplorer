import { useNavigator } from "$islands/Navigator/navigator.tsx";

export const WalletHeader = ({
  selectedTab,
  address,
}: {
  selectedTab: string;
  address: string;
}) => {
  const { setTypeOption } = useNavigator();

  return (
    <div class="flex flex-col gap-3">
      <div className="flex justify-between">
        <div class="flex gap-4">
          <img
            src="/img/mock.png"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `/not-available.png`;
            }}
            alt="collection image"
            class="h-24 w-24 object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
          />
          <div class="flex flex-col justify-between">
            <p class="font-semibold text-[18px] text-white flex gap-2 items-center">
              <img src="/img/icon_btc.png" className="w-5 h-5" alt="" />
              <span className="hidden md:block">
                bc1p2dds1a421xvf53e2dcx6vxcg423sl64r
              </span>
              <span className="block md:hidden">bc1p2.....sl64r</span>
              <img
                src="/img/icon_copy_to_clipboard.png"
                className="w-4 h-4"
                alt=""
              />
            </p>
            <p class="font-semibold text-[26px] text-white">
              0.1326342 BTC
            </p>
          </div>
        </div>
        <div className="w-[137px] hidden md:block">
          <div className="flex justify-between items-center">
            <p className="text-[#B9B9B9] text-[14px]">Display name</p>
            <img src="/img/wallet/icon-edit.svg" alt="" />
          </div>
          <p className="text-[18px] text-[#F5F5F5] mb-[19px]">NameHere</p>
          <div className="flex justify-between items-center">
            <p className="text-[#B9B9B9] text-[14px]">X (Twitter)</p>
            <img src="/img/wallet/icon-edit.svg" alt="" />
          </div>
          <p className="text-[18px] text-[#F5F5F5]">NameHere</p>
        </div>
      </div>
      <div class="flex gap-6 md:gap-8 items-end overflow-auto">
        <p
          class={selectedTab === "my_items"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("wallet/" + address, "my_items")}
        >
          My Items
        </p>
        <p
          class={selectedTab === "stamps"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("wallet/" + address, "stamps")}
        >
          STAMPS
        </p>
        <p
          class={selectedTab === "src20"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("wallet/" + address, "src20")}
        >
          Src20
        </p>
        <p
          class={selectedTab === "src721"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("wallet/" + address, "src721")}
        >
          Src721
        </p>
        <p
          class={selectedTab === "transactions"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("wallet/" + address, "transactions")}
        >
          Transactions
        </p>
        <p
          class={selectedTab === "history"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("wallet/" + address, "history")}
        >
          History
        </p>
      </div>
    </div>
  );
};
