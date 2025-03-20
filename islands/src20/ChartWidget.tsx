import { useEffect, useState } from "preact/hooks";
import Highcharts from "highcharts/highstock";

// ✅ Define TypeScript Props Interface
interface ChartWidgetProps {
  data: [number, number][];
  fromPage: string;
  tick: string;
}

const ChartWidget = (
  { data, fromPage = "detail", tick = "" }: ChartWidgetProps,
) => {
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setLoading(true); // ✅ Show loading state

    setTimeout(() => {
      const container = document.getElementById(
        tick ? `chart-container-${tick}` : "chart-container",
      );
      if (!container) return;

      fromPage === "home"
        ? Highcharts.stockChart(container, {
          chart: {
            backgroundColor: null,
            width: 200,
            height: 80,
            style: {
              overflow: "hidden", // Ensures no extra content is visible
            },
          },
          title: { text: "" }, // Remove chart title
          credits: { enabled: false }, // Remove Highcharts watermark
          rangeSelector: {
            selected: 0, // Select the first button (1 Day)
            enabled: false, // Remove zoom buttons
          },
          navigator: { enabled: false }, // Remove the navigator
          scrollbar: { enabled: false }, // Remove scrollbar
          yAxis: {
            labels: { enabled: false }, // Remove y-axis labels
            title: { text: "" }, // Remove y-axis title
            gridLineWidth: 0,
            lineWidth: 0,
          },
          xAxis: {
            labels: { enabled: false }, // Remove x-axis labels
            title: { text: "" }, // Remove x-axis title
            tickLength: 0, // Remove axis ticks
            gridLineWidth: 0, // Remove vertical grid lines
            lineWidth: 0,
          },
          tooltip: {
            enabled: false,
          },
          series: [
            {
              type: "line",
              name: "",
              data: data,
              color: "#8800cc",
              lineWidth: 2,
              tooltip: {
                valueSuffix: "",
              },
            },
          ],
        })
        : Highcharts.stockChart(container, {
          chart: {
            backgroundColor: null,
          },
          credits: { enabled: false }, // ✅ Remove Highcharts watermark
          rangeSelector: {
            selected: 1,
            labelStyle: { display: "none" }, // ✅ Hides "Zoom" text
            buttons: [
              { type: "day", count: 1, text: "1D" },
              { type: "day", count: 7, text: "7D" },
              { type: "month", count: 1, text: "1M" },
              { type: "year", count: 1, text: "1Y" },
              { type: "all", text: "All" },
            ],
          },
          yAxis: {
            labels: {
              formatter: function () {
                return this.value.toLocaleString() + " SAT";
              },
            },
            title: { text: "Price (SAT)" },
          },
          xAxis: { type: "datetime" },
          navigator: { enabled: false }, // Remove the navigator
          scrollbar: { enabled: false },
          tooltip: {
            enabled: true,
            backgroundColor: "#000000BF", // Black with transparency
            style: {
              color: "#CCCCCC", // Title & body text color
            },
            borderRadius: 8,
            borderWidth: 0,
            shadow: false,
          },
          series: [
            {
              type: chartType, // ✅ Dynamic chart type (line/candlestick)
              name: "Price in SAT",
              color: "#8800cc",
              data: data,
              tooltip: {
                valueSuffix: " SAT",
              },
            },
          ],
        });

      setLoading(false); // ✅ Hide loading after chart renders
    }, 1000); // Simulate loading delay
  }, [data, chartType]); // ✅ Re-render when data or chartType changes

  return (
    <div className="p-4">
      {loading
        ? <p className="text-gray-500 text-center">Loading chart...</p>
        : <></>}
      <div id={tick ? `chart-container-${tick}` : "chart-container"} />
    </div>
  );
};

export default ChartWidget;
