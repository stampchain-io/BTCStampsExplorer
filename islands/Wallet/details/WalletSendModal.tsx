import { useEffect } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";

interface Props {
  fee: number;
  handleChangeFee: (fee: number) => void;
  onClose: () => void;
}

function WalletSendModal({ fee: initialFee, handleChangeFee, onClose }: Props) {
  const { wallet } = walletContext;
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

      setFormState({
        ...formState,
        amount: maxAmountBTC,
      });
    } catch (error) {
      setError("Failed to calculate maximum amount");
      console.error("Max amount calculation error:", error);
    }
  };

  const inputField =
    "h-[42px] mobileLg:h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";

  return (
    <ModalLayout onClose={onClose} title="SEND">
      <div class="flex flex-col gap-6 -mt-3">
        <div class="flex flex-col items-center text-center">
          <div class="flex justify-center items-baseline w-full">
            <div class="inline-flex items-baseline gap-1.5">
              <input
                type="text"
                value={formState.amount}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  // Only allow numbers and decimal point
                  let sanitizedValue = value.replace(/[^0-9.]/g, "");

                  // Ensure only one decimal point
                  const parts = sanitizedValue.split(".");
                  if (parts.length > 2) {
                    sanitizedValue = parts[0] + "." + parts[1];
                  }

                  // Limit decimal places to 8
                  if (parts.length === 2 && parts[1].length > 8) {
                    sanitizedValue = parts[0] + "." + parts[1].slice(0, 8);
                  }

                  // Limit total length to 10
                  sanitizedValue = sanitizedValue.slice(0, 10);

                  setFormState({
                    ...formState,
                    amount: sanitizedValue,
                  });
                }}
                placeholder="0"
                class="bg-transparent text-4xl mobileLg:text-5xl text-stamp-grey-light placeholder:text-stamp-grey font-black outline-none text-right -ms-1.5 mobileLg:-ms-0.75"
                style={{
                  width: (() => {
                    const value = formState.amount || "";

                    // Define pixel values for different screen sizes
                    const smallScreenChar = { one: 17, other: 23 };
                    const largeScreenChar = { one: 22, other: 30 };

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

                    console.log({
                      value,
                      isSmallScreen,
                      one,
                      other,
                      baseWidth,
                      finalWidth: `${baseWidth}px`,
                    });

                    return `${baseWidth}px`;
                  })(),
                }}
              />
              <span class="text-4xl mobileLg:text-5xl text-stamp-grey-light font-extralight">
                BTC
              </span>
            </div>
          </div>
          <div class="text-lg mobileLg:text-xl text-stamp-grey-darker font-light mt-0.75">
            {formState.amount && formState.BTCPrice
              ? (parseFloat(formState.amount) * formState.BTCPrice)
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"} USD
          </div>
          <div
            class="text-xs mobileLg:text-sm text-stamp-grey font-medium hover:stamp-grey-light mt-1.5 cursor-pointer"
            onClick={handleMaxClick}
          >
            MAX
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
