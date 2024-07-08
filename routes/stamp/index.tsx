import { StampRow } from "globals";
import { Pagination } from "$components/Pagination.tsx";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { api_get_stamps } from "$lib/controller/stamp.ts";

import { PageControl } from "$islands/PageControl.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";

import { sort } from "https://deno.land/std@0.211.0/semver/sort.ts";
import { sortObject } from "https://deno.land/x/importmap@0.2.1/_util.ts";

type StampPageProps = {
  params: {
    stamps: StampRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
  };
};

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {
    const url = new URL(req.url);
    let filterBy = url.searchParams.get("filterBy")?.split(",") || [];
    const sortBy = url.searchParams.get("sortBy") || "none";
    console.log(filterBy, sortBy, "stamp");
    if (url.searchParams.get("filterBy") == "") filterBy = [];
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(
      url.searchParams.get("limit") || "24",
    );
    const order = url.searchParams.get("order")?.toUpperCase() || "ASC";
    const { stamps, total, pages, page: pag, page_size: limit } =
      await api_get_stamps(page, page_size, order, sortBy, filterBy);
    const data = {
      stamps,
      total,
      page: pag,
      pages,
      page_size: limit,
      filterBy,
      sortBy,
    };
    return await ctx.render(data);
  },
};

export function StampPage(props: StampPageProps) {
  const { stamps, total, page, pages, page_size, filterBy, sortBy } =
    props.data;
  const { setSortOption, setFilterOption, setFilter } = useNavigator();

  return (
    <div class="w-full flex flex-col items-center">
      <StampHeader filterBy={filterBy} sortBy={sortBy} />
      <PageControl
        stamps={stamps}
      />
      <Pagination
        page={page}
        pages={pages}
        page_size={page_size}
        type={"stamp"}
        data_length={stamps.length}
      />
    </div>
  );
}
export default StampPage;
