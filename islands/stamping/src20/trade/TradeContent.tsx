import { useEffect, useState } from "preact/hooks";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";
import { walletContext } from "$lib/store/wallet/wallet.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/btc.ts";

// Define the constants directly
const SIGHASH_SINGLE = 0x03;
const SIGHASH_ANYONECANPAY = 0x80;
const SIGHASH_SINGLE_ANYONECANPAY = SIGHASH_SINGLE | SIGHASH_ANYONECANPAY; // 131

// Add constants at the top
const SATS_PER_KB_MULTIPLIER = 1000; // Convert vB to kB
const MIN_FEE_RATE_VB = 1; // minimum sat/vB
const MAX_FEE_RATE_VB = 500; // maximum sat/vB

export function TradeContent() {
  // Destructure walletContext to get wallet, isConnected, and showConnectModal
  const { wallet, isConnected, showConnectModal } = walletContext;
  const address = wallet.address; // Access wallet properties directly

  // State for the existing trade form
  const [tradeFormState, setTradeFormState] = useState({
    utxo: "",
    salePrice: "",
    BTCPrice: 0,
    psbtHex: "",
  });

  // State for the new UTXO attach form
  const [attachFormState, setAttachFormState] = useState({
    cpid: "",
    quantity: "",
    feeRateVB: "", // Changed from feePerKB to feeRateVB to indicate sat/vB
    utxo: "",
    psbtHex: "",
  });

  // Add this to your state
  const [buyerFormState, setBuyerFormState] = useState({
    sellerPsbtHex: "",
    buyerUtxo: "",
    salePrice: "",
    feeRate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch BTC Price
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBTCPriceInUSD();
      setTradeFormState((prev) => ({ ...prev, BTCPrice: price }));
    };
    fetchPrice();
  }, []);

  const handleTradeInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    setTradeFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttachInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    setAttachFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePSBT = async () => {
    if (!isConnected) {
      showConnectModal();
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage("Please wait...");
    setApiError(null);

    try {
      const { utxo, salePrice } = tradeFormState;

      // Validate inputs
      if (!utxo || !salePrice) {
        setApiError("Please fill in all fields with valid values.");
        setIsSubmitting(false);
        return;
      }

      // Create PSBT by calling the backend API
      const response = await fetch("/api/v2/trx/create_psbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utxo,
          salePrice: parseFloat(salePrice),
          sellerAddress: address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setApiError(`Error creating PSBT: ${errorData.error}`);
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      const psbtHex = data.psbt; // PSBT is now in hex format

      console.log("Received PSBT hex:", psbtHex);

      // Sign PSBT using wallet connect
      const walletResult = await walletContext.signPSBT(
        wallet,
        psbtHex,
        [{ index: 0 }], // Inputs to sign (seller's input at index 0)
        true, // Enable RBF
        [SIGHASH_SINGLE_ANYONECANPAY],
        false, // Set autoBroadcast to false
      );

      if (walletResult.signed) {
        setSubmissionMessage(
          "PSBT signed successfully. Here's the signed PSBT hex:",
        );
        setTradeFormState((prev) => ({ ...prev, psbtHex: walletResult.psbt }));
      } else if (walletResult.cancelled) {
        setSubmissionMessage("PSBT signing cancelled by user.");
      } else {
        setSubmissionMessage(`PSBT signing failed: ${walletResult.error}`);
      }
    } catch (error) {
      console.error("Error creating or signing PSBT:", error);
      setApiError(
        "An unexpected error occurred during PSBT creation or signing.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function to handle UTXO attach
  const handleUtxoAttach = async () => {
    if (!isConnected) {
      showConnectModal();
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage("Please wait...");
    setApiError(null);

    try {
      const { cpid, quantity, feeRateVB, utxo } = attachFormState;

      // Validate inputs
      if (!cpid || !quantity || !feeRateVB || !utxo) {
        setApiError("Please fill in all fields with valid values.");
        setIsSubmitting(false);
        return;
      }

      // Parse and validate fee rate
      const parsedFeeRate = parseInt(feeRateVB, 10);
      if (parsedFeeRate < MIN_FEE_RATE_VB || parsedFeeRate > MAX_FEE_RATE_VB) {
        setApiError(
          `Fee rate must be between ${MIN_FEE_RATE_VB} and ${MAX_FEE_RATE_VB} sat/vB`,
        );
        setIsSubmitting(false);
        return;
      }

      // Convert fee rate from sat/vB to sat/kB (multiply by 1000)
      const feeRateKB = parsedFeeRate * SATS_PER_KB_MULTIPLIER;
      console.log(
        `Converting fee rate: ${parsedFeeRate} sat/vB = ${feeRateKB} sat/kB`,
      );

      // Prepare the request body
      const requestBody = {
        address,
        asset: cpid,
        quantity: parseInt(quantity, 10),
        utxo,
        options: {
          return_psbt: true,
          extended_tx_info: true,
          regular_dust_size: 588,
          fee_per_kb: feeRateKB, // This should now be 15000 for 15 sat/vB
        },
      };

      // Call the backend API
      const response = await fetch("/api/v2/trx/utxoattach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setApiError(`Error creating PSBT: ${errorData.error}`);
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      const psbtHex = data.psbt;
      let inputsToSign = data.inputsToSign;

      // Validate 'inputsToSign' structure
      inputsToSign = inputsToSign.map((input) => {
        if (typeof input.index === "number") {
          return { index: input.index };
        } else {
          throw new Error(`Invalid index in inputsToSign: ${input.index}`);
        }
      });

      console.log("Received PSBT hex:", psbtHex);

      // Sign PSBT using wallet connect
      const walletResult = await walletContext.signPSBT(
        wallet,
        psbtHex,
        inputsToSign,
        true, // Enable RBF
        undefined, // Omit sighashTypes to use default
        true, // Set autoBroadcast to true
      );

      if (walletResult.signed) {
        setSubmissionMessage("Transaction signed and broadcast successfully!");
        setAttachFormState((prev) => ({ ...prev, psbtHex: walletResult.psbt }));
      } else if (walletResult.cancelled) {
        setSubmissionMessage("PSBT signing cancelled by user.");
      } else {
        setSubmissionMessage(`PSBT signing failed: ${walletResult.error}`);
      }
    } catch (error) {
      console.error("Error creating or signing PSBT:", error);
      setApiError(
        "An unexpected error occurred during PSBT creation or signing.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this to your JSX
  const handleBuyerInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    setBuyerFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Add this to your JSX
  const handleCompleteSwap = async () => {
    if (!isConnected) {
      showConnectModal();
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage("Please wait...");
    setApiError(null);

    try {
      const { sellerPsbtHex, buyerUtxo, feeRate } = buyerFormState;

      // Validate inputs
      if (!sellerPsbtHex || !buyerUtxo || !feeRate) {
        setApiError("Please fill in all fields");
        setIsSubmitting(false);
        return;
      }

      // Parse fee rate as integer
      const parsedFeeRate = parseInt(feeRate, 10);
      if (isNaN(parsedFeeRate) || parsedFeeRate <= 0) {
        setApiError("Invalid fee rate");
        setIsSubmitting(false);
        return;
      }

      // Call the API to complete the PSBT
      const response = await fetch("/api/v2/trx/complete_psbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerPsbtHex,
          buyerUtxo,
          buyerAddress: address,
          feeRate: parsedFeeRate, // Use parsed fee rate
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${text}`);
      }

      const data = await response.json();
      const completedPsbt = data.completedPsbt;

      if (!completedPsbt) {
        throw new Error("Received empty PSBT from server");
      }

      // Sign the completed PSBT with the wallet
      const signResult = await walletContext.signPSBT(
        wallet,
        completedPsbt,
        [{ index: 1 }], // Buyer's input is at index 1
        true, // Enable RBF
        [SIGHASH_SINGLE_ANYONECANPAY], // Use the same sighash as seller
        true, // autoBroadcast
      );

      if (!signResult.signed) {
        console.error("Sign result:", signResult);
        throw new Error(signResult.error || "Failed to sign PSBT");
      }

      setSubmissionMessage("Swap completed and broadcast successfully!");
    } catch (error) {
      console.error("Complete swap error:", error);
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="purple-gradient1 text-3xl md:text-6xl font-black mt-6 w-full text-center">
        ATTACH STAMP TO UTXO / CREATE PSBT
      </p>

      <div className="dark-gradient p-6 w-full">
        <div className="flex flex-col gap-4">
          <InputField
            type="text"
            placeholder="UTXO (e.g., txid:vout)"
            value={tradeFormState.utxo}
            onChange={(e) => handleTradeInputChange(e, "utxo")}
          />

          <InputField
            type="number"
            placeholder="Sale Price (BTC)"
            value={tradeFormState.salePrice}
            onChange={(e) => handleTradeInputChange(e, "salePrice")}
            step="0.00000001"
            min="0"
          />
        </div>

        {/* Updated button styling */}
        <div className="flex justify-end gap-6 mt-6">
          <button
            className="bg-[#8800CC] text-[#330033] w-[120px] h-[48px] rounded-md font-extrabold"
            onClick={handleCreatePSBT}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "CREATE PSBT"}
          </button>
        </div>

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          walletError={null}
        />

        {tradeFormState.psbtHex && (
          <div className="dark-gradient p-3 md:p-6 w-full break-words mt-6">
            <h2 className="text-xl font-bold mb-2">Signed PSBT (Hex):</h2>
            <textarea
              className="w-full h-40 p-2 bg-gray-800 text-white rounded-md"
              readOnly
              value={tradeFormState.psbtHex}
            />
            <p className="mt-2">
              Share this signed PSBT with the buyer to complete the transaction.
            </p>
          </div>
        )}
      </div>

      {/* New UTXO Attach Form */}
      <div className="dark-gradient p-6 w-full">
        <h2 class="text-xl font-bold mb-4">UTXO Attach</h2>
        <div className="flex flex-col gap-4">
          <InputField
            type="text"
            placeholder="Asset (cpid)"
            value={attachFormState.cpid}
            onChange={(e) => handleAttachInputChange(e, "cpid")}
          />
          <InputField
            type="number"
            placeholder="Quantity"
            value={attachFormState.quantity}
            onChange={(e) => handleAttachInputChange(e, "quantity")}
            min="1"
          />
          <InputField
            type="number"
            placeholder="Fee Rate (sat/vB)" // Updated placeholder
            value={attachFormState.feeRateVB} // Updated name
            onChange={(e) => handleAttachInputChange(e, "feeRateVB")} // Updated name
            min="1"
          />
          <InputField
            type="text"
            placeholder="UTXO (e.g., txid:vout)"
            value={attachFormState.utxo}
            onChange={(e) => handleAttachInputChange(e, "utxo")}
          />
        </div>
        <div className="flex justify-end gap-6 mt-6">
          <button
            className="bg-[#8800CC] text-[#330033] w-[120px] h-[48px] rounded-md font-extrabold"
            onClick={handleUtxoAttach}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "ATTACH"}
          </button>
        </div>

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          walletError={null}
        />

        {attachFormState.psbtHex && (
          <div className="dark-gradient p-3 md:p-6 w-full break-words mt-6">
            <h2 className="text-xl font-bold mb-2">Signed PSBT (Hex):</h2>
            <textarea
              className="w-full h-40 p-2 bg-gray-800 text-white rounded-md"
              readOnly
              value={attachFormState.psbtHex}
            />
            <p className="mt-2">
              Share this signed PSBT to complete the transaction.
            </p>
          </div>
        )}
      </div>

      {/* Complete Swap (Buyer) */}
      <div className="dark-gradient p-6 w-full mt-6">
        <h2 class="text-xl font-bold mb-4">Complete Swap (Buyer)</h2>
        <div className="flex flex-col gap-4">
          <InputField
            type="text"
            placeholder="Seller's PSBT (Hex)"
            value={buyerFormState.sellerPsbtHex}
            onChange={(e) => handleBuyerInputChange(e, "sellerPsbtHex")}
          />
          <InputField
            type="text"
            placeholder="Your UTXO (e.g., txid:vout)"
            value={buyerFormState.buyerUtxo}
            onChange={(e) => handleBuyerInputChange(e, "buyerUtxo")}
          />
          {/* Add this input field in the buyer section */}
          <InputField
            type="number"
            placeholder="Fee Rate (sat/vB)"
            value={buyerFormState.feeRate}
            onChange={(e) => handleBuyerInputChange(e, "feeRate")}
            min="1"
          />
        </div>
        <div className="flex justify-end gap-6 mt-6">
          <button
            className="bg-[#8800CC] text-[#330033] w-[120px] h-[48px] rounded-md font-extrabold"
            onClick={handleCompleteSwap}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Complete Swap"}
          </button>
        </div>
      </div>
    </div>
  );
}
