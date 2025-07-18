// SRC20 PSBT Services Coverage Test - Targeted for 100% Coverage
// Simple tests focused on hitting uncovered lines and branches

import { assertExists, assertRejects } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { restore, stub } from "@std/testing/mock";
import { DatabaseManager } from "../../server/database/databaseManager.ts";
import { utxoFixtures } from "../fixtures/utxoFixtures.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

// Import the actual PSBT services
import { SRC20MultisigPSBTService } from "../../server/services/src20/psbt/src20MultisigPSBTService.ts";
import { SRC20PSBTService } from "../../server/services/src20/psbt/src20PSBTService.ts";
import { TransactionService } from "../../server/services/transaction/index.ts";
import { CommonUTXOService } from "../../server/services/utxo/commonUtxoService.ts";

// Valid raw transaction hex for testing
const validRawTxHex =
  "0200000001a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b000000006a47304402203e4516da7253cf068effec6b95c41221a0865409e8c5e3b6b1b3d2b5e2a8b72c0220331b1b5c9b8c9b8c9b8c9b8c9b8c9b8c9b8c9b8c9b8c9b8c9b8c9b8c9b8c9b8c01210321f2f6e1e50cb6a953935c3601284925decd3fd21bc6e3d1b9b8a7d5e5a9d5cffffffff0200e1f505000000001976a914c7e20a5dd06b5e3b8f8d5e3b5a8e1c6d9e2f3a4b88ac0084d71700000000001976a914a1b2c3d4e5f6789012345678901234567890abcd88ac00000000";

describe("SRC20 PSBT Services - Coverage Push", () => {
  let originalDbManager: DatabaseManager;
  let mockDbManager: MockDatabaseManager;

  beforeEach(() => {
    originalDbManager = (globalThis as any).dbManager;
    mockDbManager = new MockDatabaseManager();
    (globalThis as any).dbManager = mockDbManager;
  });

  afterEach(() => {
    (globalThis as any).dbManager = originalDbManager;
    restore();
  });

  describe("SRC20PSBTService - Edge Cases", () => {
    it("should handle missing script error path", async () => {
      stub(
        TransactionService.utxoServiceInstance,
        "selectUTXOsForTransaction",
        () =>
          Promise.resolve({
            inputs: [{
              txid: "abc123",
              vout: 0,
              value: 100000,
              script: "", // Empty script triggers error
              address: utxoFixtures.p2wpkh.standard.address,
              scriptType: "P2WPKH",
            }],
            change: 5000,
            fee: 1000,
          }),
      );

      stub(
        CommonUTXOService.prototype,
        "getRawTransactionHex",
        () => Promise.resolve(validRawTxHex),
      );

      await assertRejects(
        async () => {
          await SRC20PSBTService.preparePSBT({
            sourceAddress: utxoFixtures.p2wpkh.standard.address,
            toAddress: utxoFixtures.p2pkh.standard.address,
            src20Action: { p: "src-20", op: "mint", tick: "TEST", amt: "1000" },
            satsPerVB: 10,
            service_fee: 0,
            service_fee_address: "",
            changeAddress: utxoFixtures.p2wpkh.standard.address,
          });
        },
        Error,
        "is missing script",
      );
    });

    it("should handle successful PSBT creation", async () => {
      stub(
        TransactionService.utxoServiceInstance,
        "selectUTXOsForTransaction",
        () =>
          Promise.resolve({
            inputs: [{
              txid: utxoFixtures.p2wpkh.standard.txid,
              vout: utxoFixtures.p2wpkh.standard.vout,
              value: Number(utxoFixtures.p2wpkh.standard.value),
              script: utxoFixtures.p2wpkh.standard.script,
              address: utxoFixtures.p2wpkh.standard.address,
              scriptType: "witness_v0_keyhash",
            }],
            change: 50000,
            fee: 1000,
          }),
      );

      stub(
        CommonUTXOService.prototype,
        "getRawTransactionHex",
        () => Promise.resolve(validRawTxHex),
      );

      const result = await SRC20PSBTService.preparePSBT({
        sourceAddress: utxoFixtures.p2wpkh.standard.address,
        toAddress: utxoFixtures.p2pkh.standard.address,
        src20Action: { p: "src-20", op: "mint", tick: "TEST", amt: "1000" },
        satsPerVB: 10,
        service_fee: 0,
        service_fee_address: "",
        changeAddress: utxoFixtures.p2wpkh.standard.address,
      });

      assertExists(result.psbt);
      assertExists(result.feeDetails);
    });
  });

  describe("SRC20MultisigPSBTService - Edge Cases", () => {
    it("should handle missing script error path", async () => {
      stub(
        TransactionService.utxoServiceInstance,
        "selectUTXOsForTransaction",
        () =>
          Promise.resolve({
            inputs: [{
              txid: "abc123",
              vout: 0,
              value: 100000,
              script: "", // Empty script triggers error
              address: utxoFixtures.p2wpkh.standard.address,
              scriptType: "P2WPKH",
            }],
            change: 5000,
            fee: 3000,
          }),
      );

      stub(
        CommonUTXOService.prototype,
        "getRawTransactionHex",
        () => Promise.resolve(validRawTxHex),
      );

      await assertRejects(
        async () => {
          await SRC20MultisigPSBTService.preparePSBT({
            network: "bitcoin",
            changeAddress: utxoFixtures.p2wpkh.standard.address,
            toAddress: utxoFixtures.p2pkh.standard.address,
            feeRate: 10,
            transferString: JSON.stringify({
              p: "src-20",
              op: "transfer",
              tick: "TEST",
              amt: "500",
            }),
          });
        },
        Error,
        "is missing script",
      );
    });

    it("should handle successful multisig PSBT creation", async () => {
      stub(
        TransactionService.utxoServiceInstance,
        "selectUTXOsForTransaction",
        () =>
          Promise.resolve({
            inputs: [{
              txid: utxoFixtures.p2wpkh.standard.txid,
              vout: utxoFixtures.p2wpkh.standard.vout,
              value: Number(utxoFixtures.p2wpkh.standard.value),
              script: utxoFixtures.p2wpkh.standard.script,
              address: utxoFixtures.p2wpkh.standard.address,
              scriptType: "witness_v0_keyhash",
            }],
            change: 50000,
            fee: 3000,
          }),
      );

      stub(
        CommonUTXOService.prototype,
        "getRawTransactionHex",
        () => Promise.resolve(validRawTxHex),
      );

      const result = await SRC20MultisigPSBTService.preparePSBT({
        network: "bitcoin",
        changeAddress: utxoFixtures.p2wpkh.standard.address,
        toAddress: utxoFixtures.p2pkh.standard.address,
        feeRate: 10,
        transferString: JSON.stringify({
          p: "src-20",
          op: "transfer",
          tick: "TEST",
          amt: "500",
        }),
        enableRBF: true,
      });

      assertExists(result.psbtHex);
      assertExists(result.psbtBase64);
      assertExists(result.fee);
      assertExists(result.change);
    });

    it("should handle RBF disabled", async () => {
      stub(
        TransactionService.utxoServiceInstance,
        "selectUTXOsForTransaction",
        () =>
          Promise.resolve({
            inputs: [{
              txid: utxoFixtures.p2wpkh.standard.txid,
              vout: utxoFixtures.p2wpkh.standard.vout,
              value: Number(utxoFixtures.p2wpkh.standard.value),
              script: utxoFixtures.p2wpkh.standard.script,
              address: utxoFixtures.p2wpkh.standard.address,
              scriptType: "witness_v0_keyhash",
            }],
            change: 50000,
            fee: 3000,
          }),
      );

      stub(
        CommonUTXOService.prototype,
        "getRawTransactionHex",
        () => Promise.resolve(validRawTxHex),
      );

      const result = await SRC20MultisigPSBTService.preparePSBT({
        network: "bitcoin",
        changeAddress: utxoFixtures.p2wpkh.standard.address,
        toAddress: utxoFixtures.p2pkh.standard.address,
        feeRate: 10,
        transferString: JSON.stringify({
          p: "src-20",
          op: "transfer",
          tick: "TEST",
          amt: "500",
        }),
        enableRBF: false, // Test RBF disabled path
      });

      assertExists(result.psbtHex);
      assertExists(result.psbtBase64);
    });
  });
});
