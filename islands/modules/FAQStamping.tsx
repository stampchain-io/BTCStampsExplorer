import { ReadAllButton } from "$components/shared/ReadAllButton.tsx";

export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-3xl tablet:text-6xl flex flex-col gray-gradient3 text-left">
        HOW-TO STAMP ART
      </p>
      <p className="flex flex-col gray-gradient4 text-left text-2xl tablet:text-5xl font-extralight text-[#CCCCCC]">
        BASIC STEPS
      </p>

      <p className="text-[#999999] text-base tablet:text-lg font-medium">
        <ul className="list-decimal pl-5 space-y-2">
          <li>
            Click the <b>icon</b> to upload your artwork in a supported format.
          </li>
          <li>
            Use the <b>TOGGLE</b> to switch between <b>CLASSIC</b> and{" "}
            <b>POSH</b> Art, and add a <b>STAMP NAME</b>.
          </li>
          <li>
            <b>EDITIONS</b> sets the number of copies you want to create.
          </li>
          <li>
            The <b>LOCK</b>{" "}
            icon is enabled by default, preventing future changes to the
            EDITIONS.
          </li>
          <li>
            <b>FEES</b>{" "}
            shows the suggested amount, and you can adjust it with the slider.
          </li>
          <li>
            Accept the <b>terms and conditions</b> to enable the STAMP button.
          </li>
          <li>
            The <b>STAMP</b>{" "}
            button will submit your transaction with all the provided details.
          </li>
        </ul>
        <br />
        All related costs are listed under the <b>DETAILS</b> section. <br />
        Lowering the fee may delay your art being stamped.<br />
        Fees are displayed in BTC by default, but you can switch to USDT using
        the <b>TOGGLE</b>.<br />
      </p>

      <ReadAllButton />
    </div>
  );
};
