export const HomeHeader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="max-w-[1000px] text-center">
        <span className="text-3xl mobile-lg:text-5xl desktop:text-6xl block font-black bg-text-gray-1 bg-clip-text text-fill-transparent">
          UNPRUNABLE{" "}
          <span className="bg-text-purple-1 bg-clip-text text-fill-transparent">
            UTXO ART
          </span>
        </span>
        <span className="text-2xl mobile-lg:text-4xl desktop:text-5xl font-bold bg-text-gray-1 bg-clip-text text-fill-transparent mt-2 block uppercase">
          BECAUSE SATS DON'T EXIST
        </span>
      </p>
      <p className="max-w-[850px] text-lg mobile-lg:text-xl desktop:text-3xl text-stamp-text-primary text-center font-medium mt-4">
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the blockchain.
      </p>
    </div>
  );
};
