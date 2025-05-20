/* ===== TRADE CONTENT COMPONENT ===== */
/* TODO (@baba):
  - Clean up styles completely
  - Add fee calculator
*/
import { useCallback, useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import type { UTXO, XcpBalance } from "$lib/types/index.d.ts";
import { ComposeAttachOptions } from "$server/services/xcpService.ts";
import { normalizeFeeRate } from "$server/services/xcpService.ts";
import { bodyTool, containerBackground } from "$layout";
import { subtitlePurple, titlePurpleLD } from "$text";
import { Button } from "$button";
import { InputField } from "$form";
import { StatusMessages } from "$notification";

/* ===== CONSTANTS ===== */
const SIGHASH_SINGLE = 0x03;
const SIGHASH_ANYONECANPAY = 0x80;
const SIGHASH_SINGLE_ANYONECANPAY = SIGHASH_SINGLE | SIGHASH_ANYONECANPAY; // 131
const MAX_FEE_RATE_VB = 500; // maximum sat/vB
const MIN_UTXO_VALUE = 546; // Minimum UTXO value in satoshis

/* ===== TYPES ===== */
interface InputToSign {
  index: number;
}

interface StatusMessageType {
  message: string;
  txid?: string;
}

/* ===== COMPONENT ===== */
export function StampTradeTool() {
  /* ===== STATE ===== */
  const [availableAssets, setAvailableAssets] = useState<XcpBalance[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null);
  const [availableUtxos, setAvailableUtxos] = useState<UTXO[]>([]);
  const [isLoadingUtxos, setIsLoadingUtxos] = useState(false);
  const { wallet, isConnected, showConnectModal } = walletContext;
  const address = wallet.address;

  const [tradeFormState, setTradeFormState] = useState({
    utxo: "",
    salePrice: "",
    BTCPrice: 0,
    psbtHex: "",
  });

  const [attachFormState, setAttachFormState] = useState({
    cpid: "",
    quantity: "",
    feeRateVB: "",
    utxo: "",
    psbtHex: "",
  });

  const [buyerFormState, setBuyerFormState] = useState({
    sellerPsbtHex: "",
    buyerUtxo: "",
    salePrice: "",
    feeRate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<
    StatusMessageType | null
  >(null);
  const [apiError, setApiError] = useState<string | null>(null);

  /* ===== EFFECTS ===== */
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBTCPriceInUSD();
      setTradeFormState((prev) => ({ ...prev, BTCPrice: price }));
    };
    fetchPrice();
  }, []);

  /* ===== EVENT HANDLERS ===== */
  const handleTradeInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    setTradeFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttachInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    setAttachFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleBuyerInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    setBuyerFormState((prev) => ({ ...prev, [field]: value }));
  };

  /* ===== PSBT HANDLERS ===== */
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

  const handleUtxoAttach = async () => {
    if (!isConnected) {
      showConnectModal();
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage({ message: "Please wait..." });
    setApiError(null);

    try {
      const { cpid, quantity, feeRateVB, utxo } = attachFormState;

      // Validate required inputs first
      if (!cpid || !quantity || !feeRateVB || !utxo) {
        setApiError("Please fill in all fields with valid values.");
        setIsSubmitting(false);
        return;
      }

      // Normalize fee rate first - this includes validation
      let normalizedFees;
      try {
        normalizedFees = normalizeFeeRate({
          satsPerVB: Number(feeRateVB),
        });
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : "Invalid fee rate",
        );
        setIsSubmitting(false);
        return;
      }

      // Additional fee rate bounds checking if needed
      if (normalizedFees.normalizedSatsPerVB > MAX_FEE_RATE_VB) {
        setApiError(`Fee rate should not exceed ${MAX_FEE_RATE_VB} sat/vB`);
        setIsSubmitting(false);
        return;
      }

      // Prepare the request body for new endpoint
      const requestBody: {
        address: string;
        identifier: string;
        quantity: number;
        inputs_set: string;
        options: Partial<ComposeAttachOptions>;
      } = {
        address,
        identifier: cpid,
        quantity: parseInt(quantity, 10),
        inputs_set: utxo,
        options: {
          fee_per_kb: normalizedFees.normalizedSatsPerKB,
          return_psbt: true,
          extended_tx_info: true,
          regular_dust_size: 588,
        },
      };

      // Call the new endpoint
      const response = await fetch("/api/v2/trx/stampattach", {
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
      const inputsToSign: InputToSign[] = data.inputsToSign.map((
        input: { index: number },
      ) => ({
        index: input.index,
      }));

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
        setSubmissionMessage({
          message: "Transaction signed and broadcast successfully!",
        });
        setAttachFormState((prev) => ({ ...prev, psbtHex: walletResult.psbt }));
      } else if (walletResult.cancelled) {
        setSubmissionMessage({
          message: "PSBT signing cancelled by user.",
        });
      } else {
        setSubmissionMessage({
          message: `PSBT signing failed: ${walletResult.error}`,
        });
      }
    } catch (error: unknown) {
      console.error("Error creating or signing PSBT:", error);
      setApiError(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSwap = async () => {
    if (!isConnected) {
      showConnectModal();
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage("Please wait...");
    setApiError("");

    try {
      const { sellerPsbtHex, buyerUtxo, feeRate } = buyerFormState;

      // Field validation
      if (!sellerPsbtHex.trim()) {
        setApiError("Seller PSBT Hex is required.");
        setIsSubmitting(false);
        return;
      }

      if (!buyerUtxo.trim()) {
        setApiError("Your UTXO is required.");
        setIsSubmitting(false);
        return;
      }

      if (!feeRate || isNaN(Number(feeRate)) || Number(feeRate) <= 0) {
        setApiError("Fee Rate must be a positive number.");
        setIsSubmitting(false);
        return;
      }

      const parsedFeeRate = Number(feeRate);

      // Call the API to complete the PSBT
      const response = await fetch("/api/v2/trx/complete_psbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerPsbtHex,
          buyerUtxo,
          buyerAddress: address,
          feeRate: parsedFeeRate,
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
    } catch (error: unknown) {
      console.error("Complete swap error:", error);
      setApiError(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===== QUERY HANDLERS ===== */
  const handleQueryUtxos = useCallback(async () => {
    if (!isConnected) {
      showConnectModal();
      return;
    }

    setIsLoadingUtxos(true);
    setApiError(null);

    try {
      console.log("Querying UTXOs for address:", address);
      const response = await fetch(`/api/v2/trx/utxoquery?address=${address}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch UTXOs");
      }

      const data = await response.json();
      console.log("Raw response data:", data);

      // Validate the response structure
      if (!data || !data.utxos) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response format from server");
      }

      // Ensure we have an array of UTXOs
      if (!Array.isArray(data.utxos)) {
        console.error("UTXOs is not an array:", data.utxos);
        throw new Error("Server returned invalid UTXO format");
      }

      // Filter UTXOs >= 546 sats and sort them
      const filteredAndSortedUtxos = [...data.utxos]
        .filter((utxo: UTXO) => utxo.value >= MIN_UTXO_VALUE)
        .sort((a: UTXO, b: UTXO) => a.value - b.value);

      console.log(`Received ${data.utxos.length} total UTXOs`);
      console.log(
        `Filtered to ${filteredAndSortedUtxos.length} spendable UTXOs (>= ${MIN_UTXO_VALUE} sats)`,
      );

      if (filteredAndSortedUtxos.length === 0) {
        setApiError(`No UTXOs found with value >= ${MIN_UTXO_VALUE} sats`);
        return;
      }

      setAvailableUtxos(filteredAndSortedUtxos);
      console.log(
        `Successfully set ${filteredAndSortedUtxos.length} spendable UTXOs`,
      );
    } catch (error) {
      console.error("Error fetching UTXOs:", error);
      setApiError(
        error instanceof Error ? error.message : "Failed to fetch UTXOs",
      );
    } finally {
      setIsLoadingUtxos(false);
    }
  }, [address, isConnected]);

  const handleQueryAssets = useCallback(async () => {
    if (!isConnected) {
      showConnectModal();
      return;
    }

    setIsLoadingAssets(true);
    setApiError(null);

    try {
      console.log("Querying assets for address:", address);
      const response = await fetch(
        `/api/v2/balance/getStampsBalance?address=${
          encodeURIComponent(address)
        }`,
        { method: "GET" },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch assets");
      }

      const data = await response.json();
      console.log("Raw asset response data:", data);

      if (!data.stampBalance || !Array.isArray(data.stampBalance)) {
        throw new Error("Invalid response format from server");
      }

      // Sort assets by CPID
      const sortedAssets = [...data.stampBalance].sort((a, b) =>
        a.cpid.localeCompare(b.cpid)
      );

      console.log(`Received ${sortedAssets.length} assets`);

      if (sortedAssets.length === 0) {
        setApiError("No assets found for this address");
        return;
      }

      setAvailableAssets(sortedAssets);
      console.log(`Successfully set ${sortedAssets.length} assets`);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setApiError(
        error instanceof Error ? error.message : "Failed to fetch assets",
      );
    } finally {
      setIsLoadingAssets(false);
    }
  }, [address, isConnected]);

  /* ===== SELECTION HANDLERS ===== */
  const handleUtxoSelection = (utxo: UTXO) => {
    const utxoString = `${utxo.txid}:${utxo.vout}`;
    setAttachFormState((prev) => ({ ...prev, utxo: utxoString }));
  };

  const handleAssetSelection = (asset: XcpBalance) => {
    setAttachFormState((prev) => ({
      ...prev,
      cpid: asset.cpid,
      quantity: "", // Clear the quantity field instead of auto-filling
    }));
    setMaxQuantity(asset.quantity);
  };

  /* ===== RENDER ===== */
  return (
    <div className={`${bodyTool}`}>
      {/* ===== SELLER SECTION ===== */}
      <h1 className={`${titlePurpleLD} mobileMd:mx-auto`}>
        ATTACH TO UTXO
      </h1>
      <h2 className={`${subtitlePurple} mobileMd:mx-auto`}>SELLER</h2>

      {/* ===== CREATE PSBT FORM ===== */}
      <div className={containerBackground}>
        <h3 className=" font-bold text-xl text-stamp-purple mb-2">
          CREATE PSBT
        </h3>
        <div className="flex flex-col gap-5">
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

        <div className="flex justify-end mt-5">
          <Button
            variant="flat"
            color="purple"
            size="md"
            onClick={handleCreatePSBT}
            disabled={isSubmitting}
          >
            {isSubmitting ? "PROCESSING" : "CREATE PSBT"}
          </Button>
        </div>

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          walletError={null}
        />

        {tradeFormState.psbtHex && (
          <div className={`${containerBackground} break-words mt-6`}>
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

      {/* ===== UTXO ATTACH FORM ===== */}
      <div className={containerBackground}>
        <h3 className=" font-bold text-xl text-stamp-purple mb-2">
          UTXO ATTACH
        </h3>
        <div className="flex flex-col gap-5">
          {/* Asset (CPID) section with query button */}
          <div className="flex flex-col gap-5">
            <div className="flex gap-5 items-start">
              <div className="flex-grow">
                <InputField
                  type="text"
                  placeholder="Asset (cpid)"
                  value={attachFormState.cpid}
                  onChange={(e) => handleAttachInputChange(e, "cpid")}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  color="purple"
                  size="md"
                  onClick={handleQueryAssets}
                  disabled={isLoadingAssets || !isConnected}
                >
                  {isLoadingAssets ? "Loading..." : "QUERY ASSETS"}
                </Button>
              </div>
            </div>

            {/* Asset list */}
            {availableAssets.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-gray-800 rounded-md">
                <div className="p-2 border-b border-gray-700 font-bold text-sm">
                  Available Assets (sorted by CPID)
                </div>
                {availableAssets.map((asset) => (
                  <button
                    type="button"
                    key={asset.cpid}
                    onClick={() => handleAssetSelection(asset)}
                    className="w-full text-left p-2 hover:bg-gray-700 transition-colors text-sm border-b border-red-500 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="truncate flex-1">
                        {asset.cpid}
                      </div>
                      <div className="ml-2 text-green-400">
                        {`${asset.quantity.toLocaleString()} units`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity input with MAX display */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-start">
              <div className="flex-grow relative">
                <InputField
                  type="number"
                  placeholder="Quantity"
                  value={attachFormState.quantity}
                  onChange={(e) => {
                    const value = parseInt(
                      (e.target as HTMLInputElement).value,
                    );
                    if (!value || (maxQuantity && value <= maxQuantity)) {
                      handleAttachInputChange(e, "quantity");
                    }
                  }}
                />
                {maxQuantity !== null && (
                  <div className="absolute right-0 -top-6 text-sm text-gray-400">
                    Max: {maxQuantity.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            {attachFormState.quantity && maxQuantity &&
              parseInt(attachFormState.quantity) > maxQuantity && (
              <div className="text-red-500 text-sm">
                Quantity cannot exceed {maxQuantity.toLocaleString()}
              </div>
            )}
          </div>

          <InputField
            type="number"
            placeholder="Fee Rate (sat/vB)"
            value={attachFormState.feeRateVB}
            onChange={(e) => handleAttachInputChange(e, "feeRateVB")}
          />

          {/* UTXO section with query button */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-5 items-start">
              <div className="flex-grow">
                <InputField
                  type="text"
                  placeholder="UTXO (e.g., txid:vout)"
                  value={attachFormState.utxo}
                  onChange={(e) => handleAttachInputChange(e, "utxo")}
                />
              </div>
              <Button
                variant="outline"
                color="purple"
                size="md"
                onClick={handleQueryUtxos}
                disabled={isLoadingUtxos || !isConnected}
              >
                {isLoadingUtxos ? "Loading..." : "Query UTXOs"}
              </Button>
            </div>

            {/* UTXO list */}
            {availableUtxos.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-gray-800 rounded-md">
                <div className="p-2 border-b border-gray-700 font-bold text-sm">
                  Available UTXOs ≥ {MIN_UTXO_VALUE} sats (sorted by value)
                </div>
                {availableUtxos.map((utxo) => (
                  <button
                    type="button"
                    key={`${utxo.txid}:${utxo.vout}`}
                    onClick={() => handleUtxoSelection(utxo)}
                    className="w-full text-left p-2 hover:bg-gray-700 transition-colors text-sm border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="truncate flex-1">
                        {`${utxo.txid.substring(0, 8)}...${
                          utxo.txid.substring(utxo.txid.length - 8)
                        }:${utxo.vout}`}
                      </div>
                      <div className="ml-2 text-green-400">
                        {`${utxo.value.toLocaleString()} sats`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button
            variant="flat"
            color="purple"
            size="md"
            onClick={handleUtxoAttach}
            disabled={isSubmitting}
          >
            {isSubmitting ? "PROCESSING" : "ATTACH"}
          </Button>
        </div>

        <StatusMessages
          submissionMessage={submissionMessage
            ? { message: submissionMessage }
            : null}
          apiError={apiError}
          walletError={null}
        />

        {attachFormState.psbtHex && (
          <div className={`${containerBackground} break-words mt-6`}>
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

      {/* ===== BUYER SECTION ===== */}
      {/* ===== COMPLETE SWAP FORM ===== */}
      <div className={containerBackground}>
        <h2 className={`${subtitlePurple} mobileMd:mx-auto`}>BUYER</h2>
        <h3 className=" font-bold text-xl text-stamp-purple mb-2">
          COMPLETE SWAP
        </h3>
        <div className="flex flex-col gap-5">
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
        <div className="flex justify-end mt-5">
          <Button
            variant="flat"
            color="purple"
            size="md"
            onClick={handleCompleteSwap}
            disabled={isSubmitting}
          >
            {isSubmitting ? "PROCESSING" : "COMPLETE SWAP"}
          </Button>
        </div>
      </div>
    </div>
  );
}
