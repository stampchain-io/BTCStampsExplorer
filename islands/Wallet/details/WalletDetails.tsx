const WalletDetails = () => {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch">
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] flex flex-col justify-between p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-[#999999] text-5xl">
              <span className="font-light">0,04206900</span>
              &nbsp;
              <span className="font-extralight">BTC</span>
            </p>
            <p className="text-[#666666] text-2xl">3023,83 USD</p>
            <p className="text-[#8800CC] font-medium">
              bc1qhkl6k0h9yvc0mpfk805gtkckd3v858d7hlls5q
            </p>
          </div>
          <div>
            <img src="/img/wallet/icon-hide-balance.svg" className="w-8 h-8" />
          </div>
        </div>
        <div className="flex justify-between">
          <div>
            <p className="text-lg">
              <span className="text-[#666666]">FEE</span>
              &nbsp;
              <span className="text-[#999999]">6 SAT/vB</span>
            </p>
            <p className="text-lg">
              <span className="text-[#666666]">BTC</span>
              &nbsp;
              <span className="text-[#999999]">69,420 USD</span>
            </p>
          </div>
          <div className="flex gap-3">
            <img
              src="/img/wallet/icon-arrow-square-out.svg"
              className="w-8 h-8"
              alt=""
            />
            <img
              src="/img/wallet/icon-arrow-square-in.svg"
              className="w-8 h-8"
              alt=""
            />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 flex flex-col gap-6">
          <div className="flex justify-between">
            <div>
              <p className="text-[#666666] text-left">STAMPS</p>
              <p className="text-4xl font-black text-[#999999] text-left">52</p>
            </div>
            <div>
              <p className="text-[#666666] text-right">VALUE</p>
              <p className="text-4xl font-black text-[#999999] text-right">
                <span className="font-light">0,00694200</span>
                &nbsp;
                <span className="font-extralight">BTC</span>
              </p>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-[#666666] text-left">BY ME</p>
              <p className="text-4xl font-black text-[#999999] text-left">42</p>
            </div>
            <div>
              <p className="text-[#666666] text-center">DIPSPENSERS</p>
              <p className="text-4xl font-black text-[#999999] text-center">
                9
              </p>
            </div>
            <div>
              <p className="text-[#666666] text-right">TOTAL SOLD</p>
              <p className="text-4xl font-black text-[#999999] text-right">
                217
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] flex justify-between p-6">
          <div>
            <p className="text-[#666666] text-left">TOKENS</p>
            <p className="text-4xl font-black text-[#999999] text-left">6</p>
          </div>
          <div>
            <p className="text-[#666666] text-right">VALUE</p>
            <p className="text-4xl font-black text-[#999999] text-right">
              <span className="font-light">0,00694200</span>
              &nbsp;
              <span className="font-extralight">BTC</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDetails;
