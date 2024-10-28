import { Chart } from "$fresh_charts/island.tsx";

const PieChart = () => {
  const DoughnutConfig = {
    type: "doughnut",
    svgClass: "w-full h-1/2",
    options: {
      responsive: false,
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

  return (
    <>
      <Chart {...DoughnutConfig} />
    </>
  );
};

export default PieChart;
