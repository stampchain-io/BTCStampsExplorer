import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

const WalletHeader = ({
  filterBy,
  sortBy,
}: {
  filterBy: any[];
  sortBy: string;
}) => {
  return (
    <div class="flex justify-between">
      <h1 className="text-5xl text-[#660099] font-black">WALLET</h1>
      <div className="flex">
        <StampNavigator initFilter={filterBy} initSort={sortBy} />
        <StampSearchClient />
      </div>
    </div>
  );
};

export default WalletHeader;
