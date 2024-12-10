import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { useEffect, useState } from "preact/hooks";

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

  const { wallet, isConnected } = walletContext;

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleTransferSubmit = async () => {
    if (!isConnected) {
      logger.debug("stamps", {
        message: "Showing wallet connect modal - user not connected",
      });
      walletContext.showConnectModal();
      return;
    }

    try {
      await handleSubmit();
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

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

      requestAnimationFrame(() => {
        const amountInput = document.querySelector(
          "[data-amount-input]",
        ) as HTMLInputElement;
        if (amountInput) {
          amountInput.placeholder = `Amount (MAX: ${maxAmount})`;
        }
      });
    }
  };

  const handleTokenFieldFocus = () => {
    if (!formState.token?.trim()) {
      setSearchResults(balances);
      setOpenDrop(true);
    }
    setIsSelecting(false);
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
    const value = (e.target as HTMLInputElement).value;
    const selectedBalance = balances.find((b) => b.tick === formState.token);

    if (selectedBalance) {
      const maxAmount = parseFloat(stripTrailingZeros(selectedBalance.amt));
      const inputAmount = parseFloat(value);

      if (!isNaN(inputAmount) && inputAmount > maxAmount) {
        handleInputChange({
          target: { value: maxAmount.toString() },
        } as Event, "amt");
        return;
      }
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
          <div class="relative">
            <SRC20InputField
              type="text"
              placeholder="Token"
              value={formState.token}
              onChange={(e) => {
                const newValue = (e.target as HTMLInputElement).value
                  .toUpperCase();
                if (newValue !== formState.token) {
                  handleInputChange(e, "token");
                  if (!isSelecting) {
                    setOpenDrop(true);
                  }
                }
              }}
              onFocus={handleTokenFieldFocus}
              onBlur={() => {
                if (formState.token?.trim() || isSelecting) {
                  setTimeout(() => {
                    setOpenDrop(false);
                    setIsSelecting(false);
                  }, 150);
                }
              }}
              isUppercase
            />
            {openDrop && searchResults.length > 0 && !isSelecting && (
              <ul class="absolute top-[54px] left-0 w-full bg-[#999999] rounded-b text-[#333333] font-bold text-[12px] leading-[14px] z-[11] max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <li
                    key={result.tick}
                    onClick={() => handleDropDown(result.tick, result.amt)}
                    class="cursor-pointer p-2 hover:bg-gray-600 uppercase"
                  >
                    {result.tick}
                    <span class="text-[10px] ml-2">
                      (Balance: {stripTrailingZeros(result.amt)})
                    </span>
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
          type="src20-transfer"
          fileType="application/json"
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleTransferSubmit}
          buttonName={isConnected ? "TRANSFER" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          userAddress={wallet?.address}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          utxoAncestors={formState.utxoAncestors}
          feeDetails={{
            minerFee: formState.psbtFees?.estMinerFee || 0,
            dustValue: formState.psbtFees?.totalDustValue || 0,
            hasExactFees: !!formState.psbtFees?.hasExactFees,
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
