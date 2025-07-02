/* ===== TRANSFER CONTENT COMPONENT ===== */
import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { FeeCalculatorSimple } from "$components/section/FeeCalculatorSimple.tsx";
import { logger } from "$lib/utils/logger.ts";
import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  rowResponsiveForm,
} from "$layout";
import { titlePurpleLD } from "$text";
import { SRC20InputField } from "$form";
import { StatusMessages } from "$notification";

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
        const response = await fetch(`/api/v2/src20/balance/${wallet.address}`);
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

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
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
      <div className={containerBackground}>
        <FeeCalculatorSimple
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          buttonName={isConnected ? "TRANSFER" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          type="src20"
          fromPage="src20_transfer"
          userAddress={wallet?.address || ""}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          transferDetails={{
            address: formState.toAddress,
            token: formState.token,
            amount: Number(formState.amt) || 0,
          }}
        />

        {/* ===== STATUS MESSAGES ===== */}
        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>
    </div>
  );
}
