import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";

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
  donateAddress,
}: Props) {
  const { wallet } = walletContext;
  const [amount, setAmount] = useState("");

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
    type: "send",
    initialFee,
  });

  // Sync external fee state with internal state
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  const handleDonateSubmit = async () => {
    await handleSubmit(async () => {
      if (!donateAddress) {
        throw new Error("No donate address provided");
      }

      const options = {
        return_psbt: true,
        fee_per_kb: formState.fee * 1000, // Convert to sat/kB
      };

      const requestBody = {
        address: wallet.address,
        toAddress: donateAddress,
        amount: parseFloat(amount),
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
          errorData.error || "Failed to create donation transaction.",
        );
      }

      const responseData = await response.json();
      if (!responseData?.result?.psbt) {
        throw new Error("Failed to create donation transaction.");
      }

      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.result.psbt,
        [], // Empty array for inputs to sign
        true, // Enable RBF
      );

      if (signResult.signed && signResult.txid) {
        setSuccessMessage(
          `Donation sent successfully. TXID: ${signResult.txid}`,
        );
        setTimeout(toggleModal, 5000);
      } else if (signResult.cancelled) {
        throw new Error("Transaction signing was cancelled.");
      } else {
        throw new Error(`Failed to sign PSBT: ${signResult.error}`);
      }
    });
  };

  const dataColumn = "flex flex-col -space-y-1";
  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataValueXs =
    "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
  const inputField =
    "h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light";

  return (
    <ModalLayout onClose={handleCloseModal} title="DONATE">
      <div className="flex flex-col gap-3 mobileLg:gap-6">
        <input
          type="text"
          value={amount}
          onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
          placeholder="Enter amount"
          className={inputField}
        />

        {donateAddress && (
          <div className={dataColumn}>
            <p className={dataLabelSm}>TO</p>
            <p className={dataValueXs}>{donateAddress}</p>
          </div>
        )}
      </div>

      <BasicFeeCalculator
        isModal={true}
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="send"
        amount={amount ? parseFloat(amount) : 0}
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={handleDonateSubmit}
        onCancel={toggleModal}
        buttonName="DONATE"
        className="pt-9 mobileLg:pt-12"
        userAddress={wallet?.address}
        recipientAddress={donateAddress}
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
