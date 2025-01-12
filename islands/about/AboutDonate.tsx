import { useEffect, useRef, useState } from "preact/hooks";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { StampRow } from "$globals";
import WalletReceiveModal from "$islands/Wallet/details/WalletReceiveModal.tsx";
import WalletDonateModal from "$islands/Wallet/details/WalletDonateModal.tsx";

const DONATE_ADDRESS = "bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203";

interface TxOutput {
  scriptpubkey_address: string;
  value: number;
}

interface Transaction {
  status: {
    block_time: number;
  };
  vout: TxOutput[];
}

interface DonateStampData {
  stamp: string;
  stamp_mimetype: string;
  stamp_url: string;
  tx_hash: string;
}

const DONATE_STAMP: DonateStampData = {
  stamp: "730380",
  stamp_mimetype: "text/html",
  stamp_url: "f3253cad40e047ad21d0e5905f9c4981a73150b1c9dc1c61352789c86d0409e8",
  tx_hash: "f3253cad40e047ad21d0e5905f9c4981a73150b1c9dc1c61352789c86d0409e8",
};

export default function AboutDonate() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fee, setFee] = useState<number>(0);
  const [monthlyDonations, setMonthlyDonations] = useState<number>(0);
  const [isReceiveTooltipVisible, setIsReceiveTooltipVisible] = useState(false);
  const [allowReceiveTooltip, setAllowReceiveTooltip] = useState(true);
  const receiveButtonRef = useRef<HTMLDivElement>(null);
  const receiveTooltipTimeoutRef = useRef<number | null>(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (receiveTooltipTimeoutRef.current) {
        globalThis.clearTimeout(receiveTooltipTimeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        // Start with fetching message and address
        console.log("Fetching donation history...");
        console.log("➜ BTC Address:", DONATE_ADDRESS);

        const txResponse = await fetch(
          `https://mempool.space/api/address/${DONATE_ADDRESS}/txs/chain`,
        );
        if (!txResponse.ok) throw new Error("Failed to fetch transactions");

        const transactions = await txResponse.json();

        // Get current BTC price
        const priceResponse = await fetch("/api/internal/btcPrice");
        if (!priceResponse.ok) throw new Error("Failed to fetch BTC price");
        const priceData = await priceResponse.json();
        const btcPrice = priceData.data.price;
        console.log("Current BTC price:", btcPrice);

        // Helper function to format BTC value
        const formatBTC = (sats: number) => {
          const btc = sats / 100_000_000;
          if (btc === 0) return "0";
          // Remove trailing zeros after decimal point
          return btc.toFixed(8).replace(/\.?0+$/, "");
        };

        // Helper function to calculate monthly data for a specific year
        const calculateYearlyData = (year: number) => {
          console.log(`\n=== ${year} YEARLY TOTAL ===`);

          const yearTxs = transactions.filter((tx: Transaction) => {
            const txDate = new Date(tx.status.block_time * 1000);
            return txDate.getFullYear() === year;
          });

          const yearlyTotal = yearTxs.reduce((sum: number, tx: Transaction) => {
            const incomingValue = tx.vout.reduce(
              (voutSum: number, output: TxOutput) => {
                if (output.scriptpubkey_address === DONATE_ADDRESS) {
                  return voutSum + (output.value || 0);
                }
                return voutSum;
              },
              0,
            );
            return sum + incomingValue;
          }, 0);

          const yearlyBTC = formatBTC(yearlyTotal);
          const yearlyUSD = ((yearlyTotal / 100_000_000) * btcPrice).toFixed(2);

          console.log(`Total BTC: ${yearlyBTC}`);
          console.log(`Total USD: ${Number(yearlyUSD).toLocaleString()}`);

          console.log("\n=== MONTHLY OVERVIEW ===");
          const months = Array.from({ length: 12 }, (_, i) => i);
          months.forEach((monthIndex) => {
            const monthTxs = yearTxs.filter((tx: Transaction) => {
              const txDate = new Date(tx.status.block_time * 1000);
              return txDate.getMonth() === monthIndex;
            });

            const monthSats = monthTxs.reduce(
              (sum: number, tx: Transaction) => {
                const incomingValue = tx.vout.reduce(
                  (voutSum: number, output: TxOutput) => {
                    if (output.scriptpubkey_address === DONATE_ADDRESS) {
                      return voutSum + (output.value || 0);
                    }
                    return voutSum;
                  },
                  0,
                );
                return sum + incomingValue;
              },
              0,
            );

            const monthBTC = formatBTC(monthSats);
            const monthUSD = ((monthSats / 100_000_000) * btcPrice).toFixed(2);
            const monthName = new Date(year, monthIndex).toLocaleString(
              "default",
              { month: "long" },
            );

            console.log(
              `${monthName} ${year}: {transactions: ${monthTxs.length}, btc: ${monthBTC}, usd: ${
                Number(monthUSD).toLocaleString()
              }}`,
            );
          });
        };

        // Calculate for each year
        [2023, 2024, 2025].forEach((year) => calculateYearlyData(year));

        // Calculate this month's data for display
        const currentDate = new Date();
        const thisMonthYear = currentDate.getFullYear();
        const thisMonthIndex = currentDate.getMonth();

        console.log("\n=== THIS MONTH DETAILS ===");
        console.log("This month:", {
          month: thisMonthIndex + 1,
          year: thisMonthYear,
          name: currentDate.toLocaleString("default", { month: "long" }),
        });

        const thisMonthTxs = transactions.filter((tx: Transaction) => {
          const txDate = new Date(tx.status.block_time * 1000);
          return txDate.getFullYear() === thisMonthYear &&
            txDate.getMonth() === thisMonthIndex;
        });

        const thisMonthSats = thisMonthTxs.reduce(
          (sum: number, tx: Transaction) => {
            const incomingValue = tx.vout.reduce(
              (voutSum: number, output: TxOutput) => {
                if (output.scriptpubkey_address === DONATE_ADDRESS) {
                  return voutSum + (output.value || 0);
                }
                return voutSum;
              },
              0,
            );
            return sum + incomingValue;
          },
          0,
        );

        const thisMonthBTC = formatBTC(thisMonthSats);
        const thisMonthUSD = Math.round(
          (thisMonthSats / 100_000_000) * btcPrice,
        );

        console.log("This Month Summary:", {
          transactions: thisMonthTxs.length,
          btc: thisMonthBTC,
          usd: thisMonthUSD.toLocaleString(),
        });

        setMonthlyDonations(thisMonthUSD);
      } catch (error) {
        console.error("Error fetching donations:", error);
        setMonthlyDonations(0);
      }
    };

    fetchDonations();
  }, []);

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";
  const subTitlePurple =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const dataLabel =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXl =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
  const buttonPurpleOutline =
    "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";
  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap transition-opacity duration-300";

  return (
    <>
      <section>
        <div className="w-full flex flex-col justify-center items-start">
          <h1 className={titlePurpleDL}>
            DONATE
          </h1>
          <h3 className={subTitlePurple}>
            TO THE DEV FUND
          </h3>
        </div>
        <p className={`${bodyTextLight} tablet:hidden block`}>
          Support the ongoing development of Bitcoin Stamps and contribute to
          the monthly running costs of the backend infrastructure, to help
          ensure the stamping machine keeps running.
        </p>
        <div className="grid grid-cols-12">
          <div className="mobileMd:col-span-8 col-span-12">
            <p className={`${bodyTextLight} tablet:block hidden`}>
              Support the ongoing development of Bitcoin Stamps and contribute
              to the monthly running costs of the backend infrastructure, to
              help ensure the stamping machine keeps running.
            </p>
            <div className="grid grid-cols-12 mt-6 mb-6">
              <div className="col-span-6 flex flex-col justify-center items-center">
                <p className={dataLabel}>
                  MONTHLY EXPENSES
                </p>
                <p className={dataValueXl}>
                  2,500 <span className="font-extralight">USD</span>
                </p>
              </div>
              <div className="col-span-6 flex flex-col justify-center items-center">
                <p className={dataLabel}>
                  DONATIONS THIS MONTH
                </p>
                <p className={dataValueXl}>
                  {monthlyDonations}{" "}
                  <span className="font-extralight">USD</span>
                </p>
              </div>
            </div>
            <p className={bodyTextLight}>
              Use the Donate button and you'll receive a unique stamp by Viva la
              Vandal as thanks for your support.
            </p>
            <br />
            <p className={`${bodyTextLight} mobileMd:block hidden`}>
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>
            <br />

            <div className="hidden mobileMd:flex justify-start gap-[18px] tablet:gap-6">
              <a
                href={`/wallet/${DONATE_ADDRESS}`}
                class="hidden mobileLg:block text-xl font-bold text-stamp-purple hover:text-stamp-purple-bright"
              >
                {DONATE_ADDRESS}
              </a>
              <a
                href={`/wallet/${DONATE_ADDRESS}`}
                class="block mobileLg:hidden text-lg font-bold text-stamp-purple hover:text-stamp-purple-bright"
              >
                bc1qe5sz3mt4a3e5...74qe0xdrkzew203
              </a>

              <div
                ref={receiveButtonRef}
                class="relative group mobileLg:-mt-0.5"
                onMouseEnter={handleReceiveMouseEnter}
                onMouseLeave={handleReceiveMouseLeave}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
                  role="button"
                  aria-label="Donate"
                  onClick={() => {
                    setIsReceiveTooltipVisible(false);
                    setIsReceiveModalOpen(true);
                  }}
                >
                  <path d="M28.7913 17.6325C28.4191 17.3462 27.986 17.1496 27.5255 17.0578C27.0651 16.9661 26.5897 16.9819 26.1362 17.1038L20.9062 18.3063C21.0279 17.7922 21.0317 17.2574 20.9172 16.7417C20.8028 16.226 20.5731 15.7429 20.2454 15.3287C19.9177 14.9144 19.5005 14.5797 19.0251 14.3495C18.5496 14.1194 18.0282 13.9999 17.5 14H11.2425C10.717 13.9987 10.1964 14.1015 9.71092 14.3025C9.22539 14.5036 8.78451 14.7988 8.41375 15.1713L5.58625 18H2C1.46957 18 0.960859 18.2107 0.585786 18.5858C0.210714 18.9609 0 19.4696 0 20L0 25C0 25.5304 0.210714 26.0391 0.585786 26.4142C0.960859 26.7893 1.46957 27 2 27H15C15.0818 27 15.1632 26.99 15.2425 26.97L23.2425 24.97C23.2935 24.9579 23.3433 24.9411 23.3913 24.92L28.25 22.8525L28.305 22.8275C28.772 22.5942 29.1718 22.2458 29.4669 21.8152C29.7621 21.3846 29.9427 20.886 29.9918 20.3663C30.041 19.8466 29.957 19.3229 29.7478 18.8447C29.5387 18.3664 29.2112 17.9492 28.7962 17.6325H28.7913ZM2 20H5V25H2V20ZM27.4287 21.0263L22.6787 23.0488L14.875 25H7V19.4138L9.82875 16.5863C10.0138 16.3997 10.2341 16.2518 10.4768 16.1512C10.7195 16.0506 10.9798 15.9992 11.2425 16H17.5C17.8978 16 18.2794 16.158 18.5607 16.4393C18.842 16.7206 19 17.1022 19 17.5C19 17.8978 18.842 18.2794 18.5607 18.5607C18.2794 18.842 17.8978 19 17.5 19H14C13.7348 19 13.4804 19.1054 13.2929 19.2929C13.1054 19.4804 13 19.7348 13 20C13 20.2652 13.1054 20.5196 13.2929 20.7071C13.4804 20.8946 13.7348 21 14 21H18C18.0753 20.9998 18.1503 20.9914 18.2237 20.975L26.5987 19.0488L26.6375 19.0388C26.8932 18.9678 27.166 18.9939 27.4036 19.112C27.6412 19.2301 27.8267 19.4319 27.9245 19.6786C28.0222 19.9253 28.0253 20.1994 27.9331 20.4482C27.8409 20.697 27.6599 20.9029 27.425 21.0263H27.4287ZM20.5 12C20.7471 12.0003 20.9937 11.9802 21.2375 11.94C21.5117 12.7544 22.0133 13.4733 22.6832 14.0117C23.353 14.55 24.1629 14.8854 25.0173 14.978C25.8716 15.0706 26.7346 14.9167 27.5042 14.5344C28.2739 14.1521 28.9179 13.5574 29.3603 12.8206C29.8026 12.0839 30.0248 11.2359 30.0005 10.3769C29.9762 9.51787 29.7064 8.68379 29.2231 7.97325C28.7398 7.2627 28.0631 6.7054 27.2731 6.36724C26.4831 6.02909 25.6127 5.9242 24.765 6.065C24.501 5.28031 24.0256 4.58366 23.3912 4.05172C22.7568 3.51979 21.9879 3.17318 21.1692 3.05005C20.3505 2.92692 19.5137 3.03203 18.7509 3.35383C17.988 3.67563 17.3288 4.20163 16.8456 4.87396C16.3625 5.54628 16.0742 6.33886 16.0125 7.16447C15.9507 7.99008 16.118 8.81672 16.4958 9.55342C16.8735 10.2901 17.4472 10.9083 18.1537 11.34C18.8602 11.7716 19.6721 12 20.5 12ZM28 10.5C28 10.9945 27.8534 11.4778 27.5787 11.8889C27.304 12.3001 26.9135 12.6205 26.4567 12.8097C25.9999 12.9989 25.4972 13.0484 25.0123 12.952C24.5273 12.8555 24.0819 12.6174 23.7322 12.2678C23.3826 11.9181 23.1445 11.4727 23.048 10.9877C22.9516 10.5028 23.0011 10.0001 23.1903 9.54329C23.3795 9.08648 23.7 8.69603 24.1111 8.42133C24.5222 8.14662 25.0055 8 25.5 8C26.163 8 26.7989 8.26339 27.2678 8.73223C27.7366 9.20108 28 9.83696 28 10.5ZM20.5 5C21.0454 5.00027 21.5757 5.17888 22.0101 5.5086C22.4446 5.83832 22.7593 6.30105 22.9062 6.82625C22.3941 7.18662 21.9628 7.64992 21.6399 8.18652C21.3171 8.72312 21.1097 9.3212 21.0312 9.9425C20.8567 9.9802 20.6786 9.99948 20.5 10C19.837 10 19.2011 9.73661 18.7322 9.26777C18.2634 8.79893 18 8.16304 18 7.5C18 6.83696 18.2634 6.20108 18.7322 5.73223C19.2011 5.26339 19.837 5 20.5 5Z" />
                </svg>
                <div
                  class={`${tooltipIcon} ${
                    isReceiveTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  DONATE
                </div>
              </div>
            </div>
          </div>

          <div className="mobileMd:col-span-4 col-span-12 flex flex-col gap-5 justify-center items-center">
            <div className="w-[134px] mobileLg:w-[174px] tablet:w-[204px]">
              <StampCard
                stamp={DONATE_STAMP as unknown as StampRow}
                showDetails={false}
                showMinDetails={false}
              />
            </div>
            <button
              onClick={handleOpen}
              className={buttonPurpleOutline}
            >
              DONATE
            </button>
          </div>

          <div className="flex flex-col col-span-12 mobileMd:hidden mt-9">
            <p className={bodyTextLight}>
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>

            <div className="flex justify-start pt-3 gap-[18px]">
              <a
                href={`/wallet/${DONATE_ADDRESS}`}
                class="text-xl font-bold text-stamp-purple hover:text-stamp-purple-bright"
              >
                bc1qe5sz3mt4...0xdrkzew203
              </a>
              <div
                ref={receiveButtonRef}
                class="relative group pt-0.5"
                onMouseEnter={handleReceiveMouseEnter}
                onMouseLeave={handleReceiveMouseLeave}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
                  role="button"
                  aria-label="Donate"
                  onClick={() => {
                    setIsReceiveTooltipVisible(false);
                    setIsReceiveModalOpen(true);
                  }}
                >
                  <path d="M28.7913 17.6325C28.4191 17.3462 27.986 17.1496 27.5255 17.0578C27.0651 16.9661 26.5897 16.9819 26.1362 17.1038L20.9062 18.3063C21.0279 17.7922 21.0317 17.2574 20.9172 16.7417C20.8028 16.226 20.5731 15.7429 20.2454 15.3287C19.9177 14.9144 19.5005 14.5797 19.0251 14.3495C18.5496 14.1194 18.0282 13.9999 17.5 14H11.2425C10.717 13.9987 10.1964 14.1015 9.71092 14.3025C9.22539 14.5036 8.78451 14.7988 8.41375 15.1713L5.58625 18H2C1.46957 18 0.960859 18.2107 0.585786 18.5858C0.210714 18.9609 0 19.4696 0 20L0 25C0 25.5304 0.210714 26.0391 0.585786 26.4142C0.960859 26.7893 1.46957 27 2 27H15C15.0818 27 15.1632 26.99 15.2425 26.97L23.2425 24.97C23.2935 24.9579 23.3433 24.9411 23.3913 24.92L28.25 22.8525L28.305 22.8275C28.772 22.5942 29.1718 22.2458 29.4669 21.8152C29.7621 21.3846 29.9427 20.886 29.9918 20.3663C30.041 19.8466 29.957 19.3229 29.7478 18.8447C29.5387 18.3664 29.2112 17.9492 28.7962 17.6325H28.7913ZM2 20H5V25H2V20ZM27.4287 21.0263L22.6787 23.0488L14.875 25H7V19.4138L9.82875 16.5863C10.0138 16.3997 10.2341 16.2518 10.4768 16.1512C10.7195 16.0506 10.9798 15.9992 11.2425 16H17.5C17.8978 16 18.2794 16.158 18.5607 16.4393C18.842 16.7206 19 17.1022 19 17.5C19 17.8978 18.842 18.2794 18.5607 18.5607C18.2794 18.842 17.8978 19 17.5 19H14C13.7348 19 13.4804 19.1054 13.2929 19.2929C13.1054 19.4804 13 19.7348 13 20C13 20.2652 13.1054 20.5196 13.2929 20.7071C13.4804 20.8946 13.7348 21 14 21H18C18.0753 20.9998 18.1503 20.9914 18.2237 20.975L26.5987 19.0488L26.6375 19.0388C26.8932 18.9678 27.166 18.9939 27.4036 19.112C27.6412 19.2301 27.8267 19.4319 27.9245 19.6786C28.0222 19.9253 28.0253 20.1994 27.9331 20.4482C27.8409 20.697 27.6599 20.9029 27.425 21.0263H27.4287ZM20.5 12C20.7471 12.0003 20.9937 11.9802 21.2375 11.94C21.5117 12.7544 22.0133 13.4733 22.6832 14.0117C23.353 14.55 24.1629 14.8854 25.0173 14.978C25.8716 15.0706 26.7346 14.9167 27.5042 14.5344C28.2739 14.1521 28.9179 13.5574 29.3603 12.8206C29.8026 12.0839 30.0248 11.2359 30.0005 10.3769C29.9762 9.51787 29.7064 8.68379 29.2231 7.97325C28.7398 7.2627 28.0631 6.7054 27.2731 6.36724C26.4831 6.02909 25.6127 5.9242 24.765 6.065C24.501 5.28031 24.0256 4.58366 23.3912 4.05172C22.7568 3.51979 21.9879 3.17318 21.1692 3.05005C20.3505 2.92692 19.5137 3.03203 18.7509 3.35383C17.988 3.67563 17.3288 4.20163 16.8456 4.87396C16.3625 5.54628 16.0742 6.33886 16.0125 7.16447C15.9507 7.99008 16.118 8.81672 16.4958 9.55342C16.8735 10.2901 17.4472 10.9083 18.1537 11.34C18.8602 11.7716 19.6721 12 20.5 12ZM28 10.5C28 10.9945 27.8534 11.4778 27.5787 11.8889C27.304 12.3001 26.9135 12.6205 26.4567 12.8097C25.9999 12.9989 25.4972 13.0484 25.0123 12.952C24.5273 12.8555 24.0819 12.6174 23.7322 12.2678C23.3826 11.9181 23.1445 11.4727 23.048 10.9877C22.9516 10.5028 23.0011 10.0001 23.1903 9.54329C23.3795 9.08648 23.7 8.69603 24.1111 8.42133C24.5222 8.14662 25.0055 8 25.5 8C26.163 8 26.7989 8.26339 27.2678 8.73223C27.7366 9.20108 28 9.83696 28 10.5ZM20.5 5C21.0454 5.00027 21.5757 5.17888 22.0101 5.5086C22.4446 5.83832 22.7593 6.30105 22.9062 6.82625C22.3941 7.18662 21.9628 7.64992 21.6399 8.18652C21.3171 8.72312 21.1097 9.3212 21.0312 9.9425C20.8567 9.9802 20.6786 9.99948 20.5 10C19.837 10 19.2011 9.73661 18.7322 9.26777C18.2634 8.79893 18 8.16304 18 7.5C18 6.83696 18.2634 6.20108 18.7322 5.73223C19.2011 5.26339 19.837 5 20.5 5Z" />
                </svg>
                <div
                  class={`${tooltipIcon} ${
                    isReceiveTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  DONATE
                </div>
              </div>
            </div>
          </div>
        </div>

        {isOpen && (
          <WalletDonateModal
            fee={fee}
            handleChangeFee={handleChangeFee}
            toggleModal={handleOpen}
            handleCloseModal={handleCloseModal}
            donateAddress={DONATE_ADDRESS}
          />
        )}

        {isReceiveModalOpen && (
          <WalletReceiveModal
            onClose={() => setIsReceiveModalOpen(false)}
            address={DONATE_ADDRESS}
            title="DONATE"
          />
        )}
      </section>
    </>
  );
}
