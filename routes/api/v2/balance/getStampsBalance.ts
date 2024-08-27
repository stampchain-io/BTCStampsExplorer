import { XcpManager } from "$lib/services/xcpService.ts";

// FIXME: This is a temporary endpoint to get the stamps balance for a given address
export async function handler(req: Request): Promise<Response> {
  const { address } = await req.json();
  const stampBalance = await XcpManager.getXcpBalancesByAddress(address);
  return new Response(JSON.stringify({ stampBalance }), {
    headers: { "Content-Type": "application/json" },
  });
}
