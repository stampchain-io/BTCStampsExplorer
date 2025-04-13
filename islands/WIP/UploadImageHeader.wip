/* NOT IN USE */
import { useEffect, useState } from "preact/hooks";
import { initialWallet } from "$client/wallet/wallet.ts";
import { text, titlePurpleLD } from "$text";

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
    <div class="flex flex-col gap-3">
      <h1 class={titlePurpleLD}>UPLOAD IMAGE</h1>
      <p class={text}>
        Upload your background image to be used as a stamp
      </p>
    </div>
  );
};
