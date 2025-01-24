import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { WalletData, WalletOverviewInfo } from "$lib/types/wallet.d.ts";
import { abbreviateAddress, formatBTCAmount } from "$lib/utils/formatUtils.ts";
import {
  alignmentClasses,
  type AlignmentType,
  buttonPurpleFlat,
  dataColumn,
  dataLabel,
  dataLabelSm,
  dataValue,
  dataValueLg,
  dataValueSm,
  dataValueXl,
  subTitleGrey,
  titleGreyDL,
  tooltipIcon,
  walletDataContainer,
} from "$components/shared/WalletStyles.ts";

interface WalletDispenserDetailsProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

export default function WalletDispenserDetails({
  walletData,
  stampsTotal,
  src20Total,
  stampsCreated,
  setShowItem,
}: WalletDispenserDetailsProps) {
  return (
    <div class="flex flex-col gap-3 mobileMd:gap-6">
      <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
        <div class="flex flex-col w-full tablet:w-1/2 dark-gradient rounded-lg p-3 mobileMd:p-6 space-y-1.5 mobileLg:space-y-3">
          <div class="flex">
            <p class={titleGreyDL}>DISPENSER</p>
          </div>
          <WalletOverview walletData={walletData} />
          <DispenserStats
            dispensers={walletData.dispensers}
            btcPrice={walletData.btcPrice}
            walletData={walletData}
          />
        </div>
      </div>
      <WalletStats
        stampsTotal={stampsTotal}
        src20Total={src20Total}
        stampsCreated={stampsCreated}
        setShowItem={setShowItem}
        walletData={walletData}
      />
    </div>
  );
}

function WalletOverview({ walletData }: { walletData: WalletOverviewInfo }) {
  // Same as WalletProfileDetails WalletOverview
  // Copy the entire WalletOverview component here
}

function DispenserStats({
  dispensers,
  btcPrice,
  walletData,
}: {
  dispensers: WalletOverviewInfo["dispensers"];
  btcPrice: number;
  walletData: WalletOverviewInfo;
}) {
  if (!walletData.address.startsWith("1D") && !walletData.dispensers?.total) {
    return null;
  }

  const firstDispenser = dispensers?.items?.[0];
  const stampData = firstDispenser?.stamp;

  if (!firstDispenser || !stampData) return null;

  const creatorDisplay = stampData.creator_name
    ? stampData.creator_name
    : abbreviateAddress(stampData.creator, 8);

  return (
    <div className="flex flex-col pt-6">
      {/* Stamp Info Section */}
      <div>
        <p className={`${dataValueLg} whitespace-nowrap overflow-hidden`}>
          <>
            <span className="font-light">STAMP #</span>
            <span className="font-black">{stampData.stamp}</span>
          </>
        </p>

        {stampData.cpid && (
          <p className="-mt-1 pb-1 text-base mobileLg:text-lg font-bold text-stamp-grey-darker block">
            {stampData.cpid}
          </p>
        )}

        <div className="flex flex-col items-start pt-1.5 mobileLg:pt-3">
          <p className={dataLabelSm}>BY</p>
          <a
            className="text-sm mobileLg:text-base font-black gray-gradient3-hover -mt-1"
            href={`/wallet/${stampData.creator}`}
            target="_parent"
          >
            {creatorDisplay}
          </a>
        </div>
      </div>

      {/* Dispenser Stats */}
      <div className="flex justify-between pt-6">
        <StatItem
          label="ESCROW"
          value={firstDispenser.escrow_quantity.toString()}
        />
        <StatItem
          label="GIVE"
          value={firstDispenser.give_quantity.toString()}
          align="center"
        />
        <StatItem
          label="REMAIN"
          value={firstDispenser.give_remaining.toString()}
          align="right"
        />
      </div>

      {/* Price Display */}
      <div className="flex flex-col justify-end pt-6">
        <StatTitle
          label={
            <>
              {((firstDispenser.satoshirate || 0) / 100000000 * btcPrice)
                .toFixed(2)} <span className="font-light">USD</span>
            </>
          }
          value={
            <>
              {formatBTCAmount((firstDispenser.satoshirate || 0) / 100000000, {
                excludeSuffix: true,
              })} <span className="font-extralight">BTC</span>
            </>
          }
          align="right"
        />
        <div className="flex justify-end pt-6">
          <button className={buttonPurpleFlat}>
            BUY
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | ComponentChildren;
  align?: AlignmentType;
  class?: string;
}

function StatItem(
  { label, value, align = "left", class: customClass }: StatItemProps,
) {
  const alignmentClass = alignmentClasses[align];

  return (
    <div class={`flex flex-col -space-y-1 ${customClass || ""}`}>
      <p class={`${dataLabelSm} ${alignmentClass}`}>
        {label}
      </p>
      <p class={`${dataValueSm} ${alignmentClass}`}>
        {value}
      </p>
    </div>
  );
}

interface StatTitleProps {
  label: string | ComponentChildren;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
}

function StatTitle({ label, value, align = "left" }: StatTitleProps) {
  const alignmentClass = alignmentClasses[align];

  return (
    <div class="flex flex-col -space-y-1">
      <p class={`${dataLabel} ${alignmentClass}`}>
        {label}
      </p>
      <p class={`${dataValueXl} ${alignmentClass}`}>
        {value}
      </p>
    </div>
  );
}

function WalletStats({
  stampsTotal,
  src20Total,
  stampsCreated,
  setShowItem,
  walletData,
}: {
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
  walletData: WalletOverviewInfo;
}) {
  return (
    <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
      <TokenStats
        src20Total={src20Total}
        setShowItem={setShowItem}
      />
      <StampStats
        stampsTotal={stampsTotal}
        stampsCreated={stampsCreated}
        setShowItem={setShowItem}
      />
    </div>
  );
}

function TokenStats({
  src20Total,
  setShowItem,
}: {
  src20Total: number;
  setShowItem: (type: string) => void;
}) {
  return (
    <div
      class={`${walletDataContainer} cursor-pointer hover:bg-[#ffffff05]`}
      onClick={() => setShowItem("src20")}
    >
      <StatTitle
        label="TOKENS"
        value={src20Total.toString()}
      />
    </div>
  );
}

function StampStats({
  stampsTotal,
  stampsCreated,
  setShowItem,
}: {
  stampsTotal: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}) {
  return (
    <div
      class={`${walletDataContainer} cursor-pointer hover:bg-[#ffffff05]`}
      onClick={() => setShowItem("stamps")}
    >
      <StatTitle
        label="STAMPS"
        value={stampsTotal.toString()}
      />
      {stampsCreated > 0 && (
        <div class="flex justify-end">
          <StatItem
            label="CREATED"
            value={stampsCreated.toString()}
            align="right"
          />
        </div>
      )}
    </div>
  );
}
