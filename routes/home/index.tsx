import { StampRow } from "globals";
import { Handlers } from "$fresh/server.ts";
import { HomeHeader } from "$islands/home/HomeHeader.tsx";
import { HomeTable } from "$islands/home/HomeTable.tsx";
import { HomeStampPreview } from "$islands/home/HomeStampPreview.tsx";
// import { HomeCarousel } from "$islands/home/HomeCarousel.tsx";
import { StampController } from "$lib/controller/stampController.ts";

type HomePageProps = {
  data: {
    stamps_recent: StampRow[];
    stamps_src721: StampRow[];
    stamps_art: StampRow[];
    stamps_src20: StampRow[];
    stamps_posh: StampRow[];
    stamps: StampRow[];
    page_stamp: number;
    pages_stamp: number;
    page_size_stamp: number;
    filterBy: any[];
    sortBy: string;
    src20s: any[];
    type: string;
  };
};

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      const result = await StampController.getHomePageData();

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
    stamps_posh,
    src20s,
  } = props.data;

  return (
    <div class="flex flex-col gap-24 text-white">
      <HomeHeader />
      {/* <HomeCarousel /> */}
      <div class="flex flex-col gap-10">
        <HomeTable data={src20s} />
      </div>
      <HomeStampPreview
        stamps_art={stamps_art}
        stamps_posh={stamps_posh}
        stamps_src721={stamps_src721}
        stamps_recent={stamps_recent}
        stamps_src20={stamps_src20}
      />
    </div>
  );
}
