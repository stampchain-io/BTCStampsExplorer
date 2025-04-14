/* ===== WALLET DISPENSER DETAILS COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";
import { WalletOverviewInfo } from "$lib/types/wallet.d.ts";
import { abbreviateAddress, formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { StampRow } from "$globals";
import BuyStampModal from "$islands/modal/BuyStampModal.tsx";
import { StatItem, StatTitle } from "$components/section/WalletComponents.tsx";
import { StampImage } from "$content";
import { containerBackground } from "$layout";
import { subtitleGrey, titleGreyLD, valueXs } from "$text";
import { Button } from "$button";
import { tooltipIcon } from "$notification";

/* ===== TYPES ===== */
interface WalletDispenserDetailsProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

/* ===== STAMP STATS SUBCOMPONENT ===== */
function StampStats({
  dispensers,
  walletData,
}: {
  dispensers: WalletOverviewInfo["dispensers"];
  walletData: WalletOverviewInfo;
}) {
  /* ===== TOOLTIP STATES ===== */
  const [isDivisibleTooltipVisible, setIsDivisibleTooltipVisible] = useState(
    false,
  );
  const [isKeyburnTooltipVisible, setIsKeyburnTooltipVisible] = useState(false);
  const [isLockedTooltipVisible, setIsLockedTooltipVisible] = useState(false);
  const [isUnlockedTooltipVisible, setIsUnlockedTooltipVisible] = useState(
    false,
  );

  /* ===== REFS ===== */
  const tooltipTimeoutRef = useRef<number | null>(null);

  /* ===== EFFECTS ===== */
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  /* ===== TOOLTIP HANDLERS ===== */
  const handleDivisibleMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsDivisibleTooltipVisible(true);
    }, 1500);
  };

  const handleDivisibleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsDivisibleTooltipVisible(false);
  };

  const handleKeyburnMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsKeyburnTooltipVisible(true);
    }, 1500);
  };

  const handleKeyburnMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsKeyburnTooltipVisible(false);
  };

  const handleLockedMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsLockedTooltipVisible(true);
    }, 1500);
  };

  const handleLockedMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsLockedTooltipVisible(false);
  };

  const handleUnlockedMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsUnlockedTooltipVisible(true);
    }, 1500);
  };

  const handleUnlockedMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsUnlockedTooltipVisible(false);
  };

  /* ===== VALIDATION ===== */
  if (!walletData.address.startsWith("1D") && !walletData.dispensers?.total) {
    return null;
  }

  /* ===== COMPUTED VALUES ===== */
  const firstDispenser = dispensers?.items?.[0];
  const stampData = firstDispenser?.stamp as StampRow;

  if (!firstDispenser || !stampData) return null;

  const creatorDisplay = (
    <span>
      <span className="hidden mobileMd:block mobileLg:hidden desktop:block">
        {stampData.creator_name || stampData.creator}
      </span>
      <span className="hidden tablet:block desktop:hidden">
        {abbreviateAddress(stampData.creator, 12)}
      </span>
      <span className="block mobileMd:hidden mobileLg:block tablet:hidden">
        {abbreviateAddress(stampData.creator, 8)}
      </span>
    </span>
  );

  const editionCount = stampData.divisible
    ? (stampData.supply / 100000000).toFixed(2)
    : stampData.supply > 100000
    ? "+100000"
    : stampData.supply.toFixed(2);

  const editionCountFormatted = stampData.divisible
    ? editionCount.toString()
    : parseInt(editionCount.toString()).toString();

  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col gap-1.5 mobileLg:gap-3">
      <div className="flex pb-1.5 mobileLg:pb-3">
        <StatTitle
          label="STAMP"
          value={
            <>
              <span className="font-light">#</span>
              {stampData.stamp}
            </>
          }
          href={`/stamp/${stampData.stamp}`}
        />
      </div>
      <div className="flex justify-between">
        <StatItem
          label="CPID"
          value={stampData.cpid}
        />
        <div className="flex flex-1 justify-end items-end pb-1 space-x-[9px]">
          {stampData.divisible == true && (
            <div
              className="relative group"
              onMouseEnter={handleDivisibleMouseEnter}
              onMouseLeave={handleDivisibleMouseLeave}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                class="w-[22px] h-[22px] mobileLg:w-[26px] mobileLg:h-[26px] fill-stamp-grey-darker -mb-[1px]"
                aria-label="Divisible"
              >
                <path d="M25.7076 7.70497L7.70755 25.705C7.51991 25.8926 7.26541 25.998 7.00005 25.998C6.73468 25.998 6.48019 25.8926 6.29255 25.705C6.10491 25.5173 5.99949 25.2628 5.99949 24.9975C5.99949 24.7321 6.10491 24.4776 6.29255 24.29L24.2925 6.28997C24.48 6.10233 24.7344 5.99685 24.9996 5.99673C25.2649 5.99661 25.5193 6.10187 25.7069 6.28935C25.8946 6.47682 26 6.73116 26.0002 6.9964C26.0003 7.26165 25.895 7.51608 25.7076 7.70372V7.70497ZM6.31755 12.68C5.47366 11.8359 4.99964 10.6912 4.99976 9.49765C4.99987 8.3041 5.47412 7.15948 6.31817 6.3156C7.16222 5.47171 8.30694 4.99769 9.50049 4.9978C10.694 4.99792 11.8387 5.47217 12.6825 6.31622C13.5264 7.16027 14.0005 8.30499 14.0003 9.49854C14.0002 10.6921 13.526 11.8367 12.6819 12.6806C11.8379 13.5245 10.6932 13.9985 9.49961 13.9984C8.30606 13.9983 7.16143 13.524 6.31755 12.68ZM7.00005 9.49997C7.00037 9.91103 7.10205 10.3157 7.29608 10.6781C7.49011 11.0404 7.7705 11.3494 8.11243 11.5775C8.45436 11.8057 8.84727 11.946 9.25637 11.9861C9.66547 12.0262 10.0781 11.9647 10.4578 11.8073C10.8375 11.6498 11.1725 11.4011 11.4332 11.0832C11.6938 10.7654 11.8721 10.3882 11.9522 9.98497C12.0322 9.58178 12.0116 9.16507 11.8922 8.77174C11.7728 8.37841 11.5583 8.02059 11.2675 7.72997C10.9178 7.3803 10.4721 7.14223 9.98701 7.04589C9.5019 6.94955 8.99911 6.99927 8.54226 7.18875C8.08541 7.37824 7.69502 7.69898 7.4205 8.11038C7.14598 8.52179 6.99966 9.00538 7.00005 9.49997ZM27 22.5C26.9998 23.5411 26.6386 24.5499 25.978 25.3545C25.3173 26.1591 24.3981 26.7098 23.377 26.9127C22.3559 27.1155 21.296 26.9581 20.3779 26.4671C19.4599 25.9762 18.7405 25.1821 18.3423 24.2202C17.944 23.2583 17.8917 22.188 18.1941 21.1918C18.4965 20.1956 19.1349 19.3351 20.0007 18.7569C20.8664 18.1786 21.9058 17.9185 22.9419 18.0207C23.978 18.1229 24.9465 18.5812 25.6826 19.3175C26.1017 19.7344 26.434 20.2304 26.6601 20.7767C26.8863 21.323 27.0018 21.9087 27 22.5ZM25 22.5C25.0002 21.9216 24.7997 21.361 24.4329 20.9139C24.0661 20.4667 23.5555 20.1605 22.9883 20.0476C22.421 19.9346 21.8321 20.0219 21.322 20.2944C20.8118 20.567 20.412 21.008 20.1905 21.5423C19.9691 22.0766 19.9398 22.6712 20.1076 23.2247C20.2754 23.7782 20.6299 24.2565 21.1108 24.5779C21.5916 24.8993 22.1691 25.044 22.7447 24.9874C23.3203 24.9308 23.8585 24.6764 24.2675 24.2675C24.5004 24.0359 24.6851 23.7605 24.8108 23.4571C24.9366 23.1537 25.0009 22.8284 25 22.5Z" />
              </svg>
              <div
                className={`${tooltipIcon} ${
                  isDivisibleTooltipVisible ? "opacity-100" : "opacity-0"
                } -mb-[1px]`}
              >
                DIVISIBLE
              </div>
            </div>
          )}
          {stampData.keyburn != null && (
            <div
              className="relative group"
              onMouseEnter={handleKeyburnMouseEnter}
              onMouseLeave={handleKeyburnMouseLeave}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                class="w-5 h-5 mobileLg:w-6 mobileLg:h-6 fill-stamp-grey-darker"
                aria-label="Keyburned"
              >
                <path d="M22.9862 19.1675C22.7269 20.6159 22.0301 21.9501 20.9896 22.9904C19.949 24.0308 18.6147 24.7273 17.1663 24.9863C17.1113 24.9951 17.0557 24.9997 17 25C16.7492 25 16.5075 24.9056 16.323 24.7357C16.1384 24.5659 16.0245 24.3328 16.0037 24.0828C15.9829 23.8328 16.0569 23.5842 16.2108 23.3862C16.3648 23.1882 16.5876 23.0552 16.835 23.0138C18.9062 22.665 20.6637 20.9075 21.015 18.8325C21.0594 18.571 21.2059 18.3378 21.4223 18.1842C21.6387 18.0307 21.9072 17.9694 22.1688 18.0138C22.4303 18.0582 22.6635 18.2047 22.8171 18.4211C22.9706 18.6375 23.0319 18.906 22.9875 19.1675H22.9862ZM27 18C27 20.9174 25.8411 23.7153 23.7782 25.7782C21.7153 27.8411 18.9174 29 16 29C13.0826 29 10.2847 27.8411 8.22183 25.7782C6.15893 23.7153 5 20.9174 5 18C5 14.51 6.375 10.9413 9.0825 7.39379C9.1682 7.28146 9.27674 7.18857 9.40095 7.12123C9.52516 7.0539 9.66223 7.01365 9.80313 7.00314C9.94403 6.99263 10.0856 7.01209 10.2184 7.06025C10.3512 7.10841 10.4723 7.18417 10.5737 7.28254L13.5887 10.2088L16.3388 2.65754C16.3937 2.50693 16.484 2.37174 16.6022 2.26337C16.7203 2.15499 16.8628 2.0766 17.0175 2.03481C17.1723 1.99303 17.3349 1.98906 17.4915 2.02326C17.6481 2.05745 17.7942 2.1288 17.9175 2.23129C20.6512 4.50004 27 10.5688 27 18ZM25 18C25 12.2388 20.5262 7.26004 17.7237 4.70879L14.94 12.3425C14.8829 12.4993 14.7874 12.6393 14.6623 12.7498C14.5372 12.8602 14.3865 12.9376 14.2238 12.9749C14.0612 13.0122 13.8918 13.0082 13.7311 12.9632C13.5704 12.9183 13.4235 12.8338 13.3038 12.7175L10.0075 9.52004C8.01125 12.4013 7 15.25 7 18C7 20.387 7.94821 22.6762 9.63604 24.364C11.3239 26.0518 13.6131 27 16 27C18.3869 27 20.6761 26.0518 22.364 24.364C24.0518 22.6762 25 20.387 25 18Z" />
              </svg>
              <div
                className={`${tooltipIcon} ${
                  isKeyburnTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                KEYBURNED
              </div>
            </div>
          )}
          {stampData.locked && (
            <div
              className="relative group"
              onMouseEnter={handleLockedMouseEnter}
              onMouseLeave={handleLockedMouseLeave}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                class="w-5 h-5 mobileLg:w-6 mobileLg:h-6 fill-stamp-grey-darker"
                aria-label="Locked"
              >
                <path d="M26 10H22V7C22 5.4087 21.3679 3.88258 20.2426 2.75736C19.1174 1.63214 17.5913 1 16 1C14.4087 1 12.8826 1.63214 11.7574 2.75736C10.6321 3.88258 10 5.4087 10 7V10H6C5.46957 10 4.96086 10.2107 4.58579 10.5858C4.21071 10.9609 4 11.4696 4 12V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H26C26.5304 28 27.0391 27.7893 27.4142 27.4142C27.7893 27.0391 28 26.5304 28 26V12C28 11.4696 27.7893 10.9609 27.4142 10.5858C27.0391 10.2107 26.5304 10 26 10ZM12 7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3C17.0609 3 18.0783 3.42143 18.8284 4.17157C19.5786 4.92172 20 5.93913 20 7V10H12V7ZM26 26H6V12H26V26Z" />
              </svg>
              <div
                className={`${tooltipIcon} ${
                  isLockedTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                LOCKED
              </div>
            </div>
          )}
          {!stampData.locked && (
            <div
              className="relative group"
              onMouseEnter={handleUnlockedMouseEnter}
              onMouseLeave={handleUnlockedMouseLeave}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                class="w-5 h-5 mobileLg:w-6 mobileLg:h-6 fill-stamp-grey-darker"
                aria-label="Unlocked"
              >
                <path d="M26 10H12V7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3C17.9213 3 19.65 4.375 20.02 6.19875C20.0749 6.45646 20.2294 6.68207 20.4497 6.82655C20.6701 6.97103 20.9385 7.0227 21.1968 6.97032C21.455 6.91795 21.6822 6.76577 21.8288 6.54686C21.9755 6.32795 22.0298 6.06 21.98 5.80125C21.415 3.01875 18.9 1 16 1C14.4092 1.00165 12.884 1.63433 11.7592 2.75919C10.6343 3.88405 10.0017 5.40921 10 7V10H6C5.46957 10 4.96086 10.2107 4.58579 10.5858C4.21071 10.9609 4 11.4696 4 12V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H26C26.5304 28 27.0391 27.7893 27.4142 27.4142C27.7893 27.0391 28 26.5304 28 26V12C28 11.4696 27.7893 10.9609 27.4142 10.5858C27.0391 10.2107 26.5304 10 26 10ZM26 26H6V12H26V26Z" />
              </svg>
              <div
                className={`${tooltipIcon} ${
                  isUnlockedTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                UNLOCKED
              </div>
            </div>
          )}
        </div>
      </div>
      <div class="flex justify-between">
        <StatItem
          label="BY"
          value={creatorDisplay}
          href={`/wallet/${stampData.creator}`}
        />
        <StatItem
          label="EDITIONS"
          value={editionCountFormatted}
          align="right"
        />
      </div>
    </div>
  );
}

/* ===== DISPENSER STATS SUBCOMPONENT ===== */
function DispenserStats({
  dispensers,
  btcPrice,
}: {
  dispensers: WalletOverviewInfo["dispensers"];
  btcPrice: number;
}) {
  /* ===== STATE ===== */
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [fee, setFee] = useState(1); // Default fee

  /* ===== COMPUTED VALUES ===== */
  const firstDispenser = dispensers?.items?.[0];
  if (!firstDispenser) return null;

  /* ===== EVENT HANDLERS ===== */
  const handleOpenBuyModal = () => {
    setShowBuyModal(true);
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
  };

  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col gap-1.5 mobileLg:gap-3 pt-3 mobileLg:pt-6">
      {/* Open / close */}
      <div className="flex justify-between">
        <StatItem
          label="OPENED"
          value={firstDispenser?.block_index
            ? firstDispenser.block_index.toString()
            : "N/A"}
        />
        <StatItem
          label="CLOSED"
          value={!firstDispenser?.close_block_index ||
              firstDispenser.close_block_index <= 0
            ? "OPEN"
            : firstDispenser.close_block_index.toString()}
          align="right"
        />
      </div>
      {/* Dispenser Stats / price display */}
      <div className="flex justify-between">
        <StatItem
          label="ESCROW"
          value={
            <>
              <span class={valueXs}>
                {firstDispenser.escrow_quantity.toString()}
              </span>
            </>
          }
        />
        <StatItem
          label="GIVE"
          value={
            <>
              <span class={valueXs}>
                {firstDispenser.give_quantity.toString()}
              </span>
            </>
          }
          align="center"
        />
        <StatItem
          label="REMAIN"
          value={
            <>
              <span class={valueXs}>
                {firstDispenser.give_remaining.toString()}
              </span>
            </>
          }
          align="center"
        />
        <StatItem
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
          align="right"
        />
      </div>

      {/* Buy Button and Modal */}
      {firstDispenser?.give_remaining > 0 && (
        <>
          <div className="flex justify-end pt-1.5">
            <Button
              variant="outline"
              color="purple"
              size="lg"
              onClick={handleOpenBuyModal}
            >
              BUY
            </Button>
          </div>
          {showBuyModal && (
            <BuyStampModal
              stamp={firstDispenser.stamp}
              fee={fee}
              handleChangeFee={setFee}
              toggleModal={handleCloseBuyModal}
              handleCloseModal={handleCloseBuyModal}
              dispenser={firstDispenser}
            />
          )}
        </>
      )}
    </div>
  );
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

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col">
      <div class="flex pb-1.5 mobileLg:pb-3">
        <p class={titleGreyLD}>DISPENSER</p>
      </div>
      <div class="flex gap-6">
        <div class="flex">
          <p
            class={`${subtitleGrey} hidden mobileMd:block mobileLg:hidden desktop:block`}
          >
            {walletData.address}
          </p>
          <p class={`${subtitleGrey} hidden tablet:block desktop:hidden`}>
            {abbreviateAddress(walletData.address, 14)}
          </p>
          <p
            class={`${subtitleGrey} block mobileMd:hidden mobileLg:block tablet:hidden`}
          >
            {abbreviateAddress(walletData.address, 10)}
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
    </div>
  );
}

/* ===== MAIN COMPONENT ===== */
export default function WalletDispenserDetails({
  walletData,
}: WalletDispenserDetailsProps) {
  /* ===== COMPUTED VALUES ===== */
  const firstDispenser = walletData.dispensers?.items?.[0];
  const stampData = firstDispenser?.stamp;

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col mobileLg:flex-row gap-6">
      <div class="flex flex-col w-full mobileLg:w-1/2 desktop:w-2/3 gap-6">
        <div className={containerBackground}>
          <WalletOverview walletData={walletData} />
          <DispenserStats
            dispensers={walletData.dispensers}
            btcPrice={walletData.btcPrice}
          />
        </div>
        <div className={containerBackground}>
          <StampStats
            dispensers={walletData.dispensers}
            walletData={walletData}
          />
        </div>
      </div>
      {stampData && (
        <div class="flex flex-col w-full mobileLg:w-1/2 desktop:w-1/3">
          <div className={containerBackground}>
            <StampImage
              stamp={stampData}
              className="w-full h-full"
              flag={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
