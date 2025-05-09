/* ===== WALLET DASHBOARD CONTENT COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { Search } from "$islands/datacontrol/Search.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Setting } from "$islands/datacontrol/Setting.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { SRC20Gallery, StampGallery } from "$section";
import { WalletContentProps } from "$types/wallet.d.ts";
import { Dispenser } from "$types/index.d.ts";
import { formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import { StampRow } from "$globals";

/* ===== ITEM HEADER SUBCOMPONENT ===== */
const ItemHeader = ({
  title = "STAMP",
  sortBy = "ASC" as const,
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
  setOpenSettingModal = () => {},
  onChangeSort = () => {},
}: {
  title: string;
  sortBy: "ASC" | "DESC";
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
  setOpenSettingModal?: (open: boolean) => void;
  onChangeSort?: (newSortBy: "ASC" | "DESC") => void;
}) => {
  /* ===== RENDER HEADER ===== */
  return (
    <div class="flex flex-row justify-between items-center gap-3 w-full relative">
      <div class="flex items-end">
        <p class="text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight">
          {title}
        </p>
      </div>
      <div class="flex gap-3 justify-between h-[36px] items-center">
        {setting && (
          <Setting
            initFilter={[]}
            open={isOpenSetting}
            handleOpen={handleOpenSetting}
            filterButtons={["transfer"]}
            onFilterClick={(filter) => {
              if (filter === "transfer") {
                setOpenSettingModal(true);
              }
            }}
          />
        )}
        {filter && (
          <Filter
            initFilter={[]}
            open={isOpenFilter}
            handleOpen={handleOpenFilter}
            filterButtons={["all", "psbt", "dispensers"]}
            dropdownPosition="bottom"
          />
        )}
        {sort && (
          <Sort
            initSort={sortBy}
            onChangeSort={onChangeSort}
            sortParam={title === "STAMPS"
              ? "stampsSortBy"
              : title === "TOKENS"
              ? "src20SortBy"
              : "dispensersSortBy"}
          />
        )}
        {search && (
          <Search
            open={isOpen}
            handleOpen={() => handleOpen(title)}
            placeholder="Stamp Name, Stamp Hash, or Address"
            searchEndpoint="/wallet/search?q="
            onResultClick={() => {}}
            resultDisplay={(result) => {
              console.log(result);
              return result.toString();
            }}
          />
        )}
      </div>
    </div>
  );
};

/* ===== DISPENSER ITEM SUBCOMPONENT ===== */
function DispenserItem({
  dispensers = [],
  pagination,
}: {
  dispensers?: Dispenser[];
  pagination?: {
    page: number;
    totalPages: number;
    prefix?: string;
    onPageChange?: (page: number) => void;
  };
}) {
  /* ===== EMPTY STATE HANDLING ===== */
  if (!dispensers?.length) {
    return (
      <div class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text">
        NO LISTINGS FOUND
      </div>
    );
  }

  /* ===== DISPENSER FILTERING ===== */
  const dispensersWithStamps = dispensers.filter((d) => d.stamp);
  const openDispensers = dispensersWithStamps.filter((d) =>
    d.give_remaining > 0
  );
  const closedDispensers = dispensersWithStamps.filter((d) =>
    d.give_remaining === 0
  );

  if (!openDispensers.length && !closedDispensers.length) {
    return (
      <div>
        <h3 class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text">
          NO LISTINGS FOUND
        </h3>
      </div>
    );
  }

  /* ===== RENDER DISPENSER ITEM ===== */
  return (
    <div class="relative shadow-md">
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
          </div>
        )}
      </div>

      {/* For mobile */}
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
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div class="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            prefix="dispensers"
            onPageChange={(page: number) => {
              const url = new URL(globalThis.location.href);
              url.searchParams.set("dispensers_page", page.toString());
              url.searchParams.set("anchor", "closed_listings");
              globalThis.location.href = url.toString();
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ===== DISPENSER ROW SUBCOMPONENT ===== */
function DispenserRow(
  { dispenser, view }: { dispenser: Dispenser; view: "mobile" | "tablet" },
) {
  /* ===== STATE ===== */
  const imageSize = view === "mobile"
    ? "w-[146px] h-[146px]"
    : "w-[172px] h-[172px]";
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");

  /* ===== IMAGE FETCHING ===== */
  const fetchStampImage = async () => {
    setLoading(true);
    const res = await getStampImageSrc(dispenser.stamp as StampRow);
    if (res) {
      setSrc(res);
    } else setSrc(NOT_AVAILABLE_IMAGE);
    setLoading(false);
  };

  /* ===== EFFECTS ===== */
  useEffect(() => {
    fetchStampImage();
  }, []);

  /* ===== RENDER DISPENSER ROW ===== */
  if (!dispenser.stamp) {
    return null;
  }

  return (
    <div class="flex justify-between dark-gradient rounded-lg hover:border-stamp-primary-light hover:shadow-[0px_0px_20px_#9900EE] group border-2 border-transparent">
      <div class="flex p-3 mobileLg:p-6 gap-6 uppercase w-full">
        <a
          href={`/stamp/${dispenser.stamp.stamp}`}
          class={`${imageSize} relative flex-shrink-0`}
        >
          <div class="relative p-[6px] mobileMd:p-3 bg-[#1F002E] rounded-lg aspect-square">
            <div class="stamp-container absolute inset-0 flex items-center justify-center">
              <div
                class={`relative z-10 w-full h-full ${
                  loading && "animate-pulse"
                }`}
              >
                {loading && !src
                  ? (
                    <div class="flex items-center justify-center bg-[#220033CC] max-w-none object-contain rounded pixelart stamp-image">
                      <svg
                        class="p-[25%] text-stamp-purple-dark"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 32 32"
                      >
                        <path d="M27.5 28C27.5 28.1326 27.4473 28.2598 27.3536 28.3536C27.2598 28.4473 27.1326 28.5 27 28.5H5C4.86739 28.5 4.74021 28.4473 4.64645 28.3536C4.55268 28.2598 4.5 28.1326 4.5 28C4.5 27.8674 4.55268 27.7402 4.64645 27.6464C4.74021 27.5527 4.86739 27.5 5 27.5H27C27.1326 27.5 27.2598 27.5527 27.3536 27.6464C27.4473 27.7402 27.5 27.8674 27.5 28ZM27.5 18V23C27.5 23.3978 27.342 23.7794 27.0607 24.0607C26.7794 24.342 26.3978 24.5 26 24.5H6C5.60218 24.5 5.22064 24.342 4.93934 24.0607C4.65804 23.7794 4.5 23.3978 4.5 23V18C4.5 17.6022 4.65804 17.2206 4.93934 16.9393C5.22064 16.658 5.60218 16.5 6 16.5H13.6713L11.5787 6.73375C11.4694 6.22352 11.4754 5.69528 11.5965 5.1877C11.7177 4.68012 11.9507 4.20604 12.2787 3.80017C12.6067 3.39429 13.0213 3.06689 13.4921 2.84193C13.963 2.61697 14.4782 2.50015 15 2.5H17C17.5219 2.49996 18.0373 2.61665 18.5083 2.84153C18.9793 3.06641 19.394 3.39378 19.7221 3.79968C20.0503 4.20558 20.2835 4.67972 20.4046 5.18739C20.5258 5.69507 20.5319 6.22341 20.4225 6.73375L18.3288 16.5H26C26.3978 16.5 26.7794 16.658 27.0607 16.9393C27.342 17.2206 27.5 17.6022 27.5 18ZM14.6938 16.5H17.3062L19.4438 6.52375C19.5218 6.15932 19.5174 5.78205 19.4309 5.41954C19.3444 5.05702 19.1779 4.71844 18.9436 4.42858C18.7093 4.13871 18.4132 3.90489 18.0769 3.74422C17.7407 3.58356 17.3727 3.50012 17 3.5H15C14.6272 3.49993 14.2591 3.58323 13.9227 3.74382C13.5862 3.9044 13.2899 4.1382 13.0555 4.42809C12.8211 4.71798 12.6545 5.05663 12.5679 5.41923C12.4813 5.78184 12.4769 6.15922 12.555 6.52375L14.6938 16.5ZM26.5 18C26.5 17.8674 26.4473 17.7402 26.3536 17.6464C26.2598 17.5527 26.1326 17.5 26 17.5H6C5.86739 17.5 5.74021 17.5527 5.64645 17.6464C5.55268 17.7402 5.5 17.8674 5.5 18V23C5.5 23.1326 5.55268 23.2598 5.64645 23.3536C5.74021 23.4473 5.86739 23.5 6 23.5H26C26.1326 23.5 26.2598 23.4473 26.3536 23.3536C26.4473 23.2598 26.5 23.1326 26.5 23V18Z" />
                      </svg>
                    </div>
                  )
                  : (
                    <img
                      width="100%"
                      height="100%"
                      loading="lazy"
                      class="max-w-none w-full h-full object-contain rounded pixelart stamp-image"
                      src={src}
                      alt={`Stamp ${dispenser.stamp.stamp}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          NOT_AVAILABLE_IMAGE;
                      }}
                    />
                  )}
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
                {/* Abbreviate origin address differently depending on screen size */}
                <span class="mobileMd:hidden">
                  {abbreviateAddress(dispenser.origin, 4)}
                </span>
                <span class="hidden mobileMd:inline mobileLg:hidden">
                  {abbreviateAddress(dispenser.origin, 7)}
                </span>
                <span class="hidden mobileLg:inline tablet:hidden">
                  {abbreviateAddress(dispenser.origin, 10)}
                </span>
                <span class="hidden tablet:inline">{dispenser.origin}</span>
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

/* ===== MAIN WALLET DASHBOARD COMPONENT ===== */
const WalletDashboardContent = ({
  stamps,
  src20,
  dispensers,
  address,
  anchor,
  stampsSortBy = "DESC",
  src20SortBy = "DESC",
  dispensersSortBy = "DESC",
}: WalletContentProps) => {
  /* ===== STATE ===== */
  const [openSettingModal, setOpenSettingModal] = useState<boolean>(false);
  const [sortStamps, setSortStamps] = useState<"ASC" | "DESC">(stampsSortBy);
  const [sortTokens, setSortTokens] = useState<"ASC" | "DESC">(src20SortBy);
  const [sortDispensers, setSortDispensers] = useState<"ASC" | "DESC">(
    dispensersSortBy,
  );

  /* ===== TOGGLE STATES ===== */
  const [openS, setOpenS] = useState<boolean>(false);
  const [openT, setOpenT] = useState<boolean>(false);
  const [openD, setOpenD] = useState<boolean>(false);
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [openSetting, setOpenSetting] = useState<boolean>(false);

  /* ===== COMPUTED VALUES ===== */
  const openDispensersCount =
    dispensers.data.filter((d) => d.give_remaining > 0).length;

  /* ===== EFFECTS ===== */
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

  useEffect(() => {
    const currentUrl = globalThis.location.href;
    const url = new URL(currentUrl);
    const filterByValue = url.searchParams.get("filterBy") || "";
    if (filterByValue === "Transfer") {
      setOpenSettingModal(true);
    }
  }, []);

  /* ===== EVENT HANDLERS ===== */
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
    if (type === "STAMPS") {
      setOpenS(!openS);
    } else if (type === "TOKENS") {
      setOpenT(!openT);
    } else {
      setOpenD(!openD);
    }
  };

  /* ===== SORT HANDLERS ===== */
  const handleChangeSort = (newSort: "ASC" | "DESC") => {
    setSortStamps(newSort);
    const url = new URL(globalThis.location.href);
    url.searchParams.set("stampsSortBy", newSort);
    url.searchParams.delete("stamps_page");
    url.searchParams.set("anchor", "stamps");
    globalThis.location.href = url.toString();
  };

  const handleTokenSort = (newSort: "ASC" | "DESC") => {
    setSortTokens(newSort);
    const url = new URL(globalThis.location.href);
    url.searchParams.set("src20SortBy", newSort);
    url.searchParams.delete("src20_page");
    url.searchParams.set("anchor", "src20");
    globalThis.location.href = url.toString();
  };

  const handleDispenserSort = (newSort: "ASC" | "DESC") => {
    setSortDispensers(newSort);
    const url = new URL(globalThis.location.href);
    url.searchParams.set("dispensersSortBy", newSort);
    url.searchParams.delete("dispensers_page");
    url.searchParams.set(
      "anchor",
      openDispensersCount > 0 ? "open_listings" : "closed_listings",
    );
    globalThis.location.href = url.toString();
  };

  /* ===== GALLERY CONFIGURATION ===== */
  const stampGallery = {
    title: "",
    type: "all",
    stamps: stamps.data,
    layout: "grid" as const,
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
      mobileSm: 16,
      mobileLg: 24,
      tablet: 24,
      desktop: 32,
    },
    pagination: {
      page: stamps.pagination.page,
      totalPages: Math.ceil(stamps.pagination.total / stamps.pagination.limit),
      prefix: "stamps_page",
      onPageChange: (page: number) => {
        const url = new URL(globalThis.location.href);
        url.searchParams.set("stamps_page", page.toString());
        url.searchParams.set("anchor", "stamps");
        globalThis.location.href = url.toString();
      },
    },
  };

  /* ===== RENDER ===== */
  return (
    <>
      {/* Stamps Section */}
      <div class="mt-6 mobileLg:mt-12 desktop:mt-24" id="stamps-section">
        <ItemHeader
          title="STAMPS"
          sort={true}
          sortBy={sortStamps}
          onChangeSort={handleChangeSort}
          isOpen={openS}
          handleOpen={handleOpen}
          search={true}
          filter={false}
          setting={true}
          isOpenFilter={false}
          isOpenSetting={openSetting}
          handleOpenFilter={() => {}}
          handleOpenSetting={handleOpenSetting}
          setOpenSettingModal={setOpenSettingModal}
        />
        <div class="mt-3 mobileLg:mt-6">
          {stamps.data?.length
            ? <StampGallery {...stampGallery} />
            : <p class="text-gray-500">NO AVAILABLE STAMP</p>}
        </div>
      </div>

      {/* SRC20 (TOKENS) Section */}
      <div class="mt-12 mobileLg:mt-24 desktop:mt-36" id="src20-section">
        <ItemHeader
          title="TOKENS"
          sort={true}
          sortBy={sortTokens}
          onChangeSort={handleTokenSort}
          isOpen={openT}
          handleOpen={handleOpen}
          search={true}
          filter={false}
          setting={false}
          isOpenFilter={false}
          isOpenSetting={false}
          handleOpenFilter={() => {}}
          handleOpenSetting={() => {}}
        />
        <div class="mt-3 mobileLg:mt-6">
          {src20.data?.length
            ? (
              <SRC20Gallery
                type="all"
                fromPage="wallet"
                initialData={src20.data}
                pagination={{
                  page: src20.pagination.page,
                  totalPages: src20.pagination.totalPages,
                  prefix: "src20",
                  onPageChange: (page: number) => {
                    const url = new URL(globalThis.location.href);
                    url.searchParams.set("src20_page", page.toString());
                    url.searchParams.set("anchor", "src20");
                    globalThis.location.href = url.toString();
                  },
                }}
                address={address}
                sortBy={sortTokens}
              />
            )
            : <p class="text-gray-500">NO AVAILABLE TOKEN</p>}
        </div>
      </div>

      {/* Dispensers Section */}
      {dispensers.data.length > 0 && (
        <div class="mt-48">
          <ItemHeader
            title="LISTINGS"
            sort={true}
            sortBy={sortDispensers}
            onChangeSort={handleDispenserSort}
            isOpen={openD}
            handleOpen={handleOpen}
            search={false}
            filter={false}
            setting={false}
            isOpenFilter={openFilter}
            isOpenSetting={false}
            handleOpenFilter={handleOpenFilter}
            handleOpenSetting={() => {}}
          />
          <div class="mt-3 mobileMd:mt-6">
            <DispenserItem
              dispensers={dispensers.data}
              pagination={{
                page: dispensers.pagination.page,
                totalPages: dispensers.pagination.totalPages,
                prefix: "dispensers",
                onPageChange: (page: number) => {
                  const url = new URL(globalThis.location.href);
                  url.searchParams.set("dispensers_page", page.toString());
                  url.searchParams.set("anchor", "closed_listings");
                  globalThis.location.href = url.toString();
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Modal for sending stamps */}
      {openSettingModal && (
        <WalletSendStampModal
          stamps={stamps}
          fee={0}
          handleChangeFee={() => {}}
          toggleModal={handleOpenSettingModal}
          handleCloseModal={handleCloseSettingModal}
        />
      )}
    </>
  );
};

export default WalletDashboardContent;
