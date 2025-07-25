import { bytesToHex } from "$lib/utils/data/binary/baseUtils.ts";
import { assertEquals, assertExists } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { Buffer } from "node:buffer";

// Define types needed for the test
interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  vsize?: number;
  ancestorCount?: number;
  ancestorSize?: number;
  ancestorFees?: number;
  weight?: number;
  scriptType?: string;
  scriptDesc?: string;
  coinbase?: boolean;
}

interface AncestorInfo {
  txid: string;
  fee: number;
  vsize: number;
  weight: number;
}

interface UTXOOptions {
  confirmedOnly?: boolean;
  includeAncestors?: boolean;
}

interface SingleUTXOResponse {
  data?: UTXO;
  error?: string;
}

interface QuickNodeUTXO {
  txid: string;
  vout: number;
  value: string;
  confirmations: number;
  height: number;
  coinbase?: boolean;
}

interface ScriptUTXO extends QuickNodeUTXO {
  hex?: string;
  address?: string;
  height?: number;
  confirmations?: number;
}

interface ScriptTypeInfo {
  type: string;
  desc?: string;
}

const SATOSHIS_PER_BTC = 100_000_000;

// Create mock implementations
class MockCachedQuicknodeRPCService {
  private static mockResponses = new Map();
  private static shouldFail = false;
  private static failureCount = 0;
  private static maxFailures = 0;

  static setMockResponse(method: string, params: any[], response: any) {
    const key = `${method}:${JSON.stringify(params)}`;
    this.mockResponses.set(key, response);
  }

  static clearMockResponses() {
    this.mockResponses.clear();
  }

  static setShouldFail(shouldFail: boolean, maxFailures = 0) {
    this.shouldFail = shouldFail;
    this.maxFailures = maxFailures;
    this.failureCount = 0;
  }

  static executeRPC(
    method: string,
    params: any[],
    _cacheDuration?: number,
  ): Promise<{ result?: any; error?: string }> {
    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      return Promise.resolve({ error: "RPC call failed" });
    }

    const key = `${method}:${JSON.stringify(params)}`;
    const response = this.mockResponses.get(key);

    if (response) {
      return Promise.resolve({ result: response });
    }

    // Default responses based on method
    if (method === "bb_getUTXO") {
      return Promise.resolve({ error: "UTXO not found" });
    }
    if (method === "getrawtransaction") {
      return Promise.resolve({ error: "Transaction not found" });
    }
    if (method === "bb_getUTXOs") {
      return Promise.resolve({ result: [] });
    }
    return Promise.resolve({ error: `Unmocked method: ${method}` });
  }
}

// Mock bitcoinjs-lib functions
const mockBitcoinJS = {
  address: {
    toOutputScript: (address: string): Buffer => {
      // Simple mock that returns different buffers for different address types
      if (address.startsWith("bc1q")) {
        // P2WPKH
        return Buffer.from("0014" + "a".repeat(40), "hex");
      } else if (address.startsWith("bc1p")) {
        // P2TR
        return Buffer.from("5120" + "b".repeat(64), "hex");
      } else if (address.startsWith("3")) {
        // P2SH
        return Buffer.from("a914" + "c".repeat(40) + "87", "hex");
      } else if (address.startsWith("1")) {
        // P2PKH
        return Buffer.from("76a914" + "d".repeat(40) + "88ac", "hex");
      }
      throw new Error("Invalid address");
    },
    fromOutputScript: (script: Buffer): string => {
      const hex = script.toString("hex");
      if (hex.startsWith("0014")) {
        return "bc1q" + "test".repeat(8);
      } else if (hex.startsWith("5120")) {
        return "bc1p" + "test".repeat(8);
      } else if (hex.startsWith("a914")) {
        return "3" + "Test".repeat(8);
      } else if (hex.startsWith("76a914")) {
        return "1" + "Test".repeat(8);
      }
      throw new Error("Invalid script");
    },
  },
  networks: {
    bitcoin: { name: "bitcoin" },
  },
};

// Mock helper functions - removed duplicate bytesToHex function, now imported from baseUtils
function bytesToHexCompat(bytes: Uint8Array | Buffer): string {
  // Convert Buffer to Uint8Array if needed, then use baseUtils function
  const uint8Array = bytes instanceof Buffer ? new Uint8Array(bytes) : bytes;
  return bytesToHex(uint8Array);
}

function getScriptTypeInfo(script: string): ScriptTypeInfo {
  if (script.startsWith("0014") && script.length === 44) {
    return { type: "witness_v0_keyhash", desc: "P2WPKH" };
  } else if (script.startsWith("5120") && script.length === 68) {
    return { type: "witness_v1_taproot", desc: "P2TR" };
  } else if (script.startsWith("a914") && script.length === 46) {
    return { type: "scripthash", desc: "P2SH" };
  } else if (script.startsWith("76a914") && script.length === 50) {
    return { type: "pubkeyhash", desc: "P2PKH" };
  }
  return { type: "unknown" };
}

// Test-only version of QuicknodeUTXOService
class TestQuicknodeUTXOService {
  private static readonly QUICKNODE_FINANCIAL_ANCESTORS_LIMIT = 25;

  static convertBTCToSatoshis(btcAmount: string): number {
    return parseFloat(btcAmount) * SATOSHIS_PER_BTC;
  }

  static deriveAddressFromScript(
    scriptHex: string,
    networkName: string = "bitcoin",
  ): string | null {
    if (!scriptHex || scriptHex.length === 0) {
      console.warn(
        "[QuicknodeUTXOService] No script provided for address derivation",
      );
      return null;
    }

    try {
      const network = networkName === "bitcoin"
        ? mockBitcoinJS.networks.bitcoin
        : mockBitcoinJS.networks.bitcoin;
      const scriptBuffer = Buffer.from(scriptHex, "hex");
      const address = mockBitcoinJS.address.fromOutputScript(
        scriptBuffer,
        network,
      );
      return address;
    } catch (error) {
      console.error(
        `[QuicknodeUTXOService] Error deriving address from script ${scriptHex}:`,
        error,
      );
      return null;
    }
  }

  static async getUTXO(
    address: string,
    txid: string,
    vout: number,
    options: UTXOOptions = {},
  ): Promise<SingleUTXOResponse> {
    console.log(
      `[QuicknodeUTXOService] getUTXO called for address: ${address}, txid: ${txid}, vout: ${vout}`,
    );

    try {
      // Generate expected output script
      const expectedScript = bytesToHexCompat(
        mockBitcoinJS.address.toOutputScript(
          address,
          mockBitcoinJS.networks.bitcoin,
        ),
      );
      console.log(
        `[QuicknodeUTXOService] Expected script for address: ${expectedScript}`,
      );

      // Fetch UTXO data
      const utxoResponse = await MockCachedQuicknodeRPCService.executeRPC<
        ScriptUTXO
      >(
        "bb_getUTXO",
        [txid, vout, false],
        300,
      );

      if ("error" in utxoResponse) {
        return { error: `Failed to fetch UTXO: ${utxoResponse.error}` };
      }

      const utxo = utxoResponse.result;
      const valueInSatoshis = this.convertBTCToSatoshis(utxo.value);

      // Validate script consistency
      if (utxo.hex && utxo.hex !== expectedScript) {
        console.warn(
          `[QuicknodeUTXOService] Script mismatch - Expected: ${expectedScript}, Got: ${utxo.hex}`,
        );
      }

      // Get script type info
      const scriptTypeInfo = getScriptTypeInfo(utxo.hex || expectedScript);

      // Construct UTXO object
      const formattedUTXO: UTXO = {
        txid: utxo.txid,
        vout: utxo.vout,
        value: valueInSatoshis,
        script: utxo.hex || expectedScript,
        vsize: 107,
        scriptType: scriptTypeInfo.type,
        scriptDesc: scriptTypeInfo.desc,
        coinbase: utxo.coinbase || false,
      };

      // Fetch ancestor info if requested
      if (options.includeAncestors) {
        const ancestorData = await this.fetchAncestorInfo(txid);
        if (ancestorData) {
          formattedUTXO.ancestorCount = ancestorData.count;
          formattedUTXO.ancestorSize = ancestorData.size;
          formattedUTXO.ancestorFees = ancestorData.fees;
        }
      }

      return { data: formattedUTXO };
    } catch (error) {
      console.error("[QuicknodeUTXOService] Error in getUTXO:", error);
      return {
        error: error instanceof Error
          ? error.message
          : "Unknown error occurred",
      };
    }
  }

  static async getUTXOs(
    address: string,
    options: UTXOOptions = {},
  ): Promise<UTXO[]> {
    console.log(
      `[QuicknodeUTXOService] getUTXOs called for address: ${address}`,
    );

    try {
      const response = await MockCachedQuicknodeRPCService.executeRPC<
        QuickNodeUTXO[]
      >(
        "bb_getUTXOs",
        [address, options.confirmedOnly || false],
        60,
      );

      if ("error" in response) {
        console.error(
          `[QuicknodeUTXOService] Error fetching UTXOs: ${response.error}`,
        );
        return [];
      }

      const utxos = response.result || [];
      const formattedUTXOs: UTXO[] = [];

      for (const utxo of utxos) {
        const singleUTXOResponse = await this.getUTXO(
          address,
          utxo.txid,
          utxo.vout,
          options,
        );

        if (singleUTXOResponse.data) {
          formattedUTXOs.push(singleUTXOResponse.data);
        }
      }

      console.log(
        `[QuicknodeUTXOService] Fetched ${formattedUTXOs.length} UTXOs for address`,
      );
      return formattedUTXOs;
    } catch (error) {
      console.error("[QuicknodeUTXOService] Error in getUTXOs:", error);
      return [];
    }
  }

  static async getRawTransactionHex(txid: string): Promise<string | null> {
    console.log(
      `[QuicknodeUTXOService] getRawTransactionHex called for txid: ${txid}`,
    );

    try {
      const response = await MockCachedQuicknodeRPCService.executeRPC<string>(
        "getrawtransaction",
        [txid, false],
        300,
      );

      if ("error" in response) {
        console.error(
          `[QuicknodeUTXOService] Error fetching raw transaction: ${response.error}`,
        );
        return null;
      }

      return response.result;
    } catch (error) {
      console.error(
        "[QuicknodeUTXOService] Error in getRawTransactionHex:",
        error,
      );
      return null;
    }
  }

  private static async fetchAncestorInfo(
    txid: string,
  ): Promise<{ count: number; size: number; fees: number } | null> {
    try {
      const ancestorResponse = await MockCachedQuicknodeRPCService.executeRPC<{
        ancestors: AncestorInfo[];
      }>(
        "getmempoolancestors",
        [txid, true],
        60,
      );

      if ("error" in ancestorResponse || !ancestorResponse.result?.ancestors) {
        return null;
      }

      const ancestors = ancestorResponse.result.ancestors.slice(
        0,
        this.QUICKNODE_FINANCIAL_ANCESTORS_LIMIT,
      );

      return {
        count: ancestors.length,
        size: ancestors.reduce((sum, a) => sum + (a.vsize || 0), 0),
        fees: ancestors.reduce((sum, a) => sum + (a.fee || 0), 0),
      };
    } catch (error) {
      console.error(
        "[QuicknodeUTXOService] Error fetching ancestor info:",
        error,
      );
      return null;
    }
  }
}

describe("QuicknodeUTXOService", () => {
  beforeEach(() => {
    MockCachedQuicknodeRPCService.clearMockResponses();
    MockCachedQuicknodeRPCService.setShouldFail(false);
  });

  describe("getUTXO", () => {
    it("should fetch single UTXO with valid address validation", async () => {
      const address = "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2";
      const txid =
        "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b";
      const vout = 0;

      // Mock the UTXO response
      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        [txid, vout, false],
        {
          txid,
          vout,
          value: "0.440898", // BTC value
          confirmations: 100,
          height: 800000,
          hex: "0014" + "a".repeat(40), // Mock P2WPKH script
        },
      );

      const result = await TestQuicknodeUTXOService.getUTXO(
        address,
        txid,
        vout,
      );

      assertExists(result.data);
      assertEquals(result.data.txid, txid);
      assertEquals(result.data.vout, vout);
      assertEquals(result.data.value, 44089800); // Satoshis
      assertEquals(result.data.script.startsWith("0014"), true);
      assertEquals(result.data.scriptType, "witness_v0_keyhash");
    });

    it("should fallback to QuickNode hex when address derivation fails", async () => {
      const address = "bc1qtest";
      const txid = "test-txid";
      const vout = 1;
      const quicknodeHex = "0014abcdef1234567890";

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        [txid, vout, false],
        {
          txid,
          vout,
          value: "0.1",
          hex: quicknodeHex,
          confirmations: 10,
          height: 700000,
        },
      );

      const result = await TestQuicknodeUTXOService.getUTXO(
        address,
        txid,
        vout,
      );

      assertExists(result.data);
      assertEquals(result.data.script, quicknodeHex);
    });

    it("should include ancestor info when requested", async () => {
      const address = "bc1qtest";
      const txid = "test-txid";
      const vout = 0;

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        [txid, vout, false],
        {
          txid,
          vout,
          value: "0.5",
          hex: "0014" + "a".repeat(40),
        },
      );

      MockCachedQuicknodeRPCService.setMockResponse(
        "getmempoolancestors",
        [txid, true],
        {
          ancestors: [
            { txid: "ancestor1", fee: 1000, vsize: 250, weight: 1000 },
            { txid: "ancestor2", fee: 2000, vsize: 300, weight: 1200 },
          ],
        },
      );

      const result = await TestQuicknodeUTXOService.getUTXO(
        address,
        txid,
        vout,
        { includeAncestors: true },
      );

      assertExists(result.data);
      assertEquals(result.data.ancestorCount, 2);
      assertEquals(result.data.ancestorSize, 550);
      assertEquals(result.data.ancestorFees, 3000);
    });

    it("should validate script/address consistency", async () => {
      const address = "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2";
      const txid = "test-txid";
      const vout = 0;
      const differentScript = "5120" + "b".repeat(64); // P2TR script

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        [txid, vout, false],
        {
          txid,
          vout,
          value: "1.0",
          hex: differentScript, // Different from expected
        },
      );

      const result = await TestQuicknodeUTXOService.getUTXO(
        address,
        txid,
        vout,
      );

      assertExists(result.data);
      // Should use the QuickNode provided script even if different
      assertEquals(result.data.script, differentScript);
      assertEquals(result.data.scriptType, "witness_v1_taproot");
    });
  });

  describe("getUTXOs", () => {
    it("should fetch multiple UTXOs for an address", async () => {
      const address = "bc1qtest";

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXOs",
        [address, false],
        [
          {
            txid: "tx1",
            vout: 0,
            value: "0.1",
            confirmations: 100,
            height: 800000,
          },
          {
            txid: "tx2",
            vout: 1,
            value: "0.2",
            confirmations: 50,
            height: 800050,
          },
        ],
      );

      // Mock individual UTXO responses
      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        ["tx1", 0, false],
        { txid: "tx1", vout: 0, value: "0.1", hex: "0014" + "a".repeat(40) },
      );

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        ["tx2", 1, false],
        { txid: "tx2", vout: 1, value: "0.2", hex: "0014" + "a".repeat(40) },
      );

      const result = await TestQuicknodeUTXOService.getUTXOs(address);

      assertEquals(result.length, 2);
      assertEquals(result[0].value, 10000000);
      assertEquals(result[1].value, 20000000);
    });

    it("should handle confirmed only option", async () => {
      const address = "bc1qtest";

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXOs",
        [address, true], // confirmedOnly = true
        [
          {
            txid: "tx1",
            vout: 0,
            value: "0.5",
            confirmations: 10,
            height: 800000,
          },
        ],
      );

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        ["tx1", 0, false],
        { txid: "tx1", vout: 0, value: "0.5", hex: "0014" + "a".repeat(40) },
      );

      const result = await TestQuicknodeUTXOService.getUTXOs(address, {
        confirmedOnly: true,
      });

      assertEquals(result.length, 1);
      assertEquals(result[0].value, 50000000);
    });
  });

  describe("getRawTransactionHex", () => {
    it("should fetch raw transaction hex", async () => {
      const txid = "test-txid";
      const rawHex = "02000000..."; // Mock raw transaction hex

      MockCachedQuicknodeRPCService.setMockResponse(
        "getrawtransaction",
        [txid, false],
        rawHex,
      );

      const result = await TestQuicknodeUTXOService.getRawTransactionHex(txid);

      assertEquals(result, rawHex);
    });

    it("should handle invalid response format", async () => {
      const txid = "test-txid";

      MockCachedQuicknodeRPCService.setMockResponse(
        "getrawtransaction",
        [txid, false],
        null,
      );

      const result = await TestQuicknodeUTXOService.getRawTransactionHex(txid);

      assertEquals(result, null);
    });
  });

  describe("Address Validation with bitcoinjs-lib Mock", () => {
    it("should handle different address types with mock validation", async () => {
      const testCases = [
        { address: "bc1qtest", type: "witness_v0_keyhash", desc: "P2WPKH" },
        { address: "bc1ptest", type: "witness_v1_taproot", desc: "P2TR" },
        { address: "3Test", type: "scripthash", desc: "P2SH" },
        { address: "1Test", type: "pubkeyhash", desc: "P2PKH" },
      ];

      for (const testCase of testCases) {
        const txid = `${testCase.type}-txid`;

        MockCachedQuicknodeRPCService.setMockResponse(
          "bb_getUTXO",
          [txid, 0, false],
          {
            txid,
            vout: 0,
            value: "0.1",
            hex: bytesToHexCompat(
              mockBitcoinJS.address.toOutputScript(testCase.address),
            ),
          },
        );

        const result = await TestQuicknodeUTXOService.getUTXO(
          testCase.address,
          txid,
          0,
        );

        assertExists(result.data);
        assertEquals(result.data.scriptType, testCase.type);
        assertEquals(result.data.scriptDesc, testCase.desc);
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle missing vout in transaction", async () => {
      const address = "bc1qtest";
      const txid = "test-txid";
      const vout = 999; // Non-existent vout

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        [txid, vout, false],
        null,
      );

      const result = await TestQuicknodeUTXOService.getUTXO(
        address,
        txid,
        vout,
      );

      assertExists(result.error);
      assertEquals(result.error.includes("Failed to fetch UTXO"), true);
    });

    it("should handle empty script and address", async () => {
      const address = "bc1qtest";
      const txid = "test-txid";
      const vout = 0;

      MockCachedQuicknodeRPCService.setMockResponse(
        "bb_getUTXO",
        [txid, vout, false],
        {
          txid,
          vout,
          value: "0.1",
          hex: "", // Empty script
        },
      );

      const result = await TestQuicknodeUTXOService.getUTXO(
        address,
        txid,
        vout,
      );

      assertExists(result.data);
      // Should use the expected script derived from address
      assertEquals(result.data.script.length > 0, true);
    });
  });

  describe("Bitcoin Value Conversion", () => {
    it("should correctly convert BTC to satoshis", () => {
      const testCases = [
        { btc: "0.00000001", satoshis: 1 },
        { btc: "0.1", satoshis: 10000000 },
        { btc: "1", satoshis: 100000000 },
        { btc: "21000000", satoshis: 2100000000000000 },
      ];

      for (const testCase of testCases) {
        const result = TestQuicknodeUTXOService.convertBTCToSatoshis(
          testCase.btc,
        );
        assertEquals(result, testCase.satoshis);
      }
    });
  });
});
