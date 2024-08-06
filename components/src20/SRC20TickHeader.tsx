import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { convertToEmoji } from "utils/util.ts";

interface SRC20TickHeaderProps {
  deployment: any;
  mint_status: any;
  total_holders: number;
  total_mints: number;
  total_sends: number;
}
export const SRC20TickHeader = (props: SRC20TickHeaderProps) => {
  const { deployment, mint_status, total_holders, total_mints, total_sends } =
    props;
  return (
    <>
      <div class="flex justify-between items-end gap-6 border-b-2 pb-3 border-[#3F2A4E]">
        <div className="text-xl text-[#7A00F5] font-medium flex gap-1 items-center">
          <img src="/img/icon_arrow_left.png" alt="" className="w-5 h-10" />
          <p className="uppercase">
            SRC20 {">"} {convertToEmoji(deployment.tick)}
          </p>
        </div>
        <StampSearchClient />
      </div>
      <div class="flex w-full flex-col md:flex-row gap-20 items-center justify-between">
        <img
          src={`/content/${deployment.tx_hash}.svg`}
          class="w-full md:w-2/5 h-full rounded-lg"
        />

        <div class="relative w-full md:w-3/5 overflow-x-auto flex flex-col gap-8 text-white">
          <div class="flex flex-col gap-3">
            <p class="text-5xl uppercase text-[#7A00F5]">
              {convertToEmoji(deployment.tick)}
            </p>
            <p>
            </p>
          </div>
          <hr class="border-[#3F2A4E] border-2" />
          <div class="flex flex-col gap-3">
            <p class="text-[#7A00F5] text-2xl font-semibold">Properties</p>
            <div class="flex justify-between">
              <div class="flex items-center justify-start">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_holders}</p>
                  <p class="text-base">Total Holders</p>
                </div>
              </div>
              <div class="flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_mints}</p>
                  <p class="text-base">Total Mints</p>
                </div>
              </div>
              <div class="flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_sends}</p>
                  <p class="text-base">Total Sends</p>
                </div>
              </div>
              <div class="flex items-center justify-end">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">
                    {total_sends + total_mints}
                  </p>
                  <p class="text-base">TXs</p>
                </div>
              </div>
            </div>
          </div>
          <hr class="border-[#3F2A4E] border-2" />
          <div class="flex flex-col gap-3">
            <p class="text-[#7A00F5] text-2xl font-semibold">Others</p>
            <div class="flex justify-between">
              <div class="w-1/3 flex items-center justify-start">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">
                    {convertToEmoji(deployment.tick)}
                  </p>
                  <p class="text-base">Tick</p>
                </div>
              </div>
              <div class="border-r border-[#3F2A4E] border-2"></div>
              <div class="w-2/5 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{deployment.block_index}</p>
                  <p class="text-base">Block</p>
                </div>
              </div>
              <div class="border-r border-[#3F2A4E] border-2"></div>
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
              <div class="border-r border-[#3F2A4E] border-2"></div>
              <div class="w-2/5 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_holders}</p>
                  <p class="text-base">Total Holders</p>
                </div>
              </div>
              <div class="border-r border-[#3F2A4E] border-2"></div>
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
