export const HomePartners = () => {
  return (
    <div>
      <p
        className={"font-black text-3xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-3"}
      >
        PARTNERS
      </p>
      <div className={"flex justify-between flex-col md:flex-row gap-6"}>
        <img
          src="/img/home/partner-bitfinity-banner.png"
          className={"hover:bg-gradient-to-r"}
        />
        <img src="/img/home/partner-r8-banner.png" />
        <img src="/img/home/partner-bitname-banner.png" />
      </div>
    </div>
  );
};
