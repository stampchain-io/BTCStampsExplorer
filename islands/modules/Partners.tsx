export const PartnersModule = () => {
  return (
    <div>
      <p
        className={"font-black text-3xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-3"}
      >
        PARTNERS
      </p>
      <div className={"flex justify-between flex-col md:flex-row gap-6"}>
        <div className={"relative cursor-pointer"}>
          <img src="/img/home/partner-bitfinity-banner.png" />
          <div
            className={"opacity-0 hover:opacity-100 bg-gradient-from-tr bg-gradient-to-bl from-[#CCCCCC00] via-[#9999997F] to-[#666666FF] absolute w-full h-full top-0 left-0"}
          >
          </div>
        </div>
        <div className={"relative cursor-pointer"}>
          <img src="/img/home/partner-r8-banner.png" />
          <div
            className={"opacity-0 hover:opacity-100 bg-gradient-from-tr bg-gradient-to-bl from-[#CCCCCC00] via-[#9999997F] to-[#666666FF] absolute w-full h-full top-0 left-0"}
          >
          </div>
        </div>
        <div className={"relative cursor-pointer"}>
          <img src="/img/home/partner-bitname-banner.png" />
          <div
            className={"opacity-0 hover:opacity-100 bg-gradient-from-tr bg-gradient-to-bl from-[#CCCCCC00] via-[#9999997F] to-[#666666FF] absolute w-full h-full top-0 left-0"}
          >
          </div>
        </div>
      </div>
    </div>
  );
};
