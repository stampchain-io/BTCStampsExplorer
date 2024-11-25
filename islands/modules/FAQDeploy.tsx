import { ModulesStyles } from "$islands/modules/Styles.ts";
import { ReadAllButton } from "$components/shared/ReadAllButton.tsx";

export const FAQDeployModule = () => {
  return (
    <div class="flex flex-col gap-3 mobileMd:gap-6">
      <div class="flex flex-col">
        <h1 class={ModulesStyles.titleGreyDL}>HOW-TO</h1>
        <h2 class={ModulesStyles.subTitleGrey}>DEPLOY A TOKEN</h2>
        <p class={ModulesStyles.bodyTextLight}>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              Click the <b>image icon</b>{" "}
              to upload your ticker artwork in a supported format.
            </li>
            <li>
              The <b>token ticker name</b>{" "}
              must be unique and no longer than 5 characters, most emojis are
              also supported.
            </li>
            <li>
              <b>Supply</b>{" "}
              defines the number of tokens to be deployed. Must be between 1 and
              18,446,744,073,709,551,615 (commas not allowed).
            </li>
            <li>
              <b>Decimals</b>{" "}
              specify how many decimal places your token will have (similar to
              Satoshis for Bitcoin). Maximum is 18.
            </li>
            <li>
              <b>Limit per mint</b>{" "}
              sets the maximum number of tokens that can be minted in a single
              session.
            </li>
            <li>
              Use the <b>toggle switch</b> to access advanced options.
            </li>
            <li>
              The advanced features lets you provide more details on the token.
              In the{" "}
              <b>description field</b>, you can elaborate on the token’s utility
              or purpose.
            </li>
            <li>
              Fill in additional token information, such as your website, X
              (Twitter) handle, email, and Telegram.
            </li>
            <li>
              <b>Fee</b> shows the suggested amount, adjustable via the slider.
            </li>
            <li>
              An <b>estimate</b>{" "}
              is displayed based on the current fee and transaction size.
            </li>
            <li>
              Accept the <b>terms and conditions</b>{" "}
              to activate the deploy button.
            </li>
            <li>
              The <b>deploy button</b>{" "}
              will submit your transaction with all the provided details.
            </li>
          </ul>
          <br />
          Reducing the fee may slow down the deployment process.<br />
          Fees are shown in BTC by default, but you can switch to USDT using the
          toggle.<br />
          All related costs are listed in the <b>details</b> section.
        </p>
      </div>
      <ReadAllButton />
    </div>
  );
};
