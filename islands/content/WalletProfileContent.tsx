/* ===== WALLET PROFILE CONTENT COMPONENT ===== */
import { StampRow } from "$globals";
import { Icon, LoadingIcon } from "$icon";
import { SortButton } from "$islands/button/SortButton.tsx";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { Setting } from "$islands/datacontrol/Setting.tsx";
// AjaxStampGallery has been replaced with FreshStampGallery for Fresh.js partial navigation
import FreshSRC20Gallery from "$islands/section/gallery/FreshSRC20Gallery.tsx";
import { FreshStampGallery } from "$islands/section/gallery/FreshStampGallery.tsx";
import { NOT_AVAILABLE_IMAGE } from "$constants";
import { abbreviateAddress, formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { createPaginationHandler } from "$lib/utils/freshNavigationUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { Dispenser } from "$types/index.d.ts";
import { WalletContentProps } from "$types/wallet.d.ts";
import { useEffect, useState } from "preact/hooks";

// ===== ADVANCED SORTING IMPORTS =====
import { CompleteSortingInterface } from "$islands/sorting/index.ts";
import SortingErrorBoundary from "$islands/sorting/SortingErrorBoundary.tsx";
import { WalletSortingProvider } from "$islands/sorting/SortingProviderWithURL.tsx";
import type { WalletSortKey } from "$lib/types/sorting.d.ts";

// ===== TYPES AND INTERFACES =====

/**
 * Enhanced wallet content props with feature flag support
 */
interface EnhancedWalletContentProps extends WalletContentProps {
  /** Enable advanced sorting features (default: false for backward compatibility) */
  enableAdvancedSorting?: boolean;
  /** Show performance metrics for sorting operations */
  showSortingMetrics?: boolean;
  /** Additional sorting configuration */
  sortingConfig?: {
    enableUrlSync?: boolean;
    enablePersistence?: boolean;
    enableMetrics?: boolean;
  };
}

/**
 * Section-specific sorting configuration for advanced mode
 */
interface SectionSortingConfig {
  section: "stamps" | "src20" | "dispensers";
  paramName: string;
  pageParamName: string;
  anchorName: string;
  sortOptions: string[]; // Will expand to include advanced options
}

// ===== SECTION CONFIGURATIONS =====

/**
 * Configuration for each wallet section with support for advanced sorting
 */
const SECTION_CONFIGS: Record<string, SectionSortingConfig> = {
  stamps: {
    section: "stamps",
    paramName: "stampsSortBy",
    pageParamName: "stamps_page",
    anchorName: "stamps",
    sortOptions: [
      "ASC",
      "DESC",
      // Advanced options (only used when enableAdvancedSorting is true)
      "value_asc", // Sort by BTC value ascending
      "value_desc", // Sort by BTC value descending
      "stamp_asc", // Sort by stamp number ascending
      "stamp_desc", // Sort by stamp number descending
    ],
  },
  src20: {
    section: "src20",
    paramName: "src20SortBy",
    pageParamName: "src20_page",
    anchorName: "src20",
    sortOptions: [
      "ASC",
      "DESC",
      // Advanced options
      "value_asc", // Sort by BTC value ascending
      "value_desc", // Sort by BTC value descending
      "quantity_asc", // Sort by quantity ascending
      "quantity_desc", // Sort by quantity descending
    ],
  },
  dispensers: {
    section: "dispensers",
    paramName: "dispensersSortBy",
    pageParamName: "dispensers_page",
    anchorName: "closed_listings",
    sortOptions: [
      "ASC",
      "DESC",
      // Advanced options
      "value_asc",
      "value_desc",
    ],
  },
};

// ===== SECTION HEADER COMPONENT =====

interface SectionHeaderProps {
  title: string;
  config: SectionSortingConfig;
  sortBy: string;
  onSortChange: (sort: string) => void;
  enableAdvancedSorting?: boolean;
  showMetrics?: boolean;
}

/**
 * Section header with conditional rendering for legacy/advanced sorting
 */
function SectionHeader({
  title,
  config,
  sortBy,
  onSortChange,
  enableAdvancedSorting = false,
  showMetrics = false,
}: SectionHeaderProps) {
  // Performance metrics placeholder for advanced mode
  const sortMetrics = enableAdvancedSorting && showMetrics
    ? { count: 0, avgDuration: 0 } // Will be connected to real metrics
    : null;

  return (
    <div
      class="flex items-center justify-between mb-2"
      f-partial={`/${config.paramName}`}
    >
      <div class="flex items-center gap-4">
        <h2 class="text-stamp-grey-dark text-lg mobileLg:text-2xl tablet:text-2xl desktop:text-2xl font-nunito font-extrabold">
          {title}
        </h2>
        {sortMetrics && (
          <div class="text-xs text-stamp-grey opacity-75">
            {sortMetrics.count} sorts • {sortMetrics.avgDuration}ms avg
          </div>
        )}
      </div>

      <div class="flex items-center gap-2">
        {enableAdvancedSorting
          ? (
            // Advanced sorting interface
            <SortingErrorBoundary
              context="wallet"
              maxRetries={2}
              testId="sorting-interface-boundary"
              onError={(error) => {
                console.error("Sorting interface error:", error);
              }}
            >
              <CompleteSortingInterface
                config={{
                  defaultSort: sortBy as WalletSortKey,
                }}
                options={config.sortOptions.map((option) => ({
                  value: option as WalletSortKey,
                  label: getSortLabel(option),
                  direction: option.includes("_desc") ? "desc" : "asc",
                }))}
                variant="buttons"
                size="sm"
                showLabel={false}
              />
            </SortingErrorBoundary>
          )
          : (
            // Legacy sorting interface
            <SortButton
              initSort={sortBy as "ASC" | "DESC"}
              onChangeSort={(newSort) => onSortChange(newSort)}
              sortParam={config.paramName}
            />
          )}
      </div>
    </div>
  );
}

/**
 * Get human-readable label for sort option
 */
function getSortLabel(option: string): string {
  const labels: Record<string, string> = {
    "ASC": "Low to High",
    "DESC": "High to Low",
    "value_asc": "Value ↑",
    "value_desc": "Value ↓",
    "stamp_asc": "Stamp # ↑",
    "stamp_desc": "Stamp # ↓",
    "quantity_asc": "Quantity ↑",
    "quantity_desc": "Quantity ↓",
  };
  return labels[option] || option;
}

// ===== DISPENSER ITEM SUBCOMPONENT =====
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
            onPageChange={createPaginationHandler(
              "dispensers_page",
              "closed_listings",
            )}
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

  if (!dispenser.stamp) {
    return null;
  }

  /* ===== RENDER DISPENSER ROW ===== */
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

// ===== MAIN COMPONENT WRAPPER =====

/**
 * Production-ready wallet profile content with optional advanced sorting
 */
export default function WalletProfileContent(
  props: EnhancedWalletContentProps,
) {
  const { enableAdvancedSorting = false } = props;

  // When advanced sorting is enabled, wrap with WalletSortingProvider and error boundary
  if (enableAdvancedSorting) {
    return (
      <SortingErrorBoundary
        context="wallet"
        maxRetries={3}
        testId="wallet-sorting-boundary"
        onError={(error, details) => {
          console.error("Wallet sorting error:", error);
          console.debug("Error details:", details);
          // TODO(#sorting): Report error to monitoring system
        }}
      >
        <WalletSortingProvider
          defaultSort={props.stampsSortBy || "DESC"}
          testId="wallet-sorting-provider"
        >
          <WalletProfileContentInner {...props} />
        </WalletSortingProvider>
      </SortingErrorBoundary>
    );
  }

  // Otherwise render directly
  return <WalletProfileContentInner {...props} />;
}

// ===== MAIN COMPONENT IMPLEMENTATION =====

/**
 * Inner component with all the wallet profile logic
 */
function WalletProfileContentInner({
  stamps,
  src20,
  dispensers,
  address,
  anchor,
  stampsSortBy = "DESC",
  src20SortBy = "DESC",
  dispensersSortBy = "DESC",
  // Feature flag support
  enableAdvancedSorting = false, // Default to false for backward compatibility
  showSortingMetrics = false,
  sortingConfig = {
    enableUrlSync: true,
    enablePersistence: true,
    enableMetrics: true,
  },
}: EnhancedWalletContentProps) {
  /* ===== STATE MANAGEMENT ===== */
  const [sortStamps] = useState<string>(stampsSortBy);
  const [sortTokens] = useState<string>(src20SortBy);
  const [sortDispensers] = useState<string>(dispensersSortBy);
  const [openSetting, setOpenSetting] = useState(false);
  const [openSettingModal, setOpenSettingModal] = useState(false);

  /* ===== COMPUTED VALUES ===== */
  const openDispensersCount =
    dispensers.data.filter((d: any) => d.give_remaining > 0).length;
  const closedDispensersCount = dispensers.data.length - openDispensersCount;

  /* ===== EFFECTS ===== */
  useEffect(() => {
    if (anchor) {
      const sectionMap: Record<string, string> = {
        stamp: "stamps-section",
        stamps: "stamps-section",
        src20: "src20-section",
        open_listings: "open-listings-section",
        closed_listings: "closed-listings-section",
      };
      const sectionId = sectionMap[anchor];
      if (sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [anchor]);

  /* ===== HANDLERS ===== */
  const handleStampSort = (newSort: string) => {
    // SSR safety check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot navigate during SSR
    }
    const url = new URL(globalThis.location.href);
    url.searchParams.set(SECTION_CONFIGS.stamps.paramName, newSort);
    url.searchParams.delete(SECTION_CONFIGS.stamps.pageParamName);
    url.searchParams.set("anchor", SECTION_CONFIGS.stamps.anchorName);
    globalThis.location.href = url.toString();
  };

  const handleTokenSort = (newSort: string) => {
    // SSR safety check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot navigate during SSR
    }
    const url = new URL(globalThis.location.href);
    url.searchParams.set(SECTION_CONFIGS.src20.paramName, newSort);
    url.searchParams.delete(SECTION_CONFIGS.src20.pageParamName);
    url.searchParams.set("anchor", SECTION_CONFIGS.src20.anchorName);
    globalThis.location.href = url.toString();
  };

  const handleDispenserSort = (newSort: string) => {
    // SSR safety check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot navigate during SSR
    }
    const url = new URL(globalThis.location.href);
    url.searchParams.set(SECTION_CONFIGS.dispensers.paramName, newSort);
    url.searchParams.delete(SECTION_CONFIGS.dispensers.pageParamName);
    url.searchParams.set(
      "anchor",
      openDispensersCount > 0 ? "open_listings" : "closed_listings",
    );
    globalThis.location.href = url.toString();
  };

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col w-full z-[2] p-3 bg-[--stamp-sidebar-background] backdrop-blur-[.8rem]
             desktop:rounded-t-[32px] select-none">
      {/* Page Header */}
      <div class="flex flex-row justify-between items-center gap-3 w-full relative mb-6">
        <div class="flex gap-3 items-center">
          <h1 class="text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-purple-bright">
            WALLET
          </h1>
          <p class="text-sm mobileMd:text-sm mobileLg:text-lg text-stamp-gray">
            {abbreviateAddress(address)}
          </p>
        </div>
        <div class="flex gap-3 justify-between h-[36px] items-center">
          <Setting
            initFilter={[]}
            open={openSetting}
            handleOpen={setOpenSetting}
            filterButtons={["transfer"]}
            onFilterClick={(filter) => {
              if (filter === "transfer") {
                setOpenSettingModal(true);
              }
            }}
          />
        </div>
      </div>

      {/* Stamps Section */}
      <div id="stamps-section" class="mb-8">
        <SectionHeader
          title="STAMPS"
          config={SECTION_CONFIGS.stamps}
          sortBy={sortStamps}
          onSortChange={handleStampSort}
          enableAdvancedSorting={enableAdvancedSorting}
          showMetrics={showSortingMetrics}
        />

        <div f-partial="/stamps">
          {stamps.data?.length
            ? (
              <FreshStampGallery
                initialData={stamps.data}
                initialPagination={{
                  page: stamps.pagination.page,
                  limit: stamps.pagination.limit,
                  total: stamps.pagination.total,
                  totalPages: Math.ceil(
                    stamps.pagination.total / stamps.pagination.limit,
                  ),
                }}
                address={address}
                initialSort="DESC"
                fromPage="wallet"
                gridClass={`
                grid w-full
                gap-3
                mobileMd:gap-6
                grid-cols-4
                mobileSm:grid-cols-5
                mobileLg:grid-cols-6
                tablet:grid-cols-9
                desktop:grid-cols-10
                `}
              />
            )
            : (
              <p class="text-stamp-grey opacity-75 text-center py-8">
                NO STAMPS IN THE WALLET
              </p>
            )}
        </div>
      </div>

      {/* SRC20 (TOKENS) Section */}
      <div id="src20-section" class="mb-8">
        <SectionHeader
          title="TOKENS"
          config={SECTION_CONFIGS.src20}
          sortBy={sortTokens}
          onSortChange={handleTokenSort}
          enableAdvancedSorting={enableAdvancedSorting}
          showMetrics={showSortingMetrics}
        />

        <div f-partial="/src20">
          {src20.data?.length
            ? (
              <FreshSRC20Gallery
                initialData={src20.data}
                initialPagination={{
                  page: src20.pagination.page,
                  limit: src20.pagination.limit || 50,
                  total: src20.pagination.total || src20.data.length,
                  totalPages: src20.pagination.totalPages,
                }}
                address={address}
                initialSort="DESC"
                fromPage="wallet"
              />
            )
            : (
              <p class="text-stamp-grey opacity-75 text-center py-8">
                NO TOKENS IN THE WALLET
              </p>
            )}
        </div>
      </div>

      {/* Dispensers Section */}
      {dispensers.data.length > 0 && (
        <div id="dispensers-section" class="mb-8">
          <SectionHeader
            title="LISTINGS"
            config={SECTION_CONFIGS.dispensers}
            sortBy={sortDispensers}
            onSortChange={handleDispenserSort}
            enableAdvancedSorting={enableAdvancedSorting}
            showMetrics={showSortingMetrics}
          />

          {/* Open Dispensers */}
          {openDispensersCount > 0 && (
            <div id="open-listings-section" class="mb-6">
              <h3 class="text-lg font-semibold text-stamp-grey-darkest mb-3">
                Open Listings ({openDispensersCount})
              </h3>
              <DispenserItem
                dispensers={dispensers.data.filter((d: any) =>
                  d.give_remaining > 0
                )}
              />
            </div>
          )}

          {/* Closed Dispensers */}
          {closedDispensersCount > 0 && (
            <div id="closed-listings-section">
              <h3 class="text-lg font-semibold text-stamp-grey-darkest mb-3">
                Closed Listings ({closedDispensersCount})
              </h3>
              <DispenserItem
                dispensers={dispensers.data.filter((d: any) =>
                  d.give_remaining === 0
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Feature Flag Debug Info */}
      {enableAdvancedSorting && showSortingMetrics && (
        <div class="mt-8 p-4 bg-stamp-grey-lightest rounded-lg">
          <h3 class="text-sm font-semibold text-stamp-grey-darkest mb-2">
            Advanced Sorting Status
          </h3>
          <div class="text-xs text-stamp-grey space-y-1">
            <div>Status: ✅ Enabled (Phase 1 - Infrastructure)</div>
            <div>URL Sync: {sortingConfig.enableUrlSync ? "✅" : "❌"}</div>
            <div>
              Persistence: {sortingConfig.enablePersistence ? "✅" : "❌"}
            </div>
            <div>Metrics: {sortingConfig.enableMetrics ? "✅" : "❌"}</div>
            <div class="mt-2 text-stamp-warning">
              Note: Advanced sorting UI will be available in Phase 2
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {openSettingModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          {/* Modal content would go here */}
        </div>
      )}
    </div>
  );
}
