import { containerBackground, loaderSpinLgGrey } from "$layout";
import type { ChartWidgetProps, HighchartsData } from "$types/ui.d.ts";
import Highcharts from "highcharts/highstock";
import { useEffect, useState } from "preact/hooks";

// Define TypeScript Props Interface with proper imported types

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

    setLoading(true); // Show loading state

    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Ensure data is properly typed and available
      const chartData: HighchartsData = data || [];

      console.log("Initializing Highcharts for", containerId, chartData);
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
              data: chartData,
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
          credits: { enabled: false }, // Remove Highcharts watermark
          rangeSelector: {
            enabled: true, // Must be explicitly enabled
            selected: 1,
            labelStyle: { display: "none" }, // Hides "Zoom" text
            buttonSpacing: 12, // 12px spacing
            inputEnabled: false, // Hide date input fields
            // Button position is defined in styles.css
            buttonTheme: {
              width: 40, // Control total width (affects horizontal space)
              padding: 3, // Internal padding (uniform)
              r: 12, // Border radius (rounded-xl = 12px)
              stroke: "rgba(102, 102, 102, 0.4)", // Border color with transparency
              "stroke-width": 1, // Use quoted property name for SVG
              fill: "rgba(33, 28, 33, 0.1)", // Glassmorphism button background
              style: {
                fontSize: "10px", // Text size
                color: "#666666", // Text color
              },
              states: {
                hover: {
                  fill: "rgba(33, 28, 33, 0.4)", // Glassmorphism button hover
                  stroke: "rgba(102, 102, 102, 0.6)", // Hover border color
                  style: {
                    color: "#00ff00", // Hover text color
                  },
                },
                select: {
                  fill: "#999999", // Fill when selected
                  stroke: "rgba(102, 102, 102, 0.6)", // Selected border color
                },
              },
            },
            buttons: [
              { type: "day", count: 1, text: "24H" },
              { type: "day", count: 7, text: "7D" },
              { type: "month", count: 1, text: "1M" },
              { type: "year", count: 1, text: "1Y" },
              { type: "all", text: "ALL" },
            ],
          },
          yAxis: {
            labels: {
              formatter: function () {
                return this.value.toLocaleString() + " SAT";
              },
            },
            title: { text: "PRICE (SAT)" },
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
              color: "#999999",
              data: chartData,
              tooltip: {
                valueSuffix: " SAT",
              },
            },
          ],
        });
      }
      console.log("Highcharts initialized for", containerId);
      setLoading(false); // Hide loading after chart renders
    }, 1000); // Simulate loading delay
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div class={`${containerBackground} text-sm text-stamp-grey text-center`}>
        NO DATA
      </div>
    );
  }

  return (
    <div class={containerBackground}>
      {loading
        ? (
          <div
            class={`${loaderSpinLgGrey} my-[182px] mx-auto`}
          />
        )
        : null}
      <div id={containerId} />
    </div>
  );
};

export default ChartWidget;
