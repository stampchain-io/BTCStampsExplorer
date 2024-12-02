import { Chart } from "$fresh_charts/mod.ts";

interface PieChartProps {
  holders: Array<{
    address: string | null;
    amt: number | string;
    percentage: number | string;
  }>;
}

const PieChart = ({ holders }: PieChartProps) => {
  if (!holders?.length) {
    return <div class="text-center py-4">No holder data available</div>;
  }

  const generateColors = (count: number) => {
    // Convert hex to RGB for easier interpolation
    const startColor = { r: 0xaa, g: 0x00, b: 0xff };
    const endColor = { r: 0x44, g: 0x00, b: 0x66 };

    return Array(count).fill(0).map((_, index) => {
      // Calculate interpolation factor (0 to 1)
      const factor = count === 1 ? 0 : index / (count - 1);

      // Interpolate between colors
      const r = Math.round(startColor.r + (endColor.r - startColor.r) * factor);
      const g = Math.round(startColor.g + (endColor.g - startColor.g) * factor);
      const b = Math.round(startColor.b + (endColor.b - startColor.b) * factor);

      // Convert back to hex
      return `#${r.toString(16).padStart(2, "0")}${
        g.toString(16).padStart(2, "0")
      }${b.toString(16).padStart(2, "0")}`;
    });
  };

  try {
    const DoughnutConfig = {
      type: "doughnut" as const,
      width: 300,
      height: 300,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context: any) => {
                const holder = holders[context.dataIndex];
                return [
                  `Address: ${holder.address || "Unknown"}`,
                  `Amount: ${Number(holder.amt)}`,
                  `Percent: ${Number(holder.percentage)}%`,
                ];
              },
            },
          },
        },
      },
      data: {
        labels: holders.map((h) => h.address || "Unknown"),
        datasets: [{
          borderColor: [...Array(holders.length)].fill("#666666"),
          label: "Graph Holder",
          data: holders.map((holder) => Number(holder.amt)),
          backgroundColor: generateColors(holders.length),
          hoverOffset: 4,
        }],
      },
    };

    return (
      <div class="flex items-center justify-center w-[300px] h-[300px] tablet:w-[400px] tablet:h-[400px] p-6">
        <Chart {...DoughnutConfig} />
      </div>
    );
  } catch (error) {
    console.error("Error rendering chart:", error);
    return <div class="text-center py-6">Error rendering chart</div>;
  }
};

export default PieChart;
