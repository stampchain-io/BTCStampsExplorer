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
          <p class="font-semibold text-xl text-white">Collection 1</p>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex gap-4">
              <div>
                <p class="text-sm text-[#B9B9B9]">FLOOR</p>
                <p class="text-lg font-semibold text-white">
                  0.00018{" "}
                  <span class="text-sm font-normal text-[#B9B9B9]">BTC</span>
                </p>
              </div>
              <div>
                <p class="text-sm text-[#B9B9B9]">TOTAL VOL</p>
                <p class="text-lg font-semibold text-white">
                  0.0019{" "}
                  <span class="text-sm font-normal text-[#B9B9B9]">BTC</span>
                </p>
              </div>
            </div>
            <div class="flex gap-4">
              <div>
                <p class="text-sm text-[#B9B9B9]">OWNERS</p>
                <p class="text-lg font-semibold text-white">1.1K</p>
              </div>
              <div>
                <p class="text-sm text-[#B9B9B9]">LISTED</p>
                <p class="text-lg font-semibold text-white">41</p>
              </div>
              <div>
                <p class="text-sm text-[#B9B9B9]">TOTAL SUPLY</p>
                <p class="text-lg font-semibold text-white">21K</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-6 md:gap-8 items-end">
        <p
          class={
            selectedTab === "my_items"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"
          }
          onClick={() => setTypeOption("wallet/" + address, "my_items")}
        >
          My Items
        </p>
        <p
          class={
            selectedTab === "stamps"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"
          }
          onClick={() => setTypeOption("wallet/" + address, "stamps")}
        >
          STAMPS
        </p>
        <p
          class={
            selectedTab === "src20"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"
          }
          onClick={() => setTypeOption("wallet/" + address, "src20")}
        >
          Src20
        </p>
        <p
          class={
            selectedTab === "src721"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"
          }
          onClick={() => setTypeOption("wallet/" + address, "src721")}
        >
          Src721
        </p>
        <p
          class={
            selectedTab === "transactions"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"
          }
          onClick={() => setTypeOption("wallet/" + address, "transactions")}
        >
          Transactions
        </p>
        <p
          class={
            selectedTab === "history"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"
          }
          onClick={() => setTypeOption("wallet/" + address, "history")}
        >
          History
        </p>
      </div>
    </div>
  );
};
