import { ModulesStyles } from "$islands/modules/Styles.ts";

export const DeployMintModule = () => {
  return (
    <div class="
      grid grid-cols-1 tablet:grid-cols-3 gap-3 mobileLg:gap-6 items-end
      max-w-desktop w-full mx-auto
    ">
      <div class="col-span1 tablet:col-span-2">
        <h1 class={ModulesStyles.titleGreyDL}>
          DEPLOY
        </h1>
        <h2 class={ModulesStyles.subTitleGrey}>YOUR OWN TOKEN</h2>
        <p class={ModulesStyles.bodyTextLight}>
          Create or mint the most immutable fungible token with SRC-20. Built on
          top of the stamps meta-protocol SRC-20 tokens are built with Bitcoin.
        </p>
      </div>

      <div class="flex gap-3 mobileLg:gap-6 font-extrabold justify-end">
        <a
          href="/howto"
          f-partial="/howto"
          class={ModulesStyles.buttonGreyOutline + " !w-[114px]"}
        >
          HOW-TO
        </a>
        <a
          href="/stamping/src20/deploy"
          f-partial="/stamping/src20/deploy"
          class={ModulesStyles.buttonGreyFlat + " !w-[102px]"}
        >
          DEPLOY
        </a>
      </div>
    </div>
  );
};
