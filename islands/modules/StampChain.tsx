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
          Your premier destination for all things Bitcoin Stamps. As the OG
          resource, we offer unparalleled expertise and tools for the Stamps
          ecosystem.
        </p>
      </div>

      <div className="flex gap-3 mobileMd:gap-6 font-extrabold justify-end">
        <a
          href="/about/#donate"
          f-partial="/about/#donate"
          className={ModulesStyles.buttonGreyOutline}
        >
          DONATE
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
