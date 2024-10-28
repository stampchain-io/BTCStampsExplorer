import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import PieChart from "$components/stamp/PieChart.tsx";

dayjs.extend(relativeTime);

export function StampRelatedGraph() {
  return (
    <div className="flex justify-between items-center bg-gradient-to-br primary-gradient p-6 relative">
      <div className="p-6 absolute top-0 right-0 text-center">
        <p className="text-[#666666] font-light uppercase">HOLDERS</p>
        <p className="text-[#999999] font-light uppercase lg:text-[32px] md:text-[30px]">
          1
        </p>
      </div>
      <div className="lg:flex md:block w-full gap-3">
        <div>
          <div className="flex justify-between items-center flex-col md:items-start gap-1">
            <PieChart />
          </div>
        </div>
        <div className="flex justify-between items-center w-full">
          <div className="flex justify-between items-center flex-col md:items-start gap-1">
            <div className="flex flex-col justify-center items-center md:items-start sm:items-start">
              <p className="text-[#666666] font-light uppercase text-lg">
                ADDRESS
              </p>
              <p className="text-[#999999] font-light uppercase text-base">
                bc1qn...sr8k3919
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center flex-col md:items-center gap-1">
            <div className="flex flex-col justify-center items-center">
              <p className="text-[#666666] font-light uppercase text-lg">
                AMOUNT
              </p>
              <p className="text-[#999999] font-light uppercase text-base">
                21
              </p>
            </div>
          </div>
          <div className="flex justify-between items-start flex-col md:items-end gap-1">
            <div className="flex flex-col justify-center items-center md:items-end sm:items-end">
              <p className="text-[#666666] font-light uppercase text-lg">
                PERCENT
              </p>
              <p className="text-[#999999] font-light uppercase text-base">
                100%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
