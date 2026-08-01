/* ===== WALLET PROFILE CONTENT COMPONENT ===== */
import { PaginationButtons } from "$button";
import { CollectionCard, SRC20Card, StampCard } from "$card";
import { StampOverviewTable } from "$components/table/explorerTable/StampOverview.tsx";
import { StampListingsTable } from "$components/table/marketplaceTable/StampListings.tsx";
import { SRC20OverviewCompact } from "$components/table/src20OverviewTable/SRC20OverviewCompact.tsx";
import { WalletStampsHeader, WalletTokensHeader } from "$header";
import { containerBackground, rowContainerBackground } from "$layout";
import { subtitleNeutral, valueDarkSm } from "$text";
import type { DispenserRow, StampRow } from "$types/stamp.d.ts";
import type {
  WalletContainerPagination,
  WalletProfileContentProps,
  WalletStampsTab,
  WalletTokensTab,
} from "$types/ui.d.ts";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";

/* ===== VIEW TYPES ===== */
type ViewMode = "cardVertical" | "cardSquare" | "cardRow";

/* ===== HELPERS ===== */

/**
 * Maps a wallet dispenser (with its attached `stamp`) into a `StampRow`
 * shape that `StampCard`/`StampListingsRow` already know how to render as
 * a marketplace-style listing — attaches `lowestPriceDispenser` (so
 * price/supply/BUY read correctly) and a synthesized `marketData` (so the
 * PRICE column/pill shows the dispenser's rate).
 */
function dispenserToListingStamp(
  dispenser: DispenserRow,
): StampRow & { lowestPriceDispenser: DispenserRow } {
  const stamp = dispenser.stamp as StampRow;
  return {
    ...stamp,
    lowestPriceDispenser: dispenser,
    marketData: {
      ...(stamp as any)?.marketData,
      floorPriceBTC: dispenser.btcrate,
      openDispensersCount: dispenser.give_remaining > 0 ? 1 : 0,
    },
  } as StampRow & { lowestPriceDispenser: DispenserRow };
}

/* ===== SHARED EMPTY STATE ===== */
function EmptyState({ label }: { label: string }) {
  return (
    <div class={rowContainerBackground}>
      <h6 class={valueDarkSm}>{label}</h6>
    </div>
  );
}

/* ===== SHARED PAGINATION BLOCK ===== */
function PaginationBlock({
  pagination,
  prefix,
}: {
  pagination?: WalletContainerPagination | undefined;
  prefix: string;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div class="mt-7.5 tablet:mt-10">
      <PaginationButtons
        page={pagination.page}
        totalPages={pagination.totalPages}
        prefix={prefix}
      />
    </div>
  );
}

/* ===== GRID WRAPPER (matches ExplorerContent's card grid conventions) ===== */
const cardGridClass =
  "grid grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6 gap-3 mobileMd:gap-6 w-full auto-rows-fr";

function GridCell(
  { view, children }: { view: ViewMode; children: ComponentChildren },
) {
  // MINIMAL view: square each cell so cards can't stretch the row and
  // break the 1:1 aspect ratio — mirrors ExplorerContent's cardSquare cells.
  return view === "cardSquare"
    ? <div class="w-full max-w-72 mx-auto aspect-square">{children}</div>
    : <div class="contents">{children}</div>;
}

/* ===== STAMPS: COLLECTED / STAMPED (grid + row) ===== */
function StampsGridContent({
  stamps,
  view,
  pagination,
  emptyLabel,
}: {
  stamps: StampRow[];
  view: ViewMode;
  pagination?: WalletContainerPagination | undefined;
  emptyLabel: string;
}) {
  if (!stamps.length) {
    return <EmptyState label={emptyLabel} />;
  }

  if (view === "cardRow") {
    return (
      <>
        <StampOverviewTable stamps={stamps} />
        <PaginationBlock pagination={pagination} prefix="stamps" />
      </>
    );
  }

  return (
    <>
      <div class={cardGridClass}>
        {stamps.map((stamp) => (
          <GridCell key={stamp.tx_hash} view={view}>
            <StampCard
              stamp={stamp}
              variant={view === "cardSquare"
                ? "cardSquare"
                : "cardVerticalDetail"}
            />
          </GridCell>
        ))}
      </div>
      <PaginationBlock pagination={pagination} prefix="stamps" />
    </>
  );
}

/* ===== STAMPS: LISTINGS (dispensers rendered as StampCard/StampListingsTable) ===== */
function ListingsGroup({
  stamps,
  view,
}: {
  stamps: (StampRow & { lowestPriceDispenser: DispenserRow })[];
  view: ViewMode;
}) {
  if (view === "cardRow") {
    return <StampListingsTable stamps={stamps} />;
  }
  return (
    <div class={cardGridClass}>
      {stamps.map((stamp) => (
        <GridCell key={stamp.lowestPriceDispenser.tx_hash} view={view}>
          <StampCard
            stamp={stamp}
            variant={view === "cardSquare"
              ? "cardSquare"
              : "cardVerticalListing"}
          />
        </GridCell>
      ))}
    </div>
  );
}

function ListingsTabContent({
  dispensers,
  view,
  pagination,
}: {
  dispensers: DispenserRow[];
  view: ViewMode;
  pagination?: WalletContainerPagination | undefined;
}) {
  const withStamps = dispensers.filter((d) => d.stamp);
  const open = withStamps.filter((d) => d.give_remaining > 0).map(
    dispenserToListingStamp,
  );
  const closed = withStamps.filter((d) => d.give_remaining === 0).map(
    dispenserToListingStamp,
  );

  if (!open.length && !closed.length) {
    return <EmptyState label="NO LISTINGS FOUND" />;
  }

  return (
    <div class="flex flex-col gap-8">
      {open.length > 0 && (
        <div id="open-listings-section">
          <h3 class={subtitleNeutral}>OPEN LISTINGS - {open.length}</h3>
          <ListingsGroup stamps={open} view={view} />
        </div>
      )}
      {closed.length > 0 && (
        <div id="closed-listings-section">
          <h3 class={subtitleNeutral}>CLOSED LISTINGS - {closed.length}</h3>
          <ListingsGroup stamps={closed} view={view} />
        </div>
      )}
      <PaginationBlock pagination={pagination} prefix="stamps" />
    </div>
  );
}

/* ===== STAMPS: COLLECTIONS (stacked CollectionCard list) ===== */
function CollectionsTabContent({
  collections,
  pagination,
}: {
  collections: any[];
  pagination?: WalletContainerPagination | undefined;
}) {
  if (!collections.length) {
    return <EmptyState label="NO COLLECTIONS FOUND" />;
  }
  return (
    <div class="flex flex-col gap-6">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.collection_id}
          collection={collection}
        />
      ))}
      <PaginationBlock pagination={pagination} prefix="stamps" />
    </div>
  );
}

/* ===== STAMPS CONTAINER BODY (switches on active sub-tab) ===== */
function StampsTabContent({
  tab,
  view,
  data,
  pagination,
}: {
  tab: WalletStampsTab;
  view: ViewMode;
  data: any[];
  pagination?: WalletContainerPagination | undefined;
}) {
  if (tab === "collections") {
    return <CollectionsTabContent collections={data} pagination={pagination} />;
  }
  if (tab === "listings") {
    return (
      <ListingsTabContent
        dispensers={data as DispenserRow[]}
        view={view}
        pagination={pagination}
      />
    );
  }
  return (
    <StampsGridContent
      stamps={data as StampRow[]}
      view={view}
      pagination={pagination}
      emptyLabel={tab === "stamped"
        ? "NO STAMPS CREATED BY THIS ADDRESS"
        : "NO STAMPS IN THE WALLET"}
    />
  );
}

/* ===== TOKENS CONTAINER BODY (switches on active sub-tab) ===== */
function TokensTabContent({
  tab,
  view,
  data,
  pagination,
}: {
  tab: WalletTokensTab;
  view: ViewMode;
  data: any[];
  pagination?: WalletContainerPagination | undefined;
}) {
  if (!data.length) {
    return (
      <EmptyState
        label={tab === "deployed"
          ? "NO TOKENS DEPLOYED BY THIS ADDRESS"
          : "NO TOKENS IN THE WALLET"}
      />
    );
  }

  if (view === "cardRow") {
    return (
      <>
        <SRC20OverviewCompact
          data={data}
          fromPage="wallet"
          onImageClick={() => {}}
        />
        <PaginationBlock pagination={pagination} prefix="tokens" />
      </>
    );
  }

  return (
    <>
      <div class={cardGridClass}>
        {data.map((src20) => (
          <GridCell key={src20.tx_hash} view={view}>
            <SRC20Card
              src20={src20}
              variant={view === "cardSquare"
                ? "cardSquare"
                : "cardVerticalDetail"}
            />
          </GridCell>
        ))}
      </div>
      <PaginationBlock pagination={pagination} prefix="tokens" />
    </>
  );
}

/* ===== MAIN COMPONENT ===== */
export default function WalletProfileContent({
  address: _address,
  anchor,
  stampsTab = "collected",
  stampsView = "cardVertical",
  stampsData = [],
  stampsPagination,
  tokensTab = "collected",
  tokensView = "cardVertical",
  tokensData = [],
  tokensPagination,
}: WalletProfileContentProps) {
  /* ===== EFFECTS ===== */
  useEffect(() => {
    if (anchor) {
      const sectionMap: Record<string, string> = {
        stamp: "stamps-section",
        stamps: "stamps-section",
        tokens: "tokens-section",
        src20: "tokens-section",
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

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col gap-6">
      {/* Stamps Container */}
      <div id="stamps-section" class={containerBackground}>
        <WalletStampsHeader activeTab={stampsTab} viewMode={stampsView} />
        <div class="pt-3 mobileMd:pt-6">
          <StampsTabContent
            tab={stampsTab}
            view={stampsView}
            data={stampsData}
            pagination={stampsPagination}
          />
        </div>
      </div>

      {/* Tokens Container */}
      <div id="tokens-section" class={containerBackground}>
        <WalletTokensHeader activeTab={tokensTab} viewMode={tokensView} />
        <div class="pt-3 mobileMd:pt-6">
          <TokensTabContent
            tab={tokensTab}
            view={tokensView}
            data={tokensData}
            pagination={tokensPagination}
          />
        </div>
      </div>
    </div>
  );
}
