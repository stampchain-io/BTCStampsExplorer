import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { useEffect, useRef, useState } from "preact/hooks";

import { walletContext } from "$client/wallet/wallet.ts";

import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { SRC20InputField } from "../SRC20InputField.tsx";

import { logger } from "$lib/utils/logger.ts";
import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";

interface Balance {
  tick: string;
  amt: string;
  // Add other balance fields as needed
}

const bodyToolsclass = "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
const titlePurpleLDCenterclass =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3 w-full text-center";

const inputFieldContainerclass =
  "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient w-full";
const inputField2colclass =
  "flex flex-col mobileMd:flex-row gap-3 mobileMd:gap-6 w-full";
const feeSelectorContainerclass =
  "p-3 mobileMd:p-6 dark-gradient z-[10] w-full";

export function TransferContent(
  { trxType = "olga" }: { trxType?: "olga" | "multisig" } = { trxType: "olga" },
) {
  const {
    formState,
    setFormState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    fetchFees,
    config,
    isSubmitting,
    submissionMessage,
    walletError,
    apiError,
    handleInputBlur,
  } = useSRC20Form("transfer", trxType);

  const [tosAgreed, setTosAgreed] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [searchResults, setSearchResults] = useState<Balance[]>([]);
  const [openDrop, setOpenDrop] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { wallet, isConnected } = walletContext;

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

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

  const handleDropDown = (ticker: string, amount: string) => {
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

  const handleAmountChange = (e: Event) => {
    const inputAmount = Number((e.target as HTMLInputElement).value);
    const maxAmount = Number(formState.maxAmount);

    if (!isNaN(inputAmount) && !isNaN(maxAmount) && inputAmount > maxAmount) {
      handleInputChange({
        target: { value: maxAmount.toString() },
      } as Event, "amt");
      return;
    }

    handleInputChange(e, "amt");
  };

  return (
    <div class={bodyToolsclass}>
      <h1 class={titlePurpleLDCenterclass}>TRANSFER</h1>

      <div class={inputFieldContainerclass}>
        <SRC20InputField
          type="text"
          placeholder="Recipient address"
          value={formState.toAddress}
          onChange={(e) => handleInputChange(e, "toAddress")}
          onBlur={() => handleInputBlur("toAddress")}
          error={formState.toAddressError}
        />

        <div class={inputField2colclass}>
          <div class="relative" ref={dropdownRef}>
            <SRC20InputField
              type="text"
              placeholder="Token"
              value={formState.token}
              onChange={(e) => {
                const newValue = (e.target as HTMLInputElement).value
                  .toUpperCase();
                if (newValue !== formState.token && !isSelecting) {
                  handleInputChange(e, "token");
                  setOpenDrop(true);
                }
              }}
              onFocus={handleTokenFieldFocus}
              onBlur={handleTokenBlur}
              isUppercase
            />
            {openDrop && searchResults.length > 0 && !isSelecting && (
              <ul class="absolute top-[42px] left-0 max-h-[206px] w-full bg-stamp-grey-light rounded-b-md text-[#333333] text-base leading-none font-bold z-[11] overflow-y-auto [&::-webkit-scrollbar-track]:bg-[#CCCCCC] [&::-webkit-scrollbar-thumb]:bg-[#999999] [&::-webkit-scrollbar-thumb:hover]:bg-[#666666]">
                {searchResults.map((result) => (
                  <li
                    key={result.tick}
                    class="first:pt-3 cursor-pointer"
                    onClick={() => handleDropDown(result.tick, result.amt)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div class="p-1.5 pl-3 hover:bg-[#BBBBBB] uppercase">
                      {result.tick}
                      <p class="text-sm font-medium">
                        {stripTrailingZeros(result.amt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
          />
        </div>
      </div>

      <div class={feeSelectorContainerclass}>
        <ComplexFeeCalculator
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20"
          fileType="application/json"
          fileSize={undefined}
          issuance={undefined}
          serviceFee={undefined}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          buttonName={isConnected ? "TRANSFER" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          userAddress={wallet?.address}
          disabled={undefined}
          effectiveFeeRate={undefined}
          utxoAncestors={undefined}
          feeDetails={{
            minerFee: formState.psbtFees?.estMinerFee || 0,
            dustValue: formState.psbtFees?.totalDustValue || 0,
            hasExactFees: true,
            totalValue: formState.psbtFees?.totalValue || 0,
            estimatedSize: formState.psbtFees?.est_tx_size || 0,
          }}
        />

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          walletError={walletError}
        />
      </div>
    </div>
  );
}
