import { useEffect, useRef, useState } from "preact/hooks";
import type { StampRow } from "$globals";
import StampImage from "$islands/stamp/details/StampImage.tsx";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { logger } from "$lib/utils/logger.ts";
import {DonateModalStyles} from "./styles.ts"

interface Props {
  stamp: StampRow;
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
  dispenser: any;
}

const WalletDonateModal = ({
  stamp,
  fee: initialFee,
  handleChangeFee,
  toggleModal,
  handleCloseModal,
  dispenser,
}: Props) => {
  const { wallet } = walletContext;
  const [quantity, setQuantity] = useState(1);
  // const [maxQuantity, setMaxQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isAmountTooltipVisible, setIsAmountTooltipVisible] = useState(false);
  const amountTooltipTimeoutRef = useRef<number | null>(null);

  const {
    formState,
    handleChangeFee: internalHandleChangeFee,
    handleSubmit,
    isSubmitting,
    error,
    successMessage,
    setSuccessMessage,
  } = useTransactionForm({
    type: "buy",
    initialFee,
  });

  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  useEffect(() => {
    if (dispenser) {
      // const maxQty = Math.floor(
      //   dispenser.give_remaining / dispenser.give_quantity,
      // );
      // setMaxQuantity(maxQty);
      setTotalPrice(quantity * dispenser.satoshirate);
    }
  }, [dispenser, quantity]);

  useEffect(() => {
    return () => {
      if (amountTooltipTimeoutRef.current) {
        globalThis.clearTimeout(amountTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleAmountMouseEnter = () => {
    if (amountTooltipTimeoutRef.current) {
      globalThis.clearTimeout(amountTooltipTimeoutRef.current);
    }

    amountTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsAmountTooltipVisible(true);
    }, 1500);
  };

  const handleAmountMouseLeave = () => {
    if (amountTooltipTimeoutRef.current) {
      globalThis.clearTimeout(amountTooltipTimeoutRef.current);
    }
    setIsAmountTooltipVisible(false);
  };

  const handleMouseDown = () => {
    if (amountTooltipTimeoutRef.current) {
      globalThis.clearTimeout(amountTooltipTimeoutRef.current);
    }
    setIsAmountTooltipVisible(false);
  };

  const handleBuyClick = async () => {
    await handleSubmit(async () => {
      // Convert fee rate from sat/vB to sat/kB
      const feeRateKB = formState.fee * 1000;

      const options = {
        return_psbt: true,
        fee_per_kb: feeRateKB,
      };

      const response = await fetch("/api/v2/create/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: wallet.address,
          dispenser: dispenser.source,
          quantity: totalPrice,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create dispense transaction.",
        );
      }

      const responseData = await response.json();

      if (!responseData?.psbt || !responseData?.inputsToSign) {
        throw new Error("Invalid response: Missing PSBT or inputsToSign");
      }

      // PSBT is already in hex format with witness data from backend
      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.psbt,
        responseData.inputsToSign,
        true,
      );

      if (signResult.signed && signResult.txid) {
        setSuccessMessage(
          `Transaction broadcasted successfully. TXID: ${signResult.txid}`,
        );
        setTimeout(toggleModal, 5000);
      } else if (signResult.cancelled) {
        throw new Error("Transaction signing was cancelled.");
      } else {
        throw new Error(`Failed to sign PSBT: ${signResult.error}`);
      }
    });
  };

  // Add debug logging
  useEffect(() => {
    logger.debug("ui", {
      message: "WalletDonateModal mounted",
      component: "WalletDonateModal",
    });

    return () => {
      logger.debug("ui", {
        message: "WalletDonateModal unmounting",
        component: "WalletDonateModal",
      });
    };
  }, []);

  // Helper functions to convert between slider position and amount value
  const amountToSliderPos = (amount: number) =>
    amount <= 20
      ? (amount / 20) * 66.67
      : 66.67 + ((amount - 20) / 480) * 33.33;

  const sliderPosToAmount = (pos: number) => {
    if (pos <= 66.67) {
      return Math.round((pos / 66.67) * 20); // 1-20 with 1.0 steps
    }
    const value = 20 + ((pos - 66.67) / 33.33) * 480;
    return Math.min(500, Math.round(value)); // 20-500 with 1.0 steps
  };

  return (
    <ModalLayout
      onClose={() => {
        logger.debug("ui", {
          message: "Modal closing",
          component: "WalletDonateModal",
        });
        handleCloseModal();
      }}
      title="DONATE"
    >
      <div className="mb-6">
        <p className="text-3xl mobileLg:text-4xl font-bold text-stamp-grey-light text-center">
          {(totalPrice / 100000000).toFixed(8)}{" "}
          <span className="font-extralight">BTCc</span>
        </p>
      </div>

      <div className="flex flex-row gap-6">
        <div className="flex flex-col w-[156px] mobileLg:w-[164px]">
          <StampImage
            stamp={stamp}
            className=""
            flag={false}
          />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex flex-col items-start -space-y-0.5">
            <p className="text-lg mobileLg:text-xl font-bold text-stamp-grey-light">
              <span className="font-light text-stamp-grey-darker">RECEIVE</span>
              <br />
              {quantity * 1000}{" "}
              <span className="font-light">
                USDSTAMPS
              </span>
              {quantity * 1000 > 1 ? "" : ""}
            </p>
          </div>

          <div className="mt-[18px]">
            <div
              className="relative w-full group"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleAmountMouseEnter}
              onMouseLeave={handleAmountMouseLeave}
              onMouseDown={handleMouseDown}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min="1"
                max="100"
                step="0.25"
                value={amountToSliderPos(quantity)}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  setQuantity(
                    Math.max(1, sliderPosToAmount(parseFloat(target.value))),
                  );
                }}
                className="w-full h-1 mobileLg:h-1.5 rounded-lg appearance-none cursor-pointer bg-stamp-grey [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:mobileLg:w-[22px] [&::-webkit-slider-thumb]:mobileLg:h-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-stamp-purple-dark [&::-webkit-slider-thumb]:hover:bg-stamp-purple [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:mobileLg:w-[22px] [&::-moz-range-thumb]:mobileLg:h-[22px] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-stamp-purple-dark [&::-moz-range-thumb]:hover:bg-stamp-purple-dark [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
              <div
                className={`${DonateModalStyles.tooltipImage} ${
                  isAmountTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 6}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                SELECT AMOUNT
              </div>
            </div>
          </div>
        </div>
      </div>

      <BasicFeeCalculator
        fee={formState.fee}
        handleChangeFee={(newFee) => {
          logger.debug("ui", {
            message: "Fee changing",
            newFee,
            component: "WalletDonateModal",
          });
          internalHandleChangeFee(newFee);
        }}
        type="buy"
        fromPage="donate"
        amount={totalPrice}
        receive={quantity * 1000}
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={() => {
          logger.debug("ui", {
            message: "Submit clicked",
            component: "WalletDonateModal",
          });
          handleBuyClick();
        }}
        onCancel={() => {
          logger.debug("ui", {
            message: "Cancel clicked",
            component: "WalletDonateModal",
          });
          handleCloseModal();
        }}
        buttonName="DONATE"
        className="pt-9 mobileLg:pt-12"
        userAddress={wallet?.address ?? ""}
        inputType="P2WPKH"
        outputTypes={["P2WPKH"]}
      />

      {error && <div className="text-red-500 mt-2">{error}</div>}
      {successMessage && (
        <div className="text-green-500 mt-2">{successMessage}</div>
      )}
    </ModalLayout>
  );
};

export default WalletDonateModal;
