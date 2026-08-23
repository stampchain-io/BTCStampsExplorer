/* ===== WALLET CONTENT COMPONENT ===== */
import { PaginationButtons } from "$button";
import {
  CollectionCardSquare,
  CollectionCardVertical,
  SRC20Card,
  StampCard,
} from "$card";
import { WalletHeaderContent } from "$header";
import { containerBackground, EmptyState, gridCardWallet } from "$layout";
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

/* ===== VIEW TYPES =====
 * "cardRow" is temporarily disabled — the wallet-specific table variants
 * (StampOverviewTable/StampListingsTable/SRC20OverviewCompact) aren't
 * updated for this layout yet, so the ViewButton (see WalletHeaderContent)
 * no longer offers it and the route no longer accepts it as a `view`
 * value. "cardHorizontal" is a reserved placeholder for a future layout —
 * none of the render branches below handle it yet (gridCardWallet falls
 * back to the Md grid, and no tab switches on it). */
type ViewMode = "cardVertical" | "cardSquare" | "cardHorizontal";

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

/* ===== STAMPS: BALANCE (stamps held by this address) ===== */
function BalanceTabContent({
  stamps,
  view,
  section,
  pagination,
}: {
  stamps: StampRow[];
  view: ViewMode;
  section: WalletContentTabId;
  pagination?: WalletContainerPagination | undefined;
}) {
  if (!stamps.length) {
    return <EmptyState label="NO ART STAMPS IN THE WALLET" icon="artStamps" />;
  }

  return (
    <>
      <div class={gridCardWallet(view, section, "stamps")}>
        {stamps.map((stamp) => (
          <GridCell key={stamp.tx_hash} view={view}>
            <StampCard
              stamp={stamp}
              variant={view === "cardSquare"
                ? "cardSquareBalance"
                : "cardVerticalBalance"}
            />
          </GridCell>
        ))}
      </div>
      <PaginationBlock pagination={pagination} prefix="stamps" />
    </>
  );
}

/* ===== STAMPS: CREATED (stamps minted by this address, not necessarily
 * still held) — regular supply pill rather than the wallet's BALANCE pill,
 * since "created" stamps aren't necessarily held by this wallet. ===== */
function CreatedTabContent({
  stamps,
  view,
  section,
  pagination,
}: {
  stamps: StampRow[];
  view: ViewMode;
  section: WalletContentTabId;
  pagination?: WalletContainerPagination | undefined;
}) {
  if (!stamps.length) {
    return (
      <EmptyState label="NO STAMPS CREATED BY THIS ADDY" icon="artStamps" />
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
                ? "cardSquareDetail"
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
  isClosed = false,
}: {
  stamps: (StampRow & { lowestPriceDispenser: DispenserRow })[];
  view: ViewMode;
  section: WalletContentTabId;
  isClosed?: boolean;
}) {
  return (
    <div class={gridCardWallet(view, section, "stamps")}>
      {stamps.map((stamp) => (
        <GridCell key={stamp.lowestPriceDispenser.tx_hash} view={view}>
          <div class="relative">
            <StampCard
              stamp={stamp}
              variant={view === "cardSquare"
                ? "cardSquareBalance"
                : "cardVerticalBalance"}
            />
            {isClosed && (
              <div class="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-b from-color-neutral-950/95 via-color-neutral-900/70 to-color-neutral-1000/90 pointer-events-none">
                <span class="font-bold text-sm text-color-neutral-400">
                  CLOSED
                </span>
              </div>
            )}
          </div>
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
    return <EmptyState label="NO LISTINGS FOUND" icon="artStamps" />;
  }

  return (
    <div class="flex flex-col gap-8">
      {open.length > 0 && (
        <div id="open-listings-section">
          <ListingsGroup stamps={open} view={view} section={section} />
        </div>
      )}
      {closed.length > 0 && (
        <div id="closed-listings-section">
          <ListingsGroup
            stamps={closed}
            view={view}
            section={section}
            isClosed
          />
        </div>
      )}
      <PaginationBlock pagination={pagination} prefix="stamps" />
    </div>
  );
}

/* ===== STAMPS: COLLECTIONS (grid, mirrors Balance/CreatedTabContent) ===== */
function CollectionsTabContent({
  collections,
  view,
  section,
  pagination,
}: {
  collections: any[];
  view: ViewMode;
  section: WalletContentTabId;
  pagination?: WalletContainerPagination | undefined;
}) {
  if (!collections.length) {
    return <EmptyState label="NO COLLECTIONS FOUND" icon="artStamps" />;
  }
  return (
    <>
      <div class={gridCardWallet(view, section, "stamps")}>
        {collections.map((collection) => (
          <GridCell key={collection.collection_id} view={view}>
            {view === "cardSquare"
              ? <CollectionCardSquare collection={collection} />
              : <CollectionCardVertical collection={collection} />}
          </GridCell>
        ))}
      </div>
      <PaginationBlock pagination={pagination} prefix="stamps" />
    </>
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
    return (
      <CollectionsTabContent
        collections={data}
        view={view}
        section={section}
        pagination={pagination}
      />
    );
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
  if (tab === "created") {
    return (
      <CreatedTabContent
        stamps={data as StampRow[]}
        view={view}
        section={section}
        pagination={pagination}
      />
    );
  }
  return (
    <BalanceTabContent
      stamps={data as StampRow[]}
      view={view}
      section={section}
      pagination={pagination}
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
          ? "NO TOKENS DEPLOYED BY THIS ADDY"
          : "NO SRC20 TOKENS IN THE WALLET"}
        icon="src20Tokens"
      />
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
                ? "cardSquareBalance"
                : "cardVerticalBalance"}
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
  view: rawView = "cardVertical",
  stampsData = [],
  stampsPagination,
  tokensData = [],
  tokensPagination,
}: WalletContentProps) {
  // "cardRow" is disabled here (see the ViewMode comment above) — the route
  // already excludes it from the `view` query param, but fall back safely
  // in case a stale value ever reaches this component directly.
  const view: ViewMode = rawView === "cardRow" ? "cardVertical" : rawView;
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

  /* ===== DERIVED TAB VALUES =====
   * "all" only ever shows Balance data (its tab selector is hidden) — force
   * "balance" here too in case a stale `tab` query param slips through. */
  const effectiveTab: WalletContentTabIdSub = section === "all"
    ? "balance"
    : tab;
  const stampsTab = mapTabToStampsTab(effectiveTab);
  const tokensTab = mapTabToTokensTab(effectiveTab);

  /* ===== RENDER ===== */
  return (
    <div id="wallet-content-section" class={containerBackground}>
      <WalletHeaderContent
        section={section}
        tab={tab}
        viewMode={view}
        stampsTotal={stampsPagination?.total}
        tokensTotal={tokensPagination?.total}
      />
      <div class="w-full pt-5">
        {section === "all"
          ? (
            <div class="flex flex-col tablet:flex-row gap-5">
              <div
                id="tokens-panel"
                class="w-full tablet:w-1/2 desktop:w-[37%]"
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
                class="w-full tablet:w-1/2 desktop:w-[63%]"
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
