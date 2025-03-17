// KEEP file for reference on the handleUpdateDisplayName to move into the new wallet / dashboard page

import { useEffect, useRef, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import {
  showConnectWalletModal,
  walletContext,
} from "$client/wallet/wallet.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { ConnectorsModal } from "./ConnectorsModal.tsx";
import { _getCSRFToken } from "$lib/utils/clientSecurityUtils.ts";
import AnimationLayout from "$components/shared/animation/AnimationLayout.tsx";

/* ===== WALLET MODAL COMPONENT INTERFACE ===== */
interface Props {
  connectors?: ComponentChildren[];
}

/* ===== MAIN WALLET MODAL COMPONENT ===== */
export const WalletModal = ({ connectors = [] }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { wallet, isConnected, disconnect } = walletContext;
  const { address } = wallet;
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [path, setPath] = useState<string | null>(null);

  /* ===== PATH INITIALIZATION ===== */
  useEffect(() => {
    setPath(globalThis.location.pathname?.split("/")[1] || null);
  }, []);

  /* ===== MODAL VISIBILITY HANDLER ===== */
  useEffect(() => {
    if (showConnectWalletModal.value) {
      setIsModalOpen(true);
    }
  }, [showConnectWalletModal.value]);

  /* ===== CLICK OUTSIDE HANDLER ===== */
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

  /* ===== MODAL TOGGLE FUNCTION ===== */
  const toggleModal = () => {
    if (isConnected) {
      console.log("connected");
      // setIsPopupOpen(!isPopupOpen);
    } else {
      setIsModalOpen(!isModalOpen);
      showConnectWalletModal.value = true;
    }
  };

  /* ===== MODAL CLOSE HANDLER ===== */
  const handleCloseModal = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsModalOpen(false);
    }
  };

  /* ===== WALLET SIGN OUT FUNCTION ===== */
  const walletSignOut = () => {
    disconnect();
    if (path === "wallet" && typeof globalThis !== "undefined") {
      globalThis.history.pushState({}, "", "/");
      globalThis.location.reload();
    }
  };

  const walletButtonStyle =
    "bg-transparent border-2 rounded-md border-gradient-to-b from-[#660099] to-[#AA00FF] hover:border-stamp-purple-bright text-sm tracking-wider h-10 px-4 mobileLg:px-5 transition-colors duration-300 ";

  /* ===== COMPONENT RENDER ===== */
  return (
    <div
      class="relative "
      ref={modalRef}
    >
      {/* ===== CONNECTED WALLET DISPLAY ===== */}
      {isConnected && address && (
        <>
          <div class="relative group">
            <button
              type="button"
              ref={buttonRef}
              // onClick={toggleModal}
              class={`${walletButtonStyle} hidden tablet:block mt-6 mobileLg:mt-9 tablet:mt-0`}
            >
              {abbreviateAddress(address)}
            </button>

            <button
              type="button"
              ref={buttonRef}
              class={`${walletButtonStyle} block tablet:hidden !border-0 tablet:border-2 text-xl`}
            >
              CONNECTED
            </button>

            {/* ===== DROPDOWN MENU ===== */}
            <div class="hidden group-hover:block absolute top-full tablet:top-0 -left-2 tablet:left-0 z-[1000]
              tablet:bg-gradient-to-b tablet:from-[#000000]/20 tablet:to-[#000000]/80 tablet:backdrop-blur-md
              tablet:border-2 tablet:rounded-md tablet:border-stamp-purple tablet:hover:border-stamp-purple-bright
             ">
              <div class="items-center text-base mobileLg:text-sm text-red-500 tablet:text-stamp-purple hover:text-blue-500 font-medium tablet:font-bold tracking-wider text-center transition-opacity duration-300 cursor-pointer">
                <button
                  type="button"
                  ref={buttonRef}
                  // onClick={toggleModal}
                  class="hidden tablet:block px-5 py-2.5"
                >
                  {abbreviateAddress(address)}
                </button>

                <p class="block tablet:hidden px-4 py-2">
                  {abbreviateAddress(address)}
                </p>
                <button
                  onClick={() => {
                    if (isConnected && address) {
                      globalThis.location.href = `/wallet/${address}`;
                    }
                  }}
                  class="-mt-1 w-full"
                >
                  DASHBOARD
                </button>
                <button
                  onClick={() => walletSignOut()}
                  class="pt-1.5 tablet:pt-1 pb-3 w-full"
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== CONNECT WALLET BUTTON ===== */}
      {!(isConnected && address) && (
        <div class="relative inline-block">
          <button
            type="button"
            ref={buttonRef}
            onClick={toggleModal}
            class="bg-transparent border-2 rounded-md border-gradient-to-b from-[#660099] to-[#AA00FF] hover:border-stamp-purple-bright text-sm tracking-wider h-10 px-4 mobileLg:px-5 mt-6 mobileLg:mt-9 tablet:mt-0 transition-colors duration-300 "
          >
            CONNECT
          </button>
        </div>
      )}

      {/* ===== CONNECT WALLET MODAL ===== */}
      {isModalOpen && (
        <AnimationLayout
          handleClose={() => {
            setIsModalOpen(false);
            showConnectWalletModal.value = false;
          }}
        >
          <ConnectorsModal
            connectors={connectors}
            toggleModal={() => {
              setIsModalOpen(false);
              showConnectWalletModal.value = false;
            }}
            handleCloseModal={handleCloseModal}
          />
        </AnimationLayout>
      )}
    </div>
  );
};

/*
 * ===== LEGACY WALLET POPUP COMPONENT =====
 * This component is not currently used in the application.
 * It contains functionality for updating display names that will be moved to the dashboard.
 *
 * TODO(@reinamora137): This will need to move to the new dashboard /wallet page
 */
/*
const WalletPopup = (
  { logout, _onClose }: { logout: () => void; onClose: () => void },
) => {
  const displayNameRef = useRef<HTMLInputElement>(null);
  const _xNameRef = useRef<HTMLInputElement>(null);
  const { wallet } = walletContext;
  const popupRef = useRef<HTMLDivElement>(null);
  const [currency, setCurrency] = useState("BTC");
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (wallet.address) {
        try {
          const response = await fetch(
            `/api/internal/creatorName?address=${
              encodeURIComponent(wallet.address)
            }`,
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const displayValue = data.creatorName ||
            abbreviateAddress(wallet.address);
          setDisplayName(displayValue);
          if (displayNameRef.current) {
            displayNameRef.current.value = displayValue;
          }
        } catch (error) {
          console.error("Error fetching creator name:", error);
          setDisplayName(abbreviateAddress(wallet.address));
        }
      }
    };

    fetchCreatorName();
  }, [wallet.address]);

  // TODO(@reinamora137): This will need to move to the new dashboard /wallet page

  const handleUpdateDisplayName = async () => {
    if (!displayNameRef.current) return;

    const newDisplayName = displayNameRef.current.value.trim();
    if (
      !newDisplayName || newDisplayName === abbreviateAddress(wallet.address)
    ) {
      displayNameRef.current.value = displayName;
      return;
    }

    try {
      // Get CSRF token using utility function
      const csrfToken = await getCSRFToken();

      // Sign the message
      const timestamp = Date.now().toString();
      const message =
        `Update creator name to ${newDisplayName} at ${timestamp}`;
      const signature = await walletContext.signMessage(message);

      if (!signature) {
        throw new Error("Failed to sign message");
      }

      // Update with CSRF token in header
      const response = await fetch("/api/internal/creatorName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          address: wallet.address,
          newName: newDisplayName,
          signature,
          timestamp,
          csrfToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update display name");
      }

      const data = await response.json();
      if (data.success) {
        setDisplayName(data.creatorName);
        console.log("Display name updated successfully");
      } else {
        throw new Error(data.message || "Failed to update display name");
      }
    } catch (error) {
      console.error("Error updating display name:", error);
      if (displayNameRef.current) {
        displayNameRef.current.value = displayName;
      }
    }
  };

  return (
    <div
      ref={popupRef}
      class="flex flex-col gap-[10px] absolute top-[50px] right-0 z-[100] bg-[#3E2F4C] text-white p-[14px] min-w-[370px]"
    >
      <div class="flex justify-between items-end">
        <p class="text-[24px] font-normal">Wallet</p>
        <a
          href={`/wallet/${wallet.address}`}
          class="underline cursor-pointer font-normal"
        >
          View Wallet
        </a>
      </div>
      <hr />
      <div class="flex justify-between items-center">
        <p class="font-normal">Currency</p>
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
      <p class="font-normal">Display name</p>
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
      <div class={"flex justify-between"}>
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
      <hr />
      <p class="font-normal">My address</p>
      <p class="text-[14px] break-all font-normal">{wallet.address}</p>
    <p
        class="text-[14px] text-[#8B51C0] flex gap-[5px] items-center cursor-pointer"
        onClick={() => {}}
      >
        Add address
        <img src="/img/wallet/icon_plus.svg" alt="" />
      </p>
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
*/

{/* ===== LEGACY POPUP RENDERING (UNUSED) ===== */}
{
  /*
      {isPopupOpen && isConnected && (
        <WalletPopup
          logout={() => {
            disconnect();
            setIsPopupOpen(false);
            if (path === "wallet" && typeof globalThis !== "undefined") {
              globalThis.history.pushState({}, "", "/");
              globalThis.location.reload();
            }
          }}
          onClose={() => setIsPopupOpen(false)}
        />
      )}
      */
}
