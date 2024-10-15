export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] via-[#999999] to-[#CCCCCC] text-left">
       Mint
      </p>
      <p className="flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left text-3xl md:text-6xl font-extralight text-[#CCCCCC]">
        Fields and Options explanation
      </p>

      <p className="text-[#999999] text-base md:text-2xl font-medium">Start typing a token name to filter and select the correct ticker. The ticker logo and name will be shown along with the maximum limit per mint.
        Double-check that the displayed information matches the ticker you wish to mint.<br />
        If Progress is near 95%, be cautious as you risk losing funds. At 100% or above, your funds will be lost.<br />
        FEES displays the suggested amount, which can be adjusted using the slider. Reducing the fee may slow down the stamping process.<br />
        Fees are shown in BTC by default, but you can switch to USDT using the toggle.<br />
        All related costs are listed in the DETAILS section.<br />
        Accept the terms and conditions to enable the MINT button.<br />
        The MINT button will submit your transaction with all the provided details.<br />     
      </p>

      <div className="flex justify-end md:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="border md:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] md:w-[84px] h-[36px] md:h-[48px] flex justify-center items-center"
        >
          Step by step How to Mint
        </a>
      </div>
    </div>
  );
};
