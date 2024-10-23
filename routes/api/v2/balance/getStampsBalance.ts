import { XcpManager } from "$lib/services/xcpService.ts";

// FIXME: This is a temporary endpoint to get the stamps balance for a given address
export async function handler(req: Request): Promise<Response> {
  try {
    const { address, utxoOnly } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: "Address is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Parse utxoOnly as boolean
    const utxoOnlyBool = utxoOnly === true || utxoOnly === "true";

    const stampBalance = await XcpManager.getXcpBalancesByAddress(
      address,
      undefined, // cpid
      utxoOnlyBool,
    );

    return new Response(JSON.stringify({ stampBalance }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in getStampsBalance:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
