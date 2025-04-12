/* ===== COLLECTION OVERVIEW HEADER COMPONENT ===== */
import { useState } from "preact/hooks";
import { StampSearchClient } from "$search";
import { titlePurpleLD } from "$text";

/* ===== STATE ===== */
function CollectionOverviewHeader() {
  const [isOpen2, setIsOpen2] = useState(false);

  /* ===== EVENT HANDLERS ===== */
  const handleOpen2 = (open: boolean) => {
    setIsOpen2(open);
  };

  /* ===== COMPONENT ===== */
  return (
    <div class="flex justify-between items-center w-full">
      <h1 className={titlePurpleLD}>
        COLLECTIONS
      </h1>

      <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
    </div>
  );
}

export { CollectionOverviewHeader };
