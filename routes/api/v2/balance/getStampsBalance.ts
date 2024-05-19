import { get_stamps_balance } from "utils/xcp.ts";

export async function handler(req: Request): Promise<Response> {
  const { address } = await req.json();
  const stampBalance = await get_stamps_balance(address);
  return new Response(JSON.stringify({ stampBalance }), {
    headers: { "Content-Type": "application/json" },
  });
}
