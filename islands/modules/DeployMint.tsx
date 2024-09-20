export const DeployMintModule = () => {
  return (
    <div
      className={"flex flex-col md:flex-row justify-between md:items-end gap-16 md:gap-32"}
    >
      <div>
        <p
          className={"font-light text-2xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left"}
        >
          DEPLOY // MINT
        </p>
        {/* FIXME: this should just go to ann island */}
        <p className={"text-[#CCCCCC] text-2xl font-medium"}>
          Create or mint the most immutable fungible token with SRC-20. Built on
          top of the stamps meta-protocol SRC-20 tokens are built with Bitcoin.
        </p>
      </div>

      <div className={"flex gap-12 font-extrabold text-xl justify-center"}>
        <a
          href="#"
          className={"border-2 border-[#999999] text-[#999999] w-[136px] h-[60px] flex justify-center items-center rounded-md"}
        >
          MINT
        </a>
        <a
          href="#"
          className={"bg-[#999999] text-black w-[136px] h-[60px] flex justify-center items-center rounded-md"}
        >
          DEPLOY
        </a>
      </div>
    </div>
  );
};
