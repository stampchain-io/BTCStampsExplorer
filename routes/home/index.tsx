import { StampRow } from "globals";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeSalesInfo } from "$islands/home/HomeSalesInfo.tsx";
import { api_get_stamps } from "$lib/controller/stamp.ts";

type HomePageProps = {
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
    const page = parseInt("1");
    const page_size = parseInt("6");
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

export default function Home(props: HomePageProps) {
  const { stamps, total, page, pages, page_size, filterBy, sortBy } =
    props.data;

  return (
    <div class="flex flex-col gap-8 text-white">
      <HomeHeader />
      {/* <HomeCarousel /> */}
      <HomeSalesInfo stamps={stamps} />
    </div>
  );
}
