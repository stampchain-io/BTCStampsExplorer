import { useState } from "preact/hooks";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import StampingMintingItem from "$islands/stamping/src20/mint/StampingMintingItem.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { Search } from "$islands/datacontrol/Search.tsx";
import { abbreviateAddress } from "$lib/utils/util.ts";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Setting } from "$islands/datacontrol/Setting.tsx";

interface WalletContentProps {
  stamps: any[];
  src20: any[];
  showItem: string;
}

interface DispenserProps {
  source: string;
  give_remaining: number;
  escrow_quantity: number;
  give_quantity: number;
  satoshirate: number;
  confirmed: boolean;
  close_block_index: number;
}

interface DispensersProps {
  dispenser: DispenserProps[];
}

const dispensers = [{
  "tx_hash": "a22c9d9b6f501372f10e774cb59fb552b6e9b6fd13968d85e5ed1070d6e17788",
  "block_index": 851464,
  "source": "bc1q5enuu0mz6rl900uvgfvz6leeud0kzx9czkrycm",
  "cpid": "A884818687298258698",
  "give_quantity": 1,
  "give_remaining": 1,
  "escrow_quantity": 1,
  "satoshirate": 174174,
  "btcrate": 0.00174174,
  "origin": "bc1qk5tgfjs6ysazwz5gyn53tx9uwe8qglnj9u73am",
  "confirmed": true,
  "close_block_index": null,
}];

const ItemHeader = (
  {
    title = "STAMP",
    sortBy = "ASC",
    isOpen = false,
    handleOpen = () => {},
    isOpenFilter = false,
    handleOpenFilter = () => {},
    sort = true,
    search = true,
    filter = true,
    setting = false,
  }: {
    title: string;
    sortBy: string;
    isOpen: boolean;
    sort: boolean;
    search: boolean;
    filter: boolean;
    setting: boolean;
    isOpenFilter: boolean;
    handleOpenFilter: (open: boolean) => void;
    handleOpen: (type: string) => void;
  },
) => {
  return (
    <div class="flex flex-row justify-between items-center gap-3 w-full">
      <div class="flex gap-6 md:gap-8 items-end">
        <p class="cursor-pointer pb-1 md:pb-3 text-2xl md:text-4xl xl:text-5xl uppercase text-[#8800CC] font-light">
          {title}
        </p>
      </div>
      <div class="flex gap-3 justify-between h-[40px]">
        {setting && <Setting />}
        {filter && (
          <Filter
            initFilter={[]}
            open={isOpenFilter}
            handleOpen={handleOpenFilter}
            filterButtons={[
              "all",
              "psbt",
              "dispensers",
            ]}
          />
        )}
        {sort && <Sort initSort={sortBy} />}
        {search && (
          <Search
            open={isOpen}
            handleOpen={() => handleOpen(title)}
            placeholder="Stamp Name, Stamp Hash, or Address"
            searchEndpoint="/wallet/search?q="
            onResultClick={() => {}}
            resultDisplay={(result) => {
              console.log(result);
            }}
          />
        )}
      </div>
    </div>
  );
};

function DispenserItem() {
  return (
    <div class="relative shadow-md">
      {/* Desktop View */}
      <div class="hidden xl:flex flex-col gap-6 p-2">
        {dispensers.map((dispenser) => {
          // Ensure src20.tick is defined
          return (
            <div class="bg-gradient-to-br from-transparent from-0% via-[#14001F] to-[#1F002E] text-sm flex justify-between rounded-md hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]">
              <div class="p-3 uppercase cursor-pointer flex gap-6 w-full">
                <img
                  src={`/content/${dispenser.tx_hash}.svg`}
                  class="w-[134px] h-[134px]"
                />
                <div className="flex flex-col  w-full">
                  <div className="flex flex-col justify-between  w-full">
                    <a
                      href="#"
                      className="text-3xl text-[#666666] font-bold hover:text-[#AA00FF] uppercase flex gap-4"
                    >
                      {`#${dispenser.block_index}`}
                    </a>
                  </div>

                  <div className="flex justify-between flex-row  w-full">
                    <p className="text-base text-[#8800CC] font-light text-ellipsis overflow-hidden">
                      <span className="font-bold text-[#8800CC] text-base">
                        {dispenser.origin
                          ? dispenser.origin
                          : abbreviateAddress(dispenser.origin)}
                      </span>
                    </p>
                    <div className="flex flex-row gap-1">
                      <img
                        src="/img/wallet/icon-copy.svg"
                        className="w-6 h-6 cursor-pointer"
                        alt="Copy"
                      />
                      <img
                        src="/img/wallet/icon-history.svg"
                        className="w-6 h-6 cursor-pointer"
                        alt="History"
                      />
                    </div>
                  </div>
                  <div class="text-center flex justify-between">
                    <p className="text-lg text-[#666666] font-light">
                      GIVE{" "}
                      <span className="font-bold text-[#999999]">
                        {Number(dispenser.give_quantity).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p className="text-lg text-[#666666] font-light">
                      QUANTITY{" "}
                      <span className="font-bold text-[#999999]">
                        {dispenser.escrow_quantity}
                      </span>
                    </p>
                    <p className="text-[#666666] text-lg">
                      VALUE
                    </p>
                  </div>
                  <div className="flex flex-row justify-between  w-full">
                    <p className="text-base text-[#666666] font-light">
                      PRICE{" "}
                      <span className="font-bold text-[#999999]">
                        {`${Number(dispenser.btcrate).toLocaleString()} BTC`}
                      </span>
                    </p>
                    <p className="text-base text-[#666666] font-light">
                      {Number(dispenser.btcrate).toLocaleString()}{" "}
                      <span className="font-bold text-[#999999]">
                        BTC
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile View */}
      <div class="flex xl:hidden flex-col gap-3 p-2">
        {dispensers.map((dispenser) => {
          // Ensure src20.tick is defined
          return (
            <div class="bg-gradient-to-br from-transparent from-0% via-[#14001F] to-[#1F002E] text-sm flex justify-between rounded-md hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]">
              <div class="p-3 uppercase cursor-pointer flex gap-6 w-full">
                <img
                  src={`/content/${dispenser.tx_hash}.svg`}
                  class="w-[117px] h-[117px]"
                />
                <div className="flex flex-col  w-full">
                  <div className="flex flex-col justify-between  w-full">
                    <a
                      href="#"
                      className="text-3xl text-[#666666] font-bold hover:text-[#AA00FF] uppercase flex gap-4"
                    >
                      {`#${dispenser.block_index}`}
                    </a>
                  </div>

                  <div className="flex justify-between flex-row  w-full">
                    <p className="text-base text-[#8800CC] font-light text-ellipsis overflow-hidden md:w-full max-w-48">
                      <span className="font-bold text-[#8800CC] text-base w-full">
                        {dispenser.origin
                          ? dispenser.origin
                          : abbreviateAddress(dispenser.origin)}
                      </span>
                    </p>
                    <div className="flex flex-row gap-1">
                      <img
                        src="/img/wallet/icon-copy.svg"
                        className="w-6 h-6 cursor-pointer"
                        alt="Copy"
                      />
                      <img
                        src="/img/wallet/icon-history.svg"
                        className="w-6 h-6 cursor-pointer"
                        alt="History"
                      />
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <p className="text-lg text-[#666666] font-light">
                      GIVE{" "}
                      <span className="font-bold text-[#999999]">
                        {Number(dispenser.give_quantity).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p className="text-lg text-[#666666] font-light">
                      QUANTITY{" "}
                      <span className="font-bold text-[#999999]">
                        XXXX/XXXX
                      </span>
                    </p>
                    <p className="text-[#666666] text-lg">
                      VALUE
                    </p>
                  </div>
                  <div className="flex flex-row justify-between  w-full">
                    <p className="text-base text-[#666666] font-light">
                      PRICE{" "}
                      <span className="font-bold text-[#999999]">
                        {`${Number(dispenser.btcrate).toLocaleString()} BTC`}
                      </span>
                    </p>
                    <p className="text-base text-[#666666] font-light">
                      {Number(dispenser.btcrate).toLocaleString()}{" "}
                      <span className="font-bold text-[#999999]">
                        BTC
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WalletContent({ stamps, src20, showItem }: WalletContentProps) {
  const [sortBy, setSortBy] = useState<string>("ASC");
  const [openS, setOpenS] = useState<boolean>(false);
  const [openT, setOpenT] = useState<boolean>(false);
  const [openD, setOpenD] = useState<boolean>(false);
  const [openFilter, setOpenFilter] = useState<boolean>(false);

  const handleOpenFilter = () => {
    setOpenFilter(!openFilter);
  };

  const handleOpen = (type: string) => {
    if (type == "STAMP") {
      setOpenS(!openS);
    } else if (type == "TOKENS") {
      setOpenT(!openT);
    } else {
      setOpenD(!openD);
    }
  };
  return (
    <>
      <div>
        <ItemHeader
          sortBy={sortBy}
          isOpen={openS}
          handleOpen={handleOpen}
          filter={false}
          setting={true}
        />
        <div className="grid grid-cols-4 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 mt-6">
          {stamps.map((stamp, index) => (
            <StampCard
              key={index}
              stamp={stamp}
              kind="stamp"
              isRecentSale={false}
              showInfo={false}
              showDetails={true}
            />
          ))}
        </div>
      </div>

      <div className="mt-48">
        <ItemHeader
          title="TOKENS"
          sortBy={sortBy}
          isOpen={openT}
          filter={false}
          handleOpen={handleOpen}
        />
        <div className="mt-6">
          {src20.map((src20Item, index) => (
            <StampingMintingItem
              key={index}
              src20={src20Item}
            />
          ))}
        </div>
      </div>
      <div className="mt-48">
        <ItemHeader
          title="Listening"
          sortBy={sortBy}
          isOpen={openD}
          handleOpen={handleOpen}
          sort={true}
          filter={true}
          search={true}
          isOpenFilter={openFilter}
          handleOpenFilter={handleOpenFilter}
        />
        <div className="mt-6">
          <DispenserItem />
        </div>
      </div>
    </>
  );
}

export default WalletContent;
