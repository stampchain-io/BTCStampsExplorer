/**
 * Mempool.space API response fixtures for testing
 * Based on real API responses from mempool.space
 */

export const mempoolApiFixtures: Record<string, unknown> = {
  // P2WPKH transaction
  "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b": {
    txid: "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
    version: 2,
    locktime: 0,
    vin: [
      {
        txid: "previousTxId",
        vout: 0,
        prevout: {
          scriptpubkey: "001412345678901234567890123456789012345678",
          scriptpubkey_asm:
            "OP_0 OP_PUSHBYTES_20 12345678901234567890123456789012345678",
          scriptpubkey_type: "v0_p2wpkh",
          scriptpubkey_address: "bc1qprevious",
          value: 50000000,
        },
        scriptsig: "",
        scriptsig_asm: "",
        witness: [
          "304402207c8e5a9f0b2d4e3a1b9876543210fedcba9876543210fedcba9876543210fedc02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01",
          "02abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        ],
        is_coinbase: false,
        sequence: 4294967295,
      },
    ],
    vout: [
      {
        scriptpubkey: "0014c8e5f38f19fc54ffb6fe03043057dd2e89b2b623",
        scriptpubkey_asm:
          "OP_0 OP_PUSHBYTES_20 c8e5f38f19fc54ffb6fe03043057dd2e89b2b623",
        scriptpubkey_type: "v0_p2wpkh",
        scriptpubkey_address: "bc1qerjl8rcel320ldh7qvzrq47a96ym9d3rhtwv6v",
        value: 44089800,
      },
      {
        scriptpubkey: "0014change",
        scriptpubkey_asm: "OP_0 OP_PUSHBYTES_20 change",
        scriptpubkey_type: "v0_p2wpkh",
        scriptpubkey_address: "bc1qchange",
        value: 5000000,
      },
    ],
    size: 225,
    weight: 573,
    fee: 910200,
    status: {
      confirmed: true,
      block_height: 744067,
      block_hash:
        "00000000000000000003f6a19e78af86a54e570d34fefc9758289d0966f5587e",
      block_time: 1657243337,
    },
  },

  // P2WSH transaction
  "e15a48d0ee7690e7fce6e38a31f4f7558b93b32e22c4de6c5c12c73f1e4e8f2f": {
    txid: "e15a48d0ee7690e7fce6e38a31f4f7558b93b32e22c4de6c5c12c73f1e4e8f2f",
    version: 2,
    locktime: 0,
    vin: [
      {
        txid: "previousTxId2",
        vout: 0,
        prevout: {
          scriptpubkey:
            "0020abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          scriptpubkey_asm:
            "OP_0 OP_PUSHBYTES_32 abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          scriptpubkey_type: "v0_p2wsh",
          scriptpubkey_address: "bc1qp2wsh",
          value: 100000000,
        },
        scriptsig: "",
        scriptsig_asm: "",
        witness: [
          "",
          "304402207c8e5a9f0b2d4e3a1b9876543210fedcba9876543210fedcba9876543210fedc02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01",
          "304402207c8e5a9f0b2d4e3a1b9876543210fedcba9876543210fedcba9876543210fedc02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01",
          "522102abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab21031234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1252ae",
        ],
        is_coinbase: false,
        sequence: 4294967295,
      },
    ],
    vout: [
      {
        scriptpubkey:
          "0020bd9b3a3dc6056392a498146692050e1719a5d70dfa8892d0f6c2cf0b4e6c9e5f",
        scriptpubkey_asm:
          "OP_0 OP_PUSHBYTES_32 bd9b3a3dc6056392a498146692050e1719a5d70dfa8892d0f6c2cf0b4e6c9e5f",
        scriptpubkey_type: "v0_p2wsh",
        scriptpubkey_address:
          "bc1qhkdn50wxq43e9fyczesnyqg7zuv6t4cdl2yf95rds7wtu6dec0szq3plc",
        value: 85000000,
      },
    ],
    size: 373,
    weight: 820,
    fee: 15000000,
    status: {
      confirmed: true,
      block_height: 744068,
      block_hash:
        "00000000000000000003f6a19e78af86a54e570d34fefc9758289d0966f5587f",
      block_time: 1657243400,
    },
  },

  // P2PKH transaction
  "8b0e3f3e13ac16d52bbf9c5e6b7e9ad57f1e4d8c2a5f9c7e6b3a8d4c2e1f0a7b": {
    txid: "8b0e3f3e13ac16d52bbf9c5e6b7e9ad57f1e4d8c2a5f9c7e6b3a8d4c2e1f0a7b",
    version: 2,
    locktime: 0,
    vin: [
      {
        txid: "previousTxId3",
        vout: 0,
        prevout: {
          scriptpubkey: "76a9141234567890abcdef1234567890abcdef1234567888ac",
          scriptpubkey_asm:
            "OP_DUP OP_HASH160 OP_PUSHBYTES_20 1234567890abcdef1234567890abcdef12345678 OP_EQUALVERIFY OP_CHECKSIG",
          scriptpubkey_type: "p2pkh",
          scriptpubkey_address: "12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX",
          value: 30000000,
        },
        scriptsig:
          "483045022100abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890022012345678901234567890123456789012345678901234567890123456789012340121031234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
        scriptsig_asm:
          "OP_PUSHBYTES_72 3045022100abcdef... OP_PUSHBYTES_33 031234567890abcdef...",
        witness: [],
        is_coinbase: false,
        sequence: 4294967295,
      },
    ],
    vout: [
      {
        scriptpubkey: "76a914bf87e3a886115f20cf643b3cb0fdb7fd47a3751a88ac",
        scriptpubkey_asm:
          "OP_DUP OP_HASH160 OP_PUSHBYTES_20 bf87e3a886115f20cf643b3cb0fdb7fd47a3751a OP_EQUALVERIFY OP_CHECKSIG",
        scriptpubkey_type: "p2pkh",
        scriptpubkey_address: "1JTud7z3TBmFBMVqcJdJAF4n7YLcUNjbVj",
        value: 25000000,
      },
    ],
    size: 225,
    weight: 900,
    fee: 5000000,
    status: {
      confirmed: true,
      block_height: 744069,
      block_hash:
        "00000000000000000003f6a19e78af86a54e570d34fefc9758289d0966f5587g",
      block_time: 1657243500,
    },
  },

  // P2SH transaction
  "9f3d2c1a8e7b6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e": {
    txid: "9f3d2c1a8e7b6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e",
    version: 2,
    locktime: 0,
    vin: [
      {
        txid: "previousTxId4",
        vout: 0,
        prevout: {
          scriptpubkey: "a914abcdef1234567890abcdef1234567890abcdef1287",
          scriptpubkey_asm:
            "OP_HASH160 OP_PUSHBYTES_20 abcdef1234567890abcdef1234567890abcdef12 OP_EQUAL",
          scriptpubkey_type: "p2sh",
          scriptpubkey_address: "3P2SH",
          value: 60000000,
        },
        scriptsig:
          "00483045022100abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890022012345678901234567890123456789012345678901234567890123456789012340147512102abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab51ae",
        scriptsig_asm:
          "OP_0 OP_PUSHBYTES_72 3045022100abcdef... OP_PUSHBYTES_71 512102abcdef...",
        witness: [],
        is_coinbase: false,
        sequence: 4294967295,
      },
    ],
    vout: [
      {
        scriptpubkey: "a914d5e2f9c7e6b5a4d3c2b1a0f9e8d7c6b5a4f3e2d187",
        scriptpubkey_asm:
          "OP_HASH160 OP_PUSHBYTES_20 d5e2f9c7e6b5a4d3c2b1a0f9e8d7c6b5a4f3e2d1 OP_EQUAL",
        scriptpubkey_type: "p2sh",
        scriptpubkey_address: "3MDyKwgXQy9nUa8VnKh7gmKc9XWCJ6NUfL",
        value: 50000000,
      },
    ],
    size: 250,
    weight: 1000,
    fee: 10000000,
    status: {
      confirmed: true,
      block_height: 744070,
      block_hash:
        "00000000000000000003f6a19e78af86a54e570d34fefc9758289d0966f5587h",
      block_time: 1657243600,
    },
  },

  // P2TR (Taproot) transaction
  "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b": {
    txid: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    version: 2,
    locktime: 0,
    vin: [
      {
        txid: "previousTxId5",
        vout: 0,
        prevout: {
          scriptpubkey:
            "51201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          scriptpubkey_asm:
            "OP_1 OP_PUSHBYTES_32 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          scriptpubkey_type: "v1_p2tr",
          scriptpubkey_address:
            "bc1p1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          value: 75000000,
        },
        scriptsig: "",
        scriptsig_asm: "",
        witness: [
          "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        ],
        is_coinbase: false,
        sequence: 4294967295,
      },
    ],
    vout: [
      {
        scriptpubkey:
          "5120e3a4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
        scriptpubkey_asm:
          "OP_1 OP_PUSHBYTES_32 e3a4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
        scriptpubkey_type: "v1_p2tr",
        scriptpubkey_address:
          "bc1puw90tdnymr5lpgdjc02wtm486jxapg0j5w6vt4h80uy2dsx89glq6dx8n6",
        value: 65000000,
      },
    ],
    size: 234,
    weight: 573,
    fee: 10000000,
    status: {
      confirmed: true,
      block_height: 744071,
      block_hash:
        "00000000000000000003f6a19e78af86a54e570d34fefc9758289d0966f5587i",
      block_time: 1657243700,
    },
  },
};

// Helper to get transaction by ID
export function getMempoolTransaction(txid: string) {
  return mempoolApiFixtures[txid] || null;
}

// Mock the mempool API endpoints
export function mockMempoolApiEndpoints() {
  const responses = new Map();

  // Add all transactions
  Object.entries(mempoolApiFixtures).forEach(([txid, data]) => {
    responses.set(`https://mempool.space/api/tx/${txid}`, {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });
  });

  return responses;
}
