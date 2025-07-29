import { Icon } from "$icon";
import { glassmorphism } from "$layout";

interface MaraStatusLinkProps {
  txid: string;
  class?: string;
}

export function MaraStatusLink(
  { txid, class: className = "" }: MaraStatusLinkProps,
) {
  const statusUrl = `https://slipstream.mara.com/status?txid=${txid}`;

  return (
    <div
      class={`${glassmorphism} bg-gradient-to-br from-purple-900/20 to-purple-800/30 border-purple-500/30 p-4 ${className}`}
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="text-purple-400">
            <Icon
              type="icon"
              name="externalLink"
              size="md"
              color="custom"
              weight="normal"
            />
          </div>
          <div>
            <h4 class="text-purple-300 font-semibold text-sm">
              MARA Pool Status
            </h4>
            <p class="text-xs text-stamp-grey-light mt-1">
              Track your transaction in the MARA mining pool
            </p>
          </div>
        </div>
        <a
          href={statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors font-semibold flex items-center gap-2"
        >
          View Status
          <Icon
            type="icon"
            name="arrowUpRight"
            size="xs"
            color="custom"
            weight="normal"
          />
        </a>
      </div>
      <div class="mt-3 text-xs text-stamp-grey break-all">
        <span class="text-stamp-grey-light">Transaction ID:</span> {txid}
      </div>
    </div>
  );
}
