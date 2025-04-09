import { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { SelectField } from "$islands/tool/SelectField.tsx";
import { logger } from "$lib/utils/logger.ts";
import type { StampRow } from "$globals";
import { ContentStyles } from "./styles.ts";

interface Props {
  trxType: string;
}

export function TransferStampContent({}: Props) {
  const { wallet } = walletContext;
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedStamp, setSelectedStamp] = useState<StampRow | null>(null);
  const [stamps, setStamps] = useState<{
    data: StampRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  });
  const [tosAgreed, setTosAgreed] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const {
    formState,
    setFormState,
    handleChangeFee: internalHandleChangeFee,
    handleSubmit,
    isSubmitting,
    error,
    setError,
    successMessage,
  } = useTransactionForm({
    type: "transfer",
    initialFee: 1,
  });

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        if (!wallet?.address) return;

        const endpoint = `/api/v2/stamps/balance/${wallet.address}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch stamps: ${errorText}`);
        }

        const data = await response.json();
        setStamps({
          data: data.data || [],
          pagination: {
            page: 1,
            limit: 10,
            total: data.total || 0,
            totalPages: Math.ceil((data.total || 0) / 10),
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error)); // Fallback in case it's not an instance of Error
        }
      }
    };

    if (wallet?.address) {
      fetchStamps();
    }
  }, [wallet?.address]);

  useEffect(() => {
    if (stamps.data.length > 0 && !selectedStamp) {
      const firstStamp = stamps.data[0];
      setSelectedStamp(firstStamp);
      setFormState((prev) => ({
        ...prev,
        stampId: firstStamp.stamp,
        cpid: firstStamp.cpid,
      }));
    }
  }, [stamps.data]);

  const handleStampSelect = (e: Event) => {
    const value = (e.currentTarget as HTMLSelectElement).value;
    const selectedItem = stamps.data.find(
      (item) => item?.stamp?.toString() === value,
    );

    if (selectedItem) {
      setSelectedStamp(selectedItem);
      setFormState((prev) => ({
        ...prev,
        stampId: selectedItem.stamp,
        cpid: selectedItem.cpid,
      }));
    }
  };

  const handleQuantityChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.value || input.value === "0") {
      input.value = "1";
    }
    setQuantity(parseInt(input.value));
  };

  const handleTransferSubmit = async () => {
    try {
      await logger.debug("stamps", {
        message: "Starting transfer submit",
        selectedStamp,
        formState,
        quantity,
      });
      await handleSubmit(() => Promise.resolve());
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error)); // Fallback in case it's not an instance of Error
      }
    }
  };

  const renderStampContent = () => {
    if (!selectedStamp) {
      return (
        <img
          src="/img/stamping/image-upload.svg"
          class="w-7 h-7 mobileMd:w-8 mobileMd:h-8 mobileLg:w-9 mobileLg:h-9"
          alt=""
        />
      );
    }

    // Construct stamp URL using tx_hash
    const stampUrl = `https://stampchain.io/s/${selectedStamp.tx_hash}`;

    return (
      <div class="relative w-full h-full">
        {isImageLoading && (
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="animate-spin rounded-full w-7 h-7 mobileMd:w-8 mobileMd:h-8 mobileLg:w-9 mobileLg:h-9 border-b-[3px] border-stamp-grey" />
          </div>
        )}
        <img
          src={stampUrl}
          alt={`Stamp #${selectedStamp.stamp}`}
          class={`w-full h-full object-contain pixelart transition-opacity duration-300 ${
            isImageLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsImageLoading(false)}
          onError={(e) => {
            setIsImageLoading(false);
            (e.target as HTMLImageElement).src =
              "/img/stamping/image-upload.svg";
          }}
        />
      </div>
    );
  };

  // Reset loading state when selected stamp changes
  useEffect(() => {
    setIsImageLoading(true);

    if (selectedStamp) {
      setMaxQuantity(selectedStamp?.unbound_quantity);
    }
  }, [selectedStamp?.tx_hash]);

  return (
    <div class={ContentStyles.bodyTools}>
      <h1 class={ContentStyles.titlePurpleLDCenter}>TRANSFER</h1>

      <div class={ContentStyles.inputFieldContainer}>
        <div class="w-full flex gap-3 mobileMd:gap-6">
          <div class="flex items-center justify-center rounded w-[96px] h-[96px] mobileMd:w-[108px] mobileMd:h-[108px] mobileLg:w-[120px] mobileLg:h-[120px] bg-stamp-purple-darker overflow-hidden">
            {renderStampContent()}
          </div>

          <div class="flex flex-col flex-1 gap-3 mobileMd:gap-6">
            <SelectField
              options={stamps.data}
              onChange={handleStampSelect}
            />

            <div class="flex w-full justify-end items-center gap-[18px] mobileMd:gap-[30px]">
              <div class="flex flex-col justify-start -space-y-0.5">
                <p class="text-xl mobileLg:text-2xl font-bold text-stamp-grey">
                  EDITIONS
                </p>
                <p class="text-sm mobileLg:text-base font-medium text-stamp-grey-darker">
                  MAX {maxQuantity}
                </p>
              </div>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                class={`${ContentStyles.inputField} !w-[42px] mobileLg:!w-12 text-center`}
              />
            </div>
          </div>
        </div>
        <div class="flex w-full">
          <input
            value={formState.recipientAddress}
            onInput={(e: JSX.TargetedEvent<HTMLInputElement>) =>
              setFormState((prev) => ({
                ...prev,
                recipientAddress: e.currentTarget.value,
              }))}
            placeholder="Recipient address"
            class={ContentStyles.inputField}
          />
        </div>
      </div>

      <div class={ContentStyles.feeSelectorContainer}>
        <BasicFeeCalculator
          fee={formState.fee}
          handleChangeFee={internalHandleChangeFee}
          type="transfer"
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={handleTransferSubmit}
          buttonName={wallet?.address ? "TRANSFER" : "CONNECT WALLET"}
          className="pt-9 mobileLg:pt-12"
          userAddress={wallet?.address || ""}
          inputType="P2WPKH"
          outputTypes={["P2WPKH"]}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
        />
      </div>

      {error && (
        <div class="text-red-500 text-center mt-4 font-medium">
          {error}
        </div>
      )}
      {successMessage && (
        <div class="text-green-500 text-center mt-4 font-medium">
          {successMessage}
        </div>
      )}
    </div>
  );
}
