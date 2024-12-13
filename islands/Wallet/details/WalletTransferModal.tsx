// islands/stamp/details/WalletTransferModal.tsx
import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { SelectField } from "$islands/stamping/SelectField.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import type { StampRow } from "$globals";
import { getStampImageSrc, handleImageError } from "$lib/utils/imageUtils.ts";

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
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [imgSrc, setImgSrc] = useState("");
  const [selectedStamp, setSelectedStamp] = useState<StampRow | null>(null);

  const {
    formState,
    setFormState,
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

  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      if (value >= 1 && value <= maxQuantity) {
        setQuantity(value);
      } else if (value < 1) {
        setQuantity(1);
      } else if (value > maxQuantity) {
        setQuantity(maxQuantity);
      }
    }
  };
  const getMaxQuantity = () => {
    if (selectedStamp) {
      setMaxQuantity(selectedStamp?.unbound_quantity);
    }
  };

  useEffect(() => {
    getMaxQuantity();
    setImgSrc(getStampImageSrc(selectedStamp as StampRow));
  }, [selectedStamp]);

  const inputField =
    "h-[42px] mobileLg:h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";

  return (
    <ModalLayout onClose={handleCloseModal} title="TRANSFER">
      <div className="flex w-full gap-3 mobileMd:gap-6">
        <div className="flex items-center justify-center rounded-sm min-w-[96px] h-[96px] mobileMd:min-w-[108px] mobileMd:h-[108px] mobileLg:min-w-[120px] mobileLg:h-[120px] bg-stamp-purple-darker">
          {selectedStamp
            ? (
              <img
                src={imgSrc}
                onError={handleImageError}
                loading="lazy"
                alt={`Stamp #${selectedStamp.stamp}`}
                className="w-full h-full object-contain pixelart"
              />
            )
            : (
              <img
                src="/img/stamping/image-upload.svg"
                class="-7 h-7 mobileMd:w-8 mobileMd:h-8 mobileLg:w-9 mobileLg:h-9"
                alt=""
              />
            )}
        </div>

        <div className="flex flex-col gap-3 mobileMd:gap-6 flex-1">
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

          <div className="flex w-full justify-between items-start">
            <div className="flex flex-col justify-start -space-y-0.5">
              <p className="text-lg mobileLg:text-xl font-bold text-stamp-grey">
                EDITIONS
              </p>
              <p className="text-sm mobileLg:text-base font-medium text-stamp-grey-darker">
                MAX {maxQuantity}
              </p>
            </div>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              className={`${inputField} !w-[42px] mobileLg:!w-12 text-center`}
            />
          </div>
        </div>
      </div>

      <div className="flex pt-3 mobileMd:pt-6">
        <input
          value={formState.recipientAddress}
          onInput={(e) =>
            setFormState({
              ...formState,
              recipientAddress: (e.target as HTMLInputElement).value,
            })}
          placeholder="Recipient address"
          className={inputField}
        />
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
