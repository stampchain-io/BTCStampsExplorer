import { api_get_stamps } from "$lib/controller/stamp.ts";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { useNavigator } from "$islands/Navigator/navigator.tsx";
import { useContext } from "preact/hooks";
import { PageControl } from "$components/PageControl.tsx";
import { StampNavigator } from "$islands/StampNavigator.tsx";
import { StampCard } from "$components/StampCard.tsx";
import { BIG_LIMIT } from "constants";
import { StampRow } from "globals";
import { sort } from "https://deno.land/std@0.211.0/semver/sort.ts";

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
    const filter = url.searchParams.get("filter") || "none";
    const sortBy = url.searchParams.get("sortBy") || "none";
    console.log(sortBy);
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(url.searchParams.get("limit") || BIG_LIMIT);
    const order = url.searchParams.get("order")?.toUpperCase() || "DESC";
    const { stamps, total, pages, page: pag, page_size: limit } =
      await api_get_stamps(page, page_size, order, sortBy);
    const data = {
      stamps,
      total,
      page: pag,
      pages,
      page_size: limit,
    };
    return await ctx.render(data);
  },
};

export function StampPage(props: StampPageProps) {
  const { stamps, total, page, pages, page_size } = props.data;
  const { sortOption, filterOption } = useNavigator();
  console.log(sortOption, filterOption);

  // console.log(sortOption, filterOption);
  // const sortBy = (sortId: string, data: StampRow[]) => {
  //   console.log(sortId);
  //   if (sortId === "Supply") {
  //     return data.sort((a: StampRow, b: StampRow) => a.supply - b.supply);
  //   } else if (sortId === "Block") {
  //     return data.sort((a: StampRow, b: StampRow) =>
  //       a.block_index - b.block_index
  //     );
  //   }
  //   return data;
  //   // console.log(stamps);
  // };

  // const filterBy = () => {
  // };

  // const data = sortBy(sortOption, stamps);
  return (
    <div class="w-full flex flex-col items-center">
      <StampNavigator />
      <PageControl
        page={page}
        pages={pages}
        page_size={page_size}
        type={"stamp"}
      />
      <div name="stamps">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6 transition-opacity duration-700 ease-in-out">
          {stamps.map((stamp: StampRow) => (
            <StampCard stamp={stamp} kind="stamp" />
          ))}
        </div>
      </div>
      <PageControl
        page={page}
        pages={pages}
        page_size={page_size}
        type={"stamp"}
      />
    </div>
  );
}
export default StampPage;
