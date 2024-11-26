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

  return (
    <SRC20BaseCard {...props}>
      {variant !== "minting" && (
        <>
          {/* Holders & Deploy */}
          <div class="flex flex-col gap-6 -mb-[44px]">
            <div class={middleLayoutClassName + " tablet:hidden desktop:flex"}>
              <p class={defaultTextClassName}>
                HOLDERS{" "}
                <span class={boldTextClassName}>
                  {Number(src20.holders).toLocaleString()}
                </span>
              </p>
              <p class={defaultTextClassName}>
                DEPLOY{" "}
                <span class={boldTextClassName}>
                  {formatDate(new Date(src20.block_time), {
                    month: "short",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* Top Mints & Progress Bar */}
          <div class="flex flex-col gap-6 -mb-[20px]">
            <div class={middleLayoutClassName}>
              <p class={defaultTextClassName}>
                TOP MINTS <span class={boldTextClassName}>0</span>
                <span class="text-stamp-grey-light">%</span>
              </p>
              <div class="flex flex-col gap-1">
                <p class={defaultTextClassName}>
                  PROGRESS <span class={boldTextClassName}>{progress}</span>
                  <span class="text-stamp-grey-light">%</span>
                </p>
                <div class="hidden mobileLg:block min-w-[260px] h-1.5 bg-[#999999] relative rounded-full">
                  <div
                    class="absolute left-0 top-0 h-1.5 bg-[#660099] rounded-full"
                    style={{ width: progressWidth }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {variant === "minting" && (
        <div class="flex flex-col gap-6 -mb-[18px]">
          <div class={middleLayoutClassName + " desktop:hidden"}>
            <p class={defaultTextClassName}>
              SUPPLY{" "}
              <span class={boldTextClassName}>
                {Number(src20.max).toLocaleString()}
              </span>
            </p>
            <p className={defaultTextClassName}>
              HOLDERS{" "}
              <span className={boldTextClassName}>
                {Number(src20.holders || 0).toLocaleString()}
              </span>
            </p>
            <p class={defaultTextClassName}>
              TOP MINTS{" "}
              <span class={boldTextClassName}>
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
