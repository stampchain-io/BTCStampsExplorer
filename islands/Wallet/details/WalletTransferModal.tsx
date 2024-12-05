// islands/stamp/details/WalletTransferModal.tsx
import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { SelectField } from "$islands/stamping/SelectField.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import type { StampRow } from "globals";

interface Props {
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
  stamps: {
    data: StampRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

function WalletTransferModal({
  fee: initialFee,
  handleChangeFee = () => {},
  toggleModal,
  handleCloseModal,
  stamps,
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

  return (
    <ModalLayout onClose={handleCloseModal} title="TRANSFER">
      <div className="flex justify-between items-center gap-2">
        <div className="min-w-[144px] h-[144px] bg-[#660099] rounded-md flex items-center justify-center">
          {selectedStamp
            ? (
              <img
                // src={`/api/v2/stamp/${selectedStamp.stamp}/content`}
                src={selectedStamp.stamp_url}
                alt={`Stamp #${selectedStamp.stamp}`}
                className="w-full h-full object-contain"
              />
            )
            : (
              <img
                src="/img/stamping/image-upload.svg"
                class="w-12 h-12"
                alt=""
              />
            )}
        </div>

        <div className="flex  w-1/2 flex-col gap-4">
          <SelectField
            options={stamps.data}
            value={selectedStamp?.stamp?.toString() || ""}
            onChange={(e) => {
              const selectedItem = stamps.data.find(
                (item) => item.tx_hash === e.currentTarget.value,
              );

              if (selectedItem) {
                setSelectedStamp(selectedItem);
              }
            }}
          />

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(parseInt((e.target as HTMLInputElement).value, 10))}
            className="bg-[#999999] text-[#666666] font-bold text-xl rounded-md p-3 w-full"
          />
        </div>
      </div>

      <BasicFeeCalculator
        isModal={true}
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="transfer"
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={handleTransferSubmit}
        onCancel={toggleModal}
        buttonName="TRANSFER"
        className="pt-9 mobileLg:pt-12"
        userAddress={wallet?.address}
        inputType="P2WPKH"
        outputTypes={["P2WPKH"]}
        tosAgreed={true}
      />

      {error && <div className="text-red-500 mt-2">{error}</div>}
      {successMessage && (
        <div className="text-green-500 mt-2">{successMessage}</div>
      )}
    </ModalLayout>
  );
}

export default WalletTransferModal;
