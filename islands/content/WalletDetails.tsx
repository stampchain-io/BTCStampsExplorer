/* ===== NOT IN USE ===== */
import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { WalletOverviewInfo } from "$lib/types/index.d.ts";
import { abbreviateAddress, formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { containerBackground, containerColData } from "$layout";
import {
  labelSm,
  subtitleGrey,
  titleGreyLD,
  valueLg,
  valueSm,
  valueXl,
} from "$text";
import { Button } from "$button";
import { tooltipIcon } from "$notification";
import { Icon } from "$icon";

/* ===== MAIN WALLET DETAILS COMPONENT ===== */
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

/* ===== WALLET OVERVIEW SUBCOMPONENT ===== */
function WalletOverview(
  { walletData }: {
    walletData: WalletOverviewInfo;
  },
) {
  /* ===== STATE ===== */
  const [showCopied, setShowCopied] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);

  /* ===== REFS ===== */
  const copyButtonRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  /* ===== EFFECTS ===== */
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  /* ===== EVENT HANDLERS ===== */
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

  /* ===== COMPUTED VALUES ===== */
  const displayPrice = walletData.dispensers?.items?.[0]?.satoshirate
    ? parseInt(walletData.dispensers.items[0].satoshirate.toString(), 10) /
      100000000
    : 0;

  const _displayPriceUSD = displayPrice * walletData.btcPrice;

  console.log("walletData:", walletData);
  console.log("dispensers:", walletData.dispensers);

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
      <div class="flex flex-col w-full tablet:w-1/2 dark-gradient rounded-lg p-3 mobileMd:p-6 space-y-1.5 mobileLg:space-y-3">
        <div class="flex">
          <p class={titleGreyLD}>
            {walletData.address.startsWith("1D") ||
                walletData.dispensers?.total > 0
              ? "DISPENSER"
              : "ANONYMOUS"}
          </p>
        </div>
        <div class="flex gap-3 mobileMd:gap-6">
          <div class="flex">
            <p
              class={`${subtitleGrey} hidden mobileMd:block mobileLg:hidden desktop:block`}
            >
              {walletData.address}
            </p>
            <p
              class={`${subtitleGrey} block mobileMd:hidden mobileLg:block desktop:hidden`}
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
            <Icon
              type="iconButton"
              name="copy"
              weight="normal"
              size="mdR"
              color="grey"
              onClick={copy}
            />
            <div
              class={`${tooltipIcon} ${
                isTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              COPY ADDY
            </div>
            <div
              class={`${tooltipIcon} ${
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

/* ===== DISPENSER STATS SUBCOMPONENT ===== */
function DispenserStats({
  dispensers,
  btcPrice,
  walletData,
}: {
  dispensers: WalletOverviewInfo["dispensers"];
  btcPrice: number;
  walletData: WalletOverviewInfo;
}) {
  /* ===== VALIDATION ===== */
  if (!walletData.address.startsWith("1D") && !walletData.dispensers?.total) {
    return null;
  }

  /* ===== COMPUTED VALUES ===== */
  const firstDispenser = dispensers?.items?.[0];
  const stampData = firstDispenser?.stamp;

  if (!firstDispenser || !stampData) return null;

  const creatorDisplay = stampData.creator_name
    ? stampData.creator_name
    : abbreviateAddress(stampData.creator, 8);

  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col pt-6">
      {/* Stamp Info Section */}
      <div>
        <p
          className={`${valueLg} whitespace-nowrap overflow-hidden`}
        >
          <span className="font-light">STAMP #</span>
          <span className="font-black">{stampData.stamp}</span>
        </p>

        {stampData.cpid && (
          <p className="-mt-1 pb-1 text-base mobileLg:text-lg font-bold text-stamp-grey-darker block">
            {stampData.cpid}
          </p>
        )}

        <div className="flex flex-col items-start pt-1.5 mobileLg:pt-3">
          <p className={labelSm}>BY</p>
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
          <Button
            variant="outline"
            color="purple"
            size="md"
          >
            BUY
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===== WALLET STATS SUBCOMPONENT ===== */
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
  /* ===== EVENT HANDLERS ===== */
  const handleType = (type: string) => {
    setShowItem(type);
  };

  /* ===== RENDER ===== */
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

/* ===== STAMP STATS SUBCOMPONENT ===== */
function StampStats(
  { stampsTotal, stampsCreated, handleType, stampValue = 0, dispensers }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
    stampValue?: number;
    dispensers: { open: number; closed: number; total: number };
  },
) {
  /* ===== RENDER ===== */
  return (
    <div
      className={`${containerBackground} gap-6`}
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

/* ===== TOKEN STATS SUBCOMPONENT ===== */
function TokenStats(
  { src20Total, handleType, src20Value = 0, walletData }: {
    src20Total: number;
    handleType: (type: string) => void;
    src20Value?: number;
    walletData: WalletOverviewInfo;
  },
) {
  /* ===== COMPUTED VALUES ===== */
  const totalValue = src20Value || 0;

  /* ===== RENDER ===== */
  return (
    <div
      className={`${containerBackground} gap-6`}
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

/* ===== TYPES ===== */
interface StatTitleProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
}

interface StatItemProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
  class?: string;
}

/* ===== STAT TITLE SUBCOMPONENT ===== */
function StatTitle({ label, value, align = "left" }: StatTitleProps) {
  /* ===== COMPUTED VALUES ===== */
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  /* ===== RENDER ===== */
  return (
    <div class={`${containerColData} `}>
      <p
        class={`${label} ${alignmentClass}`}
      >
        {label}
      </p>
      <p
        class={`${valueXl} ${alignmentClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ===== STAT ITEM SUBCOMPONENT ===== */
function StatItem(
  { label, value, align = "left", class: customClass }: StatItemProps,
) {
  /* ===== COMPUTED VALUES ===== */
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  /* ===== RENDER ===== */
  return (
    <div class={`${containerBackground} gap-6 ${customClass || ""}`}>
      <h5
        class={`${labelSm}  ${alignmentClass}`}
      >
        {label}
      </h5>
      <h6
        class={`${valueSm} ${alignmentClass}`}
      >
        {value}
      </h6>
    </div>
  );
}

export default WalletDetails;
