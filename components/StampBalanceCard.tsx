import { getFileSuffixFromMime } from "$lib/utils/util.ts";
import { StampRow } from "globals";

export function StampBalanceCard(
  { stamp, kind = "stamp" }: {
    stamp: StampRow;
    kind: "cursed" | "stamp" | "named";
  },
) {
  let src: string;
  const suffix = getFileSuffixFromMime(stamp.stamp_mimetype);

  if (suffix === "json" || suffix === "gz" || suffix === "js") {
    src = "/content/not-available.png";
  } else {
    src = `/content/${stamp.tx_hash}.${suffix}`;
  }

  return (
    <a
      href={`/stamp/${stamp.tx_hash}`}
      class="border rounded-lg text-center text-sm uppercase"
    >
      <div class="relative pb-[100%] w-full overflow-hidden">
        <img
          class="absolute top-0 left-0 w-full h-full max-w-none object-contain image-rendering-pixelated rounded-t-lg"
          alt={`Stamp No. ${stamp.stamp ?? "CURSED"}`}
          src={src}
          onError={(e) => {
            e.currentTarget.src = `/not-available.png`;
          }}
        />
      </div>
      <div>
        <div class="flex items-center justify-around truncate border-b border-t">
          <p class="text-gray-200">
            Stamp: #{stamp.stamp ?? "CURSED"}
          </p>
          <p class="text-gray-200 text-xs text-center ">
            bal: {stamp.balance && stamp.divisible
              ? parseFloat(Number(stamp.balance / 100000000).toString())
                .toFixed(8)
              : stamp.balance && BigInt(stamp.balance) > BigInt(100000)
              ? "+100000"
              : stamp.balance
              ? BigInt(stamp.balance).toString()
              : 0}
          </p>
        </div>
        <p class="text-gray-200 border-b">
          {stamp.cpid}
        </p>
      </div>
    </a>
  );
}
