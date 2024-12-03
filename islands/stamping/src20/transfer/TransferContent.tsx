import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { useEffect, useState } from "preact/hooks";

import { walletContext } from "$client/wallet/wallet.ts";

import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { SRC20InputField } from "../SRC20InputField.tsx";

import { logger } from "$lib/utils/logger.ts";
import { SearchResult } from "$islands/datacontrol/Search.tsx";

const bodyToolsClassName =
  "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
const titlePurpleLDCenterClassName =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3 w-full text-center";

const inputFieldContainerClassName =
  "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient w-full";
const inputField2colClassName =
  "flex flex-col mobileMd:flex-row gap-3 mobileMd:gap-6 w-full";
const feeSelectorContainerClassName =
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
    isLoading,
    config,
    isSubmitting,
    submissionMessage,
    walletError,
    apiError,
    handleInputBlur,
  } = useSRC20Form("transfer", trxType);

  const [tosAgreed, setTosAgreed] = useState(false);
  const [balances, setBalances] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [openDrop, setOpenDrop] = useState<boolean>(false);

  const { wallet, isConnected } = walletContext;

  if (isLoading) {
    return <div>Loading...</div>;
  }

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

  // Update useEffect to handle search results with better debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formState.token?.trim()) {
        try {
          const data = balances.filter((item) => {
            const regex = new RegExp(formState.token, "i"); // 'i' makes it case-insensitive
            return regex.test(item.tick);
          });

          if (data && Array.isArray(data)) {
            setSearchResults(data);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [formState.token, balances]);

  useEffect(() => {
    const getBalances = async () => {
      const response = await fetch(
        `/api/v2/src20/balance/${wallet.address}`,
      );
      const data = await response.json();
      setBalances(data.data);
    };
    getBalances();
  }, []);

  const handleDropDown = (ticket: string) => {
    setOpenDrop(false);
    setFormState((prev) => ({
      ...prev,
      token: ticket as string,
    }));
  };

  return (
    <div className={bodyToolsClassName}>
      <h1 className={titlePurpleLDCenterClassName}>TRANSFER</h1>

      <div className={inputFieldContainerClassName}>
        <SRC20InputField
          type="text"
          placeholder="Recipient address"
          value={formState.toAddress}
          onChange={(e) => handleInputChange(e, "toAddress")}
          onBlur={() => handleInputBlur("toAddress")}
          error={formState.toAddressError}
        />

        <div className={inputField2colClassName}>
          <div className="relative">
            <SRC20InputField
              type="text"
              placeholder="Token"
              value={formState.token}
              onChange={(e) => {
                if (e.currentTarget.value) {
                  setOpenDrop(true);
                }
                handleInputChange(e, "token");
              }}
              onBlur={() => handleInputBlur("token")}
              isUppercase
            />
            {(openDrop && searchResults.length > 0) && (
              <ul class="absolute top-[54px] left-0 w-full bg-[#999999] rounded-b text-[#333333] font-bold text-[12px] leading-[14px] z-[11] max-h-60 overflow-y-auto">
                {searchResults.map((result: SearchResult) => (
                  <li
                    key={result.tick}
                    onClick={() => handleDropDown(result.tick)}
                    class="cursor-pointer p-2 hover:bg-gray-600 uppercase"
                  >
                    {result.tick}
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
            onChange={(e) => handleInputChange(e, "amt")}
            onBlur={() => handleInputBlur("amt")}
            error={formState.amtError}
          />
        </div>
      </div>

      <div className={feeSelectorContainerClassName}>
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
