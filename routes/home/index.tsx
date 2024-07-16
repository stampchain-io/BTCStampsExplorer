import { BIG_LIMIT } from "constants";
import { SRC20Row, StampRow } from "globals";

import { Pagination } from "$components/Pagination.tsx";

import { HandlerContext, Handlers } from "$fresh/server.ts";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
// import Carousel from "$islands/Carousel.tsx";
// import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeTable } from "$islands/home/HomeTable.tsx";
import { HomeSalesInfo } from "$islands/home/HomeSalesInfo.tsx";
import { HomeSalesInfoDetails } from "$islands/home/HomeSalesInfoDetails.tsx";

import {
  api_get_multiple_stamp_categories,
  api_get_stamps,
} from "$lib/controller/stamp.ts";
import { api_get_src20s } from "$lib/controller/src20.ts";

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

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {
    try {
      const url = new URL(req.url);
      const type = url.searchParams.get("type");

      let stamps_recent: StampRow[] = [];
      let stamps_src721: StampRow[] = [];
      let stamps_art: StampRow[] = [];
      let stamps_src20: StampRow[] = [];
      let stamps_news: StampRow[] = [];
      let page, page_size;
      let stamps: StampRow[] = [],
        pages_stamp,
        page_stamp,
        page_size_stamp;
      let src20s: SRC20Row[] = [], pages_src20, page_src20, page_size_src20;
      let filterBy, sortBy, orderBy;

      if (!type) {
        const stampCategories = await api_get_multiple_stamp_categories([
          { types: ["STAMP", "SRC-721"], limit: 6 },
          { types: ["SRC-721"], limit: 6 },
          { types: ["STAMP"], limit: 6 },
          { types: ["SRC-20"], limit: 6 },
        ]);

        stamps_recent = stampCategories[0];
        stamps_src721 = stampCategories[1];
        stamps_art = stampCategories[2];
        stamps_src20 = stampCategories[3];
        stamps_news = stampCategories[0]; // Reuse stamps_recent for news

        page_size = Number(url.searchParams.get("limit")) || 10;
        page = Number(url.searchParams.get("page")) || 1;

        const res = await api_get_src20s(
          page,
          page_size,
        );
        src20s = res.src20s;
        pages_src20 = res.pages;
        page_src20 = res.page;
        page_size_src20 = res.page_size;
      } else {
        let typeBy = ["STAMP", "SRC-721"];
        if (type === "src721") {
          typeBy = ["SRC-721"];
        } else if (type === "art") {
          typeBy = ["STAMP"];
        } else if (type === "src20") {
          typeBy = ["SRC-20"];
        }
        filterBy = url.searchParams.get("filterBy")?.split(",") || [];
        sortBy = url.searchParams.get("sortBy") || "none";
        orderBy = url.searchParams.get("orderBy")?.toUpperCase() || "DESC";
        page = type
          ? parseInt(url.searchParams.get("page") || "1")
          : parseInt("1");
        page_size = type
          ? parseInt("24" || BIG_LIMIT.toString())
          : parseInt("6");
        const res = await api_get_stamps(
          page,
          page_size,
          orderBy,
          sortBy,
          filterBy,
          typeBy,
        );
        stamps = res.stamps;
        pages_stamp = res.pages;
        page_stamp = res.page;
        page_size_stamp = res.page_size;
      }

      const res = {
        stamps_recent,
        stamps_src721,
        stamps_art,
        stamps_src20,
        stamps_news,
        stamps,
        pages_stamp,
        page_stamp,
        page_size_stamp,
        filterBy,
        sortBy,
        src20s: src20s.map((row: SRC20Row) => {
          return {
            ...row,
            max: row.max ? row.max.toString() : null,
            lim: row.lim ? row.lim.toString() : null,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
        pages_src20,
        page_src20,
        page_size_src20,
        type,
      };
      return await ctx.render(res);
    } catch (error) {
      console.error(error);
      const res = { error: `Error: Internal server error` };
      return ctx.render(res);
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

  return (
    <>
      {type
        ? (
          <div class="">
            <div class="flex flex-col-reverse md:flex-row items-end justify-between border-b border-[#3F2A4E]">
              <a
                href="/home"
                class="text-[#7A00F5] text-[26px] pb-3 border-b-4 border-[#7A00F5]"
              >
                {type}
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
            {/* <HomeCarousel /> */}
            {
              /* <Carousel
              automatic
              showNavigation
              interval={3000}
              currentSlide={0}
            /> */
            }
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
