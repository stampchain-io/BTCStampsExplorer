import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import WalletSendModal from "$islands/Wallet/details/WalletSendModal.tsx";
import WalletReceiveModal from "$islands/Wallet/details/WalletReceiveModal.tsx";
import {
  WalletData,
  WalletOverviewInfo,
  WalletStatsProps,
} from "$lib/types/index.d.ts";
import { Button } from "$components/shared/Button.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

// Style Constants
const dataContainer =
  "flex justify-between items-center dark-gradient p-3 mobileLg:p-6";
const dataColumn = "flex flex-col -space-y-1";
const dataLabelSm =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
const dataValueXs =
  "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";
const dataValueSm =
  "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
const dataValue =
  "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
const dataValueXl =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light";
const tooltipIcon =
  "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap";

function WalletDetails(
  { walletData, stampsTotal, src20Total, stampsCreated, setShowItem }: {
    walletData: WalletData;
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
          onSend={() => setIsSendModalOpen(true)}
          onReceive={() => setIsReceiveModalOpen(true)}
        />
        <WalletStats
          setShowItem={setShowItem}
          stampsTotal={stampsTotal}
          src20Total={src20Total}
          stampsCreated={stampsCreated}
          dispensers={walletData.dispensers}
        />
      </div>

      {isSendModalOpen && (
        <WalletSendModal
          fee={fee}
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
  { walletData, onSend, onReceive }: {
    walletData: WalletOverviewInfo;
    onSend: () => void;
    onReceive: () => void;
  },
) {
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const copyButtonRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const [isSendTooltipVisible, setIsSendTooltipVisible] = useState(false);
  const [allowSendTooltip, setAllowSendTooltip] = useState(true);
  const sendButtonRef = useRef<HTMLDivElement>(null);
  const sendTooltipTimeoutRef = useRef<number | null>(null);
  const [isReceiveTooltipVisible, setIsReceiveTooltipVisible] = useState(false);
  const [allowReceiveTooltip, setAllowReceiveTooltip] = useState(true);
  const receiveButtonRef = useRef<HTMLDivElement>(null);
  const receiveTooltipTimeoutRef = useRef<number | null>(null);
  const [isHistoryTooltipVisible, setIsHistoryTooltipVisible] = useState(false);
  const [allowHistoryTooltip, setAllowHistoryTooltip] = useState(true);
  const historyButtonRef = useRef<HTMLDivElement>(null);
  const historyTooltipTimeoutRef = useRef<number | null>(null);
  const [isBalanceTooltipVisible, setIsBalanceTooltipVisible] = useState(false);
  const [allowBalanceTooltip, setAllowBalanceTooltip] = useState(true);
  const balanceButtonRef = useRef<HTMLButtonElement>(null);
  const balanceTooltipTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
      if (sendTooltipTimeoutRef.current) {
        globalThis.clearTimeout(sendTooltipTimeoutRef.current);
      }
      if (receiveTooltipTimeoutRef.current) {
        globalThis.clearTimeout(receiveTooltipTimeoutRef.current);
      }
      if (historyTooltipTimeoutRef.current) {
        globalThis.clearTimeout(historyTooltipTimeoutRef.current);
      }
      if (balanceTooltipTimeoutRef.current) {
        globalThis.clearTimeout(balanceTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyMouseEnter = () => {
    if (allowTooltip) {
      const buttonRect = copyButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setIsTooltipVisible(true);
      }

      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsTooltipVisible(false);
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
    if (!hideBalance) {
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
    }
  };

  const handleSendMouseEnter = () => {
    if (allowSendTooltip) {
      const buttonRect = sendButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setIsSendTooltipVisible(true);
      }

      if (sendTooltipTimeoutRef.current) {
        globalThis.clearTimeout(sendTooltipTimeoutRef.current);
      }

      sendTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsSendTooltipVisible(false);
      }, 1500);
    }
  };

  const handleSendMouseLeave = () => {
    if (sendTooltipTimeoutRef.current) {
      globalThis.clearTimeout(sendTooltipTimeoutRef.current);
    }
    setIsSendTooltipVisible(false);
    setAllowSendTooltip(true);
  };

  const handleReceiveMouseEnter = () => {
    if (allowReceiveTooltip) {
      const buttonRect = receiveButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setIsReceiveTooltipVisible(true);
      }

      if (receiveTooltipTimeoutRef.current) {
        globalThis.clearTimeout(receiveTooltipTimeoutRef.current);
      }

      receiveTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsReceiveTooltipVisible(false);
      }, 1500);
    }
  };

  const handleReceiveMouseLeave = () => {
    if (receiveTooltipTimeoutRef.current) {
      globalThis.clearTimeout(receiveTooltipTimeoutRef.current);
    }
    setIsReceiveTooltipVisible(false);
    setAllowReceiveTooltip(true);
  };

  const handleHistoryMouseEnter = () => {
    if (allowHistoryTooltip) {
      const buttonRect = historyButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setIsHistoryTooltipVisible(true);
      }

      if (historyTooltipTimeoutRef.current) {
        globalThis.clearTimeout(historyTooltipTimeoutRef.current);
      }

      historyTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsHistoryTooltipVisible(false);
      }, 1500);
    }
  };

  const handleHistoryMouseLeave = () => {
    if (historyTooltipTimeoutRef.current) {
      globalThis.clearTimeout(historyTooltipTimeoutRef.current);
    }
    setIsHistoryTooltipVisible(false);
    setAllowHistoryTooltip(true);
  };

  const handleBalanceMouseEnter = () => {
    if (allowBalanceTooltip) {
      const buttonRect = balanceButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setIsBalanceTooltipVisible(true);
      }

      if (balanceTooltipTimeoutRef.current) {
        globalThis.clearTimeout(balanceTooltipTimeoutRef.current);
      }

      balanceTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsBalanceTooltipVisible(false);
      }, 1500);
    }
  };

  const handleBalanceMouseLeave = () => {
    if (balanceTooltipTimeoutRef.current) {
      globalThis.clearTimeout(balanceTooltipTimeoutRef.current);
    }
    setIsBalanceTooltipVisible(false);
    setAllowBalanceTooltip(true);
  };

  return (
    <div class="w-full dark-gradient flex flex-col justify-between p-6">
      <div class="flex justify-between">
        <div class={`${hideBalance ? "blur-sm" : ""}`}>
          <p class="text-stamp-grey-light font-extralight text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl select-none">
            <span class="font-bold">
              {hideBalance ? "*********" : walletData.balance}
            </span>{" "}
            BTC
          </p>
          <p class="text-stamp-grey font-extralight text-base mobileMd:text-lg mobileLg:text-xl desktop:text-2xl select-none pt-[3px]">
            <span class="font-medium">
              {hideBalance ? "*****" : walletData.usdValue.toLocaleString()}
            </span>{" "}
            USD
          </p>
        </div>
        <button
          ref={balanceButtonRef}
          class="mb-7 mobileMd:mb-8 mobileLg:mb-9 tablet:mb-10 desktop:mb-11"
          onClick={() => {
            setHideBalance(!hideBalance);
            setIsBalanceTooltipVisible(false);
            setAllowBalanceTooltip(false);
          }}
          onMouseEnter={handleBalanceMouseEnter}
          onMouseLeave={handleBalanceMouseLeave}
        >
          {hideBalance
            ? (
              <div class="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px] fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
                  viewBox="0 0 32 32"
                  role="button"
                  aria-label="Show Balance"
                >
                  <path d="M6.73999 4.32752C6.65217 4.22853 6.54558 4.14795 6.42639 4.09046C6.3072 4.03297 6.17778 3.9997 6.04564 3.99259C5.91351 3.98549 5.78127 4.00467 5.6566 4.04905C5.53193 4.09342 5.41731 4.1621 5.31938 4.2511C5.22144 4.3401 5.14215 4.44765 5.08609 4.56752C5.03003 4.68739 4.99832 4.81719 4.9928 4.94941C4.98727 5.08162 5.00804 5.21362 5.05391 5.33775C5.09978 5.46187 5.16982 5.57567 5.25999 5.67252L7.66499 8.31877C3.12499 11.105 1.17249 15.4 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0013C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5063 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C18.2408 26.0128 20.4589 25.5514 22.5087 24.6463L25.2587 27.6725C25.3466 27.7715 25.4531 27.8521 25.5723 27.9096C25.6915 27.9671 25.8209 28.0003 25.9531 28.0075C26.0852 28.0146 26.2175 27.9954 26.3421 27.951C26.4668 27.9066 26.5814 27.8379 26.6793 27.7489C26.7773 27.66 26.8566 27.5524 26.9126 27.4325C26.9687 27.3127 27.0004 27.1829 27.0059 27.0506C27.0115 26.9184 26.9907 26.7864 26.9448 26.6623C26.899 26.5382 26.8289 26.4244 26.7387 26.3275L6.73999 4.32752ZM12.6562 13.8075L17.865 19.5388C17.0806 19.9514 16.1814 20.0919 15.3085 19.9381C14.4357 19.7843 13.6386 19.3449 13.0425 18.689C12.4464 18.0331 12.085 17.1978 12.0151 16.3143C11.9452 15.4308 12.1707 14.549 12.6562 13.8075ZM16 24C12.1525 24 8.79124 22.6013 6.00874 19.8438C4.86663 18.7087 3.89526 17.414 3.12499 16C3.71124 14.9013 5.58249 11.8263 9.04374 9.82752L11.2937 12.2963C10.4227 13.4119 9.97403 14.7996 10.0272 16.214C10.0803 17.6284 10.6317 18.9785 11.584 20.0257C12.5363 21.0728 13.8282 21.7496 15.2312 21.9363C16.6343 22.1231 18.0582 21.8078 19.2512 21.0463L21.0925 23.0713C19.4675 23.6947 17.7405 24.0097 16 24ZM16.75 12.0713C16.4894 12.0215 16.2593 11.8703 16.1102 11.6509C15.9611 11.4315 15.9053 11.1618 15.955 10.9013C16.0047 10.6407 16.1559 10.4105 16.3753 10.2615C16.5948 10.1124 16.8644 10.0565 17.125 10.1063C18.3995 10.3534 19.56 11.0058 20.4333 11.9664C21.3067 12.9269 21.8462 14.1441 21.9712 15.4363C21.9959 15.7003 21.9147 15.9634 21.7455 16.1676C21.5762 16.3717 21.3328 16.5003 21.0687 16.525C21.0375 16.5269 21.0062 16.5269 20.975 16.525C20.725 16.5261 20.4838 16.4335 20.2987 16.2656C20.1136 16.0976 19.9981 15.8664 19.975 15.6175C19.8908 14.758 19.5315 13.9486 18.9504 13.3097C18.3694 12.6708 17.5977 12.2364 16.75 12.0713ZM30.91 16.4075C30.8575 16.525 29.5912 19.3288 26.74 21.8825C26.6426 21.9726 26.5282 22.0423 26.4036 22.0877C26.2789 22.1331 26.1465 22.1533 26.014 22.147C25.8814 22.1407 25.7515 22.1082 25.6317 22.0512C25.5119 21.9942 25.4047 21.9139 25.3162 21.8151C25.2277 21.7162 25.1598 21.6008 25.1163 21.4754C25.0729 21.3501 25.0549 21.2173 25.0633 21.0849C25.0716 20.9525 25.1063 20.8231 25.1652 20.7043C25.2241 20.5854 25.306 20.4794 25.4062 20.3925C26.8051 19.1358 27.9801 17.6505 28.8812 16C28.1093 14.5847 27.1358 13.2891 25.9912 12.1538C23.2087 9.39877 19.8475 8.00002 16 8.00002C15.1893 7.99903 14.3799 8.06467 13.58 8.19627C13.4499 8.21928 13.3166 8.21628 13.1876 8.18745C13.0587 8.15863 12.9368 8.10454 12.8289 8.02833C12.721 7.95211 12.6293 7.85527 12.559 7.7434C12.4887 7.63153 12.4413 7.50685 12.4196 7.37656C12.3978 7.24627 12.402 7.11295 12.432 6.9843C12.462 6.85566 12.5172 6.73424 12.5945 6.62705C12.6717 6.51986 12.7694 6.42904 12.8819 6.35982C12.9944 6.2906 13.1195 6.24436 13.25 6.22377C14.1589 6.07369 15.0787 5.99885 16 6.00002C20.36 6.00002 24.3212 7.65752 27.4575 10.7938C29.8112 13.1475 30.87 15.4963 30.9137 15.595C30.9706 15.7229 31 15.8613 31 16.0013C31 16.1412 30.9706 16.2796 30.9137 16.4075H30.91Z" />
                </svg>
                <div
                  class={`${tooltipIcon} ${
                    isBalanceTooltipVisible ? "block" : "hidden"
                  }`}
                >
                  SHOW BALANCE
                </div>
              </div>
            )
            : (
              <div class="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px] fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
                  viewBox="0 0 32 32"
                  role="button"
                  aria-label="Hide Balance"
                >
                  <path d="M30.9137 15.595C30.87 15.4963 29.8112 13.1475 27.4575 10.7937C24.3212 7.6575 20.36 6 16 6C11.64 6 7.67874 7.6575 4.54249 10.7937C2.18874 13.1475 1.12499 15.5 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C20.36 26 24.3212 24.3425 27.4575 21.2075C29.8112 18.8538 30.87 16.5062 30.9137 16.4075C30.9706 16.2796 31 16.1412 31 16.0012C31 15.8613 30.9706 15.7229 30.9137 15.595ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86704 18.7084 3.89572 17.4137 3.12499 16C3.89551 14.5862 4.86686 13.2915 6.00874 12.1562C8.79124 9.39875 12.1525 8 16 8C19.8475 8 23.2087 9.39875 25.9912 12.1562C27.1352 13.2912 28.1086 14.5859 28.8812 16C27.98 17.6825 24.0537 24 16 24ZM16 10C14.8133 10 13.6533 10.3519 12.6666 11.0112C11.6799 11.6705 10.9108 12.6075 10.4567 13.7039C10.0026 14.8003 9.88377 16.0067 10.1153 17.1705C10.3468 18.3344 10.9182 19.4035 11.7573 20.2426C12.5965 21.0818 13.6656 21.6532 14.8294 21.8847C15.9933 22.1162 17.1997 21.9974 18.2961 21.5433C19.3924 21.0892 20.3295 20.3201 20.9888 19.3334C21.6481 18.3467 22 17.1867 22 16C21.9983 14.4092 21.3657 12.884 20.2408 11.7592C19.1159 10.6343 17.5908 10.0017 16 10ZM16 20C15.2089 20 14.4355 19.7654 13.7777 19.3259C13.1199 18.8864 12.6072 18.2616 12.3045 17.5307C12.0017 16.7998 11.9225 15.9956 12.0768 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6122 14.4437 12.2312 15.2196 12.0769C15.9956 11.9225 16.7998 12.0017 17.5307 12.3045C18.2616 12.6072 18.8863 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0609 19.5786 18.0783 18.8284 18.8284C18.0783 19.5786 17.0609 20 16 20Z" />
                </svg>
                <div
                  class={`${tooltipIcon} ${
                    isBalanceTooltipVisible ? "block" : "hidden"
                  }`}
                >
                  HIDE BALANCE
                </div>
              </div>
            )}
        </button>
      </div>
      <div class="flex justify-between pt-3">
        <div class="flex items-center">
          <p class="text-stamp-primary font-medium select-none text-base mobileLg:text-lg desktop:text-xl hidden mobileLg:block">
            {walletData.address}
          </p>
          <p class="text-stamp-primary font-medium select-none text-base mobileLg:text-lg desktop:text-xl block mobileLg:hidden">
            {abbreviateAddress(walletData.address, 8)}
          </p>
        </div>
        <div class="flex gap-[9px] mobileLg:gap-3 pt-1">
          <div
            ref={copyButtonRef}
            class="relative"
            onMouseEnter={handleCopyMouseEnter}
            onMouseLeave={handleCopyMouseLeave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              class="w-[18px] h-[18px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
              viewBox="0 0 32 32"
              role="button"
              aria-label="Copy"
              onClick={copy}
            >
              <path d="M27 4H11C10.7348 4 10.4804 4.10536 10.2929 4.29289C10.1054 4.48043 10 4.73478 10 5V10H5C4.73478 10 4.48043 10.1054 4.29289 10.2929C4.10536 10.4804 4 10.7348 4 11V27C4 27.2652 4.10536 27.5196 4.29289 27.7071C4.48043 27.8946 4.73478 28 5 28H21C21.2652 28 21.5196 27.8946 21.7071 27.7071C21.8946 27.5196 22 27.2652 22 27V22H27C27.2652 22 27.5196 21.8946 27.7071 21.7071C27.8946 21.5196 28 21.2652 28 21V5C28 4.73478 27.8946 4.48043 27.7071 4.29289C27.5196 4.10536 27.2652 4 27 4ZM20 26H6V12H20V26ZM26 20H22V11C22 10.7348 21.8946 10.4804 21.7071 10.2929C21.5196 10.1054 21.2652 10 21 10H12V6H26V20Z" />
            </svg>
            <div
              class={`${tooltipIcon} ${
                (isTooltipVisible || showCopied) ? "block" : "hidden"
              }`}
            >
              {showCopied ? "COPIED" : "COPY"}
            </div>
          </div>
          <div
            ref={sendButtonRef}
            class="relative group"
            onMouseEnter={handleSendMouseEnter}
            onMouseLeave={handleSendMouseLeave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              class="w-[18px] h-[18px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
              viewBox="0 0 32 32"
              role="button"
              aria-label="Send"
              onClick={() => {
                setIsSendTooltipVisible(false);
                onSend();
              }}
            >
              <path d="M28 13C28 13.2652 27.8946 13.5196 27.7071 13.7071C27.5196 13.8946 27.2652 14 27 14C26.7348 14 26.4804 13.8946 26.2929 13.7071C26.1054 13.5196 26 13.2652 26 13V7.415L17.7087 15.7075C17.5211 15.8951 17.2666 16.0006 17.0012 16.0006C16.7359 16.0006 16.4814 15.8951 16.2938 15.7075C16.1061 15.5199 16.0007 15.2654 16.0007 15C16.0007 14.7346 16.1061 14.4801 16.2938 14.2925L24.585 6H19C18.7348 6 18.4804 5.89464 18.2929 5.70711C18.1054 5.51957 18 5.26522 18 5C18 4.73478 18.1054 4.48043 18.2929 4.29289C18.4804 4.10536 18.7348 4 19 4H27C27.2652 4 27.5196 4.10536 27.7071 4.29289C27.8946 4.48043 28 4.73478 28 5V13ZM23 16C22.7348 16 22.4804 16.1054 22.2929 16.2929C22.1054 16.4804 22 16.7348 22 17V26H6V10H15C15.2652 10 15.5196 9.89464 15.7071 9.70711C15.8946 9.51957 16 9.26522 16 9C16 8.73478 15.8946 8.48043 15.7071 8.29289C15.5196 8.10536 15.2652 8 15 8H6C5.46957 8 4.96086 8.21071 4.58579 8.58579C4.21071 8.96086 4 9.46957 4 10V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H22C22.5304 28 23.0391 27.7893 23.4142 27.4142C23.7893 27.0391 24 26.5304 24 26V17C24 16.7348 23.8946 16.4804 23.7071 16.2929C23.5196 16.1054 23.2652 16 23 16Z" />
            </svg>
            <div
              class={`${tooltipIcon} ${
                isSendTooltipVisible ? "block" : "hidden"
              }`}
            >
              SEND
            </div>
          </div>
          <div
            ref={receiveButtonRef}
            class="relative group"
            onMouseEnter={handleReceiveMouseEnter}
            onMouseLeave={handleReceiveMouseLeave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              class="w-[18px] h-[18px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
              viewBox="0 0 32 32"
              role="button"
              aria-label="Receive"
              onClick={() => {
                setIsReceiveTooltipVisible(false);
                onReceive();
              }}
            >
              <path d="M16 17V25C16 25.2652 15.8946 25.5196 15.7071 25.7071C15.5196 25.8946 15.2652 26 15 26C14.7348 26 14.4804 25.8946 14.2929 25.7071C14.1054 25.5196 14 25.2652 14 25V19.415L5.70751 27.7075C5.6146 27.8004 5.5043 27.8741 5.3829 27.9244C5.26151 27.9747 5.1314 28.0006 5.00001 28.0006C4.86861 28.0006 4.7385 27.9747 4.61711 27.9244C4.49572 27.8741 4.38542 27.8004 4.29251 27.7075C4.1996 27.6146 4.1259 27.5043 4.07561 27.3829C4.02533 27.2615 3.99945 27.1314 3.99945 27C3.99945 26.8686 4.02533 26.7385 4.07561 26.6171C4.1259 26.4957 4.1996 26.3854 4.29251 26.2925L12.585 18H7.00001C6.73479 18 6.48044 17.8946 6.2929 17.7071C6.10536 17.5196 6.00001 17.2652 6.00001 17C6.00001 16.7348 6.10536 16.4804 6.2929 16.2929C6.48044 16.1054 6.73479 16 7.00001 16H15C15.2652 16 15.5196 16.1054 15.7071 16.2929C15.8946 16.4804 16 16.7348 16 17ZM26 4H10C9.46957 4 8.96087 4.21071 8.58579 4.58579C8.21072 4.96086 8.00001 5.46957 8.00001 6V12C8.00001 12.2652 8.10536 12.5196 8.2929 12.7071C8.48044 12.8946 8.73479 13 9.00001 13C9.26522 13 9.51958 12.8946 9.70711 12.7071C9.89465 12.5196 10 12.2652 10 12V6H26V22H20C19.7348 22 19.4804 22.1054 19.2929 22.2929C19.1054 22.4804 19 22.7348 19 23C19 23.2652 19.1054 23.5196 19.2929 23.7071C19.4804 23.8946 19.7348 24 20 24H26C26.5304 24 27.0391 23.7893 27.4142 23.4142C27.7893 23.0391 28 22.5304 28 22V6C28 5.46957 27.7893 4.96086 27.4142 4.58579C27.0391 4.21071 26.5304 4 26 4Z" />
            </svg>
            <div
              class={`${tooltipIcon} ${
                isReceiveTooltipVisible ? "block" : "hidden"
              }`}
            >
              RECEIVE
            </div>
          </div>
          <div
            ref={historyButtonRef}
            class="relative group"
            onMouseEnter={handleHistoryMouseEnter}
            onMouseLeave={handleHistoryMouseLeave}
          >
            <a
              href={`https://mempool.space/address/${walletData.address}`}
              target="_blank"
              onClick={() => setIsHistoryTooltipVisible(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                class="w-[18px] h-[18px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
                viewBox="0 0 32 32"
                role="button"
                aria-label="History"
              >
                <path d="M17 10V15.4338L21.515 18.1425C21.7424 18.2791 21.9063 18.5005 21.9705 18.7579C22.0347 19.0152 21.9941 19.2876 21.8575 19.515C21.7209 19.7425 21.4996 19.9063 21.2422 19.9705C20.9848 20.0348 20.7124 19.9941 20.485 19.8575L15.485 16.8575C15.337 16.7686 15.2146 16.6429 15.1296 16.4927C15.0446 16.3424 14.9999 16.1727 15 16V10C15 9.73482 15.1054 9.48047 15.2929 9.29293C15.4804 9.10539 15.7348 9.00004 16 9.00004C16.2652 9.00004 16.5196 9.10539 16.7071 9.29293C16.8946 9.48047 17 9.73482 17 10ZM16 4.00004C14.4225 3.99611 12.8599 4.30508 11.4026 4.90907C9.94527 5.51306 8.62222 6.40008 7.51 7.51879C6.60125 8.43879 5.79375 9.32379 5 10.25V8.00004C5 7.73482 4.89464 7.48047 4.70711 7.29293C4.51957 7.10539 4.26522 7.00004 4 7.00004C3.73478 7.00004 3.48043 7.10539 3.29289 7.29293C3.10536 7.48047 3 7.73482 3 8.00004V13C3 13.2653 3.10536 13.5196 3.29289 13.7071C3.48043 13.8947 3.73478 14 4 14H9C9.26522 14 9.51957 13.8947 9.70711 13.7071C9.89464 13.5196 10 13.2653 10 13C10 12.7348 9.89464 12.4805 9.70711 12.2929C9.51957 12.1054 9.26522 12 9 12H6.125C7.01875 10.9475 7.90875 9.95629 8.92375 8.92879C10.3136 7.53898 12.0821 6.58955 14.0085 6.19913C15.9348 5.80872 17.9335 5.99463 19.7547 6.73364C21.576 7.47266 23.1391 8.73199 24.2487 10.3543C25.3584 11.9766 25.9653 13.8899 25.9938 15.8552C26.0222 17.8205 25.4708 19.7506 24.4086 21.4043C23.3463 23.0581 21.8203 24.3621 20.0212 25.1535C18.2221 25.9448 16.2296 26.1885 14.2928 25.854C12.356 25.5194 10.5607 24.6216 9.13125 23.2725C9.03571 23.1823 8.92333 23.1117 8.80052 23.0648C8.6777 23.018 8.54686 22.9958 8.41547 22.9995C8.28407 23.0032 8.15469 23.0328 8.03472 23.0865C7.91475 23.1402 7.80653 23.217 7.71625 23.3125C7.62597 23.4081 7.55538 23.5205 7.50853 23.6433C7.46168 23.7661 7.43948 23.8969 7.44319 24.0283C7.44691 24.1597 7.47647 24.2891 7.53018 24.4091C7.58389 24.529 7.66071 24.6373 7.75625 24.7275C9.18056 26.0716 10.9122 27.0467 12.8 27.5677C14.6878 28.0886 16.6744 28.1396 18.5865 27.7162C20.4986 27.2929 22.278 26.4079 23.7694 25.1387C25.2608 23.8695 26.4189 22.2545 27.1427 20.4348C27.8664 18.6151 28.1338 16.6459 27.9215 14.699C27.7091 12.7522 27.0236 10.8869 25.9246 9.26595C24.8256 7.64501 23.3466 6.31766 21.6166 5.39977C19.8867 4.48187 17.9584 4.00131 16 4.00004Z" />
              </svg>
            </a>
            <div
              class={`${tooltipIcon} ${
                isHistoryTooltipVisible ? "block" : "hidden"
              }`}
            >
              HISTORY
            </div>
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
  }: WalletStatsProps,
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
      />
      <DispenserStats dispensers={dispensers} handleType={handleType} />
      <TokenStats src20Total={src20Total} handleType={handleType} />
    </div>
  );
}

function StampStats(
  { stampsTotal, stampsCreated, handleType }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
  },
) {
  return (
    <div
      class="w-full dark-gradient p-6 flex flex-col gap-6 rounded-md"
      onClick={() => handleType("stamp")}
    >
      <div class="flex justify-between">
        <StatItem label="STAMPS" value={stampsTotal.toString()} />
        <StatItem
          label="BY ME"
          value={stampsCreated.toString()}
          align="right"
        />
      </div>
    </div>
  );
}

function DispenserStats(
  { handleType, dispensers = { open: 0, closed: 0, total: 0 } }: {
    handleType: (type: string) => void;
    dispensers?: { open: number; closed: number; total: number };
  },
) {
  return (
    <div
      class="flex flex-col w-full dark-gradient p-6 gap-6 rounded-md"
      onClick={() => handleType("dispenser")}
    >
      <div class="flex justify-between">
        <StatItem
          label="LISTINGS"
          value={dispensers.open.toString()}
          align="left"
        />
        <div class="hidden mobileMd:block">
          <StatItem label="ATOMIC" value="N/A" align="center" />
        </div>
        <StatItem
          label="SOLD"
          value={dispensers.closed.toString()}
          align="right"
        />
      </div>
    </div>
  );
}

function TokenStats(
  { src20Total, handleType }: {
    src20Total: number;
    handleType: (type: string) => void;
  },
) {
  return (
    <div
      class="flex justify-between w-full dark-gradient p-6 gap-6 rounded-md"
      onClick={() => handleType("token")}
    >
      <StatItem label="TOKENS" value={src20Total.toString()} />
      <StatItem
        label="VALUE"
        value={
          <>
            <span class="font-light">
              N/A
            </span>&nbsp;<span class="font-extralight">BTC</span>
          </>
        }
        align="right"
      />
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
}

function StatItem({ label, value, align = "left" }: StatItemProps) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div class={`${dataColumn}`}>
      <p
        class={`${dataLabel}  ${alignmentClass}`}
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

export default WalletDetails;
