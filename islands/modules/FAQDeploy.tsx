export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-4xl md:text-7xl flex flex-col gray-gradient3 text-left">
        How to
      </p>
      <p className="flex flex-col gray-gradient4 text-left text-3xl md:text-6xl font-extralight text-[#CCCCCC]">
        Deploy
      </p>

      <p className="text-[#999999] text-base md:text-2xl font-medium">
        Click the icon to upload your ticker artwork in a supported
        format.<br />
        The token ticker name must be unique and no longer than ##
        characters.<br />
        Use the TOGGLE to switch between Simple and Expert modes to customize
        XXXXXXXXXXXXX.<br />
        Supply defines the number of tokens, between # and ###########.<br />
        Decimals specify how many decimal places your token will have (similar
        to Satoshis for Bitcoin).<br />
        Limit per Mint sets the maximum number of tokens that can be minted in a
        single session.<br />
        In the Description field, provide details on the token’s utility or
        purpose.<br />
        Fill in additional token information, such as your website, X (Twitter)
        handle, email, and Telegram.<br />
        FEES shows the suggested amount, adjustable via the slider. Lowering the
        fee might slow down the stamping process.<br />
        Fees are displayed in BTC by default, but you can toggle to switch to
        USDT.<br />
        All related costs are detailed in the DETAILS section.<br />
        Accept the terms and conditions to activate the DEPLOY button.<br />
        The DEPLOY button will submit your transaction with all the provided
        details.<br />
      </p>

      <div className="flex justify-end md:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="border md:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] md:w-[84px] h-[36px] md:h-[48px] flex justify-center items-center"
        >
          How to Deploy
        </a>
      </div>
    </div>
  );
};
