import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20OverviewHeader } from "$header";
import { SRC20Gallery } from "$section";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 11;
      const transactionCount =
        Number(url.searchParams.get("transactionCount")) || 1000;
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const sortBy = url.searchParams.get("sortBy") || "ASC";

      // Fetch trending minting tokens
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
      });
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

export default function SRC20MintingPage({ data }: any) {
  if (!data || !data.src20s) {
    return <div>Error: No data received</div>;
  }
  if (data.src20s.length === 0) {
    return <div>No minting SRC20 tokens available</div>;
  }

  const {
    src20s = [],
    page = 1,
    totalPages = 1,
    filterBy = [],
    sortBy = "ASC",
  } = data;

  return (
    <div class="flex flex-col">
      <SRC20OverviewHeader
        filterBy={filterBy}
        sortBy={sortBy}
        title="Minting SRC-20 Tokens"
      />
      <SRC20Gallery
        viewType="minting"
        fromPage="src20"
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
    </div>
  );
}
