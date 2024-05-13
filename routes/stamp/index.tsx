import { api_get_stamps } from "$lib/controller/stamp.ts";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { PageControl } from "$islands/PageControl.tsx";
import { BIG_LIMIT } from "constants";
import { StampRow } from "globals";
import { sort } from "https://deno.land/std@0.211.0/semver/sort.ts";
import { StampNavigator } from "../../islands/stamp/StampNavigator.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";
import { useEffect } from "preact/hooks";
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
    const page_size = parseInt(url.searchParams.get("limit") || BIG_LIMIT);
    const order = url.searchParams.get("order")?.toUpperCase() || "DESC";
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
      <StampNavigator initFilter={filterBy} initSort={sortBy} />
      <PageControl
        page={page}
        pages={pages}
        page_size={page_size}
        type={"stamp"}
        stamps={stamps}
      />
    </div>
  );
}
export default StampPage;
