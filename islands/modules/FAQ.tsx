export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-4xl tablet:text-7xl flex flex-col gray-gradient3 text-left">
        FAQ
      </p>
      <p className="flex flex-col gray-gradient4 text-left text-3xl tablet:text-6xl font-extralight text-[#CCCCCC]">
        Let's Stamp!
      </p>

      <p className="text-[#999999] text-base tablet:text-2xl font-medium">
        Click the icon to upload your artwork in a supported format. Use the
        TOGGLE to switch between CLASSIC and POSH Art, and add a STAMP NAME.
        EDITIONS sets the number of copies you want to create. The LOCK icon is
        enabled by default, preventing future changes to the EDITIONS. FEES
        shows the suggested amount, and you can adjust it with the slider.
        Lowering the fee may delay your art being stamped. Fees are displayed in
        BTC by default, but you can switch to USDT using the TOGGLE. All related
        costs are listed under the DETAILS section. Accept the terms and
        conditions to enable the STAMP button. The STAMP button will submit your
        transaction with all the provided information.
      </p>

      <div className="flex justify-end tablet:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="border tablet:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] tablet:w-[84px] h-[36px] tablet:h-[48px] flex justify-center items-center"
        >
          FAQ
        </a>
      </div>
    </div>
  );
};
