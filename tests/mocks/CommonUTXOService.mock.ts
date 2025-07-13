/**
 * Mock implementation of CommonUTXOService for testing
 * Uses UTXO fixtures to provide realistic test data
 */

import type { UTXOFixture } from "../fixtures/utxoFixtures.ts";
import { utxoFixtures } from "../fixtures/utxoFixtures.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";

// Store mock responses for different scenarios
const mockResponses = new Map<string, any>();
const mockTransactionHexes = new Map<string, string | Error>();

// Cache flattened fixtures for performance
let flattenedFixtures: UTXOFixture[] | null = null;

function getAllFixtures(): UTXOFixture[] {
  if (!flattenedFixtures) {
    flattenedFixtures = [];
    Object.values(utxoFixtures).forEach((scriptTypeGroup) => {
      Object.values(scriptTypeGroup).forEach((fixture) => {
        flattenedFixtures!.push(fixture);
      });
    });
  }
  return flattenedFixtures;
}

export class MockCommonUTXOService extends CommonUTXOService {
  private static mockInstance: MockCommonUTXOService | null = null;

  constructor() {
    super();
    // Override properties for testing
    this.isQuickNodeConfigured = true;
    this.rawTxHexCache = new Map<string, string>();
  }

  static getInstance(): CommonUTXOService {
    if (!MockCommonUTXOService.mockInstance) {
      MockCommonUTXOService.mockInstance = new MockCommonUTXOService();
    }
    return MockCommonUTXOService.mockInstance;
  }

  getSpecificUTXO(
    txid: string,
    vout: number,
    _options?: any,
  ): Promise<any> {
    // Check if we have a specific mock response set for testing error cases
    const key = `${txid}:${vout}`;
    if (mockResponses.has(key)) {
      const response = mockResponses.get(key);
      if (response instanceof Error) {
        throw response;
      }
      return Promise.resolve(response);
    }

    // Find matching fixture by txid and vout
    const fixtures = getAllFixtures();
    const fixture = fixtures.find((f) => f.txid === txid && f.vout === vout);

    if (fixture) {
      // Return fixture data in the expected format
      return Promise.resolve({
        value: Number(fixture.value),
        script: fixture.script,
        scriptType: fixture.scriptType,
        address: fixture.address,
        ancestor: fixture.blockHeight
          ? {
            fees: 0,
            vsize: 250,
            effectiveRate: 0,
            txid: fixture.txid,
            vout: fixture.vout,
            weight: 1000,
            size: 250,
            scriptType: fixture.scriptType,
            sequence: 0xfffffffd,
            blockHeight: fixture.blockHeight,
            confirmations: fixture.confirmations || 1,
          }
          : null,
      });
    }

    // Default mock response - P2WPKH
    return Promise.resolve({
      value: 100000,
      script: utxoFixtures.p2wpkh.standard.script,
      scriptType: "p2wpkh",
      address: "bc1qcvq650ddrvmq9a7m5ezltsk9wyh8epwlhzc8f2",
      ancestor: null,
    });
  }

  getRawTransactionHex(txid: string): Promise<string> {
    // Check if we have a specific mock response
    if (mockTransactionHexes.has(txid)) {
      const response = mockTransactionHexes.get(txid);
      if (response instanceof Error) {
        return Promise.reject(response);
      }
      return Promise.resolve(response!);
    }

    // Find matching fixture
    const fixtures = getAllFixtures();
    const fixture = fixtures.find((f) => f.txid === txid);

    if (fixture) {
      // Create a mock raw transaction hex that includes the fixture's script
      // This is a simplified version - real transactions would have more data
      const version = "02000000"; // Version 2
      const inputCount = "01"; // 1 input
      const prevTxid = "0".repeat(64); // Previous txid (zeros for mock)
      const prevVout = "00000000"; // Previous vout
      const scriptSig = "00"; // Empty scriptsig for witness transactions
      const sequence = "fffffffd"; // Sequence
      const outputCount = "01"; // 1 output
      const valueHex = Number(fixture.value).toString(16).padStart(16, "0");
      // Convert to little endian
      const value = valueHex.match(/.{2}/g)!.reverse().join("");
      const scriptPubKeyLen = (fixture.script.length / 2).toString(16).padStart(
        2,
        "0",
      );
      const locktime = "00000000";

      return Promise.resolve(
        version +
          inputCount +
          prevTxid +
          prevVout +
          scriptSig +
          sequence +
          outputCount +
          value +
          scriptPubKeyLen +
          fixture.script +
          locktime,
      );
    }

    // Default mock raw transaction hex
    return Promise.resolve("02000000000101" + txid + "00000000000000000000");
  }

  getUTXOsForAddress(
    address: string,
    _options?: any,
  ): Promise<any[]> {
    // Find all fixtures matching the address
    const fixtures = getAllFixtures();
    const matchingFixtures = fixtures.filter((f) => f.address === address);

    if (matchingFixtures.length > 0) {
      return Promise.resolve(matchingFixtures.map((fixture) => ({
        txid: fixture.txid,
        vout: fixture.vout,
        value: Number(fixture.value),
        script: fixture.script,
        scriptType: fixture.scriptType,
        address: fixture.address,
        confirmations: fixture.confirmations || 1,
        blockHeight: fixture.blockHeight,
      })));
    }

    // Return a default UTXO for unknown addresses
    return Promise.resolve([{
      txid: "deadbeef" + "0".repeat(56),
      vout: 0,
      value: 100000,
      script: utxoFixtures.p2wpkh.standard.script,
      scriptType: "p2wpkh",
      address: address,
      confirmations: 1,
      blockHeight: 744067,
    }]);
  }

  getTransactionDetails(txid: string): Promise<any> {
    // Find matching fixture
    const fixtures = getAllFixtures();
    const fixture = fixtures.find((f) => f.txid === txid);

    if (fixture) {
      return Promise.resolve({
        txid: fixture.txid,
        version: 2,
        locktime: 0,
        inputs: [{
          txid: "0".repeat(64),
          vout: 0,
          sequence: 0xfffffffd,
          script: "",
          witness: [],
        }],
        outputs: [{
          value: Number(fixture.value),
          script: fixture.script,
          scriptType: fixture.scriptType,
          address: fixture.address,
        }],
        size: 250,
        weight: 1000,
        fee: 250,
        confirmations: fixture.confirmations || 1,
        blockHeight: fixture.blockHeight,
      });
    }

    // Default mock transaction details
    return Promise.resolve({
      txid: txid,
      version: 2,
      locktime: 0,
      inputs: [],
      outputs: [],
      size: 250,
      weight: 1000,
      fee: 250,
      confirmations: 1,
      blockHeight: 744067,
    });
  }

  // Helper method to check if UTXO is spent
  isUTXOSpent(txid: string, vout: number): Promise<boolean> {
    const key = `${txid}:${vout}:spent`;
    if (mockResponses.has(key)) {
      return Promise.resolve(mockResponses.get(key) as boolean);
    }
    // Default to not spent
    return Promise.resolve(false);
  }

  // Add missing getSpendableUTXOs method
  async getSpendableUTXOs(
    address: string,
    minConfirmations: number = 1,
  ): Promise<any[]> {
    const utxos = await this.getUTXOsForAddress(address);
    // Filter by confirmations
    return utxos.filter((utxo) => utxo.confirmations >= minConfirmations);
  }
}

// Function to set specific mock responses for testing
export function setMockUTXOResponse(
  txid: string,
  vout: number,
  response: any,
): void {
  const key = `${txid}:${vout}`;
  mockResponses.set(key, response);
}

// Function to set mock transaction hex
export function setMockTransactionHex(txid: string, hex: string): void {
  mockTransactionHexes.set(txid, hex);
}

// Function to mark UTXO as spent
export function setUTXOSpent(txid: string, vout: number, spent: boolean): void {
  const key = `${txid}:${vout}:spent`;
  mockResponses.set(key, spent);
}

// Function to clear all mock responses
export function clearMockResponses(): void {
  mockResponses.clear();
  mockTransactionHexes.clear();
}

// Export singleton instance getter
export const commonUTXOService = {
  getInstance: MockCommonUTXOService.getInstance,
};
