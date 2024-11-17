import { useEffect } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { TransactionFeeDetails } from "$components/shared/modal/TransactionFeeDetails.tsx";
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

  return (
    <ModalLayout onClose={onClose} title="SEND">
      <div class="space-y-4">
        <input
          type="text"
          value={formState.amount}
          onInput={(e) =>
            setFormState({
              ...formState,
              amount: (e.target as HTMLInputElement).value,
            })}
          placeholder="Enter amount"
          class="bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium rounded-md px-6 py-3 w-full outline-none"
        />

        <input
          value={formState.recipientAddress}
          onInput={(e) =>
            setFormState({
              ...formState,
              recipientAddress: (e.target as HTMLInputElement).value,
            })}
          placeholder="Recipient address"
          class="bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium rounded-md px-6 py-3 w-full outline-none"
        />
      </div>

      <TransactionFeeDetails
        fee={formState.fee}
        handleChangeFee={internalHandleChangeFee}
        type="send"
        amount={parseFloat(formState.amount) || 0}
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={handleSendSubmit}
        onCancel={onClose}
        buttonName="SEND"
        className="border-t border-[#333333] pt-4"
        userAddress={wallet?.address}
        recipientAddress={formState.recipientAddress}
        inputType="P2WPKH"
        outputTypes={["P2WPKH"]}
      />

      {error && <div class="text-red-500 mt-2">{error}</div>}
      {successMessage && <div class="text-green-500 mt-2">{successMessage}
      </div>}
    </ModalLayout>
  );
}

export default WalletSendModal;
