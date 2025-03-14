import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { WalletOverviewInfo } from "$lib/types/index.d.ts";
import { abbreviateAddress, formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { DetailStyles } from "./styles.ts";

function WalletDetails(
  { walletData, stampsTotal, src20Total, stampsCreated, setShowItem }: {
    walletData: WalletOverviewInfo;
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    setShowItem: (type: string) => void;
  },
) {
  return (
    <div>
      <div class="flex flex-col gap-3 mobileMd:gap-6 items-stretch">
        <WalletOverview
          walletData={{ ...walletData }}
        />
        <WalletStats
          setShowItem={setShowItem}
          stampsTotal={stampsTotal}
          src20Total={src20Total}
          stampsCreated={stampsCreated}
          walletData={walletData}
        />
      </div>
    </div>
  );
}

function WalletOverview(
  { walletData }: {
    walletData: WalletOverviewInfo;
  },
) {
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

  const displayPrice = walletData.dispensers?.items?.[0]?.satoshirate
    ? parseInt(walletData.dispensers.items[0].satoshirate.toString(), 10) /
      100000000
    : 0;

  const displayPriceUSD = displayPrice * walletData.btcPrice;

  console.log("walletData:", walletData);
  console.log("dispensers:", walletData.dispensers);

  return (
    <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
      <div class="flex flex-col w-full tablet:w-1/2 dark-gradient rounded-lg p-3 mobileMd:p-6 space-y-1.5 mobileLg:space-y-3">
        <div class="flex">
          <p class={DetailStyles.titleGreyDL}>
            {walletData.address.startsWith("1D") ||
                walletData.dispensers?.total > 0
              ? "DISPENSER"
              : "ANONYMOUS"}
          </p>
        </div>
        <div class="flex gap-3 mobileMd:gap-6">
          <div class="flex">
            <p
              class={`${DetailStyles.subTitleGrey} hidden mobileMd:block mobileLg:hidden desktop:block`}
            >
              {walletData.address}
            </p>
            <p
              class={`${DetailStyles.subTitleGrey} block mobileMd:hidden mobileLg:block desktop:hidden`}
            >
              {abbreviateAddress(walletData.address, 14)}
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
              class={`${DetailStyles.tooltipIcon} ${
                isTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              COPY ADDY
            </div>
            <div
              class={`${DetailStyles.tooltipIcon} ${
                showCopied ? "opacity-100" : "opacity-0"
              }`}
            >
              ADDY COPIED
            </div>
          </div>
        </div>

        <DispenserStats
          dispensers={walletData.dispensers}
          btcPrice={walletData.btcPrice}
          walletData={walletData}
        />
      </div>
    </div>
  );
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
        <p className={`${DetailStyles.dataValueLg} whitespace-nowrap overflow-hidden`}>
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
          <p className={DetailStyles.dataLabelSm}>BY</p>
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
          <button className={DetailStyles.buttonPurpleFlat}>
            BUY
          </button>
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
    setShowItem = () => {},
    stampValue = 0,
    src20Value = 0,
    walletData,
  }: {
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    setShowItem?: (type: string) => void;
    stampValue?: number;
    src20Value?: number;
    walletData: WalletOverviewInfo;
  },
) {
  const handleType = (type: string) => {
    setShowItem(type);
  };

  return (
    <div class="flex flex-col mobileMd:flex-row w-full gap-3 mobileMd:gap-6">
      <StampStats
        stampsTotal={stampsTotal}
        stampsCreated={stampsCreated}
        handleType={handleType}
        stampValue={stampValue}
        dispensers={walletData.dispensers || { open: 0, closed: 0, total: 0 }}
      />
      <TokenStats
        src20Total={src20Total}
        handleType={handleType}
        src20Value={src20Value}
        walletData={walletData}
      />
    </div>
  );
}

function StampStats(
  { stampsTotal, stampsCreated, handleType, stampValue = 0, dispensers }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
    stampValue?: number;
    dispensers: { open: number; closed: number; total: number };
  },
) {
  return (
    <div
      className={DetailStyles.walletDataContainer}
      onClick={() => handleType("stamp")}
    >
      <div className="flex">
        <StatTitle label="STAMPS" value={stampsTotal.toString()} />
      </div>
      <div className="flex justify-between">
        <StatItem
          label="CREATED"
          value={stampsCreated.toString()}
        />
        <StatItem
          label="COLLECTIONS"
          value="N/A"
          align="right"
        />
      </div>
      <div className="flex justify-between">
        <StatItem label="LISTINGS" value={dispensers.open.toString()} />
        <StatItem
          label="VALUE"
          value={
            <>
              {stampValue > 0 ? stampValue.toFixed(8) : "N/A"}{" "}
              <span className="font-light">BTC</span>
            </>
          }
          align="right"
        />
      </div>
    </div>
  );
}

function TokenStats(
  { src20Total, handleType, src20Value = 0, walletData }: {
    src20Total: number;
    handleType: (type: string) => void;
    src20Value?: number;
    walletData: WalletOverviewInfo;
  },
) {
  const totalValue = src20Value || 0;

  return (
    <div
      className={DetailStyles.walletDataContainer}
      onClick={() => handleType("token")}
    >
      <div className="flex justify-between">
        <StatTitle label="TOKENS" value={src20Total?.toString()} />
        <StatItem
          label={`${walletData.usdValue.toFixed(2)} USD`}
          value={
            <>
              {walletData.balance} <span class="font-light">BTC</span>
            </>
          }
          align="right"
          class="self-end"
        />
      </div>

      <div className="flex justify-between">
        <StatItem
          label="TOP HOLDINGS"
          value={
            <>
              XCP<br />
              STAMP<br />
              KEVIN
            </>
          }
        />
        <StatItem
          label="AMOUNT"
          value={
            <>
              23.12<br />
              100,000<br />
              700,000
            </>
          }
          align="center"
          class="hidden tablet:block"
        />
        <StatItem
          label="AMOUNT"
          value={
            <>
              23.12<br />
              100,000<br />
              700,000
            </>
          }
          align="right"
          class="block tablet:hidden"
        />
        <StatItem
          label="VALUE"
          value={
            <>
              234.34 USD<br />
              5,886.98 USD<br />
              532.39 USD
            </>
          }
          align="right"
          class="hidden tablet:block"
        />
      </div>

      <div className="flex justify-between">
        <StatItem label="24H CHANGE" value="+/- 0.00%" />
        <StatItem
          label="TOTAL VALUE"
          value={
            <>
              {totalValue > 0 ? totalValue.toFixed(8) : "N/A"}{" "}
              <span className="font-light">BTC</span>
            </>
          }
          align="right"
        />
      </div>
    </div>
  );
}

interface StatTitleProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
}

function StatTitle({ label, value, align = "left" }: StatTitleProps) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div class={`${DetailStyles.dataColumn} `}>
      <p
        class={`${DetailStyles.dataLabel} ${alignmentClass}`}
      >
        {label}
      </p>
      <p
        class={`${DetailStyles.dataValueXl} ${alignmentClass}`}
      >
        {value}
      </p>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
  class?: string;
}

function StatItem(
  { label, value, align = "left", class: customClass }: StatItemProps,
) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div class={`${DetailStyles.dataColumn} ${customClass || ""}`}>
      <p
        class={`${DetailStyles.dataLabelSm}  ${alignmentClass}`}
      >
        {label}
      </p>
      <p
        class={`${DetailStyles.dataValueSm} ${alignmentClass}`}
      >
        {value}
      </p>
    </div>
  );
}

export default WalletDetails;
