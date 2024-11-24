import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import WalletSendModal from "$islands/Wallet/details/WalletSendModal.tsx";
import WalletReceiveModal from "$islands/Wallet/details/WalletReceiveModal.tsx";
import {
  WalletData,
  WalletOverviewInfo,
  WalletStatsProps,
} from "$lib/types/index.d.ts";
import { Button } from "$components/shared/Button.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

function WalletDetails(
  { walletData, stampsTotal, src20Total, stampsCreated, setShowItem }: {
    walletData: WalletData;
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    setShowItem: (type: string) => void;
  },
) {
  const [fee, setFee] = useState<number>(walletData.fee || 0);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  return (
    <div>
      <div class="flex flex-col gap-3 mobileMd:gap-6 items-stretch">
        <WalletOverview
          walletData={{ ...walletData, fee }}
          onSend={() => setIsSendModalOpen(true)}
          onReceive={() => setIsReceiveModalOpen(true)}
        />
        <WalletStats
          setShowItem={setShowItem}
          stampsTotal={stampsTotal}
          src20Total={src20Total}
          stampsCreated={stampsCreated}
          dispensers={walletData.dispensers}
        />
      </div>

      {isSendModalOpen && (
        <WalletSendModal
          fee={fee}
          handleChangeFee={setFee}
          onClose={() => setIsSendModalOpen(false)}
        />
      )}

      {isReceiveModalOpen && (
        <WalletReceiveModal
          onClose={() => setIsReceiveModalOpen(false)}
          address={walletData.address}
        />
      )}
    </div>
  );
}

function WalletOverview(
  { walletData, onSend, onReceive }: {
    walletData: WalletOverviewInfo;
    onSend: () => void;
    onReceive: () => void;
  },
) {
  const [hideBalance, setHideBalance] = useState<boolean>(false);

  const copy = async () => {
    if (!hideBalance) {
      await navigator.clipboard.writeText(walletData.address);
    }
  };

  return (
    <div class="w-full dark-gradient flex flex-col justify-between p-6">
      <div class="flex justify-between">
        <div class={`${hideBalance ? "blur-sm" : ""}`}>
          <p class="text-stamp-grey-light font-extralight text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl select-none">
            <span class="font-bold">
              {hideBalance ? "*********" : walletData.balance}
            </span>{" "}
            BTC
          </p>
          <p class="text-stamp-grey font-extralight text-base mobileMd:text-lg mobileLg:text-xl desktop:text-2xl select-none pt-[3px]">
            <span class="font-medium">
              {hideBalance ? "*****" : walletData.usdValue.toLocaleString()}
            </span>{" "}
            USD
          </p>
        </div>
        <button class="" onClick={() => setHideBalance(!hideBalance)}>
          {hideBalance
            ? (
              <img
                src="/img/wallet/icon-unhide-balance.svg"
                class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px]"
                alt="Show balance"
              />
            )
            : (
              <img
                src="/img/wallet/icon-hide-balance.svg"
                class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px]"
                alt="Hide balance"
              />
            )}
        </button>
      </div>
      <div class="flex justify-between pt-3">
        <div class="flex items-center">
          <p class="text-stamp-primary font-medium select-none text-base mobileLg:text-lg desktop:text-xl hidden mobileLg:block">
            {walletData.address}
          </p>
          <p class="text-stamp-primary font-medium select-none text-base mobileLg:text-lg desktop:text-xl block mobileLg:hidden">
            {abbreviateAddress(walletData.address, 8)}
          </p>
        </div>
        <div class="flex gap-[9px] mobileLg:gap-3">
          <Button
            variant="wallet"
            icon="/img/wallet/icon-copy.svg"
            iconAlt="Copy"
            class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px]"
            onClick={copy}
          />
          <Button
            variant="wallet"
            icon="/img/wallet/icon-arrow-square-out.svg"
            iconAlt="Send"
            class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px]"
            onClick={onSend}
          />
          <Button
            variant="wallet"
            icon="/img/wallet/icon-arrow-square-in.svg"
            iconAlt="Receive"
            class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px]"
            onClick={onReceive}
          />
          <a
            href={`https://mempool.space/address/${walletData.address}`}
            target="_blank"
          >
            <Button
              variant="wallet"
              icon="/img/wallet/icon-history.svg"
              iconAlt="History"
              class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px]"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

function WalletStats(
  {
    stampsTotal,
    src20Total,
    stampsCreated,
    dispensers,
    setShowItem = () => {},
  }: WalletStatsProps,
) {
  const handleType = (type: string) => {
    setShowItem(type);
  };

  return (
    <div class="w-full flex flex-col tablet:flex-row gap-3 mobileMd:gap-6">
      <StampStats
        stampsTotal={stampsTotal}
        stampsCreated={stampsCreated}
        handleType={handleType}
      />
      <DispenserStats dispensers={dispensers} handleType={handleType} />
      <TokenStats src20Total={src20Total} handleType={handleType} />
    </div>
  );
}

function StampStats(
  { stampsTotal, stampsCreated, handleType }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
  },
) {
  return (
    <div
      class="w-full dark-gradient p-6 flex flex-col gap-6 rounded-md"
      onClick={() => handleType("stamp")}
    >
      <div class="flex justify-between">
        <StatItem label="STAMPS" value={stampsTotal.toString()} />
        <StatItem
          label="BY ME"
          value={stampsCreated.toString()}
          align="right"
        />
      </div>
    </div>
  );
}

function DispenserStats(
  { handleType, dispensers = { open: 0, closed: 0, total: 0 } }: {
    handleType: (type: string) => void;
    dispensers?: { open: number; closed: number; total: number };
  },
) {
  return (
    <div
      class="flex flex-col w-full dark-gradient p-6 gap-6 rounded-md"
      onClick={() => handleType("dispenser")}
    >
      <div class="flex justify-between">
        <StatItem
          label="LISTINGS"
          value={dispensers.open.toString()}
          align="left"
        />
        <div class="hidden mobileMd:block">
          <StatItem label="ATOMIC" value="N/A" align="center" />
        </div>
        <StatItem
          label="SOLD"
          value={dispensers.closed.toString()}
          align="right"
        />
      </div>
    </div>
  );
}

function TokenStats(
  { src20Total, handleType }: {
    src20Total: number;
    handleType: (type: string) => void;
  },
) {
  return (
    <div
      class="flex justify-between w-full dark-gradient p-6 gap-6 rounded-md"
      onClick={() => handleType("token")}
    >
      <StatItem label="TOKENS" value={src20Total.toString()} />
      <StatItem
        label="VALUE"
        value={
          <>
            <span class="font-light">
              N/A
            </span>&nbsp;<span class="font-extralight">BTC</span>
          </>
        }
        align="right"
      />
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
}

function StatItem({ label, value, align = "left" }: StatItemProps) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div>
      <p
        class={`text-base mobileLg:text-lg desktop:text-xl font-light text-stamp-grey-darker ${alignmentClass}`}
      >
        {label}
      </p>
      <p
        class={`text-2xl mobileLg:text-3xl desktop:text-4xl font-black text-stamp-grey-light ${alignmentClass}`}
      >
        {value}
      </p>
    </div>
  );
}

export default WalletDetails;
