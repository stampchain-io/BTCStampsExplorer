/* ===== TRANSFER CONTENT COMPONENT ===== */
import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { SRC20InputField } from "$form";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  loaderSpinGrey,
  rowResponsiveForm,
} from "$layout";
import { useTransactionConstructionService } from "$lib/hooks/useTransactionConstructionService.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/performance/fees/fee-estimation-utils.ts";
import { stripTrailingZeros } from "$lib/utils/ui/formatting/formatUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { StatusMessages } from "$notification";
import { FeeCalculatorBase } from "$section";
import { titlePurpleLD } from "$text";
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== INTERFACE DEFINITIONS ===== */
interface Balance {
  tick: string;
  amt: string;
}

/* ===== COMPONENT IMPLEMENTATION ===== */
export function SRC20TransferTool(
  { trxType = "olga" }: { trxType?: "olga" | "multisig" } = { trxType: "olga" },
) {
  /* ===== FORM STATE AND HANDLERS ===== */
  const {
    formState,
    setFormState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    config,
    isSubmitting,
    submissionMessage,
    apiError,
    handleInputBlur,
  } = useSRC20Form("transfer", trxType);

  /* ===== LOCAL STATE ===== */
  const [tosAgreed, setTosAgreed] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [searchResults, setSearchResults] = useState<Balance[]>([]);
  const [openDrop, setOpenDrop] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState(false);

  /* ===== REFS ===== */
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tokenInputRef = useRef<HTMLInputElement>(null);

  /* ===== WALLET CONTEXT ===== */
  const { wallet, isConnected } = walletContext;

  /* ===== PROGRESSIVE FEE ESTIMATION INTEGRATION ===== */
  const {
    getBestEstimate,
    estimateExact, // Phase 3: Exact estimation before transferring
    error: feeEstimationError,
    clearError,
  } = useTransactionConstructionService({
    toolType: "src20-transfer",
    feeRate: isSubmitting ? 0 : formState.fee,
    walletAddress: wallet?.address || "", // Provide empty string instead of undefined
    isConnected: !!wallet && !isSubmitting,
    isSubmitting,
    // SRC-20 transfer specific parameters
    tick: formState.token,
    amt: formState.amt,
    recipientAddress: formState.toAddress,
  });

  // Get the best available fee estimate
  const progressiveFeeDetails = getBestEstimate();

  // Local state for exact fee details (updated when Phase 3 completes) - StampingTool pattern
  const [exactFeeDetails, setExactFeeDetails] = useState<
    typeof progressiveFeeDetails | null
  >(null);

  // Reset exactFeeDetails when fee rate changes to allow slider updates - StampingTool pattern
  useEffect(() => {
    // Clear exact fee details when fee rate changes so slider updates work
    setExactFeeDetails(null);
  }, [formState.fee]);

  // Wrapper function for transferring that gets exact fees first - StampingTool pattern
  const handleTransferWithExactFees = async () => {
    try {
      // Get exact fees before final submission
      const exactFees = await estimateExact();
      if (exactFees) {
        // Calculate net spend amount (matches wallet display)
        const netSpendAmount = exactFees.totalValue || 0;
        setExactFeeDetails({
          ...exactFees,
          totalValue: netSpendAmount, // Matches wallet
        });
      }
      // Call the original transfer submission
      await handleSubmit();
    } catch (error) {
      console.error("TRANSFERTOOL: Error in exact fee estimation", error);
      // Still proceed with submission even if exact fees fail
      await handleSubmit();
    }
  };

  /* ===== CLICK OUTSIDE HANDLER ===== */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDrop(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ===== TOKEN SELECTION HANDLER ===== */
  const handleDropDown = (ticker: string, _amount: string) => {
    setOpenDrop(false);
    setIsSelecting(true);

    const selectedBalance = balances.find((b) => b.tick === ticker);
    if (selectedBalance) {
      const maxAmount = stripTrailingZeros(selectedBalance.amt);
      setFormState((prev) => ({
        ...prev,
        token: ticker,
        amt: "",
        maxAmount: maxAmount,
      }));

      // Focus amount input after selection
      setTimeout(() => {
        const amountInput = document.querySelector(
          "[data-amount-input]",
        ) as HTMLInputElement;
        if (amountInput) {
          amountInput.placeholder = `Amount (MAX: ${maxAmount})`;
          amountInput.focus();
          setIsSelecting(false);
        }
      }, 100);
    }
  };

  /* ===== TOKEN INPUT HANDLERS ===== */
  const handleTokenFieldFocus = () => {
    if (!formState.token?.trim() && !isSelecting) {
      setSearchResults(balances);
      setOpenDrop(true);
    }
  };

  const handleTokenBlur = () => {
    setTimeout(() => {
      setOpenDrop(false);
      setIsSelecting(false);
    }, 200);
  };

  /* ===== TOKEN SEARCH EFFECT ===== */
  useEffect(() => {
    if (isSelecting) {
      return;
    }

    if (!formState.token?.trim()) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const filteredResults = balances.filter((item) => {
        const regex = new RegExp(formState.token, "i");
        return regex.test(item.tick);
      });

      setSearchResults(filteredResults);
      setOpenDrop(filteredResults.length > 0);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [formState.token, balances, isSelecting]);

  /* ===== BALANCE FETCHING EFFECT ===== */
  useEffect(() => {
    const getBalances = async () => {
      if (!wallet?.address) return;

      try {
        const response = await fetch(
          `/api/v2/src20/balance/${wallet.address}`,
          {
            headers: {
              "X-API-Version": "2.3",
            },
          },
        );
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          setBalances(data.data);
        }
      } catch (error) {
        logger.error("stamps", {
          message: "Error fetching balances",
          error,
        });
      }
    };

    getBalances();
  }, [wallet?.address]);

  /* ===== AMOUNT INPUT HANDLER ===== */
  const handleAmountChange = (e: Event) => {
    const inputAmount = Number((e.target as HTMLInputElement).value);
    const maxAmount = Number(formState.maxAmount);

    if (!isNaN(inputAmount) && !isNaN(maxAmount) && inputAmount > maxAmount) {
      handleInputChange({
        target: { value: maxAmount.toString() },
      } as any as Event, "amt");
      return;
    }

    handleInputChange(e, "amt");
  };

  /* ===== TOKEN CHANGE HANDLER ===== */
  const handleTokenChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    console.log("Token input event:", {
      type: e.type,
      targetValue: target.value,
    });
    const newValue = target.value.toUpperCase();
    if (newValue !== formState.token && !isSelecting) {
      handleInputChange(e, "token");
      setOpenDrop(true);
    }
  };

  /* ===== COMPONENT RENDER ===== */
  useEffect(() => {
    console.log("Token input ref:", tokenInputRef.current);
  }, []);

  /* ===== CONFIG CHECK ===== */
  if (!config) {
    return (
      <div class={bodyTool}>
        <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>TRANSFER</h1>
        <div class={`${containerBackground} mb-6`}>
          <div class="flex items-center justify-center p-8">
            <div class={loaderSpinGrey}></div>
            <span class="ml-3 text-stamp-grey-light">
              Loading configuration...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>TRANSFER</h1>

      {/* ===== FORM  ===== */}
      <form
        class={`${containerBackground} ${containerColForm} mb-6`}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        aria-label="Transfer SRC20 tokens"
        novalidate
      >
        {/* ===== TOKEN AND AMOUNT INPUTS ===== */}
        <div class={rowResponsiveForm}>
          {/* Token Input with Dropdown */}
          <div
            class={`relative ${
              openDrop && searchResults.length > 0 && !isSelecting
                ? "input-open"
                : ""
            }`}
            ref={dropdownRef}
          >
            <SRC20InputField
              type="text"
              placeholder="Token"
              value={formState.token}
              onChange={handleTokenChange}
              onFocus={handleTokenFieldFocus}
              onBlur={handleTokenBlur}
              isUppercase
              aria-label="Select token"
            />

            {/* Token Dropdown */}
            {openDrop && searchResults.length > 0 && !isSelecting && (
              <ul
                class="absolute top-[100%] left-0 max-h-[168px] w-full bg-stamp-grey-light rounded-b-md font-bold text-sm text-stamp-grey-darkest leading-none z-[11] overflow-y-auto scrollbar-grey"
                role="listbox"
                aria-label="Available tokens"
              >
                {searchResults.map((result) => (
                  <li
                    key={result.tick}
                    class="cursor-pointer p-1.5 pl-3 hover:bg-[#C3C3C3] uppercase"
                    onClick={() => handleDropDown(result.tick, result.amt)}
                    onMouseDown={(e) => e.preventDefault()}
                    role="option"
                    aria-selected={formState.token === result.tick}
                  >
                    {result.tick}
                    <h6 class="font-medium text-xs text-stamp-grey-darker">
                      {stripTrailingZeros(result.amt)}
                    </h6>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Amount Input */}
          <SRC20InputField
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Amount"
            value={formState.amt}
            onChange={handleAmountChange}
            onBlur={() => handleInputBlur("amt")}
            error={formState.amtError}
            data-amount-input
            aria-label="Amount to transfer"
          />
        </div>

        {/* ===== RECIPIENT ADDRESS INPUT ===== */}
        <SRC20InputField
          type="text"
          placeholder="Recipient address"
          value={formState.toAddress}
          onChange={(e) => handleInputChange(e, "toAddress")}
          onBlur={() => handleInputBlur("toAddress")}
          error={formState.toAddressError}
          aria-label="Recipient address"
        />
      </form>

      {/* ===== FEE CALCULATOR ===== */}
      <div class={containerBackground}>
        <FeeCalculatorBase
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={handleTransferWithExactFees}
          buttonName={isConnected ? "TRANSFER" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          type="src20"
          fromPage="src20_transfer"
          bitname=""
          src20TransferDetails={{
            address: formState.toAddress,
            token: formState.token,
            amount: Number(formState.amt) || 0,
          }}
          feeDetails={mapProgressiveFeeDetails(
            exactFeeDetails || progressiveFeeDetails,
          )}
          // Progressive fee estimation props removed - not supported by FeeCalculatorBase
        />

        {/* Error Display */}
        {feeEstimationError && (
          <div className="mt-2 text-red-500 text-sm">
            Fee estimation error: {feeEstimationError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===== STATUS MESSAGES ===== */}
        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>
    </div>
  );
}
