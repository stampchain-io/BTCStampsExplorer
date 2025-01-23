import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import WalletSendModal from "$islands/Wallet/details/WalletSendBTCModal.tsx";
import WalletReceiveModal from "$islands/Wallet/details/WalletReceiveModal.tsx";
import { WalletOverviewInfo } from "$lib/types/index.d.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

const walletDataContainer =
  "flex flex-col w-full dark-gradient rounded-lg p-3 mobileMd:p-6 gap-3 mobileMd:gap-6";
const dataColumn = "flex flex-col -space-y-1";
const dataLabelSm =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
const dataValueSm =
  "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
const dataValue =
  "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
const dataValueXl =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light";
const titleGreyDL =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
const subTitleGrey =
  "inline-block text-sm mobileMd:text-base mobileLg:text-lg font-medium text-stamp-grey";
const tooltipIcon =
  "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap transition-opacity duration-300";

function WalletDetails(
  { walletData, stampsTotal, src20Total, stampsCreated, setShowItem }: {
    walletData: WalletOverviewInfo;
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
        />
        <WalletStats
          setShowItem={setShowItem}
          stampsTotal={stampsTotal}
          src20Total={src20Total}
          stampsCreated={stampsCreated}
          dispensers={walletData.dispensers}
          stampValue={walletData.stampValue}
          src20Value={walletData.src20Value}
          walletData={walletData}
        />
      </div>

      {isSendModalOpen && (
        <WalletSendModal
          fee={fee}
          balance={walletData.balance}
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

  return (
    <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
      <div class="flex flex-col w-full mobileLg:w-1/2 dark-gradient rounded-lg p-3 mobileMd:p-6 space-y-1.5 mobileLg:space-y-3">
        <div class="flex">
          <p class={titleGreyDL}>
            ANONYMOUS
          </p>
        </div>
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
              class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-grey hover:fill-stamp-grey-light cursor-pointer"
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
              class={`${tooltipIcon} ${
                showCopied ? "opacity-100" : "opacity-0"
              }`}
            >
              ADDY COPIED
            </div>
          </div>
        </div>

        <div class="flex flex-col">
          <p class="text-stamp-grey-light font-light text-base mobileLg:text-lg">
            kevin.btc
          </p>
          <p class="text-stamp-grey font-light text-sm mobileLg:text-base">
            universe.btc
          </p>
        </div>
      </div>

      <div class="flex flex-col w-full mobileLg:w-1/2 dark-gradient rounded-lg p-3 mobileMd:p-6">
        <div class={`${dataColumn} text-left mobileLg:text-right`}>
          <p class={dataLabel}>
            <span class="font-medium">
              {walletData.usdValue.toFixed(2)}
            </span>{" "}
            USD
          </p>
          <p class={dataValueXl}>
            {
              <>
                {walletData.balance} <span class="font-light">BTC</span>
              </>
            }
          </p>
        </div>
        <div class="flex justify-between">
          <div class={dataColumn}>
            <p class={`${dataLabel}`}>
              STAMPS
            </p>
            <p class={`${dataValueXl}`}>
              0
            </p>
          </div>
          <div class={dataColumn}>
            <p class={`${dataLabel} text-right`}>
              TOKENS
            </p>
            <p class={`${dataValueXl} text-right`}>
              0
            </p>
          </div>
        </div>

        <div class="flex justify-between">
          <div class={dataColumn}>
            <p class={`${dataLabelSm}`}>
              24H CHANGE
            </p>
            <p class={`${dataValue}`}>
              +3.2%
            </p>
          </div>
          <div class={dataColumn}>
            <p class={`${dataLabelSm} text-right`}>
              VALUE
            </p>
            <p class={`${dataValue} text-right`}>
              0.00000 <span class="font-light">BTC</span>
            </p>
          </div>
        </div>

        <div class="flex justify-between">
          <div class={dataColumn}>
            <p class={`${dataLabelSm}`}>
              LISTINGS
            </p>
            <p class={`${dataValue}`}>
              2
            </p>
          </div>
          <div class={dataColumn}>
            <p class={`${dataLabelSm} text-center`}>
              COLLECTIONS
            </p>
            <p class={`${dataValue} text-center`}>
              4
            </p>
          </div>
          <div class={dataColumn}>
            <p class={`${dataLabelSm} text-right`}>
              CREATED
            </p>
            <p class={`${dataValue} text-right`}>
              4
            </p>
          </div>
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
    stampValue = 0,
    src20Value = 0,
    walletData,
  }: {
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    dispensers?: { open: number; closed: number; total: number };
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
    <div class="w-full flex flex-col tablet:flex-row gap-3 mobileMd:gap-6">
      <StampStats
        stampsTotal={stampsTotal}
        stampsCreated={stampsCreated}
        handleType={handleType}
        stampValue={stampValue}
        dispensers={dispensers}
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
      <div className="flex justify-between">
        <StatTitle label="STAMPS" value={stampsTotal.toString()} />
        <StatItem
          label="CREATED"
          value={stampsCreated.toString()}
          align="right"
          class="self-end"
        />
      </div>
      <div className="flex justify-between">
        <StatItem label="EDITIONS" value="239" />
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
        <StatItem label="24H CHANGE" value="+/- 0.00%" />
        <StatItem
          label="VALUE"
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
    <div class={`${dataColumn} `}>
      <p
        class={`${dataLabel} ${alignmentClass}`}
      >
        {label}
      </p>
      <p
        class={`${dataValueXl} ${alignmentClass}`}
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
    <div class={`${dataColumn} ${customClass || ""}`}>
      <p
        class={`${dataLabelSm}  ${alignmentClass}`}
      >
        {label}
      </p>
      <p
        class={`${dataValueSm} ${alignmentClass}`}
      >
        {value}
      </p>
    </div>
  );
}

export default WalletDetails;
