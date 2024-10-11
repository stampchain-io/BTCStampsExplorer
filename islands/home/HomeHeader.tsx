export const HomeHeader = () => {
  return (
    <div class="flex flex-col items-center justify-center gap-4">
      <p class="max-w-[1000px] text-center">
        <span class="text-3xl md:text-5xl lg:text-6xl block font-black bg-clip-text text-transparent bg-gradient-to-r from-[#CCCCCC] via-[#999999] to-[#666666]">
          UNPRUNABLE{" "}
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC]">
            UTXO ART
          </span>
        </span>
        <span class="text-2xl md:text-4xl lg:text-5xl  font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#CCCCCC] via-[#999999] to-[#666666] mt-2 block uppercase">
          BECAUSE SATS DON’T EXIST
        </span>
      </p>
      <p class="max-w-[850px] text-lg md:text-xl lg:text-3xl text-[#DBDBDB] text-center font-medium mt-4">
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the blockchain.
      </p>
    </div>
  );
};
