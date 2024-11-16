import { useEffect, useState } from "preact/hooks";
import { useFairmintForm } from "$client/hooks/useFairmintForm.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";

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
    feeEstimationParams,
  } = useFairmintForm(fairminters);

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

        <FeeEstimation
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          buttonName="FAIRMINT"
          {...feeEstimationParams}
        />

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </form>
    </div>
  );
}
