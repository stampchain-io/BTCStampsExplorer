import { URLSearchParams } from "node:url";

interface TransactionParams {
  fromAddress: string;
  destinations: string[];
  assetId: string;
  fee: number;
}

export async function createMpmaTransaction() {
  const params: TransactionParams = {
    fromAddress: "1AwS3wRFNCoymKs69BXjAA4VfgWvuKvx4j",
    destinations: [
      "1AwS3wRFNCoymKs69BXjAA4VfgWvuKvx4j",
      "14xJqdZXuQycTutvqCB8ksq9HLwaSFKZgF",
      "1LxW4z23GF3sG9tWhaUtTJd1UHcKu7UiY7",
      "1MZUaVy6y7vmwh2MqMKTFy2JiqXteyevpN",
      "1M6arvapNSFrQ9M8j8A4Zea6HofwqbQLhR",
      "14cvk4p4LN2Lpn4AzkjUHDr7A2tKerMhzk",
      "16Kzr7ocw1pTDhR5FL5vvFWmiSz4iFpygS",
    ],
    assetId: "A1682177391804515006",
    fee: 2000, // Using a reasonable fixed fee for now
  };

  const assets = Array(params.destinations.length).fill(params.assetId);
  const quantities = Array(params.destinations.length).fill("1");

  const urlParams = new URLSearchParams({
    destinations: params.destinations.join(","),
    assets: assets.join(","),
    quantities: quantities.join(","),
    allow_unconfirmed_inputs: "true",
    exact_fee: params.fee.toString(),
  });

  const browserUrl =
    `https://api.counterparty.io:4000/v2/addresses/${params.fromAddress}/compose/mpma?${urlParams.toString()}`;
  console.log("\nBrowser URL (copy this to your browser):\n", browserUrl);

  try {
    const response = await fetch(browserUrl);
    const data = await response.json();

    if (data?.result?.rawtransaction) {
      console.log("Raw Transaction (hex):", data.result.rawtransaction);
    } else {
      console.error("Error: 'rawtransaction' key not found in response.");
      console.log("Full API Response:", data);
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
}

// Call the function when the script is run directly
if (import.meta.main) {
  createMpmaTransaction().catch(console.error);
}
