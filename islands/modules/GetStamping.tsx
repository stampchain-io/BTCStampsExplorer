import { ModulesStyles } from "$islands/modules/Styles.ts";
import { formatUSDValue } from "$lib/utils/formatUtils.ts";

interface GetStampingModuleProps {
  btcPrice: number;
  recommendedFee: number;
}

export const GetStampingModule = ({
  btcPrice = 0,
  recommendedFee = 0,
}: GetStampingModuleProps) => {
  console.log("GetStampingModule received:", { btcPrice, recommendedFee });

  const displayPrice = formatUSDValue(btcPrice).toLocaleString();
  const displayFee = typeof recommendedFee === "number" ? recommendedFee : "0";

  return (
    <div class="grid grid-cols-1 desktop:grid-cols-3 gap-3 mobileMd:gap-6 items-end max-w-desktop w-full mx-auto">
      <div className="col-span1 desktop:col-span-2">
        <h1 className={ModulesStyles.titleGreyDLClassName}>GET STAMPING</h1>
        <h2 className={ModulesStyles.subTitleGrey}>IMMORTALISE YOUR ART</h2>
        <p className={ModulesStyles.bodyTextLight}>
          <b>
            The Stampchain stamping machine has been revamped and refitted with
            sleek new naming features.
          </b>
          <br />
          <br />
          <b>
            Experience greater creative freedom and adorn your treasured art
            with fanciful letters and posh names.
          </b>
          <br />
          By leveraging Counterparty’s asset-naming system and handling the XCP
          fee, we’ve made it simple and smooth for you to create Posh stamps.
          <br />
          <br />
          <b>Wanna stay true to classic A grade numerics?</b>
          <br />
          No problem, we still offer random lucky numbers - or you can choose a
          custom CPID number for your stamp.<br />
          <br />
          Either way the stamping machine handles everything, from low-fi pixel
          art (png/jpg/gif) to hi-res vector art (svg/html) - up to a whooping
          65kB.<br />
          <br />
          <i>
            <b>Time to get stamping!</b>
          </i>
        </p>
      </div>

      <div className="flex flex-col gap-3 mobileMd:gap-6">
        <div className="flex gap-3 mobileMd:gap-6 font-extrabold justify-end">
          <a
            href="/faq"
            f-partial="/faq"
            className={ModulesStyles.buttonGreyOutline}
          >
            FAQ
          </a>
          <a
            href="/stamping/stamp"
            f-partial="/stamping/stamp"
            className={ModulesStyles.buttonGreyFlat}
          >
            STAMP
          </a>
        </div>
        <div className="flex gap-3 mobileMd:gap-6 justify-end text-base mobileLg:text-lg text-stamp-grey font-light">
          <p>
            <span className="text-stamp-grey-darker">
              FEE
            </span>&nbsp;<span className="font-medium">
              {displayFee}
            </span>{" "}
            SAT/vB
          </p>
          <p>
            <span className="text-stamp-grey-darker">
              BTC
            </span>&nbsp;<span className="font-medium">
              {displayPrice}
            </span>{" "}
            USD
          </p>
        </div>
      </div>
    </div>
  );
};
