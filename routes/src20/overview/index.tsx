/* ===== SRC20 OVERVIEW PAGE ===== */
import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { SRC20Header, SRC20Section } from "$src20";

/* ===== HELPERS ===== */
const getNumericParam = (url: URL, param: string, defaultValue: number) =>
  Number(url.searchParams.get(param)) || defaultValue;

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      /* ===== QUERY PARAMETERS ===== */
      const url = new URL(req.url);
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const sortBy = url.searchParams.get("sortBy") || "ASC";
      const selectedTab = url.searchParams.get("type") || "all";
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 11;

      /* ===== DATA FETCHING ===== */
      if (selectedTab === "trending") {
        const transactionCount = getNumericParam(url, "transactionCount", 1000);
        const trendingData = await Src20Controller
          .fetchTrendingActiveMintingTokensV2(
            limit,
            page,
            transactionCount,
          );

        return ctx.render({
          src20s: trendingData.data || [],
          total: trendingData.total || 0,
          page: trendingData.page || 1,
          totalPages: trendingData.totalPages || 1,
          limit: trendingData.limit || limit,
          filterBy,
          sortBy,
          selectedTab,
        });
      }

      const excludeFullyMinted = selectedTab === "minting";
      const onlyFullyMinted = !excludeFullyMinted;

      // Extract market and date filters from URL parameters
      const marketFilters = [
        "minMarketCap",
        "maxMarketCap",
        "minVolume",
        "maxVolume",
        "minPrice",
        "maxPrice",
        "minHolder",
        "maxHolder",
        "minSupply",
        "maxSupply",
        "minTxCount",
        "maxTxCount",
        "minProgress",
        "maxProgress",
        "trendingDate",
      ].reduce((acc, key) => {
        const value = url.searchParams.get(key);
        if (value) acc[key] = Number(value);
        return acc;
      }, {} as Record<string, number>);

      const dateFilters = ["dateFrom", "dateTo"].reduce((acc, key) => {
        const value = url.searchParams.get(key);
        if (value) acc[key] = new Date(value).toISOString();
        return acc;
      }, {} as Record<string, string>);

      const hasMarketFilters = Object.keys(marketFilters).length > 0;
      const marketInfo = await SRC20Service.MarketService
        .fetchMarketListingSummary();

      const resultData = await SRC20Service.QueryService
        .fetchAndFormatSrc20DataV2(
          {
            op: "DEPLOY",
            page,
            limit,
            sortBy,
            filterBy,
            ...marketFilters,
            ...dateFilters,
          },
          {
            excludeFullyMinted,
            onlyFullyMinted,
            includeMarketData: onlyFullyMinted || hasMarketFilters,
            enrichWithProgress: true,
          },
        );

      if (!("total" in resultData)) {
        throw new Error("Expected paginated response");
      }

      /* ===== RESPONSE FORMATTING ===== */
      const src20Data = resultData.data.map((item) => ({
        ...item,
        floor_unit_price: marketInfo.find((m) =>
          m.tick.toLowerCase() === item.tick.toLowerCase()
        )?.floor_unit_price || null,
      }));

      return ctx.render({
        src20s: src20Data,
        total: resultData.total,
        page: resultData.page,
        totalPages: resultData.totalPages,
        limit: resultData.limit || limit,
        filterBy,
        sortBy,
        selectedTab,
      });
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function SRC20Page({ data }: any) {
  console.log("data=====>", data);
  if (!data || !data.src20s) {
    return <div>Error: No data received</div>;
  }
  if (data.src20s.length === 0) return <div>No SRC20 data available</div>;

  const {
    src20s = [],
    page = 1,
    totalPages = 1,
    filterBy = [],
    sortBy = "ASC",
    selectedTab = "all",
  } = data;

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col gap-9 mobileLg:gap-[72px]">
      <SRC20Header
        filterBy={filterBy}
        sortBy={sortBy}
        selectedTab={selectedTab}
      />
      {selectedTab === "all" && (
        <SRC20Section
          type="all"
          fromPage="src20"
          sortBy={sortBy}
          initialData={src20s}
          pagination={{
            page,
            totalPages,
            onPageChange: (newPage: number) => {
              const url = new URL(globalThis.location.href);
              url.searchParams.set("page", newPage.toString());
              globalThis.location.href = url.toString();
            },
          }}
        />
      )}
      {selectedTab === "trending" && (
        <SRC20Section
          type="trending"
          fromPage="src20"
          sortBy={sortBy}
          initialData={src20s}
          pagination={{
            page,
            totalPages,
            onPageChange: (newPage: number) => {
              const url = new URL(globalThis.location.href);
              url.searchParams.set("page", newPage.toString());
              globalThis.location.href = url.toString();
            },
          }}
        />
      )}
    </div>
  );
}
