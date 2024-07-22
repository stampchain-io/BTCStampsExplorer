import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { PageControl } from "$components/PageControl.tsx";
import { StampCard } from "$components/StampCard.tsx";
import { StampPageProps, StampRow } from "globals";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(url.searchParams.get("limit") || "1000");
    const orderBy =
      url.searchParams.get("order")?.toUpperCase() as "ASC" | "DESC" || "DESC";

    const result = await StampController.getStamps(
      page,
      page_size,
      orderBy,
      "none",
      [],
      ["cursed"],
    );

    return ctx.render(result);
  },
};

export default function StampPage(props: StampPageProps) {
  const { stamps, _total, page, pages, page_size } = props.data;
  return (
    <div class="w-full flex flex-col items-center">
      <PageControl
        page={page}
        pages={pages}
        page_size={page_size}
        type="cursed"
      />
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 py-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => (
          <StampCard stamp={stamp} kind="cursed" />
        ))}
      </div>
      <PageControl
        page={page}
        pages={pages}
        page_size={page_size}
        type="cursed"
      />
    </div>
  );
}
