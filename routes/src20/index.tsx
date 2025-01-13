import { Handlers } from "$fresh/server.ts";
import { SRC20TrxRequestParams } from "$globals";
import { SRC20Header } from "$islands/src20/SRC20Header.tsx";
import { SRC20Section } from "$islands/src20/SRC20Section.tsx";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const sortBy = url.searchParams.get("sortBy") || "ASC";
      const selectedTab = url.searchParams.get("type") || "all";
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 11;

      let data;

      if (selectedTab === "trending") {
        const transactionCount =
          Number(url.searchParams.get("transactionCount")) || 1000;
        const trendingData = await Src20Controller
          .fetchTrendingActiveMintingTokensV2(
            limit,
            page,
            transactionCount,
          );

        data = {
          src20s: trendingData.data || [],
          total: trendingData.total || 0,
          page: trendingData.page || 1,
          totalPages: trendingData.totalPages || 1,
          limit: trendingData.limit || limit,
          filterBy,
          sortBy,
          selectedTab,
        };
      } else {
        const excludeFullyMinted = selectedTab === "minting";
        const onlyFullyMinted = !excludeFullyMinted;

        // Prepare base parameters
        const baseParams: SRC20TrxRequestParams = {
          op: "DEPLOY",
          page,
          limit,
          sortBy,
          filterBy,
        };

        // Add market data filters if they exist
        const marketFilters = {
          ...(url.searchParams.get("minMarketCap") && {
            minPrice: Number(url.searchParams.get("minMarketCap")),
          }),
          ...(url.searchParams.get("maxMarketCap") && {
            maxPrice: Number(url.searchParams.get("maxMarketCap")),
          }),
          ...(url.searchParams.get("minVolume") && {
            minVolume: Number(url.searchParams.get("minVolume")),
          }),
          ...(url.searchParams.get("maxVolume") && {
            maxVolume: Number(url.searchParams.get("maxVolume")),
          }),
          ...(url.searchParams.get("minPrice") && {
            minPrice: Number(url.searchParams.get("minPrice")),
          }),
          ...(url.searchParams.get("maxPrice") && {
            maxPrice: Number(url.searchParams.get("maxPrice")),
          }),
          ...(url.searchParams.get("minHolder") && {
            minHolder: Number(url.searchParams.get("minHolder")),
          }),
          ...(url.searchParams.get("maxHolder") && {
            maxHolder: Number(url.searchParams.get("maxHolder")),
          }),
          ...(url.searchParams.get("minSupply") && {
            minSupply: Number(url.searchParams.get("minSupply")),
          }),
          ...(url.searchParams.get("maxSupply") && {
            maxSupply: Number(url.searchParams.get("maxSupply")),
          }),
          ...(url.searchParams.get("minTxCount") && {
            minTxCount: Number(url.searchParams.get("minTxCount")),
          }),
          ...(url.searchParams.get("maxTxCount") && {
            maxTxCount: Number(url.searchParams.get("maxTxCount")),
          }),
          ...(url.searchParams.get("minProgress") && {
            minProgress: Number(url.searchParams.get("minProgress")),
          }),
          ...(url.searchParams.get("maxProgress") && {
            maxProgress: Number(url.searchParams.get("maxProgress")),
          }),
          ...(url.searchParams.get("trendingDate") && {
            trendingDate: Number(url.searchParams.get("trendingDate")),
          }),
        };

        // Add date range filters if they exist
        const dateFilters = {
          ...(url.searchParams.get("dateFrom") && {
            dateFrom: new Date(url.searchParams.get("dateFrom")!).toISOString(),
          }),
          ...(url.searchParams.get("dateTo") && {
            dateTo: new Date(url.searchParams.get("dateTo")!).toISOString(),
          }),
        };

        // Determine if we need market data based on filters
        const hasMarketFilters = Object.keys(marketFilters).length > 0;
        const marketInfo = await SRC20Service.MarketService
          .fetchMarketListingSummary();

        const resultData = await SRC20Service.QueryService
          .fetchAndFormatSrc20DataV2(
            {
              ...baseParams,
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

        // We know this will be a paginated response based on the params
        if (
          !("total" in resultData) || !("page" in resultData) ||
          !("totalPages" in resultData)
        ) {
          throw new Error("Expected paginated response");
        }

        const src20Data = resultData.data.map((item) => {
          const marketItem = marketInfo.find((mItem) =>
            mItem.tick.toLowerCase() === item.tick.toLowerCase()
          );
          return {
            ...item,
            floor_unit_price: marketItem ? marketItem.floor_unit_price : null, // Handle cases where no matching market item is found
          };
        });

        data = {
          src20s: src20Data || [],
          total: resultData.total,
          page: resultData.page,
          totalPages: resultData.totalPages,
          limit: resultData.limit || limit,
          filterBy,
          sortBy,
        };
      }

      return ctx.render({ data });
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

export default function SRC20Page(props: any) {
  if (!props || !props.data) {
    return <div>Error: No data received</div>;
  }

  const { data } = props.data;
  const {
    src20s = [],
    page = 1,
    totalPages = 1,
    filterBy = [],
    sortBy = "ASC",
    selectedTab = "all",
  } = data;

  if (!src20s || src20s.length === 0) {
    return <div>No SRC20 data available</div>;
  }

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
