import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { SelectField } from "$islands/stamping/SelectField.tsx";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { logger } from "$lib/utils/logger.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import type { StampRow } from "$globals";

interface Props {
  trxType: string;
}

export function TransferStampContent({ trxType }: Props) {
  const { wallet } = walletContext;
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [quantity, setQuantity] = useState(0);
  const [imgSrc, setImgSrc] = useState("");
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
  const [stampImageUrl, setStampImageUrl] = useState<string>("");

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
    initialFee: 1, // Set an appropriate default value
  });

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        if (!wallet?.address) {
          console.log("[DEBUG] No wallet address available");
          return;
        }

        const endpoint = `/api/v2/stamps/balance/${wallet.address}`;
        console.log("[DEBUG] Fetching stamps from:", endpoint);

        const response = await fetch(endpoint);
        console.log("[DEBUG] Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[DEBUG] Response not OK:", {
            status: response.status,
            text: errorText,
          });
          throw new Error(`Failed to fetch stamps: ${errorText}`);
        }

        const data = await response.json();
        console.log("[DEBUG] Stamps data received:", data);

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
        console.error("[DEBUG] Error in fetchStamps:", {
          error,
          message: error.message,
        });
      }
    };

    if (wallet?.address) {
      console.log(
        "[DEBUG] Initiating stamps fetch for address:",
        wallet.address,
      );
      fetchStamps();
    }
  }, [wallet?.address]);

  // Auto-select first stamp when data loads
  useEffect(() => {
    if (stamps.data.length > 0 && !selectedStamp) {
      const firstStamp = stamps.data[0];
      console.log("[DEBUG] Auto-selecting first stamp:", firstStamp);

      const stampData: StampRow = {
        stamp: firstStamp.stamp,
        stamp_mimetype: firstStamp.stamp_mimetype || "image/png",
        stamp_url: firstStamp.stamp_url,
        tx_hash: firstStamp.tx_hash,
        cpid: firstStamp.cpid,
        creator: firstStamp.creator || "",
        creator_name: firstStamp.creator_name || null,
        divisible: firstStamp.divisible || 0,
        locked: firstStamp.locked || 1,
        supply: firstStamp.supply || 0,
        unbound_quantity: firstStamp.unbound_quantity || 0,
      };

      setSelectedStamp(stampData);
      setFormState((prev) => ({
        ...prev,
        stampId: stampData.stamp,
        cpid: stampData.cpid,
      }));
    }
  }, [stamps.data]);

  const handleTransferSubmit = async () => {
    try {
      await logger.debug("stamps", {
        message: "Starting transfer submit",
        selectedStamp,
        formState,
        quantity,
        recipientAddress: formState.recipientAddress,
      });

      // Validate required fields
      if (!formState.recipientAddress) {
        setError("Recipient address is required");
        return;
      }

      if (!quantity || quantity <= 0) {
        setError("Invalid quantity");
        return;
      }

      await handleSubmit(async () => {
        if (!selectedStamp) {
          throw new Error("Please select a stamp to transfer");
        }

        if (!wallet?.address) {
          throw new Error("No wallet connected");
        }

        // Convert fee rate from sat/vB to sat/kB
        const feeRateKB = formState.fee * 1000;

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

        const response = await fetch("/api/v2/create/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to create send transaction.",
          );
        }

        const responseData = await response.json();

        if (!responseData?.psbt || !responseData?.inputsToSign) {
          throw new Error("Invalid response: Missing PSBT or inputsToSign");
        }

        const signResult = await walletContext.signPSBT(
          wallet,
          responseData.psbt,
          responseData.inputsToSign,
          true,
        );

        if (signResult.signed && signResult.txid) {
          setSuccessMessage(
            `Transfer initiated successfully. TXID: ${signResult.txid}`,
          );
        } else if (signResult.cancelled) {
          throw new Error("Transaction signing was cancelled.");
        } else {
          throw new Error(`Failed to sign PSBT: ${signResult.error}`);
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleQuantityChange = (e: Event): void => {
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

  const handleStampSelect = (e: Event) => {
    const value = (e.currentTarget as HTMLSelectElement).value;
    console.log("[DEBUG] StampSelect - Selected value:", value);

    if (!value) {
      console.log("[DEBUG] No value selected");
      return;
    }

    const selectedItem = stamps.data.find(
      (item) => item.stamp.toString() === value,
    );

    console.log("[DEBUG] Found stamp:", selectedItem);

    if (selectedItem) {
      const stampData: StampRow = {
        stamp: selectedItem.stamp,
        stamp_mimetype: selectedItem.stamp_mimetype || "image/png",
        stamp_url: selectedItem.stamp_url,
        tx_hash: selectedItem.tx_hash,
        cpid: selectedItem.cpid,
        creator: selectedItem.creator || "",
        creator_name: selectedItem.creator_name || null,
        divisible: selectedItem.divisible || 0,
        locked: selectedItem.locked || 1,
        supply: selectedItem.supply || 0,
        unbound_quantity: selectedItem.unbound_quantity || 0,
      };

      console.log("[DEBUG] Setting selected stamp:", stampData);
      setSelectedStamp(stampData);
      setFormState((prev) => ({
        ...prev,
        stampId: stampData.stamp,
        cpid: stampData.cpid,
      }));
    }
  };

  // Monitor URL changes
  useEffect(() => {
    console.log("[DEBUG] stampImageUrl changed:", {
      url: stampImageUrl,
      selectedStamp: selectedStamp?.cpid,
    });
  }, [stampImageUrl]);

  // Log initial stamps data
  useEffect(() => {
    console.log("[DEBUG] Initial stamps data:", {
      data: stamps.data,
      firstStamp: stamps.data[0],
      totalStamps: stamps.data.length,
      pagination: stamps.pagination,
    });
  }, [stamps.data]);

  // Log when stamps data changes
  useEffect(() => {
    console.log("[DEBUG] Stamps data updated:", {
      totalStamps: stamps.data.length,
      firstStamp: stamps.data[0],
      hasData: stamps.data.length > 0,
    });
  }, [stamps.data]);

  // Log when selected stamp changes
  useEffect(() => {
    if (selectedStamp) {
      console.log("[DEBUG] Selected stamp updated:", {
        stamp: selectedStamp.stamp,
        cpid: selectedStamp.cpid,
        stamp_url: selectedStamp.stamp_url,
        stamp_mimetype: selectedStamp.stamp_mimetype,
        tx_hash: selectedStamp.tx_hash,
      });
    }
  }, [selectedStamp]);

  const renderStampContent = () => {
    console.log("[DEBUG] renderStampContent - selectedStamp:", selectedStamp);

    if (!selectedStamp) {
      return (
        <img
          src="/img/stamping/image-upload.svg"
          class="w-7 h-7 mobileMd:w-8 mobileMd:h-8 mobileLg:w-9 mobileLg:h-9"
          alt=""
        />
      );
    }

    // Construct stamp URL directly using tx_hash
    const stampUrl = `https://stampchain.io/s/${selectedStamp.tx_hash}`;

    return (
      <img
        src={stampUrl}
        alt={`Stamp #${selectedStamp.stamp}`}
        class="w-full h-full object-contain pixelart"
        onError={(e) => {
          console.error("Image load error:", e);
          (e.target as HTMLImageElement).src = "/img/stamping/image-upload.svg";
        }}
      />
    );
  };

  const bodyTools = "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
  const titlePurpleLDCenter =
    "inline-block w-full mobileMd:-mb-3 mobileLg:mb-0 text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient3 text-center";
  const inputFieldContainer =
    "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient rounded-lg w-full";
  const inputField2col =
    "flex flex-col mobileMd:flex-row gap-3 mobileMd:gap-6 w-full";
  const feeSelectorContainer =
    "p-3 mobileMd:p-6 dark-gradient rounded-lg w-full";
  const inputField =
    "h-[42px] mobileLg:h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";

  return (
    <div class={bodyTools}>
      <h1 class={titlePurpleLDCenter}>TRANSFER</h1>

      <div class={inputFieldContainer}>
        <div class="w-full flex gap-3 mobileMd:gap-6">
          <div class="flex items-center justify-center rounded w-[96px] h-[96px] mobileMd:w-[108px] mobileMd:h-[108px] mobileLg:w-[120px] mobileLg:h-[120px] bg-stamp-purple-darker overflow-hidden">
            {renderStampContent()}
          </div>

          <div class="flex flex-col flex-1 gap-3 mobileMd:gap-6">
            <SelectField
              options={stamps.data}
              value={selectedStamp?.stamp?.toString() || ""}
              onChange={handleStampSelect}
            />

            <div class="flex w-full justify-end items-center gap-[18px] mobileMd:gap-[30px]">
              <div class="flex flex-col justify-start -space-y-0.5 -mt-[3px]">
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
                class={`${inputField} !w-[42px] mobileLg:!w-12 text-center`}
              />
            </div>
          </div>
        </div>
        <div class="flex w-full -mt-[1px] mobileMd:-mt-[3px]">
          <input
            value={formState.recipientAddress}
            onInput={(e) =>
              setFormState({
                ...formState,
                recipientAddress: (e.target as HTMLInputElement).value,
              })}
            placeholder="Recipient address"
            class={inputField}
          />
        </div>
      </div>

      <div class={feeSelectorContainer}>
        <BasicFeeCalculator
          fee={formState.fee}
          handleChangeFee={internalHandleChangeFee}
          type="transfer"
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={handleTransferSubmit}
          buttonName={wallet?.address ? "TRANSFER" : "CONNECT WALLET"}
          className="pt-9 mobileLg:pt-12"
          userAddress={wallet?.address}
          inputType="P2WPKH"
          outputTypes={["P2WPKH"]}
          tosAgreed={true}
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
