import { ModulesStyles } from "$islands/modules/Styles.ts";
import { ReadAllButton } from "$components/shared/ReadAllButton.tsx";

export const HowToStampModule = () => {
  return (
    <div class="flex flex-col gap-3 mobileMd:gap-6">
      <div class="flex flex-col">
        <h1 class={ModulesStyles.titleGreyDL}>HOW-TO</h1>
        <h2 class={ModulesStyles.subTitleGrey}>STAMP ART</h2>
        <p class={ModulesStyles.bodyTextLight}>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              Click the <b>image icon</b>{" "}
              to upload your artwork in a supported format.
            </li>
            <li>
              <b>Editions</b> sets the amount of copies you want to create.
            </li>
            <li>
              Use the <b>toggle switch</b> to access advanced options.
            </li>
            <li>
              In the advanced options you can choose a custom name for your art.
              Select between a <b>custom CPID</b> or <b>posh name</b>{" "}
              with the toggle.
            </li>
            <li>
              The <b>lock button</b>{" "}
              is enabled by default, preventing future changes to the amount of
              editions.
            </li>
            <li>
              You can preview your art by clicking the <b>fullscreen button</b>.
            </li>
            <li>
              <b>Fee</b>{" "}
              displays the suggested amount, and you can adjust it with the
              slider.
            </li>
            <li>
              A fee <b>estimate</b>{" "}
              is displayed based on the current fee and transaction size.
            </li>
            <li>
              Accept the <b>terms and conditions</b> to enable the stamp button.
            </li>
            <li>
              The <b>stamp button</b>{" "}
              will submit your transaction with all the provided details.
            </li>
          </ul>
          <br />
          All related costs are listed under the <b>details</b> section. <br />
          Lowering the fee may delay your art being stamped.<br />
          Fees are displayed in BTC by default, but you can switch to USDT using
          the <b>toggle</b>.<br />
        </p>
      </div>
      <ReadAllButton href="/howto/stamp" />
    </div>
  );
};
