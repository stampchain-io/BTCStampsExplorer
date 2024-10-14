export const HomeHeader = () => {
  return (
    <div class="flex flex-col items-center justify-center gap-4">
      <p class="max-w-[1000px] text-center">
        <span class="text-3xl md:text-5xl lg:text-7xl block font-black gray-gradient">
          UNPRUNABLE{" "}
          <span class="purple-gradient">
            UTXO ART
          </span>
        </span>
        <span class="text-2xl md:text-4xl lg:text-5xl  font-bold bg-clip-text text-transparent gray-gradient mt-2 block uppercase">
          BECAUSE SATS DON’T EXIST
        </span>
      </p>
      <p class="max-w-[850px] text-lg md:text-xl lg:text-3xl text-[#CCCCCC] text-center font-medium mt-4">
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the blockchain.
      </p>
    </div>
  );
};
