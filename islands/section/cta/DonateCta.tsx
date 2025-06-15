/* ===== DONATE CTA COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";
import { StampCard } from "$card";
import { StampRow } from "$globals";
import RecieveAddyModal from "$islands/modal/RecieveAddyModal.tsx";
import DonateStampModal from "$islands/modal/DonateStampModal.tsx";
import { DonateStampData, Transaction, TxOutput } from "$layout";
import {
  headingGrey,
  labelSm,
  subtitlePurple,
  text,
  titlePurpleLD,
} from "$text";
import { tooltipIcon } from "$notification";
import { Button } from "$button";
import { Icon } from "$icon";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { openModal } from "$islands/modal/states.ts";

/* ===== CONSTANTS ===== */
const DONATE_ADDRESS = "bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203";

const DONATE_STAMP: DonateStampData = {
  stamp: "-398",
  stamp_mimetype: "png",
  stamp_url: "6df1763d2df70b21f5fb52c9a47347c7466dfdf8a87d1430f640d363f0efa37a",
  tx_hash: "6df1763d2df70b21f5fb52c9a47347c7466dfdf8a87d1430f640d363f0efa37a",
};

/* ===== STATE ===== */
export default function DonateCta() {
  const [fee, setFee] = useState<number>(0);
  const [monthlyDonations, setMonthlyDonations] = useState<number>(0);
  const [isReceiveTooltipVisible, setIsReceiveTooltipVisible] = useState<
    boolean
  >(false);
  const [allowReceiveTooltip, setAllowReceiveTooltip] = useState<boolean>(true);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [dispenser, setDispenser] = useState(null);

  /* ===== REFS ===== */
  const receiveButtonRef = useRef<HTMLDivElement>(null);
  const receiveTooltipTimeoutRef = useRef<number | null>(null);

  /* ===== TOOLTIP HANDLERS ===== */
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

  /* ===== DONATION DATA FETCHING ===== */
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

        const monthName = currentDate.toLocaleString("default", {
          month: "long",
        }).toUpperCase();
        setCurrentMonth(monthName);
      } catch (error) {
        console.error("Error fetching donations:", error);
        setMonthlyDonations(0);
      }
    };

    fetchDonations();
  }, []);

  /* ===== DISPENSER DATA FETCHING ===== */
  useEffect(() => {
    const fetchDispenser = async () => {
      try {
        const response = await fetch(
          `/api/v2/stamps/${DONATE_STAMP.stamp}/dispensers?limit=1`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Get first open dispenser
        const openDispenser = data.data.find((d: any) => d.status === "open");
        setDispenser(openDispenser);
      } catch (error) {
        console.error("Error fetching dispenser:", error);
        setDispenser(null);
      }
    };

    fetchDispenser();
  }, []);

  /* ===== EVENT HANDLERS ===== */
  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleOpen = () => {
    const modalContent = (
      <DonateStampModal
        stamp={DONATE_STAMP as unknown as StampRow}
        fee={fee}
        handleChangeFee={handleChangeFee}
        dispenser={dispenser}
      />
    );
    openModal(modalContent, "scaleUpDown");
  };

  const handleOpenReceiveModal = () => {
    const modalContent = (
      <RecieveAddyModal
        address={DONATE_ADDRESS}
        title="DONATE"
      />
    );
    openModal(modalContent, "scaleUpDown");
  };

  /* ===== SUBCOMPONENTS ===== */
  const DonateStampCard = ({ onClick }: { onClick: () => void }) => (
    <div className="flex flex-col gap-5 items-center">
      <div className="w-[134px] mobileLg:w-[174px] tablet:w-[204px]">
        <StampCard
          stamp={DONATE_STAMP as unknown as StampRow}
          showDetails={false}
          showMinDetails={false}
        />
      </div>
      <Button
        variant="outline"
        color="purple"
        size="md"
        onClick={onClick}
      >
        DONATE
      </Button>
    </div>
  );

  /* ===== COMPONENT ===== */
  return (
    <>
      <section>
        {/* ===== HEADER SECTION ===== */}
        <div className="w-full flex flex-col justify-center items-start">
          <h3 className={titlePurpleLD}>DONATE</h3>
          <h4 className={subtitlePurple}>TO THE DEV FUND</h4>
        </div>
        {/* ===== MAIN CONTENT SECTION ===== */}
        <p className={`${text} tablet:hidden block mb-0`}>
          Support the ongoing development of Bitcoin Stamps and contribute to
          the monthly running costs of the backend infrastructure, to help
          ensure the stamping machine keeps running.
        </p>
        <div className="grid grid-cols-12">
          <div className="col-span-12 mobileMd:col-span-8">
            <p className={`${text} tablet:block hidden`}>
              Support the ongoing development of Bitcoin Stamps and contribute
              to the monthly running costs of the backend infrastructure, to
              help ensure the stamping machine keeps running.
            </p>
            <div className="grid grid-cols-12 mt-6 mb-6">
              <div className="col-span-6 flex flex-col justify-center items-center">
                <h6 className={`${labelSm} mb-0`}>
                  MONTHLY EXPENSES
                </h6>
                <h6 className={headingGrey}>
                  2,500 <span className="font-extralight">USD</span>
                </h6>
              </div>
              <div className="col-span-6 flex flex-col justify-center items-center">
                <h6 className={labelSm}>
                  <span className="hidden min-[420px]:inline">
                    {currentMonth}
                  </span>{" "}
                  DONATIONS
                </h6>
                <h6 className={headingGrey}>
                  {monthlyDonations}{" "}
                  <span className="font-extralight">USD</span>
                </h6>
              </div>
            </div>
            <p className={text}>
              Use the Donate button and you'll receive some OG USDSTAMPs as
              thanks for your support.
            </p>

            {/* ===== MOBILE STAMP CARD SECTION ===== */}
            <div className="my-6 mobileMd:hidden">
              <DonateStampCard onClick={handleOpen} />
            </div>
            <p className={text}>
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>

            <div className="flex justify-start gap-6 items-center mt-3">
              <div
                ref={receiveButtonRef}
                class="relative group order-1 tablet:order-2"
                onMouseEnter={handleReceiveMouseEnter}
                onMouseLeave={handleReceiveMouseLeave}
              >
                <Icon
                  type="iconButton"
                  name="donate"
                  weight="normal"
                  size="sm"
                  color="purple"
                  onClick={() => {
                    setIsReceiveTooltipVisible(false);
                    handleOpenReceiveModal();
                  }}
                />
                <div
                  class={`${tooltipIcon} ${
                    isReceiveTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  DONATE
                </div>
              </div>

              {/* Address Text - second on mobile, first on tablet+ */}
              <a
                href={`/wallet/${DONATE_ADDRESS}`}
                class="font-medium text-base text-stamp-purple hover:text-stamp-purple-bright transition-colors duration-300 order-2 tablet:order-1"
              >
                <span className="hidden tablet:block">{DONATE_ADDRESS}</span>
                <span className="hidden mobileMd:block tablet:hidden">
                  {abbreviateAddress(DONATE_ADDRESS, 8)}
                </span>
                <span className="block mobileMd:hidden">
                  {abbreviateAddress(DONATE_ADDRESS, 11)}
                </span>
              </a>
            </div>
          </div>

          {/* ===== DESKTOP/TABLET STAMP CARD SECTION ===== */}
          <div className="hidden mobileMd:flex mobileMd:col-span-4 justify-center">
            <DonateStampCard onClick={handleOpen} />
          </div>
        </div>
      </section>
    </>
  );
}
