// islands/stamp/details/WalletTransferModal.tsx
import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { TransactionFeeDetails } from "$components/shared/modal/TransactionFeeDetails.tsx";
import { SelectField } from "$islands/stamping/SelectField.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import type { StampRow } from "globals";

interface Props {
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
}

function WalletTransferModal({
  fee: initialFee,
  handleChangeFee,
  toggleModal,
  handleCloseModal,
}: Props) {
  const { wallet } = walletContext;
  const [quantity, setQuantity] = useState(1);
  const [selectedStamp, setSelectedStamp] = useState<StampRow | null>(null);

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
    type: "transfer",
    initialFee,
  });

  // Sync external fee state with internal state
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  const handleTransferSubmit = async () => {
    await handleSubmit(async () => {
      if (!selectedStamp) {
        throw new Error("Please select a stamp to transfer");
      }

      const options = {
        return_psbt: true,
        fee_per_kb: formState.fee,
      };

      const requestBody = {
        address: wallet.address,
        stampId: selectedStamp.stamp,
        quantity,
        options,
      };

      const response = await fetch("/api/v2/create/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create transfer transaction.",
        );
      }

      const responseData = await response.json();
      if (!responseData?.result?.psbt) {
        throw new Error("Failed to create transfer transaction.");
      }

      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.result.psbt,
        [], // Empty array for inputs to sign
        true, // Enable RBF
      );

      if (signResult.signed && signResult.txid) {
        setSuccessMessage(
          `Transfer initiated successfully. TXID: ${signResult.txid}`,
        );
        setTimeout(toggleModal, 5000);
      } else if (signResult.cancelled) {
        throw new Error("Transaction signing was cancelled.");
      } else {
        throw new Error(`Failed to sign PSBT: ${signResult.error}`);
      }
    });
  };

  const handleStampSelect = (value: string) => {
    // Implement stamp selection logic
    // This would typically fetch the stamp details and update selectedStamp
  };

  return (
    <ModalLayout onClose={handleCloseModal} title="TRANSFER">
      <div className="flex justify-between items-center">
        <div className="w-[144px] h-[144px] bg-[#660099] rounded-md flex items-center justify-center">
          {selectedStamp
            ? (
              <img
                src={`/api/v2/stamp/${selectedStamp.stamp}/content`}
                alt={`Stamp #${selectedStamp.stamp}`}
                className="w-full h-full object-contain"
              />
            )
            : <span className="text-white">Select Stamp</span>}
        </div>

        <div className="flex flex-col gap-4">
          <SelectField
            value={selectedStamp?.stamp?.toString() || ""}
            onChange={(e) => {
              // Handle stamp selection
              const value = (e.target as HTMLInputElement).value;
              handleStampSelect(value);
            }}
          />

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(parseInt((e.target as HTMLInputElement).value, 10))}
            className="bg-[#999999] text-[#666666] font-bold text-xl rounded-md p-3"
          />
        </div>
      </div>

      <TransactionFeeDetails
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="transfer"
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={handleTransferSubmit}
        onCancel={toggleModal}
        buttonName="TRANSFER"
        className="border-t border-[#333333] pt-4"
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
}

export default WalletTransferModal;
