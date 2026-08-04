/* ===== EXPLORER CONTENT COMPONENT ===== */
import { PaginationButtons } from "$button";
import { StampCard } from "$card";
import {
  ExplorerTableBase,
  type MixedItem,
} from "$components/table/explorerTable/ExplorerTableBase.tsx";
import { SRC20Card } from "$islands/card/SRC20Card.tsx";
import { container2, gridCard } from "$layout";
import { valueDarkSm } from "$text";
import type { ExplorerContentProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function ExplorerContent({
  stamps,
  isRecentSales = false,
  pagination,
  src20DataCard,
  section = "all",
  viewMode = "cardVertical",
}: ExplorerContentProps) {
  /* ===== MERGE + SORT by block_index DESC ===== */
  const stampItems: MixedItem[] = (stamps ?? []).map((s) => ({
    kind: "stamp",
    item: s,
  }));
  const src20Items: MixedItem[] = (src20DataCard?.data ?? []).map((s) => ({
    kind: "src20",
    item: s,
  }));

  const mixed: MixedItem[] = [...stampItems, ...src20Items].sort(
    (a, b) => Number(b.item.block_index) - Number(a.item.block_index),
  );

  /* ===== FILTER by section ===== */
  const visible: MixedItem[] = section === "stamps"
    ? mixed.filter((e) => e.kind === "stamp")
    : section === "tokens"
    ? mixed.filter((e) => e.kind === "src20")
    : mixed;

  /* ===== RENDER ===== */
  return (
    <div
      class={`w-full ${viewMode !== "cardRow" ? "pt-3 mobileMd:pt-6" : "pt-3"}`}
    >
      {viewMode === "cardRow"
        ? (
          /* ===== ROW TABLE VIEW ===== */
          <ExplorerTableBase items={visible} />
        )
        : visible.length === 0
        ? (
          <div
            class={`${container2} flex-col flex justify-center items-center`}
          >
            <img src="/img/ic_content.svg" width="160" />
            <h6 class={`pb-3 ${valueDarkSm} text-center`}>
              {section === "stamps"
                ? "NO STAMPS TO DISPLAY"
                : section === "tokens"
                ? "NO TOKENS TO DISPLAY"
                : "NO STAMPS OR TOKENS TO DISPLAY"}
            </h6>
          </div>
        )
        : (
          /* ===== CARD GRID VIEW ===== */
          <div class={gridCard(viewMode)}>
            {visible.map((entry, index) => {
              const key = entry.kind === "stamp"
                ? (isRecentSales && entry.item.sale_data
                  ? `${entry.item.tx_hash}-${entry.item.sale_data.tx_hash}-${entry.item.sale_data.block_index}-${index}`
                  : entry.item.tx_hash)
                : entry.item.tx_hash;

              const card = entry.kind === "stamp"
                ? (
                  <StampCard
                    stamp={entry.item}
                    isRecentSale={isRecentSales}
                    variant={viewMode === "cardSquare"
                      ? "cardSquare"
                      : "cardVerticalDetail"}
                  />
                )
                : (
                  <SRC20Card
                    src20={entry.item}
                    variant={viewMode === "cardSquare"
                      ? "cardSquare"
                      : "cardVerticalDetail"}
                  />
                );

              // MINIMAL view: square each cell so a taller SRC20 card can't
              // stretch the row and break the stamp's 1:1 aspect ratio.
              // Detailed view is rendered exactly as before.
              return viewMode === "cardSquare"
                ? (
                  <div key={key} class="w-full max-w-72 mx-auto aspect-square">
                    {card}
                  </div>
                )
                : <div key={key} class="contents">{card}</div>;
            })}
          </div>
        )}

      {/* ===== PAGINATION ===== */}
      {pagination && pagination.totalPages > 1 && (
        <div class="mt-7.5 tablet:mt-10">
          <PaginationButtons
            page={pagination.page}
            totalPages={pagination.totalPages}
            {...(pagination.prefix && { prefix: pagination.prefix })}
            {...(pagination.onPageChange &&
              { onPageChange: pagination.onPageChange })}
          />
        </div>
      )}
    </div>
  );
}
