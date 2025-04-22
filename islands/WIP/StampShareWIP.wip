/* ===== STAMP SHARE COMPONENT ===== */
/* WIP - Not used */
/* @baba */

import { StampRow } from "$globals";
const rootUrl = globalThis.location?.origin || "https://stampchain.io";

export function StampShare({ stamp }: { stamp: StampRow }) {
  return (
    <div class="text-[#F5F5F5] w-full flex flex-col gap-3">
      <p class="text-[26px] font-semibold">Share this stamp:</p>
      <a
        href={`${rootUrl}/stamp/${stamp.stamp}`}
        target="_blank"
        rel="noopener noreferrer"
        class="bg-[#2B0E49] py-6 px-4 text-[#60626F] inline-block w-full"
      >
        {`${rootUrl}/stamp/${stamp.stamp}`}
      </a>
    </div>
  );
}
