import { useRef, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { computed } from "@preact/signals";

import { walletContext } from "store/wallet/wallet.ts";
import { abbreviateAddress } from "utils/util.ts";
import { ConnectorsModal } from "./ConnectorsModal.tsx";
import { ConnectedModal } from "./ConnectedModal.tsx";

const WalletPopup = ({ logout }: { logout: () => void }) => {
  const displayNameRef = useRef(null);
  const xNameRef = useRef(null);
  // const [currency, setCurrency] = useState("USD");

  return (
    <div
      className={"hidden group-hover:flex flex-col gap-[10px] absolute top-[50px] right-0 z-[100] bg-[#3E2F4C] text-white p-[14px] min-w-[370px]"}
    >
      <div class="flex justify-between items-end">
        <p className={"text-[24px] font-medium"}>Wallet</p>
        <p className="underline cursor-pointer">Go to collection</p>
      </div>
      <hr />
      <div class="flex justify-between items-center">
        <p>Currency</p>
        <select
          name="currency"
          id="currency"
          class="bg-[#3F2A4E] text-[#F5F5F5] h-[37px] min-w-[54px] p-2 rounded-[4px] border border-[#8A8989]"
          // onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="USD">USD</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>
      </div>
      <hr />
      <p>Display name</p>
      <div class="flex justify-between">
        <input
          type="text"
          class="bg-[#4F3666] border border-[#8A8989] rounded-[4px] py-1 px-2"
          ref={displayNameRef}
        />
        <button
          class="border border-[#8A8989] bg-[#5503A6] p-[7px]"
          onClick={() => {
            // TODO: add update logic here
            console.log(displayNameRef.current.value);
          }}
        >
          Update
        </button>
      </div>
      <hr />
      <p>X (Twitter)</p>
      <div className={"flex justify-between"}>
        <input
          type="text"
          class="bg-[#4F3666] border border-[#8A8989] rounded-[4px] py-1 px-2"
          ref={xNameRef}
        />
        <button
          class="border border-[#8A8989] bg-[#5503A6] p-[7px]"
          onClick={() => {
            // TODO: add update logic here
            console.log(xNameRef.current.value);
          }}
        >
          Update
        </button>
      </div>
      <hr />
      <p>My addresses</p>
      <p class="text-[14px]">1. bc1p2dds1a421xvf53e2dcx6vxcg423sl64r</p>
      <p
        class="text-[14px] text-[#8B51C0] flex gap-[5px] items-center cursor-pointer"
        onClick={() => {}}
      >
        Add address
        <img src="/img/wallet/icon_plus.svg" alt="" />
      </p>
      <hr />
      <button
        class="w-full text-center bg-[#5503A6] border border-[#8A8989] rounded-[7px] py-4 mt-5 cursor-pointer"
        onClick={() => logout()}
      >
        Logout
      </button>
    </div>
  );
};

interface Props {
  connectors: ComponentChildren[];
}

export const WalletModal = ({ connectors }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { wallet, isConnected, disconnect } = walletContext;
  const { address } = wallet.value;

  let path: string | null = null;
  if (typeof window !== undefined) {
    path = (globalThis?.location?.pathname)?.split("/")[1];
  }

  const toggleModal = () => {
    if (isConnected.value && path === "wallet") return;
    if (isConnected.value) {
      if (globalThis.history) {
        globalThis.history.pushState(
          {},
          "",
          `/wallet/${address}`,
        );
        window.location.reload();
      }
    } else {
      setIsModalOpen(!isModalOpen);
      console.log("Modal state:", !isModalOpen);
    }
  };

  const handleCloseModal = (event) => {
    if (event.target === event.currentTarget) {
      setIsModalOpen(false);
    }
  };

  return (
    <div
      className={(isConnected.value) ? "group relative" : ""}
    >
      <button
        onClick={toggleModal}
        class="block bg-[#FF00E9] hover:bg-[#FF11FF] px-5 py-2.5 rounded font-black text-base text-center text-[#F5F5F5] lg:mx-5"
        type="button"
      >
        {isConnected.value && address ? abbreviateAddress(address) : "CONNECT"}
      </button>

      {isModalOpen && !isConnected.value && (
        <ConnectorsModal
          connectors={connectors}
          toggleModal={toggleModal}
          handleCloseModal={handleCloseModal}
        />
      )}
      {isModalOpen && isConnected.value && (
        <ConnectedModal
          toggleModal={toggleModal}
          handleCloseModal={handleCloseModal}
        />
      )}

      <WalletPopup
        logout={() => {
          disconnect();
          if (path === "wallet") {
            globalThis.history.pushState(
              {},
              "",
              "/",
            );
            window.location.reload();
          }
        }}
      />
    </div>
  );
};
