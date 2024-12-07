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
  anchor: string;
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
      <div class="flex items-end">
        <p class="text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight">
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

function DispenserItem({
  dispensers = [],
  openPagination,
  closedPagination,
  onOpenPageChange,
  onClosedPageChange,
}: {
  dispensers?: Dispenser[];
  openPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  closedPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onOpenPageChange?: (page: number) => void;
  onClosedPageChange?: (page: number) => void;
}) {
  // If no dispensers, show empty state
  if (!dispensers?.length) {
    return (
      <div class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text">
        NO LISTINGS FOUND
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
      <div>
        <h3 class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text">
          NO LISTINGS FOUND
        </h3>
      </div>
    );
  }

  return (
    <div class="relative shadow-md">
      {/* MobileMd/Tablet/Desktop View */}
      <div class="hidden mobileLg:flex flex-col gap-6 -mt-6">
        {/* Open Dispensers Section */}
        {openDispensers.length > 0 && (
          <div id="open-listings-section">
            <h3 class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text mb-6">
              OPEN LISTINGS
            </h3>
            <div class="flex flex-col gap-6">
              {openDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="tablet" />
              ))}
            </div>
            {/* Open Listings Pagination */}
            {openPagination && openPagination.totalPages > 1 && (
              <div class="mt-6">
                <Pagination
                  page={openPagination.page}
                  totalPages={openPagination.totalPages}
                  onChange={onOpenPageChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Closed Dispensers Section */}
        {closedDispensers.length > 0 && (
          <div id="closed-listings-section">
            <h3 class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text mb-6">
              CLOSED LISTINGS
            </h3>
            <div class="flex flex-col gap-6">
              {closedDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="tablet" />
              ))}
            </div>
            {/* Closed Listings Pagination */}
            {closedPagination && closedPagination.totalPages > 1 && (
              <div class="mt-6">
                <Pagination
                  page={closedPagination.page}
                  totalPages={closedPagination.totalPages}
                  onChange={onClosedPageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* MobileSm/MobileMd View */}
      <div class="flex mobileLg:hidden flex-col gap-3">
        {/* Open Dispensers Section */}
        {openDispensers.length > 0 && (
          <div class="mb-8" id="open-listings-section">
            <h3 class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text mb-6">
              OPEN LISTINGS
            </h3>
            <div class="flex flex-col gap-6">
              {openDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="mobile" />
              ))}
            </div>
            {/* Open Listings Pagination (Mobile) */}
            {openPagination && openPagination.totalPages > 1 && (
              <div class="mt-6">
                <Pagination
                  page={openPagination.page}
                  totalPages={openPagination.totalPages}
                  onChange={onOpenPageChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Closed Dispensers Section */}
        {closedDispensers.length > 0 && (
          <div id="closed-listings-section">
            <h3 class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text mb-6">
              CLOSED LISTINGS
            </h3>
            <div class="flex flex-col gap-6">
              {closedDispensers.map((dispenser) => (
                <DispenserRow dispenser={dispenser} view="mobile" />
              ))}
            </div>
            {/* Closed Listings Pagination (Mobile) */}
            {closedPagination && closedPagination.totalPages > 1 && (
              <div class="mt-6">
                <Pagination
                  page={closedPagination.page}
                  totalPages={closedPagination.totalPages}
                  onChange={onClosedPageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DispenserRow(
  /* mobile = mobileSm/Md // tablet = mobileLg/tablet/desktop */
  { dispenser, view }: { dispenser: Dispenser; view: "mobile" | "tablet" },
) {
  const imageSize = view === "mobile"
    ? "w-[146px] h-[146px]"
    : "w-[172px] h-[172px]";

  return (
    <div class="flex justify-between dark-gradient rounded-md hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE] group border-2 border-transparent">
      <div class="flex p-3 mobileLg:p-6 gap-6 uppercase w-full">
        <a
          href={`/stamp/${dispenser.stamp.stamp}`}
          class={`${imageSize} relative flex-shrink-0`}
        >
          <div class="relative p-[6px] mobileMd:p-3 bg-[#1F002E] rounded-lg aspect-square">
            <div class="stamp-container absolute inset-0 flex items-center justify-center">
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
          <div class="flex flex-col justify-between w-full mt-[6px]">
            <div class="relative">
              <a
                href={`/stamp/${dispenser.stamp.stamp}`}
                class="!inline-block text-2xl mobileLg:text-4xl font-black purple-gradient3 group-hover:[-webkit-text-fill-color:#AA00FF]"
              >
                {`#${dispenser.stamp.stamp}`}
              </a>
            </div>
          </div>

          <div class="flex justify-between flex-row w-full">
            <p
              class={`text-base text-stamp-primary font-light text-ellipsis overflow-hidden ${
                view === "mobile" ? "tablet:w-full" : ""
              }`}
            >
              <span class="font-bold text-stamp-primary text-base mobileLg:text-xl normal-case">
                <span class="mobileMd:hidden">
                  {abbreviateAddress(dispenser.origin, 4)}
                </span>
                <span class="hidden mobileMd:inline mobileLg:hidden">
                  {abbreviateAddress(dispenser.origin, 7)}
                </span>
                <span class="hidden mobileLg:inline tablet:hidden">
                  {abbreviateAddress(dispenser.origin, 10)}
                </span>
                <span class="hidden tablet:inline">
                  {dispenser.origin}
                </span>
              </span>
            </p>
            <div class="flex flex-row gap-[9px] mobileLg:gap-3">
              <img
                src="/img/wallet/icon-copy.svg"
                class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px] cursor-pointer"
                alt="Copy"
              />
              <img
                src="/img/wallet/icon-history.svg"
                class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px] cursor-pointer"
                alt="History"
              />
            </div>
          </div>
          <div class="text-center flex justify-between mt-[6px]">
            <p class="text-base mobileLg:text-lg text-stamp-grey-darker font-light">
              GIVE{" "}
              <span class="font-bold text-stamp-grey-light">
                {Number(dispenser.give_quantity).toLocaleString()}
              </span>
            </p>
          </div>
          <div class="flex flex-row justify-between w-full">
            <p class="text-base mobileLg:text-lg text-stamp-grey-darker font-light">
              QUANTITY{" "}
              <span class="font-bold text-stamp-grey-light">
                {dispenser.give_remaining === 0
                  ? Number(dispenser.escrow_quantity).toLocaleString()
                  : `${Number(dispenser.give_remaining).toLocaleString()}/${
                    Number(dispenser.escrow_quantity).toLocaleString()
                  }`}
              </span>
            </p>
            <p
              class={`text-stamp-grey-darker text-lg font-light -mt-1 ${
                view === "mobile" ? "hidden mobileLg:block" : ""
              }`}
            >
              VALUE
            </p>
          </div>
          <div class="flex flex-row justify-between w-full">
            <p class="text-base mobileLg:text-lg text-stamp-grey-darker font-light">
              PRICE{" "}
              <span class="font-bold text-stamp-grey-light">
                {formatBTCAmount(Number(dispenser.btcrate), {
                  includeSymbol: false,
                })}
              </span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
            <p
              class={`text-xl mobileMd:text-2xl text-stamp-grey-light font-bold -mt-1 ${
                view === "mobile" ? "hidden mobileLg:block" : ""
              }`}
            >
              {formatBTCAmount(
                Number(dispenser.btcrate) * Number(dispenser.escrow_quantity),
                { includeSymbol: false },
              )} <span class="text-stamp-grey-light font-light">BTC</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WalletContent(
  { stamps, src20, dispensers, address, showItem, anchor }: WalletContentProps,
) {
  const [filterBy, setFilterBy] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("ASC");
  const [openS, setOpenS] = useState<boolean>(false);
  const [openT, setOpenT] = useState<boolean>(false);
  const [openD, setOpenD] = useState<boolean>(false);
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  const [openSettingModal, setOpenSettingModal] = useState<boolean>(false);

  useEffect(() => {
    if (anchor) {
      const sectionMap = {
        stamp: "stamps-section",
        src20: "src20-section",
        open_listings: "open-listings-section",
        closed_listings: "closed-listings-section",
      };

      const sectionId = sectionMap[anchor as keyof typeof sectionMap];
      if (sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [anchor, stamps, src20, dispensers]);

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
      gap-3
      mobileMd:gap-6
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
      <div class="mt-6 mobileLg:mt-12 desktop:mt-24" id="stamps-section">
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

      <div class="mt-12 mobileLg:mt-24 desktop:mt-36" id="src20-section">
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
        {Math.ceil(src20.pagination.total / src20.pagination.limit) > 1 && (
          <div class="mt-3 mobileLg:mt-6">
            <SRC20Section
              type="all"
              data={src20.data}
            />
          </div>
        )}
      </div>

      {/* Listing Pagination */}
      {src20.data.length && (
        <div class="mt-9 mobileLg:mt-[72px]">
          <Pagination
            page={src20.pagination.page}
            page_size={src20.pagination.limit}
            key="Token"
            type="Token_id"
            data_length={src20.pagination.total}
            pages={Math.ceil(src20.pagination.total / src20.pagination.limit)}
            prefix="src20"
          />
        </div>
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
        <div class="mt-3 mobileMd:mt-6">
          <DispenserItem dispensers={dispensers || []} />
        </div>
      </div>
      {openSettingModal &&
        (
          <WalletTransferModal
            stamps={stamps}
            toggleModal={handleOpenSettingModal}
            handleCloseModal={handleCloseSettingModal}
          />
        )}
    </>
  );
}
