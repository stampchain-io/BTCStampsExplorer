import { BIG_LIMIT } from "constants";
import { SRC20Row, StampRow } from "globals";

import { Pagination } from "$components/Pagination.tsx";

import { HandlerContext, Handlers } from "$fresh/server.ts";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { HomeTable } from "$islands/home/HomeTable.tsx";
import { HomeSalesInfo } from "$islands/home/HomeSalesInfo.tsx";
import { HomeSalesInfoDetails } from "$islands/home/HomeSalesInfoDetails.tsx";

import { api_get_stamps } from "$lib/controller/stamp.ts";
import { getClient, Src20Class } from "$lib/database/index.ts";

type HomePageProps = {
  params: {
    stamps_recent: StampRow[];
    stamps_src721: StampRow[];
    stamps_art: StampRow[];
    stamps_src20: StampRow[];
    stamps_news: StampRow[];
    stamps: StampRow[];
    total_stamp: number;
    page_stamp: number;
    pages_stamp: number;
    page_size_stamp: number;
    filterBy: any[];
    sortBy: string;
    src20: SRC20Row[];
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
        total_stamp,
        pages_stamp,
        page_stamp,
        page_size_stamp;
      let filterBy, sortBy, orderBy;

      if (!type) {
        const res1 = await api_get_stamps(
          1,
          6,
          "DESC",
          "none",
          [],
          ["STAMP", "SRC-721"],
        );
        stamps_recent = res1.stamps;

        const res2 = await api_get_stamps(
          1,
          6,
          "DESC",
          "none",
          [],
          ["SRC-721"],
        );
        stamps_src721 = res2.stamps;

        const res3 = await api_get_stamps(
          1,
          6,
          "DESC",
          "none",
          [],
          ["STAMP"],
        );
        stamps_art = res3.stamps;

        const res4 = await api_get_stamps(
          1,
          6,
          "DESC",
          "none",
          [],
          ["SRC-20"],
        );
        stamps_src20 = res4.stamps;

        const res5 = await api_get_stamps(
          1,
          6,
          "DESC",
          "none",
          [],
          ["STAMP", "SRC-721"],
        );
        stamps_news = res5.stamps;
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
        orderBy = url.searchParams.get("order")?.toUpperCase() || "DESC";
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
        total_stamp = res.total;
        pages_stamp = res.pages;
        page_stamp = res.page;
        page_size_stamp = res.page_size;
      }

      page_size = Number(url.searchParams.get("limit")) || 10;
      page = Number(url.searchParams.get("page")) || 1;

      const client = await getClient();
      const data = await Src20Class.get_valid_src20_tx_with_client(
        client,
        null,
        null,
        "DEPLOY",
        page_size,
        page,
      );

      const res = {
        stamps_recent,
        stamps_src721,
        stamps_art,
        stamps_src20,
        stamps_news,
        stamps,
        total_stamp,
        pages_stamp,
        page_stamp,
        page_size_stamp,
        filterBy,
        sortBy,
        src20: data.rows.map((row: SRC20Row) => {
          return {
            ...row,
            max: row.max ? row.max.toString() : null,
            lim: row.lim ? row.lim.toString() : null,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
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
    src20,
    type,
    total_stamp,
    pages_stamp,
    page_stamp,
    page_size_stamp,
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
              page={page_stamp}
              pages={pages_stamp}
              page_size={page_size_stamp}
              type={type}
            />
            <Pagination
              stamps={stamps}
              page={page_stamp}
              pages={pages_stamp}
              page_size={page_size_stamp}
              type={type}
            />
          </div>
        )
        : (
          <div class="flex flex-col gap-24 text-white">
            <HomeHeader />
            {/* <HomeCarousel /> */}
            <div class="flex flex-col gap-10">
              <HomeTable data={src20} />
              <Pagination
                stamps={stamps}
                page={page_stamp}
                pages={pages_stamp}
                page_size={page_size_stamp}
                type={type}
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
