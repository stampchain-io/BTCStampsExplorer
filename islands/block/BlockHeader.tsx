import { StampSearchClient } from "../stamp/StampSearch.tsx";

export default function BlockHeader() {
  return (
    <div class="text-white flex flex-col gap-8">
      <div class="text-center">
        <p class="text-7xl leading-normal">Stamp Block Explorer</p>
        <p class="text-[#DBDBDB] font-light">
          Welcome to the forefront of digital collectibles, where each stamp is
          a unique<br />
          piece of art intertwined with the immutability of the blockchain.
        </p>
      </div>
      <div class="flex items-center justify-between">
        <p class="text-lg underline">
          Search for Stamps, CPID, Transaction or Address
        </p>
        <StampSearchClient />
      </div>
    </div>
  );
}
