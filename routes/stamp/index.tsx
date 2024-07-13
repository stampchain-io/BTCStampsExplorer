import { StampRow } from "globals";

import { Pagination } from "$components/Pagination.tsx";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { api_get_stamps } from "$lib/controller/stamp.ts";

import { StampContent } from "$islands/stamp/StampContent.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";

type StampPageProps = {
  data: {
    stamps: StampRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    selectedTab: "all" | "classic";
    sortBy: string;
    filterBy: string[];
  };
};

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {
    const url = new URL(req.url);
    const orderBy = url.searchParams.get("order")?.toUpperCase() == "ASC"
      ? "ASC"
      : "DESC";
    const sortBy = url.searchParams.get("sortBy") || "none";
    const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
    const selectedTab = url.searchParams.get("typeBy") || "all";
    const typeBy = selectedTab === "all"
      ? ["STAMP", "SRC-721", "SRC-20"]
      : ["STAMP", "SRC-721"];
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(
      url.searchParams.get("limit") || "24",
    );

    const { stamps, pages, page: pag, page_size: limit } =
      await api_get_stamps(page, page_size, orderBy, sortBy, filterBy, typeBy);

    const data = {
      stamps,
      page: pag,
      pages,
      page_size: limit,
      filterBy,
      sortBy,
      selectedTab,
    };
    return await ctx.render(data);
  },
};

export function StampPage(props: StampPageProps) {
  const {
    stamps,
    page,
    pages,
    page_size,
    filterBy,
    sortBy,
    selectedTab,
  } = props.data;

  return (
    <div class="w-full flex flex-col items-center">
      <StampHeader
        filterBy={filterBy}
        sortBy={sortBy}
        selectedTab={selectedTab}
      />
      <StampContent
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
