import { StampSends } from "$components/StampSends.tsx";
import { HolderRow, SendRow } from "globals";
import { StampHolders } from "$components/StampHolders.tsx";
export function StampHistory(
  { holders, sends }: { holders: HolderRow[]; sends: SendRow[] },
) {
  return (
    <div>
      <StampSends sends={sends} />
      <div style={{ marginTop: "4px" }}></div>
      <StampHolders holders={holders} />
    </div>
  );
}
