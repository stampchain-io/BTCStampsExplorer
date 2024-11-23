import { useEffect, useState } from "preact/hooks";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { Search } from "$islands/datacontrol/Search.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Setting } from "$islands/datacontrol/Setting.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import WalletTransferModal from "$islands/Wallet/details/WalletTransferModal.tsx";
import { SRC20Section } from "$islands/src20/SRC20Section.tsx";
import StampSection from "$islands/stamp/StampSection.tsx";
import { StampRow } from "globals";
import { Dispenser } from "$types/index.d.ts";
import { formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
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
  dispensers?: Dispenser[];
  showItem: string;
  address: string;
}

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
        <p class="cursor-pointer pb-1 tablet:pb-3 text-2xl tablet:text-4xl desktop:text-5xl uppercase text-stamp-primary font-extralight">
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

function DispenserItem({ dispensers = [] }: { dispensers?: Dispenser[] }) {
  // If no dispensers, show empty state
  if (!dispensers?.length) {
    return (
      <div class="text-center text-stamp-grey-darker p-6">
        No listings found
      </div>
    );
  }

  // Filter dispensers to only include those with stamp data, then split into open/closed
  const dispensersWithStamps = dispensers.filter((d) => d.stamp);
  const openDispensers = dispensersWithStamps.filter((d) =>
    d.give_remaining > 0
  );
  const closedDispensers = dispensersWithStamps.filter((d) =>
    d.give_remaining === 0
  );

  // If no dispensers with stamps, show empty state
  if (!dispensersWithStamps.length) {
    return (
      <div class="text-center text-stamp-grey-darker p-6">
        No Listings Found
      </div>
    );
  }

  return (
    <div class="relative shadow-md">
      {/* Desktop View */}
      <div class="hidden desktop:flex flex-col gap-6 p-2">
        {/* Open Dispensers Section */}
        {openDispensers.length > 0 && (
          <div class="mb-8">
            <h3 class="text-xl text-stamp-grey-darker mb-4">OPEN LISTINGS</h3>
            <div class="flex flex-col gap-6">
              {openDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="desktop" />
              ))}
            </div>
          </div>
        )}

        {/* Closed Dispensers Section */}
        {closedDispensers.length > 0 && (
          <div>
            <h3 class="text-xl text-stamp-grey-darker mb-4">CLOSED LISTINGS</h3>
            <div class="flex flex-col gap-6">
              {closedDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="desktop" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div class="flex desktop:hidden flex-col gap-3 p-2">
        {/* Open Dispensers Section */}
        {openDispensers.length > 0 && (
          <div class="mb-8">
            <h3 class="text-xl text-stamp-grey-darker mb-4">OPEN LISTINGS</h3>
            <div class="flex flex-col gap-6">
              {openDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="mobile" />
              ))}
            </div>
          </div>
        )}

        {/* Closed Dispensers Section */}
        {closedDispensers.length > 0 && (
          <div>
            <h3 class="text-xl text-stamp-grey-darker mb-4">CLOSED LISTINGS</h3>
            <div class="flex flex-col gap-6">
              {closedDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="mobile" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DispenserRow(
  { dispenser, view }: { dispenser: Dispenser; view: "mobile" | "desktop" },
) {
  const imageSize = view === "desktop"
    ? "w-[134px] h-[134px]"
    : "w-[117px] h-[117px]";

  return (
    <div class="bg-gradient-to-br from-transparent from-0% via-[#14001F] to-[#1F002E] text-sm flex justify-between rounded-md hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE]">
      <div class="p-3 uppercase cursor-pointer flex gap-6 w-full">
        <a
          href={`/stamp/${dispenser.stamp.stamp}`}
          class={`${imageSize} relative`}
        >
          <div class="relative p-2 bg-[#1F002E] rounded-lg h-full">
            <div class="stamp-container h-full flex items-center justify-center">
              <div class="relative z-10 w-full h-full">
                <img
                  width="100%"
                  height="100%"
                  loading="lazy"
                  class="max-w-none w-full h-full object-contain rounded-lg pixelart stamp-image"
                  src={getStampImageSrc(dispenser.stamp)}
                  alt={`Stamp ${dispenser.stamp.stamp}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/img/stamp/not-available.png";
                  }}
                />
              </div>
            </div>
          </div>
        </a>
        <div class="flex flex-col w-full">
          <div class="flex flex-col justify-between w-full">
            <a
              href="#"
              class="text-3xl text-[#666666] font-bold hover:text-stamp-primary-hover uppercase flex gap-4"
            >
              {`#${dispenser.stamp.stamp}`}
            </a>
          </div>

          <div class="flex justify-between flex-row w-full">
            <p
              class={`text-base text-stamp-primary font-light text-ellipsis overflow-hidden ${
                view === "mobile" ? "tablet:w-full max-w-48" : ""
              }`}
            >
              <span class="font-bold text-stamp-primary text-base normal-case">
                {view === "mobile"
                  ? abbreviateAddress(dispenser.origin)
                  : dispenser.origin || abbreviateAddress(dispenser.origin)}
              </span>
            </p>
            <div class="flex flex-row gap-1">
              <img
                src="/img/wallet/icon-copy.svg"
                class="w-6 h-6 cursor-pointer"
                alt="Copy"
              />
              <img
                src="/img/wallet/icon-history.svg"
                class="w-6 h-6 cursor-pointer"
                alt="History"
              />
            </div>
          </div>
          <div class="text-center flex justify-between">
            <p class="text-base mobileLg:text-lg text-stamp-grey-darker font-light">
              GIVE{" "}
              <span class="font-bold text-stamp-grey">
                {Number(dispenser.give_quantity).toLocaleString()}
              </span>
            </p>
          </div>
          <div class="flex flex-row justify-between w-full">
            <p class="text-base mobileLg:text-lg text-stamp-grey-darker font-light">
              QUANTITY{" "}
              <span class="font-bold text-stamp-grey">
                {dispenser.give_remaining === 0
                  ? Number(dispenser.escrow_quantity).toLocaleString()
                  : `${Number(dispenser.give_remaining).toLocaleString()}/${
                    Number(dispenser.escrow_quantity).toLocaleString()
                  }`}
              </span>
            </p>
            <p
              class={`text-stamp-grey-darker text-lg ${
                view === "mobile" ? "hidden mobileLg:block" : ""
              }`}
            >
              VALUE
            </p>
          </div>
          <div class="flex flex-row justify-between w-full">
            <p class="text-base text-stamp-grey-darker font-light">
              PRICE{" "}
              <span class="font-bold text-stamp-grey">
                {formatBTCAmount(Number(dispenser.btcrate), {
                  includeSymbol: true,
                })}
              </span>
            </p>
            <p
              class={`text-base text-stamp-grey-darker font-light ${
                view === "mobile" ? "hidden mobileLg:block" : ""
              }`}
            >
              {formatBTCAmount(
                Number(dispenser.btcrate) * Number(dispenser.escrow_quantity),
                { includeSymbol: true },
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WalletContent(
  { stamps, src20, dispensers, address, showItem }: WalletContentProps,
) {
  const [filterBy, setFilterBy] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("ASC");
  const [openS, setOpenS] = useState<boolean>(false);
  const [openT, setOpenT] = useState<boolean>(false);
  const [openD, setOpenD] = useState<boolean>(false);
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  const [openSettingModal, setOpenSettingModal] = useState<boolean>(false);

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
      grid-cols-4
      mobileLg:grid-cols-6
      tablet:grid-cols-6
      desktop:grid-cols-8
      auto-rows-fr
    `,
    displayCounts: {
      "mobileSm": 16, // 4 columns x 4 rows
      "mobileLg": 24, // 6 columns x 4 rows
      "tablet": 24, // 6 columns x 4 rows
      "desktop": 32, // 8 columns x 4 rows
    },
    pagination: {
      page: stamps.pagination.page,
      pageSize: stamps.pagination.limit,
      total: stamps.pagination.total,
      prefix: "stamps",
    },
  };

  return (
    <>
      <div>
        <ItemHeader
          title="STAMPS"
          sortBy={sortBy}
          isOpen={openS}
          handleOpen={handleOpen}
          sort={true}
          search={true}
          filter={false}
          setting={true}
          isOpenFilter={false}
          isOpenSetting={openSetting}
          handleOpenFilter={() => {}}
          handleOpenSetting={handleOpenSetting}
        />
        <div class="mt-3 mobileLg:mt-6">
          <StampSection {...stampSection} />
        </div>
      </div>

      <div class="mt-48">
        <ItemHeader
          title="TOKENS"
          sortBy={sortBy}
          isOpen={openT}
          sort={true}
          search={true}
          filter={false}
          setting={false}
          isOpenFilter={false}
          isOpenSetting={false}
          handleOpen={handleOpen}
          handleOpenFilter={() => {}}
          handleOpenSetting={() => {}}
        />
        <div class="mt-3 mobileLg:mt-6">
          <SRC20Section
            type="all"
            data={src20.data}
          />
        </div>
      </div>

      {/* Listening Pagination */}
      {src20.data.length && (
        <Pagination
          page={src20.pagination.page}
          page_size={src20.pagination.limit}
          key="Token"
          type="Token_id"
          data_length={src20.pagination.total}
          pages={Math.ceil(src20.pagination.total / src20.pagination.limit)}
          prefix="src20"
        />
      )}

      <div class="mt-48">
        <ItemHeader
          title="LISTINGS"
          sortBy={sortBy}
          isOpen={openD}
          handleOpen={handleOpen}
          sort={true}
          filter={true}
          search={true}
          setting={false}
          isOpenFilter={openFilter}
          isOpenSetting={false}
          handleOpenFilter={handleOpenFilter}
          handleOpenSetting={() => {}}
        />
        <div class="mt-3 mobileLg:mt-6">
          <DispenserItem dispensers={dispensers || []} />
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
