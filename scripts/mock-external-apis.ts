/**
 * Mock External API Server for CI Testing
 *
 * Provides mock responses for external services that are unavailable in CI:
 * - Counterparty API (compose/attach, compose/detach, balances, assets)
 * - Mempool.space API (transaction data, UTXOs)
 * - Blockstream API (transaction data, UTXOs)
 *
 * Usage in CI:
 *   deno run --allow-net scripts/mock-external-apis.ts &
 *   export XCP_API_URL=http://localhost:18443/v2
 *   export MEMPOOL_API_URL=http://localhost:18443/mempool/api
 *   export BLOCKSTREAM_API_URL=http://localhost:18443/blockstream/api
 */

const MOCK_PORT = parseInt(Deno.env.get("MOCK_API_PORT") || "18443");

// Known test UTXOs from Newman comprehensive test collection
const DETACH_NO_ASSETS_UTXO =
  "27000ab9c75570204adc1b3a5e7820c482d99033fbb3aafb844c3a3ce8b063db:0";
const DETACH_INSUFFICIENT_UTXO =
  "a5b51bd8e9f01ce59bfa7e4f7cbdd9b3a642a6068b21ab181cdd5a11cf0ff1dd:0";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function handleCounterpartyApi(path: string, _params: URLSearchParams): Response {
  // Health check
  if (path === "/healthz") {
    return jsonResponse({ result: { status: "Healthy" } });
  }

  // Compose detach: /v2/utxos/{utxo}/compose/detach
  const detachMatch = path.match(/^\/utxos\/([^/]+)\/compose\/detach$/);
  if (detachMatch) {
    const utxo = decodeURIComponent(detachMatch[1]);
    if (utxo === DETACH_NO_ASSETS_UTXO) {
      return jsonResponse(
        { error: "no assets to detach from this utxo" },
        400,
      );
    }
    if (utxo === DETACH_INSUFFICIENT_UTXO) {
      return jsonResponse(
        { error: "Insufficient BTC at address (1191 < 11718 satoshis)" },
        400,
      );
    }
    // Unknown UTXO - generic error
    return jsonResponse({ error: "utxo not found" }, 404);
  }

  // Compose attach: /v2/addresses/{address}/compose/attach
  const attachMatch = path.match(
    /^\/addresses\/([^/]+)\/compose\/attach$/,
  );
  if (attachMatch) {
    return jsonResponse(
      { error: "insufficient funds for attach operation" },
      400,
    );
  }

  // Compose send: /v2/addresses/{address}/compose/send
  const sendMatch = path.match(/^\/addresses\/([^/]+)\/compose\/send$/);
  if (sendMatch) {
    return jsonResponse(
      { error: "insufficient funds for send operation" },
      400,
    );
  }

  // Compose dispense: /v2/addresses/{address}/compose/dispense
  const dispenseMatch = path.match(
    /^\/addresses\/([^/]+)\/compose\/dispense$/,
  );
  if (dispenseMatch) {
    return jsonResponse(
      { error: "insufficient funds for dispense operation" },
      400,
    );
  }

  // Get balances: /v2/addresses/{address}/balances
  const balancesMatch = path.match(/^\/addresses\/([^/]+)\/balances/);
  if (balancesMatch) {
    return jsonResponse({
      result: [],
      next_cursor: null,
      result_count: 0,
    });
  }

  // Get asset: /v2/assets/{cpid}
  const assetMatch = path.match(/^\/assets\/([^/]+)$/);
  if (assetMatch) {
    const cpid = assetMatch[1];
    return jsonResponse({
      result: {
        asset: cpid,
        asset_longname: null,
        divisible: false,
        description: "Mock asset for CI testing",
        locked: false,
        supply: 1,
        owner: "mock_owner",
      },
    });
  }

  // Default: return 404
  return jsonResponse({ error: `Unknown endpoint: ${path}` }, 404);
}

function handleMempoolApi(path: string): Response {
  // Transaction details: /api/tx/{txid}
  const txMatch = path.match(/^\/tx\/([a-fA-F0-9]{64})$/);
  if (txMatch) {
    return jsonResponse({ error: "Transaction not found" }, 404);
  }

  // Transaction hex: /api/tx/{txid}/hex
  const txHexMatch = path.match(/^\/tx\/([a-fA-F0-9]{64})\/hex$/);
  if (txHexMatch) {
    return new Response("Transaction not found", { status: 404 });
  }

  // Address UTXOs: /api/address/{address}/utxo
  const utxoMatch = path.match(/^\/address\/([^/]+)\/utxo$/);
  if (utxoMatch) {
    return jsonResponse([]);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

function handleBlockstreamApi(path: string): Response {
  // Same patterns as mempool
  const txMatch = path.match(/^\/tx\/([a-fA-F0-9]{64})$/);
  if (txMatch) {
    return jsonResponse({ error: "Transaction not found" }, 404);
  }

  const txHexMatch = path.match(/^\/tx\/([a-fA-F0-9]{64})\/hex$/);
  if (txHexMatch) {
    return new Response("Transaction not found", { status: 404 });
  }

  const utxoMatch = path.match(/^\/address\/([^/]+)\/utxo$/);
  if (utxoMatch) {
    return jsonResponse([]);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

function handler(req: Request): Response {
  const url = new URL(req.url);
  const path = url.pathname;
  const params = url.searchParams;

  // Route to appropriate mock handler based on path prefix
  if (path.startsWith("/v2/")) {
    return handleCounterpartyApi(path.replace(/^\/v2/, ""), params);
  }

  if (path.startsWith("/mempool/api/")) {
    return handleMempoolApi(path.replace(/^\/mempool\/api/, ""));
  }

  if (path.startsWith("/blockstream/api/")) {
    return handleBlockstreamApi(path.replace(/^\/blockstream\/api/, ""));
  }

  // Health check for the mock server itself
  if (path === "/health" || path === "/") {
    return jsonResponse({
      status: "ok",
      service: "mock-external-apis",
      endpoints: ["counterparty", "mempool", "blockstream"],
    });
  }

  return jsonResponse({ error: `Unknown route: ${path}` }, 404);
}

console.log(`Mock External API Server starting on port ${MOCK_PORT}...`);
console.log(`  Counterparty API: http://localhost:${MOCK_PORT}/v2`);
console.log(`  Mempool API:      http://localhost:${MOCK_PORT}/mempool/api`);
console.log(`  Blockstream API:  http://localhost:${MOCK_PORT}/blockstream/api`);

Deno.serve({ port: MOCK_PORT }, handler);
