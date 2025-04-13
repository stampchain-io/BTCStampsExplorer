/* ===== SRC20 CARD MINTING COMPONENT ===== */
/*@baba-check styles*/
import { SRC20CardBase, SRC20CardBaseProps } from "$card";
import { labelSm, textSm } from "$text";
import { formatDate } from "$lib/utils/formatUtils.ts";
import { Button } from "$button";

/* ===== COMPONENT ===== */
export function SRC20CardMinting(props: SRC20CardBaseProps) {
  /* ===== PROPS EXTRACTION ===== */
  const { src20, fromPage } = props;

  /* ===== COMPUTED VALUES ===== */
  const mintHref = `/stamping/src20/mint?tick=${
    encodeURIComponent(src20.tick)
  }&trxType=olga`;
  const progressWidth = `${src20.progress}%`;

  /* ===== EVENT HANDLERS ===== */
  const handleMintClick = (event: MouseEvent) => {
    event.preventDefault();
    globalThis.location.href = mintHref;
  };

  /* ===== RENDER ===== */
  return (
    <SRC20CardBase {...props}>
      {fromPage === "src20" && (
        <>
          {/* ===== HOLDERS AND DEPLOY SECTION ===== */}
          <div class="flex flex-col -mb-6 mobileLg:-mb-[44px]">
            <div class="hidden tablet:flex flex-col justify-center text-center -space-y-0.5 ">
              <h6 class={labelSm}>
                HOLDERS{" "}
                <span class={textSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </h6>
              <h6 class={labelSm}>
                DEPLOY{" "}
                <span class={textSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </h6>
            </div>
          </div>

          {/* ===== MINTING PROGRESS SECTION ===== */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-[22px] -ml-24 tablet:ml-0">
            <div class="hidden min-[640px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <h6 class={labelSm}>
                TOP MINTS{" "}
                <span class={textSm}>
                  {src20.top_mints_percentage?.toFixed(1) || "N/A"}%
                </span>
              </h6>
              <div class="flex flex-col gap-1">
                <h6 class={labelSm}>
                  PROGRESS{" "}
                  <span class={textSm}>
                    {Number(src20.progress)}
                  </span>
                  <span class="text-stamp-grey-light">%</span>
                </h6>
                <div class="relative min-w-[144px] mobileLg:min-w-[192px] h-1 mobileLg:h-1.5 bg-stamp-grey rounded-full">
                  <div
                    class="absolute left-0 top-0 h-1 mobileLg:h-1.5 bg-stamp-purple-dark rounded-full"
                    style={{ width: progressWidth }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== WALLET VIEW SECTION ===== */}
      {fromPage === "wallet" && (
        // Holders & Deploy
        <div class="flex flex-col justify-end">
          <div class="hidden min-[640px]:flex flex-col justify-center text-center -space-y-0.5 ">
            <h6 class={labelSm}>
              HOLDERS{" "}
              <span class={textSm}>
                {Number(src20?.mint_progress?.total_mints).toLocaleString()}
              </span>
            </h6>
            <h6 class={labelSm}>
              TOP MINTS{" "}
              <span class={textSm}>
                {src20.top_mints_percentage?.toFixed(1) || "N/A"}%
              </span>
            </h6>
            <div class="flex flex-col gap-1">
              <h6 class={labelSm}>
                PROGRESS{" "}
                <span class={textSm}>
                  {Number(src20?.mint_progress?.progress)}
                </span>
                <span class="text-stamp-grey-light">%</span>
              </h6>
            </div>
          </div>
        </div>
      )}

      {/* ===== STAMPING VIEW SECTION ===== */}
      {fromPage === "stamping/src20" && (
        <div class="flex-col gap-6 -mb-4 mobileLg:-mb-6 hidden mobileMd:flex tablet:hidden desktop:flex">
          <div class="flex flex-col justify-center text-center -space-y-0.5">
            <h6 class={labelSm}>
              SUPPLY{" "}
              <span class={textSm}>
                {Number(src20.max).toLocaleString()}
              </span>
            </h6>
            <h6 class={labelSm}>
              HOLDERS{" "}
              <span class={textSm}>
                {Number(src20.holders || 0).toLocaleString()}
              </span>
            </h6>
            <h6 class={labelSm}>
              TOP MINTS{" "}
              <span class={textSm}>
                {src20.top_mints_percentage?.toFixed(1) || "N/A"}%
              </span>
            </h6>
          </div>
        </div>
      )}

      {/* ===== MINT BUTTON SECTION ===== */}
      <Button
        variant="flat"
        color="purple"
        size="md"
        onClick={handleMintClick}
        class={(fromPage != "stamping/src20" && fromPage != "home")
          ? "hidden min-[480px]:block"
          : ""}
      >
        MINT
      </Button>
    </SRC20CardBase>
  );
}
