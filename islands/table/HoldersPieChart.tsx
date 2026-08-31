/* ===== HOLDERS PIE CHART COMPONENT ===== */
import type { PieChartProps } from "$types/ui.d.ts";
import type { HolderRow } from "$types/wallet.d.ts";
import { Chart } from "fresh_charts/island.tsx";

/* ===== TYPES ===== */
interface Holder {
  address: string | null;
  amt: number;
  percentage: number;
}

/* ===== COMPONENT ===== */
export const HoldersPieChart = ({ holders: rawHolders }: PieChartProps) => {
  // Transform HolderRow[] to Holder[]
  const holders: Holder[] = (rawHolders ?? []).map((h: HolderRow) => ({
    address: h.address,
    amt: h.amt ?? h.quantity ?? 0,
    percentage: h.percentage ?? 0,
  }));
  /* ===== EMPTY STATE ===== */
  if (!holders?.length) {
    return <div class="text-center py-4">NO HOLDER DATA AVAILABLE</div>;
  }

  /* ===== HELPER FUNCTIONS ===== */
  const generateColors = (count: number) => {
    // Primary fuchsia stops from tailwind.config.ts: primary.500 (#D946EF), primary.400 (#E879F9), primary.300 (#F0ABFC)
    const palette = [
      { r: 0xd9, g: 0x46, b: 0xef },
      { r: 0xe8, g: 0x79, b: 0xf9 },
      { r: 0xf0, g: 0xab, b: 0xfc },
    ];

    return Array(count).fill(0).map((_, index) => {
      const factor = count === 1 ? 0 : index / (count - 1);
      const scaled = factor * (palette.length - 1);
      const fromIndex = Math.min(Math.floor(scaled), palette.length - 2);
      const localFactor = scaled - fromIndex;
      const from = palette[fromIndex];
      const to = palette[fromIndex + 1];

      const r = Math.round(from.r + (to.r - from.r) * localFactor);
      const g = Math.round(from.g + (to.g - from.g) * localFactor);
      const b = Math.round(from.b + (to.b - from.b) * localFactor);

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
      width: 290,
      height: 290,
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
            position: "nearest" as const,
            yAlign: "bottom" as const,
            backgroundColor: "#000000e6",
            borderColor: "#262626",
            borderWidth: 1,
            cornerRadius: 12,
            padding: {
              top: 12,
              bottom: 12,
              left: 16,
              right: 16,
            },
            titleColor: "#A3A3A3",
            bodyColor: "#E5E5E5",
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            boxPadding: 8,
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
        labels: holders.map((h: any) => h.address || "Unknown"),
        datasets: [{
          borderColor: [...Array(holders.length)].fill(
            "#000000e6",
          ),
          label: "Graph Holder",
          data: holders.map((holder: any) => Number(holder.amt)),
          backgroundColor: generateColors(holders.length),
          hoverOffset: 9,
        }],
      },
    };

    /* ===== RENDER ===== */
    return (
      <div class="flex items-center justify-center w-[290px] h-[290px] tablet:pt-1">
        <Chart {...DoughnutConfig} />
      </div>
    );
  } catch (error) {
    /* ===== ERROR STATE ===== */
    console.error("Error rendering chart:", error);
    return <div class="text-center py-5">ERROR RENDERING CHART</div>;
  }
};
