import { Handlers } from "$fresh/server.ts";
import { SRC20TrxRequestParams } from "$globals";
import { SRC20Header } from "$islands/src20/SRC20Header.tsx";
import { SRC20Section } from "$islands/src20/SRC20Section.tsx";
import { Src20Controller } from "$server/controller/src20Controller.ts";

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
          .fetchTrendingActiveMintingTokens(
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
        const params: SRC20TrxRequestParams = {
          op: "DEPLOY",
          page,
          limit,
          sortBy,
        };

        const excludeFullyMinted = selectedTab === "minting";
        const onlyFullyMinted = !excludeFullyMinted;

        const resultData = await Src20Controller.fetchSrc20DetailsWithHolders(
          params,
          excludeFullyMinted,
          onlyFullyMinted,
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
    page = 1,
    totalPages = 1,
    filterBy = [],
    sortBy = "ASC",
    selectedTab,
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
