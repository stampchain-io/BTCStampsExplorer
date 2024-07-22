import { StampPageProps } from "globals";
import { Pagination } from "$components/Pagination.tsx";
import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { StampContent } from "$islands/stamp/StampContent.tsx";
import { StampHeader } from "$islands/stamp/StampHeader.tsx";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
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

      const result = await StampController.getStamps(
        page,
        page_size,
        orderBy,
        sortBy,
        filterBy,
        typeBy,
      );

      const data = {
        ...result,
        filterBy,
        sortBy,
        selectedTab,
      };
      return ctx.render(data);
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
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
