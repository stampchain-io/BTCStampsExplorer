import { ModulesStyles } from "$islands/modules/Styles.ts";

export const RecursiveLayeringModule = () => {
  return (
    <>
      <div class="flex flex-col mt-6 mobileLg:mt-12">
        <h2 class={ModulesStyles.subTitleGrey}>
          RECURSIVE LAYERING
        </h2>
        <div
          class={`grid grid-cols-1 tablet:grid-cols-2 gap-3 mobileLg:gap-6 ${ModulesStyles.bodyTextLight}`}
        >
          <p>
            <b>
              SRC-721r allows for recursive NFT creation
            </b>{" "}
            by leveraging multiple layers of data utilizing not just JSON, but
            also on-chain JS libraries to build complex recursion and on-chain
            web applications.<br />
            <br />
            Its structure maximizes cost efficiency, making it suitable for
            larger, more detailed and animated art collections.
          </p>
          <p>
            Get in contact with us if you're planning a large PFP collection or
            dreaming of complex multilayered art compositions.<br />
            <br />
            <b>
              We would love to get involved and can definitely help you out !
            </b>
          </p>
        </div>
      </div>
      <a
        href="/about#contact"
        f-partial="/about#contact"
        class={`${ModulesStyles.buttonGreyOutline} float-right mt-3 mobileMd:mt-6`}
      >
        CONTACT
      </a>
    </>
  );
};
