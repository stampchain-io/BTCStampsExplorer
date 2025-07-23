// Example: How to migrate StampingTool to use the new shared progressive fee estimation hook

import { walletContext } from "$client/wallet/wallet.ts";
import { useProgressiveFeeEstimation } from "$progressiveFees";
import { useEffect, useState } from "preact/hooks";

// BEFORE: StampingTool had its own complex fee estimation logic
function StampingToolOld() {
  const [feeDetails, setFeeDetails] = useState({
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
    est_tx_size: 0,
  });

  // Complex debounced estimation function with 50+ lines of code
  const estimateStampFeesDebounced = debounce(
    async (formData, walletAddress) => {
      // ... 50+ lines of complex logic
    },
    500,
  );

  // Manual useEffect with many dependencies
  useEffect(() => {
    // ... complex file processing and estimation triggering
  }, [
    file,
    fee,
    issuance,
    isLocked,
    isDivisible,
    isPoshStamp,
    address,
    isConnected,
  ]);

  // ... rest of component
}

// AFTER: StampingTool uses the shared hook - much cleaner!
function StampingToolNew() {
  const { wallet, isConnected } = walletContext;
  const [file, setFile] = useState<File | null>(null);
  const [fee, setFee] = useState<number>(1);
  const [issuance, setIssuance] = useState("1");
  const [isLocked, setIsLocked] = useState(true);
  const [isDivisible, setIsDivisible] = useState(false);
  const [isPoshStamp, setIsPoshStamp] = useState(false);

  // Convert file to base64 for estimation
  const [fileData, setFileData] = useState<string>("");
  useEffect(() => {
    const processFile = async () => {
      if (file) {
        const base64 = await toBase64(file);
        setFileData(base64);
      } else {
        // Use dummy file for estimation without file
        setFileData(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        );
      }
    };
    processFile();
  }, [file]);

  // ✨ This replaces 100+ lines of complex fee estimation logic!
  const { feeDetails, isEstimating, estimationError } =
    useProgressiveFeeEstimation({
      toolType: "stamp",
      feeRate: fee,
      file: fileData,
      filename: file?.name || "dummy.png",
      quantity: Number(issuance),
      locked: isLocked,
      divisible: isDivisible,
      isPoshStamp: isPoshStamp,
      walletAddress: wallet?.address,
      isConnected: isConnected,
    });

  const handleChangeFee = (newFee: number) => {
    const validatedFee = Math.max(newFee, 0.1);
    setFee(validatedFee);
    // ✨ No manual re-estimation needed! The hook automatically triggers when fee changes
  };

  return (
    <div>
      {/* File upload */}
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {/* Fee calculator with automatic updates */}
      <FeeCalculatorBase
        fee={fee}
        handleChangeFee={handleChangeFee}
        feeDetails={feeDetails}
        isSubmitting={isEstimating}
        // ... other props
      />

      {estimationError && (
        <div className="text-red-500">
          Fee estimation error: {estimationError}
        </div>
      )}
    </div>
  );
}

// ✨ Benefits of the new approach:
// 1. Automatic re-estimation when fee rate changes (fixes the slider issue!)
// 2. Consistent behavior across all tools
// 3. Much less code (100+ lines → ~10 lines)
// 4. Built-in error handling and loading states
// 5. Debounced API calls to prevent spam
// 6. Progressive estimation (Phase 1 → Phase 2) built-in
// 7. Proper TypeScript support
// 8. Centralized logging and debugging

// ✨ Usage in other tools:

// SRC20 Mint Tool
function SRC20MintToolExample() {
  const { feeDetails } = useProgressiveFeeEstimation({
    toolType: "src20",
    operation: "mint",
    feeRate: formState.fee,
    tick: formState.tick,
    amt: formState.amt,
    walletAddress: wallet?.address,
    isConnected: isConnected,
  });
}

// Transfer Tool
function TransferToolExample() {
  const { feeDetails } = useProgressiveFeeEstimation({
    toolType: "transfer",
    feeRate: formState.fee,
    recipientAddress: formState.recipientAddress,
    asset: selectedStamp.cpid,
    transferQuantity: quantity,
    walletAddress: wallet?.address,
    isConnected: isConnected,
  });
}

// SRC101 Register Tool
function SRC101RegisterToolExample() {
  const { feeDetails } = useProgressiveFeeEstimation({
    toolType: "src101",
    feeRate: formState.fee,
    to: formState.to,
    op: formState.op,
    walletAddress: wallet?.address,
    isConnected: isConnected,
  });
}
