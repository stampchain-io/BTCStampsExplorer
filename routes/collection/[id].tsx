import { Pagination } from "$islands/pagination/Pagination.tsx";
import { FreshContext } from "$fresh/server.ts";

import { StampRow } from "globals";

import { CollectionDetailsHeader } from "$islands/collection/CollectionDetailsHeader.tsx";
import { CollectionDetailsContent } from "$islands/collection/CollectionDetailsContent.tsx";

type CollectionPageProps = {
  data: {
    stamps: StampRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    selectedTab: "all" | "classic" | "posh";
    sortBy: string;
    filterBy: string[];
  };
};

export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    const url = new URL(req.url);
    const orderBy = url.searchParams.get("order")?.toUpperCase() == "ASC"
      ? "ASC"
      : "DESC";
    const sortBy = url.searchParams.get("sortBy") || "none";
    const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
    const selectedTab = url.searchParams.get("ident") || "all";
    const ident = selectedTab === "all"
      ? ["STAMP", "SRC-721", "SRC-20"]
      : ["STAMP", "SRC-721"];
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(
      url.searchParams.get("limit") || "24",
    );

    const { stamps, pages, pag, limit } = {
      stamps: [...Array(100)],
      pages: 10,
      pag: 1,
      limit: 20,
    };
    // const { collections, pages, page: pag, page_size: limit } =
    //   await api_get_stamps(
    //     page,
    //     page_size,
    //     orderBy,
    //     sortBy,
    //     filterBy,
    //     ident,
    //   );

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

export default function Collection(props: CollectionPageProps) {
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
    <div class="flex flex-col gap-8">
      <CollectionDetailsHeader />
      <CollectionDetailsContent stamps={stamps} />
      <Pagination
        page={page}
        pages={pages}
        page_size={page_size}
        type={"collection"}
        data_length={stamps.length}
      />
    </div>
  );
}
