import { ModulesStyles } from "$islands/modules/Styles.ts";

export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-3 mobileMd:gap-6">
      <div className="flex flex-col">
        <h1 className={ModulesStyles.titleGreyDL}>HOW-TO</h1>
        <h2 className={ModulesStyles.subTitleGrey}>MINT A TOKEN</h2>
        <p className={ModulesStyles.bodyTextLight}>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Start typing a <b>TOKEN</b>{"  "}
              name to filter and select the correct ticker.
            </li>
            <li>
              The ticker logo and name will be shown along with the maximum
              limit per mint.
            </li>
            <li>
              Double-check that the displayed information matches the ticker you
              wish to mint.
            </li>
            <li>
              <b>Fee</b>{" "}
              displays the suggested amount, which can be adjusted using the
              slider.{" "}
            </li>
            <li>
              Accept the <b>terms and conditions</b> to enable the mint button.
            </li>
            <li>
              The <b>mint</b>{"  "}
              button will submit your transaction with all the provided details.
            </li>
          </ul>
          <br />
          If the minting <b>progress</b>{"  "}
          is near 95%, be cautious as you risk losing your funds. <br />
          When a token is minted out, and progress has reached 100%, you will no
          longer be able to mint it.<br />
          Reducing the fee may slow down the minting process.<br />
          Fees are shown in BTC by default, but you can switch to USDT using the
          toggle.<br />
          <br />

          All related costs are listed in the <b>details</b> section.<br />
        </p>
      </div>
      <div className="flex justify-end tablet:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className={ModulesStyles.buttonGreyOutline}
        >
          READ ALL
        </a>
      </div>
    </div>
  );
};
