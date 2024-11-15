import { Chart } from "$fresh_charts/mod.ts";
import { abbreviateAddress } from "$lib/utils/util.ts";

interface SRC20HoldersProps {
  holders: Array<{
    address: string | null;
    amt: number;
    percentage: number;
  }>;
}

const SRC20Holders = ({ holders }: SRC20HoldersProps) => {
  const generateColors = (count: number) => {
    const startColor = { r: 0xaa, g: 0x00, b: 0xff };
    const endColor = { r: 0x44, g: 0x00, b: 0x66 };

    return Array(count).fill(0).map((_, index) => {
      const factor = count === 1 ? 0 : index / (count - 1);
      const r = Math.round(startColor.r + (endColor.r - startColor.r) * factor);
      const g = Math.round(startColor.g + (endColor.g - startColor.g) * factor);
      const b = Math.round(startColor.b + (endColor.b - startColor.b) * factor);

      return `#${r.toString(16).padStart(2, "0")}${
        g.toString(16).padStart(2, "0")
      }${b.toString(16).padStart(2, "0")}`;
    });
  };

  const DoughnutConfig = {
    type: "doughnut",
    svgClass: "w-full h-1/2",
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const holder = holders[context.dataIndex];
              return [
                `Address: ${
                  holder.address ? abbreviateAddress(holder.address) : "Unknown"
                }`,
                `Amount: ${holder.amt}`,
                `Percent: ${holder.percentage}%`,
              ];
            },
          },
        },
      },
    },
    data: {
      labels: false,
      datasets: [{
        borderColor: [...Array(holders.length)].fill("#666666"),
        label: "Graph Holder",
        data: holders.map((holder) => holder.amt),
        backgroundColor: generateColors(holders.length),
        hoverOffset: 4,
      }],
    },
  };

  return <Chart {...DoughnutConfig} />;
};

export default SRC20Holders;
