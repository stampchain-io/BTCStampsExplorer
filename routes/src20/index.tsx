import { Handlers } from "$fresh/server.ts";
import { SRC20TrxRequestParams } from "globals";

import { SRC20Header } from "$islands/src20/SRC20Header.tsx";
import { SRC20DeployTable } from "$islands/src20/all/SRC20DeployTable.tsx";
import { SRC20MintingTable } from "$islands/src20/minting/SRC20MintingTable.tsx";
import LatestMints from "$islands/src20/minting/LatestMints.tsx";
import { SRC20TrendingMints } from "$islands/src20/trending/SRC20TrendingMints.tsx";

import { Pagination } from "$islands/pagination/Pagination.tsx";
import { DeployMintModule } from "$islands/modules/DeployMint.tsx";

import { Src20Controller } from "$lib/controller/src20Controller.ts";

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
          Number(url.searchParams.get("transactionCount")) || 1000; // Allow dynamic adjustment if needed
        const trendingData = await Src20Controller.fetchTrendingTokens(
          req,
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
        // Existing code for 'all' and 'minting' tabs
        const params: SRC20TrxRequestParams = {
          op: "DEPLOY",
          page,
          limit,
          sortBy, // Changed from 'sort: sortBy' to 'sortBy'
        };

        const excludeFullyMinted = selectedTab === "minting";

        const resultData = await Src20Controller.fetchSrc20DetailsWithHolders(
          req,
          params,
          excludeFullyMinted,
        );

        data = {
          src20s: resultData.data || [],
          total: resultData.total || 0,
          page: resultData.page || 1,
          totalPages: resultData.totalPages || 1,
          limit: resultData.limit || limit,
          filterBy,
          sortBy,
          selectedTab,
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
    total = 0,
    page = 1,
    totalPages = 1,
    limit = 11,
    filterBy = [],
    sortBy = "ASC",
    selectedTab,
  } = data;

  if (!src20s || src20s.length === 0) {
    return <div>No SRC20 data available</div>;
  }

  return (
    <div class="flex flex-col gap-8">
      <SRC20Header
        filterBy={filterBy}
        sortBy={sortBy}
        selectedTab={selectedTab}
      />
      {selectedTab === "all" && <SRC20DeployTable data={data.src20s} />}
      {selectedTab === "trending" && <SRC20TrendingMints data={data.src20s} />}
      <Pagination
        page={page}
        pages={totalPages}
        page_size={limit}
        type={"src20"}
        data_length={src20s.length}
      />
      {selectedTab === "all" && <DeployMintModule />}
      {selectedTab === "trending" && <DeployMintModule />}
    </div>
  );
}
