import { Chart } from "$fresh_charts/mod.ts";

interface HolderInfoType {
  address: string;
  p: string;
  tick: string;
  amt: string;
  block_time: string;
  last_update: number;
  deploy_tx: string;
  deploy_img: string;
  percentage: string;
}

const getGradientColor = (percentage: number) => {
  const startColor = "#F68E5C";
  const endColor = "#5053EA";

  const r = Math.round(
    (1 - percentage / 100) * parseInt(startColor.slice(1, 3), 16) +
      (percentage / 100) * parseInt(endColor.slice(1, 3), 16),
  );
  const g = Math.round(
    (1 - percentage / 100) * parseInt(startColor.slice(3, 5), 16) +
      (percentage / 100) * parseInt(endColor.slice(3, 5), 16),
  );
  const b = Math.round(
    (1 - percentage / 100) * parseInt(startColor.slice(5, 7), 16) +
      (percentage / 100) * parseInt(endColor.slice(5, 7), 16),
  );

  return `rgba(${r}, ${g}, ${b}, 0.5)`; // Adjust alpha as needed
};

export const HoldersInfo = ({ holders }: { holders: HolderInfoType[] }) => {
  const percentages = holders.map((holder: HolderInfoType) =>
    parseFloat(holder.percentage)
  );

  const topHolders = holders
    .map((holder, index) => ({
      percentage: parseFloat(holder.percentage),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
  const topLabels = topHolders.map((holder) => holder.percentage + "%");

  const backgroundColors = percentages.map((percentage) =>
    getGradientColor(percentage)
  );

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
          labels: topLabels,
          datasets: [{
            label: "Holders",
            data: percentages,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            borderWidth: 1,
          }],
        }}
      />
    </div>
  );
};
