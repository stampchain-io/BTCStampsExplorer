// islands/stamp/details/WalletTransferModal.tsx
import { useEffect, useState } from "preact/hooks";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import StampImage from "$islands/stamp/details/StampImage.tsx";
import {
  showConnectWalletModal,
  walletContext,
} from "$client/wallet/wallet.ts";
import { SelectField } from "$islands/stamping/SelectField.tsx";

interface Props {
  fee: number;
  handleChangeFee: (fee: number) => void;
  toggleModal: () => void;
  handleCloseModal: () => void;
  dispenser: any;
}

const WalletTransferModal = (
  { fee, handleChangeFee, toggleModal, handleCloseModal, dispenser }: Props,
) => {
  const { wallet, isConnected } = walletContext;
  const { fees } = useFeePolling();
  const [quantity, setQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [coinType, setCoinType] = useState("BTC");

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
      if (!isConnected || !wallet) {
        setError("Please connect your wallet.");
        showConnectWalletModal.value = true;
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
        address: wallet.address,
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
        wallet,
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

  const handleChangeCoin = () => {
    setCoinType((prevType) => (prevType === "BTC" ? "USDT" : "BTC"));
  };

  const btcIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path
        fill="#ffa000"
        d="M14.24 10.56c-.31 1.24-2.24.61-2.84.44l.55-2.18c.62.18 2.61.44 2.29 1.74m-3.11 1.56l-.6 2.41c.74.19 3.03.92 3.37-.44c.36-1.42-2.03-1.79-2.77-1.97m10.57 2.3c-1.34 5.36-6.76 8.62-12.12 7.28S.963 14.94 2.3 9.58A9.996 9.996 0 0 1 14.42 2.3c5.35 1.34 8.61 6.76 7.28 12.12m-7.49-6.37l.45-1.8l-1.1-.25l-.44 1.73c-.29-.07-.58-.14-.88-.2l.44-1.77l-1.09-.26l-.45 1.79c-.24-.06-.48-.11-.7-.17l-1.51-.38l-.3 1.17s.82.19.8.2c.45.11.53.39.51.64l-1.23 4.93c-.05.14-.21.32-.5.27c.01.01-.8-.2-.8-.2L6.87 15l1.42.36c.27.07.53.14.79.2l-.46 1.82l1.1.28l.45-1.81c.3.08.59.15.87.23l-.45 1.79l1.1.28l.46-1.82c1.85.35 3.27.21 3.85-1.48c.5-1.35 0-2.15-1-2.66c.72-.19 1.26-.64 1.41-1.62c.2-1.33-.82-2.04-2.2-2.52"
      />
    </svg>
  );

  const usdIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      style={{ padding: "1px" }}
      viewBox="0 0 32 32"
    >
      <path
        fill="#0E9F6E"
        fill-rule="evenodd"
        d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16s-7.163 16-16 16m6.5-12.846c0-2.523-1.576-3.948-5.263-4.836v-4.44c1.14.234 2.231.725 3.298 1.496l1.359-2.196a9.49 9.49 0 0 0-4.56-1.776V6h-2.11v1.355c-3.032.234-5.093 1.963-5.093 4.486c0 2.64 1.649 3.925 5.19 4.813v4.58c-1.577-.234-2.886-.935-4.269-2.01L9.5 21.35a11.495 11.495 0 0 0 5.724 2.314V26h2.11v-2.313c3.08-.257 5.166-1.963 5.166-4.533m-7.18-5.327c-1.867-.537-2.327-1.168-2.327-2.15c0-1.027.8-1.845 2.328-1.962zm4.318 5.49c0 1.122-.873 1.893-2.401 2.01v-4.229c1.892.538 2.401 1.168 2.401 2.22z"
      />
    </svg>
  );

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
              Transfer
            </p>

            <div className="flex justify-between">
              <StampImage
                stamp={[]}
                className="w-[144px] !p-3 border-2 border-[#9900EE] rounded-md shadow-[0px_0px_20px_#9900EE]"
                flag={false}
              />
              <div className="flex flex-col justify-between items-end">
                <SelectField value="" onChange={() => {}} />
                <div className="flex justify-between items-center w-full gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xl font-bold text-[#999999]">EDITIONS</p>
                    <span className="text-[#666666]">MAX {maxQuantity}</span>
                  </div>
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

            <div className="flex">
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
              <div className="flex gap-1 items-center justify-end w-1/2">
                <button
                  className="w-12 h-6 rounded-full bg-gray-700 flex items-center transition duration-300 focus:outline-none shadow"
                  onClick={handleChangeCoin}
                >
                  <div
                    id="switch-toggle"
                    className={`coin w-6 h-6 relative rounded-full transition duration-500 transform text-white ${
                      coinType === "BTC" ? "translate-x-full" : ""
                    }`}
                  >
                    {coinType === "BTC" ? btcIcon : usdIcon}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <p className="text-lg font-light text-[#999999]">
                ESTIMATE{" "}
                <span className="font-bold">
                  {(totalPrice / 1e8).toFixed(8)}
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

export default WalletTransferModal;
