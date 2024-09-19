import { Chart } from "$fresh_charts/mod.ts";

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
  const totalQuantity = holders.reduce(
    (sum, holder) => sum + holder.quantity,
    0,
  );

  const holdersWithPercentage = holders.map((holder) => ({
    ...holder,
    percentage: (holder.quantity / totalQuantity) * 100,
  }));

  const topHolders = holdersWithPercentage
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

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
    <div class="flex justify-center bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-2 md:p-6">
      <Chart
        type="pie"
        width={350}
        options={{
          devicePixelRatio: 1,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 10,
                font: {
                  size: 10,
                },
              },
            },
          },
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
      />
    </div>
  );
};
