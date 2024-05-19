import { useEffect, useState } from "preact/hooks";
import { convertToEmoji } from "utils/util.ts";

interface SRC20TickHeaderProps {
  deployment: any;
  mint_status: any;
  total_holders: number;
  total_mints: number;
  total_sends: number;
}

export const UploadTickHeader = (props: SRC20TickHeaderProps) => {
  const { deployment, mint_status, total_holders, total_mints, total_sends } =
    props;

  const [file, setFile] = useState<any>(null);
  const [dimension, setDimension] = useState<any>({ w: 0, h: 0 });

  const toBase64 = (file: any) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const getImageBlobFromUrl = async (url: any) => {
    const fetchedImageData = await fetch(url);
    const blob = await fetchedImageData.blob();
    return blob;
  };

  const handleImage = (e: any) => {
    const tmp = document.createElement("img");
    tmp.onload = function () {
      const width = tmp.width;
      const height = tmp.height;
      console.log(tmp.width, tmp.height);
      if (width === 420 && height === 420) {
        if (
          e.target.files[0].type === "image/png" ||
          e.target.files[0].type === "image/jpeg" ||
          e.target.files[0].type === "image/gif"
        ) {
          setFile(e.target.files[0]);
          setDimension({ w: width, h: height });
        } else {
          alert("Image type is not correct(png, jpeg, gif)");
        }
      } else {
        alert("Image size is not correct(420 x 420)");
      }
    };
    const reader = new FileReader();
    reader.onloadend = function (ended) {
      tmp.src = ended.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
    tmp.remove();
  };

  const copyImage = async () => {
    const blob = await getImageBlobFromUrl(URL.createObjectURL(file));
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  };

  return (
    <>
      <div class="flex w-full flex-col md:flex-row gap-4 items-center justify-center">
        <div className={"flex w-full md:w-2/5   flex-col"}>
          {!file
            ? (
              <img
                src={`/content/${deployment.tx_hash}.svg`}
                class="rounded-lg h-full"
              />
            )
            : (
              <div
                id="image-preview"
                class="relative max-w-sm p-6 border-dashed border-2 border-gray-400 rounded-lg items-center mx-auto text-center cursor-pointer w-[384px] h-[384px] content-center bg-gray-800"
              >
                {file !== null && (
                  <img
                    width={420}
                    height={420}
                    style={{
                      objectFit: "contain",
                      imageRendering: "pixelated",
                      backgroundColor: "rgb(0,0,0)",
                    }}
                    src={URL.createObjectURL(file)}
                  />
                )}
              </div>
            )}

          <div class="flex justify-center gap-8 pt-2">
            <div>
              <input
                id="upload"
                type="file"
                class="hidden"
                accept="image/*"
                onChange={handleImage}
              />
              <label for="upload" className={"cursor-pointer"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  fill="none"
                  stroke="#cc6d00"
                  class="w-8 h-8 text-gray-200 mx-auto mb-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </label>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              class={"cursor-pointer"}
              onClick={copyImage}
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
        </div>
        <div class="relative w-full md:w-3/5 overflow-x-auto flex flex-col gap-8 text-white">
          <div class="flex flex-col gap-5">
            <p class="text-5xl uppercase">{convertToEmoji(deployment.tick)}</p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam,
            </p>
          </div>
          <hr />
          <div class="flex flex-col gap-5">
            <p class="text-[#03A606] text-2xl font-semibold">Properties</p>
            <div class="flex justify-between">
              <div class="w-1/5 flex items-center justify-start">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_holders}</p>
                  <p class="text-base">Total Holders</p>
                </div>
              </div>
              <div class="border-r border-[#ffffff49]"></div>
              <div class="w-2/5 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_mints}</p>
                  <p class="text-base">Total Mints</p>
                </div>
              </div>
              <div class="border-r border-[#ffffff49]"></div>
              <div class="w-2/5 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_sends}</p>
                  <p class="text-base">Total Sends</p>
                </div>
              </div>
              <div class="border-r border-[#ffffff49]"></div>
              <div class="w-1/5 flex items-center justify-end">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">
                    {total_sends + total_mints}
                  </p>
                  <p class="text-base">TXs</p>
                </div>
              </div>
            </div>
          </div>
          <hr />
          <div class="flex flex-col gap-5">
            <p class="text-[#03A606] text-2xl font-semibold">Others</p>
            <div class="flex justify-between">
              <div class="w-1/3 flex items-center justify-start">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">
                    {convertToEmoji(deployment.tick)}
                  </p>
                  <p class="text-base">Tick</p>
                </div>
              </div>
              <div class="border-r border-[#ffffff49]"></div>
              <div class="w-2/5 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{deployment.block_index}</p>
                  <p class="text-base">Block</p>
                </div>
              </div>
              <div class="border-r border-[#ffffff49]"></div>
              <div class="w-1/3 flex items-center justify-end">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">
                    {new Date(deployment.block_time).toLocaleString("default", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p class="text-base">Time</p>
                </div>
              </div>
            </div>
            <div class="flex justify-between">
              <div class="w-1/3 flex items-center justify-start">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{deployment.max}</p>
                  <p class="text-base">Total Supply</p>
                </div>
              </div>
              <div class="border-r border-[#ffffff49]"></div>
              <div class="w-2/5 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_holders}</p>
                  <p class="text-base">Total Holders</p>
                </div>
              </div>
              <div class="border-r border-[#ffffff49]"></div>
              <div class="w-1/3 flex items-center justify-end">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{mint_status.progress}%</p>
                  <p class="text-base">Total minted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
