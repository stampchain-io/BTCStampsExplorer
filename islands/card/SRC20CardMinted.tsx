/* ===== SRC20 CARD MINTED COMPONENT ===== */
/*@baba-check styles*/
import { SRC20CardBase, SRC20CardBaseProps } from "$card";
import { labelSm, textSm } from "$text";
import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import ChartWidget from "$islands/layout/ChartWidget.tsx";

/* ===== COMPONENT ===== */
export function SRC20CardMinted(props: SRC20CardBaseProps) {
  /* ===== PROPS EXTRACTION ===== */
  const { src20, fromPage } = props;

  /* ===== RENDER ===== */
  return (
    <SRC20CardBase {...props}>
      {/* ===== SRC20 PAGE CONTENT ===== */}
      {fromPage === "src20" && (
        <>
          {/* ===== PRICE INFO SECTION ===== */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[720px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={labelSm}>
                PRICE{" "}
                <span class={textSm}>
                  {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                    .toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
              <p class={labelSm}>
                CHANGE <span class={textSm}>N/A</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <p class={labelSm}>
                VOLUME{" "}
                <span class={textSm}>
                  {Math.round(src20.volume24 ?? 0).toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">BTC</span>
              </p>
            </div>
          </div>

          {/* ===== TOKEN INFO SECTION ===== */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={labelSm}>
                HOLDERS{" "}
                <span class={textSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={labelSm}>
                DEPLOY{" "}
                <span class={textSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
              <p class={labelSm}>
                CREATOR{" "}
                <span class={textSm}>
                  {src20.creator_name ||
                    abbreviateAddress(src20.destination)}
                </span>
              </p>
            </div>
          </div>

          {/* ===== CHART SECTION ===== */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <ChartWidget
                fromPage="home"
                data={src20.chart}
                tick={src20.tick}
              />
            </div>
          </div>
        </>
      )}

      {/* ===== HOME PAGE CONTENT ===== */}
      {fromPage === "home" && (
        <>
          {/* ===== TOKEN INFO SECTION ===== */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={labelSm}>
                HOLDERS{" "}
                <span class={textSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={labelSm}>
                DEPLOY{" "}
                <span class={textSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
              <p class={labelSm}>
                CREATOR{" "}
                <span class={textSm}>
                  {src20.creator_name ||
                    abbreviateAddress(src20.destination)}
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* ===== WALLET PAGE CONTENT ===== */}
      {fromPage === "wallet" && (
        <>
          {/* ===== PRICE INFO SECTION ===== */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[640px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={labelSm}>
                PRICE{" "}
                <span class={textSm}>
                  {Math.round((src20.floor_unit_price ?? 0) * 1e8)
                    .toLocaleString()}
                </span>{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
              <p class={labelSm}>
                CHANGE <span class={textSm}>N/A</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <p class={labelSm}>
                VOLUME <span class={textSm}>N/A</span>{" "}
                <span class="text-stamp-grey-light">BTC</span>
              </p>
            </div>
          </div>

          {/* ===== VALUE SECTION ===== */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-6">
            <div class="hidden min-[480px]:flex flex-col justify-center text-right -space-y-0.5 ">
              <p class={labelSm}>
                VALUE{" "}
              </p>
              <p class={textSm}>
                {Math.round((src20.value ?? 0) * 1e8).toLocaleString()}{" "}
                <span class="text-stamp-grey-light">SATS</span>
              </p>
            </div>
          </div>
        </>
      )}
    </SRC20CardBase>
  );
}
