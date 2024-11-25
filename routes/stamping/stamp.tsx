import type { StampRow } from "globals";
import { Handlers, PageProps } from "$fresh/server.ts";

import { OlgaContent } from "$islands/stamping/stamp/OlgaContent.tsx";
import StampSection from "$islands/stamp/StampSection.tsx";
import { FAQStampingModule } from "$islands/modules/FAQStamping.tsx";

import { StampController } from "$server/controller/stampController.ts";

interface StampPageData {
  latestStamps: StampRow[];
}

export const handler: Handlers<StampPageData> = {
  async GET(_, ctx) {
    try {
      const stampResult = await StampController.getStamps({
        limit: 16,
        sortBy: "DESC",
        type: "stamps",
        page: 1,
      });

      return ctx.render({
        latestStamps: stampResult.data,
      });
    } catch (error) {
      console.error("Error fetching stamps:", error);
      return ctx.render({
        latestStamps: [],
      });
    }
  },
};

export default function StampingStampPage({ data }: PageProps<StampPageData>) {
  const latestStampsSection = {
    title: "LATEST STAMPS",
    subTitle: "ON-CHAIN MARVELS",
    type: "classic",
    stamps: data.latestStamps,
    layout: "grid" as const,
    showDetails: false,
    alignRight: true,
    gridClass: `
      grid w-full
      gap-3
      mobileMd:gap-6
      grid-cols-2
      mobileSm:grid-cols-3
      mobileLg:grid-cols-4
      tablet:grid-cols-3
      desktop:grid-cols-4
      auto-rows-fr
    `,
    displayCounts: {
      "mobileSm": 6, // 3 columns x 2 rows
      "mobileLg": 8, // 4 columns x 2 rows
      "tablet": 9, // 3 columns x 3 rows
      "desktop": 12, // 4 columns x 3 rows
    },
  };

  return (
    <div class="flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
      <div class="self-center max-w-[680px] w-full mx-auto">
        <OlgaContent />
      </div>
      <div class="flex flex-col tablet:flex-row gap-3 mobileMd:gap-6 desktop:gap-9 w-full">
        <div class="w-full tablet:w-1/2">
          <FAQStampingModule />
        </div>
        <div class="w-full tablet:w-1/2 flex flex-col gap-3 mobileMd:gap-6 items-start tablet:items-end">
          <StampSection {...latestStampsSection} />
        </div>
      </div>
    </div>
  );
}
