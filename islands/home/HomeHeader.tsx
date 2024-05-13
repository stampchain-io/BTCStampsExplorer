import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";

export const HomeHeader = () => {
  return (
    <div class="text-white flex flex-col gap-8">
      <div class="w-2/3">
        <p class="text-7xl leading-normal">
          Unprunable UTXO Art, Because Sats Don't Exist.
        </p>
        <p class="text-[#DBDBDB] font-light">
          Welcome to the forefront of digital collectibles, where each stamp is
          a unique<br />
          piece of art intertwined with the immutability of the blockchain.
        </p>
        <div class="mt-5">
          <ConnectWallet />
        </div>
      </div>
      <div class="w-1/3">
      </div>
    </div>
  );
};
