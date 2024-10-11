import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";
import { convertToEmoji } from "utils/util.ts";
import { useState } from "preact/hooks";

interface SRC20TickHeaderProps {
  deployment: any;
  mint_status: any;
  total_holders: number;
  total_mints: number;
  total_transfers: number;
}

export function SRC20TickHeader(props: SRC20TickHeaderProps) {
  const {
    deployment = {},
    mint_status = {},
    total_holders = 0,
    total_mints = 0,
    total_transfers = 0,
  } = props;

  const tickValue = deployment.tick ? convertToEmoji(deployment.tick) : "N/A";

  // Add state for the search component
  const [isOpen2, setIsOpen2] = useState(false);

  const handleOpen2 = (open: boolean) => {
    setIsOpen2(open);
  };

  return (
    <>
      <div class="flex justify-between items-end gap-6 border-b-2 pb-3 border-[#3F2A4E]">
        <div className="text-xl text-[#7A00F5] font-medium flex gap-1 items-center">
          <img src="/img/icon_arrow_left.png" alt="" className="w-5 h-10" />
          <p className="uppercase">
            SRC20 {">"} {tickValue}
          </p>
        </div>
        <SRC20SearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
      <div class="flex w-full flex-col md:flex-row items-start gap-10 md:gap-20">
        <div
          className={"w-full md:w-1/2 flex gap-6 p-6 bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF]"}
        >
          <img
            src={`/content/${deployment.tx_hash}.svg`}
            class="max-w-[135px] rounded-lg"
          />
          <div class="flex flex-col gap-3">
            <p class="text-3xl md:text-6xl uppercase font-black text-[#660099]">
              {tickValue}
            </p>
            <p class="text-sm text-[#CCCCCC] font-medium">
              This is an SRC-20 token, there are many like it, but this one is
              {" "}
              {deployment.tick.toUpperCase()}. This was deployed on block{" "}
              {deployment.block_index}{" "}
              without a description on the deploy. We hope you enjoy.
            </p>
          </div>
        </div>

        <div class="relative w-full md:w-1/2 overflow-x-auto flex flex-col gap-8 text-white bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6">
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
                  <p class="text-2xl font-semibold">{total_transfers}</p>
                  <p class="text-base">Total Transfers</p>
                </div>
              </div>
              <div class="flex items-center justify-end">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">
                    {total_transfers + total_mints}
                  </p>
                  <p class="text-base">TXs</p>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <p class="text-[#7A00F5] text-2xl font-semibold">Others</p>
            <div class="flex justify-between">
              <div class="w-1/3 flex items-center justify-start">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">
                    {tickValue}
                  </p>
                  <p class="text-base">Tick</p>
                </div>
              </div>
              <div class="border-r border-[#3F2A4E] border-2"></div>
              <div class="w-1/3 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{deployment.block_index}</p>
                  <p class="text-base">Deploy Block</p>
                </div>
              </div>
              <div class="border-r border-[#3F2A4E] border-2"></div>
              <div class="w-1/3 flex items-center justify-end">
                <div class="flex flex-col items-end">
                  <p class="text-2xl font-semibold">
                    {new Date(deployment.block_time).toLocaleString("default", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p class="text-base">Deploy Date</p>
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
              <div class="w-1/3 flex items-center justify-center">
                <div class="flex flex-col">
                  <p class="text-2xl font-semibold">{total_holders}</p>
                  <p class="text-base">Total Holders</p>
                </div>
              </div>
              <div class="border-r border-[#3F2A4E] border-2"></div>
              <div class="w-1/3 flex items-center justify-end">
                <div class="flex flex-col items-end">
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
}