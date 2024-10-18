// islands/stamp/details/StampBuyModal.tsx
import { useEffect, useState } from "preact/hooks";
import { StampRow } from "globals";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import StampImage from "./StampImage.tsx";
import {
  showConnectWalletModal,
  walletContext,
} from "$lib/store/wallet/wallet.ts";

interface Props {
  stamp: StampRow;
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
  dispenser: any;
}

const StampBuyModal = (
  { stamp, fee, handleChangeFee, toggleModal, handleCloseModal, dispenser }:
    Props,
) => {
  const { wallet } = walletContext;
  const connected = walletContext.isConnected.value;
  const { fees, loading } = useFeePolling();

  const [quantity, setQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (dispenser) {
      const maxQty = Math.floor(
        dispenser.give_remaining / dispenser.give_quantity,
      );
      setMaxQuantity(maxQty);
      setPricePerUnit(dispenser.satoshirate);
      setTotalPrice(quantity * dispenser.satoshirate);
    }
  }, [dispenser]);

  const handleQuantityChange = (e: Event) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    if (value > maxQuantity) {
      setQuantity(maxQuantity);
    } else if (value < 1 || isNaN(value)) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }
  };

  useEffect(() => {
    setTotalPrice(quantity * pricePerUnit);
  }, [quantity, pricePerUnit]);

  const handleBuyClick = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!connected || !wallet.value) {
        setError("Please connect your wallet.");
        showConnectWalletModal.value = true; // Show wallet connect modal
        setIsSubmitting(false);
        return;
      }

      if (!isLocked) {
        setError("You must agree to the terms and conditions.");
        setIsSubmitting(false);
        return;
      }

      const options = {
        return_psbt: true,
        fee_per_kb: fee,
      };

      // Prepare the request body
      const requestBody = {
        address: wallet.value.address,
        dispenser: dispenser.source,
        quantity: totalPrice, // Total BTC amount in satoshis
        options,
      };

      // Call the server-side API to create the dispense transaction
      const response = await fetch("/api/v2/create/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create dispense transaction.");
        setIsSubmitting(false);
        return;
      }

      const responseData = await response.json();

      if (!responseData || !responseData.result || !responseData.result.psbt) {
        setError("Failed to create dispense transaction.");
        setIsSubmitting(false);
        return;
      }

      const psbtHex = responseData.result.psbt;
      // TODO: this is not active yet until CP block activation, but may not want to use psbt here if CP doesn't return
      // the inputs to sign. otherwie we need to deconstruct, etc
      // Sign PSBT using walletContext
      const inputsToSign = []; // Adjust as needed based on your PSBT
      const signResult = await walletContext.signPSBT(
        wallet.value,
        psbtHex,
        inputsToSign,
        true, // Enable RBF
      );

      if (signResult.signed) {
        // Broadcast the signed PSBT
        const txid = await walletContext.broadcastPSBT(signResult.psbt);

        // Handle success, show confirmation to user
        console.log("Transaction broadcasted successfully. TXID:", txid);
        setSuccessMessage(
          `Transaction broadcasted successfully. TXID: ${txid}`,
        );
        // Optionally close the modal and reset states after a delay
        setTimeout(() => {
          setIsSubmitting(false);
          setSuccessMessage("");
          toggleModal();
          // Reset any other states as needed
        }, 5000);
      } else if (signResult.cancelled) {
        setError("Transaction signing was cancelled.");
      } else {
        setError("Failed to sign PSBT: " + signResult.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create or send transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative w-full max-w-[360px] h-auto">
        <div
          class="relative bg-[#0B0B0B] rounded-lg shadow overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing the modal
        >
          <div class="space-y-4 p-4">
            <img
              onClick={toggleModal}
              class="w-6 h-6 ms-auto cursor-pointer"
              alt="Close modal"
              src="/img/wallet/icon-close.svg"
            />

            <p className="font-black text-5xl text-center purple-gradient1">
              BUY
            </p>

            <div className="flex justify-between">
              <StampImage
                stamp={stamp}
                className="w-[144px] !p-3 border-2 border-[#9900EE] rounded-md shadow-[0px_0px_20px_#9900EE]"
                flag={false}
              />
              <div className="flex flex-col justify-between items-end">
                <p className="purple-gradient4 text-2xl font-black text-center">
                  #{stamp.stamp}
                </p>
                <div>
                  <p className="text-xl font-bold text-[#999999]">EDITIONS</p>
                  <div className="flex justify-between items-center w-full gap-3">
                    <span className="text-[#666666]">MAX {maxQuantity}</span>
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="bg-[#999999] text-[#666666] font-bold text-xl rounded-md p-3"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full">
              <p class="text-[#999999] font-light">
                FEE <span className="font-bold">{fee}</span> SAT/vB
              </p>
              <p class="text-xs font-light text-[#999999]">
                RECOMMENDED{" "}
                <span className="font-medium">
                  {fees && fees.recommendedFee}
                </span>{" "}
                SAT/vB
              </p>
              <div class="relative w-full">
                <label htmlFor="labels-range-input" class="sr-only">
                  Labels range
                </label>
                <input
                  id="labels-range-input"
                  type="range"
                  value={fee}
                  min="1"
                  max="264"
                  step="1"
                  onInput={(e) =>
                    handleChangeFee(
                      parseInt((e.target as HTMLInputElement).value, 10),
                    )}
                  class="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#3F2A4E]"
                />
              </div>
            </div>

            <p className="text-lg font-light text-[#999999]">
              ESTIMATE{" "}
              <span className="font-bold">
                {(totalPrice / 1e8).toFixed(8)}
              </span>{" "}
              BTC
            </p>
            {/* Optionally display USD value if available */}

            <div className="flex justify-end gap-2 items-center">
              <input
                type="checkbox"
                id="lockEditions"
                name="lockEditions"
                checked={isLocked}
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setIsLocked(target.checked);
                }}
                className="w-3 h-3"
              />
              <label
                htmlFor="lockEditions"
                className="text-[#999999] text-[10px] font-medium"
              >
                I AGREE TO THE <span className="text-[#8800CC]">ToS</span>
              </label>
            </div>
            <div className="flex justify-end gap-6">
              <button
                className="border-2 border-[#8800CC] text-[#8800CC] w-[108px] h-[48px] rounded-md font-extrabold"
                onClick={toggleModal}
                disabled={isSubmitting}
              >
                CANCEL
              </button>
              <button
                className="bg-[#8800CC] text-[#330033] w-[84px] h-[48px] rounded-md font-extrabold"
                onClick={handleBuyClick}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "BUY"}
              </button>
            </div>

            {/* Error message */}
            {error && <div className="text-red-500 mt-2">{error}</div>}
            {/* Success message */}
            {successMessage && (
              <div className="text-green-500 mt-2">{successMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampBuyModal;
