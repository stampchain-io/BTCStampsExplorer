import { SRC20Row } from "globals";

import { Pagination } from "$components/Pagination.tsx";

import { HandlerContext } from "$fresh/server.ts";

import { SRC20Header } from "$islands/src20/SRC20Header.tsx";
import { SRC20DeployTable } from "$islands/src20/SRC20DeployTable.tsx";

import { api_get_src20s } from "$lib/controller/src20.ts";

type SRC20PageProps = {
  data: {
    src20s: SRC20Row[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    filterBy: any[];
    sortBy: string;
  };
};

export const handler = {
  async GET(req: Request, ctx: HandlerContext) {
    try {
      const url = new URL(req.url);
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const sortBy = url.searchParams.get("sortBy") || "none";
      const page = Number(url.searchParams.get("page")) || 1;
      const page_size = Number(url.searchParams.get("limit")) || 11;

      const { src20s, total, pages, page: pag, page_size: limit } =
        await api_get_src20s(
          page,
          page_size,
        );

      const data = {
        src20s: src20s.map((row: SRC20Row) => {
          return {
            ...row,
            max: row.max ? row.max.toString() : null,
            lim: row.lim ? row.lim.toString() : null,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
        total,
        page: pag,
        pages,
        page_size: limit,
        filterBy,
        sortBy,
      };
      return await ctx.render(data);
    } catch (error) {
      console.error(error);
      const data = { error: `Error: Internal server error` };
      return ctx.render(data);
    }
  },
};

export function SRC20Page(props: SRC20PageProps) {
  const { src20s, total, page, pages, page_size, filterBy, sortBy } =
    props.data;
  return (
    <div class="flex flex-col gap-8">
      <SRC20Header filterBy={filterBy} sortBy={sortBy} />
      <SRC20DeployTable data={src20s} />
      <Pagination
        page={page}
        pages={pages}
        page_size={page_size}
        type={"src20"}
        data_length={src20s.length}
      />
    </div>
  );
}
export default SRC20Page;
