import { useState } from "preact/hooks";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { ModulesStyles } from "$islands/modules/Styles.ts";

function CollectionOverviewHeader() {
  // State management for the open states
  const [isOpen2, setIsOpen2] = useState(false);
  const handleOpen2 = (open: boolean) => {
    setIsOpen2(open);
  };
  return (
    <div class="flex justify-between items-center w-full">
      <p className={ModulesStyles.titlePurpleDL}>
        COLLECTIONS
      </p>
      <div class="h-[40px]">
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
}
export { CollectionOverviewHeader };
