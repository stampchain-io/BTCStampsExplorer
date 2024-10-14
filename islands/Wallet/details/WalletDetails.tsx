import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import WalletSendModal from "$islands/Wallet/details/WalletSendModal.tsx";
import WalletReceiveModal from "$islands/Wallet/details/WalletReceiveModal.tsx";

interface WalletData {
  balance: number;
  usdValue: number;
  address: string;
  fee: number;
  btcPrice: number;
}

function WalletDetails() {
  const [fee, setFee] = useState<number>(6);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  // Mock data - replace with actual data fetching logic
  const walletData: WalletData = {
    balance: 0.04206900,
    usdValue: 3023.83,
    address: "bc1qhkl6k0h9yvc0mpfk805gtkckd3v858d7hlls5q",
    fee: 6,
    btcPrice: 69420,
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <WalletOverview
          walletData={walletData}
          onSend={() => setIsSendModalOpen(true)}
          onReceive={() => setIsReceiveModalOpen(true)}
        />
        <WalletStats />
      </div>

      {isSendModalOpen && (
        <WalletSendModal
          fee={fee}
          handleChangeFee={setFee}
          onClose={() => setIsSendModalOpen(false)}
        />
      )}

      {isReceiveModalOpen && (
        <WalletReceiveModal
          onClose={() => setIsReceiveModalOpen(false)}
          address={walletData.address}
        />
      )}
    </div>
  );
}

function WalletOverview(
  { walletData, onSend, onReceive }: {
    walletData: WalletData;
    onSend: () => void;
    onReceive: () => void;
  },
) {
  return (
    <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] flex flex-col justify-between p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-[#999999] text-5xl">
            <span className="font-light">{walletData.balance.toFixed(8)}</span>
            &nbsp;
            <span className="font-extralight">BTC</span>
          </p>
          <p className="text-[#666666] text-2xl">
            {walletData.usdValue.toFixed(2)} USD
          </p>
          <p className="text-[#8800CC] font-medium">{walletData.address}</p>
        </div>
        <div>
          <img
            src="/img/wallet/icon-hide-balance.svg"
            className="w-8 h-8"
            alt="Hide balance"
          />
        </div>
      </div>
      <div className="flex justify-between">
        <div>
          <p className="text-lg">
            <span className="text-[#666666]">FEE</span>
            &nbsp;
            <span className="text-[#999999]">{walletData.fee} SAT/vB</span>
          </p>
          <p className="text-lg">
            <span className="text-[#666666]">BTC</span>
            &nbsp;
            <span className="text-[#999999]">
              {walletData.btcPrice.toLocaleString()} USD
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <img
            src="/img/wallet/icon-arrow-square-out.svg"
            className="w-8 h-8 cursor-pointer"
            alt="Send"
            onClick={onSend}
          />
          <img
            src="/img/wallet/icon-arrow-square-in.svg"
            className="w-8 h-8 cursor-pointer"
            alt="Receive"
            onClick={onReceive}
          />
        </div>
      </div>
    </div>
  );
}

function WalletStats() {
  return (
    <div className="w-full lg:w-1/2 flex flex-col gap-6">
      <StampStats />
      <TokenStats />
    </div>
  );
}

function StampStats() {
  return (
    <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 flex flex-col gap-6">
      <div className="flex justify-between">
        <StatItem label="STAMPS" value="52" />
        <StatItem
          label="VALUE"
          value={
            <>
              <span className="font-light">
                0,00694200
              </span>&nbsp;<span className="font-extralight">BTC</span>
            </>
          }
          align="right"
        />
      </div>
      <div className="flex justify-between">
        <StatItem label="BY ME" value="42" />
        <StatItem label="DIPSPENSERS" value="9" align="center" />
        <StatItem label="TOTAL SOLD" value="217" align="right" />
      </div>
    </div>
  );
}

function TokenStats() {
  return (
    <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] flex justify-between p-6">
      <StatItem label="TOKENS" value="6" />
      <StatItem
        label="VALUE"
        value={
          <>
            <span className="font-light">
              0,00694200
            </span>&nbsp;<span className="font-extralight">BTC</span>
          </>
        }
        align="right"
      />
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
}

function StatItem({ label, value, align = "left" }: StatItemProps) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div>
      <p className={`text-[#666666] ${alignmentClass}`}>{label}</p>
      <p className={`text-4xl font-black text-[#999999] ${alignmentClass}`}>
        {value}
      </p>
    </div>
  );
}

export default WalletDetails;
