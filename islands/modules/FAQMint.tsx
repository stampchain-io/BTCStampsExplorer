export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-3xl tablet:text-6xl flex flex-col gray-gradient3 text-left">
        HOW-TO MINT A TOKEN
      </p>
      <p className="flex flex-col gray-gradient4 text-left text-2xl tablet:text-5xl font-extralight text-[#CCCCCC]">
        BASIC STEPS
      </p>

      <p className="text-[#999999] text-base tablet:text-lg font-medium">
        <ul className="list-decimal pl-5 space-y-2">
          <li>
            Start typing a <b>TOKEN</b>{"  "}
            name to filter and select the correct ticker.
          </li>
          <li>
            The ticker logo and name will be shown along with the maximum limit
            per mint.
          </li>
          <li>
            Double-check that the displayed information matches the ticker you
            wish to mint.
          </li>
          <li>
            <b>Fee</b>{" "}
            displays the suggested amount, which can be adjusted using the
            slider.{" "}
          </li>
          <li>
            Accept the <b>terms and conditions</b> to enable the mint button.
          </li>
          <li>
            The <b>mint</b>{"  "}
            button will submit your transaction with all the provided details.
          </li>
        </ul>
        <br />
        If the minting <b>progress</b>{"  "}
        is near 95%, be cautious as you risk losing your funds. <br />
        When a token is minted out, and progress has reached 100%, you will no
        longer be able to mint it.<br />
        Reducing the fee may slow down the minting process.<br />
        Fees are shown in BTC by default, but you can switch to USDT using the
        toggle.<br />
        <br />

        All related costs are listed in the <b>details</b> section.<br />
      </p>

      <div className="flex justify-end tablet:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="border tablet:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold text-sm tablet:text-base w-[63px] tablet:w-[84px] h-[36px] tablet:h-[48px] flex justify-center items-center"
        >
          READ ALL
        </a>
      </div>
    </div>
  );
};
