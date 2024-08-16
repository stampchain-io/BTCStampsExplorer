export default function BlockCurrency() {
  return (
    <div
      className={"bg-[#2B183F] text-white text-xl font-semibold w-full flex flex-col pb-6"}
    >
      <p className={"text-2xl px-5 py-4"}>Currency Information</p>
      <hr className={"pb-[15px]"} />
      <div className={"flex flex-col justify-between h-full"}>
        <p className={"flex justify-between px-5 py-[15px]"}>
          <span>MarketCap</span>
          <span className={"font-normal text-base"}>0.00%</span>
        </p>
        <p className={"flex justify-between px-5 py-[15px]"}>
          <span>24h Volume</span>
          <span className={"font-normal text-base"}>1204</span>
        </p>
        <p className={"flex justify-between px-5 py-[15px]"}>
          <span>Low Fee</span>
          <span className={"font-normal text-base"}>234</span>
        </p>
        <p className={"flex justify-between px-5 py-[15px]"}>
          <span>Optimal Fee</span>
          <span className={"font-normal text-base"}>24,3</span>
        </p>
      </div>
    </div>
  );
}
