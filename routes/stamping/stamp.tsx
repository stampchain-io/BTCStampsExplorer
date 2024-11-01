import { Handlers, PageProps } from "$fresh/server.ts";
import { OlgaContent } from "$islands/stamping/stamp/OlgaContent.tsx";
import LatestStamps from "$islands/stamping/stamp/LatestStamps.tsx";
import { FAQModule } from "$islands/modules/FAQStamping.tsx";
import { StampController } from "../../server/controller/stampController.ts";
import type { StampRow } from "globals";

interface StampPageData {
  latestStamps: StampRow[];
}

export const handler: Handlers<StampPageData> = {
  async GET(_, ctx) {
    try {
      const stampResult = await StampController.getStamps({
        limit: 9,
        sortBy: "DESC",
        type: "stamps",
        page: 1,
      });

      return ctx.render({
        latestStamps: stampResult.data,
      });
    } catch (error) {
      console.error("Error fetching stamps:", error);
      // Return empty array if error occurs
      return ctx.render({
        latestStamps: [],
      });
    }
  },
};

export function StampingStampPage({ data }: PageProps<StampPageData>) {
  return (
    <div className="flex flex-col gap-16">
      <div className="self-center max-w-[680px] w-full mx-auto">
        <OlgaContent />
      </div>
      <div className="flex flex-col md:flex-row gap-6 w-full px-2 md:px-0">
        <div className="w-full md:w-1/2">
          <FAQModule />
        </div>
        <LatestStamps stamps={data.latestStamps} />
      </div>
    </div>
  );
}

export default StampingStampPage;
