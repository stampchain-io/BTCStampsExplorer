import { Chart } from "$fresh_charts/mod.ts";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";

interface HoldersInfoProps {}
export const HoldersInfo = (props: HoldersInfoProps) => {
  return (
    <div class="mx-auto">
      <Chart
        type="pie"
        width={350}
        options={{
          responsive: true,
          devicePixelRatio: 1,
          scales: { yAxes: [{ ticks: { beginAtZero: true } }] },
        }}
        data={{
          labels: ["1", "2", "3"],
          datasets: [{
            label: "Sessions",
            data: [123, 234, 234],
            borderColor: ChartColors.Red,
            backgroundColor: transparentize(ChartColors.Red, 0.5),
            borderWidth: 1,
          }, {
            label: "Users",
            data: [346, 233, 123],
            borderColor: ChartColors.Blue,
            backgroundColor: transparentize(ChartColors.Blue, 0.5),
            borderWidth: 1,
          }],
        }}
      />
    </div>
  );
};
