// islands/stamp/details/StampBuyModal.tsx
import { useEffect, useState } from "preact/hooks";
import type { StampRow } from "$globals";
import StampImage from "$islands/stamp/details/StampImage.tsx";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";

interface Props {
  stamp: StampRow;
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
  dispenser: any;
}

const StampBuyModal = ({
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
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const {
    formState,
    handleChangeFee: internalHandleChangeFee,
    handleSubmit,
    isSubmitting,
    error,
    setError,
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

  return (
    <ModalLayout onClose={handleCloseModal} title="BUY">
      <div class="flex flex-row gap-6">
        <div class="flex flex-col w-[156px] mobileLg:w-[164px]">
          <StampImage
            stamp={stamp}
            class=""
            flag={false}
          />
        </div>
        <div class="flex flex-col w-full">
          <p class="text-3xl mobileLg:text-4xl gray-gradient1 font-black">
            <span class="text-stamp-grey-light font-light">
              #
            </span>
            {stamp.stamp}
          </p>

          <div class="flex flex-row pt-3 w-full justify-between items-center">
            <div class="flex flex-col items-start -space-y-0.5">
              <p class="text-xl mobileLg:text-2xl font-bold text-stamp-grey">
                EDITIONS
              </p>
              <p class="text-sm mobileLg:text-base font-medium text-stamp-grey-darker">
                MAX {maxQuantity}
              </p>
            </div>
            <div class="flex flex-col items-end">
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                class={`${inputField} !w-12 text-center`}
              />
            </div>
          </div>
        </div>
      </div>

      <BasicFeeCalculator
        isModal={true}
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="buy"
        amount={totalPrice}
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={handleBuyClick}
        onCancel={toggleModal}
        buttonName="BUY"
        class="pt-9 mobileLg:pt-12"
        userAddress={wallet?.address}
        inputType="P2WPKH"
        outputTypes={["P2WPKH"]}
      />

      {error && <div class="text-red-500 mt-2">{error}
      </div>}
      {successMessage && <div class="text-green-500 mt-2">{successMessage}
      </div>}
    </ModalLayout>
  );
};

export default StampBuyModal;
