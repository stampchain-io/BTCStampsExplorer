import { StampRow } from "globals";

import { Pagination } from "$components/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeTable } from "$islands/home/HomeTable.tsx";
import { HomeSalesInfo } from "$islands/home/HomeSalesInfo.tsx";
import { HomeSalesInfoDetails } from "$islands/home/HomeSalesInfoDetails.tsx";

import { StampController } from "$lib/controller/stampController.ts";

type HomePageProps = {
  data: {
    stamps_recent: StampRow[];
    stamps_src721: StampRow[];
    stamps_art: StampRow[];
    stamps_src20: StampRow[];
    stamps_news: StampRow[];
    stamps: StampRow[];
    page_stamp: number;
    pages_stamp: number;
    page_size_stamp: number;
    filterBy: any[];
    sortBy: string;
    src20s: any[];
    page_src20: number;
    pages_src20: number;
    page_size_src20: number;
    type: string;
  };
};

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const type = url.searchParams.get("type");
      const page = Number(url.searchParams.get("page")) || 0;
      const page_size = Number(url.searchParams.get("limit")) ||
        (type ? 24 : 10);
      const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
      const sortBy = url.searchParams.get("sortBy") || "none";
      const orderByParam = url.searchParams.get("orderBy")?.toUpperCase();
      const orderBy = orderByParam === "DESC" || orderByParam === "DESC"
        ? orderByParam
        : "DESC";

      const result = await StampController.getHomePageData(
        type,
        page,
        page_size,
        filterBy,
        sortBy,
        orderBy,
      );

      return ctx.render(result);
    } catch (error) {
      console.error(error);
      return ctx.render({ error: `Error: Internal server error` });
    }
  },
};

export default function Home(props: HomePageProps) {
  const {
    stamps_recent,
    stamps_src721,
    stamps_art,
    stamps_src20,
    stamps_news,
    stamps,
    src20s,
    type,
    pages_stamp,
    page_stamp,
    page_size_stamp,
    pages_src20,
    page_src20,
    page_size_src20,
    filterBy,
    sortBy,
  } = props.data;

  const stampDetailsInfoTitle: { [key: string]: string } = {
    "recent": "Recent Sales", // TODO: need to fecth these from the xcp api
    "src721": "Src721",
    "art": "Art",
    "src20": "Src20",
    "news": "Posh",
  };

  return (
    <>
      {type
        ? (
          <div class="">
            <div class="flex flex-col-reverse md:flex-row items-start justify-between border-b border-[#3F2A4E]">
              <a
                href="/home"
                class="text-[#7A00F5] text-[26px] pb-4 border-b-4 border-[#7A00F5] flex gap-1"
              >
                <img
                  src="/img/icon_arrow_left.png"
                  className="w-5 h-10"
                  alt=""
                />
                {stampDetailsInfoTitle[type]}
              </a>
              <div class="flex gap-6">
                <StampNavigator initFilter={filterBy} initSort={sortBy} />
                <StampSearchClient />
              </div>
            </div>
            <HomeSalesInfoDetails
              stamps={stamps}
            />
            <Pagination
              data_length={stamps.length}
              page={page_stamp}
              pages={pages_stamp}
              page_size={page_size_stamp}
              type="home"
            />
          </div>
        )
        : (
          <div class="flex flex-col gap-24 text-white">
            <HomeHeader />
            <div class="flex flex-col gap-10">
              <HomeTable data={src20s} />
              <Pagination
                data_length={src20s.length}
                page={page_src20}
                pages={pages_src20}
                page_size={page_size_src20}
                type="home"
              />
            </div>
            <HomeSalesInfo
              stamps_recent={stamps_recent}
              stamps_src721={stamps_src721}
              stamps_art={stamps_art}
              stamps_src20={stamps_src20}
              stamps_news={stamps_news}
            />
          </div>
        )}
    </>
  );
}
