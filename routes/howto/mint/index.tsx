export default function HowTo() {
  return (
    <div className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 tablet:mt-5">
      <div className="max-w-[1080px] w-full mx-auto flex flex-col gap-12">
        <section>
          <h1 className="gray-gradient3 text-6xl font-black">HOW-TO</h1>
          <h2 className="text-2xl tablet:text-5xl font-extralight mb-3">
            MINT A SRC-20 TOKEN
          </h2>
          <img
            src="/img/how-tos/mintsrc20/00.png"
            width="1020px"
            alt="Screenshot"
          />
          <p className="mb-12">
            SRC-20 is a fungible token protocol that records transactions
            directly on the Bitcoin blockchain. In this guide, you'll learn how
            to mint your own SRC-20 token!
            <br /> <br />
            Note: Before starting, please ensure that your wallet is connected
            to stampchain.io and has sufficient funds.
          </p>
          <br />
          <h2 className="text-2xl md:text-5xl font-extralight">
            <ul className="list-decimal pl-5 space-y-2">
              <li>
                <section className="flex flex-col gap-3">
                  NAVIGATE TO MINT <br />

                  <img
                    src="/img/how-tos/mintsrc20/01.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
                    Go to the main menu at the top right and click on MINT
                    option.<br /> <br />
                  </p>
                </section>
              </li>
              <li>
                <section className="flex flex-col gap-3">
                  COMPLETE THE INFORMATION <br />

                  <img
                    src="/img/how-tos/mintsrc20/00.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-1">
                    Click the icon to upload your ticker artwork in a supported
                    format. The size must be 420x420 pixels<br />
                    <br />
                    The token ticker name must be unique and no longer than 5
                    characters.<br />
                    <br />
                    Use the TOGGLE to switch between Simple and Expert modes to
                    customize XXXXXXXXXXXXX.<br />
                    <br />
                    Supply defines the number of tokens, between # and
                    ###########.<br />
                    <br />
                    Decimals specify how many decimal places your token will
                    have (similar to Satoshis for Bitcoin).<br />
                    <br />
                    Limit per Mint sets the maximum number of tokens that can be
                    minted in a single session.<br />
                    <br />
                    In the Description field, provide details on the token’s
                    utility or purpose.<br />
                    <br />
                    Fill in additional token information, such as your website,
                    X (Twitter) handle, email, and Telegram.<br />
                    <br />
                    FEES shows the suggested amount, adjustable via the
                    slider.<br />

                    All related costs are detailed in the DETAILS section.<br />
                    Accept the terms and conditions to activate the DEPLOY
                    button.<br />

                    DEPLOY button will submit your transaction with all the
                    provided details.<br />
                    <br />
                    <br />
                  </p>
                </section>
              </li>
              <li>
                <section className="flex flex-col gap-3">
                  CHECK THE INFORMATION<br />

                  <img
                    src="/img/how-tos/mintsrc20/00.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
                    Check that all the informatiom is correct.<br /> <br />
                    <br />
                  </p>
                </section>
              </li>
              <li>
                <section className="flex flex-col gap-3">
                  CONFIRM TRANSACTION <br />

                  <img
                    src="/img/how-tos/deploy/01.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
                    Your wallet will pop up and you have to sign for the
                    transaction.<br /> <br />
                  </p>
                </section>
              </li>
            </ul>
          </h2>
          <br />
          <b>IMPORTANT:</b>
          <br />
          Lowering the fee might slow down the stamping process.<br />
          Fees are displayed in BTC by default, but you can toggle to switch to
          USDT.<br />
          <br /> <br />
        </section>
      </div>
      <section className="mt-24">
        <h1 className="gray-gradient3 text-4xl tablet:text-5xl desktop:text-6xl font-black">
          KEEP READING
        </h1>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl tablet:text-5xl font-extralight">HOW-TO</h2>
            {ARTICLE_LINKS.map(({ title, href }) => (
              <a
                key={`${title}-${href}`}
                href={href}
                f-partial={href}
                className="block gray-gradient3 text-xl tablet:text-2xl font-bold"
              >
                {title}
              </a>
            ))}
          </div>
          <div className="flex flex-col tablet:items-end tablet:text-right">
            <h2 className="text-2xl tablet:text-5xl font-extralight">FAQ</h2>
            <p>
              All you ever wanted to know about the Bitcoin Stamps protocol and
              stuff you never thought you needed to know.
            </p>
            <div className="w-full flex justify-end">
              <a
                href="/faq"
                f-partial="/faq"
                className="float-right border-2 border-[#999999] text-[#999999] w-[78px] h-[48px] flex justify-center items-center rounded-md"
              >
                FAQ
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
