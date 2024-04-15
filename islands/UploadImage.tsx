import { useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import { api_post_mint } from "$lib/controller/mint.ts";

export function UploadImage() {
  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const [file, setFile] = useState<any>(null);
  const [fee, setFee] = useState<any>(22.3);
  const [inssuance, setInssuance] = useState(1);

  const handleChangeFee = (e: any) => {
    setFee(e.target.value);
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleImage = (e: any) => {
    setFile(e.target.files[0]);
  };

  const handleDecrease = () => {
    if (inssuance === 1) return;
    setInssuance(inssuance - 1);
  };

  const handleIncrease = () => {
    setInssuance(inssuance + 1);
  };

  const handleMint = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    if (file === null) {
      alert("Upload your file");
      return;
    }
    const data = await toBase64(file);
    axiod.post("https://stampchain.io/api/v2/olga/mint", {
      sourceWallet: address,
      qty: inssuance,
      locked: true,
      filename: file.name,
      file: data,
      satsPerKB: fee,
      service_fee: null,
      service_fee_address: null,
    }).then(
      (response) => {
        console.log(response);
      },
    ).catch((error) => console.log(error));
  };

  return (
    <div class={"flex flex-col w-full items-center"}>
      <div class="flex px-4 pt-6 gap-8">
        <div
          id="image-preview"
          class="relative max-w-sm p-6 border-dashed border-2 border-gray-400 rounded-lg items-center mx-auto text-center cursor-pointer w-[384px] h-[384px] content-center bg-gray-800"
        >
          <input
            id="upload"
            type="file"
            class="hidden"
            accept="image/*"
            onChange={handleImage}
          />
          {file !== null && (
            <img
              width={350}
              style={{ height: "100%" }}
              src={URL.createObjectURL(file)}
            />
          )}
          {file === null &&
            (
              <label for="upload" class="cursor-pointer h-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-8 h-8 text-gray-200 mx-auto mb-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-100">
                  Drop file here
                  <p class="font-normal text-sm text-gray-400 md:px-6">
                    or click to upload
                  </p>
                </h5>
                <p class="font-normal text-sm text-gray-400 md:px-6">
                  Max File Size: 65000 bytes
                </p>
                <span id="filename" class="text-gray-500 bg-gray-200 z-50">
                </span>
              </label>
            )}
        </div>

        <div class="max-w-sm p-6 mb-4 border-dashed border-2 border-gray-400 rounded-lg items-center mx-auto text-center cursor-pointer w-[384px] h-[384px] content-center bg-gray-800">
          {file !== null && (
            <img
              width={350}
              style={{ height: "100%" }}
              src={URL.createObjectURL(file)}
            />
          )}
          {file === null &&
            (
              <label class="cursor-pointer">
                <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-100">
                  Drop
                </h5>
                <span id="filename" class="text-gray-500 bg-gray-200 z-50">
                </span>
              </label>
            )}
        </div>
      </div>
      <div class="flex w-full pb-4">
        <div class="flex w-1/2 justify-center gap-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="#cc6d00"
              d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <g fill="none">
              <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
              <path
                fill="#cc6d00"
                d="M19 2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm-4 6H5v12h10zm-5 7a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2zm9-11H9v2h6a2 2 0 0 1 2 2v8h2zm-7 7a1 1 0 0 1 .117 1.993L12 13H8a1 1 0 0 1-.117-1.993L8 11z"
              />
            </g>
          </svg>
        </div>
        <div class={"flex w-1/2 justify-center"}>
          <span class={"text-white px-2 py-1 text-[20px]"}>
            OPTIMIZED PREVIEW
          </span>
          <div
            class={"flex items-center px-2 py-1 rounded-md"}
            style={{ border: "solid 1px green" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="green"
                d="M11 4h2v12l5.5-5.5l1.42 1.42L12 19.84l-7.92-7.92L5.5 10.5L11 16z"
              />
            </svg>
            <span class={"text-[green]"}>56.51%</span>
          </div>
        </div>
      </div>
      <div
        class={"bg-gray-800 w-[340px] px-4 py-4 rounded-lg"}
        style={{ border: "solid 1px gray" }}
      >
        <span class={"text-white text-[16px]"}>Optimization</span>
        <div class="flex flex-col mb-4 gap-4 pt-2">
          <div class={"flex items-center"}>
            <input
              id="default-radio-1"
              type="radio"
              name="radio"
              class="w-4 h-4 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-1"
              class="ms-2 text-sm font-medium text-white"
            >
              None
            </label>
          </div>
          <div class={"flex items-center"}>
            <input
              id="default-radio-2"
              type="radio"
              name="radio"
              class="w-4 h-4 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-2"
              class="ms-2 text-sm font-medium text-white"
            >
              Max compression
            </label>
          </div>
          <div class={"flex items-center"}>
            <input
              id="default-radio-2"
              type="radio"
              name="radio"
              class="w-4 h-4 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-2"
              class="ms-2 text-sm font-medium text-white"
            >
              Balanced
            </label>
          </div>
          <div class={"flex items-center"}>
            <input
              id="default-radio-2"
              type="radio"
              name="radio"
              class="w-4 h-4 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-2"
              class="ms-2 text-sm font-medium text-white"
            >
              Max quality
            </label>
          </div>
          <span class={"text-gray-400 pt-4"}>Note: There are no refunds</span>
          <span class={"text-gray-400"}>
            Only mint if the preview is of acceptable quality!
          </span>
          <span class={"text-gray-400"}>
            Sometimes it's ok to not optimize!
          </span>
        </div>
      </div>
      <div class={"w-[340px] flex flex-col gap-2 pt-4"}>
        <span class={"text-gray-400"}>
          EFFECTIVE FEE RATE: ${fee / 10} sat/vB
        </span>
        <div class="relative mb-6">
          <label for="labels-range-input" class="sr-only">Labels range</label>
          <input
            id="labels-range-input"
            type="range"
            value={fee}
            min="0"
            max="450"
            onInput={handleChangeFee}
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <span class="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 15 15"
            >
              <path
                fill="white"
                d="M10 1a1 1 0 1 0 0 2a1 1 0 0 0 0-2M8.145 2.994a.5.5 0 0 0-.348.143l-2.64 2.5a.5.5 0 0 0 .042.763L7 7.75v2.75c-.01.676 1.01.676 1 0v-3a.5.5 0 0 0-.2-.4l-.767-.577l1.818-1.72l.749.998A.5.5 0 0 0 10 6h1.5c.676.01.676-1.01 0-1h-1.25L9.5 4l-.6-.8a.5.5 0 0 0-.384-.206zM3 7a3 3 0 1 0 0 6a3 3 0 0 0 0-6m9 0a3 3 0 1 0 0 6a3 3 0 0 0 0-6M3 8a2 2 0 1 1 0 4a2 2 0 0 1 0-4m9 0a2 2 0 1 1 0 4a2 2 0 0 1 0-4"
              />
            </svg>
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400 absolute start-1/3 -translate-x-1/2 rtl:translate-x-1/2 -bottom-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.25em"
              height="1em"
              viewBox="0 0 640 512"
            >
              <path
                fill="white"
                d="M171.3 96H224v96H111.3l30.4-75.9C146.5 104 158.2 96 171.3 96M272 192V96h81.2c9.7 0 18.9 4.4 25 12l67.2 84zm256.2 1l-100-125c-18.2-22.8-45.8-36-75-36H171.3C132 32 96.7 55.9 82.2 92.3L40.6 196.4C16.8 205.8 0 228.9 0 256v112c0 17.7 14.3 32 32 32h33.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80h130.6c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H608c17.7 0 32-14.3 32-32v-48c0-65.2-48.8-119-111.8-127m-93.5 175a48 48 0 1 1 90.5 32a48 48 0 1 1-90.5-32M160 336a48 48 0 1 1 0 96a48 48 0 1 1 0-96"
              />
            </svg>
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400 absolute start-2/3 -translate-x-1/2 rtl:translate-x-1/2 -bottom-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 32 32"
            >
              <path
                fill="white"
                d="m19.67 8.11l-2.776 2.777l-3.837-.86c.362-.506.916-1.684.464-2.136c-.517-.516-1.978.28-2.304.605l-.913.913l-2.69-.604l-2.02 2.02l2.232 1.062l-.082.082l1.7 1.7l.69-.686l3.163 1.504L9.57 18.21H6.414l-1.137 1.138l3.6.948l1.83 1.83l.947 3.598l1.137-1.137V21.43l3.725-3.725l1.504 3.164l-.688.686l1.702 1.7l.08-.08l1.063 2.23l2.02-2.02l-.604-2.688l.912-.912c.326-.326 1.12-1.79.604-2.306c-.453-.452-1.63.1-2.136.464l-.86-3.838l2.776-2.777c.947-.948 3.6-4.863 2.62-5.84c-.977-.978-4.892 1.673-5.84 2.62z"
              />
            </svg>
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 512 512"
            >
              <path
                fill="white"
                d="M328.85 156.79a26.69 26.69 0 1 0 18.88 7.81a26.6 26.6 0 0 0-18.88-7.81"
              />
              <path
                fill="white"
                d="M477.44 50.06a.29.29 0 0 1 0-.09a20.4 20.4 0 0 0-15.13-15.3c-29.8-7.27-76.68.48-128.63 21.28c-52.36 21-101.42 52-134.58 85.22A320.7 320.7 0 0 0 169.55 175c-22.33-1-42 2.18-58.57 9.41c-57.74 25.41-74.23 90.44-78.62 117.14a25 25 0 0 0 27.19 29h.13l64.32-7.02c.08.82.17 1.57.24 2.26a34.36 34.36 0 0 0 9.9 20.72l31.39 31.41a34.27 34.27 0 0 0 20.71 9.91l2.15.23l-7 64.24v.13A25 25 0 0 0 206 480a25.25 25.25 0 0 0 4.15-.34C237 475.34 302 459.05 327.34 401c7.17-16.46 10.34-36.05 9.45-58.34a314.78 314.78 0 0 0 33.95-29.55c33.43-33.26 64.53-81.92 85.31-133.52c20.69-51.36 28.48-98.59 21.39-129.53M370.38 224.94a58.77 58.77 0 1 1 0-83.07a58.3 58.3 0 0 1 0 83.07"
              />
              <path
                fill="white"
                d="M161.93 386.44a16 16 0 0 0-11 2.67c-6.39 4.37-12.81 8.69-19.29 12.9c-13.11 8.52-28.79-6.44-21-20l12.15-21a16 16 0 0 0-15.16-24.91A61.25 61.25 0 0 0 72 353.56c-3.66 3.67-14.79 14.81-20.78 57.26A357.94 357.94 0 0 0 48 447.59A16 16 0 0 0 64 464h.4a359.87 359.87 0 0 0 36.8-3.2c42.47-6 53.61-17.14 57.27-20.8a60.49 60.49 0 0 0 17.39-35.74a16 16 0 0 0-13.93-17.82"
              />
            </svg>
          </span>
        </div>
        <span class={"text-gray-400"}>RECOMMENDED: $15 sat/vB</span>
      </div>
      <div class={"text-gray-200 w-[340px] text-left pt-4 pb-2"}>
        ASSET ISSUANCE
      </div>
      <div
        class={"flex w-[340px] bg-gray-700 rounded-sm"}
        style={{ border: "solid 1px gray" }}
      >
        <div class={"w-5/6 p-2 text-white"}>{inssuance}</div>
        <div
          class={"w-1/12 flex items-center justify-center p-1 cursor-pointer"}
          style={{ borderLeft: "solid 1px gray" }}
          onClick={() => handleDecrease()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <path fill="white" d="M19 12.998H5v-2h14z" />
          </svg>
        </div>
        <div
          class={"w-1/12 flex items-center justify-center p-1 cursor-pointer"}
          style={{ borderLeft: "solid 1px gray" }}
          onClick={() => handleIncrease()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <path fill="white" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z" />
          </svg>
        </div>
      </div>
      <div class={"flex text-gray-200 w-[340px] justify-between py-4"}>
        <span>Total Estimated</span>
        <div class={"flex gap-1"}>
          <span>0.001139</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="#ffa000"
              d="M14.24 10.56c-.31 1.24-2.24.61-2.84.44l.55-2.18c.62.18 2.61.44 2.29 1.74m-3.11 1.56l-.6 2.41c.74.19 3.03.92 3.37-.44c.36-1.42-2.03-1.79-2.77-1.97m10.57 2.3c-1.34 5.36-6.76 8.62-12.12 7.28S.963 14.94 2.3 9.58A9.996 9.996 0 0 1 14.42 2.3c5.35 1.34 8.61 6.76 7.28 12.12m-7.49-6.37l.45-1.8l-1.1-.25l-.44 1.73c-.29-.07-.58-.14-.88-.2l.44-1.77l-1.09-.26l-.45 1.79c-.24-.06-.48-.11-.7-.17l-1.51-.38l-.3 1.17s.82.19.8.2c.45.11.53.39.51.64l-1.23 4.93c-.05.14-.21.32-.5.27c.01.01-.8-.2-.8-.2L6.87 15l1.42.36c.27.07.53.14.79.2l-.46 1.82l1.1.28l.45-1.81c.3.08.59.15.87.23l-.45 1.79l1.1.28l.46-1.82c1.85.35 3.27.21 3.85-1.48c.5-1.35 0-2.15-1-2.66c.72-.19 1.26-.64 1.41-1.62c.2-1.33-.82-2.04-2.2-2.52"
            />
          </svg>
        </div>
      </div>
      <div
        class={"text-white font-bold rounded-md py-2 px-4 bg-yellow-700 cursor-pointer"}
        onClick={handleMint}
      >
        Mint Stamp
      </div>
    </div>
  );
}
