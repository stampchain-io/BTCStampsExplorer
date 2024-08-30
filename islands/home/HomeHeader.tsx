export const HomeHeader = () => {
  return (
    <div class="flex flex-col items-center justify-center gap-4">
      <p class="max-w-[1000px] text-center">
        <span class="text-3xl md:text-5xl lg:text-6xl leading-tight text-[#F5F5F5] font-black uppercase block">
          Unprunable <span class="text-[#7A00F5]">UTXO Art</span>
        </span>
        <span class="text-2xl md:text-4xl lg:text-5xl leading-tight text-[#DBDBDB] font-black uppercase block mt-2">
          Because Sats Don't Exist
        </span>
      </p>
      <p class="max-w-[850px] text-lg md:text-xl lg:text-2xl text-[#DBDBDB] text-center font-light mt-4">
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the blockchain.
      </p>
    </div>
  );
};
