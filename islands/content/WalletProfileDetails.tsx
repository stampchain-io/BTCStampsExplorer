/* ===== WALLET PROFILE DETAILS COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";
import { WalletOverviewInfo } from "$lib/types/wallet.d.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { StatItem, StatTitle } from "$components/section/WalletComponents.tsx";
import { containerBackground } from "$layout";
import { labelSm, subtitleGrey, titleGreyLD } from "$text";
import { tooltipIcon } from "$notification";
import { Icon } from "$icon";

/* ===== TYPES ===== */
interface WalletProfileDetailsProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

/* ===== WALLET OVERVIEW SUBCOMPONENT ===== */
function WalletOverview({ walletData }: { walletData: WalletOverviewInfo }) {
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
  const bitNames = Array.isArray(walletData.src101?.names)
    ? walletData.src101.names.filter((name): name is string =>
      typeof name === "string"
    )
    : [];

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col">
      <div class="flex pb-1.5 mobileLg:pb-3">
        <p class={titleGreyLD}>ANONYMOUS</p>
      </div>
      <div class="flex gap-3 mobileMd:gap-6">
        <div class="flex">
          <p
            class={`${subtitleGrey} hidden mobileMd:block mobileLg:hidden tablet:block`}
          >
            {walletData.address}
          </p>
          <p
            class={`${subtitleGrey} hidden mobileLg:block tablet:hidden`}
          >
            {abbreviateAddress(walletData.address, 10)}
          </p>
          <p
            class={`${subtitleGrey} block mobileMd:hidden`}
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
            class={`${tooltipIcon} ${showCopied ? "opacity-100" : "opacity-0"}`}
          >
            ADDY COPIED
          </div>
        </div>
      </div>

      <div className="flex pt-1.5 mobileLg:pt-3 h-[17vh] overflow-y-auto">
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
            <p class={labelSm}>
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

/* ===== TOKEN STATS SUBCOMPONENT ===== */
function TokenStats(
  { src20Total, _handleType, src20Value = 0, _walletData }: {
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

/* ===== STAMP STATS SUBCOMPONENT ===== */
function StampStats(
  { stampsTotal, _stampsCreated, _handleType, _stampValue = 0, _dispensers }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
    stampValue?: number;
    dispensers: { open: number; closed: number; total: number };
  },
) {
  /* ===== RENDER ===== */
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
    <div class="flex flex-col w-full mobileMd:flex-row tablet:flex-col gap-6">
      <div class="w-full mobileMd:w-1/2 tablet:w-full">
        <div className={containerBackground}>
          <TokenStats
            src20Total={src20Total}
            handleType={handleType}
            src20Value={src20Value}
            walletData={walletData}
          />
        </div>
      </div>
      <div class="w-full mobileMd:w-1/2 tablet:w-full">
        <div className={containerBackground}>
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

/* ===== MAIN WALLET PROFILE DETAILS COMPONENT ===== */
export default function WalletProfileDetails({
  walletData,
  stampsTotal,
  src20Total,
  stampsCreated,
  setShowItem,
}: WalletProfileDetailsProps) {
  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col tablet:flex-row gap-6">
      <div className="flex flex-col h-fit w-full tablet:w-2/3">
        <div className={containerBackground}>
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
