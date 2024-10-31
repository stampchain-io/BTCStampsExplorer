export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-3xl md:text-6xl flex flex-col gray-gradient3 text-left">
        HOW-TO DEPLOY A TOKEN
      </p>
      <p className="flex flex-col gray-gradient4 text-left text-2xl md:text-5xl font-extralight text-[#CCCCCC]">
        BASIC STEPS
      </p>

      <p className="text-[#999999] text-base md:text-lg font-medium">
        <ul className="list-decimal pl-5 space-y-2">
          <li>
            Click the icon to upload your ticker artwork in a supported format.
          </li>
          <li>
            The token ticker name must be unique and no longer than ##
            characters.
          </li>
          <li>
            Use the TOGGLE to switch between Simple and Expert modes to
            customize XXXXXXXXXXXXX.
          </li>
          <li>
            Supply defines the number of tokens, between # and ###########.
          </li>
          <li>
            Decimals specify how many decimal places your token will have
            (similar to Satoshis for Bitcoin).
          </li>
          <li>
            The <b>mint</b>{"  "}
            button will submit your transaction with all the provided details.
          </li>
          <li>
            Limit per Mint sets the maximum number of tokens that can be minted
            in a single session.
          </li>
          <li>
            In the Description field, provide details on the token’s utility or
            purpose.
          </li>
          <li>
            Fill in additional token information, such as your website, X
            (Twitter) handle, email, and Telegram.
          </li>
          <li>
            FEES shows the suggested amount, adjustable via the slider. Lowering
            the fee might slow down the deployment process.
          </li>
          <li>
            Accept the terms and conditions to activate the DEPLOY button.
          </li>
          <li>
            DEPLOY button will submit your transaction with all the provided
            details.
          </li>
        </ul>
        <br />
        Reducing the fee may slow down the minting process.<br />
        Fees are shown in BTC by default, but you can switch to USDT using the
        toggle.<br />
        All related costs are listed in the <b>details</b> section.
      </p>

      <div className="flex justify-end md:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="uppercase border md:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] md:w-[84px] h-[36px] md:h-[48px] flex justify-center items-center"
        >
          Read All
        </a>
      </div>
    </div>
  );
};
