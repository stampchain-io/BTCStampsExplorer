/* ===== WALLET CONTENT COMPONENT ===== */
import { PaginationButtons } from "$button";
import { CollectionCard, SRC20Card, StampCard } from "$card";
import { StampOverviewTable } from "$components/table/explorerTable/StampOverview.tsx";
import { StampListingsTable } from "$components/table/marketplaceTable/StampListings.tsx";
import { SRC20OverviewCompact } from "$components/table/src20OverviewTable/SRC20OverviewCompact.tsx";
import { WalletHeaderContent } from "$header";
import {
  containerBackground,
  gridCardWallet,
  rowContainerBackground,
} from "$layout";
import { subtitleNeutral, valueDarkSm } from "$text";
import type { DispenserRow, StampRow } from "$types/stamp.d.ts";
import type {
  WalletContainerPagination,
  WalletContentProps,
  WalletContentTabId,
  WalletContentTabIdSub,
  WalletStampsTab,
  WalletTokensTab,
} from "$types/ui.d.ts";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";

/* ===== VIEW TYPES ===== */
// "cardHorizontal" is a reserved placeholder for a future layout — none of
// the render branches below handle it yet (gridCardWallet falls back to
// the Md grid, and no tab switches on it).
type ViewMode = "cardVertical" | "cardSquare" | "cardRow" | "cardHorizontal";

/* ===== TAB MAPPING ===== */
// The header exposes one unified sub-tab (balance/created/listings/
// collections) that drives both the Stamps and Tokens panels at once —
// map it back to each side's existing internal tab type so
// StampsTabContent/TokensTabContent don't need to change.
function mapTabToStampsTab(tab: WalletContentTabIdSub): WalletStampsTab {
  return tab;
}

function mapTabToTokensTab(tab: WalletContentTabIdSub): WalletTokensTab {
  // "listings"/"collections" have no Tokens equivalent — only reachable
  // when section === "stamps", where the Tokens panel isn't rendered.
  return tab === "created" ? "created" : "balance";
}

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
  if (!pagination) return null;
  return (
    <PaginationButtons
      page={pagination.page}
      totalPages={pagination.totalPages}
      prefix={prefix}
    />
  );
}

/* ===== GRID WRAPPER (matches ExplorerContent's card grid conventions) ===== */
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
  section,
  pagination,
  emptyLabel,
}: {
  stamps: StampRow[];
  view: ViewMode;
  section: WalletContentTabId;
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
      <div class={gridCardWallet(view, section, "stamps")}>
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
  section,
}: {
  stamps: (StampRow & { lowestPriceDispenser: DispenserRow })[];
  view: ViewMode;
  section: WalletContentTabId;
}) {
  if (view === "cardRow") {
    return <StampListingsTable stamps={stamps} />;
  }
  return (
    <div class={gridCardWallet(view, section, "stamps")}>
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
  section,
  pagination,
}: {
  dispensers: DispenserRow[];
  view: ViewMode;
  section: WalletContentTabId;
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
          <ListingsGroup stamps={open} view={view} section={section} />
        </div>
      )}
      {closed.length > 0 && (
        <div id="closed-listings-section">
          <h3 class={subtitleNeutral}>CLOSED LISTINGS - {closed.length}</h3>
          <ListingsGroup stamps={closed} view={view} section={section} />
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
  section,
  data,
  pagination,
}: {
  tab: WalletStampsTab;
  view: ViewMode;
  section: WalletContentTabId;
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
        section={section}
        pagination={pagination}
      />
    );
  }
  return (
    <StampsGridContent
      stamps={data as StampRow[]}
      view={view}
      section={section}
      pagination={pagination}
      emptyLabel={tab === "created"
        ? "NO STAMPS CREATED BY THIS ADDRESS"
        : "NO STAMPS IN THE WALLET"}
    />
  );
}

/* ===== TOKENS CONTAINER BODY (switches on active sub-tab) ===== */
function TokensTabContent({
  tab,
  view,
  section,
  data,
  pagination,
}: {
  tab: WalletTokensTab;
  view: ViewMode;
  section: WalletContentTabId;
  data: any[];
  pagination?: WalletContainerPagination | undefined;
}) {
  if (!data.length) {
    return (
      <EmptyState
        label={tab === "created"
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
      <div class={gridCardWallet(view, section, "tokens")}>
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
export default function WalletContent({
  address: _address,
  anchor,
  section = "all",
  tab = "balance",
  view = "cardVertical",
  stampsData = [],
  stampsPagination,
  tokensData = [],
  tokensPagination,
}: WalletContentProps) {
  /* ===== EFFECTS ===== */
  useEffect(() => {
    if (anchor) {
      const sectionMap: Record<string, string> = {
        stamp: "stamps-panel",
        stamps: "stamps-panel",
        tokens: "tokens-panel",
        src20: "tokens-panel",
        open_listings: "open-listings-section",
        closed_listings: "closed-listings-section",
        wallet: "wallet-content-section",
      };
      const sectionId = sectionMap[anchor];
      if (sectionId) {
        // "stamps-panel"/"tokens-panel" only exist when section === "all"
        // (split view) — fall back to the outer container otherwise.
        const element = document.getElementById(sectionId) ??
          document.getElementById("wallet-content-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [anchor]);

  /* ===== DERIVED TAB VALUES ===== */
  const stampsTab = mapTabToStampsTab(tab);
  const tokensTab = mapTabToTokensTab(tab);

  /* ===== RENDER ===== */
  return (
    <div id="wallet-content-section" class={containerBackground}>
      <WalletHeaderContent section={section} tab={tab} viewMode={view} />
      <div class={`w-full ${view !== "cardRow" ? "pt-5" : "pt-2"}`}>
        {section === "all"
          ? (
            <div class="flex flex-col tablet:flex-row gap-6">
              <div
                id="tokens-panel"
                class="w-full tablet:w-1/2 desktop:w-1/3"
              >
                <TokensTabContent
                  tab={tokensTab}
                  view={view}
                  section={section}
                  data={tokensData}
                  pagination={tokensPagination}
                />
              </div>
              <div
                id="stamps-panel"
                class="w-full tablet:w-1/2 desktop:w-2/3"
              >
                <StampsTabContent
                  tab={stampsTab}
                  view={view}
                  section={section}
                  data={stampsData}
                  pagination={stampsPagination}
                />
              </div>
            </div>
          )
          : section === "stamps"
          ? (
            <StampsTabContent
              tab={stampsTab}
              view={view}
              section={section}
              data={stampsData}
              pagination={stampsPagination}
            />
          )
          : (
            <TokensTabContent
              tab={tokensTab}
              view={view}
              section={section}
              data={tokensData}
              pagination={tokensPagination}
            />
          )}
      </div>
    </div>
  );
}
