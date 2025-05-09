/* ===== FAIRMINT CONTENT COMPONENT ===== */
import { useState } from "preact/hooks";
import { useFairmintForm } from "$client/hooks/useFairmintForm.ts";
import { FeeCalculatorAdvanced } from "$islands/section/FeeCalculatorAdvanced.tsx";
import { StatusMessages } from "$notification";
import { walletContext } from "$client/wallet/wallet.ts";
import { bodyTool, containerBackground, containerColForm } from "$layout";
import { titlePurpleLD } from "$text";

/* ===== TYPES ===== */
interface FairmintToolProps {
  fairminters: any[];
}

/* ===== COMPONENT ===== */
export function FairmintTool({ fairminters }: FairmintToolProps) {
  /* ===== STATE ===== */
  const {
    formState,
    handleAssetChange,
    handleInputChange,
    handleSubmit,
    handleChangeFee,
    fetchFees,
    isLoading,
    isSubmitting,
    submissionMessage,
    apiError,
  } = useFairmintForm(fairminters);

  const [tosAgreed, setTosAgreed] = useState(false);
  const { wallet } = walletContext;

  /* ===== HELPERS ===== */
  // Check if the fairminters array is empty
  const hasFairminters = fairminters && fairminters.length > 0;

  /* ===== RENDER ===== */
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>FAIRMINT</h1>

      <form class={`${containerBackground} mb-6`}>
        {/* ===== TOKEN SELECTION ===== */}
        <div className={containerColForm}>
          {hasFairminters
            ? (
              // Render the select dropdown if fairminters are available
              <select
                className="h-10 p-3 rounded-md bg-[#999999] text-black placeholder:text-black placeholder:font-light"
                value={formState.asset}
                onChange={handleAssetChange}
              >
                <option value="">SELECT A TOKEN</option>
                {fairminters
                  .filter(
                    (fairminter) =>
                      fairminter.asset && fairminter.status === "open",
                  )
                  .map((fairminter) => {
                    const asset = fairminter.asset;
                    const displayName = asset.startsWith("A")
                      ? fairminter.asset_longname || asset
                      : asset;
                    return (
                      <option value={asset} key={asset}>
                        {displayName}
                      </option>
                    );
                  })}
              </select>
            )
            : (
              // Render an input field if no fairminters are available
              <input
                type="text"
                placeholder="ENTER ASSET"
                className="h-10 p-3 rounded-md bg-[#999999] text-black placeholder:text-black placeholder:font-light"
                value={formState.asset}
                onChange={(e) => handleInputChange(e, "asset")}
              />
            )}

          <input
            type="number"
            placeholder="QUANTITY"
            className="h-10 p-3 rounded-md bg-[#999999] text-black placeholder:text-black placeholder:font-light"
            value={formState.quantity}
            onChange={(e) => handleInputChange(e, "quantity")}
          />
        </div>
      </form>

      {/* ===== FEE CALCULATOR ===== */}
      <div className={containerBackground}>
        <FeeCalculatorAdvanced
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="fairmint"
          fileType="application/json"
          fileSize={formState.jsonSize}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          buttonName="FAIRMINT"
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          userAddress={wallet?.address}
          utxoAncestors={formState.utxoAncestors}
          feeDetails={{
            minerFee: formState.psbtFees?.estMinerFee || 0,
            dustValue: formState.psbtFees?.totalDustValue || 0,
            hasExactFees: !!formState.psbtFees?.hasExactFees,
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
