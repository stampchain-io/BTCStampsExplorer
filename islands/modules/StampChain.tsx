import { ModulesStyles } from "$islands/modules/Styles.ts";

export const StampChainModule = () => {
  return (
    <div class="
      grid grid-cols-1 desktop:grid-cols-3 gap-3 mobileMd:gap-6 items-end
      max-w-desktop w-full mx-auto
    ">
      <div className="col-span1 desktop:col-span-2">
        <h1 className={ModulesStyles.titleGreyDL}>STAMPCHAIN</h1>
        <h2 className={ModulesStyles.subTitleGrey}>
          THE CREATORS OF BITCOIN STAMPS
        </h2>
        <p className={ModulesStyles.bodyTextLight}>
          <b>
            As the architects of the Bitcoin Stamps protocol, we've been at the
            forefront of the ecosystem since its inception.
          </b>{" "}
          Our platform combines deep technical expertise with user-friendly
          tools to help you create, collect, and trade Bitcoin Stamps with
          confidence.

          <br />
          <br />
          <b>We empower creators and collectors by:</b>
          <li>
            Providing battle-tested tools developed by the original Bitcoin
            Stamps team
          </li>
          <li>
            Maintaining the most comprehensive knowledge base for Stamps
            technology
          </li>
          {/* <li>Offering expert guidance on stamp creation, trading, and collection management</li> */}
        </p>
      </div>

      <div className="flex gap-3 mobileMd:gap-6 font-extrabold justify-end">
        <a
          href="/about/#contact"
          f-partial="/about/#contact"
          className={ModulesStyles.buttonGreyOutline}
        >
          CONTACT
        </a>
        <a
          href="/about"
          f-partial="/about"
          className={ModulesStyles.buttonGreyFlat}
        >
          ABOUT
        </a>
      </div>
    </div>
  );
};
