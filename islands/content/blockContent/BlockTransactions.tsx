/* ===== BLOCK TRANSACTIONS COMPONENT ===== */
import { useState } from "preact/hooks";
import { useFees } from "$fees";
import { containerBackground } from "$layout";
import { text, text2xl } from "$text";
import { Icon } from "$icon";

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
      <div class="flex justify-between">
        <h4 class={text2xl}>TRANSACTIONS</h4>
        <div class="flex items-center gap-3">
          <h6 class={text}>EXPAND</h6>
          <Icon
            type="icon"
            name="caretUp"
            size="md"
            color="purple"
            weight="normal"
            className={`cursor-pointer ${isExpanded ? "" : "rotate-180"}`}
            onClick={() => handleExpand()}
          />
        </div>
      </div>

      {/* ===== EXPANDED CONTENT ===== */}
      {isExpanded && (
        <div class="flex flex-col tablet:flex-row justify-between items-stretch gap-5">
          {/* ===== TRANSACTION FEES SECTION ===== */}
          <div class="flex flex-col items-center gap-5">
            {/* Transaction Fee Blocks */}
            <div class="flex gap-[10px]">
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#986F10]" />
            </div>
            <p class="text-center text-[#6E6E6E]">Transaction Fees</p>

            {/* ===== FEE PRIORITY GRID ===== */}
            <div class="bg-[#1B1D2B] py-2 tablet:py-4 px-3 tablet:px-6 w-full">
              <div class="grid grid-cols-2 tablet:grid-cols-4 gap-y-5">
                {/* No Priority */}
                <div class="md:mr-5">
                  <p class="bg-[#587206] min-w-[120px] py-1 text-center mb-5">
                    No Priority
                  </p>
                  <div class="text-center flex flex-col items-center">
                    <p class="text-[#6E6E6E]">
                      <span class="text-2xl text-white">
                        {fees?.minimumFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr class="border-[#6E6E6E] w-[80px]" />
                    <p class="text-[#2E9C3B]">$0.58</p>
                  </div>
                </div>
                {/* Low Priority */}
                <div>
                  <p class="bg-gradient-to-r from-[#597206] to-[#6F7209] min-w-[120px] py-1 text-center mb-5">
                    Low Priority
                  </p>
                  <div class="text-center flex flex-col items-center">
                    <p class="text-[#6E6E6E]">
                      <span class="text-2xl text-white">
                        {fees?.hourFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr class="border-[#6E6E6E] w-[80px]" />
                    <p class="text-[#2E9C3B]">$2.53</p>
                  </div>
                </div>
                {/* Medium Priority */}
                <div>
                  <p class="bg-gradient-to-r from-[#6F7209] to-[#85720D] min-w-[120px] py-1 text-center mb-5">
                    Medium Priority
                  </p>
                  <div class="text-center flex flex-col items-center">
                    <p class="text-[#6E6E6E]">
                      <span class="text-2xl text-white">
                        {fees?.halfHourFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr class="border-[#6E6E6E] w-[80px]" />
                    <p class="text-[#2E9C3B]">$2.63</p>
                  </div>
                </div>
                {/* High Priority */}
                <div>
                  <p class="bg-gradient-to-r from-[#85720D] to-[#9C7210] min-w-[120px] py-1 text-center mb-5 rounded-r-full">
                    High Priority
                  </p>
                  <div class="text-center flex flex-col items-center">
                    <p class="text-[#6E6E6E]">
                      <span class="text-2xl text-white">
                        {fees?.fastestFee}
                      </span>{" "}
                      sat/vB
                    </p>
                    <hr class="border-[#6E6E6E] w-[80px]" />
                    <p class="text-[#2E9C3B]">$2.72</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== DIVIDER ===== */}
          <div class="border border-dashed"></div>

          {/* ===== DIFFICULTY ADJUSTMENT SECTION ===== */}
          <div class="flex flex-col items-center gap-5">
            {/* Difficulty Blocks */}
            <div class="flex gap-[10px]">
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
              <div class="w-[40px] tablet:w-[80px] h-[40px] tablet:h-[80px] bg-[#8434F0]" />
            </div>

            {/* ===== DIFFICULTY LABELS ===== */}
            <div class="flex flex-col tablet:flex-row justify-between items-center w-full">
              <p class="hidden tablet:block invisible text-xs">
                difficulty | <span class="text-[#8434F0]">halving</span>
              </p>
              <p class="text-[#6E6E6E]">Difficulty adjustment</p>
              <p class="text-[#6E6E6E] text-xs">
                difficulty | <span class="text-[#8434F0]">halving</span>
              </p>
            </div>

            {/* ===== DIFFICULTY STATS ===== */}
            <div class="bg-[#1B1D2B] py-2 tablet:py-4 px-3 tablet:px-6 w-full">
              {/* Progress Bar */}
              <div class="flex mb-5">
                <div class="bg-[#254FB3] w-[200px] h-8">
                </div>
                <div class="bg-[#19892F] w-[20px] h-8">
                </div>
                <div class="w-full h-8 bg-[#282D3F]">
                </div>
              </div>

              {/* Stats Grid */}
              <div class="flex justify-between gap-2">
                {/* Block Time */}
                <div>
                  <p class="text-sm tablet:text-2xl text-center">
                    ~9.4 minutes
                  </p>
                  <p class="text-[#6E6E6E] text-xs tablet:text-base text-center">
                    Average block time
                  </p>
                </div>
                {/* Percentage Change */}
                <div>
                  <p class="text-sm tablet:text-2xl text-center">
                    <span class="text-[#34C440]">&#9652; 6.67</span> %
                  </p>
                  <p class="text-[#6E6E6E] text-xs tablet:text-base text-center">
                    Previous: <span class="text-[#C82D3A]">&#9662; 0.79</span> %
                  </p>
                </div>
                {/* Next Adjustment */}
                <div>
                  <p class="text-sm tablet:text-2xl text-center">
                    In ~9 days
                  </p>
                  <p class="text-[#6E6E6E] text-xs tablet:text-base text-center">
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
