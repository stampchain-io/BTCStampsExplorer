import { useState } from "preact/hooks";
import WalletDonateModal from "$islands/Wallet/details/WalletDonateModal.tsx";

const DONATE_ADDRESS = "bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203";

export default function AboutDonate() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fee, setFee] = useState<number>(0);

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
      alert("Text copied to clipboard!");
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

  return (
    <>
      <section className="mt-24 mobileLg:mt-36">
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
            <div className="grid grid-cols-12 mt-6">
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
            <div className="w-full justify-start items-center mobileMd:flex hidden">
              <div className="flex gap-2 justify-center items-center">
                <p className="text-stamp-primary mobileLg:block hidden desktop:text-xl mobileMd:text-lg text-sm">
                  {DONATE_ADDRESS}
                </p>
                <p className="text-stamp-primary mobileLg:hidden block desktop:text-xl mobileMd:text-lg text-sm">
                  bc1qe5sz3mt4a3e5...74qe0xdrkzew203
                </p>
                <img
                  src="/img/wallet/icon-copy.svg"
                  className="w-6 h-6 cursor-pointer"
                  onClick={handleCopy}
                  alt="Copy"
                />
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
          <div className="flex-col justify-center items-center mobileMd:hidden flex col-span-12 mt-5">
            <p className={bodyTextLight}>
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>
            <div className="w-full justify-start items-center">
              <div className="flex gap-2 justify-center items-center">
                <p className="text-stamp-primary mobileLg:block hidden desktop:text-xl mobileMd:text-lg text-sm">
                  {DONATE_ADDRESS}
                </p>
                <p className="text-stamp-primary mobileLg:hidden block desktop:text-xl mobileMd:text-lg text-sm">
                  bc1qe5sz3mt4a3e5...74qe0xdrkzew203
                </p>
                <img
                  onClick={handleCopy}
                  src="/img/wallet/icon-copy.svg"
                  className="w-6 h-6 cursor-pointer"
                  alt="Copy"
                />
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
