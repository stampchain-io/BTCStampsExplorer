/**
 * Mock implementation of bitcoinjs-lib for complete test isolation
 * This allows testing PSBTService without depending on the actual Bitcoin library
 */

import { Buffer } from "node:buffer";

// Mock networks
export const networks = {
  bitcoin: {
    bech32: "bc",
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
  },
  testnet: {
    bech32: "tb",
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  },
};

// Mock address utilities
export const address = {
  fromBase58Check: (addr: string) => {
    // Mock implementation - return plausible data
    if (addr.startsWith("1")) {
      return {
        version: 0x00,
        hash: Buffer.from("deadbeef".repeat(5), "hex").slice(0, 20),
      };
    }
    if (addr.startsWith("3")) {
      return {
        version: 0x05,
        hash: Buffer.from("abcdef".repeat(7), "hex").slice(0, 20),
      };
    }
    throw new Error("Invalid address format");
  },

  fromBech32: (addr: string) => {
    // Mock implementation
    if (addr.startsWith("bc1q")) {
      return {
        version: 0,
        data: Buffer.from("cafebabe".repeat(5), "hex").slice(0, 20),
      };
    }
    if (addr.startsWith("bc1p")) {
      return {
        version: 1,
        data: Buffer.from("deadbeef".repeat(8), "hex").slice(0, 32),
      };
    }
    if (addr.startsWith("bc1")) {
      return {
        version: 0,
        data: Buffer.from("feedface".repeat(8), "hex").slice(0, 32),
      };
    }
    throw new Error("Invalid bech32 address");
  },

  toOutputScript: (addr: string, network: any) => {
    // Mock implementation - enforce network validation
    const isMainnet = network.bech32 === "bc";
    const isTestnet = network.bech32 === "tb";

    // Validate mainnet addresses
    if (isMainnet) {
      if (
        addr.startsWith("tb1") || addr.startsWith("2") ||
        addr.startsWith("m") || addr.startsWith("n")
      ) {
        throw new Error("Invalid address for mainnet");
      }
    }

    // Validate testnet addresses
    if (isTestnet) {
      if (
        addr.startsWith("bc1") || addr.startsWith("1") || addr.startsWith("3")
      ) {
        throw new Error("Invalid address for testnet");
      }
    }

    // Return valid-looking scripts for valid addresses
    if (addr.startsWith("bc1q") || addr.startsWith("tb1q")) {
      // P2WPKH
      return Buffer.from("0014" + "cafebabe".repeat(5), "hex").slice(0, 22);
    }
    if (addr.startsWith("bc1p") || addr.startsWith("tb1p")) {
      // P2TR
      return Buffer.from("5120" + "deadbeef".repeat(8), "hex").slice(0, 34);
    }
    if (addr.startsWith("1") || addr.startsWith("m") || addr.startsWith("n")) {
      // P2PKH
      return Buffer.from("76a914" + "feedface".repeat(5) + "88ac", "hex").slice(
        0,
        25,
      );
    }
    if (addr.startsWith("3") || addr.startsWith("2")) {
      // P2SH
      return Buffer.from("a914" + "beefdead".repeat(5) + "87", "hex").slice(
        0,
        23,
      );
    }
    throw new Error("Invalid address");
  },

  fromOutputScript: (script: Buffer, network: any) => {
    // Mock implementation - return plausible addresses
    const scriptHex = script.toString("hex");

    if (scriptHex.startsWith("0014")) {
      return network.bech32 === "bc"
        ? "bc1qmockaddress123456789"
        : "tb1qmockaddress123456789";
    }
    if (scriptHex.startsWith("5120")) {
      return network.bech32 === "bc"
        ? "bc1pmockaddress123456789012345678901234567890"
        : "tb1pmockaddress123456789012345678901234567890";
    }
    if (scriptHex.startsWith("76a914") && scriptHex.endsWith("88ac")) {
      return network.pubKeyHash === 0x00
        ? "1MockAddress123456789"
        : "mMockAddress123456789";
    }
    if (scriptHex.startsWith("a914") && scriptHex.endsWith("87")) {
      return network.scriptHash === 0x05
        ? "3MockAddress123456789"
        : "2MockAddress123456789";
    }

    throw new Error("Cannot derive address from script");
  },
};

// Mock payments
export const payments = {
  p2wpkh: (options: any) => ({
    output: Buffer.from(
      "0014" + (options.hash?.toString("hex") || "cafebabe".repeat(5)),
      "hex",
    ).slice(0, 22),
    address: options.network?.bech32 === "bc"
      ? "bc1qmockp2wpkh"
      : "tb1qmockp2wpkh",
  }),

  p2pkh: (options: any) => ({
    output: Buffer.from(
      "76a914" + (options.hash?.toString("hex") || "feedface".repeat(5)) +
        "88ac",
      "hex",
    ).slice(0, 25),
    address: options.network?.pubKeyHash === 0x00 ? "1MockP2PKH" : "mMockP2PKH",
  }),

  p2sh: (options: any) => ({
    output: Buffer.from(
      "a914" + (options.hash?.toString("hex") || "beefdead".repeat(5)) + "87",
      "hex",
    ).slice(0, 23),
    address: options.network?.scriptHash === 0x05 ? "3MockP2SH" : "2MockP2SH",
  }),
};

// Mock PSBT class
export class Psbt {
  data: any = {
    inputs: [],
    outputs: [],
  };
  txOutputs: any[] = [];
  private network: any;

  constructor(options: any = {}) {
    this.network = options.network || networks.bitcoin;
  }

  static fromHex(hex: string): Psbt {
    if (!hex.startsWith("70736274ff")) {
      throw new Error("Invalid PSBT hex");
    }

    const psbt = new Psbt();
    // Mock parsing - create dummy data
    psbt.data.inputs = [
      {
        witnessUtxo: {
          value: 100000,
          script: Buffer.from("0014cafebabe".repeat(5), "hex").slice(0, 22),
        },
      },
    ];

    // Decode outputs from hex if present
    if (hex.includes("outputs:")) {
      try {
        const encodedOutputs = hex.split("outputs:")[1];
        const outputData = JSON.parse(atob(encodedOutputs));
        psbt.txOutputs = outputData.map((output: any) => ({
          address: output.address,
          value: BigInt(output.value),
          script: psbt.addressToScript(output.address),
        }));
      } catch {
        // If decoding fails, use empty outputs
        psbt.txOutputs = [];
      }
    } else {
      psbt.txOutputs = [];
    }

    return psbt;
  }

  addInput(input: any): this {
    // Convert hash from hex string if needed
    let hash = input.hash;
    if (typeof hash === "string") {
      hash = Buffer.from(hash, "hex");
    }

    const mockInput: any = {
      hash: hash,
      index: input.index || 0,
      sequence: input.sequence || 0xfffffffd,
    };

    if (input.witnessUtxo) {
      mockInput.witnessUtxo = {
        value: input.witnessUtxo.value,
        script: input.witnessUtxo.script,
      };
    }

    if (input.nonWitnessUtxo) {
      mockInput.nonWitnessUtxo = input.nonWitnessUtxo;
    }

    if (input.redeemScript) {
      mockInput.redeemScript = input.redeemScript;
    }

    if (input.witnessScript) {
      mockInput.witnessScript = input.witnessScript;
    }

    this.data.inputs.push(mockInput);
    return this;
  }

  addOutput(output: any): this {
    console.log("Mock PSBT addOutput called:", {
      address: output.address,
      value: output.value,
      currentOutputCount: this.txOutputs.length,
    });

    let mockOutput: any;

    if (output.address) {
      // Mock address validation
      if (!this.isValidAddress(output.address)) {
        console.log("Mock PSBT addOutput - Invalid address:", output.address);
        throw new Error("Error adding output.");
      }

      mockOutput = {
        address: output.address,
        value: BigInt(output.value),
        script: this.addressToScript(output.address),
      };
    } else if (output.script) {
      mockOutput = {
        script: output.script,
        value: BigInt(output.value),
      };
    } else {
      throw new Error("Output must have address or script");
    }

    this.txOutputs.push(mockOutput);
    console.log(
      "Mock PSBT addOutput - Added output, new count:",
      this.txOutputs.length,
    );
    return this;
  }

  toHex(): string {
    // Return mock PSBT hex that includes our current outputs for round-trip testing
    const outputData = this.txOutputs.map((output) => ({
      address: output.address,
      value: output.value.toString(),
    }));

    // Encode the outputs in the hex string as a simple base64 encoded JSON
    if (outputData.length > 0) {
      const encodedOutputs = btoa(JSON.stringify(outputData));
      return "70736274ff" + "outputs:" + encodedOutputs;
    }
    return "70736274ff" + "0".repeat(100); // PSBT magic + mock data
  }

  private isValidAddress(address: string): boolean {
    try {
      // Very basic validation - just check format
      if (address.startsWith("bc1") || address.startsWith("tb1")) {
        return address.length >= 14 && address.length <= 74;
      }
      if (
        address.startsWith("1") || address.startsWith("3") ||
        address.startsWith("m") || address.startsWith("n") ||
        address.startsWith("2")
      ) {
        return address.length >= 25 && address.length <= 35;
      }
      // For mock addresses, accept any reasonable format
      if (address.includes("mock")) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private addressToScript(addressStr: string): Buffer {
    try {
      return address.toOutputScript(addressStr, this.network);
    } catch {
      // Fallback to mock script
      if (addressStr.startsWith("bc1q") || addressStr.startsWith("tb1q")) {
        return Buffer.from("0014" + "cafebabe".repeat(5), "hex").slice(0, 22);
      }
      return Buffer.from("76a914" + "feedface".repeat(5) + "88ac", "hex").slice(
        0,
        25,
      );
    }
  }
}

// Mock Transaction class
export class Transaction {
  ins: any[] = [];
  outs: any[] = [];
  version: number = 2;
  locktime: number = 0;

  static fromHex(hex: string): Transaction {
    if (hex.length < 10) {
      throw new Error("Invalid transaction hex");
    }

    const tx = new Transaction();
    // Mock parsing - create dummy transaction
    tx.ins = [
      {
        hash: Buffer.from("deadbeef".repeat(16), "hex").slice(0, 32),
        index: 0,
        sequence: 0xfffffffd,
        script: Buffer.alloc(0),
      },
    ];
    tx.outs = [
      {
        value: 100000n,
        script: Buffer.from("0014cafebabe".repeat(5), "hex").slice(0, 22),
      },
    ];

    return tx;
  }

  toHex(): string {
    return "02000000" + "0".repeat(100); // Mock transaction hex
  }
}

// Export all mocked functionality
export default {
  networks,
  address,
  payments,
  Psbt,
  Transaction,
};

// Mock crypto utilities
export const crypto = {
  sha256: (_data: Buffer | Uint8Array) =>
    Buffer.from(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      "hex",
    ), // SHA256 of "test"
  ripemd160: (_data: Buffer | Uint8Array) =>
    Buffer.from("5e52fee47e6b070565f74372468cdc699de89107", "hex"), // RIPEMD160 of "test"
  hash160: (_data: Buffer | Uint8Array) =>
    Buffer.from("5e52fee47e6b070565f74372468cdc699de89107", "hex"), // Hash160 of "test"
  hash256: (_data: Buffer | Uint8Array) =>
    Buffer.from(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      "hex",
    ),
};

// Mock script utilities
export const script = {
  compile: (chunks: Array<Buffer | number>) => {
    // Simple mock - just concatenate buffers and convert numbers to single bytes
    const result: number[] = [];
    for (const chunk of chunks) {
      if (typeof chunk === "number") {
        result.push(chunk);
      } else if (chunk instanceof Buffer || chunk instanceof Uint8Array) {
        result.push(...Array.from(chunk));
      }
    }
    return Buffer.from(result);
  },

  decompile: (script: Buffer | Uint8Array) => {
    // Mock decompilation - return array of opcodes
    const scriptArray = Array.from(script);
    const chunks: Array<Buffer | number> = [];

    for (let i = 0; i < scriptArray.length; i++) {
      const opcode = scriptArray[i];
      if (opcode <= 75) { // Push data opcodes
        const dataLength = opcode;
        if (i + dataLength < scriptArray.length) {
          chunks.push(
            Buffer.from(scriptArray.slice(i + 1, i + 1 + dataLength)),
          );
          i += dataLength;
        }
      } else {
        chunks.push(opcode);
      }
    }

    return chunks;
  },

  // Script operation constants
  OP_0: 0x00,
  OP_1: 0x51,
  OP_DUP: 0x76,
  OP_HASH160: 0xa9,
  OP_EQUALVERIFY: 0x88,
  OP_CHECKSIG: 0xac,
  OP_EQUAL: 0x87,
  OP_RETURN: 0x6a,
  OP_PUSHDATA1: 0x4c,
  OP_PUSHDATA2: 0x4d,
  OP_PUSHDATA4: 0x4e,
};

// Mock for ECPair (private key handling)
export const ECPair = {
  fromWIF: (_wif: string) => ({
    publicKey: Buffer.from("03" + "deadbeef".repeat(8), "hex").slice(0, 33),
    privateKey: Buffer.from("cafebabe".repeat(8), "hex").slice(0, 32),
  }),
  makeRandom: () => ({
    publicKey: Buffer.from("03" + "feedface".repeat(8), "hex").slice(0, 33),
    privateKey: Buffer.from("beefdead".repeat(8), "hex").slice(0, 32),
  }),
};

// Mock for opcodes
export const opcodes = {
  OP_0: 0x00,
  OP_FALSE: 0x00,
  OP_1NEGATE: 0x4f,
  OP_1: 0x51,
  OP_TRUE: 0x51,
  OP_2: 0x52,
  OP_3: 0x53,
  OP_4: 0x54,
  OP_5: 0x55,
  OP_6: 0x56,
  OP_7: 0x57,
  OP_8: 0x58,
  OP_9: 0x59,
  OP_10: 0x5a,
  OP_11: 0x5b,
  OP_12: 0x5c,
  OP_13: 0x5d,
  OP_14: 0x5e,
  OP_15: 0x5f,
  OP_16: 0x60,

  OP_DUP: 0x76,
  OP_HASH160: 0xa9,
  OP_EQUALVERIFY: 0x88,
  OP_CHECKSIG: 0xac,
  OP_EQUAL: 0x87,
  OP_RETURN: 0x6a,
  OP_PUSHDATA1: 0x4c,
  OP_PUSHDATA2: 0x4d,
  OP_PUSHDATA4: 0x4e,
};

// Helper function to inject this mock
export function mockBitcoinJSLib() {
  // This would be used in test setup to replace the real bitcoinjs-lib
  return {
    networks,
    address,
    payments,
    Psbt,
    Transaction,
    crypto,
    script,
    ECPair,
    opcodes,
  };
}
