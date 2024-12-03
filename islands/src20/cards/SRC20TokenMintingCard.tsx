import { Button } from "$components/shared/Button.tsx";
import {
  boldTextClassName,
  defaultTextClassName,
  middleLayoutClassName,
  SRC20BaseCard,
  SRC20BaseCardProps,
} from "$islands/src20/cards/SRC20BaseCard.tsx";
import { formatDate } from "$lib/utils/formatUtils.ts";

export function SRC20TokenMintingCard(props: SRC20BaseCardProps) {
  const { src20, variant } = props;

  const mintHref = `/stamping/src20/mint?tick=${
    encodeURIComponent(src20.tick)
  }&trxType=olga`;
  const progress = src20.progress || "0";
  const progressWidth = `${progress}%`;

  const handleMintClick = () => {
    globalThis.location.href = mintHref;
  };

  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";

  return (
    <SRC20BaseCard {...props}>
      {variant !== "minting" && (
        <>
          {/* Holders & Deploy */}
          <div class="flex flex-col -mb-[44px]">
            <div class="hidden tablet:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={dataLabelSm}>
                HOLDERS{" "}
                <span class={dataValueSm}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={dataLabelSm}>
                DEPLOY{" "}
                <span class={dataValueSm}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* Top Mints & Progress Bar */}
          <div class="flex flex-col -mb-3 mobileLg:-mb-[20px] -ml-24 tablet:ml-0 ">
            <div class="hidden min-[640px]:flex flex-col justify-center text-center -space-y-0.5 ">
              <p class={dataLabelSm}>
                TOP MINTS <span class={dataValueSm}>0</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <div class="flex flex-col gap-1">
                <p class={dataLabelSm}>
                  PROGRESS <span class={dataValueSm}>{progress}</span>
                  <span class="text-stamp-grey-light">%</span>
                </p>
                <div class="relative min-w-[144px] mobileLg:min-w-[192px] h-1 mobileLg:h-1.5 bg-[#999999] rounded-full">
                  <div
                    class="absolute left-0 top-0 h-1 mobileLg:h-1.5 bg-[#660099] rounded-full"
                    style={{ width: progressWidth }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {variant === "minting" && (
        <div class="flex flex-col gap-6 -mb-3 mobileLg:-mb-6 tablet:hidden">
          <div class="flex flex-col justify-center text-center -space-y-0.5">
            <p class={dataLabelSm}>
              SUPPLY{" "}
              <span class={dataValueSm}>
                {Number(src20.max).toLocaleString()}
              </span>
            </p>
            <p className={dataLabelSm}>
              HOLDERS{" "}
              <span className={dataValueSm}>
                {Number(src20.holders || 0).toLocaleString()}
              </span>
            </p>
            <p class={dataLabelSm}>
              TOP MINTS{" "}
              <span class={dataValueSm}>
                0
              </span>{" "}
              %
            </p>
          </div>
        </div>
      )}

      {/* Mint Button */}
      <Button
        variant="mint"
        onClick={handleMintClick}
        class={variant != "minting" ? "hidden min-[480px]:block" : ""}
      >
        MINT
      </Button>
    </SRC20BaseCard>
  );
}
