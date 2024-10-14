export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] via-[#999999] to-[#CCCCCC] text-left">
        FAQ
      </p>
      <p className="flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left text-3xl md:text-6xl font-extralight text-[#CCCCCC]">
        Let's Deploy!
      </p>

      <p className="text-[#999999] text-base md:text-2xl font-medium">
        Click the icon to upload your ticker artwork in a supported format.
        The token ticker name must be unique and no longer than ## characters.
        Use the TOGGLE to switch between Simple and Expert modes to customize XXXXXXXXXXXXX.
        Supply defines the number of tokens, between # and ###########.
        Decimals specify how many decimal places your token will have (similar to Satoshis for Bitcoin).
        Limit per Mint sets the maximum number of tokens that can be minted in a single session.
        In the Description field, provide details on the token’s utility or purpose.
        Fill in additional token information, such as your website, X (Twitter) handle, email, and Telegram.
        FEES shows the suggested amount, adjustable via the slider. Lowering the fee might slow down the stamping process.
        Fees are displayed in BTC by default, but you can toggle to switch to USDT.
        All related costs are detailed in the DETAILS section.
        Accept the terms and conditions to activate the DEPLOY button.
        The DEPLOY button will submit your transaction with all the provided details.
                
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