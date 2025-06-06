// islands/stamp/details/WalletSendStampModal.tsx
import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { SelectField } from "$islands/stamping/SelectField.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import type { StampRow } from "$globals";
import { getStampImageSrc, handleImageError } from "$lib/utils/imageUtils.ts";
import { logger } from "$lib/utils/logger.ts";

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

function WalletSendStampModal({
  fee: initialFee,
  handleChangeFee = () => {},
  toggleModal,
  handleCloseModal,
  stamps,
}: Props) {
  const { wallet } = walletContext;
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [quantity, setQuantity] = useState(0);
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
    try {
      await logger.debug("stamps", {
        message: "Starting transfer submit",
        selectedStamp,
        formState,
        quantity,
        recipientAddress: formState.recipientAddress,
      });

      // Validate required fields before proceeding
      if (!formState.recipientAddress) {
        await logger.error("stamps", {
          message: "Transfer failed - missing recipient address",
        });
        setError("Recipient address is required");
        return;
      }

      if (!quantity || quantity <= 0) {
        await logger.error("stamps", {
          message: "Transfer failed - invalid quantity",
          quantity,
        });
        setError("Invalid quantity");
        return;
      }

      await handleSubmit(async () => {
        if (!selectedStamp) {
          await logger.error("stamps", {
            message: "Transfer failed - no stamp selected",
          });
          throw new Error("Please select a stamp to transfer");
        }

        if (!wallet?.address) {
          await logger.error("stamps", {
            message: "Transfer failed - no wallet connected",
          });
          throw new Error("No wallet connected");
        }

        // Convert fee rate from sat/vB to sat/kB
        const feeRateKB = formState.fee * 1000;
        await logger.debug("stamps", {
          message: "Transfer fee rate conversion",
          satVB: formState.fee,
          satKB: feeRateKB,
          wallet: wallet?.address,
        });

        const options = {
          return_psbt: true,
          fee_per_kb: feeRateKB,
          allow_unconfirmed_inputs: true,
          validate: true,
        };

        const requestBody = {
          address: wallet.address,
          destination: formState.recipientAddress,
          asset: selectedStamp.cpid,
          quantity: quantity,
          options,
        };

        await logger.debug("stamps", {
          message: "Preparing send request",
          requestBody,
          endpoint: "/api/v2/create/send",
        });

        try {
          const response = await fetch("/api/v2/create/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          await logger.debug("stamps", {
            message: "Received response from /api/v2/create/send",
            status: response.status,
            ok: response.ok,
          });

          if (!response.ok) {
            const errorData = await response.json();
            await logger.error("stamps", {
              message: "Send transaction creation failed",
              error: errorData.error,
              status: response.status,
            });
            throw new Error(
              errorData.error || "Failed to create send transaction.",
            );
          }

          const responseData = await response.json();
          await logger.debug("stamps", {
            message: "Send response received",
            responseData,
          });

          if (!responseData?.psbt || !responseData?.inputsToSign) {
            await logger.error("stamps", {
              message: "Invalid response structure",
              responseData,
            });
            throw new Error("Invalid response: Missing PSBT or inputsToSign");
          }

          // Sign the PSBT
          await logger.debug("stamps", {
            message: "Attempting to sign PSBT",
            psbt: responseData.psbt,
            inputsToSign: responseData.inputsToSign,
          });

          const signResult = await walletContext.signPSBT(
            wallet,
            responseData.psbt,
            responseData.inputsToSign,
            true, // Enable RBF
          );

          await logger.debug("stamps", {
            message: "PSBT signing result",
            signResult,
          });

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
        } catch (fetchError) {
          await logger.error("stamps", {
            message: "Fetch error in send request",
            error: fetchError instanceof Error
              ? fetchError.message
              : "Unknown error",
          });
          throw fetchError;
        }
      });
    } catch (error) {
      await logger.error("stamps", {
        message: "Transfer submit error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleQuantityChange = (
    e: Event,
  ): void => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    let tmpValue = value;
    if (!isNaN(value)) {
      if (value >= 1 && value <= maxQuantity) {
        tmpValue = value;
      } else if (value < 1) {
        tmpValue = 1;
      } else if (value > maxQuantity) {
        tmpValue = maxQuantity;
      }
      setQuantity(tmpValue);
      setFormState({
        ...formState,
        amount: tmpValue.toString(),
      });
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

  useEffect(() => {
    logger.debug("stamps", {
      message: "Form state updated",
      formState,
      selectedStamp,
      quantity,
    });
  }, [formState, selectedStamp, quantity]);

  const inputField =
    "h-[42px] mobileLg:h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";

  return (
    <ModalLayout onClose={handleCloseModal} title="TRANSFER">
      <div className="flex w-full gap-3 mobileMd:gap-6">
        <div className="flex items-center justify-center rounded min-w-[96px] h-[96px] mobileMd:min-w-[108px] mobileMd:h-[108px] mobileLg:min-w-[120px] mobileLg:h-[120px] bg-stamp-purple-darker">
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

      {error && (
        <div className="text-red-500 text-center mt-4 font-medium">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="text-green-500 text-center mt-4 font-medium">
          {successMessage}
        </div>
      )}
    </ModalLayout>
  );
}

export default WalletSendStampModal;
