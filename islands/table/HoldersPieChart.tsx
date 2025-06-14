/* ===== HOLDERS PIE CHART COMPONENT ===== */
import { Chart } from "fresh_charts/island.tsx";

/* ===== TYPES ===== */
interface PieChartProps {
  holders: Array<{
    address: string | null;
    amt: number | string;
    percentage: number | string;
  }>;
}

/* ===== COMPONENT ===== */
export const HoldersPieChart = ({ holders }: PieChartProps) => {
  /* ===== EMPTY STATE ===== */
  if (!holders?.length) {
    return <div class="text-center py-4">No holder data available</div>;
  }

  /* ===== HELPER FUNCTIONS ===== */
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

  /* ===== CHART RENDERING ===== */
  try {
    /* ===== CHART CONFIGURATION ===== */
    const DoughnutConfig = {
      type: "doughnut" as const,
      width: 300,
      height: 300,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        layout: {
          padding: 9,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "#000000BF",
            titleColor: "#CCCCCC",
            bodyColor: "#CCCCCC",
            position: "nearest",
            yAlign: "bottom",
            callbacks: {
              label: (context: any) => {
                const holder = holders[context.dataIndex];
                return [
                  `AMOUNT: ${Number(holder.amt)}`,
                  `PERCENT: ${Number(holder.percentage)}%`,
                ];
              },
            },
            caretPadding: 12,
            caretSize: 0,
          },
        },
      },
      data: {
        labels: holders.map((h) => h.address || "Unknown"),
        datasets: [{
          borderColor: [...Array(holders.length)].fill("#220033"),
          label: "Graph Holder",
          data: holders.map((holder) => Number(holder.amt)),
          backgroundColor: generateColors(holders.length),
          hoverOffset: 9,
        }],
      },
    };

    /* ===== RENDER ===== */
    return (
      <div class="flex items-center justify-center w-[300px] h-[300px] p-6">
        <Chart {...DoughnutConfig} />
      </div>
    );
  } catch (error) {
    /* ===== ERROR STATE ===== */
    console.error("Error rendering chart:", error);
    return <div class="text-center py-6">Error rendering chart</div>;
  }
};
