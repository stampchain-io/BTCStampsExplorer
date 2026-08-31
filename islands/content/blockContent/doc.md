/**
*
* WIP
* ===
*
* @reinamora - now wired into routes/block/[block_index].tsx and routes/block/index.tsx
* (exported via islands/content/index.ts). Still fair game to finetune further
* (styling, real difficulty/halving data, live-updating fee visualization).
*
* Components
* ----------
* - BlockSelector.tsx
*   Props (`BlockProps` from $types/ui.d.ts): `block: BlockRow`, `selected?: { value: any }`.
*   Renders a clickable card linking to `/block/{block_index}`; highlights itself when
*   `selected.value === block` and sets `selected.value = block` on click.
*
* - BlockTransactions.tsx (default export)
*   Props: `stamps?: BlockStampRow[]`, `src20?: BlockSrc20Row[]`, `blockDifficulty?: number | null`.
*   State: `isExpanded` (useState, default `true`) toggles the whole panel via the caret icon.
*   Hooks: `useFees()` ($fees) for live mempool fee tiers, falling back to `DEFAULT_FEE`
*   (10 sat/vB) per tier when the hook has no data yet; `usdForFee()` converts sat/vB to a
*   USD estimate using `fees.btcPrice`. Lists stamp issuances (`BlockStampRow`) and SRC-20
*   operations (`BlockSrc20Row`, ticks converted via `unicodeEscapeToEmoji`) for the block
*   when present.
*
* TODO
* ----
* - Colored placeholder blocks (fee tiers / difficulty section) are still static decoration,
*   not data-driven visualizations.
* - Block difficulty/halving progress is a static label; no real countdown logic yet.
*
* Last Updated: August 23, 2026
* Author: reinamora
*
*/
