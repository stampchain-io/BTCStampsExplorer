import { useEffect, useState } from "preact/hooks";

export default function BlockTransactions() {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div class="text-[#D9D9D9] flex flex-col gap-8 bg-[#2B183F] p-2 md:p-5 transition-all">
      <div className="flex justify-between">
        <p className="text-[26px]">Transactions</p>
        <div className="flex items-center gap-3">
          <p>Expand</p>
          <img
            src="/img/icon_arrow_top.png"
            alt=""
            className={`w-10 h-5 cursor-pointer ${
              isExpanded ? "" : "rotate-180"
            }`}
            onClick={() => handleExpand()}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="flex flex-col md:flex-row justify-between items-stretch gap-5">
          <div className="flex flex-col items-center gap-5">
            <div className="flex gap-[10px]">
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#986F10]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#986F10]" />
            </div>
            <p className="text-center text-[#6E6E6E]">Transaction Fees</p>
            <div className="bg-[#1B1D2B] py-2 md:py-4 px-3 md:px-6 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5">
                <div className="md:mr-5">
                  <p className="bg-[#587206] min-w-[120px] py-1 text-center mb-5">
                    No Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">6</span> sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$0.58</p>
                  </div>
                </div>
                <div>
                  <p className="bg-gradient-to-r from-[#597206] to-[#6F7209] min-w-[120px] py-1 text-center mb-5">
                    Low Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">26</span> sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$2.53</p>
                  </div>
                </div>
                <div>
                  <p className="bg-gradient-to-r from-[#6F7209] to-[#85720D] min-w-[120px] py-1 text-center mb-5">
                    Medium Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">27</span> sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$2.63</p>
                  </div>
                </div>
                <div>
                  <p className="bg-gradient-to-r from-[#85720D] to-[#9C7210] min-w-[120px] py-1 text-center mb-5 rounded-r-full">
                    High Priority
                  </p>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-[#6E6E6E]">
                      <span className="text-2xl text-white">28</span> sat/vB
                    </p>
                    <hr className="border-[#6E6E6E] w-[80px]" />
                    <p className="text-[#2E9C3B]">$2.72</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-dashed"></div>
          <div className="flex flex-col items-center gap-5">
            <div className="flex gap-[10px]">
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#8434F0]" />
              <div className="w-[40px] md:w-[80px] h-[40px] md:h-[80px] bg-[#8434F0]" />
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center w-full">
              <p className="hidden md:block invisible text-xs">
                difficulty | <span className="text-[#8434F0]">halving</span>
              </p>
              <p className="text-[#6E6E6E]">Difficulty adjustment</p>
              <p className="text-[#6E6E6E] text-xs">
                difficulty | <span className="text-[#8434F0]">halving</span>
              </p>
            </div>
            <div className="bg-[#1B1D2B] py-2 md:py-4 px-3 md:px-6 w-full">
              <div className="flex mb-5">
                <div className="bg-[#254FB3] w-[200px] h-8">
                </div>
                <div className="bg-[#19892F] w-[20px] h-8">
                </div>
                <div className="w-full h-8 bg-[#282D3F]">
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <div>
                  <p className="text-sm md:text-2xl text-center">
                    ~9.4 minutes
                  </p>
                  <p className="text-[#6E6E6E] text-xs md:text-base text-center">
                    Average block time
                  </p>
                </div>
                <div>
                  <p className="text-sm md:text-2xl text-center">
                    <span className="text-[#34C440]">&#9652; 6.67</span> %
                  </p>
                  <p className="text-[#6E6E6E] text-xs md:text-base text-center">
                    Previous:{" "}
                    <span className="text-[#C82D3A]">&#9662; 0.79</span> %
                  </p>
                </div>
                <div>
                  <p className="text-sm md:text-2xl text-center">In ~9 days</p>
                  <p className="text-[#6E6E6E] text-xs md:text-base text-center">
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
