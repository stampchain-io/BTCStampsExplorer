import { FreshContext, Handlers } from "$fresh/server.ts";
import { CollectionOverviewHeader } from "$islands/collection/CollectionOverviewHeader.tsx";
import { CollectionOverviewContent } from "$islands/collection/CollectionOverviewContent.tsx";
import { Pagination } from "../../../islands/datacontrol/Pagination.tsx";
import { CollectionController } from "$server/controller/collectionController.ts";

type CollectionOverviewPageProps = {
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

export default function CollectionOverview(props: CollectionOverviewPageProps) {
  const {
    collections,
    page,
    pages,
    page_size,
    filterBy,
  } = props.data;

  return (
    <div class="flex flex-col gap-8">
      <CollectionOverviewHeader
        filterBy={filterBy}
      />
      <CollectionOverviewContent collections={collections} />
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
