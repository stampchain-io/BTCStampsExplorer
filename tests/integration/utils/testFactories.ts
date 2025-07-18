// Test factories for creating mock data in integration tests
// Compatible with bitcoinjs-lib v7.0.0-rc.0 requiring bigint values

export interface MockUTXOOptions {
  txid?: string;
  vout?: number;
  value?: bigint;
  script?: string;
  address?: string;
  scriptType?: "p2pkh" | "p2sh" | "p2wpkh" | "p2wsh" | "p2tr";
  blockHeight?: number;
  confirmations?: number;
  isTestnet?: boolean;
}

export function createMockUTXO(options: MockUTXOOptions = {}) {
  const defaults = {
    txid: "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
    vout: 0,
    value: 44089800n, // 0.44089800 BTC in satoshis
    script: "0014c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b", // P2WPKH script
    address: "bc1qcl3q5hwsdd0rhrudtca44rsudk0z7wjthy8t0p",
    scriptType: "p2wpkh" as const,
    blockHeight: 744067,
    confirmations: 160738,
    isTestnet: false,
  };

  const utxo = { ...defaults, ...options };

  return {
    ...utxo,
    witnessUtxo: {
      script: utxo.script,
      value: utxo.value,
    },
  };
}

// Additional factory functions for common test scenarios
export function createMockUTXOSet(
  count: number = 3,
  baseValue: bigint = 1000000n,
) {
  return Array.from({ length: count }, (_, i) =>
    createMockUTXO({
      txid: `mock_txid_${i}_${Date.now()}`,
      vout: i,
      value: baseValue + BigInt(i * 100000),
      address: `bc1qmock_address_${i}`,
    }));
}

export function createMockDustUTXO() {
  return createMockUTXO({
    value: 546n, // Standard dust limit
    address: "bc1qmock_dust_address",
  });
}

export function createMockLargeUTXO() {
  return createMockUTXO({
    value: 100000000n, // 1 BTC
    address: "bc1qmock_large_address",
  });
}
