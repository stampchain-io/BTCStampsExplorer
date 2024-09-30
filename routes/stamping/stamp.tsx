import { OlgaContent } from "$islands/stamping/stamp/OlgaContent.tsx";
import LatestStamps from "$islands/stamping/stamp/LatestStamps.tsx";

import { FAQModule } from "$islands/modules/FAQ.tsx";

export function StampingStampPage() {
  return (
    <div className="flex flex-col gap-16">
      <div className="self-center max-w-[680px] w-full mx-auto">
        <OlgaContent />
      </div>
      <div className="flex flex-col md:flex-row gap-6 w-full px-2 md:px-0">
        <div className="w-full md:w-1/2">
          <FAQModule />
        </div>
        <LatestStamps />
      </div>
    </div>
  );
}
export default StampingStampPage;
