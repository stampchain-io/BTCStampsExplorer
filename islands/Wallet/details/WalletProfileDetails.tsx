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

interface WalletProfileDetailsProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

export default function WalletProfileDetails({
  walletData,
  stampsTotal,
  src20Total,
  stampsCreated,
  setShowItem,
}: WalletProfileDetailsProps) {
  return (
    <div class="flex flex-col gap-3 mobileMd:gap-6">
      <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
        <div class="flex flex-col w-full tablet:w-1/2 dark-gradient rounded-lg p-3 mobileMd:p-6">
          <div class="flex pb-1.5 mobileLg:pb-3">
            <p class={titleGreyDL}>ANONYMOUS</p>
          </div>
          <WalletOverview walletData={walletData} />
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

  console.log("WalletOverview - Full Wallet Data:", walletData);
  console.log("WalletOverview - SRC101 Data:", walletData.src101);

  const bitNames = Array.isArray(walletData.src101?.names)
    ? walletData.src101.names.filter((name): name is string =>
      typeof name === "string"
    )
    : [];

  return (
    <div class="flex flex-col">
      <div class="flex gap-3 mobileMd:gap-6">
        <div class="flex">
          <p
            class={`${subTitleGrey} hidden mobileMd:block mobileLg:hidden desktop:block`}
          >
            {walletData.address}
          </p>
          <p
            class={`${subTitleGrey} block mobileMd:hidden mobileLg:block desktop:hidden`}
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

      <div className="flex pt-1.5 mobileLg:pt-3">
        {bitNames.length > 0
          ? (
            <div class="flex flex-col">
              {bitNames.map((name) => (
                <p
                  key={name}
                  class="text-stamp-grey font-light text-lg mobileLg:text-xl tracking-[0.05em]"
                >
                  {name}
                  <span class="font-light">.btc</span>
                </p>
              ))}
            </div>
          )
          : (
            <p class="text-stamp-grey-darker font-light text-sm mobileLg:text-base">
              NO BITNAMES
            </p>
          )}
      </div>

      <div class="flex justify-end pt-3 mobileLg:pt-6">
        <StatTitle
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
          align="right"
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
      className={walletDataContainer}
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
      className={walletDataContainer}
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
