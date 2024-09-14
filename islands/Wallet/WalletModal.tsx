import { useEffect, useRef, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { showConnectWalletModal, walletContext } from "store/wallet/wallet.ts";
import { abbreviateAddress } from "utils/util.ts";
import { ConnectorsModal } from "./ConnectorsModal.tsx";
import { ConnectedModal } from "./ConnectedModal.tsx";
import { StampController } from "$lib/controller/stampController.ts";
import { getCSRFToken } from "$lib/utils/clientSecurityUtils.ts";

const WalletPopup = (
  { logout, onClose }: { logout: () => void; onClose: () => void },
) => {
  const displayNameRef = useRef<HTMLInputElement>(null);
  const xNameRef = useRef<HTMLInputElement>(null);
  const { wallet } = walletContext;
  const popupRef = useRef<HTMLDivElement>(null);
  const [currency, setCurrency] = useState("BTC");
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (wallet.value.address) {
        try {
          const response = await fetch(
            `/api/v2/creator-name?address=${wallet.value.address}`,
          );
          if (response.ok) {
            const data = await response.json();
            const displayValue = data.creatorName ||
              abbreviateAddress(wallet.value.address);
            setDisplayName(displayValue);
            if (displayNameRef.current) {
              displayNameRef.current.value = displayValue;
            }
          } else {
            console.error("Failed to fetch creator name");
            setDisplayName(abbreviateAddress(wallet.value.address));
          }
        } catch (error) {
          console.error("Error fetching creator name:", error);
          setDisplayName(abbreviateAddress(wallet.value.address));
        }
      }
    };

    fetchCreatorName();
  }, [wallet.value.address]);

  const handleUpdateDisplayName = async () => {
    if (displayNameRef.current) {
      const newDisplayName = displayNameRef.current.value.trim();
      if (
        newDisplayName &&
        newDisplayName !== abbreviateAddress(wallet.value.address)
      ) {
        try {
          const timestamp = Date.now().toString();
          const message =
            `Update creator name to ${newDisplayName} at ${timestamp}`;
          console.log("Preparing to sign message:", message);

          // Use the walletContext's signMessage function
          const signature = await walletContext.signMessage(message);

          console.log(
            "Signature received in handleUpdateDisplayName:",
            signature,
          );

          if (!signature) {
            console.error("Signature is undefined or null");
            return;
          }

          const csrfToken = await getCSRFToken();
          console.log("CSRF Token received:", csrfToken);

          const requestBody = {
            address: wallet.value.address,
            newName: newDisplayName,
            signature,
            timestamp,
            csrfToken,
          };
          console.log("Sending request with body:", requestBody);

          const response = await fetch("/api/v2/update-creator-name", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          console.log("Request body sent:", JSON.stringify(requestBody));

          console.log("Response status:", response.status);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Response data:", data);

          if (data.success) {
            setDisplayName(data.creatorName);
            console.log("Display name updated successfully");
          } else {
            console.error("Failed to update display name:", data.message);
          }
        } catch (error) {
          console.error("Error updating display name:", error);
          // You might want to show an error message to the user here
        }
      } else {
        // Reset to the current display name if empty or unchanged
        displayNameRef.current.value = displayName;
      }
    }
  };

  return (
    <div
      ref={popupRef}
      className="flex flex-col gap-[10px] absolute top-[50px] right-0 z-[100] bg-[#3E2F4C] text-white p-[14px] min-w-[370px]"
    >
      <div class="flex justify-between items-end">
        <p className="text-[24px] font-normal">Wallet</p>
        <a
          href={`/wallet/${wallet.value.address}`}
          className="underline cursor-pointer font-normal"
        >
          View Wallet
        </a>
      </div>
      <hr />
      <div class="flex justify-between items-center">
        <p className="font-normal">Currency</p>
        <select
          name="currency"
          id="currency"
          class="bg-[#3F2A4E] text-[#F5F5F5] h-[37px] min-w-[54px] p-2 rounded-[4px] border border-[#8A8989] font-normal"
          value={currency}
          onChange={(e) => setCurrency((e.target as HTMLSelectElement).value)}
        >
          <option value="BTC">BTC</option>
          <option value="USD">USD</option>
          <option value="ETH">ETH</option>
        </select>
      </div>
      <hr />
      <p className="font-normal">Display name</p>
      <div class="flex justify-between">
        <input
          type="text"
          class="bg-[#4F3666] border border-[#8A8989] rounded-[4px] py-1 px-2 font-normal"
          ref={displayNameRef}
          defaultValue={displayName}
        />
        <button
          class="border border-[#8A8989] bg-[#5503A6] p-[7px] font-normal"
          onClick={handleUpdateDisplayName}
        >
          Update
        </button>
      </div>
      {
        /* <hr />
        // TODO: Need to add Twitter column to the DB
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
            if (xNameRef.current) {
              console.log(xNameRef.current.value);
            }
          }}
        >
          Update
        </button>
      </div>
      <hr /> */
      }
      <p className="font-normal">My address</p>
      <p class="text-[14px] break-all font-normal">{wallet.value.address}</p>
      {
        /* <p
        class="text-[14px] text-[#8B51C0] flex gap-[5px] items-center cursor-pointer"
        onClick={() => {}}
      >
        Add address
        <img src="/img/wallet/icon_plus.svg" alt="" />
      </p> */
      }
      <hr />
      <button
        class="w-full text-center bg-[#5503A6] border border-[#8A8989] rounded-[7px] py-4 mt-5 cursor-pointer font-normal"
        onClick={() => logout()}
      >
        Logout
      </button>
    </div>
  );
};

interface Props {
  connectors?: ComponentChildren[];
}

export const WalletModal = ({ connectors = [] }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { wallet, isConnected, disconnect } = walletContext;
  const { address } = wallet.value;
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    setPath(window.location.pathname?.split("/")[1] || null);
  }, []);

  useEffect(() => {
    if (showConnectWalletModal.value) {
      setIsModalOpen(true);
    }
  }, [showConnectWalletModal.value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopupOpen(false);
      }
    };

    if (isPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopupOpen]);

  const toggleModal = () => {
    if (isConnected.value) {
      setIsPopupOpen(!isPopupOpen);
    } else {
      setIsModalOpen(!isModalOpen);
      showConnectWalletModal.value = true;
    }
  };

  const handleCloseModal = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="relative" ref={modalRef}>
      <button
        ref={buttonRef}
        onClick={toggleModal}
        class="block bg-[#8800CC] hover:bg-[#9911DD] px-5 py-2.5 rounded font-black text-base text-center text-[#080808] lg:ml-5"
        type="button"
      >
        {isConnected.value && address ? abbreviateAddress(address) : "CONNECT"}
      </button>

      {isModalOpen && !isConnected.value && (
        <ConnectorsModal
          connectors={connectors}
          toggleModal={() => {
            setIsModalOpen(false);
            showConnectWalletModal.value = false;
          }}
          handleCloseModal={handleCloseModal}
        />
      )}

      {isPopupOpen && isConnected.value && (
        <WalletPopup
          logout={() => {
            disconnect();
            setIsPopupOpen(false);
            if (path === "wallet" && typeof window !== "undefined") {
              window.history.pushState({}, "", "/");
              window.location.reload();
            }
          }}
          onClose={() => setIsPopupOpen(false)}
        />
      )}
    </div>
  );
};
