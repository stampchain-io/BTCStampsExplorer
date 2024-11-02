export const DeployMintModule = () => {
  return (
    <div className="flex flex-col tablet:flex-row justify-between tablet:items-end gap-8 mobile-768:gap-16 tablet:gap-32">
      <div>
        <p className="font-light text-2xl tablet:text-5xl gray-gradient4 text-left">
          DEPLOY // MINT
        </p>
        <p className="text-[#CCCCCC] text-base tablet:text-2xl font-medium">
          Create or mint the most immutable fungible token with SRC-20. Built on
          top of the stamps meta-protocol SRC-20 tokens are built with Bitcoin.
        </p>
      </div>

      <div className="flex gap-6 tablet:gap-12 font-extrabold text-sm tablet:text-xl justify-center">
        <a
          href="/stamping/src20/deploy"
          f-partial="/stamping/src20/deploy"
          className="border tablet:border-2 border-[#999999] text-[#999999] w-[90px] tablet:w-[136px] h-[40px] tablet:h-[60px] flex justify-center items-center rounded-md"
        >
          MINT
        </a>
        <a
          href="/stamping/src20/mint"
          f-partial="/stamping/src20/mint"
          className="bg-[#999999] text-black w-[90px] tablet:w-[136px] h-[40px] tablet:h-[60px] flex justify-center items-center rounded-md"
        >
          DEPLOY
        </a>
      </div>
    </div>
  );
};
