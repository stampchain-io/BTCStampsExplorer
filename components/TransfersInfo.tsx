import { Chart } from "$fresh_charts/mod.ts";

interface TransferInfoType {
  row_num: number;
  tx_hash: string;
  block_index: number;
  p: string;
  op: string;
  tick: string;
  creator: string;
  amt: string;
  deci: number;
  lim: any;
  max: any;
  destination: string;
  block_time: string;
  creator_name: any;
  destination_name: any;
}

export const TransfersInfo = (
  { transfers }: { transfers: TransferInfoType[] },
) => {
  const sortedTransfers = transfers.sort((a, b) =>
    a.block_index - b.block_index
  );
  const amount = sortedTransfers.map((transfer) => parseFloat(transfer.amt));
  const blockIndex = sortedTransfers.map((transfer) =>
    transfer.block_index.toString()
  );

  return (
    <div class="">
      <Chart
        type="line"
        options={{
          scales: {
            yAxes: [{
              ticks: { beginAtZero: true },
              // gridLines: {
              //   display: true,
              //   strokeOpacity: 1,
              //   color: "#6E6E6E",
              //   lineWidth: 1,
              // },
            }],
          },
        }}
        data={{
          labels: blockIndex,
          datasets: [{
            label: "Transfers",
            data: amount,
            borderColor: "#5053EA",
            backgroundColor: "#5053EA",
            borderWidth: 1,
            lineTension: 0.4,
            showLine: true,
          }],
        }}
      />
    </div>
  );
};
