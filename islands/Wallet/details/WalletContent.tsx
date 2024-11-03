import { useEffect, useState } from "preact/hooks";
import StampingMintingItem from "$islands/stamping/src20/mint/StampingMintingItem.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { Search } from "$islands/datacontrol/Search.tsx";
import { abbreviateAddress } from "$lib/utils/util.ts";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Setting } from "$islands/datacontrol/Setting.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import WalletTransferModal from "$islands/Wallet/details/WalletTransferModal.tsx";
import { SRC20DeployTable } from "$islands/src20/all/SRC20DeployTable.tsx";
import StampSection from "$islands/stamp/StampSection.tsx";
import { StampRow } from "globals";

interface WalletContentProps {
  stamps: {
    data: StampRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  src20: {
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  showItem: string;
  address: string;
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
  "tx_hash": "coming soon",
  "block_index": 851464,
  "source": "bc1q5enuu0mz6rl900uvgfvz6leeud0kzx9czkrycm",
  "cpid": "STAMP",
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
    isOpenSetting = false,
    handleOpenSetting = () => {},
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
    isOpenSetting: boolean;
    handleOpenSetting: (open: boolean) => void;
    handleOpenFilter: (open: boolean) => void;
    handleOpen: (type: string) => void;
  },
) => {
  return (
    <div class="flex flex-row justify-between items-center gap-3 w-full">
      <div class="flex gap-6 tablet:gap-8 items-end">
        <p class="cursor-pointer pb-1 tablet:pb-3 text-2xl tablet:text-4xl desktop:text-5xl uppercase text-[#8800CC] font-light">
          {title}
        </p>
      </div>
      <div class="flex gap-3 justify-between h-[40px]">
        {setting && (
          <Setting
            initFilter={[]}
            open={isOpenSetting}
            handleOpen={handleOpenSetting}
            filterButtons={[
              "Transfer",
            ]}
          />
        )}
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
      <div class="hidden desktop:flex flex-col gap-6 p-2">
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
                        {dispenser.give_remaining}/{dispenser.escrow_quantity}
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
      <div class="flex desktop:hidden flex-col gap-3 p-2">
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
                    <p className="text-base text-[#8800CC] font-light text-ellipsis overflow-hidden tablet:w-full max-w-48">
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

function WalletContent(
  { stamps, src20, address, showItem }: WalletContentProps,
) {
  const [filterBy, setFilterBy] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("ASC");
  const [openS, setOpenS] = useState<boolean>(false);
  const [openT, setOpenT] = useState<boolean>(false);
  const [openD, setOpenD] = useState<boolean>(false);
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  const [openSettingModal, setOpenSettingModal] = useState<boolean>(false);
  const [currentStampsPage, setCurrentStampsPage] = useState(
    stamps.pagination.page,
  );
  const [currentSrc20Page, setCurrentSrc20Page] = useState(1);

  const handleOpenSettingModal = () => {
    setOpenSettingModal(!openSettingModal);
  };

  const handleOpenSetting = () => {
    setOpenSetting(!openSetting);
  };

  const handleCloseSettingModal = () => {
    setOpenSettingModal(false);
  };

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

  useEffect(() => {
    // Get the current URL
    const currentUrl = globalThis.location.href;

    // Create a URL object
    const url = new URL(currentUrl);

    // Use URLSearchParams to get the filterBy parameter
    const params = new URLSearchParams(url.search);
    const filterByValue = params.get("filterBy") || "";

    // Set the filterBy state
    if (filterByValue == "Transfer") {
      setOpenSettingModal(true);
    }
  }, []);

  const handleStampsPageChange = async (page: number) => {
    try {
      const response = await fetch(
        `/api/v2/stamps/balance/${address}?page=${page}&limit=${stamps.pagination.limit}`, // FIXME: need to handle src20 pagination separately
      );
      const data = await response.json();
      // Update stamps data in state
      setCurrentStampsPage(page);
      // You'll need to implement state management here to update the stamps data
    } catch (error) {
      console.error("Error fetching stamps page:", error);
    }
  };

  const handleSrc20PageChange = async (page: number) => {
    try {
      // Use the src20-specific endpoint
      const response = await fetch(
        `/api/v2/src20/balance/${address}?page=${page}&limit=${src20.pagination.limit}`,
      );
      const data = await response.json();
      // Update src20 data
    } catch (error) {
      console.error("Error fetching src20 page:", error);
    }
  };

  const stampSection = {
    title: "", // Empty title means no header
    type: "all",
    stamps: stamps.data,
    layout: "grid",
    showDetails: false,
    gridClass: `
      grid w-full
      gap-[12px]
      mobileSm:gap-[12px]
      mobileLg:gap-[24px]
      tablet:gap-[24px]
      desktop:gap-[12px]
      grid-cols-2
      mobileSm:grid-cols-4
      mobileLg:grid-cols-6
      tablet:grid-cols-6
      desktop:grid-cols-8
      auto-rows-fr
    `,
    pagination: {
      page: currentStampsPage,
      pageSize: stamps.pagination.limit,
      total: stamps.pagination.total,
      onPageChange: handleStampsPageChange,
    },
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
          isOpenSetting={openSetting}
          handleOpenSetting={handleOpenSetting}
        />
        <StampSection {...stampSection} />
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
          <SRC20DeployTable
            data={src20.data}
          />
          {
            /* {src20.map((src20Item, index) => (
            <StampingMintingItem
              key={index}
              src20={src20Item}
            />
          ))} */
          }
        </div>
      </div>

      {/* Listening Pagination */}
      {src20.data.length && (
        <Pagination
          page={1}
          page_size={8}
          key="Token"
          type="Token_id"
          data_length={8}
          pages={src20.data.length / 8}
        />
      )}

      <div className="mt-48">
        <ItemHeader
          title="LISTINGS"
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
      {openSettingModal &&
        (
          <WalletTransferModal
            toggleModal={handleOpenSettingModal}
            handleCloseModal={handleCloseSettingModal}
          />
        )}
    </>
  );
}

export default WalletContent;
