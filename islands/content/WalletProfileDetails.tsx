/* ===== WALLET PROFILE DETAILS COMPONENT ===== */
import { StatTitle } from "$components/section/WalletComponents.tsx";
import { Icon } from "$icon";
import { containerBackground, gapSectionSlim } from "$layout";
import type { WalletOverviewInfo } from "$lib/types/wallet.d.ts";
import { abbreviateAddress } from "$lib/utils/ui/formatting/formatUtils.ts";
import { showToast } from "$lib/utils/ui/notifications/toastSignal.ts";
import { tooltipIcon } from "$notification";
import { label, labelSm, titleGreyLD, valueSm } from "$text";
import type { WalletProfileDetailsProps } from "$types/ui.d.ts";
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== TYPES ===== */

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
        <p class={titleGreyLD}>{walletData.creatorName || "ANONYMOUS"}</p>
      </div>
      <div class="flex gap-4">
        <div class="flex">
          <p
            class={`${label} text-color-grey-semilight hidden mobileMd:block`}
          >
            {walletData.address}
          </p>

          <p
            class={`${label} text-color-grey-semilight block mobileMd:hidden`}
          >
            {abbreviateAddress(walletData.address, 12)}
          </p>
        </div>

        <div
          ref={copyButtonRef}
          class="relative"
          onMouseEnter={handleCopyMouseEnter}
          onMouseLeave={handleCopyMouseLeave}
        >
          <Icon
            type="iconButton"
            name="copy"
            weight="normal"
            size="sm"
            color="grey"
            className="mb-1"
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

      <div className="flex overflow-y-auto">
        {bitNames.length > 0
          ? (
            <div class="flex flex-col">
              {bitNames.map((name) => (
                <h6
                  key={name}
                  class={valueSm}
                >
                  {name}
                  <span class="font-light">.btc</span>
                </h6>
              ))}
            </div>
          )
          : (
            <h6 class={labelSm}>
              NO BITNAMES
            </h6>
          )}
      </div>

      <div class="flex justify-end pt-9">
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
  {
    src20Total,
    stampsTotal,
    dispensers,
    handleType: _handleType,

    stampValue: _stampValue,
  }: {
    src20Total: number;
    stampsTotal: number;
    dispensers: { open: number; closed: number; total: number };
    handleType: (type: string) => void;
    src20Value?: number;
    stampValue?: number;
    walletData: WalletOverviewInfo;
  },
) {
  /* ===== RENDER ===== */
  return (
    <div className="flex justify-between flex-1">
      <StatTitle
        label="SRC-20"
        value={src20Total?.toString()}
      />
      <StatTitle
        label="STAMPS"
        value={stampsTotal.toString()}
        align="center"
      />
      <StatTitle
        label="LISTINGS"
        value={dispensers.open.toString()}
        align="right"
      />
    </div>
  );
}

/* ===== WALLET STATS SUBCOMPONENT ===== */
function WalletStats(
  {
    stampsTotal,
    src20Total,
    stampsCreated: _stampsCreated,
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
    <div class="flex flex-col w-full">
      <TokenStats
        src20Total={src20Total}
        stampsTotal={stampsTotal}
        dispensers={walletData.dispensers ||
          { open: 0, closed: 0, total: 0 }}
        handleType={handleType}
        src20Value={src20Value}
        stampValue={stampValue}
        walletData={walletData}
      />
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
  /* ===== EFFECTS ===== */
  useEffect(() => {
    const status = (walletData as any).marketDataStatus;
    if (status) {
      if (status.overallStatus === "partial") {
        showToast(
          "Some market data might be delayed or unavailable at the moment",
          "warning",
          true,
        );
      } else if (status.overallStatus === "unavailable") {
        showToast(
          "Market data is currently unavailable",
          "error",
          true,
        );
      }
    }
  }, []); // Empty dependency array - only run on mount

  /* ===== RENDER ===== */
  return (
    <div class={`flex flex-col tablet:flex-row ${gapSectionSlim}`}>
      <div className="flex flex-col h-fit w-full tablet:w-2/3">
        <div className={containerBackground}>
          <WalletOverview walletData={walletData} />
        </div>
      </div>
      <div class={`flex flex-col w-full tablet:w-1/3 ${gapSectionSlim}`}>
        <div className={containerBackground}>
          <WalletStats
            stampsTotal={stampsTotal}
            src20Total={src20Total}
            stampsCreated={stampsCreated}
            setShowItem={setShowItem}
            {...(walletData.stampValue !== undefined &&
              { stampValue: walletData.stampValue })}
            {...(walletData.src20Value !== undefined &&
              { src20Value: walletData.src20Value })}
            walletData={walletData}
          />
        </div>
      </div>
    </div>
  );
}
