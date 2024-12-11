import { useState } from "preact/hooks";
import WalletDonateModal from "$islands/Wallet/details/WalletDonateModal.tsx";

const DONATE_ADDRESS = "bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203";

export default function AboutDonate() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fee, setFee] = useState<number>(0);
  const [showCopied, setShowCopied] = useState(false);

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DONATE_ADDRESS);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";
  const subTitlePurple =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const dataLabel =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXl =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
  const buttonPurpleOutline =
    "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";
  const tooltip =
    "absolute left-1/2 -translate-x-1/2 bottom-full text-stamp-grey-light text-xs mb-1 hidden group-hover:block whitespace-nowrap";

  return (
    <>
      <section>
        <div className="w-full flex flex-col justify-center items-start">
          <h1 className={titlePurpleDL}>
            DONATE
          </h1>
          <h3 className={subTitlePurple}>
            TO THE DEV FUND
          </h3>
        </div>
        <p className={`${bodyTextLight} tablet:hidden block`}>
          Support the ongoing development of Bitcoin Stamps and contribute to
          the monthly running costs of the backend infrastructure, to help
          ensure the stamping machine keeps running.
        </p>
        <div className="grid grid-cols-12">
          <div className="mobileMd:col-span-8 col-span-12">
            <p className={`${bodyTextLight} tablet:block hidden`}>
              Support the ongoing development of Bitcoin Stamps and contribute
              to the monthly running costs of the backend infrastructure, to
              help ensure the stamping machine keeps running.
            </p>
            <div className="grid grid-cols-12 mt-6 mb-6">
              <div className="col-span-6 flex flex-col justify-center items-center">
                <p className={dataLabel}>
                  MONTHLY DONATIONS
                </p>
                <p className={dataValueXl}>
                  434 <span className="font-light">USD</span>
                </p>
              </div>
              <div className="col-span-6 flex flex-col justify-center items-center">
                <p className={dataLabel}>
                  EXPENSES
                </p>
                <p className={dataValueXl}>
                  3,234 <span className="font-light">USD</span>
                </p>
              </div>
            </div>
            <p className={bodyTextLight}>
              Use the Donate button and you'll receive a unique stamp by Viva la
              Vandal as thanks for your support.
            </p>
            <br />
            <p className={`${bodyTextLight} mobileMd:block hidden`}>
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>
            <br />

            <div className="flex gap-3 justify-start hidden mobileMd:flex">
              <p className="text-base mobileLg:text-lg font-bold text-stamp-purple mobileLg:block hidden">
                {DONATE_ADDRESS}
              </p>
              <p className="text-base mobileLg:text-lg font-bold text-stamp-purple mobileLg:hidden block">
                bc1qe5sz3mt4a3e5...74qe0xdrkzew203
              </p>
              <div class="relative group pt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  class="w-[18px] h-[18px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
                  viewBox="0 0 32 32"
                  role="button"
                  aria-label="Copy"
                  onClick={handleCopy}
                >
                  <path d="M27 4H11C10.7348 4 10.4804 4.10536 10.2929 4.29289C10.1054 4.48043 10 4.73478 10 5V10H5C4.73478 10 4.48043 10.1054 4.29289 10.2929C4.10536 10.4804 4 10.7348 4 11V27C4 27.2652 4.10536 27.5196 4.29289 27.7071C4.48043 27.8946 4.73478 28 5 28H21C21.2652 28 21.5196 27.8946 21.7071 27.7071C21.8946 27.5196 22 27.2652 22 27V22H27C27.2652 22 27.5196 21.8946 27.7071 21.7071C27.8946 21.5196 28 21.2652 28 21V5C28 4.73478 27.8946 4.48043 27.7071 4.29289C27.5196 4.10536 27.2652 4 27 4ZM20 26H6V12H20V26ZM26 20H22V11C22 10.7348 21.8946 10.4804 21.7071 10.2929C21.5196 10.1054 21.2652 10 21 10H12V6H26V20Z" />
                </svg>
                <div className={`${tooltip} -mb-0.5`}>
                  {showCopied ? "COPIED" : "COPY"}
                </div>
              </div>
            </div>
          </div>

          <div className="mobileMd:col-span-4 col-span-12 flex flex-col gap-5 justify-center items-center">
            <img
              className="w-[134px] mobileLg:w-[174px] tablet:w-[204px]"
              src="/img/home/carousel1.png"
            />
            <button
              onClick={handleOpen}
              className={buttonPurpleOutline}
            >
              DONATE
            </button>
          </div>

          <div className="flex flex-col col-span-12 mobileMd:hidden mt-9">
            <p className={bodyTextLight}>
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>

            <div className="flex gap-3 justify-start">
              <p className="text-base mobileLg:text-lg font-bold text-stamp-purple mobileLg:block hidden pt-1.5">
                {DONATE_ADDRESS}
              </p>
              <p className="text-base mobileLg:text-lg font-bold text-stamp-primary mobileLg:hidden block pt-1.5">
                bc1qe5sz3mt4a3e5...74qe0xdrkzew203
              </p>
              <div class="relative group pt-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  class="w-[18px] h-[18px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
                  viewBox="0 0 32 32"
                  role="button"
                  aria-label="Copy"
                  onClick={handleCopy}
                >
                  <path d="M27 4H11C10.7348 4 10.4804 4.10536 10.2929 4.29289C10.1054 4.48043 10 4.73478 10 5V10H5C4.73478 10 4.48043 10.1054 4.29289 10.2929C4.10536 10.4804 4 10.7348 4 11V27C4 27.2652 4.10536 27.5196 4.29289 27.7071C4.48043 27.8946 4.73478 28 5 28H21C21.2652 28 21.5196 27.8946 21.7071 27.7071C21.8946 27.5196 22 27.2652 22 27V22H27C27.2652 22 27.5196 21.8946 27.7071 21.7071C27.8946 21.5196 28 21.2652 28 21V5C28 4.73478 27.8946 4.48043 27.7071 4.29289C27.5196 4.10536 27.2652 4 27 4ZM20 26H6V12H20V26ZM26 20H22V11C22 10.7348 21.8946 10.4804 21.7071 10.2929C21.5196 10.1054 21.2652 10 21 10H12V6H26V20Z" />
                </svg>
                <div className={`${tooltip} !mb-0`}>
                  {showCopied ? "COPIED!" : "COPY"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isOpen && (
          <WalletDonateModal
            fee={fee}
            handleChangeFee={handleChangeFee}
            toggleModal={handleOpen}
            handleCloseModal={handleCloseModal}
            donateAddress={DONATE_ADDRESS}
          />
        )}
      </section>
    </>
  );
}
