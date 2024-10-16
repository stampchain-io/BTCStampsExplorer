export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] via-[#999999] to-[#CCCCCC] text-left">
        FAQ
      </p>
      <p className="flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left text-3xl md:text-6xl font-extralight text-[#CCCCCC]">
        Let's Stamp!
      </p>

      <p className="text-[#999999] text-base md:text-2xl font-medium">
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

      <div className="flex justify-end md:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="border md:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] md:w-[84px] h-[36px] md:h-[48px] flex justify-center items-center"
        >
          FAQ
        </a>
      </div>
    </div>
  );
};
