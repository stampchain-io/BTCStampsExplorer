import { Chart } from "$fresh_charts/mod.ts";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";

interface HolderInfoType {
  address: string;
  quantity: number;
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

export const StampHolders = ({ holders }: { holders: HolderInfoType[] }) => {
  console.log("holders: ", holders);

  if (!holders || holders.length === 0) {
    return <div>No holder data available</div>;
  }

  const totalQuantity = holders.reduce(
    (sum, holder) => sum + holder.quantity,
    0,
  );

  if (totalQuantity === 0) {
    return <div>Invalid holder data</div>;
  }

  const holdersWithPercentage = holders.map((holder) => ({
    ...holder,
    percentage: (holder.quantity / totalQuantity) * 100,
  }));

  const topHolders = holdersWithPercentage
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  if (topHolders.length === 0) {
    return <div>No valid top holders data</div>;
  }

  const percentages = topHolders.map((holder) => holder.percentage);
  const topLabels = topHolders.map((holder) =>
    `${holder.address.slice(0, 6)}...${holder.address.slice(-4)} (${
      holder.percentage.toFixed(2)
    }%)`
  );

  const backgroundColors = percentages.map((percentage) =>
    getGradientColor(percentage)
  );

  return (
    <div class="flex justify-center dark-gradient p-2 tablet:p-6">
      {
        /* <Chart
        type="pie"
        width={350}
        height={350}
        options={{
          devicePixelRatio: 1,
          plugins: {
            legend: {
              position: "bottom" as const,
              labels: {
                boxWidth: 10,
                font: {
                  size: 10,
                },
              },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
        }}
        data={{
          labels: topLabels,
          datasets: [{
            label: "Top Holders",
            data: percentages,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            borderWidth: 1,
          }],
        }}
      /> */
      }
      <Chart
        type="pie"
        options={{
          scales: { yAxes: [{ ticks: { beginAtZero: true } }] },
        }}
        data={{
          labels: ["1", "2", "3"],
          datasets: [{
            label: "Sessions",
            data: [10, 20, 70],
            borderColor: ChartColors.Red,
            backgroundColor: transparentize(ChartColors.Red, 0.5),
            borderWidth: 1,
          }],
        }}
      />
    </div>
  );
};
