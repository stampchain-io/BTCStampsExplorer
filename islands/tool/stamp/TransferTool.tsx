/* ===== TRANSFER STAMP CONTENT COMPONENT ===== */
import { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { FeeCalculatorSimple } from "$components/section/FeeCalculatorSimple.tsx";
import { SelectField } from "../../form/SelectField.tsx";
import { logger } from "$lib/utils/logger.ts";
import type { StampRow } from "$globals";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  containerRowForm,
  imagePreviewTool,
  loaderSpinGrey,
  rowForm,
} from "$layout";
import { titlePurpleLD } from "$text";
import { Icon } from "$icon";
import { inputField, inputFieldSquare } from "$form";

/* ===== TYPES ===== */
interface Props {
  trxType: string;
}

/* ===== COMPONENT ===== */
export function StampTransferTool({}: Props) {
  /* ===== CONTEXT ===== */
  const { wallet } = walletContext;

  /* ===== STATE ===== */
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
  const [showFallbackIcon, setShowFallbackIcon] = useState(false);

  /* ===== FORM HANDLING ===== */
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

  /* ===== EFFECTS ===== */
  // Fetch stamps effect
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

    // Only fetch if we have a wallet address
    if (wallet?.address) {
      fetchStamps();
    }
  }, [wallet?.address]);

  // Set initial stamp effect
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

  // Reset loading state when selected stamp changes
  useEffect(() => {
    setIsImageLoading(true);

    if (selectedStamp) {
      setMaxQuantity(selectedStamp?.unbound_quantity);
    }
  }, [selectedStamp?.tx_hash]);

  // Add at the top level of the component
  useEffect(() => {
    console.log("Values updated:", {
      recipientAddress: formState.recipientAddress,
      stamp: selectedStamp?.stamp,
      quantity: quantity,
    });
  }, [formState.recipientAddress, selectedStamp?.stamp, quantity]);

  /* ===== EVENT HANDLERS ===== */
  const handleStampSelect = (e: Event) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling

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
    e.preventDefault(); // Prevent form submission

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

  /* ===== RENDER HELPERS ===== */
  const renderStampContent = () => {
    if (!selectedStamp) {
      return (
        <Icon
          type="icon"
          name="image"
          weight="normal"
          size="xxl"
          color="grey"
        />
      );
    }

    // Construct stamp URL using tx_hash
    const stampUrl = `https://stampchain.io/s/${selectedStamp.tx_hash}`;

    return (
      <div class="relative w-full h-full">
        {isImageLoading && (
          <div class="absolute inset-0 flex items-center justify-center">
            <div class={loaderSpinGrey} />
          </div>
        )}
        {showFallbackIcon
          ? (
            <div class="flex items-center justify-center w-full h-full">
              <Icon
                type="icon"
                name="image"
                weight="normal"
                size="xxl"
                color="grey"
              />
            </div>
          )
          : (
            <img
              src={stampUrl}
              alt={`Stamp #${selectedStamp.stamp}`}
              class={`w-full h-full object-contain pixelart transition-opacity duration-300 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={(e) => {
                setIsImageLoading(false);
                setShowFallbackIcon(true);
              }}
            />
          )}
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

  /* ===== RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>TRANSFER</h1>

      {/* ===== STAMP SELECTION SECTION ===== */}
      <form
        class={`${containerBackground} mb-6`}
        onSubmit={(e) => {
          e.preventDefault();
          handleTransferSubmit();
        }}
        aria-label="Transfer stamp"
        novalidate
      >
        <div class={`${containerRowForm} mb-5`}>
          <div class={imagePreviewTool}>
            {renderStampContent()}
          </div>

          <div class={containerColForm}>
            <SelectField
              options={stamps.data}
              onChange={handleStampSelect}
            />

            <div class="flex w-full justify-end items-center gap-5">
              <div class="flex flex-col justify-start -space-y-0.5">
                <h5 class="text-xl font-bold text-stamp-grey">
                  EDITIONS
                </h5>
                <h6 class="text-sm font-medium text-stamp-grey-darker">
                  MAX {maxQuantity}
                </h6>
              </div>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                class={inputFieldSquare}
                aria-label="Number of editions to transfer"
              />
            </div>
          </div>
        </div>
        <div class={rowForm}>
          <input
            value={formState.recipientAddress}
            onInput={(e: JSX.TargetedEvent<HTMLInputElement>) =>
              setFormState((prev) => ({
                ...prev,
                recipientAddress: e.currentTarget.value,
              }))}
            placeholder="Recipient address"
            class={inputField}
            aria-label="Recipient address"
          />
        </div>
      </form>

      {/* ===== FEE CALCULATOR SECTION ===== */}
      <div class={containerBackground}>
        <FeeCalculatorSimple
          fee={formState.fee}
          handleChangeFee={internalHandleChangeFee}
          type="transfer"
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={handleTransferSubmit}
          buttonName={wallet?.address ? "TRANSFER" : "CONNECT WALLET"}
          userAddress={wallet?.address || ""}
          inputType="P2WPKH"
          outputTypes={["P2WPKH"]}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          fromPage="stamp_transfer"
          stampTransferDetails={{
            address: formState.recipientAddress || "",
            stamp: selectedStamp?.stamp || "",
            editions: quantity || 0,
          }}
        />
      </div>

      {/* ===== STATUS MESSAGES ===== */}
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
