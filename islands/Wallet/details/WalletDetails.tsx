import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import WalletSendModal from "$islands/Wallet/details/WalletSendModal.tsx";
import WalletReceiveModal from "$islands/Wallet/details/WalletReceiveModal.tsx";
import { WalletData } from "$types/index.d.ts";
import { Button } from "$components/Button.tsx";

function WalletDetails(
  { walletData, stampsTotal, src20Total, stampsCreated, setShowItem }: {
    walletData: WalletData;
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    setShowItem: (type: string) => void;
  },
) {
  const [fee, setFee] = useState<number>(walletData.fee);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-col gap-6 items-stretch">
        <WalletOverview
          walletData={{ ...walletData, fee }}
          onSend={() => setIsSendModalOpen(true)}
          onReceive={() => setIsReceiveModalOpen(true)}
        />
        <WalletStats
          setShowItem={setShowItem}
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
  const [hideBalance, setHideBalance] = useState<boolean>(false);

  const copy = async () => {
    if (!hideBalance) {
      await navigator.clipboard.writeText(walletData.address);
    }
  };

  return (
    <div className="w-full dark-gradient flex flex-col justify-between p-6">
      <div className="flex justify-between">
        <div className={`${hideBalance ? "blur-sm" : ""}`}>
          <p className="text-[#999999] text-5xl select-none">
            <span className="font-light">
              {hideBalance ? "***" : walletData.balance}
            </span>
            &nbsp;
            <span className="font-extralight">BTC</span>
          </p>
          <p className="text-[#666666] text-2xl  select-none">
            {hideBalance ? "******" : walletData.usdValue.toLocaleString()} USD
          </p>
        </div>
        <div>
          <button class="" onClick={() => setHideBalance(!hideBalance)}>
            {hideBalance
              ? (
                <img
                  src="/img/wallet/icon-unhide-balance.svg"
                  className="w-8 h-8"
                  alt="Hide balance"
                />
              )
              : (
                <img
                  src="/img/wallet/icon-hide-balance.svg"
                  className="w-8 h-8"
                  alt="Hide balance"
                />
              )}
          </button>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center">
          <p className="text-[#8800CC] font-medium select-none mobile-768:block tablet:text-sm text-xs hidden">
            {walletData.address}
          </p>
        </div>
        <div className="flex gap-3">
          <img
            src="/img/wallet/icon-copy.svg"
            className="w-8 h-8 cursor-pointer"
            alt="Copy"
            onClick={copy}
          />
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
          <a
            href={`https://mempool.space/address/${walletData.address}`}
            target="_blank"
          >
            <img
              src="/img/wallet/icon-history.svg"
              className="w-8 h-8 cursor-pointer"
              alt="History"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

function WalletStats(
  { stampsTotal, src20Total, stampsCreated, setShowItem = () => {} }: {
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    setShowItem: (type: string) => void;
  },
) {
  const handleType = (type: string) => {
    setShowItem(type);
  };

  return (
    <div className="w-full flex flex-col tablet:flex-row gap-6 ">
      <StampStats
        stampsTotal={stampsTotal}
        stampsCreated={stampsCreated}
        handleType={handleType}
      />
      <DispenserStats handleType={handleType} />
      <TokenStats src20Total={src20Total} handleType={handleType} />
    </div>
  );
}

function StampStats(
  { stampsTotal, stampsCreated, handleType }: {
    stampsTotal: number;
    stampsCreated: number;
    handleType: (type: string) => void;
  },
) {
  return (
    <div
      className="w-full dark-gradient p-6 flex flex-col gap-6 hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE] cursor-pointer"
      onClick={() => handleType("stamp")}
    >
      <div className="flex justify-between">
        <StatItem label="STAMPS" value={stampsTotal.toString()} />
        <StatItem label="BY ME" value={stampsCreated.toString()} />
      </div>
    </div>
  );
}

function DispenserStats(
  { handleType }: { handleType: (type: string) => void },
) {
  return (
    <div
      className="w-full dark-gradient p-6 flex flex-col gap-6 hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE] cursor-pointer"
      onClick={() => handleType("dispenser")}
    >
      <div className="flex justify-between">
        <StatItem label="DISPENSERS" value="N/A" align="left" />
        <StatItem label="SOLD" value="N/A" align="right" />
      </div>
    </div>
  );
}

function TokenStats(
  { src20Total, handleType }: {
    src20Total: number;
    handleType: (type: string) => void;
  },
) {
  return (
    <div
      className="w-full dark-gradient flex justify-between p-6 hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE] cursor-pointer"
      onClick={() => handleType("token")}
    >
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
