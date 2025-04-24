/* ===== SRC20 OVERVIEW PAGE ===== */
/*@baba-149*/
import { Handlers } from "$fresh/server.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { SRC20OverviewContent } from "$content";

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
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 11;

      // Market data is always included for minted tokens
      const marketInfo = await SRC20Service.MarketService
        .fetchMarketListingSummary();

      // Extract market and date filters
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

      // Fetch only minted tokens
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
            onlyFullyMinted: true,
            includeMarketData: true,
          },
        );

      if (!("total" in resultData)) {
        throw new Error("Expected paginated response");
      }

      /* ===== RESPONSE FORMATTING - @fullman ===== */
      const src20Data = await Promise.all(resultData.data.map(async (item) => {
        const chartData = await fetch(
          `https://api.stampscan.xyz/utxo/combinedListings?tick=${item.tick}&limit=100`,
        ).then((r) => r.json());
        const highchartsData = chartData.map((cItem) => [
          new Date(cItem.create_time).getTime(),
          cItem.price,
        ]).sort((a, b) => a[0] - b[0]);

        return {
          ...item,
          floor_unit_price: marketInfo.find((m) =>
            m.tick.toLowerCase() === item.tick.toLowerCase()
          )?.floor_unit_price || null,
          chart: highchartsData,
        };
      }));

      return ctx.render({
        src20s: src20Data,
        total: resultData.total,
        page: resultData.page,
        totalPages: resultData.totalPages,
        limit: resultData.limit || limit,
        filterBy,
        sortBy,
      });
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function SRC20OverviewPage({ data }: any) {
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
  } = data;

  return (
    <SRC20OverviewContent
      initialData={src20s}
      page={page}
      totalPages={totalPages}
      filterBy={filterBy}
      sortBy={sortBy}
    />
  );
}
