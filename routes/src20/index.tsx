import { Pagination } from "$islands/pagination/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";
import { SRC20Header } from "$islands/src20/SRC20Header.tsx";
import { SRC20DeployTable } from "$islands/src20/SRC20DeployTable.tsx";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { SRC20TrxRequestParams } from "globals";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const sortBy = url.searchParams.get("sortBy") || "ASC";
      const selectedTab = url.searchParams.get("ident") || "all";
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 11;

      const params: SRC20TrxRequestParams = {
        op: "DEPLOY",
        page,
        limit,
        sort: sortBy,
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );
      const resultData = await result.json();

      const data = {
        src20s: resultData.data || [],
        total: resultData.total || 0,
        page: resultData.page || 1,
        totalPages: resultData.totalPages || 1,
        limit: resultData.limit || limit,
        last_block: resultData.last_block || 0,
        filterBy,
        sortBy,
        selectedTab,
      };

      console.log("Handler sending data:", data);

      return ctx.render({ data });
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};
export default function SRC20Page(props: any) {
  // console.log("SRC20Page received props:", props);

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
      <SRC20DeployTable data={data.src20s} />
      <Pagination
        page={page}
        pages={totalPages}
        page_size={limit}
        type={"src20"}
        data_length={src20s.length}
      />
    </div>
  );
}
