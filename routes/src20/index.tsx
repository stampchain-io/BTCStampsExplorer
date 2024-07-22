import { SRC20Row } from "globals";

import { Pagination } from "$components/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";

import { SRC20Header } from "$islands/src20/SRC20Header.tsx";
import { SRC20DeployTable } from "$islands/src20/SRC20DeployTable.tsx";

import { Src20Controller } from "$lib/controller/src20Controller.ts";

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

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const sortBy = url.searchParams.get("sortBy") || "none";
      const page = Number(url.searchParams.get("page")) || 1;
      const page_size = Number(url.searchParams.get("limit")) || 11;

      const result = await Src20Controller.getSrc20s(page, page_size);

      const data = {
        ...result,
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
