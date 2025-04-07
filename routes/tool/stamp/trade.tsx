/* ===== TRADE PAGE ===== */
import { PageProps } from "$fresh/server.ts";
import { TradeContent } from "$tool";

/* ===== PAGE COMPONENT ===== */
export default function TradePage(_props: PageProps) {
  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col items-center">
      <TradeContent />
    </div>
  );
}
