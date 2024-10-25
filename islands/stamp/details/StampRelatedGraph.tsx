import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { Chart } from "$fresh_charts/mod.ts";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";

import { StampRow } from "globals";

import { useEffect, useState } from "preact/hooks";

dayjs.extend(relativeTime);

interface StampRelatedGraphProps {
  stamp: StampRow;
}

const DoughnutConfig = {
  type: "doughnut",
  svgClass: "w-full h-1/2",
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
  data: {
    labels: false,
    datasets: [{
      borderColor: [
        "#666666",
        "#666666",
        "#666666",
        "#666666",
        "#666666",
        "#666666",
        "#666666",
      ],
      label: "Graph Holder",
      data: [300, 50, 100, 70, 50, 30, 20, 100],
      backgroundColor: [
        "#8800CC",
        "#8800CC",
        "#8800CC",
        "#8800CC",
        "#8800CC",
        "#8800CC",
        "#8800CC",
      ],
      hoverOffset: 4,
    }],
  },
};

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
            <Chart {...DoughnutConfig} />
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
