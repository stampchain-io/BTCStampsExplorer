/**
 * Mock External API Server for CI Testing
 *
 * Provides mock responses for external services that are unavailable in CI:
 * - Counterparty API (compose/attach, compose/detach, balances, assets)
 * - Mempool.space API (transaction data, UTXOs)
 * - Blockstream API (transaction data, UTXOs)
 *
 * Returns realistic happy-path responses so POST endpoints can build PSBTs,
 * plus specific error responses for known error-path test UTXOs.
 *
 * Usage in CI:
 *   deno run --allow-net scripts/mock-external-apis.ts &
 *   export XCP_API_URL=http://localhost:18443/v2
 *   export MEMPOOL_API_URL=http://localhost:18443/mempool/api
 *   export BLOCKSTREAM_API_URL=http://localhost:18443/blockstream/api
 */

const MOCK_PORT = parseInt(Deno.env.get("MOCK_API_PORT") || "18443");

// ─── Bech32 Decoding (for dynamic scriptpubkey generation) ─────────────────────

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function bech32Decode(addr: string): Uint8Array | null {
  try {
    const lower = addr.toLowerCase();
    const pos = lower.lastIndexOf("1");
    if (pos < 1) return null;
    const data: number[] = [];
    for (const ch of lower.slice(pos + 1)) {
      const idx = BECH32_CHARSET.indexOf(ch);
      if (idx === -1) return null;
      data.push(idx);
    }
    // Strip checksum (last 6 chars) and witness version (first char)
    const payload = data.slice(1, -6);
    // Convert 5-bit groups to 8-bit bytes
    let acc = 0, bits = 0;
    const result: number[] = [];
    for (const val of payload) {
      acc = (acc << 5) | val;
      bits += 5;
      while (bits >= 8) {
        bits -= 8;
        result.push((acc >> bits) & 0xff);
      }
    }
    return new Uint8Array(result);
  } catch {
    return null;
  }
}

function addressToScriptPubKey(address: string): string {
  if (address.startsWith("bc1q")) {
    // P2WPKH (version 0, 20-byte witness program)
    const program = bech32Decode(address);
    if (program && program.length === 20) {
      return "0014" + Array.from(program)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  }
  if (address.startsWith("bc1p")) {
    // P2TR (version 1, 32-byte witness program)
    const program = bech32Decode(address);
    if (program && program.length === 32) {
      return "5120" + Array.from(program)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  }
  // Fallback: generic P2WPKH with dummy program
  return "0014" + "00".repeat(20);
}

// ─── Test Data Constants ───────────────────────────────────────────────────────

// Mock UTXO txid (deterministic for testing)
const MOCK_UTXO_TXID =
  "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16";

// Known test UTXOs for stampdetach error path tests
const DETACH_NO_ASSETS_UTXO =
  "27000ab9c75570204adc1b3a5e7820c482d99033fbb3aafb844c3a3ce8b063db:0";
const DETACH_INSUFFICIENT_UTXO =
  "a5b51bd8e9f01ce59bfa7e4f7cbdd9b3a642a6068b21ab181cdd5a11cf0ff1dd:0";

// Minimal valid Counterparty raw transaction hex:
// Version 2, 1 input (dummy), 2 outputs (P2WPKH dust + OP_RETURN CNTRPRTY)
// Seed address scriptpubkey: 0014b0003cd0dc05b4f32d658c945f0908f2f467f3fe
const COUNTERPARTY_RAW_TX =
  "020000000100000000000000000000000000000000000000000000000000000000000000010000000000ffffffff02220200000000000016001411a020fc27679cf960e56fc602616582fa0fddc600000000000000000a6a08434e54525052545900000000";

// ─── Response Helpers ──────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(data: string, status = 200): Response {
  return new Response(data, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

// ─── Mock Transaction Data ─────────────────────────────────────────────────────

/** Generate a full mempool.space-format transaction for any address */
function getMockTransaction(txid: string, address?: string) {
  const scriptpubkey = address
    ? addressToScriptPubKey(address)
    : "0014b0003cd0dc05b4f32d658c945f0908f2f467f3fe";

  return {
    txid,
    version: 2,
    locktime: 0,
    vin: [{
      txid:
        "0000000000000000000000000000000000000000000000000000000000000000",
      vout: 4294967295,
      prevout: null,
      scriptsig: "0400000000",
      scriptsig_asm: "OP_PUSHBYTES_4 00000000",
      is_coinbase: true,
      sequence: 4294967295,
    }],
    vout: [{
      scriptpubkey,
      scriptpubkey_asm: `OP_0 OP_PUSHBYTES_20 ${scriptpubkey.slice(4)}`,
      scriptpubkey_type: "v0_p2wpkh",
      scriptpubkey_address: address || "bc1qkqqre5xuqk60xtt93j297zgg7t6x0ul7gwjmv4",
      value: 10000000, // 0.1 BTC
    }],
    size: 87,
    weight: 348,
    fee: 0,
    status: {
      confirmed: true,
      block_height: 880000,
      block_hash:
        "000000000000000000026f36950e79eab9ea57e58f54b00a0e9b148f4a68a75f",
      block_time: 1700000000,
    },
  };
}

/** Generate raw tx hex for any address (for getRawTransactionHex fallback) */
function getMockRawTxHex(address?: string): string {
  const scriptpubkey = address
    ? addressToScriptPubKey(address)
    : "0014b0003cd0dc05b4f32d658c945f0908f2f467f3fe";
  const scriptBytes = scriptpubkey.length / 2;
  const scriptLenHex = scriptBytes.toString(16).padStart(2, "0");
  // Version 2 + 1 coinbase input + 1 output (10M sats) + locktime 0
  return "0200000001" +
    "0000000000000000000000000000000000000000000000000000000000000000" +
    "ffffffff" + "05" + "0400000000" + "ffffffff" +
    "01" + "8096980000000000" + scriptLenHex + scriptpubkey +
    "00000000";
}

/** UTXO list for any address (mempool.space/blockstream format) */
function getMockUtxoList() {
  return [{
    txid: MOCK_UTXO_TXID,
    vout: 0,
    status: {
      confirmed: true,
      block_height: 880000,
      block_hash:
        "000000000000000000026f36950e79eab9ea57e58f54b00a0e9b148f4a68a75f",
      block_time: 1700000000,
    },
    value: 10000000,
  }];
}

// Track address-to-txid mapping for consistent responses
const addressTxMap = new Map<string, string>();

function getTxidForAddress(address: string): string {
  if (!addressTxMap.has(address)) {
    addressTxMap.set(address, MOCK_UTXO_TXID);
  }
  return addressTxMap.get(address)!;
}

// Track txid-to-address mapping for tx lookups
const txAddressMap = new Map<string, string>();

// ─── Counterparty API Handler ──────────────────────────────────────────────────

function handleCounterpartyApi(
  path: string,
  _params: URLSearchParams,
): Response {
  // Health check
  if (path === "/healthz") {
    return jsonResponse({ result: { status: "Healthy" } });
  }

  // Compose detach: /utxos/{utxo}/compose/detach
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
    return jsonResponse({ error: "utxo not found" }, 404);
  }

  // Compose attach: /addresses/{address}/compose/attach - SUCCESS path
  const attachMatch = path.match(
    /^\/addresses\/([^/]+)\/compose\/attach$/,
  );
  if (attachMatch) {
    return jsonResponse({
      result: {
        rawtransaction: COUNTERPARTY_RAW_TX,
        params: {
          source: attachMatch[1],
          asset: "A12345678901234567",
          quantity: 1,
        },
      },
    });
  }

  // Compose send: /addresses/{address}/compose/send - SUCCESS path
  const sendMatch = path.match(/^\/addresses\/([^/]+)\/compose\/send$/);
  if (sendMatch) {
    return jsonResponse({
      result: {
        rawtransaction: COUNTERPARTY_RAW_TX,
        params: { source: sendMatch[1], asset: "A12345678901234567" },
      },
    });
  }

  // Compose dispense: /addresses/{address}/compose/dispense - SUCCESS path
  const dispenseMatch = path.match(
    /^\/addresses\/([^/]+)\/compose\/dispense$/,
  );
  if (dispenseMatch) {
    return jsonResponse({
      result: {
        rawtransaction: COUNTERPARTY_RAW_TX,
        params: { source: dispenseMatch[1] },
      },
    });
  }

  // Compose issuance: /addresses/{address}/compose/issuance - SUCCESS path
  const issuanceMatch = path.match(
    /^\/addresses\/([^/]+)\/compose\/issuance$/,
  );
  if (issuanceMatch) {
    return jsonResponse({
      result: {
        rawtransaction: COUNTERPARTY_RAW_TX,
        params: {
          source: issuanceMatch[1],
          asset: "A12345678901234567",
          quantity: 1,
          divisible: false,
          description: "Mock issuance for CI testing",
        },
      },
    });
  }

  // Get balances: /addresses/{address}/balances
  const balancesMatch = path.match(/^\/addresses\/([^/]+)\/balances/);
  if (balancesMatch) {
    return jsonResponse({
      result: [],
      next_cursor: null,
      result_count: 0,
    });
  }

  // Get asset: /assets/{cpid}
  const assetMatch = path.match(/^\/assets\/([^/]+)$/);
  if (assetMatch) {
    return jsonResponse({
      result: {
        asset: assetMatch[1],
        asset_longname: null,
        divisible: false,
        description: "Mock asset for CI testing",
        locked: false,
        supply: 1,
        owner: "bc1qkqqre5xuqk60xtt93j297zgg7t6x0ul7gwjmv4",
      },
    });
  }

  return jsonResponse(
    { error: `Unknown Counterparty endpoint: ${path}` },
    404,
  );
}

// ─── Bitcoin API Handler (mempool.space / blockstream shared format) ────────────

function handleBitcoinApi(path: string): Response {
  // Transaction details: /tx/{txid}
  const txMatch = path.match(/^\/tx\/([a-fA-F0-9]{64})$/);
  if (txMatch) {
    const txid = txMatch[1];
    const address = txAddressMap.get(txid);
    return jsonResponse(getMockTransaction(txid, address));
  }

  // Transaction hex: /tx/{txid}/hex
  const txHexMatch = path.match(/^\/tx\/([a-fA-F0-9]{64})\/hex$/);
  if (txHexMatch) {
    const txid = txHexMatch[1];
    const address = txAddressMap.get(txid);
    return textResponse(getMockRawTxHex(address));
  }

  // Address UTXOs: /address/{address}/utxo
  const utxoMatch = path.match(/^\/address\/([^/]+)\/utxo$/);
  if (utxoMatch) {
    const address = utxoMatch[1];
    // Register this address so tx lookups return correct scriptpubkey
    const txid = getTxidForAddress(address);
    txAddressMap.set(txid, address);
    return jsonResponse(getMockUtxoList());
  }

  // Address transactions: /address/{address}/txs
  const addrTxsMatch = path.match(/^\/address\/([^/]+)\/txs$/);
  if (addrTxsMatch) {
    const address = addrTxsMatch[1];
    const txid = getTxidForAddress(address);
    return jsonResponse([getMockTransaction(txid, address)]);
  }

  // Fee estimates: /v1/fees/recommended
  if (path === "/v1/fees/recommended") {
    return jsonResponse({
      fastestFee: 20,
      halfHourFee: 15,
      hourFee: 10,
      economyFee: 5,
      minimumFee: 1,
    });
  }

  return jsonResponse({ error: "Not found" }, 404);
}

// ─── Main Router ───────────────────────────────────────────────────────────────

function handler(req: Request): Response {
  const url = new URL(req.url);
  const path = url.pathname;
  const params = url.searchParams;

  console.log(`${req.method} ${path}`);

  if (path.startsWith("/v2/")) {
    return handleCounterpartyApi(path.replace(/^\/v2/, ""), params);
  }
  if (path.startsWith("/mempool/api/")) {
    return handleBitcoinApi(path.replace(/^\/mempool\/api/, ""));
  }
  if (path.startsWith("/blockstream/api/")) {
    return handleBitcoinApi(path.replace(/^\/blockstream\/api/, ""));
  }

  // Health check
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
console.log(`  UTXOs:            0.1 BTC mock UTXO for any address`);

Deno.serve({ port: MOCK_PORT }, handler);
