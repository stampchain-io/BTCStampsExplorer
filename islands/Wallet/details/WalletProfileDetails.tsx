import { useEffect, useRef, useState } from "preact/hooks";
import { WalletOverviewInfo } from "$lib/types/wallet.d.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import {
  backgroundContainer,
  dataLabelSm,
  subTitleGrey,
  titleGreyDL,
  tooltipIcon,
} from "$components/shared/WalletStyles.ts";
import { StatItem, StatTitle } from "$components/shared/WalletComponents.tsx";

interface WalletProfileDetailsProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
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
      <div class="flex pb-1.5 mobileLg:pb-3">
        <p class={titleGreyDL}>ANONYMOUS</p>
      </div>
      <div class="flex gap-3 mobileMd:gap-6">
        <div class="flex">
          <p
            class={`${subTitleGrey} hidden mobileMd:block mobileLg:hidden tablet:block`}
          >
            {walletData.address}
          </p>
          <p
            class={`${subTitleGrey} hidden mobileLg:block tablet:hidden`}
          >
            {abbreviateAddress(walletData.address, 10)}
          </p>
          <p
            class={`${subTitleGrey} block mobileMd:hidden`}
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
                  class="text-stamp-grey font-light text-base mobileLg:text-lg tracking-[0.05em]"
                >
                  {name}
                  <span class="font-light">.btc</span>
                </p>
              ))}
            </div>
          )
          : (
            <p class={dataLabelSm}>
              NO BITNAMES
            </p>
          )}
      </div>

      <div class="flex justify-end pt-3 mobileLg:pt-6">
        <StatTitle
          label={
            <>
              {walletData.usdValue.toFixed(2)}{" "}
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

function TokenStats(
  { src20Total, _handleType, src20Value = 0, _walletData }: {
    src20Total: number;
    handleType: (type: string) => void;
    src20Value?: number;
    walletData: WalletOverviewInfo;
  },
) {
  const totalValue = src20Value || 0;

  return (
    <div className="flex flex-col gap-1.5 mobileLg:gap-3">
      <div className="flex pb-1.5 mobileLg:pb-3">
        <StatTitle
          label="TOKENS"
          value={src20Total?.toString()}
        />
      </div>

      <div className="flex justify-between">
        <StatItem
          label="TOTAL VALUE"
          value={
            <>
              {totalValue > 0 ? totalValue.toFixed(8) : "N/A"}{" "}
              <span className="font-light">BTC</span>
            </>
          }
        />
        <StatItem label="24H CHANGE" value="+/- 0.00%" align="right" />
      </div>
    </div>
  );
}

function StampStats(
  { stampsTotal, _stampsCreated, _handleType, _stampValue = 0, _dispensers }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
    stampValue?: number;
    dispensers: { open: number; closed: number; total: number };
  },
) {
  return (
    <div className="flex flex-col gap-1.5 mobileLg:gap-3">
      <div className="flex pb-1.5 mobileLg:pb-3">
        <StatTitle
          label="STAMPS"
          value={stampsTotal.toString()}
        />
      </div>
      <div className="flex justify-between">
        <StatItem label="CREATED" value="N/A" />
        <StatItem label="LISTINGS" value="N/A" align="right" />
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
    <div class="flex flex-col w-full mobileMd:flex-row tablet:flex-col gap-3 mobileMd:gap-6">
      <div class="w-full mobileMd:w-1/2 tablet:w-full">
        <div className={backgroundContainer}>
          <TokenStats
            src20Total={src20Total}
            handleType={handleType}
            src20Value={src20Value}
            walletData={walletData}
          />
        </div>
      </div>
      <div class="w-full mobileMd:w-1/2 tablet:w-full">
        <div className={backgroundContainer}>
          <StampStats
            stampsTotal={stampsTotal}
            stampsCreated={stampsCreated}
            handleType={handleType}
            stampValue={stampValue}
            dispensers={walletData.dispensers ||
              { open: 0, closed: 0, total: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function WalletProfileDetails({
  walletData,
  stampsTotal,
  src20Total,
  stampsCreated,
  setShowItem,
}: WalletProfileDetailsProps) {
  return (
    <div class="flex flex-col tablet:flex-row gap-3 mobileMd:gap-6">
      <div className="flex flex-col h-fit w-full tablet:w-2/3">
        <div className={backgroundContainer}>
          <WalletOverview walletData={walletData} />
        </div>
      </div>
      <div class="flex flex-col w-full tablet:w-1/3">
        <WalletStats
          stampsTotal={stampsTotal}
          src20Total={src20Total}
          stampsCreated={stampsCreated}
          setShowItem={setShowItem}
          walletData={walletData}
        />
      </div>
    </div>
  );
}
