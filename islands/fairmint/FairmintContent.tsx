import { useEffect, useState } from "preact/hooks";
import { useFairmintForm } from "$client/hooks/useFairmintForm.ts";
import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { walletContext } from "$client/wallet/wallet.ts";

interface FairmintContentProps {
  fairminters: any[];
}

export function FairmintContent({ fairminters }: FairmintContentProps) {
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Check if the fairminters array is empty
  const hasFairminters = fairminters && fairminters.length > 0;

  return (
    <div className="w-full max-w-full p-4 bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF]">
      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span>Select Token:</span>
          {hasFairminters
            ? (
              // Render the select dropdown if fairminters are available
              <select
                className="p-2 rounded bg-[#999999] text-black"
                value={formState.asset}
                onChange={handleAssetChange}
              >
                <option value="">Select a token</option>
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
                className="p-2 rounded bg-[#999999] text-black"
                placeholder="Enter asset"
                value={formState.asset}
                onChange={(e) => handleInputChange(e, "asset")}
              />
            )}
        </label>

        <label className="flex flex-col gap-1">
          <span>Quantity:</span>
          <input
            type="number"
            className="p-2 rounded bg-[#999999] text-black"
            value={formState.quantity}
            onChange={(e) => handleInputChange(e, "quantity")}
          />
        </label>

        <ComplexFeeCalculator
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

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </form>
    </div>
  );
}
