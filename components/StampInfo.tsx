import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { short_address } from "utils/util.ts";
import { StampKind } from "$/components/StampKind.tsx";

dayjs.extend(relativeTime);

export function StampInfo({ stamp }: { stamp: StampRow }) {
  const timestamp = new Date(stamp.block_time);
  const kind = stamp.is_btc_stamp
    ? "stamp"
    : stamp.cpid.startsWith("A")
    ? "cursed"
    : "named";
  return (
    <div class="flex flex-col text-gray-200">
      <div class="flex justify-around items-center truncate border-b border-t">
        <p>
          Stamp: #{stamp.stamp}
        </p>
        <StampKind kind={kind} />
        <p>
          Supply: {stamp.divisible
            ? (stamp.supply / 100000000).toFixed(2)
            : stamp.supply > 100000
            ? "+100000"
            : stamp.supply}
        </p>
      </div>
      <div class="flex justify-around truncate border-b border-t">
        <a
          href={`https://xcp.dev/asset/${stamp.cpid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          ID: {stamp.cpid}
        </a>
      </div>
      <div class="flex justify-around truncate border-b border-t">
        <p>
          Creator: {stamp.creator_name ? stamp.creator_name : stamp.creator}
        </p>
      </div>
      <div class="flex justify-around truncate border-b border-t">
        <p>
          Created: {timestamp.toLocaleDateString()}{" "}
          ({dayjs(timestamp).fromNow()})
        </p>
      </div>
      <div class="flex justify-around truncate border-b border-t">
        <a
          href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          TX: {short_address(stamp.tx_hash, 12)}
        </a>
      </div>
    </div>
  );
}
