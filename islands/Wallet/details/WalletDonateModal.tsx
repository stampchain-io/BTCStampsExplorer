import { useEffect } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";

export const DONATE_ADDRESS = "bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203";

interface Props {
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
  donateAddress?: string;
}

function WalletDonateModal({
  fee: initialFee,
  handleChangeFee,
  toggleModal,
  handleCloseModal,
  donateAddress = DONATE_ADDRESS,
}: Props) {
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
    type: "buy",
    initialFee,
  });

  // Sync external fee state with internal state
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  const handleMaxClick = async () => {
    if (!wallet?.balance) return;

    try {
      const estimatedVSize = 141; // Standard size for P2WPKH tx (1-in 1-out)
      const feeInSatoshis = Math.ceil((formState.fee * estimatedVSize) / 1000);

      if (wallet.balance <= feeInSatoshis) {
        setError("Insufficient balance to cover network fees");
        return;
      }

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

  const handleDonateSubmit = async () => {
    await handleSubmit(async () => {
      if (!donateAddress) {
        throw new Error("No donate address provided");
      }

      // Convert fee rate from sat/vB to sat/kB
      const feeRateKB = formState.fee * 1000;
      console.log("Fee rate conversion:", {
        satVB: formState.fee,
        satKB: feeRateKB,
      });

      const options = {
        return_psbt: true,
        fee_per_kb: feeRateKB,
      };

      console.log("Creating dispense transaction:", {
        address: wallet.address,
        dispenser: donateAddress,
        quantity: formState.amount ? parseFloat(formState.amount) : 0,
        feeRate: options.fee_per_kb,
      });

      const response = await fetch("/api/v2/create/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: wallet.address,
          dispenser: donateAddress,
          quantity: formState.amount ? parseFloat(formState.amount) : 0,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create donation transaction.");
      }

      const responseData = await response.json();
      console.log("Dispense response:", responseData);

      if (!responseData?.psbt || !responseData?.inputsToSign) {
        throw new Error("Invalid response: Missing PSBT or inputsToSign");
      }

      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.psbt,
        responseData.inputsToSign,
        true, // Enable RBF
      );

      if (signResult.signed && signResult.txid) {
        setSuccessMessage(`Donation sent successfully. TXID: ${signResult.txid}`);
        setTimeout(toggleModal, 5000);
      } else if (signResult.cancelled) {
        throw new Error("Transaction signing was cancelled.");
      } else {
        throw new Error(`Failed to sign PSBT: ${signResult.error}`);
      }
    });
  };

  return (
    <ModalLayout onClose={handleCloseModal} title="DONATE">
      <div className="flex flex-col gap-6 -mt-3">
        <div className="flex flex-col items-center text-center">
          <div className="flex justify-center items-baseline w-full">
            <div className="inline-flex items-baseline gap-1.5">
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
                className="bg-transparent text-4xl mobileLg:text-5xl text-stamp-grey-light placeholder:text-stamp-grey font-black outline-none text-right -ms-1.5 mobileLg:-ms-0.75"
                style={{
                  width: (() => {
                    const value = formState.amount || "";
                    const isSmallScreen = globalThis.matchMedia("(max-width: 767px)").matches;
                    const { one, other } = isSmallScreen
                      ? { one: 17, other: 23 }
                      : { one: 22, other: 30 };
                    const baseWidth = !value
                      ? other
                      : value.split("").reduce((total, char) => {
                        return total + (char === "1" || char === "." ? one : other);
                      }, 0);
                    return `${baseWidth}px`;
                  })(),
                }}
              />
              <span className="text-4xl mobileLg:text-5xl text-stamp-grey-light font-extralight">
                BTC
              </span>
            </div>
          </div>
          <div className="text-lg mobileLg:text-xl text-stamp-grey-darker font-light mt-0.75">
            {formState.amount && formState.BTCPrice
              ? (parseFloat(formState.amount) * formState.BTCPrice)
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"} USD
          </div>
          <div
            className="text-xs mobileLg:text-sm text-stamp-grey font-medium hover:stamp-grey-light mt-1.5 cursor-pointer"
            onClick={handleMaxClick}
          >
            MAX
          </div>
        </div>

        {donateAddress && (
          <div className="flex flex-col -space-y-1">
            <p className="text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase">
              TO
            </p>
            <p className="text-xs mobileLg:text-sm font-medium text-stamp-grey-light">
              {donateAddress}
            </p>
          </div>
        )}
      </div>

      <BasicFeeCalculator
        isModal={true}
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="buy"
        amount={formState.amount ? parseFloat(formState.amount) : 0}
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={handleDonateSubmit}
        onCancel={toggleModal}
        buttonName="DONATE"
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

export default WalletDonateModal;
