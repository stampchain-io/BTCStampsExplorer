export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  const base = apiBaseUrl || "";
  const params = encodeURIComponent(
    JSON.stringify(["bitcoin", "usd", true, true, true]),
  );
  const url = `${base}/quicknode/getPrice?name=cg_simplePrice&params=${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Error fetching BTC price:", response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.price || 0;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return 0;
  }
}
