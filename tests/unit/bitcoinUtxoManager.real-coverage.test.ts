/**
 * Real branch coverage tests for BitcoinUtxoManager class
 * Target: Improve from 7.4% to >80% branch coverage
 *
 * This test file imports and tests the actual production BitcoinUtxoManager
 * to ensure coverage tracking works properly.
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { createMockUTXO } from "./utils/testFactories.ts";
import { utxoFixtures } from "../fixtures/utxoFixtures.ts";

// Set test environment
(globalThis as any).SKIP_REDIS_CONNECTION = true;
(globalThis as any).SKIP_DB_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("SKIP_DB_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");
Deno.env.set("SKIP_EXTERNAL_APIS", "true");

// Import the real BitcoinUtxoManager
import { BitcoinUtxoManager } from "../../server/services/transaction/bitcoinUtxoManager.ts";

// Mock dependencies at the module level
const mockCommonUtxoService = {
  getSpendableUTXOs: (address: string, _filters?: any, _options?: any) => {
    if (address === "empty_address") {
      return Promise.resolve([]);
    }
    if (address === "error_address") {
      return Promise.reject(new Error("Network error fetching UTXOs"));
    }

    // Return different fixture sets based on address
    if (address === "single_utxo_address") {
      const fixture = utxoFixtures.p2wpkh.standard;
      return Promise.resolve([
        createMockUTXO({
          value: Number(fixture.value),
          txid: fixture.txid,
          vout: fixture.vout,
          address: fixture.address,
        }),
      ]);
    }
    if (address === "multiple_utxos_address") {
      const fixtures = [
        utxoFixtures.p2wpkh.dustAmount,
        utxoFixtures.p2wpkh.largeValue,
        utxoFixtures.p2pkh.standard,
      ];
      return Promise.resolve(fixtures.map((fixture) =>
        createMockUTXO({
          value: Number(fixture.value),
          txid: fixture.txid,
          vout: fixture.vout,
          address: fixture.address,
        })
      ));
    }
    if (address === "insufficient_funds_address") {
      const fixture = utxoFixtures.p2wpkh.dustAmount;
      return Promise.resolve([createMockUTXO({
        value: Number(fixture.value),
        txid: fixture.txid,
        vout: fixture.vout,
        address: fixture.address,
      })]);
    }

    // Default case - mix of fixtures
    const defaultFixtures = [
      utxoFixtures.p2wpkh.standard,
      utxoFixtures.p2pkh.standard,
    ];
    return Promise.resolve(defaultFixtures.map((fixture) =>
      createMockUTXO({
        value: Number(fixture.value),
        txid: fixture.txid,
        vout: fixture.vout,
        address: fixture.address,
      })
    ));
  },

  getSpecificUTXO: (txid: string, vout: number, _options?: any) => {
    if (txid === "error_tx") {
      return Promise.reject(new Error("Failed to fetch UTXO details"));
    }
    if (txid === "missing_tx") {
      return Promise.resolve(null);
    }
    if (txid === "no_script_tx") {
      return Promise.resolve(
        createMockUTXO({ txid, vout, script: undefined as any }),
      );
    }

    // Find matching fixture or use default
    const allFixtures = Object.values(utxoFixtures).flatMap((group) =>
      Object.values(group)
    );
    const matchingFixture =
      allFixtures.find((f) => f.txid === txid && f.vout === vout) ||
      utxoFixtures.p2wpkh.standard;

    return Promise.resolve(createMockUTXO({
      txid,
      vout,
      script: matchingFixture.script,
      scriptType: matchingFixture.scriptType,
      value: Number(matchingFixture.value),
      address: matchingFixture.address,
    }));
  },
};

const mockCounterpartyApiManager = {
  getXcpBalancesByAddress: (
    address: string,
    _assets?: any,
    _includeUtxo?: boolean,
  ) => {
    if (address === "stamp_address") {
      return Promise.resolve({
        balances: [
          {
            utxo:
              `${utxoFixtures.p2wpkh.standard.txid}:${utxoFixtures.p2wpkh.standard.vout}`,
          },
          {
            utxo:
              `${utxoFixtures.p2pkh.standard.txid}:${utxoFixtures.p2pkh.standard.vout}`,
          },
        ],
      });
    }
    if (address === "xcp_error_address") {
      return Promise.reject(new Error("XCP balance fetch failed"));
    }

    return Promise.resolve({ balances: [] });
  },
};

// Mock the dependencies before creating BitcoinUtxoManager instance
(globalThis as any).mockCommonUtxoService = mockCommonUtxoService;
(globalThis as any).mockCounterpartyApiManager = mockCounterpartyApiManager;

Deno.test("BitcoinUtxoManager - Real Production Code Coverage", async (t) => {
  await t.step(
    "estimateVoutSize - static method with valid P2WPKH address",
    () => {
      const output = {
        address: utxoFixtures.p2wpkh.standard.address,
        value: 100000,
      };
      const size = BitcoinUtxoManager.estimateVoutSize(output);
      assertEquals(size, 31); // 8 + 1 + 22
    },
  );

  await t.step(
    "estimateVoutSize - static method with valid P2SH address",
    () => {
      const output = {
        address: utxoFixtures.p2sh.multisig.address,
        value: 100000,
      };
      const size = BitcoinUtxoManager.estimateVoutSize(output);
      assertEquals(size, 32); // 8 + 1 + 23
    },
  );

  await t.step(
    "estimateVoutSize - static method with valid P2PKH address",
    () => {
      const output = {
        address: utxoFixtures.p2pkh.standard.address,
        value: 100000,
      };
      const size = BitcoinUtxoManager.estimateVoutSize(output);
      assertEquals(size, 34); // 8 + 1 + 25
    },
  );

  await t.step("estimateVoutSize - static method with invalid address", () => {
    const output = { address: "invalid", value: 100000 };
    const size = BitcoinUtxoManager.estimateVoutSize(output);
    assertEquals(size, 43); // 8 + 1 + 34 (default)
  });

  await t.step("estimateVoutSize - static method with script", () => {
    const output = {
      script: "0014abcd1234abcd1234abcd1234abcd1234abcd1234",
      value: 100000,
    };
    const size = BitcoinUtxoManager.estimateVoutSize(output);
    assertEquals(size, 31); // 8 + 1 + 22
  });

  await t.step("estimateVoutSize - static method with empty script", () => {
    const output = { script: "", value: 100000 };
    const size = BitcoinUtxoManager.estimateVoutSize(output);
    assertEquals(size, 9); // 8 + 1 + 0
  });
});
