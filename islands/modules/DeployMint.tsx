import { ModulesStyles } from "$islands/modules/Styles.ts";

export const DeployMintModule = () => {
  return (
    <div class="
      grid grid-cols-1 tablet:grid-cols-3 gap-3 mobileLg:gap-6 items-end
      max-w-desktop w-full mx-auto
    ">
      <div className="col-span1 tablet:col-span-2">
        <h1 className={ModulesStyles.title}>
          DEPLOY
        </h1>
        <h2 className={ModulesStyles.subTitle}>YOUR OWN TOKEN</h2>
        <p className={ModulesStyles.content}>
          Create or mint the most immutable fungible token with SRC-20. Built on
          top of the stamps meta-protocol SRC-20 tokens are built with Bitcoin.
        </p>
      </div>

      <div className="flex gap-3 mobileLg:gap-6 font-extrabold justify-end">
        <a
          href="/howto"
          f-partial="/howto"
          className={ModulesStyles.buttonType1 + " !w-[114px]"}
        >
          HOW-TO
        </a>
        <a
          href="/stamping/src20/deploy"
          f-partial="/stamping/src20/deploy"
          className={ModulesStyles.buttonType2 + " !w-[102px]"}
        >
          DEPLOY
        </a>
      </div>
    </div>
  );
};
