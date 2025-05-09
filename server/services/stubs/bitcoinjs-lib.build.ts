// This is a stub implementation for bitcoinjs-lib used during builds
// The real implementation will be loaded at runtime

export class Psbt {
  static fromHex() {
    console.warn("Psbt.fromHex is not available in build mode");
    return new Psbt();
  }

  validateSignaturesOfAllInputs() {
    console.warn("validateSignaturesOfAllInputs is not available in build mode");
    return true;
  }

  finalizeAllInputs() {
    console.warn("finalizeAllInputs is not available in build mode");
    return this;
  }

  extractTransaction() {
    console.warn("extractTransaction is not available in build mode");
    return { toHex: () => "dummy_transaction_hex" };
  }
}

export const networks = {
  bitcoin: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
  },
  testnet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  }
};

export const payments = {
  p2wpkh: () => ({
    address: "dummy_address",
    output: new Uint8Array(22),
  }),
  p2sh: () => ({
    address: "dummy_address",
    output: new Uint8Array(23),
  }),
};

export const script = {
  compile: () => new Uint8Array(10),
  decompile: () => [],
};

export const crypto = {
  sha256: (buffer) => new Uint8Array(32),
  hash160: (buffer) => new Uint8Array(20),
};

export default {
  Psbt,
  networks,
  payments,
  script,
  crypto
};