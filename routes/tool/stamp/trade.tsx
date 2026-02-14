/* ===== TRADE PAGE ===== */
import type { PageProps } from "$fresh/server.ts";
import { TradeToolLazy } from "$islands/tool/stamp/TradeToolLazy.tsx";

/* ===== PAGE COMPONENT ===== */
export default function ToolTradePage(_props: PageProps) {
  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col items-center">
      <TradeToolLazy />
    </div>
  );
}
