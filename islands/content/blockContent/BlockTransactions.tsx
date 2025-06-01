/* ===== BLOCK TRANSACTIONS COMPONENT ===== */
import { useState } from "preact/hooks";
import { useFees } from "$fees";
import { containerBackground } from "$layout";
import { text, text2xl } from "$text";

/* ===== MAIN COMPONENT ===== */
export default function BlockTransactions() {
  /* ===== HOOKS ===== */
  const { fees } = useFees();

  /* ===== STATE ===== */
  const [isExpanded, setIsExpanded] = useState(true);

  /* ===== EVENT HANDLERS ===== */
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  /* ===== RENDER ===== */
  return (
    <div
      class={`${containerBackground} text-stamp-grey-light gap-6 transition-all`}
    >
      {/* ===== HEADER SECTION ===== */}
      <div className="flex justify-between">
        <h4 className={text2xl}>TRANSACTIONS</h4>
        <div className="flex items-center gap-3">
          <h6 className={text}>EXPAND</h6>
          <img
            src="/img/icon_arrow_top.png"
            alt=""
            className={`w-8 h-4 cursor-pointer ${
              isExpanded ? "" : "rotate-180"
            }`}
            onClick={() => handleExpand()}
          />
        </div>
      </div>

      {/* ===== EXPANDED CONTENT ===== */}
      {isExpanded && (
        <div className="flex flex-col tablet:flex-row justify-between items-stretch gap-5">
          {/* ===== TRANSACTION FEES SECTION ===== */}
          <div className="flex flex-col items-center gap-5">
            {/* Transaction Fee Blocks */}
            <div className="flex gap-[10px]">
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
            </div>
            <p className="text-center text-[#6E6E6E]">Transaction Fees</p>

            {/* ===== FEE PRIORITY GRID ===== */}
            <div className="bg-[#1B1D2B] py-2 tablet:py-4 px-3 tablet:px-6 w-full">
              <div className="grid grid-cols-2 tablet:grid-cols-4 gap-y-5">
                {/* No Priority */}
                <div className="md:mr-5">
                  <p className="bg-[#587206] min-w-[120px] py-1 text-center mb-5">
                    No Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">
                        {fees?.minimumFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$0.58</p>
                  </div>
                </div>
                {/* Low Priority */}
                <div>
                  <p className="bg-gradient-to-r from-[#597206] to-[#6F7209] min-w-[120px] py-1 text-center mb-5">
                    Low Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">
                        {fees?.hourFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$2.53</p>
                  </div>
                </div>
                {/* Medium Priority */}
                <div>
                  <p className="bg-gradient-to-r from-[#6F7209] to-[#85720D] min-w-[120px] py-1 text-center mb-5">
                    Medium Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">
                        {fees?.halfHourFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$2.63</p>
                  </div>
                </div>
                {/* High Priority */}
                <div>
                  <p className="bg-gradient-to-r from-[#85720D] to-[#9C7210] min-w-[120px] py-1 text-center mb-5 rounded-r-full">
                    High Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">
                        {fees?.fastestFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$2.72</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== DIVIDER ===== */}
          <div className="border border-dashed"></div>

          {/* ===== DIFFICULTY ADJUSTMENT SECTION ===== */}
          <div className="flex flex-col items-center gap-5">
            {/* Difficulty Blocks */}
            <div className="flex gap-[10px]">
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
            </div>

            {/* ===== DIFFICULTY LABELS ===== */}
            <div className="flex flex-col tablet:flex-row justify-between items-center w-full">
              <p className="hidden tablet:block invisible text-xs">
                difficulty | <span className="text-[#8434F0]">halving</span>
              </p>
              <p className="text-[#6E6E6E]">Difficulty adjustment</p>
              <p className="text-[#6E6E6E] text-xs">
                difficulty | <span className="text-[#8434F0]">halving</span>
              </p>
            </div>

            {/* ===== DIFFICULTY STATS ===== */}
            <div className="bg-[#1B1D2B] py-2 tablet:py-4 px-3 tablet:px-6 w-full">
              {/* Progress Bar */}
              <div className="flex mb-5">
                <div className="bg-[#254FB3] w-[200px] h-8">
                </div>
                <div className="bg-[#19892F] w-[20px] h-8">
                </div>
                <div className="w-full h-8 bg-[#282D3F]">
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex justify-between gap-2">
                {/* Block Time */}
                <div>
                  <p className="text-sm tablet:text-2xl text-center">
                    ~9.4 minutes
                  </p>
                  <p className="text-[#6E6E6E] text-xs tablet:text-base text-center">
                    Average block time
                  </p>
                </div>
                {/* Percentage Change */}
                <div>
                  <p className="text-sm tablet:text-2xl text-center">
                    <span className="text-[#34C440]">&#9652; 6.67</span> %
                  </p>
                  <p className="text-[#6E6E6E] text-xs tablet:text-base text-center">
                    Previous:{" "}
                    <span className="text-[#C82D3A]">&#9662; 0.79</span> %
                  </p>
                </div>
                {/* Next Adjustment */}
                <div>
                  <p className="text-sm tablet:text-2xl text-center">
                    In ~9 days
                  </p>
                  <p className="text-[#6E6E6E] text-xs tablet:text-base text-center">
                    June 19 at 2:38 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
