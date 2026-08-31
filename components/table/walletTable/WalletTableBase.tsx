/* ===== WALLET TABLE BASE COMPONENT =====
 * Mirrors ExplorerTableBase's role as the entry point for this table
 * family — but wallet stamps/tokens are always fetched and rendered as two
 * separate panels (never merged into one feed like ExplorerTableBase's
 * MixedItem[]), so this "base" simply picks the full or compact variant
 * for whichever type is being rendered. */
import type { SRC20Row } from "$types/src20.d.ts";

import { WalletSRC20OverviewTable } from "./WalletSRC20Overview.tsx";
import { WalletSRC20OverviewTableCompact } from "./WalletSRC20OverviewCompact.tsx";
import type { WalletStampBalanceRow } from "./WalletStampOverview.tsx";
import { WalletStampOverviewTable } from "./WalletStampOverview.tsx";
import { WalletStampOverviewTableCompact } from "./WalletStampOverviewCompact.tsx";

/* ===== TYPES ===== */
interface WalletTableBaseProps {
  type: "stamps" | "src20";
  stamps?: WalletStampBalanceRow[];
  src20s?: SRC20Row[];
  /** Compact (fewer columns) variant — used in the wallet page's ALL tab
   * split layout. Full variant is used when STAMPS/TOKENS is its own
   * dedicated section. */
  compact?: boolean;
}

/* ===== COMPONENT ===== */
export function WalletTableBase(
  { type, stamps = [], src20s = [], compact = false }: WalletTableBaseProps,
) {
  if (type === "stamps") {
    return compact
      ? <WalletStampOverviewTableCompact stamps={stamps} />
      : <WalletStampOverviewTable stamps={stamps} />;
  }
  return compact
    ? <WalletSRC20OverviewTableCompact src20s={src20s} />
    : <WalletSRC20OverviewTable src20s={src20s} />;
}
