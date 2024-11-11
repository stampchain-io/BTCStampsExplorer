import { ModulesStyles } from "$islands/modules/Styles.ts";

export const GetStampingModule = () => {
  return (
    <div class="
      grid grid-cols-1 desktop:grid-cols-3 gap-3 mobileLg:gap-6 items-end
      max-w-desktop w-full mx-auto
    ">
      <div className="col-span1 desktop:col-span-2">
        <h1 className={ModulesStyles.title}>GET STAMPING</h1>
        <h2 className={ModulesStyles.subTitle}>IMMORTALISE YOUR ART</h2>
        <p className={ModulesStyles.content}>
          Effortlessly create immutableBitcoin Stamps with custom fee selection
          and optional Posh Stamp Collection naming options. Supports low-fi
          pixel art (png/jpg/gif) and hi-res vector art (svg/html) up to 64kB.
          Explore SRC-721R for recursive stamps with unlimited size constraints.
        </p>
      </div>

      <div className="flex flex-col gap-3 mobileLg:gap-6">
        <div className="flex gap-3 mobileLg:gap-6 font-extrabold justify-end">
          <a
            href="/faq"
            f-partial="/faq"
            className={ModulesStyles.buttonType1 + " !w-[78px]"}
          >
            FAQ
          </a>
          <a
            href="/stamping/stamp"
            f-partial="/stamping/stamp"
            className={ModulesStyles.buttonType2}
          >
            STAMP
          </a>
        </div>
        <div className="flex gap-3 mobileLg:gap-6 justify-end text-lg text-stamp-grey font-light">
          <p>
            <span className="text-stamp-grey-darker">
              FEE
            </span>&nbsp;<span className="font-medium">6</span> SAT/vB
          </p>
          <p>
            <span className="text-stamp-grey-darker">
              BTC
            </span>&nbsp;<span className="font-medium">69,420</span> USD
          </p>
        </div>
      </div>
    </div>
  );
};
