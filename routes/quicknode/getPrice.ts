import { fetch_quicknode } from "utils/quicknode.ts";

export async function handler(req: Request): Promise<Response> {
  const { name, params } = await req.json();
  const stampBalance = await fetch_quicknode(name, params);
  console.log(stampBalance);
  return new Response(
    JSON.stringify({ price: stampBalance.result.bitcoin.usd }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
