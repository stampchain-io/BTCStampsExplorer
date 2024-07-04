import { BIG_LIMIT } from "constants";
import { SRC20Row, StampRow } from "globals";

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
      let typeBy = ["STAMP", "SRC-721"];
      if (type === "src721") {
        typeBy = ["SRC-721"];
      } else if (type === "art") {
        typeBy = ["STAMP"];
      } else if (type === "src20") {
        typeBy = ["SRC-20"];
      }
      let filterBy = [];
      const sortBy = "none";
      const orderBy = "DESC";
      let page = type
        ? parseInt(url.searchParams.get("page") || "1")
        : parseInt("1");
      let page_size = type
        ? parseInt(url.searchParams.get("limit") || BIG_LIMIT.toString())
        : parseInt("6");
      const {
        stamps,
        total: total_stamp,
        pages: pages_stamp,
        page: page_stamp,
        page_size: page_size_stamp,
      } = await api_get_stamps(
        page,
        page_size,
        orderBy,
        sortBy,
        filterBy,
        typeBy,
      );

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
            <div class="flex items-end justify-between border-b border-[#3F2A4E]">
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
          </div>
        )
        : (
          <div class="flex flex-col gap-24 text-white">
            <HomeHeader />
            {/* <HomeCarousel /> */}
            <HomeTable data={src20} />
            <HomeSalesInfo stamps={stamps} />
          </div>
        )}
    </>
  );
}
