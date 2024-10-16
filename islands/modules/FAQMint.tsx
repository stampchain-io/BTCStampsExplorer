export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] via-[#999999] to-[#CCCCCC] text-left">
       HOW-TO
      </p>
      <p className="flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left text-3xl md:text-6xl font-extralight text-[#CCCCCC]">
        MINT
      </p>

<p className="text-[#999999] text-sm md:text-lg font-medium">
    Start typing a <b>token</b> name to filter and select the correct ticker.<br />
    The ticker logo and name will be shown along with the maximum limit per mint. <br />
    Double-check that the displayed information matches the ticker you wish to mint.<br /><br />

    If the minting <b>progress</b> is near 95%, be cautious as you risk losing your funds. <br />
    When a token is minted out, and progress has reached 100%, you will no longer be able to mint it.<br />

    <b>Fee</b> displays the suggested amount, which can be adjusted using the slider. <br />
    Reducing the fee may slow down the minting process.<br />
    Fees are shown in BTC by default, but you can switch to USDT using the toggle.<br /><br />

    All related costs are listed in the <b>details</b> section.<br /><br />

    Accept the <b>terms and conditions</b> to enable the mint button.<br /><br />

    The <b>mint<b> button will submit your transaction with all the provided details. 
</p>

      <div className="flex justify-end md:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="border md:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] md:w-[84px] h-[36px] md:h-[48px] flex justify-center items-center"
        >
          READ ALL
        </a>
      </div>
    </div>
  );
};
