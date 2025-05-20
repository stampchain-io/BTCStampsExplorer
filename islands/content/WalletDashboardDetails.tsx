/* ===== WALLET DASHBOARD DETAILS COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";
import SendBTCModal from "$islands/modal/SendBTCModal.tsx";
import RecieveAddyModal from "$islands/modal/RecieveAddyModal.tsx";
import { WalletOverviewInfo } from "$lib/types/index.d.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { StatItem, StatTitle } from "$components/section/WalletComponents.tsx";
import { containerBackground } from "$layout";
import { titleGreyLD } from "$text";
import { tooltipIcon } from "$notification";
import { openModal } from "$islands/modal/states.ts";

/* ===== TYPES ===== */
interface WalletDashboardDetailsProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

/* ===== WALLET OVERVIEW SUBCOMPONENT ===== */
function WalletOverview(
  { walletData, onSend, onReceive }: {
    walletData: WalletOverviewInfo;
    onSend: () => void;
    onReceive: () => void;
  },
) {
  /* ===== STATE ===== */
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [showCopied, setShowCopied] = useState(false);
  const [tooltipText, setTooltipText] = useState("HIDE BALANCE");

  /* ===== TOOLTIP STATES ===== */
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const [isSendTooltipVisible, setIsSendTooltipVisible] = useState(false);
  const [allowSendTooltip, setAllowSendTooltip] = useState(true);
  const [isReceiveTooltipVisible, setIsReceiveTooltipVisible] = useState(false);
  const [allowReceiveTooltip, setAllowReceiveTooltip] = useState(true);
  const [isHistoryTooltipVisible, setIsHistoryTooltipVisible] = useState(false);
  const [allowHistoryTooltip, setAllowHistoryTooltip] = useState(true);
  const [isBalanceTooltipVisible, setIsBalanceTooltipVisible] = useState(false);
  const [allowBalanceTooltip, setAllowBalanceTooltip] = useState(true);

  /* ===== REFS ===== */
  const copyButtonRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const sendButtonRef = useRef<HTMLDivElement>(null);
  const sendTooltipTimeoutRef = useRef<number | null>(null);
  const receiveButtonRef = useRef<HTMLDivElement>(null);
  const receiveTooltipTimeoutRef = useRef<number | null>(null);
  const historyButtonRef = useRef<HTMLDivElement>(null);
  const historyTooltipTimeoutRef = useRef<number | null>(null);
  const balanceButtonRef = useRef<HTMLButtonElement>(null);
  const balanceTooltipTimeoutRef = useRef<number | null>(null);

  /* ===== EFFECTS ===== */
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
      if (sendTooltipTimeoutRef.current) {
        globalThis.clearTimeout(sendTooltipTimeoutRef.current);
      }

      sendTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = sendButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsSendTooltipVisible(true);
        }
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
      if (receiveTooltipTimeoutRef.current) {
        globalThis.clearTimeout(receiveTooltipTimeoutRef.current);
      }

      receiveTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = receiveButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsReceiveTooltipVisible(true);
        }
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
      if (historyTooltipTimeoutRef.current) {
        globalThis.clearTimeout(historyTooltipTimeoutRef.current);
      }

      historyTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = historyButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsHistoryTooltipVisible(true);
        }
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
      // Set tooltip text based on current state when mouse enters
      setTooltipText(hideBalance ? "SHOW BALANCE" : "HIDE BALANCE");

      if (balanceTooltipTimeoutRef.current) {
        globalThis.clearTimeout(balanceTooltipTimeoutRef.current);
      }

      balanceTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = balanceButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsBalanceTooltipVisible(true);
        }
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

  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col">
      <div className="flex justify-between">
        <div className={`${hideBalance ? "blur-sm" : ""}`}>
          <h6 class="text-stamp-grey-light font-extralight text-2xl mobileMd:text-3xl mobileLg:text-4xl select-none">
            <span class="font-bold">
              {hideBalance ? "*********" : walletData.balance}
            </span>{" "}
            BTC
          </h6>
          <h6 class="text-stamp-grey font-extralight text-base mobileMd:text-lg mobileLg:text-xl select-none pt-[3px]">
            <span class="font-medium">
              {hideBalance ? "*****" : walletData.usdValue.toLocaleString()}
            </span>{" "}
            USD
          </h6>
        </div>
        <button
          type="button"
          ref={balanceButtonRef}
          class="mb-7 mobileMd:mb-[34px]"
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
                  viewBox="0 0 32 32"
                  class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
                  role="button"
                  aria-label="Show Balance"
                >
                  <path d="M6.73999 4.32752C6.65217 4.22853 6.54558 4.14795 6.42639 4.09046C6.3072 4.03297 6.17778 3.9997 6.04564 3.99259C5.91351 3.98549 5.78127 4.00467 5.6566 4.04905C5.53193 4.09342 5.41731 4.1621 5.31938 4.2511C5.22144 4.3401 5.14215 4.44765 5.08609 4.56752C5.03003 4.68739 4.99832 4.81719 4.9928 4.94941C4.98727 5.08162 5.00804 5.21362 5.05391 5.33775C5.09978 5.46187 5.16982 5.57567 5.25999 5.67252L7.66499 8.31877C3.12499 11.105 1.17249 15.4 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0013C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5063 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C18.2408 26.0128 20.4589 25.5514 22.5087 24.6463L25.2587 27.6725C25.3466 27.7715 25.4531 27.8521 25.5723 27.9096C25.6915 27.9671 25.8209 28.0003 25.9531 28.0075C26.0852 28.0146 26.2175 27.9954 26.3421 27.951C26.4668 27.9066 26.5814 27.8379 26.6793 27.7489C26.7773 27.66 26.8566 27.5524 26.9126 27.4325C26.9687 27.3127 27.0004 27.1829 27.0059 27.0506C27.0115 26.9184 26.9907 26.7864 26.9448 26.6623C26.899 26.5382 26.8289 26.4244 26.7387 26.3275L6.73999 4.32752ZM12.6562 13.8075L17.865 19.5388C17.0806 19.9514 16.1814 20.0919 15.3085 19.9381C14.4357 19.7843 13.6386 19.3449 13.0425 18.689C12.4464 18.0331 12.085 17.1978 12.0151 16.3143C11.9452 15.4308 12.1707 14.549 12.6562 13.8075ZM16 24C12.1525 24 8.79124 22.6013 6.00874 19.8438C4.86663 18.7087 3.89526 17.414 3.12499 16C3.71124 14.9013 5.58249 11.8263 9.04374 9.82752L11.2937 12.2963C10.4227 13.4119 9.97403 14.7996 10.0272 16.214C10.0803 17.6284 10.6317 18.9785 11.584 20.0257C12.5363 21.0728 13.8282 21.7496 15.2312 21.9363C16.6343 22.1231 18.0582 21.8078 19.2512 21.0463L21.0925 23.0713C19.4675 23.6947 17.7405 24.0097 16 24ZM16.75 12.0713C16.4894 12.0215 16.2593 11.8703 16.1102 11.6509C15.9611 11.4315 15.9053 11.1618 15.955 10.9013C16.0047 10.6407 16.1559 10.4105 16.3753 10.2615C16.5948 10.1124 16.8644 10.0565 17.125 10.1063C18.3995 10.3534 19.56 11.0058 20.4333 11.9664C21.3067 12.9269 21.8462 14.1441 21.9712 15.4363C21.9959 15.7003 21.9147 15.9634 21.7455 16.1676C21.5762 16.3717 21.3328 16.5003 21.0687 16.525C21.0375 16.5269 21.0062 16.5269 20.975 16.525C20.725 16.5261 20.4838 16.4335 20.2987 16.2656C20.1136 16.0976 19.9981 15.8664 19.975 15.6175C19.8908 14.758 19.5315 13.9486 18.9504 13.3097C18.3694 12.6708 17.5977 12.2364 16.75 12.0713ZM30.91 16.4075C30.8575 16.525 29.5912 19.3288 26.74 21.8825C26.6426 21.9726 26.5282 22.0423 26.4036 22.0877C26.2789 22.1331 26.1465 22.1533 26.014 22.147C25.8814 22.1407 25.7515 22.1082 25.6317 22.0512C25.5119 21.9942 25.4047 21.9139 25.3162 21.8151C25.2277 21.7162 25.1598 21.6008 25.1163 21.4754C25.0729 21.3501 25.0549 21.2173 25.0633 21.0849C25.0716 20.9525 25.1063 20.8231 25.1652 20.7043C25.2241 20.5854 25.306 20.4794 25.4062 20.3925C26.8051 19.1358 27.9801 17.6505 28.8812 16C28.1093 14.5847 27.1358 13.2891 25.9912 12.1538C23.2087 9.39877 19.8475 8.00002 16 8.00002C15.1893 7.99903 14.3799 8.06467 13.58 8.19627C13.4499 8.21928 13.3166 8.21628 13.1876 8.18745C13.0587 8.15863 12.9368 8.10454 12.8289 8.02833C12.721 7.95211 12.6293 7.85527 12.559 7.7434C12.4887 7.63153 12.4413 7.50685 12.4196 7.37656C12.3978 7.24627 12.402 7.11295 12.432 6.9843C12.462 6.85566 12.5172 6.73424 12.5945 6.62705C12.6717 6.51986 12.7694 6.42904 12.8819 6.35982C12.9944 6.2906 13.1195 6.24436 13.25 6.22377C14.1589 6.07369 15.0787 5.99885 16 6.00002C20.36 6.00002 24.3212 7.65752 27.4575 10.7938C29.8112 13.1475 30.87 15.4963 30.9137 15.595C30.9706 15.7229 31 15.8613 31 16.0013C31 16.1412 30.9706 16.2796 30.9137 16.4075H30.91Z" />
                </svg>
                <div
                  class={`${tooltipIcon} ${
                    isBalanceTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {tooltipText}
                </div>
              </div>
            )
            : (
              <div class="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
                  role="button"
                  aria-label="Hide Balance"
                >
                  <path d="M30.9137 15.595C30.87 15.4963 29.8112 13.1475 27.4575 10.7937C24.3212 7.6575 20.36 6 16 6C11.64 6 7.67874 7.6575 4.54249 10.7937C2.18874 13.1475 1.12499 15.5 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C20.36 26 24.3212 24.3425 27.4575 21.2075C29.8112 18.8538 30.87 16.5062 30.9137 16.4075C30.9706 16.2796 31 16.1412 31 16.0012C31 15.8613 30.9706 15.7229 30.9137 15.595ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86704 18.7084 3.89572 17.4137 3.12499 16C3.89551 14.5862 4.86686 13.2915 6.00874 12.1562C8.79124 9.39875 12.1525 8 16 8C19.8475 8 23.2087 9.39875 25.9912 12.1562C27.1352 13.2912 28.1086 14.5859 28.8812 16C27.98 17.6825 24.0537 24 16 24ZM16 10C14.8133 10 13.6533 10.3519 12.6666 11.0112C11.6799 11.6705 10.9108 12.6075 10.4567 13.7039C10.0026 14.8003 9.88377 16.0067 10.1153 17.1705C10.3468 18.3344 10.9182 19.4035 11.7573 20.2426C12.5965 21.0818 13.6656 21.6532 14.8294 21.8847C15.9933 22.1162 17.1997 21.9974 18.2961 21.5433C19.3924 21.0892 20.3295 20.3201 20.9888 19.3334C21.6481 18.3467 22 17.1867 22 16C21.9983 14.4092 21.3657 12.884 20.2408 11.7592C19.1159 10.6343 17.5908 10.0017 16 10ZM16 20C15.2089 20 14.4355 19.7654 13.7777 19.3259C13.1199 18.8864 12.6072 18.2616 12.3045 17.5307C12.0017 16.7998 11.9225 15.9956 12.0768 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6122 14.4437 12.2312 15.2196 12.0769C15.9956 11.9225 16.7998 12.0017 17.5307 12.3045C18.2616 12.6072 18.8863 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0609 19.5786 18.0783 18.8284 18.8284C18.0783 19.5786 17.0609 20 16 20Z" />
                </svg>
                <div
                  class={`${tooltipIcon} ${
                    isBalanceTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {tooltipText}
                </div>
              </div>
            )}
        </button>
      </div>

      <div class="flex items-center pt-3 mobileMd:pt-6 text-base mobileLg:text-lg text-stamp-purple font-medium select-none">
        <h6 class="hidden tablet:block">
          {abbreviateAddress(walletData.address, 12)}
        </h6>
        <h6 class="hidden mobileLg:block tablet:hidden">
          {abbreviateAddress(walletData.address, 10)}
        </h6>
        <h6 class="block mobileLg:hidden">
          {abbreviateAddress(walletData.address, 8)}
        </h6>
      </div>
      <div class="flex pt-[3px] mobileMd:pt-1.5 gap-3 mobileLg:gap-[9px]">
        <div
          ref={copyButtonRef}
          class="relative"
          onMouseEnter={handleCopyMouseEnter}
          onMouseLeave={handleCopyMouseLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-purple hover:fill-stamp-purple-bright cursor-pointer"
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
        <div
          ref={sendButtonRef}
          class="relative group"
          onMouseEnter={handleSendMouseEnter}
          onMouseLeave={handleSendMouseLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-purple hover:fill-stamp-purple-bright cursor-pointer"
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
              isSendTooltipVisible ? "opacity-100" : "opacity-0"
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
            viewBox="0 0 32 32"
            class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 rotate-180 fill-stamp-purple hover:fill-stamp-purple-bright cursor-pointer"
            role="button"
            aria-label="Receive"
            onClick={() => {
              setIsReceiveTooltipVisible(false);
              onReceive();
            }}
          >
            <path d="M16 17V25C16 25.2652 15.8946 25.5196 15.7071 25.7071C15.5196 25.8946 15.2652 26 15 26C14.7348 26 14.4804 25.8946 14.2929 25.7071C14.1054 25.5196 14 25.2652 14 25V19.415L5.70751 27.7075C5.6146 27.8004 5.5043 27.8741 5.3829 27.9244C5.26151 27.9747 5.1314 28.0006 5.00001 28.0006C4.86861 28.0006 4.7385 27.9747 4.61711 27.9244C4.49572 27.8741 4.38542 27.8004 4.29251 27.7075C4.1996 27.6146 4.1259 27.5043 4.07561 27.3829C4.02533 27.2615 3.99945 27.1314 3.99945 27C3.99945 26.8686 4.02533 26.7385 4.07561 26.6171C4.1259 26.4957 4.1996 26.3854 4.29251 26.2925L12.585 18H7.00001C6.73479 18 6.48044 17.8946 6.2929 17.7071C6.10536 17.5196 6.00001 17.2652 6.00001 17C6.00001 16.7348 6.10536 16.4804 6.2929 16.2929C6.48044 16.1054 6.73479 16 7.00001 16H15C15.2652 16 15.5196 16.1054 15.7071 16.2929C15.8946 16.4804 16 16.7348 16 17ZM26 4H10C9.46957 4 8.96087 4.21071 8.58579 4.58579C8.21072 4.96086 8.00001 5.46957 8.00001 6V12C8.00001 12.2652 8.10536 12.5196 8.2929 12.7071C8.48044 12.8946 8.73479 13 9.00001 13C9.26522 13 9.51958 12.8946 9.70711 12.7071C9.89465 12.5196 10 12.2653 10 13C10 13.2653 9.89464 13.5196 9.70711 13.7071C9.51957 13.8947 9.26522 14 9 14H4V6H26V22H20C19.7348 22 19.4804 22.1054 19.2929 22.2929C19.1054 22.4804 19 22.7348 19 23C19 23.2652 19.1054 23.5196 19.2929 23.7071C19.4804 23.8946 19.7348 24 20 24H26C26.5304 24 27.0391 23.7893 27.4142 23.4142C27.7893 23.0391 28 22.5304 28 22V6C28 5.46957 27.7893 4.96086 27.4142 4.58579C27.0391 4.21071 26.5304 4 26 4Z" />
          </svg>
          <div
            class={`${tooltipIcon} ${
              isReceiveTooltipVisible ? "opacity-100" : "opacity-0"
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
              viewBox="0 0 32 32"
              class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-purple hover:fill-stamp-purple-bright cursor-pointer"
              role="button"
              aria-label="History"
            >
              <path d="M17 10V15.4338L21.515 18.1425C21.7424 18.2791 21.9063 18.5005 21.9705 18.7579C22.0347 19.0152 21.9941 19.2876 21.8575 19.515C21.7209 19.7425 21.4996 19.9063 21.2422 19.9705C20.9848 20.0348 20.7124 19.9941 20.485 19.8575L15.485 16.8575C15.337 16.7686 15.2146 16.6429 15.1296 16.4927C15.0446 16.3424 14.9999 16.1727 15 16V10C15 9.73482 15.1054 9.48047 15.2929 9.29293C15.4804 9.10539 15.7348 9.00004 16 9.00004C16.2652 9.00004 16.5196 9.10539 16.7071 9.29293C16.8946 9.48047 17 9.73482 17 10ZM16 4.00004C14.4225 3.99611 12.8599 4.30508 11.4026 4.90907C9.94527 5.51306 8.62222 6.40008 7.51 7.51879C6.60125 8.43879 5.79375 9.32379 5 10.25V8.00004C5 7.73482 4.89464 7.48047 4.70711 7.29293C4.51957 7.10539 4.26522 7.00004 4 7.00004C3.73478 7.00004 3.48043 7.10539 3.29289 7.29293C3.10536 7.48047 3 7.73482 3 8.00004V13C3 13.2653 3.10536 13.5196 3.29289 13.7071C3.48043 13.8947 3.73478 14 4 14H9C9.26522 14 9.51957 13.8947 9.70711 13.7071C9.89464 13.5196 10 13.2653 10 13C10 12.7348 9.89464 12.4805 9.70711 12.2929C9.51957 12.1054 9.26522 12 9 12H6.125C7.01875 10.9475 7.90875 9.95629 8.92375 8.92879C10.3136 7.53898 12.0821 6.58955 14.0085 6.19913C15.9348 5.80872 17.9335 5.99463 19.7547 6.73364C21.576 7.47266 23.1391 8.73199 24.2487 10.3543C25.3584 11.9766 25.9653 13.8899 25.9938 15.8552C26.0222 17.8205 25.4708 19.7506 24.4086 21.4043C23.3463 23.0581 21.8203 24.3621 20.0212 25.1535C18.2221 25.9448 16.2296 26.1885 14.2928 25.854C12.356 25.5194 10.5607 24.6216 9.13125 23.2725C9.03571 23.1823 8.92333 23.1117 8.80052 23.0648C8.6777 23.018 8.54686 22.9958 8.41547 22.9995C8.28407 23.0032 8.15469 23.0328 8.03472 23.0865C7.91475 23.1402 7.80653 23.217 7.71625 23.3125C7.62597 23.4081 7.55538 23.5205 7.50853 23.6433C7.46168 23.7661 7.43948 23.8969 7.44319 24.0283C7.44691 24.1597 7.47647 24.2891 7.53018 24.4091C7.58389 24.529 7.66071 24.6373 7.75625 24.7275C9.18056 26.0716 10.9122 27.0467 12.8 27.5677C14.6878 28.0886 16.6744 28.1396 18.5865 27.7162C20.4986 27.2929 22.278 26.4079 23.7694 25.1387C25.2608 23.8695 26.4189 22.2545 27.1427 20.4348C27.8664 18.6151 28.1338 16.6459 27.9215 14.699C27.7091 12.7522 27.0236 10.8869 25.9246 9.26595C24.8256 7.64501 23.3466 6.31766 21.6166 5.39977C19.8867 4.48187 17.9584 4.00131 16 4.00004Z" />
            </svg>
          </a>
          <div
            class={`${tooltipIcon} ${
              isHistoryTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            HISTORY
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== DASHBOARD PROFILE SUBCOMPONENT ===== */
function DashboardProfile() {
  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col">
      <div className="flex">
        <div className="flex items-center justify-center relative -top-3 -left-3 mobileMd:-top-6 mobileMd:-left-6 w-[58px] h-[58px] mobileLg:w-[76px] mobileLg:h-[76px] bg-stamp-purple rounded-full">
          <img
            src="/img/home/carousel_default.png"
            alt="Avatar"
            class="w-[54px] h-[54px] mobileLg:w-[72px] mobileLg:h-[72px] rounded-full"
          />
        </div>
        <div class="flex ml-1.5 mobileMd:ml-0 mt-1.5 mobileMd:-mt-2 mobileLg:mt-0">
          <h5 class={titleGreyLD}>
            ANONYMOUS
          </h5>
        </div>
      </div>
      <div class="flex justify-between">
        <div class="flex flex-col gap-0.5">
          <h6 class="text-stamp-grey font-light text-base mobileLg:text-lg">
            anonymous.btc
          </h6>
          <h6 class="text-stamp-grey font-light text-base mobileLg:text-lg">
            kevin.btc
          </h6>
          <h6 class="text-stamp-grey font-light text-base mobileLg:text-lg">
            pepe.btc
          </h6>
          <h6 class="text-stamp-grey font-light text-base mobileLg:text-lg">
            satoshi.btc
          </h6>
        </div>
        <div class="flex">
          <h6 class="text-stamp-grey-darker font-medium text-sm mobileLg:text-base">
            website // X
          </h6>
        </div>
      </div>
      <div class="flex justify-end">
        <div class="flex flex-col gap-1.5 mobileMd:gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
            role="button"
            aria-label="Profile"
          >
            <path d="M26 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H26C26.5304 28 27.0391 27.7893 27.4142 27.4142C27.7893 27.0391 28 26.5304 28 26V6C28 5.46957 27.7893 4.96086 27.4142 4.58579C27.0391 4.21071 26.5304 4 26 4ZM12 15C12 14.2089 12.2346 13.4355 12.6741 12.7777C13.1136 12.1199 13.7384 11.6072 14.4693 11.3045C15.2002 11.0017 16.0044 10.9225 16.7804 11.0769C17.5563 11.2312 18.269 11.6122 18.8284 12.1716C19.3878 12.731 19.7688 13.4437 19.9231 14.2196C20.0775 14.9956 19.9983 15.7998 19.6955 16.5307C19.3928 17.2616 18.8801 17.8864 18.2223 18.3259C17.5645 18.7654 16.7911 19 16 19C14.9391 19 13.9217 18.5786 13.1716 17.8284C12.4214 17.0783 12 16.0609 12 15ZM8.58375 26C9.09548 24.7402 9.91818 23.6306 10.975 22.775C12.3979 21.6264 14.1714 20.9999 16 20.9999C17.8286 20.9999 19.6021 21.6264 21.025 22.775C22.0818 23.6306 22.9045 24.7402 23.4163 26H8.58375ZM26 26H25.5413C25.0966 24.5846 24.3422 23.286 23.3329 22.1986C22.3236 21.1112 21.0847 20.2624 19.7062 19.7138C20.6876 18.9429 21.4042 17.8853 21.7562 16.6882C22.1083 15.491 22.0784 14.2139 21.6706 13.0345C21.2628 11.8552 20.4974 10.8323 19.481 10.1083C18.4647 9.38438 17.2479 8.99531 16 8.99531C14.7521 8.99531 13.5353 9.38438 12.519 10.1083C11.5026 10.8323 10.7372 11.8552 10.3294 13.0345C9.92164 14.2139 9.89169 15.491 10.2438 16.6882C10.5958 17.8853 11.3124 18.9429 12.2937 19.7138C10.9153 20.2624 9.67641 21.1112 8.66709 22.1986C7.65777 23.286 6.90339 24.5846 6.45875 26H6V6H26V26Z" />
          </svg>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
            role="button"
            aria-label="Collections"
          >
            <path d="M26 4H10C9.46957 4 8.96086 4.21071 8.58579 4.58579C8.21071 4.96086 8 5.46957 8 6V8H6C5.46957 8 4.96086 8.21071 4.58579 8.58579C4.21071 8.96086 4 9.46957 4 10V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H22C22.5304 28 23.0391 27.7893 23.4142 27.4142C23.7893 27.0391 24 26.5304 24 26V24H26C26.5304 24 27.0391 23.7893 27.4142 23.4142C27.7893 23.0391 28 22.5304 28 22V6C28 5.46957 27.7893 4.96086 27.4142 4.58579C27.0391 4.21071 26.5304 4 26 4ZM10 6H26V14.6725L23.9125 12.585C23.5375 12.2102 23.029 11.9997 22.4988 11.9997C21.9685 11.9997 21.46 12.2102 21.085 12.585L11.6713 22H10V6ZM22 26H6V10H8V22C8 22.5304 8.21071 23.0391 8.58579 23.4142C8.96086 23.7893 9.46957 24 10 24H22V26ZM26 22H14.5L22.5 14L26 17.5V22ZM15 14C15.5933 14 16.1734 13.8241 16.6667 13.4944C17.1601 13.1648 17.5446 12.6962 17.7716 12.1481C17.9987 11.5999 18.0581 10.9967 17.9424 10.4147C17.8266 9.83279 17.5409 9.29824 17.1213 8.87868C16.7018 8.45912 16.1672 8.1734 15.5853 8.05764C15.0033 7.94189 14.4001 8.0013 13.8519 8.22836C13.3038 8.45542 12.8352 8.83994 12.5056 9.33329C12.1759 9.82664 12 10.4067 12 11C12 11.7956 12.3161 12.5587 12.8787 13.1213C13.4413 13.6839 14.2044 14 15 14ZM15 10C15.1978 10 15.3911 10.0586 15.5556 10.1685C15.72 10.2784 15.8482 10.4346 15.9239 10.6173C15.9996 10.8 16.0194 11.0011 15.9808 11.1951C15.9422 11.3891 15.847 11.5673 15.7071 11.7071C15.5673 11.847 15.3891 11.9422 15.1951 11.9808C15.0011 12.0194 14.8 11.9996 14.6173 11.9239C14.4346 11.8482 14.2784 11.72 14.1685 11.5556C14.0586 11.3911 14 11.1978 14 11C14 10.7348 14.1054 10.4804 14.2929 10.2929C14.4804 10.1054 14.7348 10 15 10Z" />
          </svg>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-grey-darker stroke-stamp-grey-darker stroke-[1px] hover:fill-stamp-grey-light hover:stroke-stamp-grey-light cursor-pointer"
            role="button"
            aria-label="Get Stamping"
          >
            <path d="M27.5 28C27.5 28.1326 27.4473 28.2598 27.3536 28.3536C27.2598 28.4473 27.1326 28.5 27 28.5H5C4.86739 28.5 4.74021 28.4473 4.64645 28.3536C4.55268 28.2598 4.5 28.1326 4.5 28C4.5 27.8674 4.55268 27.7402 4.64645 27.6464C4.74021 27.5527 4.86739 27.5 5 27.5H27C27.1326 27.5 27.2598 27.5527 27.3536 27.6464C27.4473 27.7402 27.5 27.8674 27.5 28ZM27.5 18V23C27.5 23.3978 27.342 23.7794 27.0607 24.0607C26.7794 24.342 26.3978 24.5 26 24.5H6C5.60218 24.5 5.22064 24.342 4.93934 24.0607C4.65804 23.7794 4.5 23.3978 4.5 23V18C4.5 17.6022 4.65804 17.2206 4.93934 16.9393C5.22064 16.658 5.60218 16.5 6 16.5H13.6713L11.5787 6.73375C11.4694 6.22352 11.4754 5.69528 11.5965 5.1877C11.7177 4.68012 11.9507 4.20604 12.2787 3.80017C12.6067 3.39429 13.0213 3.06689 13.4921 2.84193C13.963 2.61697 14.4782 2.50015 15 2.5H17C17.5219 2.49996 18.0373 2.61665 18.5083 2.84153C18.9793 3.06641 19.394 3.39378 19.7221 3.79968C20.0503 4.20558 20.2835 4.67972 20.4046 5.18739C20.5258 5.69507 20.5319 6.22341 20.4225 6.73375L18.3288 16.5H26C26.3978 16.5 26.7794 16.658 27.0607 16.9393C27.342 17.2206 27.5 17.6022 27.5 18ZM14.6938 16.5H17.3062L19.4438 6.52375C19.5218 6.15932 19.5174 5.78205 19.4309 5.41954C19.3444 5.05702 19.1779 4.71844 18.9436 4.42858C18.7093 4.13871 18.4132 3.90489 18.0769 3.74422C17.7407 3.58356 17.3727 3.50012 17 3.5H15C14.6272 3.49993 14.2591 3.58323 13.9227 3.74382C13.5862 3.9044 13.2899 4.1382 13.0555 4.42809C12.8211 4.71798 12.6545 5.05663 12.5679 5.41923C12.4813 5.78184 12.4769 6.15922 12.555 6.52375L14.6938 16.5ZM26.5 18C26.5 17.8674 26.4473 17.7402 26.3536 17.6464C26.2598 17.5527 26.1326 17.5 26 17.5H6C5.86739 17.5 5.74021 17.5527 5.64645 17.6464C5.55268 17.7402 5.5 17.8674 5.5 18V23C5.5 23.1326 5.55268 23.2598 5.64645 23.3536C5.74021 23.4473 5.86739 23.5 6 23.5H26C26.1326 23.5 26.2598 23.4473 26.3536 23.3536C26.4473 23.2598 26.5 23.1326 26.5 23V18Z" />
          </svg>
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
    dispensers,
    setShowItem = () => {},
    stampValue = 0,
    src20Value = 0,
  }: {
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    dispensers?: { open: number; closed: number; total: number };
    setShowItem?: (type: string) => void;
    stampValue?: number;
    src20Value?: number;
  },
) {
  /* ===== EVENT HANDLERS ===== */
  const handleType = (type: string) => {
    setShowItem(type);
  };

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
      <div class="flex flex-col w-full">
        <div className={containerBackground}>
          <StampStats
            stampsTotal={stampsTotal}
            stampsCreated={stampsCreated}
            handleType={handleType}
            stampValue={stampValue}
          />
        </div>
      </div>
      <div class="flex flex-col w-full">
        <div className={containerBackground}>
          <DispenserStats
            dispensers={{
              open: dispensers?.open ?? 0,
              closed: dispensers?.closed ?? 0,
              total: dispensers?.total ?? 0,
            }}
            handleType={handleType}
          />
        </div>
      </div>
      <div class="flex flex-col w-full">
        <div className={containerBackground}>
          <TokenStats
            src20Total={src20Total}
            handleType={handleType}
            src20Value={src20Value}
          />
        </div>
      </div>
    </div>
  );
}

/* ===== STAMP STATS SUBCOMPONENT ===== */
function StampStats(
  { stampsTotal, stampsCreated, stampValue = 0 }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
    stampValue?: number;
  },
) {
  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col gap-1.5 mobileLg:gap-3">
      <div className="flex pb-1.5 mobileLg:pb-3">
        <StatTitle label="STAMPS" value={stampsTotal.toString()} />
      </div>
      <div className="flex justify-between">
        <StatItem label="EDITIONS" value="239" />
        <StatItem label="CREATED" value={stampsCreated.toString()} />
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
      <div className="flex justify-between">
        <StatItem label="COLLECTIONS" value="8" />
        <StatItem
          label="LISTINGS"
          value="4"
          align="right"
        />
      </div>
    </div>
  );
}

/* ===== DISPENSER STATS SUBCOMPONENT ===== */
function DispenserStats(
  { dispensers = { open: 0, closed: 0, total: 0 } }: {
    handleType: (type: string) => void;
    dispensers?: { open: number; closed: number; total: number };
  },
) {
  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col gap-1.5 mobileLg:gap-3">
      <div className="flex pb-1.5 mobileLg:pb-3">
        <StatTitle label="LISTINGS" value={dispensers.open.toString()} />
      </div>
      <div className="flex justify-between">
        <StatItem label="ATOMIC" value="N/A" />
        <StatItem
          label="DISPENSERS"
          value={dispensers.total.toString()}
          align="right"
        />
      </div>
    </div>
  );
}

/* ===== TOKEN STATS SUBCOMPONENT ===== */
function TokenStats(
  { src20Total, src20Value = 0 }: {
    src20Total: number;
    handleType: (type: string) => void;
    src20Value?: number;
  },
) {
  /* ===== COMPUTED VALUES ===== */
  const totalValue = src20Value || 0;

  /* ===== RENDER ===== */
  return (
    <div className="flex flex-col gap-1.5 mobileLg:gap-3">
      <div className="flex pb-1.5 mobileLg:pb-3">
        <StatTitle label="TOKENS" value={src20Total?.toString()} />
      </div>

      <div className="flex justify-between">
        <StatItem
          label="VALUE"
          value={
            <>
              {totalValue > 0 ? totalValue.toFixed(8) : "N/A"}{" "}
              <span className="font-light">BTC</span>
            </>
          }
        />
        <StatItem label="24H CHANGE" value="+/- 0.00%" align="right" />
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
        />
      </div>
    </div>
  );
}

/* ===== MAIN WALLET DASHBOARD DETAILS COMPONENT ===== */
export default function WalletDashboardDetails({
  walletData,
  stampsTotal,
  src20Total,
  stampsCreated,
  setShowItem,
}: WalletDashboardDetailsProps) {
  /* ===== STATE ===== */
  const [fee, setFee] = useState<number>(walletData.fee || 0);

  /* ===== MODAL HANDLERS ===== */
  const handleOpenSendModal = () => {
    const modalContent = (
      <SendBTCModal
        fee={fee}
        balance={walletData.balance}
        handleChangeFee={setFee}
      />
    );
    openModal(modalContent, "scaleUpDown");
  };

  const handleOpenReceiveModal = () => {
    const modalContent = (
      <RecieveAddyModal
        address={walletData.address}
        title="RECEIVE"
      />
    );
    openModal(modalContent, "scaleUpDown");
  };

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col w-full gap-3 mobileMd:gap-6">
      <div class="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
        <div class="flex flex-col w-full mobileLg:w-1/2 tablet:w-2/3">
          <div className={containerBackground}>
            <DashboardProfile />
          </div>
        </div>
        <div class="flex flex-col w-full mobileLg:w-1/2 tablet:w-1/3">
          <div className={containerBackground}>
            <WalletOverview
              walletData={walletData}
              onSend={handleOpenSendModal}
              onReceive={handleOpenReceiveModal}
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col w-full">
        <WalletStats
          setShowItem={setShowItem}
          stampsTotal={stampsTotal}
          src20Total={src20Total}
          stampsCreated={stampsCreated}
          dispensers={walletData.dispensers}
          stampValue={walletData.stampValue}
          src20Value={walletData.src20Value}
        />
      </div>
    </div>
  );
}
