import { useEffect, useState } from "preact/hooks";
import Highcharts from "highcharts/highstock";
import { loaderSpinXsPurple } from "$layout";
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
  const chartType: "line" | "candlestick" = "line";

  // Sanitize tick for use in HTML id
  const safeTick = tick.replace(/[^a-zA-Z0-9_-]/g, "");
  const containerId = safeTick
    ? `chart-container-${safeTick}`
    : "chart-container";

  useEffect(() => {
    if (typeof window === "undefined") return;

    setLoading(true); // ✅ Show loading state

    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container) return;

      console.log("Initializing Highcharts for", containerId, data);
      if (fromPage === "home") {
        Highcharts.stockChart(containerId, {
          chart: {
            backgroundColor: "transparent",
            width: 160,
            height: 40,
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
              color: "#8800CC",
              lineWidth: 2,
              tooltip: {
                valueSuffix: "",
              },
            },
          ],
        });
      } else {
        Highcharts.stockChart(containerId, {
          chart: {
            backgroundColor: "transparent",
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
              type: chartType, // Chart type constant
              name: "Price in SAT",
              color: "#8800CC",
              data: data,
              tooltip: {
                valueSuffix: " SAT",
              },
            },
          ],
        });
      }
      console.log("Highcharts initialized for", containerId);
      setLoading(false); // ✅ Hide loading after chart renders
    }, 1000); // Simulate loading delay
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="text-sm text-stamp-grey">NO CHART DATA</div>;
  }

  return (
    <div>
      {loading ? <div class={loaderSpinXsPurple} /> : null}
      <div id={containerId} />
    </div>
  );
};

export default ChartWidget;
