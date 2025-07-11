#!/usr/bin/env -S deno run --allow-net --allow-write

/**
 * Fetches real UTXO data from Mempool.space API to create realistic test fixtures
 */

interface MempoolUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    witness: string[];
    is_coinbase: boolean;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
}

async function fetchAddressUTXOs(address: string): Promise<MempoolUTXO[]> {
  const url = `https://mempool.space/api/address/${address}/utxo`;
  console.log(`Fetching UTXOs for address: ${address}`);

  // Add delay to respect rate limits
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 429) {
      console.log("Rate limited, waiting 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return fetchAddressUTXOs(address);
    }
    throw new Error(
      `Failed to fetch UTXOs: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
}

async function fetchTransactionDetails(
  txid: string,
): Promise<MempoolTransaction> {
  const url = `https://mempool.space/api/tx/${txid}`;
  console.log(`Fetching transaction details for: ${txid}`);

  // Add delay to respect rate limits
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 429) {
      console.log("Rate limited, waiting 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return fetchTransactionDetails(txid);
    }
    throw new Error(
      `Failed to fetch transaction: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
}

function detectScriptType(script: string): string {
  if (script.startsWith("0014") && script.length === 44) return "p2wpkh";
  if (script.startsWith("0020") && script.length === 68) return "p2wsh";
  if (script.startsWith("76a914") && script.endsWith("88ac")) return "p2pkh";
  if (script.startsWith("a914") && script.endsWith("87")) return "p2sh";
  if (script.startsWith("5120") && script.length === 68) return "p2tr";
  return "unknown";
}

async function createUTXOFixtures() {
  console.log("Starting UTXO fixture creation...");

  // Well-known Bitcoin addresses with different script types that should have UTXOs
  const addresses = [
    // P2WPKH (Native SegWit) - Using a known active address
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    // P2PKH (Legacy) - Using active exchange addresses
    "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", // Bitfinex hot wallet
    "1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s", // Another exchange address
    // P2SH (Script Hash) - Using active multisig addresses
    "3LYJfcfHPXYJreMsASk2jkn69LWEYKzexb", // BitGo multisig
    "3QCvfCptnHZRZjKFSUjmjKtloGVzVu88GS", // Another multisig wallet
    // P2WSH (Witness Script Hash) - Using Lightning Network related addresses
    "bc1qeklep85ntjz4605drds6aww9u0qr46qzrv5xswd35uhjuj8ahfcqgf6hak",
    "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3", // Well-known P2WSH
    // P2TR (Taproot) - Using a known taproot address
    "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
  ];

  const fixtures: any = {
    p2wpkh: {},
    p2pkh: {},
    p2sh: {},
    p2wsh: {},
    p2tr: {},
  };

  let totalFixtures = 0;

  for (const address of addresses) {
    try {
      console.log(`\nProcessing address: ${address}`);
      const utxos = await fetchAddressUTXOs(address);

      console.log(`Found ${utxos.length} UTXOs for ${address}`);

      if (utxos.length === 0) {
        console.log(`No UTXOs found for ${address}, skipping...`);
        continue;
      }

      // Process first few UTXOs to avoid hitting rate limits
      const utxosToProcess = utxos.slice(0, 2);

      for (const utxo of utxosToProcess) {
        try {
          const txDetails = await fetchTransactionDetails(utxo.txid);
          const output = txDetails.vout[utxo.vout];

          if (!output) {
            console.log(`No output found for ${utxo.txid}:${utxo.vout}`);
            continue;
          }

          const scriptType = detectScriptType(output.scriptpubkey);

          if (scriptType === "unknown") {
            console.log(
              `Unknown script type for ${output.scriptpubkey}, skipping...`,
            );
            continue;
          }

          const fixtureKey = `real_${utxo.value}_${utxo.txid.slice(0, 8)}`;

          const fixture = {
            txid: utxo.txid,
            vout: utxo.vout,
            value: BigInt(utxo.value),
            script: output.scriptpubkey,
            address: output.scriptpubkey_address || address,
            scriptType: scriptType,
            witnessUtxo: {
              script: output.scriptpubkey,
              value: BigInt(utxo.value),
            },
            blockHeight: utxo.status.block_height,
            confirmations: utxo.status.confirmed ? 6 : 0, // Assume 6+ confirmations if confirmed
            isTestnet: false,
            scriptPubKeyType: output.scriptpubkey_type,
            scriptPubKeyAsm: output.scriptpubkey_asm,
          };

          // Add to appropriate category
          if (fixtures[scriptType]) {
            fixtures[scriptType][fixtureKey] = fixture;
            totalFixtures++;
            console.log(
              `✅ Added ${scriptType} UTXO: ${utxo.txid}:${utxo.vout} (${utxo.value} sats)`,
            );
          }

          // Rate limiting - wait between API calls
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err) {
          console.error(
            `❌ Error processing UTXO ${utxo.txid}:${utxo.vout}: ${err}`,
          );
        }
      }
    } catch (err) {
      console.error(`❌ Error fetching address ${address}: ${err}`);
    }

    // Longer delay between addresses
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log(`\n📊 Total fixtures created: ${totalFixtures}`);

  // If we didn't get any real fixtures, create some mock ones for testing
  if (totalFixtures === 0) {
    console.log(
      "⚠️  No real UTXOs found, creating mock fixtures for testing...",
    );
    fixtures.p2wpkh.mock_utxo = {
      txid: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      vout: 0,
      value: BigInt(100000),
      script: "001491b24bf9f5288532960ac687abb035127b1d28a5",
      address: "bc1qjxeyh7649j2j99s2c6rm4vp4zfalw2990w5a7g",
      scriptType: "p2wpkh",
      witnessUtxo: {
        script: "001491b24bf9f5288532960ac687abb035127b1d28a5",
        value: BigInt(100000),
      },
      blockHeight: 800000,
      confirmations: 6,
      isTestnet: false,
      note: "Mock fixture - replace with real data when API allows",
    };

    fixtures.p2pkh.mock_utxo = {
      txid: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
      vout: 1,
      value: BigInt(50000),
      script: "76a914389ffce9cd9ae88dcc0631e88a821ffdbe9bfe2615488ac",
      address: "15ZvpzfQFUdeGP7YQEzVa9CLBc4RxSeRoq",
      scriptType: "p2pkh",
      witnessUtxo: {
        script: "76a914389ffce9cd9ae88dcc0631e88a821ffdbe9bfe2615488ac",
        value: BigInt(50000),
      },
      blockHeight: 800001,
      confirmations: 6,
      isTestnet: false,
      note: "Mock fixture - replace with real data when API allows",
    };
  }

  // Write fixtures to file
  const fixtureCode = `// Real Bitcoin UTXO Test Fixtures from Mempool.space
// Generated on ${new Date().toISOString()}
// These are real UTXOs from the Bitcoin blockchain (or mock data if API unavailable)

export const realUTXOFixtures = ${
    JSON.stringify(fixtures, (_key, value) => {
      if (typeof value === "bigint") {
        return value.toString() + "n";
      }
      return value;
    }, 2).replace(/"(\d+)n"/g, "$1n")
  };

// Helper function to get all fixtures as array
export function getAllRealUTXOFixtures() {
  const allFixtures: any[] = [];
  
  Object.values(realUTXOFixtures).forEach((scriptTypeGroup) => {
    Object.values(scriptTypeGroup).forEach((fixture) => {
      allFixtures.push(fixture);
    });
  });
  
  return allFixtures;
}

// Helper function to get fixture by script type
export function getRealUTXOFixtureByScriptType(scriptType: string) {
  const fixtures = realUTXOFixtures[scriptType as keyof typeof realUTXOFixtures];
  if (!fixtures || Object.keys(fixtures).length === 0) {
    return null;
  }
  return Object.values(fixtures)[0];
}
`;

  await Deno.writeTextFile("./tests/fixtures/realUTXOFixtures.ts", fixtureCode);
  console.log("\n🎉 Fixtures written to ./tests/fixtures/realUTXOFixtures.ts");

  // Show summary
  console.log("\n📋 Summary:");
  Object.entries(fixtures).forEach(([scriptType, typeFixtures]) => {
    const count = Object.keys(typeFixtures).length;
    console.log(`  ${scriptType.toUpperCase()}: ${count} fixtures`);
  });
}

// Run the script
if (import.meta.main) {
  await createUTXOFixtures();
}
