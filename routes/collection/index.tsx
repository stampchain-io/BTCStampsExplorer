import { FreshContext, Handlers } from "$fresh/server.ts";
import { CollectionHeader } from "$islands/collection/CollectionHeader.tsx";
import { CollectionList } from "$islands/collection/CollectionList.tsx";
import { Pagination } from "../../islands/datacontrol/Pagination.tsx";
import { CollectionController } from "$server/controller/collectionController.ts";

type CollectionPageProps = {
  data: {
    collections: CollectionRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    selectedTab: "all" | "stamps" | "posh";
    sortBy: string;
    filterBy: string[];
  };
};

export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    const url = new URL(req.url);
    const sortBy = url.searchParams.get("sortBy")?.toUpperCase() == "ASC"
      ? "ASC"
      : "DESC";
    const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
    const selectedTab = url.searchParams.get("ident") || "all";
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(url.searchParams.get("limit") || "20");

    const collectionsData = await CollectionController.getCollectionNames({
      limit: page_size,
      page: page,
      creator: "",
    });

    const data = {
      collections: collectionsData.data,
      page: collectionsData.page,
      pages: collectionsData.totalPages,
      page_size: collectionsData.limit,
      filterBy,
      sortBy,
      selectedTab,
    };
    return await ctx.render(data);
  },
};

export default function Collection(props: CollectionPageProps) {
  const {
    collections,
    page,
    pages,
    page_size,
    filterBy,
    sortBy,
    selectedTab,
  } = props.data;

  return (
    <div class="flex flex-col gap-8">
      <CollectionHeader
        filterBy={filterBy}
        sortBy={sortBy}
        selectedTab={selectedTab}
      />
      <CollectionList collections={collections} />
      <Pagination
        page={page}
        pages={pages}
        page_size={page_size}
        type={"collection"}
        data_length={collections.length}
      />
    </div>
  );
}
