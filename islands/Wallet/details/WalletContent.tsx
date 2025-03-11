import { useEffect, useState } from "preact/hooks";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { FilterOld } from "$islands/datacontrol/FilterOld.tsx";
import { Setting } from "$islands/datacontrol/Setting.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { SRC20Section } from "$islands/src20/SRC20Section.tsx";
import StampSection from "$islands/stamp/StampSection.tsx";
import { WalletContentProps } from "$types/wallet.d.ts";
import { Dispenser } from "$types/index.d.ts";
import { formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import { StampRow } from "$globals";
import { dataLabel } from "$components/shared/WalletStyles.ts";

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
  filter = true,
  setting = false,
  setOpenSettingModal = () => {},
  onChangeSort = () => {},
}: {
  title: string;
  sortBy: "ASC" | "DESC";
  isOpen: boolean;
  sort: boolean;
  filter: boolean;
  setting: boolean;
  isOpenFilter: boolean;
  isOpenSetting: boolean;
  handleOpenSetting: (open: boolean) => void;
  handleOpenFilter: (open: boolean) => void;
  handleOpen: (type: string) => void;
  setOpenSettingModal?: (open: boolean) => void;
  // We add onChangeSort to get a new sort direction ("ASC"/"DESC").
  onChangeSort?: (newSortBy: "ASC" | "DESC") => void;
}) => {
  return (
    <div class="flex flex-row justify-between items-center gap-3 w-full relative">
      <div class="flex items-end">
        <p class="text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-purple-bright">
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
      </div>
    </div>
  );
};

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
  // If no dispensers, show empty state
  if (!dispensers?.length) {
    return (
      <div class="inline-block text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black bg-text-purple-3 gradient-text">
        NO LISTINGS FOUND
      </div>
    );
  }

  // Filter dispensers by open/closed status
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

function DispenserRow(
  { dispenser, view }: { dispenser: Dispenser; view: "mobile" | "tablet" },
) {
  const imageSize = view === "mobile"
    ? "w-[146px] h-[146px]"
    : "w-[172px] h-[172px]";
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");

  const fetchStampImage = async () => {
    setLoading(true);
    const res = await getStampImageSrc(dispenser.stamp as StampRow);
    if (res) {
      setSrc(res);
    } else setSrc(NOT_AVAILABLE_IMAGE);
    setLoading(false);
  };

  useEffect(() => {
    fetchStampImage();
  }, []);

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
                    <div class="flex items-center justify-center bg-gray-700 max-w-none object-contain rounded pixelart stamp-image h-full w-full">
                      <svg
                        class="w-14 h-14 text-gray-600"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 18"
                      >
                        <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
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

export default function WalletContent({
  stamps,
  src20,
  dispensers,
  address,
  anchor,
  stampsSortBy = "DESC",
  src20SortBy = "DESC",
  dispensersSortBy = "DESC",
}: WalletContentProps) {
  const [openSettingModal, setOpenSettingModal] = useState<boolean>(false);

  // Track sorting state for all sections
  const [sortStamps, setSortStamps] = useState<"ASC" | "DESC">(stampsSortBy);
  const [sortTokens, setSortTokens] = useState<"ASC" | "DESC">(src20SortBy);
  const [sortDispensers, setSortDispensers] = useState<"ASC" | "DESC">(
    dispensersSortBy,
  );

  // Toggle states for filter / setting modals
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [openSetting, setOpenSetting] = useState<boolean>(false);

  // Calculate dispenser counts
  const openDispensersCount =
    dispensers.data.filter((d) => d.give_remaining > 0).length;

  // Scroll into the correct section if anchor is set
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
    // This function is kept for compatibility but no longer needs to handle search toggles
  };

  // Handle sort changes for each section
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

  // If pressing "transfer" in the Setting filter, open the stamp transfer modal
  useEffect(() => {
    const currentUrl = globalThis.location.href;
    const url = new URL(currentUrl);
    const filterByValue = url.searchParams.get("filterBy") || "";
    if (filterByValue === "Transfer") {
      setOpenSettingModal(true);
    }
  }, []);

  // Build the stampSection config
  const stampSection = {
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

  return (
    <>
      {/* Stamps Section */}
      <div class="mt-3 mobileLg:mt-6" id="stamps-section">
        <ItemHeader
          title="STAMPS"
          sort={true}
          sortBy={sortStamps}
          onChangeSort={handleChangeSort}
          isOpen={false}
          handleOpen={handleOpen}
          filter={false}
          setting={false}
          isOpenFilter={false}
          isOpenSetting={openSetting}
          handleOpenFilter={() => {}}
          handleOpenSetting={handleOpenSetting}
          setOpenSettingModal={setOpenSettingModal}
        />
        <div class="mt-3 mobileLg:mt-6">
          {stamps.data?.length
            ? <StampSection {...stampSection} />
            : (
              <p class={`${dataLabel} -mt-1.5 mobileLg:-mt-3`}>
                NO STAMPS IN THE WALLET
              </p>
            )}
        </div>
      </div>

      {/* SRC20 (TOKENS) Section */}
      <div class="mt-6 mobileLg:mt-12" id="src20-section">
        <ItemHeader
          title="TOKENS"
          sort={true}
          sortBy={sortTokens}
          onChangeSort={handleTokenSort}
          isOpen={false}
          handleOpen={handleOpen}
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
              <SRC20Section
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
            : (
              <p class={`${dataLabel} -mt-1.5 mobileLg:-mt-3`}>
                NO TOKENS IN THE WALLET
              </p>
            )}
        </div>
      </div>

      {/* Dispensers Section */}
      {dispensers.data.length > 0 && (
        <div class="mt-3 mobileLg:mt-6" id="listings-section">
          <ItemHeader
            title="LISTINGS"
            sort={true}
            sortBy={sortDispensers}
            onChangeSort={handleDispenserSort}
            isOpen={false}
            handleOpen={handleOpen}
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

      {
        /* Modal for sending stamps
      {openSettingModal && (
        <WalletSendStampModal
          stamps={stamps}
          fee={0}
          handleChangeFee={() => {}}
          toggleModal={handleOpenSettingModal}
          handleCloseModal={handleCloseSettingModal}
        />
      )} */
      }
    </>
  );
}
