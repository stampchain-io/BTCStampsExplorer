import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import WalletSendModal from "$islands/Wallet/details/WalletSendModal.tsx";
import WalletReceiveModal from "$islands/Wallet/details/WalletReceiveModal.tsx";
import { WalletData } from "$lib/types/index.d.ts";

function WalletDetails(
  { walletData, stampsTotal, src20Total, stampsCreated }: {
    walletData: WalletData;
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
  },
) {
  const [fee, setFee] = useState<number>(walletData.fee);
  const [isSendModalOpen, setIsSendModalOpen] = useState(true);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <WalletOverview
          walletData={{ ...walletData, fee }}
          onSend={() => setIsSendModalOpen(true)}
          onReceive={() => setIsReceiveModalOpen(true)}
        />
        <WalletStats
          stampsTotal={stampsTotal}
          src20Total={src20Total}
          stampsCreated={stampsCreated}
        />
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
    <div className="w-full lg:w-1/2 dark-gradient flex flex-col justify-between p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-[#999999] text-5xl">
            <span className="font-light">{walletData.balance}</span>
            &nbsp;
            <span className="font-extralight">BTC</span>
          </p>
          <p className="text-[#666666] text-2xl">
            {walletData.usdValue.toLocaleString()} USD
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

function WalletStats(
  { stampsTotal, src20Total, stampsCreated }: {
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
  },
) {
  return (
    <div className="w-full lg:w-1/2 flex flex-col gap-6">
      <StampStats stampsTotal={stampsTotal} stampsCreated={stampsCreated} />
      <TokenStats src20Total={src20Total} />
    </div>
  );
}

function StampStats(
  { stampsTotal, stampsCreated }: {
    stampsTotal: number;
    stampsCreated: number;
  },
) {
  return (
    <div className="dark-gradient p-6 flex flex-col gap-6">
      <div className="flex justify-between">
        <StatItem label="STAMPS" value={stampsTotal.toString()} />
        <StatItem
          label="VALUE"
          value={
            <>
              <span className="font-light">
                N/A
              </span>&nbsp;<span className="font-extralight">BTC</span>
            </>
          }
          align="right"
        />
      </div>
      <div className="flex justify-between">
        <StatItem label="BY ME" value={stampsCreated.toString()} />
        <StatItem label="DISPENSERS" value="N/A" align="center" />
        <StatItem label="TOTAL SOLD" value="N/A" align="right" />
      </div>
    </div>
  );
}

function TokenStats({ src20Total }: { src20Total: number }) {
  return (
    <div className="dark-gradient flex justify-between p-6">
      <StatItem label="TOKENS" value={src20Total.toString()} />
      <StatItem
        label="VALUE"
        value={
          <>
            <span className="font-light">
              N/A
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
