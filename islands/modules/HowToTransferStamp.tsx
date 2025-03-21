import { ReadAllButton } from "$components/buttons/ReadAllButton.tsx";
import { subtitleGrey, text, titleGreyDL } from "$text";

export const HowToTransferStampModule = () => {
  return (
    <div class="flex flex-col gap-3 mobileMd:gap-6">
      <div class="flex flex-col">
        <h1 class={titleGreyDL}>HOW-TO</h1>
        <h2 class={subtitleGrey}>TRANSFER A STAMP</h2>
        <p class={text}>
          <ul class="list-disc pl-5 space-y-2">
            <li>
              The Bitcoin <b>recepient address</b>{" "}
              must start with 1 if classic, or with bc1q if SegWit.
            </li>
            <li>
              Start typing the <b>token name</b>{" "}
              to access to your list of tokens.
            </li>
            <li>
              Enter the <b>amount</b> of tokens that you want to transfer.
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
              Accept the <b>terms and conditions</b> to enable the{" "}
              <b>transfer</b> button.
            </li>
            <li>
              The <b>transfer</b>{" "}
              button will submit your transaction with all the provided
              information.
            </li>
          </ul>
        </p>
        <p class={text}>
          All related costs are listed under the <b>details</b> section. <br />
          Lowering the fee may delay your art being stamped.<br />
          Fees are displayed in BTC by default, but you can switch to USDT using
          the <b>toggle</b>.<br />
        </p>
      </div>
      <ReadAllButton href="/howto/transferstamp" />
    </div>
  );
};
