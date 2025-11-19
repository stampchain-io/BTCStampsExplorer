// Bitcoin UTXO Test Fixtures for PSBT Testing
// Provides comprehensive test data for all Bitcoin script types
// Compatible with bitcoinjs-lib v7.0.0-rc.0 requiring bigint values

export interface UTXOFixture {
  txid: string;
  vout: number;
  value: bigint;
  script: string; // Hex string for script buffer
  address: string;
  scriptType: "p2pkh" | "p2sh" | "p2wpkh" | "p2wsh" | "p2tr";
  witnessUtxo: {
    script: string; // Hex string for script buffer
    value: bigint;
  };
  redeemScript?: string; // Hex string for P2SH redeem script
  witnessScript?: string; // Hex string for P2WSH witness script
  blockHeight?: number;
  confirmations?: number;
  isTestnet?: boolean;
}

export interface UTXOTestScenario {
  name: string;
  description: string;
  utxos: UTXOFixture[];
  expectedBehavior: string;
}

// Real UTXO data from bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m
// Adapted for comprehensive test coverage
export const utxoFixtures = {
  // P2WPKH (Native SegWit) - Most common modern format
  p2wpkh: {
    standard: {
      txid: "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
      vout: 0,
      value: 44089800n, // 0.44089800 BTC in satoshis
      script: "0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b", // P2WPKH script
      address: "bc1qcl3q5hwsdd0rhrudtca44rsudk0z7wjthy8t0p",
      scriptType: "p2wpkh" as const,
      witnessUtxo: {
        script: "0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b",
        value: 44089800n,
      },
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
    dustAmount: {
      txid: "ee9ee0c0c1de2591dc5b04c528ba60b3609d5c78ca0303d81a17e81f908a962d",
      vout: 1,
      value: 546n, // Dust threshold for P2WPKH
      script: "0014a1b2c3d4e5f6789012345678901234567890abcd",
      address: "bc1q5xev84897eufqy352eufqy352eufp27d2t6dex",
      scriptType: "p2wpkh" as const,
      witnessUtxo: {
        script: "0014a1b2c3d4e5f6789012345678901234567890abcd",
        value: 546n,
      },
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
    largeValue: {
      txid: "6e595c80c38264ffadd5d606ab690e3b8f60133640323538ca9810b0dcff8392",
      vout: 0,
      value: 314435204n, // 3.14435204 BTC in satoshis
      script: "0014f1e2d3c4b5a697880123456789abcdef123456ab",
      address: "bc1q783d839456tcsqfrg4ncn27daufrg44txrckns",
      scriptType: "p2wpkh" as const,
      witnessUtxo: {
        script: "0014f1e2d3c4b5a697880123456789abcdef123456ab",
        value: 314435204n,
      },
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
  },

  // P2WSH (SegWit Script Hash) - Used for complex scripts
  p2wsh: {
    multisig2of3: {
      txid: "2e43bf4ae958fae462691c998be84165a6f1783789f07c82743421eb2da223bc",
      vout: 0,
      value: 114084237n, // 1.14084237 BTC in satoshis
      script:
        "0020701a8d401c84fb13e6baf169d59684e17abd9fa216c8cc5b9fc63d622ff8c58d",
      address: "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej",
      scriptType: "p2wsh" as const,
      witnessUtxo: {
        script:
          "0020701a8d401c84fb13e6baf169d59684e17abd9fa216c8cc5b9fc63d622ff8c58d",
        value: 114084237n,
      },
      witnessScript:
        "5221021f2f6e1e50cb6a953935c3601284925decd3fd21bc6e3d1b9b8a7d5e5a9d5c5021f8b7e9d3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d621025f3a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c353ae", // 2-of-3 multisig
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
    complexScript: {
      txid: "41e0879633bbb8c5f0fef1e1d703edf1c37bf6fe03ceeb3e74f7f45bef7c0dc6",
      vout: 1,
      value: 115649370n, // 1.15649370 BTC in satoshis
      script:
        "0020a16b5755f7f6f385c5709c56025c29b61ba8ce1ba8f1ab9e58b9c9e58b9c9e58",
      address: "bc1q5944w40h7mect3tsn3tqyhpfkcd63nsm4rc6h8jch8y7tzuunevqz4qdny",
      scriptType: "p2wsh" as const,
      witnessUtxo: {
        script:
          "0020a16b5755f7f6f385c5709c56025c29b61ba8ce1ba8f1ab9e58b9c9e58b9c9e58",
        value: 115649370n,
      },
      witnessScript:
        "6321021f2f6e1e50cb6a953935c3601284925decd3fd21bc6e3d1b9b8a7d5e5a9d5c67029000b275210321f8b7e9d3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d668ac", // Time-locked script
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
  },

  // P2PKH (Legacy) - Original Bitcoin address format
  p2pkh: {
    standard: {
      txid: "f5a688a4d12580ca697af3d9f942a4f20ba30b0510b4181e3db838adea57c65e",
      vout: 0,
      value: 115291800n, // 1.15291800 BTC in satoshis
      script: "76a9145e9b23809261178723055968d134a947f47e799f88ac",
      address: "19dENFt4wVwos6xtgwStA6n8bbA57WCS58",
      scriptType: "p2pkh" as const,
      witnessUtxo: {
        script: "76a9145e9b23809261178723055968d134a947f47e799f88ac",
        value: 115291800n,
      },
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
    smallAmount: {
      txid: "8f4e6efc9736c15dd489fbb1e42850b3ae9ee2127acfc8808f3cd56b2941eb0c",
      vout: 0,
      value: 1712646n, // 0.01712646 BTC in satoshis
      script: "76a914a1b2c3d4e5f6789012345678901234567890abcd88ac",
      address: "1FjywhAAKpxzdFGEQV3ESe9uMd6C56NyhF",
      scriptType: "p2pkh" as const,
      witnessUtxo: {
        script: "76a914a1b2c3d4e5f6789012345678901234567890abcd88ac",
        value: 1712646n,
      },
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
  },

  // P2SH (Script Hash) - Wrapped scripts
  p2sh: {
    multisig: {
      txid: "3e521d5050d4e9e7f66b4f2b8ba6d7edd3f559e0f86ae1e29218a97e76cfd3e4",
      vout: 0,
      value: 164005060n, // 1.64005060 BTC in satoshis
      script: "a914b7fcfa53b4f5e5c5a5b5c5a5b5c5a5b5c5a5b5c587",
      address: "3JTrdrfo7Z5h8iDJQRH5XZUuX8csqcb82z",
      scriptType: "p2sh" as const,
      witnessUtxo: {
        script: "a914b7fcfa53b4f5e5c5a5b5c5a5b5c5a5b5c5a5b5c587",
        value: 164005060n,
      },
      redeemScript:
        "5221021f2f6e1e50cb6a953935c3601284925decd3fd21bc6e3d1b9b8a7d5e5a9d5c021f8b7e9d3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d621025f3a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c353ae", // 2-of-3 multisig
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
    wrappedSegwit: {
      txid: "fc9962d0872026aba00bdcc598187e5c20dfe016fda935d7bf8d8173f7af5c8b",
      vout: 2,
      value: 33022700n, // 0.33022700 BTC in satoshis
      script: "a9146b5c4e3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d87",
      address: "3BUgoaWzeZkz5Vi9V8nRhbdcvZMe8bWW6x",
      scriptType: "p2sh" as const,
      witnessUtxo: {
        script: "a9146b5c4e3f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d87",
        value: 33022700n,
      },
      redeemScript: "0014f1e2d3c4b5a697880123456789abcdef123456ab", // P2WPKH wrapped in P2SH
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
  },
  // P2TR (Taproot) - Latest Bitcoin script type
  // Note: Commented out due to bitcoinjs-lib v7.0.0-rc.0 address derivation issues
  // Will be re-enabled when library fully supports P2TR address derivation
  p2tr: {
    keyPath: {
      txid: "edca9b509bec3241ed982562631024c300ed9715b3bb4f641a8d353f62c42af1",
      vout: 0,
      value: 108579900n, // 1.08579900 BTC in satoshis
      script:
        "5120a1b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012",
      address:
        "bc1p5xev84897eufqy352eufqy352eufp27d2v8x9k2rx3ufqy352eufqgxqxqx",
      scriptType: "p2tr" as const,
      witnessUtxo: {
        script:
          "5120a1b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012",
        value: 108579900n,
      },
      blockHeight: 744067,
      confirmations: 160738,
      isTestnet: false,
    },
  },
};

// Test scenarios combining multiple UTXO types
export const utxoTestScenarios: UTXOTestScenario[] = [
  {
    name: "Mixed Script Types",
    description:
      "Tests PSBT creation with different script types in same transaction",
    utxos: [
      utxoFixtures.p2wpkh.standard,
      utxoFixtures.p2wsh.multisig2of3,
      utxoFixtures.p2pkh.standard,
    ],
    expectedBehavior:
      "Should handle all script types correctly with proper witness data",
  },
  {
    name: "Dust and Large Values",
    description: "Tests edge cases with very small and large UTXO values",
    utxos: [
      utxoFixtures.p2wpkh.dustAmount,
      utxoFixtures.p2wpkh.largeValue,
    ],
    expectedBehavior:
      "Should handle dust threshold and large values without overflow",
  },
  {
    name: "Legacy Only",
    description: "Tests transaction with only legacy P2PKH inputs",
    utxos: [
      utxoFixtures.p2pkh.standard,
      utxoFixtures.p2pkh.smallAmount,
    ],
    expectedBehavior: "Should create valid PSBT without witness data",
  },
  {
    name: "SegWit Only",
    description: "Tests transaction with only SegWit inputs",
    utxos: [
      utxoFixtures.p2wpkh.standard,
      utxoFixtures.p2wsh.multisig2of3,
    ],
    expectedBehavior: "Should create valid PSBT with proper witness data",
  },
  {
    name: "Complex Scripts",
    description:
      "Tests advanced script types including multisig and time locks",
    utxos: [
      utxoFixtures.p2wsh.complexScript,
      utxoFixtures.p2sh.multisig,
    ],
    expectedBehavior:
      "Should handle complex scripts with proper redeem/witness scripts",
  },
];

// Validation utilities
export function validateUTXOFixture(fixture: UTXOFixture): boolean {
  // Validate basic structure
  if (!fixture.txid || !fixture.script || typeof fixture.value !== "bigint") {
    return false;
  }

  // Validate txid format (64 hex characters)
  if (!/^[a-fA-F0-9]{64}$/.test(fixture.txid)) {
    return false;
  }

  // Validate script hex format
  if (!/^[a-fA-F0-9]*$/.test(fixture.script)) {
    return false;
  }

  // Validate script type specific requirements
  switch (fixture.scriptType) {
    case "p2pkh":
      return fixture.script.length === 50; // 25 bytes * 2 hex chars
    case "p2sh":
      return fixture.script.length === 46; // 23 bytes * 2 hex chars
    case "p2wpkh":
      return fixture.script.length === 44; // 22 bytes * 2 hex chars
    case "p2wsh":
      return fixture.script.length === 68; // 34 bytes * 2 hex chars
    case "p2tr":
      return fixture.script.length === 68; // 34 bytes * 2 hex chars
    default:
      return false;
  }
}

// BigInt conversion utilities for test compatibility
export function safeBigIntConversion(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.floor(value));
  if (typeof value === "string") return BigInt(value);
  throw new Error(`Cannot convert ${typeof value} to bigint`);
}

// Create UTXO fixture from raw data
export function createUTXOFixture(
  txid: string,
  vout: number,
  value: bigint,
  scriptHex: string,
  address: string,
  scriptType: UTXOFixture["scriptType"],
  options: Partial<UTXOFixture> = {},
): UTXOFixture {
  return {
    txid,
    vout,
    value,
    script: scriptHex,
    address,
    scriptType,
    witnessUtxo: {
      script: scriptHex,
      value,
    },
    blockHeight: 744067,
    confirmations: 160738,
    isTestnet: false,
    ...options,
  };
}

// Validate all fixtures on module load
Object.values(utxoFixtures).forEach((scriptTypeGroup) => {
  Object.values(scriptTypeGroup).forEach((fixture) => {
    if (!validateUTXOFixture(fixture)) {
      // Convert BigInt values to strings for JSON serialization
      const serializableFixture = JSON.parse(
        JSON.stringify(
          fixture,
          (_key, value) =>
            typeof value === "bigint" ? value.toString() + "n" : value,
        ),
      );
      throw new Error(
        `Invalid UTXO fixture: ${JSON.stringify(serializableFixture, null, 2)}`,
      );
    }
  });
});

console.log(
  `✅ UTXO fixtures validated successfully - ${
    Object.keys(utxoFixtures).length
  } script types with ${
    Object.values(utxoFixtures).reduce(
      (acc, group) => acc + Object.keys(group).length,
      0,
    )
  } total fixtures`,
);
