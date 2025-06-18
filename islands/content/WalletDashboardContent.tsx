/* ===== WALLET DASHBOARD CONTENT COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { SortButton } from "$islands/button/SortButton.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { FilterOld } from "$islands/WIP/FilterOld.tsx";
import { Setting } from "$islands/datacontrol/Setting.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { SRC20Gallery, StampGallery } from "$section";
import { WalletContentProps } from "$types/wallet.d.ts";
import { Dispenser } from "$types/index.d.ts";
import { formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import { StampRow } from "$globals";
import { Icon, LoadingIcon } from "$icon";

/* ===== ITEM HEADER SUBCOMPONENT ===== */
const ItemHeader = ({
  title = "STAMP",
  sortBy = "ASC" as const,
  isOpenSetting = false,
  handleOpenSetting = () => {},
  isOpenFilter = false,
  handleOpenFilter = () => {},
  sort = true,
  filter = true,
  setting = false,
  setOpenSettingModal = () => {},
  onChangeSort = () => {},
}: {
  title: string;
  sortBy: "ASC" | "DESC";
  isOpenSetting: boolean;
  handleOpenSetting: (open: boolean) => void;
  isOpenFilter: boolean;
  handleOpenFilter: (open: boolean) => void;
  sort: boolean;
  filter: boolean;
  setting: boolean;
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
          <FilterOld
            initFilter={[]}
            open={isOpenFilter}
            handleOpen={handleOpenFilter}
            filterButtons={["all", "psbt", "dispensers"]}
            dropdownPosition="bottom"
          />
        )}
        {sort && (
          <SortButton
            initSort={sortBy}
            onChangeSort={onChangeSort}
            sortParam={title === "STAMPS"
              ? "stampsSortBy"
              : title === "TOKENS"
              ? "src20SortBy"
              : "dispensersSortBy"}
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
              <div class="relative z-10 w-full h-full">
                {loading && !src ? <LoadingIcon /> : (
                  <img
                    width="100%"
                    height="100%"
                    loading="lazy"
                    class="max-w-none w-full h-full object-contain rounded pixelart stamp-image"
                    src={src}
                    alt={`Stamp ${dispenser.stamp.stamp}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = NOT_AVAILABLE_IMAGE;
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
              <Icon
                type="iconButton"
                name="copy"
                weight="normal"
                size="xs"
                color="grey"
              />
              <Icon
                type="iconButton"
                name="history"
                weight="normal"
                size="xs"
                color="grey"
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
  const [sortStamps, setSortStamps] = useState<"ASC" | "DESC">(stampsSortBy);
  const [sortTokens, setSortTokens] = useState<"ASC" | "DESC">(src20SortBy);
  const [sortDispensers, setSortDispensers] = useState<"ASC" | "DESC">(
    dispensersSortBy,
  );

  /* ===== TOGGLE STATES ===== */
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
      setOpenSetting(true);
    }
  }, []);

  /* ===== EVENT HANDLERS ===== */
  const handleOpenSetting = () => {
    setOpenSetting(!openSetting);
  };

  const handleOpenFilter = () => {
    setOpenFilter(!openFilter);
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
          sort
          sortBy={sortStamps}
          onChangeSort={handleChangeSort}
          filter={false}
          setting={openSetting}
          isOpenFilter={false}
          isOpenSetting={openSetting}
          handleOpenFilter={() => {}}
          handleOpenSetting={handleOpenSetting}
          setOpenSettingModal={(open) => {
            setOpenSetting(open);
          }}
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
          sort
          sortBy={sortTokens}
          onChangeSort={handleTokenSort}
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
                viewType="minted"
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
                timeframe="24H"
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
            sort
            sortBy={sortDispensers}
            onChangeSort={handleDispenserSort}
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
      {
        /*
        openSettingModal && (
        <WalletSendStampModal
          stamps={stamps}
          fee={0}
          handleChangeFee={() => {}}
          toggleModal={handleOpenSettingModal}
          handleCloseModal={handleCloseSettingModal}
        />
      )}*/
      }
    </>
  );
};

export default WalletDashboardContent;
