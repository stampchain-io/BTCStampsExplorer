/**
 * UTXO fixtures from real blockchain data for mint endpoint testing
 * Address: bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d
 * Data fetched from BlockCypher API on 2025-07-13
 */

export const mintAddressUTXOs = {
  address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
  total_balance: 538438, // Total of all UTXOs
  utxos: [
    {
      txid: "5510115246d9cf844b90e6c87f10c1453909c5e85dded47c803f9c2208cccfe3",
      vout: 1,
      value: 65223,
      script: "001498602ecf29565a5219609b584313ca5b773b435b",
      scriptType: "p2wpkh",
      address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
      confirmations: 2669,
      height: 907803, // Approximate based on confirmations
    },
    {
      txid: "5507b03c79142d563d0709a88a93fffce3b09cbada0c410e6c1720239be41f03",
      vout: 1,
      value: 107626,
      script: "001498602ecf29565a5219609b584313ca5b773b435b",
      scriptType: "p2wpkh",
      address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
      confirmations: 7051,
      height: 903421, // Approximate based on confirmations
    },
    {
      txid: "af54181d0455cf086dceece4eeb92e9601d4e13277bfb70a752d07933ada418a",
      vout: 1,
      value: 365589,
      script: "001498602ecf29565a5219609b584313ca5b773b435b",
      scriptType: "p2wpkh",
      address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d",
      confirmations: 7093,
      height: 903379, // Approximate based on confirmations
    },
  ],
};

/**
 * Test scenarios for mint endpoint
 */
export const mintTestScenarios = {
  // Scenario: Minting a 31KB image with 1.1 sat/vb fee rate
  largeImageMint: {
    imageSize: 31 * 1024, // 31KB
    feeRate: 1.1, // sat/vb
    expectedTransactionSize: 32000, // Approximate tx size with 31KB OP_RETURN
    requiredAmount: 35200, // Approximate fee needed (32000 * 1.1)
  },

  // Scenario: Small stamp mint
  smallStampMint: {
    imageSize: 1024, // 1KB
    feeRate: 1.1, // sat/vb
    expectedTransactionSize: 1300, // Approximate tx size
    requiredAmount: 1430, // Approximate fee needed (1300 * 1.1)
  },

  // Scenario: High fee environment
  highFeeMint: {
    imageSize: 5 * 1024, // 5KB
    feeRate: 50, // sat/vb (high fee scenario)
    expectedTransactionSize: 5300, // Approximate tx size
    requiredAmount: 265000, // Approximate fee needed (5300 * 50)
  },
};

/**
 * Expected UTXO selection results for different scenarios
 */
export const expectedSelections = {
  // For 31KB image at 1.1 sat/vb
  largeImageMint: {
    selectedUTXOs: [
      // Should select the smallest UTXO that covers the fee
      mintAddressUTXOs.utxos[0], // 65223 sats
    ],
    totalValue: 65223,
    estimatedFee: 35200,
    changeAmount: 30023,
  },

  // For small stamp
  smallStampMint: {
    selectedUTXOs: [
      // Should select the smallest UTXO
      mintAddressUTXOs.utxos[0], // 65223 sats
    ],
    totalValue: 65223,
    estimatedFee: 1430,
    changeAmount: 63793,
  },

  // For high fee scenario
  highFeeMint: {
    selectedUTXOs: [
      // Should select the largest UTXO to minimize inputs
      mintAddressUTXOs.utxos[2], // 365589 sats
    ],
    totalValue: 365589,
    estimatedFee: 265000,
    changeAmount: 100589,
  },
};
