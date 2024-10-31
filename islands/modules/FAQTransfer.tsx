export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-3xl tablet:text-6xl flex flex-col gray-gradient3 text-left">
        HOW-TO TRANSFER
      </p>
      <p className="flex flex-col gray-gradient4 text-left text-2xl tablet:text-5xl font-extralight text-[#CCCCCC]">
        BASIC STEPS
      </p>

      <p className="text-[#999999] text-base tablet:text-lg font-medium">
        <ul className="list-decimal pl-5 space-y-2">
          <li>
            <b>Recepient address</b>{" "}
            must start with 1 if classic, or with bc1q if SegWit.
          </li>
          <li>
            Start typing the <b>token</b> to access to your list of tokens.
          </li>
          <li>
            Enter the <b>amount</b> of tokens that you want to transfer.
          </li>
          <li>
            Accept the <b>terms and conditions</b> to enable the <b>Transfer</b>
            {" "}
            button.
          </li>
          <li>
            Accept the <b>terms and conditions</b> to enable the STAMP button.
          </li>
          <li>
            The <b>Transfer</b>{" "}
            button will submit your transaction with all the provided
            information.
          </li>
        </ul>
        <br />
        All related costs are listed under the <b>DETAILS</b> section. <br />
        <b>FEES</b>{" "}
        shows the suggested amount, and you can adjust it with the slider.
        Lowering the fee may delay your art being stamped.<br />
        Fees are displayed in <b>BTC</b> by default, but you can switch to{" "}
        <b>USDT</b> using the <b>TOGGLE</b>.<br />
      </p>

      <div className="flex justify-end tablet:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="uppercase border tablet:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] tablet:w-[84px] h-[36px] tablet:h-[48px] flex justify-center items-center"
        >
          Read All
        </a>
      </div>
    </div>
  );
};
