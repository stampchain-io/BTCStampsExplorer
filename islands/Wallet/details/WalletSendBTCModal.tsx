import { useEffect, useRef, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";

interface WalletSendModalProps {
  fee: number;
  balance: number;
  handleChangeFee: (fee: number) => void;
  onClose: () => void;
}

function WalletSendModal(
  { fee: initialFee, balance, handleChangeFee, onClose }: WalletSendModalProps,
) {
  const { wallet } = walletContext;
  const [_isSendingMax, _setIsSendingMax] = useState(false);
  const [isMaxTooltipVisible, setIsMaxTooltipVisible] = useState(false);
  const [allowMaxTooltip, setAllowMaxTooltip] = useState(true);
  const [maxTooltipText, setMaxTooltipText] = useState("EMPTY YOUR WALLET");
  const maxTooltipTimeoutRef = useRef<number | null>(null);
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
    type: "send",
    initialFee,
  });
  const [isMaxMode, setIsMaxMode] = useState(false);
  const [_windowWidth, setWindowWidth] = useState(globalThis.innerWidth);

  // Sync external fee state with internal state
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (maxTooltipTimeoutRef.current) {
        globalThis.clearTimeout(maxTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Move calculateMaxAmount inside component
  const calculateMaxAmount = (feeRate: number, balanceAmount: number) => {
    const estimatedVSize = 141;
    const feeInSatoshis = Math.ceil((feeRate * estimatedVSize) / 1000);
    const feeInBTC = feeInSatoshis / 100000000;
    return balanceAmount > feeInBTC
      ? (balanceAmount - feeInBTC).toFixed(8)
      : null;
  };

  // Extract input sanitization logic
  const sanitizeAmountInput = (value: string) => {
    let sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");

    // Ensure only one decimal point
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts[1];
    }

    // Limit decimal places to 8
    if (parts.length === 2 && parts[1].length > 8) {
      sanitized = parts[0] + "." + parts[1].slice(0, 8);
    }

    // Limit total length to 10 characters
    return sanitized.slice(0, 10);
  };

  // Effect to update amount when fee changes in max mode
  useEffect(() => {
    if (!isMaxMode || balance == null) return;

    try {
      const maxAmountBTC = calculateMaxAmount(formState.fee, balance);

      if (!maxAmountBTC) {
        setError("Insufficient balance to cover network fees");
        return;
      }

      setFormState((prev) => ({
        ...prev,
        amount: maxAmountBTC,
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to calculate maximum amount",
      );
    }
  }, [formState.fee, balance, isMaxMode]);

  // Reset tooltip state when fee changes or max mode is disabled
  useEffect(() => {
    if (!isMaxMode) {
      setMaxTooltipText("EMPTY YOUR WALLET");
      setIsMaxTooltipVisible(false);
      setAllowMaxTooltip(true);
    }
  }, [isMaxMode, formState.fee]);

  const handleSendSubmit = async () => {
    await handleSubmit(async () => {
      // Implement send transaction logic here
      const options = {
        return_psbt: true,
        fee_per_kb: formState.fee,
      };

      const requestBody = {
        address: wallet.address,
        toAddress: formState.recipientAddress,
        amount: formState.amount,
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
      if (!responseData?.result?.psbt) {
        throw new Error("Failed to create send transaction.");
      }

      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.result.psbt,
        [], // Empty array for inputs to sign
        true, // Enable RBF
      );

      if (signResult.signed && signResult.txid) {
        setSuccessMessage(
          `Transaction sent successfully. TXID: ${signResult.txid}`,
        );
        setTimeout(onClose, 5000);
      } else if (signResult.cancelled) {
        throw new Error("Transaction signing was cancelled.");
      } else {
        throw new Error(`Failed to sign PSBT: ${signResult.error}`);
      }
    });
  };

  const handleMaxClick = () => {
    if (balance == null) return;

    try {
      const maxAmountBTC = calculateMaxAmount(formState.fee, balance);

      if (!maxAmountBTC) {
        setError("Insufficient balance to cover network fees");
        return;
      }

      setIsMaxMode(true);
      setFormState((prev) => ({
        ...prev,
        amount: maxAmountBTC,
      }));

      // Initial tooltip display on click
      setMaxTooltipText("WALLET EMPTIED");
      setIsMaxTooltipVisible(true);
      setAllowMaxTooltip(true); // Allow tooltip to show on subsequent hovers

      if (maxTooltipTimeoutRef.current) {
        globalThis.clearTimeout(maxTooltipTimeoutRef.current);
      }

      maxTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsMaxTooltipVisible(false);
      }, 1500);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to calculate maximum amount",
      );
    }
  };

  const handleMaxMouseEnter = () => {
    if (allowMaxTooltip) {
      // Show different tooltip text based on max mode
      setMaxTooltipText(isMaxMode ? "WALLET EMPTIED" : "EMPTY YOUR WALLET");

      if (maxTooltipTimeoutRef.current) {
        globalThis.clearTimeout(maxTooltipTimeoutRef.current);
      }

      maxTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsMaxTooltipVisible(true);
      }, 1500);
    }
  };

  const handleMaxMouseLeave = () => {
    if (maxTooltipTimeoutRef.current) {
      globalThis.clearTimeout(maxTooltipTimeoutRef.current);
    }
    setIsMaxTooltipVisible(false);
    setAllowMaxTooltip(true);
  };

  const handleAmountInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value;
    const maxAmountBTC = calculateMaxAmount(formState.fee, balance ?? 0);

    // Only disable max mode if the new value is different from the calculated max amount
    if (maxAmountBTC && inputValue !== maxAmountBTC) {
      setIsMaxMode(false);
      setAllowMaxTooltip(true);
    }

    // Special handling for deleting "0."
    if (formState.amount === "0." && inputValue === "0") {
      setFormState((prev) => ({
        ...prev,
        amount: "",
      }));
      return;
    }

    // Handle initial "0" or "." input
    if (inputValue === "0" || inputValue === ".") {
      setFormState((prev) => ({
        ...prev,
        amount: "0.",
      }));
      return;
    }

    // Regular input handling with validation
    const sanitizedValue = sanitizeAmountInput(inputValue);
    setFormState((prev) => ({
      ...prev,
      amount: sanitizedValue,
    }));
  };

  const inputField =
    "h-[42px] mobileLg:h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";
  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap transition-opacity duration-300";

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(globalThis.innerWidth);
    };

    globalThis.addEventListener("resize", handleResize);
    return () => globalThis.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ModalLayout onClose={onClose} title="SEND">
      <div class="flex flex-col gap-6 -mt-3">
        <div class="flex flex-col items-center text-center">
          <div class="flex justify-center items-baseline w-full">
            <div
              class="inline-flex items-baseline gap-3"
              style={{ background: "transparent", border: "none" }}
            >
              <input
                type="text"
                value={formState.amount}
                onInput={handleAmountInput}
                placeholder="0"
                class="bg-transparent text-[30px] mobileLg:text-[42px] text-stamp-grey-light placeholder:text-stamp-grey font-black text-right -ms-0 mobileLg:-ms-0 pointer-events-auto no-outline"
                style={{
                  width: (() => {
                    const value = formState.amount || "";

                    // Define pixel values for different screen sizes
                    const smallScreenChar = { one: 14, other: 19 };
                    const largeScreenChar = { one: 19, other: 27 };

                    // Use CSS media query to determine screen size
                    const isSmallScreen =
                      globalThis.matchMedia("(max-width: 767px)").matches;
                    const { one, other } = isSmallScreen
                      ? smallScreenChar
                      : largeScreenChar;

                    // Calculate width based on input value
                    const baseWidth = !value
                      ? other // Use 'other' width (24px) for empty/placeholder
                      : value.split("").reduce((total, char) => {
                        return total +
                          (char === "1" || char === "." ? one : other);
                      }, 0);

                    return `${baseWidth}px`;
                  })(),
                  background: "transparent",
                  boxShadow: "none",
                  border: "none",
                  outline: "0px solid transparent",
                  outlineOffset: "0",
                  outlineStyle: "none",
                }}
              />
              <span class="text-[30px] mobileLg:text-[42px] text-stamp-grey-light font-extralight">
                BTC
              </span>
            </div>
          </div>
          <div class="text-sm mobileLg:text-base text-stamp-grey-darker font-light">
            {formState.amount && formState.BTCPrice
              ? (parseFloat(formState.amount) * formState.BTCPrice)
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"} USD
          </div>
          <div
            className="relative text-base mobileLg:text-lg text-stamp-grey font-medium hover:text-stamp-grey-light mt-2 cursor-pointer"
            onClick={handleMaxClick}
            onMouseEnter={handleMaxMouseEnter}
            onMouseLeave={handleMaxMouseLeave}
          >
            MAX
            <div
              className={`${tooltipIcon} ${
                isMaxTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {maxTooltipText}
            </div>
          </div>
        </div>

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

      <BasicFeeCalculator
        isModal={true}
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="send"
        amount={formState.amount ? parseFloat(formState.amount) : 0}
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={handleSendSubmit}
        onCancel={onClose}
        buttonName="SEND"
        className="pt-9 mobileLg:pt-12"
        userAddress={wallet?.address}
        recipientAddress={formState.recipientAddress}
        inputType="P2WPKH"
        outputTypes={["P2WPKH"]}
        tosAgreed={true}
      />

      {error && <div class="text-red-500 mt-2">{error}</div>}
      {successMessage && <div class="text-green-500 mt-2">{successMessage}
      </div>}
    </ModalLayout>
  );
}

export default WalletSendModal;
