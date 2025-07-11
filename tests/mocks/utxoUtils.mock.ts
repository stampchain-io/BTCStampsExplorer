/**
 * Mock implementation of utxoUtils for testing
 * Uses UTXO fixtures to provide realistic test data
 */

import type { UTXOFixture } from "../fixtures/utxoFixtures.ts";
import { utxoFixtures } from "../fixtures/utxoFixtures.ts";

// Store mock responses for different scenarios
const mockResponses = new Map<string, any>();

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

export const mockGetUTXOForAddress = (
  address: string,
  txid: string,
  vout: number,
) => {
  // Check if we have a specific mock response set for testing error cases
  const key = `${txid}:${vout}`;
  if (mockResponses.has(key)) {
    return Promise.resolve(mockResponses.get(key));
  }

  // Find matching fixture by txid and vout
  const fixtures = getAllFixtures();
  const fixture = fixtures.find((f) => f.txid === txid && f.vout === vout);

  if (fixture) {
    // Return fixture data in the expected format
    return Promise.resolve({
      utxo: {
        value: Number(fixture.value),
        script: fixture.script,
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
      },
    });
  }

  // If no fixture matches but address matches one of our fixtures, use that fixture's script type
  const addressFixture = fixtures.find((f) => f.address === address);
  if (addressFixture) {
    return Promise.resolve({
      utxo: {
        value: 100000, // Default value for unknown UTXOs
        script: addressFixture.script, // Use the correct script for this address type
        ancestor: null,
      },
    });
  }

  // Default mock response - P2WPKH
  return Promise.resolve({
    utxo: {
      value: 100000,
      script: utxoFixtures.p2wpkh.standard.script,
      ancestor: null,
    },
  });
};

// Function to set specific mock responses for testing
export function setMockUTXOResponse(txid: string, vout: number, response: any) {
  const key = `${txid}:${vout}`;
  mockResponses.set(key, response);
}

// Function to clear all mock responses
export function clearMockUTXOResponses() {
  mockResponses.clear();
}

// Export the mock as the main function
export const getUTXOForAddress = mockGetUTXOForAddress;
