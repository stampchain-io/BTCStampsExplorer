export const DeployMintModule = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 sm:gap-16 md:gap-32">
      <div>
        <p className="font-light text-2xl md:text-5xl gray-gradient4 text-left">
          DEPLOY // MINT
        </p>
        <p className="text-[#CCCCCC] text-base md:text-2xl font-medium">
          Create or mint the most immutable fungible token with SRC-20. Built on
          top of the stamps meta-protocol SRC-20 tokens are built with Bitcoin.
        </p>
      </div>

      <div className="flex gap-6 md:gap-12 font-extrabold text-sm md:text-xl justify-center">
        <a
          href="/stamping/src20/deploy"
          f-partial="/stamping/src20/deploy"
          className="border md:border-2 border-[#999999] text-[#999999] w-[90px] md:w-[136px] h-[40px] md:h-[60px] flex justify-center items-center rounded-md"
        >
          MINT
        </a>
        <a
          href="/stamping/src20/mint"
          f-partial="/stamping/src20/mint"
          className="bg-[#999999] text-black w-[90px] md:w-[136px] h-[40px] md:h-[60px] flex justify-center items-center rounded-md"
        >
          DEPLOY
        </a>
      </div>
    </div>
  );
};
