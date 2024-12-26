import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import type { Output } from "$types/index.d.ts";

interface WalletSendModalProps {
  fee: number;
  balance: number;
  handleChangeFee: (fee: number) => void;
  onClose: () => void;
}

function WalletSendModal(
  { fee: initialFee, handleChangeFee, onClose, balance }: WalletSendModalProps,
) {
  const { wallet } = walletContext;
  const [isSendingMax, setIsSendingMax] = useState(false);
  const [isMaxTooltipVisible, setIsMaxTooltipVisible] = useState(false);
  const [allowMaxTooltip, setAllowMaxTooltip] = useState(true);
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
    if (!wallet?.balance) return;

    try {
      // Estimate the transaction fee for a P2WPKH input and output
      const estimatedVSize = 141; // Standard size for P2WPKH tx (1-in 1-out)
      const feeInSatoshis = Math.ceil((formState.fee * estimatedVSize) / 1000);

      // Ensure we have enough balance to cover the fee
      if (wallet.balance <= feeInSatoshis) {
        setError("Insufficient balance to cover network fees");
        return;
      }

      // Calculate max amount after subtracting fee
      const maxAmountSats = wallet.balance - feeInSatoshis;
      const maxAmountBTC = (maxAmountSats / 100000000).toFixed(8);

      setFormState((prev) => ({
        ...prev,
        amount: maxAmountBTC,
      }));
    } catch (error) {
      console.error("Max amount calculation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to calculate maximum amount",
      );
    }
  };

  const handleMaxMouseEnter = () => {
    if (allowMaxTooltip) {
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

  const inputField =
    "h-[42px] mobileLg:h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";

  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap";

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
                onInput={(e) => {
                  const inputValue = (e.target as HTMLInputElement).value;

                  // Special handling for deleting "0."
                  if (formState.amount === "0." && inputValue === "0") {
                    setFormState((prev) => ({
                      ...prev,
                      amount: "",
                    }));
                    return;
                  }

                  // Handle initial "0" input
                  if (inputValue === "0") {
                    setFormState((prev) => ({
                      ...prev,
                      amount: "0.",
                    }));
                    return;
                  }

                  // Regular input handling
                  let sanitizedValue = inputValue.replace(/[^0-9.]/g, "");
                  const parts = sanitizedValue.split(".");

                  // Ensure only one decimal point
                  if (parts.length > 2) {
                    sanitizedValue = parts[0] + "." + parts[1];
                  }

                  // Limit decimal places to 8
                  if (parts.length === 2 && parts[1].length > 8) {
                    sanitizedValue = parts[0] + "." + parts[1].slice(0, 8);
                  }

                  // Limit total length to 10 characters
                  sanitizedValue = sanitizedValue.slice(0, 10);

                  setFormState((prev) => ({
                    ...prev,
                    amount: sanitizedValue,
                  }));
                }}
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
                isMaxTooltipVisible ? "block" : "hidden"
              }`}
            >
              EMPTY YOUR WALLET
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
