import { useState } from "preact/hooks";
import DonateModal from "./DonateModal.tsx";

export default function AboutDonate() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fee, setFee] = useState<number>(0);
  const [formState, setFormState] = useState({
    toAddress: "",
    token: "",
    amt: "",
    fee: 0,
    feeError: "",
    BTCPrice: 0,
    jsonSize: 0,
    apiError: "",
    toAddressError: "",
    tokenError: "",
    amtError: "",
    // Deploy-specific fields
    max: "",
    maxError: "",
    lim: "",
    limError: "",
    dec: "18",
    x: "",
    tg: "",
    web: "",
    email: "",
    file: null as File | null,
  });

  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0] || null;
    if (file) {
      const img = new Image();
      img.onload = () => {
        if (img.width === 420 && img.height === 420) {
          setFormState((prev) => ({ ...prev, file }));
        } else {
          setFileUploadError("Image must be exactly 420x420 pixels.");
        }
      };
      img.onerror = () => {
        setFileUploadError("Invalid image file.");
      };
      img.src = URL.createObjectURL(file);
    } else {
      setFormState((prev) => ({ ...prev, file: null }));
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      try {
        console.log("File uploaded successfully");
      } catch (error) {
        console.error("Error uploading file:", error);
        setFileUploadError(
          "File upload failed. The deployment will continue without the background image.",
        );
      }
    };

    reader.readAsDataURL(file);
  };

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleDonate = () => {
    console.log("donate");
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <section className="mobileLg:mt-36 mt-24">
        <div className="w-full flex flex-col justify-center items-start">
          <h1 className="text-stamp-primary-dark font-work-sans font-black desktop:text-5xl mobileMd:text-4xl text-3xl">
            DONATE
          </h1>
          <h3 className="text-stamp-primary-dark font-work-sans font-black desktop:text-4xl mobileMd:text-2xl text-xl">
            TO THE DEV FUND
          </h3>
        </div>
        <p className="text-stamp-grey text-lg tablet:hidden block">
          Support the ongoing development of Bitcoin Stamps and contribute to
          the monthly running costs of the backend infrastructure, to help
          ensure the stamping machine keeps running.
        </p>
        <div className="grid grid-cols-12">
          <div className="mobileMd:col-span-8 col-span-12">
            <p className="text-stamp-grey text-lg tablet:block hidden">
              Support the ongoing development of Bitcoin Stamps and contribute
              to the monthly running costs of the backend infrastructure, to
              help ensure the stamping machine keeps running.
            </p>
            <div className="grid grid-cols-12 mt-6">
              <div className="col-span-6 flex flex-col justify-center items-center">
                <p className="text-stamp-grey font-work-sans desktop:text-xl tablet:text-lg mobileLg:text-base text-sm font-extralight">
                  MONTHLY DONATIONS
                </p>
                <p className="text-stamp-grey desktop:text-4xl mobileLg:text-3xl mobileMd:text-2xl mobile-xl">
                  <span className="text-stamp-grey-light font-black">434</span>
                  USD
                </p>
              </div>
              <div className="col-span-6 flex flex-col justify-center items-center">
                <p className="text-stamp-grey font-work-sans desktop:text-xl tablet:text-lg mobileLg:text-base text-sm font-extralight">
                  EXPENSES
                </p>
                <p className="text-stamp-grey desktop:text-4xl mobileLg:text-3xl mobileMd:text-2xl mobile-xl">
                  <span className="text-stamp-grey-light font-black">
                    3,234
                  </span>
                  USD
                </p>
              </div>
            </div>
            <p className="text-stamp-grey text-lg mt-6">
              Use the Donate button and you’ll receive a unique stamp by Viva la
              Vandal as thanks for your support.
            </p>
            <br />
            <p className="text-stamp-grey text-lg mobileMd:block hidden">
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>
            <br />
            <div className="w-full justify-start items-center mobileMd:flex hidden">
              <div className="flex gap-2 justify-center items-center">
                <p className="text-stamp-primary mobileLg:block hidden desktop:text-xl mobileMd:text-lg text-sm">
                  bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203
                </p>
                <p className="text-stamp-primary mobileLg:hidden block  desktop:text-xl mobileMd:text-lg text-sm">
                  bc1qe5sz3mt4a3e5...74qe0xdrkzew203
                </p>
                <img
                  src="/img/wallet/icon-copy.svg"
                  className="w-6 h-6 cursor-pointer"
                  alt="Copy"
                />
              </div>
            </div>
          </div>
          <div className="mobileMd:col-span-4 col-span-12 flex flex-col gap-5 justify-center items-center">
            <img
              className="w-[104px] mobileMd:[127px] mobileLg:[162px] tablet:w-[204px]"
              src="/img/home/carousel1.png"
            />
            <button
              onClick={handleOpen}
              className="text-[#660099] text-base font-extrabold border-2 border-[#660099] py-1 px-4 text-center min-w-[108px] rounded-md"
            >
              DONATE
            </button>
          </div>
          <div className="flex-col justify-center items-center mobileMd:hidden flex col-span-12 mt-5">
            <p className="text-stamp-grey text-lg">
              Or you may send BTC, SRC-20 Tokens or Art Stamps directly to the
              dev wallet.
            </p>
            <div className="w-full justify-start items-center">
              <div className="flex gap-2 justify-center items-center">
                <p className="text-stamp-primary mobileLg:block hidden desktop:text-xl mobileMd:text-lg text-sm">
                  bc1qe5sz3mt4a3e57n8e39pprval4qe0xdrkzew203
                </p>
                <p className="text-stamp-primary mobileLg:hidden block  desktop:text-xl mobileMd:text-lg text-sm">
                  bc1qe5sz3mt4a3e5...74qe0xdrkzew203
                </p>
                <img
                  src="/img/wallet/icon-copy.svg"
                  className="w-6 h-6 cursor-pointer"
                  alt="Copy"
                />
              </div>
            </div>
          </div>
        </div>
        {isOpen && (
          <DonateModal
            fee={fee}
            formState={formState}
            handleFileChange={handleFileChange}
            handleFileUpload={handleFileUpload}
            handleChangeFee={handleChangeFee}
            handleCloseModal={handleCloseModal}
            handleDonate={handleDonate}
            handleOpen={() => setIsOpen(true)}
          />
        )}
      </section>
    </>
  );
}
