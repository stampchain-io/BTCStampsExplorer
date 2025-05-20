/* ===== COLLECTION DETAILS CONTENT COMPONENT ===== */
import { StampRow } from "$globals";
import { StampCard } from "$card";

/* ===== COMPONENT ===== */
export const CollectionDetailContent = ({ stamps = [] }: {
  stamps: StampRow[];
}) => {
  return (
    <div name="stamps">
      <div className="grid grid-cols-2 mobileMd:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5 gap-6 transition-colors ease-in-out duration-100">
        {stamps.map((stamp: StampRow) => (
          <StampCard
            key={stamp.tx_hash}
            stamp={stamp}
            variant="grey"
          />
        ))}
      </div>
    </div>
  );
};
