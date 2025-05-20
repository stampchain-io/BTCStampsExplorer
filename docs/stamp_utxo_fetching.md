# Stamp UTXO Fetching and Fee Estimation Optimization Plan

This document outlines the current state, proposed optimizations, and action items for improving the UTXO fetching and fee estimation process within the Stamping Tool, particularly when a QuickNode endpoint is available.

## 1. Current Flow

1.  **Client Request (`islands/tool/stamp/StampingTool.tsx`)**:
    *   When a file is selected or fee parameters change, the `StampingTool.tsx` component makes a `POST` request to `/api/v2/olga/mint` with `dryRun: true`.
    *   This request includes details like the source wallet, file data, desired fee rate (satsPerVB), lock status, quantity, and asset name (for POSH stamps).

2.  **Backend Processing (`routes/api/v2/olga/mint.ts`)**:
    *   The `/api/v2/olga/mint` endpoint receives the request.
    *   It normalizes the fee rate (handling legacy `satsPerKB` and `feeRate` alongside `satsPerVB`).
    *   It validates the asset name via `StampValidationService`.
    *   Crucially, it calls `StampMintService.createStampIssuance(prepare)` with the prepared minting parameters.

3.  **Core Logic (`StampMintService.createStampIssuance`)**:
    *   This service is responsible for the main issuance logic, including:
        *   Fetching UTXOs for the `sourceWallet` (delegated to `TransactionService` which uses `CommonUTXOService`).
        *   Selecting appropriate UTXOs to cover the transaction cost.
        *   Calculating estimated transaction size and miner fees.
        *   Constructing the transaction details.
    *   If `dryRun: true`, it returns estimated figures.

4.  **Client Update (`islands/tool/stamp/StampingTool.tsx`)**:
    *   The client receives the dry run response.
    *   It updates its state (e.g., `feeDetails`).
    *   These details are passed to `FeeCalculatorAdvanced` to display the fee estimate.

5.  **Actual Minting**:
    *   If the user proceeds, a similar call to `/api/v2/olga/mint` is made (without `dryRun: true`).
    *   `StampMintService.createStampIssuance` generates a PSBT.
    *   The PSBT hex is returned to the client for signing.

## 2. Proposed Optimizations & Scenarios

The primary goal is to leverage a configured QuickNode service for more reliable and potentially faster UTXO and ancestor data fetching, and to ensure clear user feedback in various scenarios. A key challenge identified was QuickNode rate-limiting due to excessive `bb_getTxSpecific` calls. The strategy has shifted to fetching basic UTXO information first and enriching specific UTXOs on demand.

### 2.1. Prioritize QuickNode for UTXO Fetching (Revised Strategy)

*   **Backend Modification**:
    *   The UTXO fetching services (`QuicknodeUTXOService`, `CommonUTXOService`, `UTXOService`) are being refactored.
    *   **Condition**: Check for QuickNode configuration in `CommonUTXOService`.
    *   **Action**:
        *   If QuickNode is configured, `QuicknodeUTXOService.getUTXOs` (via `CommonUTXOService`) now primarily fetches a *basic list* of UTXOs (txid, vout, value) using `bb_getUTXOs` to avoid immediate rate-limiting.
        *   Full transaction details (including script and ancestor information for `effectiveValue` calculation in coin selection) are fetched on-demand for individual UTXOs as they are being considered by the selection algorithm (`UTXOService.selectUTXOsLogic`) using `CommonUTXOService.getSpecificUTXO` or a similar targeted method. This leverages `CachedQuicknodeRPCService` for `bb_getTxSpecific` calls.
        *   The `rawTxHexCache` in `CommonUTXOService` helps for non-witness UTXO processing.
    *   **Fallback**: Remains in place in `CommonUTXOService`.

### 2.2. Accurate Fee Estimation with Wallet States

*   **Fee Calculation Logic (`lib/utils/feeCalculations.ts`, `lib/utils/minting/feeCalculations.ts`)**:
    *   Need to ensure these can work with potentially partially detailed UTXOs initially, or that data is enriched appropriately before final fee calculation.
*   **Scenario Handling (Primarily in `StampingTool.tsx` and reflected in `FeeCalculatorBase.tsx`)**:

    1.  **Wallet Connected & Sufficient UTXOs**:
        *   Backend dry run (`/api/v2/olga/mint`) succeeds using the best available UTXO source (ideally QuickNode).
        *   `feeDetails` in `StampingTool.tsx` are populated with accurate estimates from the backend.
        *   `FeeCalculatorBase.tsx` displays these accurate estimates.
        *   The "STAMP" (or equivalent) button is enabled (assuming form validity and ToS agreement).

    2.  **Wallet Connected & Insufficient UTXOs**:
        *   The backend (`StampMintService`) during UTXO selection/transaction construction should detect that available UTXOs cannot cover the estimated total cost (outputs + fees).
        *   `/api/v2/olga/mint` (dry run) should return a specific error (e.g., `{ "error": "Insufficient funds to cover transaction costs" }` with a 400 status).
        *   `StampingTool.tsx` (in `useEffect` hooks handling dry run calls, and in `handleMint`) must catch this error:
            *   Set `setApiError("Insufficient funds to cover outputs and fees. Please add more BTC to your wallet.")`.
            *   The `FeeCalculatorBase.tsx` will display this `apiError`.
            *   The fee *estimation itself* (displayed values for miner fee, dust, total) might still show what the transaction *would* cost if funds were available, or it could show $0 if preferred, but the error message is paramount.
            *   The "STAMP" button must be disabled.
    3.  **No Wallet Connected**:
        *   `StampingTool.tsx` has `isConnected` as false.
        *   `FeeCalculatorBase.tsx` already correctly shows "CONNECT WALLET" as the `buttonName` for the submit action.
        *   Fee estimations will likely be based on default assumptions (e.g., 1 input) or might not fetch specific UTXO-based estimations. The current dry run logic might fail or return default/zeroed fees if no `sourceWallet` is provided by `StampingTool.tsx`. This behavior should be graceful. The UI should still allow fee rate selection, and perhaps show a generic cost based on file size and selected fee rate, independent of wallet balance.

## 3. Action Items & To-Do List

**High Priority:**

*   [X] **Define `UTXO` Type**: (Completed - definition reviewed, `BasicUTXO` introduced for partial data)
*   [X] **Verify `PreviewImageModalProps`**: (Completed - modal handles its own close, prop removed)
*   [X] **Fix BigInt Serialization in Logger**: (Completed - `bigIntReplacer` added to `logger.ts`)
*   [X] **Fix `TransactionService.UTXOService` Call**: (Completed - `TransactionService` now holds an instance `utxoServiceInstance`)
*   [In Progress] **Refactor UTXO Fetching to Avoid Rate Limiting**:
    *   [X] Modify `QuicknodeUTXOService.getUTXOs` to fetch basic UTXO list, removing eager `enrichWithAncestorInfo` for all.
    *   [X] Add `rawTxHexCache` and `getRawTransactionHex` to `CommonUTXOService`.
    *   [X] Modify `CommonUTXOService.getSpendableUTXOs` to return `BasicUTXO[]`.
    *   [ ] Adapt `UTXOService.getAddressUTXOs` to handle/return `BasicUTXO[]` or `Partial<UTXO>[]`.
    *   [ ] Refactor `UTXOService.selectUTXOsLogic` to:
        *   Accept `BasicUTXO[]` or `Partial<UTXO>[]`.
        *   Fetch full UTXO details (script, ancestor info for `effectiveValue`) on-demand for each UTXO as it's processed during selection, using `CommonUTXOService.getSpecificUTXO` or `QuicknodeUTXOService.getUTXO`.
        *   Ensure fee calculation (`calculateMiningFee`) receives the necessary (potentially enriched) input/output details.
    *   [ ] Ensure `StampMintService.generatePSBT` correctly uses the (potentially modified) return from `selectUTXOsForTransaction` and correctly fetches `rawTxHex` for non-witness inputs using the cached `commonUtxoService.getRawTransactionHex`.
*   [ ] **Refactor Logger Namespaces**: (Deferred - focus on core functionality first)
*   [ ] **Backend: Integrate QuickNode into `StampMintService` (or its UTXO-providing dependency)**: (This is effectively what the "Refactor UTXO Fetching" task covers)
    *   [X] Define a common `ICommonUTXOService` interface (Completed, implicitly through `CommonUTXOService` structure)
    *   [X] Implement `CommonUTXOService` class. (Completed)
    *   [X] Within `CommonUTXOService`, add logic to check for QuickNode config. (Completed)
    *   [X] If configured, call `QuicknodeUTXOService` methods. (Completed, now fetches basic list)
    *   [In Progress] Ensure data from `QuicknodeUTXOService` is transformed/mapped and enriched on-demand.
    *   [X] Implement fallback in `CommonUTXOService`. (Completed)
*   [ ] **Backend: Insufficient Funds Handling**:
    *   Ensure `StampMintService.createStampIssuance` (when performing UTXO selection) reliably detects insufficient funds, especially after refactoring `selectUTXOsLogic`.
    *   Return a distinct error message and appropriate HTTP status (e.g., 400) from `/api/v2/olga/mint`.
*   [ ] **Frontend: Handle Insufficient Funds Error (`islands/tool/stamp/StampingTool.tsx`)**:
    *   Properly catch and display the "Insufficient funds" error.
    *   Ensure the main action button is disabled.
*   [ ] **Testing**: Thoroughly test all scenarios post-refactor.

**Medium Priority:**

*   [ ] **Review Fee Calculation Accuracy**: Post-refactor, verify ancestor fees and vsize are correctly used.
*   [ ] **No Wallet Connected - Fee Estimation**: Refine display.

**Low Priority / Cleanup:**

*   [ ] **`lib/utils/utxoUtils.ts` Cleanup**.
*   [ ] **Review Unused Props** in `FeeCalculatorBase.tsx`.
*   [ ] **Code Comments & Clarity**.

## 4. Progress

*   [X] Initial analysis and documentation outline.
*   [X] Several linter errors and minor bugs fixed.
*   [X] `UTXO` type definition clarified; `BasicUTXO` conceptualized.
*   [X] Logger updated to handle `BigInt` serialization.
*   [X] `TransactionService` usage corrected to instantiate `UTXOService`.
*   [In Progress] Major refactoring of UTXO service layer (`QuicknodeUTXOService`, `CommonUTXOService`) to address QuickNode rate-limiting by shifting to on-demand enrichment of UTXO details.
    *   `QuicknodeUTXOService.getUTXOs` now returns basic UTXO info.
    *   `CommonUTXOService.getSpendableUTXOs` adapted to return `BasicUTXO[]`.
    *   `CommonUTXOService` includes caching for `rawTxHex`.
*   **Next Steps**: Continue refactoring `UTXOService` (specifically `selectUTXOsLogic`) to work with basic UTXO data and fetch full details on demand.

---
This plan should guide the refactoring process. 