import { useEffect, useState } from "preact/hooks";
import { initialWallet } from "$client/wallet/wallet.ts";

export const UploadImageHeader = () => {
  const [wallet, setWallet] = useState(initialWallet);

  const getAccount = () => {
    setWallet(JSON.parse(localStorage.getItem("wallet") as any));
  };

  useEffect(() => {
    const interval = setInterval(() => getAccount(), 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("wallet", wallet);
    if (
      wallet === null
    ) globalThis.location.href = "/upload";
  }, [wallet]);

  return (
    <div class="text-white flex flex-col gap-8">
      <div class="text-center">
        <p class="text-7xl leading-normal">Upload Image</p>
        <p class="text-[#DBDBDB] font-light">
          Upload your background image to be used as a stamp
        </p>
      </div>
    </div>
  );
};
