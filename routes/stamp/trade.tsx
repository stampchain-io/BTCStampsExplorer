import { PageProps } from "$fresh/server.ts";
import { TradeContent } from "$islands/stamping/src20/trade/TradeContent.tsx";

export default function TradePage(_props: PageProps) {
  return (
    <div class="flex flex-col items-center">
      <TradeContent />
    </div>
  );
}
