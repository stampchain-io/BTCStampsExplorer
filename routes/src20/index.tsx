/* ===== SRC20 OVERVIEW PAGE ===== */
/*@baba-149*/
import { Handlers } from "$fresh/server.ts";
import { SRC20OverviewContent } from "$content";
import { Src20Controller } from "$server/controller/src20Controller.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 20;
      const timeframe = (url.searchParams.get("timeframe") || "24H") as
        | "24H"
        | "3D"
        | "7D";
      const sortBy = url.searchParams.get("sortBy") || "TRENDING";
      const sortDirection = url.searchParams.get("sortDirection") || "desc";

      // Use controller methods with sorting parameters
      const [mintedData, mintingData] = await Promise.all([
        Src20Controller.fetchFullyMintedByMarketCapV2(
          limit,
          page,
          sortBy,
          sortDirection,
        ),
        Src20Controller.fetchTrendingActiveMintingTokensV2(
          limit,
          page,
          1000,
          sortBy,
          sortDirection,
        ),
      ]);

      // Debug pagination data
      console.log("Debug Pagination:", {
        minted: {
          dataLength: mintedData.data.length,
          total: mintedData.total,
          page: mintedData.page,
          totalPages: mintedData.totalPages,
        },
        minting: {
          dataLength: mintingData.data.length,
          total: mintingData.total,
          page: mintingData.page,
          totalPages: mintingData.totalPages,
        },
      });

      return ctx.render({
        mintedData: {
          data: mintedData.data,
          total: mintedData.total,
          page: mintedData.page,
          totalPages: mintedData.totalPages,
        },
        mintingData: {
          data: mintingData.data,
          total: mintingData.total,
          page: mintingData.page,
          totalPages: mintingData.totalPages,
        },
        limit,
        timeframe,
        sortBy,
        sortDirection,
      });
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function SRC20OverviewPage({ data }: any) {
  if (!data || (!data.mintedData && !data.mintingData)) {
    return <div>Error: No data received</div>;
  }

  const {
    mintedData,
    mintingData,
    timeframe = "24H",
    sortBy = "TRENDING",
    sortDirection = "desc",
  } = data;

  return (
    <SRC20OverviewContent
      mintedData={mintedData}
      mintingData={mintingData}
      timeframe={timeframe}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
}
