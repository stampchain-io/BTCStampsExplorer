import { useEffect, useState } from "preact/hooks";
import type { StampRow } from "$globals";
import StampImage from "$islands/stamp/details/StampImage.tsx";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { logger } from "$lib/utils/logger.ts";

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
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [_pricePerUnit, setPricePerUnit] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const {
    formState,
    handleChangeFee: internalHandleChangeFee,
    handleSubmit,
    isSubmitting,
    error,
    _setError,
    successMessage,
    setSuccessMessage,
  } = useTransactionForm({
    type: "buy",
    initialFee,
  });

  // Sync external fee state with internal state
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  useEffect(() => {
    if (dispenser) {
      const maxQty = Math.floor(
        dispenser.give_remaining / dispenser.give_quantity,
      );
      setMaxQuantity(maxQty);
      setPricePerUnit(dispenser.satoshirate);
      setTotalPrice(quantity * dispenser.satoshirate);
    }
  }, [dispenser, quantity]);

  const handleQuantityChange = (e: Event) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    if (value > maxQuantity) {
      setQuantity(maxQuantity);
    } else if (value < 1 || isNaN(value)) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }
  };

  const handleSliderChange = (e: Event) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    setQuantity(value);
    // Add immediate update for smooth sliding
    e.target.addEventListener("input", (event) => {
      const target = event.target as HTMLInputElement;
      setQuantity(parseInt(target.value));
    });
    logger.debug("ui", {
      message: "Slider changed",
      newValue: value,
      component: "WalletDonateModal",
    });
  };

  const handleBuyClick = async () => {
    await handleSubmit(async () => {
      // Convert fee rate from sat/vB to sat/kB
      const feeRateKB = formState.fee * 1000;
      console.log("Fee rate conversion:", {
        satVB: formState.fee,
        satKB: feeRateKB,
      });

      const options = {
        return_psbt: true,
        fee_per_kb: feeRateKB,
      };

      console.log("Creating dispense transaction:", {
        address: wallet.address,
        dispenser: dispenser.source,
        quantity: quantity,
        feeRate: options.fee_per_kb,
      });

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
      console.log("Dispense response:", responseData);

      if (!responseData?.psbt || !responseData?.inputsToSign) {
        throw new Error("Invalid response: Missing PSBT or inputsToSign");
      }

      // PSBT is already in hex format with witness data from backend
      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.psbt,
        responseData.inputsToSign,
        true, // Enable RBF
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

  const inputField =
    "h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";

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

  // Update total price when quantity or dispenser changes
  useEffect(() => {
    if (dispenser) {
      const price = quantity * dispenser.satoshirate;
      setTotalPrice(price);
      console.log("Price updated:", {
        quantity,
        rate: dispenser.satoshirate,
        total: price,
      });
    }
  }, [quantity, dispenser]);

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
      preventPropagation={false}
    >
      <div className="mb-6">
        <p className="text-3xl mobileLg:text-4xl font-bold text-stamp-grey-light text-center">
          {(totalPrice / 100000000).toFixed(8)}{" "}
          <span className="font-extralight">BTC</span>
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
              {" "}
              {quantity} EDITION{quantity > 1 ? "S" : ""}
            </p>
            <p className="text-sm mobileLg:text-base font-medium text-stamp-grey-darker">
              MAX {maxQuantity}
            </p>
          </div>

          <div className="mt-6">
            <input
              type="range"
              min="1"
              max={maxQuantity}
              value={quantity}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                setQuantity(parseInt(target.value));
              }}
              className="w-full h-1 mobileLg:h-1.5 rounded-lg appearance-none cursor-pointer bg-stamp-grey [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:mobileLg:w-[22px] [&::-webkit-slider-thumb]:mobileLg:h-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-stamp-purple-dark [&::-webkit-slider-thumb]:hover:bg-stamp-purple [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:mobileLg:w-[22px] [&::-moz-range-thumb]:mobileLg:h-[22px] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-stamp-purple-dark [&::-moz-range-thumb]:hover:bg-stamp-purple-dark [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>

      <BasicFeeCalculator
        isModal={true}
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
        amount={totalPrice}
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
        userAddress={wallet?.address}
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
