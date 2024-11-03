import { Handlers, PageProps } from "$fresh/server.ts";
import { OlgaContent } from "$islands/stamping/stamp/OlgaContent.tsx";
import StampSection from "$islands/stamp/StampSection.tsx";
import { FAQModule } from "$islands/modules/FAQStamping.tsx";
import { StampController } from "$server/controller/stampController.ts";
import type { StampRow } from "globals";

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
    type: "classic",
    stamps: data.latestStamps,
    layout: "grid" as const,
    showDetails: false,
    gridClass: `
      grid w-full
      gap-[12px]
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
      "tablet": 6, // 3 columns x 2 rows
      "desktop": 8, // 4 columns x 2 rows
    },
  };

  return (
    <div class="flex flex-col gap-16">
      <div class="self-center max-w-[680px] w-full mx-auto">
        <OlgaContent />
      </div>
      <div class="flex flex-col tablet:flex-row gap-6 w-full px-2 tablet:px-0">
        <div class="w-full tablet:w-1/2">
          <FAQModule />
        </div>
        <div class="w-full tablet:w-1/2 flex flex-col gap-4 items-start tablet:items-end">
          <StampSection {...latestStampsSection} />
          <div class="w-full flex justify-end items-end">
            <a
              href="/stamps"
              class="text-stamp-purple-dark hover:text-stamp-primary-hover 
                     text-sm tablet:text-base font-extrabold border-2 
                     border-stamp-purple-dark hover:border-stamp-primary-hover 
                     py-1 text-center min-w-[120px] rounded-md cursor-pointer 
                     transition-colors duration-200"
            >
              View All
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
