// islands/stamp/details/StampBuyModal.tsx
import { useEffect, useState } from "preact/hooks";
import type { StampRow } from "globals";
import StampImage from "./StampImage.tsx";
import { walletContext } from "$client/wallet/wallet.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
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

  // Handle dispenser data
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
    setQuantity(Math.max(1, Math.min(value || 1, maxQuantity)));
  };

  const handleBuyClick = async () => {
    await handleSubmit(async () => {
      const options = {
        return_psbt: true,
        fee_per_kb: formState.fee,
      };

      const requestBody = {
        address: wallet.address,
        dispenser: dispenser.source,
        quantity: totalPrice,
        options,
      };

      const response = await fetch("/api/v2/create/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create dispense transaction.",
        );
      }

      const responseData = await response.json();
      if (!responseData?.result?.psbt) {
        throw new Error("Failed to create dispense transaction.");
      }

      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.result.psbt,
        [], // Empty array for inputs to sign
        true, // Enable RBF
      );

      if (signResult.signed) {
        const txid = await walletContext.broadcastPSBT(signResult.psbt);
        setSuccessMessage(
          `Transaction broadcasted successfully. TXID: ${txid}`,
        );
        setTimeout(toggleModal, 5000);
      } else if (signResult.cancelled) {
        throw new Error("Transaction signing was cancelled.");
      } else {
        throw new Error(`Failed to sign PSBT: ${signResult.error}`);
      }
    });
  };

  return (
    <ModalLayout onClose={handleCloseModal} title="BUY">
      {/* Stamp preview and quantity selector */}
      <div className="flex justify-between">
        <StampImage
          stamp={stamp}
          className="w-[144px] !p-3 border-2 border-[#9900EE] rounded-md shadow-[0px_0px_20px_#9900EE]"
          flag={false}
        />
        <div className="flex flex-col justify-between items-end">
          <p className="purple-gradient4 text-4xl font-black text-center">
            #{stamp.stamp}
          </p>
          <div className="flex justify-between items-center w-full gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-xl font-bold text-[#999999]">EDITIONS</p>
              <span className="text-[#666666]">MAX {maxQuantity}</span>
            </div>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              className="bg-[#999999] text-[#666666] font-bold text-xl rounded-md p-3"
            />
          </div>
        </div>
      </div>

      {/* Fee estimation and action buttons */}
      <FeeEstimation
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="stamp"
        fileType="application/json"
        fileSize={stamp.contentLength}
        BTCPrice={formState.BTCPrice}
        onRefresh={() => {}}
        isSubmitting={isSubmitting}
        onSubmit={handleBuyClick}
        buttonName="BUY"
        isModal={true}
        onCancel={toggleModal}
        className="border-t border-[#333333] pt-4"
      />

      {/* Error and success messages */}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {successMessage && (
        <div className="text-green-500 mt-2">{successMessage}</div>
      )}
    </ModalLayout>
  );
};

export default StampBuyModal;
