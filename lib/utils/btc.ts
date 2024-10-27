export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  try {
    const base = apiBaseUrl ? apiBaseUrl.replace(/\/+$/, "") : "";
    const params = encodeURIComponent(
      JSON.stringify(["bitcoin", "usd", true, true, true]),
    );
    const url =
      `${base}/quicknode/getPrice?name=cg_simplePrice&params=${params}`;

    console.log("Constructed URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Error fetching BTC price:", response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return 0;
  }
}
