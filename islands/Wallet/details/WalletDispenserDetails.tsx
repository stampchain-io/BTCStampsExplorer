import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { WalletOverviewInfo } from "$lib/types/wallet.d.ts";
import { abbreviateAddress, formatBTCAmount } from "$lib/utils/formatUtils.ts";
import StampImage from "$islands/stamp/details/StampImage.tsx";
import {
  alignmentClasses,
  type AlignmentType,
  buttonGreyOutline,
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
} from "$components/shared/WalletStyles.ts";
import { StampRow } from "$globals";

interface WalletDispenserDetailsProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

function StampStats({
  dispensers,
  walletData,
}: {
  dispensers: WalletOverviewInfo["dispensers"];
  walletData: WalletOverviewInfo;
}) {
  if (!walletData.address.startsWith("1D") && !walletData.dispensers?.total) {
    return null;
  }

  const firstDispenser = dispensers?.items?.[0];
  const stampData = firstDispenser?.stamp as StampRow;

  if (!firstDispenser || !stampData) return null;

  const creatorDisplay = stampData.creator_name
    ? stampData.creator_name
    : abbreviateAddress(stampData.creator, 8);

  const editionCount = stampData.divisible
    ? (stampData.supply / 100000000).toFixed(2)
    : stampData.supply > 100000
    ? "+100000"
    : stampData.supply.toFixed(2);

  return (
    <div class="flex flex-col gap-1.5 mobileMd:gap-3">
      <div class="flex pb-1.5 mobileMd:pb-3">
        <StatTitle
          label="STAMP"
          value={
            <>
              <span className="font-light">#</span>
              {stampData.stamp}
            </>
          }
          align="left"
        />
      </div>
      <div class="flex justify-between">
        <StatItem
          label="CPID"
          value={stampData.cpid}
        />
        <StatItem
          label="EDITIONS"
          value={editionCount.toString()}
          align="right"
        />
      </div>
      <div class="flex justify-between">
        <StatItem
          label="BY"
          value={creatorDisplay}
        />
        <StatItem
          label="PRICE"
          value={
            <>
              {formatBTCAmount(
                (firstDispenser.satoshirate || 0) / 100000000,
                {
                  excludeSuffix: true,
                },
              )} <span class="font-extralight">BTC</span>
            </>
          }
          align="right"
        />
      </div>
    </div>
  );
}

function DispenserStats({
  dispensers,
  btcPrice,
}: {
  dispensers: WalletOverviewInfo["dispensers"];
  btcPrice: number;
}) {
  const firstDispenser = dispensers?.items?.[0];
  if (!firstDispenser) return null;

  return (
    <div class="flex flex-col gap-3">
      {/* Dispenser Stats */}
      <div class="flex justify-between">
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
      <div class="flex justify-between">
        <div class="flex">
          <StatTitle
            label={
              <>
                {((firstDispenser.satoshirate || 0) / 100000000 * btcPrice)
                  .toFixed(2)} <span class="font-light">USD</span>
              </>
            }
            value={
              <>
                {formatBTCAmount(
                  (firstDispenser.satoshirate || 0) / 100000000,
                  {
                    excludeSuffix: true,
                  },
                )} <span class="font-extralight">BTC</span>
              </>
            }
            align="left"
          />
        </div>
        <div class="flex mt-auto">
          <button class={buttonGreyOutline}>
            BUY
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WalletDispenserDetails({
  walletData,
  stampsTotal,
  src20Total,
  stampsCreated,
  setShowItem,
}: WalletDispenserDetailsProps) {
  const firstDispenser = walletData.dispensers?.items?.[0];
  const stampData = firstDispenser?.stamp;

  return (
    <div class="flex flex-col tablet:flex-row gap-3 mobileMd:gap-6">
      <div class="flex flex-col w-full tablet:w-1/2 desktop:w-2/3">
        <div class="flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6 space-y-1.5 mobileLg:space-y-3">
          <div class="flex">
            <p class={titleGreyDL}>DISPENSER</p>
          </div>
          <WalletOverview walletData={walletData} />
          <DispenserStats
            dispensers={walletData.dispensers}
            btcPrice={walletData.btcPrice}
          />
        </div>
      </div>
      {stampData && (
        <div class="flex flex-col w-full tablet:w-1/2 desktop:w-1/3">
          <div class="flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6">
            <StampImage
              stamp={stampData}
              className="w-full h-full"
              flag={false}
            />
          </div>
          <div class="flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6 mt-3 mobileMd:mt-6">
            <StampStats
              dispensers={walletData.dispensers}
              walletData={walletData}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function WalletOverview({ walletData }: { walletData: WalletOverviewInfo }) {
  const [showCopied, setShowCopied] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const copyButtonRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyMouseEnter = () => {
    if (allowTooltip) {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = copyButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleCopyMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
    setShowCopied(false);
    setAllowTooltip(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(walletData.address);
      setShowCopied(true);
      setIsTooltipVisible(false);
      setAllowTooltip(false);

      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setShowCopied(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div class="flex flex-col">
      <div class="flex gap-3 mobileMd:gap-6">
        <div class="flex">
          {/* Base view - full address */}
          <p class={`${subTitleGrey} block mobileMd:hidden tablet:hidden`}>
            {walletData.address}
          </p>
          {/* mobileMd view - abbreviated 6 chars */}
          <p class={`${subTitleGrey} hidden mobileMd:block tablet:hidden`}>
            {abbreviateAddress(walletData.address, 6)}
          </p>
          {/* tablet and above - full address */}
          <p class={`${subTitleGrey} hidden tablet:block`}>
            {walletData.address}
          </p>
        </div>

        <div
          ref={copyButtonRef}
          class="relative -pt-0.5"
          onMouseEnter={handleCopyMouseEnter}
          onMouseLeave={handleCopyMouseLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
            role="button"
            aria-label="Copy"
            onClick={copy}
          >
            <path d="M27 4H11C10.7348 4 10.4804 4.10536 10.2929 4.29289C10.1054 4.48043 10 4.73478 10 5V10H5C4.73478 10 4.48043 10.1054 4.29289 10.2929C4.10536 10.4804 4 10.7348 4 11V27C4 27.2652 4.10536 27.5196 4.29289 27.7071C4.48043 27.8946 4.73478 28 5 28H21C21.2652 28 21.5196 27.8946 21.7071 27.7071C21.8946 27.5196 22 27.2652 22 27V22H27C27.2652 22 27.5196 21.8946 27.7071 21.7071C27.8946 21.5196 28 21.2652 28 21V5C28 4.73478 27.8946 4.48043 27.7071 4.29289C27.5196 4.10536 27.2652 4 27 4ZM20 26H6V12H20V26ZM26 20H22V11C22 10.7348 21.8946 10.4804 21.7071 10.2929C21.5196 10.1054 21.2652 10 21 10H12V6H26V20Z" />
          </svg>
          <div
            class={`${tooltipIcon} ${
              isTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            COPY ADDY
          </div>
          <div
            class={`${tooltipIcon} ${showCopied ? "opacity-100" : "opacity-0"}`}
          >
            ADDY COPIED
          </div>
        </div>
      </div>

      <div class="flex pt-1.5 mobileLg:pt-3">
        <StatItem
          label={
            <>
              {walletData.usdValue.toLocaleString()}{" "}
              <span class="font-extralight">USD</span>
            </>
          }
          value={
            <>
              {walletData.balance} <span class="font-extralight">BTC</span>
            </>
          }
        />
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
