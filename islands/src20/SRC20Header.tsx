import { StampSearchClient } from "$islands/StampSearch.tsx";

export const SRC20Header = () => {
  return (
    <div class="text-white flex flex-col gap-8">
      <div class="text-center">
        <p class="text-7xl leading-normal">SRC-20</p>
        <p class="text-[#DBDBDB] font-light">
          Welcome to the forefront of digital collectibles, where each stamp is
          a unique<br />
          piece of art intertwined with the immutability of the blockchain.
        </p>
      </div>
      <div class="flex items-center justify-between">
        <p class="text-lg underline font-medium">
          Search for Stamps, CPID, Transaction or Address
        </p>
        <StampSearchClient />
      </div>
    </div>
  );
};
