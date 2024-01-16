import { SRC20TickHeader } from "./SRC20TickHeader.tsx";
import { SRC20HoldersInfo } from "./SRC20HoldersInfo.tsx";
//import { SRC20HoldersInfo } from "$islands/src20/SRC20HoldersInfo.tsx";

export const TickInfo = ({
  deployment,
  mint_status,
  total_holders,
  holders,
}) => {
  if (
    !deployment ||
    !mint_status ||
    !total_holders ||
    !holders
  ) {
    return null;
  }

  deployment = deployment[0];
  return (
    <div class="flex flex-col gap-2">
      <SRC20TickHeader
        deployment={deployment}
        mint_status={mint_status}
        total_holders={total_holders}
      />
      <SRC20HoldersInfo
        holders={holders}
        total_holders={total_holders}
      />
    </div>
  );
};

export default TickInfo;
