// Increase maximum string length for console output
// console.log = console.log.bind(console, null, { maxStringLength: Infinity });

interface TransactionParams {
  fromAddress: string;
  destinations: string[];
  assetId: string;
  feeRate: number; // sats/vByte
}

function isValidBitcoinAddress(address: string): boolean {
  const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const segwitRegex = /^bc1q[a-z0-9]{38,89}$/; // SegWit addresses start with 'bc1q'
  const taprootRegex = /^bc1p[a-z0-9]{58}$/; // Taproot addresses start with 'bc1p'
  // Exclude Taproot addresses by ensuring they do not match
  return (legacyRegex.test(address) || segwitRegex.test(address)) &&
    !taprootRegex.test(address);
}

// Add sleep helper function at the top of the file after imports
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createEggTransaction() {
  try {
    const fileContent = await Deno.readTextFile("scripts/leather.txt");
    const lines = fileContent.split("\n");
    const validDestinations = new Set<string>();
    const invalidAddresses: string[] = [];
    const addressCount: Record<string, number> = {};

    lines.forEach((line) => {
      const address = line.trim();
      if (address.length > 0) {
        if (isValidBitcoinAddress(address)) {
          validDestinations.add(address);
          addressCount[address] = (addressCount[address] || 0) + 1;
        } else {
          invalidAddresses.push(address);
        }
      }
    });

    const duplicates = Object.entries(addressCount)
      .filter(([_, count]) => count > 1)
      .map(([address]) => address);

    console.log(`Total lines read from file: ${lines.length}`);
    console.log(`Valid destinations found: ${validDestinations.size}`);
    console.log(`Duplicate addresses:`, duplicates);
    console.log(`Invalid addresses:`, invalidAddresses);

    const feeRate = 5.5; // sats/vByte
    const allDestinations = Array.from(validDestinations);
    const CHUNK_SIZE = 1000;
    const DELAY_BETWEEN_CALLS = 5000; // 5 seconds delay between calls
    const totalChunks = Math.ceil(allDestinations.length / CHUNK_SIZE);

    console.log(
      `Processing ${allDestinations.length} addresses in ${totalChunks} chunks of ${CHUNK_SIZE}`,
    );

    for (let i = 0; i < totalChunks; i++) {
      const startIdx = i * CHUNK_SIZE;
      const endIdx = Math.min((i + 1) * CHUNK_SIZE, allDestinations.length);
      const chunkDestinations = allDestinations.slice(startIdx, endIdx);

      const params: TransactionParams = {
        fromAddress: "bc1qk40nt5ufm8nkm3ksrn83rg97ehpuucydclxxf4",
        destinations: chunkDestinations,
        assetId: "A1240021305257350630",
        feeRate: feeRate,
      };

      console.log(`\nProcessing chunk ${i + 1}/${totalChunks}`);
      console.log(`Addresses in this chunk: ${chunkDestinations.length}`);

      // Print all addresses in this chunk
      console.log("\nAddresses in this chunk:");
      chunkDestinations.forEach((address, index) => {
        console.log(`${index + 1}. ${address}`);
      });
      console.log(); // Empty line for better readability

      // Create an array of quantities, each set to 1, matching the number of destinations in this chunk
      const quantities = new Array(chunkDestinations.length).fill(1);

      // Create a transaction for this chunk
      const result = await createSendTransaction(
        params.fromAddress,
        params.destinations,
        params.assetId,
        quantities,
      );

      console.log(`Completed chunk ${i + 1}/${totalChunks}`);
      // console.log(`Transaction result for chunk ${i + 1}:`, result);

      // Add delay before next chunk unless it's the last chunk
      if (i < totalChunks - 1) {
        console.log(
          `Waiting ${
            DELAY_BETWEEN_CALLS / 1000
          } seconds before processing next chunk...`,
        );
        await sleep(DELAY_BETWEEN_CALLS);
      }
    }

    console.log(
      `\nAll chunks processed. Total transactions created: ${totalChunks}`,
    );
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
}

async function createSendTransaction(
  source: string,
  destinations: string[],
  asset: string,
  quantities: number[],
): Promise<any> {
  const integerQuantities = quantities.map((quantity) => Math.floor(quantity));
  const API_ENDPOINT = "http://192.168.17.222:4000/api/";

  // Construct the request body with arrays for destination, asset, and quantity
  const requestBody = {
    jsonrpc: "2.0",
    method: "create_send",
    params: {
      source,
      destination: destinations,
      asset: Array(destinations.length).fill(asset), // Repeat the asset for each destination
      quantity: integerQuantities,
      memo_is_hex: false, // Set to true if the memo is in hex format
      use_enhanced_send: false, // Set to true if enhanced send is required
      skip_validation: false, // Set to true to skip validation checks
      encoding: "opreturn",
      allow_unconfirmed_inputs: true,
    },
    id: 1, // Unique ID for the request
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // Also log the request body for debugging
    console.log("\nRequest body sent:");
    // console.log(JSON.stringify(requestBody, null, 2));

    // Log full response
    console.log("\nFull API Response:");
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("Error creating send transaction:");
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }
}

if (import.meta.main) {
  createEggTransaction().catch(console.error);
}
