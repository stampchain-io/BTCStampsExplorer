import { ModulesStyles } from "$islands/modules/Styles.ts";

export const NamedAssetsModule = () => {
  return (
    <>
      <div class="flex flex-col mt-6 mobileLg:mt-12">
        <h2 class={ModulesStyles.subTitleGrey}>
          NAMED ASSETS
        </h2>
        <div
          class={`grid grid-cols-1 tablet:grid-cols-2 gap-3 mobileLg:gap-6 ${ModulesStyles.bodyTextLight}`}
        >
          <p>
            Posh stamps are an advanced version of cursed stamps integrated with
            the Counterparty asset-naming system.<br />
            <br />
            While they require additional steps to acquire XCP to conform to the
            Counterparty Meta-Protocol rules,{" "}
            <span class="font-bold">
              this allows artists to create a vanity name on-chain for their
              stamps and collections.
            </span>
          </p>
          <p>
            <span class="font-bold">
              With the Stampchain stamping tool we've made it smooth and
              frictionless to create Posh stamps.
            </span>
            <br />
            We handle the XCP fee and you pay in BTC.<br />
            <br />
            Your most treasured art can now have unique names, instead of just
            arbitrary numbers.
          </p>
        </div>
      </div>
      <a
        href="/stamping/stamp"
        f-partial="/stamping/stamp"
        class={`${ModulesStyles.buttonGreyFlat} float-right w-[96px]`}
      >
        STAMP
      </a>
    </>
  );
};
