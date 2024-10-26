import { useState } from "preact/hooks";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";

interface Props {
  fee: number;
  handleChangeFee: (fee: number) => void;
  onClose: () => void;
}

function WalletSendModal({ fee, handleChangeFee, onClose }: Props) {
  const { fees } = useFeePolling();
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = () => {
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      // Implement send logic here
      setSuccessMessage("Transaction sent successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        class="relative w-full max-w-[360px] h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="relative bg-[#0B0B0B] rounded-lg shadow overflow-hidden p-4 space-y-4">
          <CloseButton onClick={onClose} />
          <ModalTitle>SEND</ModalTitle>

          <AmountInput amount={amount} setAmount={setAmount} />
          <AddressInput
            address={recipientAddress}
            setAddress={setRecipientAddress}
          />
          <FeeSelector
            fee={fee}
            handleChangeFee={handleChangeFee}
            recommendedFee={fees?.recommendedFee}
          />
          <div class="flex flex-col">
            <p class="text-lg font-light text-[#999999]">
              ESTIMATE{" "}
              <span class="font-bold">
                {(parseFloat(amount) || 0).toFixed(8)}
              </span>{" "}
              BTC
            </p>
            <div class="bg-transparent collapse-arrow">
              <input
                type="checkbox"
                id="collapse-toggle"
                class="peer hidden"
              />
              <label
                for="collapse-toggle"
                class="collapse-title text-xl font-medium text-[#999999] cursor-pointer flex items-center gap-1"
                onClick={() => setVisible(!visible)}
              >
                DETAILS
                {!visible
                  ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                    >
                      {/* Up arrow icon */}
                      <path
                        fill="white"
                        d="M12 8l6 6H6l6-6z"
                      />
                    </svg>
                  )
                  : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                    >
                      {/* Down arrow icon */}
                      <path
                        fill="white"
                        d="M12 16l-6-6h12l-6 6z"
                      />
                    </svg>
                  )}
              </label>
              <div class="collapse-content hidden peer-checked:block transition-all duration-300 ease-in-out max-h-0 peer-checked:max-h-screen overflow-hidden">
                <div class="flex flex-col">
                  <p class="text-xs font-light text-[#999999]">
                    BYTES <span className="font-medium">443</span>
                    {" "}
                  </p>
                  <p class="text-xs font-light text-[#999999]">
                    SATS PR BYTE <span className="font-medium">4</span>
                    {" "}
                  </p>
                  <p class="text-xs font-light text-[#999999]">
                    MINER FEE <span className="font-medium">4322</span> SATS
                  </p>
                  <p class="text-xs font-light text-[#999999]">
                    SERVICE FEE <span className="font-medium">5555</span> SATS
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AgreementCheckbox isAgreed={isAgreed} setIsAgreed={setIsAgreed} />
          <ActionButtons
            onCancel={onClose}
            onSend={handleSubmit}
            isSubmitting={isSubmitting}
          />

          {error && <ErrorMessage message={error} />}
          {successMessage && <SuccessMessage message={successMessage} />}
        </div>
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <img
      onClick={onClick}
      class="w-6 h-6 ms-auto cursor-pointer"
      alt="Close modal"
      src="/img/wallet/icon-close.svg"
    />
  );
}

function ModalTitle({ children }: { children: string }) {
  return (
    <p class="font-black text-5xl text-center purple-gradient1">
      {children}
    </p>
  );
}

function AmountInput(
  { amount, setAmount }: { amount: string; setAmount: (value: string) => void },
) {
  return (
    <div class="flex flex-col gap-2 items-center text-[#999999]">
      <p class="text-4xl font-medium">
        {amount || "0"} <span className="font-extralight">BTC</span>
      </p>
      <p className="text-lg font-medium">
        0 <span className="font-extralight">USD</span>
      </p>
      <p class="text-xs font-medium">MAX</p>
      {
        /* <input
        value={amount}
        onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
        placeholder="Enter amount"
        class="bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium rounded-md px-6 py-3 w-full outline-none"
      /> */
      }
    </div>
  );
}

function AddressInput(
  { address, setAddress }: {
    address: string;
    setAddress: (value: string) => void;
  },
) {
  return (
    <input
      value={address}
      onInput={(e) => setAddress((e.target as HTMLInputElement).value)}
      placeholder="Recipient address"
      class="bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium rounded-md px-6 py-3 w-full outline-none"
    />
  );
}

function FeeSelector(
  { fee, handleChangeFee, recommendedFee }: {
    fee: number;
    handleChangeFee: (fee: number) => void;
    recommendedFee?: number;
  },
) {
  return (
    <div class="flex flex-col w-full">
      <p class="text-[#999999] font-light mb-1">
        FEE <span class="font-bold">{fee}</span> SAT/vB
      </p>
      <p class="text-xs font-light text-[#999999] mb-3">
        RECOMMENDED <span class="font-medium">{recommendedFee}</span> SAT/vB
      </p>
      <input
        type="range"
        value={fee}
        min="1"
        max="264"
        step="1"
        onInput={(e) =>
          handleChangeFee(parseInt((e.target as HTMLInputElement).value, 10))}
        class="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#3F2A4E]"
      />
    </div>
  );
}

function AgreementCheckbox(
  { isAgreed, setIsAgreed }: {
    isAgreed: boolean;
    setIsAgreed: (value: boolean) => void;
  },
) {
  return (
    <div class="flex justify-end gap-2 items-center">
      <input
        type="checkbox"
        id="agreeToTerms"
        checked={isAgreed}
        onChange={(e) => setIsAgreed((e.target as HTMLInputElement).checked)}
        class="w-3 h-3"
      />
      <label
        htmlFor="agreeToTerms"
        class="text-[#999999] text-[10px] font-medium"
      >
        I AGREE TO THE <span class="text-[#8800CC]">ToS</span>
      </label>
    </div>
  );
}

function ActionButtons(
  { onCancel, onSend, isSubmitting }: {
    onCancel: () => void;
    onSend: () => void;
    isSubmitting: boolean;
  },
) {
  return (
    <div class="flex justify-end gap-6">
      <button
        class="border-2 border-[#8800CC] text-[#8800CC] w-[108px] h-[48px] rounded-md font-extrabold"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        CANCEL
      </button>
      <button
        class="bg-[#8800CC] text-[#330033] w-[84px] h-[48px] rounded-md font-extrabold"
        onClick={onSend}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : "SEND"}
      </button>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div class="text-red-500 mt-2">{message}</div>;
}

function SuccessMessage({ message }: { message: string }) {
  return <div class="text-green-500 mt-2">{message}</div>;
}

export default WalletSendModal;
