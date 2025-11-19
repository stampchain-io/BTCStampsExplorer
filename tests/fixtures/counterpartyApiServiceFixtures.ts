/**
 * @fileoverview XCP Service Test Fixtures
 * Comprehensive mock data for testing XCP service functionality
 */

export const counterpartyApiServiceFixtures = {
  // XCP Node configurations
  nodes: {
    primary: {
      name: "counterparty.io",
      url: "https://api.counterparty.io:4000/v2",
    },
    secondary: {
      name: "dev.counterparty.io",
      url: "https://api.counterparty.io:4000/v2",
    },
  },

  // Asset fixtures
  assets: {
    stamps: [
      {
        asset: "A4399874976698242000",
        asset_longname: null,
        owner: "bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq",
        issuer: "bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq",
        description: "STAMP:0",
        divisible: false,
        locked: true,
        supply: 100,
        listed_at: 779652,
        confirmed_at: 779652,
        first_issuance_block_index: 779652,
      },
      {
        asset: "A10389027814845518000",
        asset_longname: null,
        owner: "bc1qzzgzhlnrw8rwxr8xplppnmwpfhvxnw22vpatch",
        issuer: "bc1qzzgzhlnrw8rwxr8xplppnmwpfhvxnw22vpatch",
        description: "STAMP:100",
        divisible: false,
        locked: true,
        supply: 1,
        listed_at: 802900,
        confirmed_at: 802900,
        first_issuance_block_index: 802900,
      },
    ],
    src20: [
      {
        asset: "STAMP",
        asset_longname: null,
        owner: "bc1qsrc20owner",
        issuer: "bc1qsrc20issuer",
        description: "SRC-20 STAMP Token",
        divisible: true,
        locked: false,
        supply: 21000000000000000000,
      },
    ],
    fairminters: [
      {
        tx_hash: "fairmint123",
        tx_index: 1000,
        block_index: 850000,
        source: "bc1qfairminter",
        asset: "FAIRASSET",
        asset_parent: null,
        asset_longname: null,
        description: "Fair minted test asset",
        price: 1000,
        quantity_by_price: 100,
        hard_cap: 1000000,
        burn_payment: false,
        max_mint_per_tx: 100,
        premint_quantity: 0,
        start_block: 850000,
        end_block: 900000,
        minted_asset_commission_int: 0,
        soft_cap: 500000,
        soft_cap_deadline_block: 875000,
        lock_description: true,
        lock_quantity: true,
        divisible: false,
        pre_minted: false,
        status: "open",
        paid_quantity: 250000,
        confirmed: true,
      },
    ],
  },

  // Balance fixtures
  balances: {
    single: {
      address: "bc1qtest123",
      asset: "A4399874976698242000",
      quantity: 10,
      utxo: "abc123:0",
      utxo_address: "bc1qtest123",
      divisible: false,
    },
    multiple: [
      {
        address: "bc1qmulti1",
        asset: "A4399874976698242000",
        quantity: 5,
        utxo: "utxo1:0",
        utxo_address: "bc1qmulti1",
        divisible: false,
      },
      {
        address: "bc1qmulti1",
        asset: "A10389027814845518000",
        quantity: 1,
        utxo: "utxo2:0",
        utxo_address: "bc1qmulti1",
        divisible: false,
      },
      {
        address: "bc1qmulti1",
        asset: "STAMP",
        quantity: 1000000000000000000,
        utxo: "",
        utxo_address: "bc1qmulti1",
        divisible: true,
      },
    ],
    aggregated: [
      {
        address: "bc1qagg1",
        quantity: 15, // Aggregated from multiple UTXOs
      },
      {
        address: "bc1qagg2",
        quantity: 5,
      },
    ],
  },

  // Dispenser fixtures
  dispensers: {
    open: {
      tx_hash: "dispenser_open_123",
      block_index: 850000,
      source: "bc1qdispensersource",
      asset: "A4399874976698242000",
      give_quantity: 1,
      give_remaining: 10,
      escrow_quantity: 10,
      satoshirate: 100000,
      origin: "bc1qdispenserorigin",
      confirmed: true,
      close_block_index: null,
      status: 0,
      asset_info: {
        asset_longname: null,
        description: "STAMP:0",
        issuer: "bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq",
        divisible: false,
        locked: true,
      },
      dispenser_info: {
        give_quantity_normalized: "1",
        give_remaining_normalized: "10",
        escrow_quantity_normalized: "10",
        satoshirate_normalized: "0.00100000",
        satoshi_price: 100000,
        satoshi_price_normalized: "0.00100000",
      },
    },
    closed: {
      tx_hash: "dispenser_closed_456",
      block_index: 840000,
      source: "bc1qdispensersource2",
      asset: "A10389027814845518000",
      give_quantity: 1,
      give_remaining: 0,
      escrow_quantity: 5,
      satoshirate: 50000,
      origin: "bc1qdispenserorigin2",
      confirmed: true,
      close_block_index: 845000,
      status: 10,
      asset_info: {
        asset_longname: null,
        description: "STAMP:100",
        issuer: "bc1qzzgzhlnrw8rwxr8xplppnmwpfhvxnw22vpatch",
        divisible: false,
        locked: true,
      },
      dispenser_info: {
        give_quantity_normalized: "1",
        give_remaining_normalized: "0",
        escrow_quantity_normalized: "5",
        satoshirate_normalized: "0.00050000",
        satoshi_price: 50000,
        satoshi_price_normalized: "0.00050000",
      },
    },
  },

  // Dispense events
  dispenses: {
    recent: [
      {
        tx_hash: "dispense_tx_1",
        block_index: 851000,
        block_time: 1700000000,
        source: "bc1qdispensersource",
        destination: "bc1qdispensedest1",
        dispenser_tx_hash: "dispenser_open_123",
        dispense_quantity: 1,
        confirmed: true,
        btc_amount_normalized: "0.001",
        close_block_index: null,
        dispenser_details: {
          asset: "A4399874976698242000",
          give_quantity: 1,
          escrow_quantity: 10,
          satoshirate: 100000,
          give_remaining: 9,
        },
      },
      {
        tx_hash: "dispense_tx_2",
        block_index: 851100,
        block_time: 1700003600,
        source: "bc1qdispensersource",
        destination: "bc1qdispensedest2",
        dispenser_tx_hash: "dispenser_open_123",
        dispense_quantity: 1,
        confirmed: true,
        btc_amount_normalized: "0.001",
        close_block_index: null,
        dispenser_details: {
          asset: "A4399874976698242000",
          give_quantity: 1,
          escrow_quantity: 10,
          satoshirate: 100000,
          give_remaining: 8,
        },
      },
    ],
    events: [
      {
        event_index: 1000,
        event: "DISPENSE",
        params: {
          asset: "A4399874976698242000",
          block_index: 851000,
          btc_amount: 100000000, // 1 BTC in satoshis
          destination: "bc1qdispensedest1",
          dispense_index: 1,
          dispense_quantity: 1,
          dispenser_tx_hash: "dispenser_open_123",
          source: "bc1qdispensersource",
          tx_hash: "dispense_tx_1",
          tx_index: 1000,
        },
        tx_hash: "dispense_tx_1",
        block_index: 851000,
      },
    ],
  },

  // Send transactions
  sends: {
    valid: [
      {
        tx_hash: "send_tx_1",
        block_index: 850500,
        block_time: 1699500000,
        source: "bc1qsender1",
        destination: "bc1qreceiver1",
        quantity: 1,
        asset: "A4399874976698242000",
        status: "valid",
        memo: null,
        memo_hex: null,
        confirmed: true,
      },
      {
        tx_hash: "send_tx_2",
        block_index: 850600,
        block_time: 1699600000,
        source: "bc1qsender2",
        destination: "bc1qreceiver2",
        quantity: 5,
        asset: "A10389027814845518000",
        status: "valid",
        memo: "Test transfer",
        memo_hex: "54657374207472616e73666572",
        confirmed: true,
      },
    ],
  },

  // Compose transaction responses
  compose: {
    attach: {
      rawtransaction: "0200000001abc123...def456",
      params: {
        source: "bc1qtest123",
        destination: "bc1qdest123",
        asset: "A4399874976698242000",
        quantity: 1,
      },
      tx_hex: "0200000001abc123...def456",
      data: "6a04534154581234567890",
      btc_in: 10000,
      btc_out: 9000,
      btc_change: 8454,
      btc_fee: 546,
      tx_size: 250,
      fee_per_kb: 2184,
      fee_per_kb_normalized: 0.00002184,
    },
    detach: {
      rawtransaction: "0200000001def456...abc123",
      params: {
        source: "utxo123:0",
        destination: "bc1qdest123",
      },
      tx_hex: "0200000001def456...abc123",
      btc_in: 10000,
      btc_out: 9000,
      btc_change: 8454,
      btc_fee: 546,
      tx_size: 226,
      fee_per_kb: 2416,
      fee_per_kb_normalized: 0.00002416,
    },
    dispense: {
      rawtransaction: "0200000001ghi789...jkl012",
      params: {
        source: "bc1qtest123",
        dispenser: "bc1qdispenser",
        quantity: 1,
      },
      tx_hex: "0200000001ghi789...jkl012",
      data: null,
      btc_in: 100100000,
      btc_out: 100000000,
      btc_change: 99454,
      btc_fee: 546,
      tx_size: 258,
      fee_per_kb: 2116,
      fee_per_kb_normalized: 0.00002116,
    },
    send: {
      rawtransaction: "0200000001mno345...pqr678",
      params: {
        source: "bc1qtest123",
        destination: "bc1qdest123",
        asset: "A4399874976698242000",
        quantity: 1,
        memo: "Test send",
      },
      tx_hex: "0200000001mno345...pqr678",
      data: "434e545250525459....",
      btc_in: 10000,
      btc_out: 546,
      btc_change: 8908,
      btc_fee: 546,
      tx_size: 276,
      fee_per_kb: 1978,
      fee_per_kb_normalized: 0.00001978,
    },
    issuance: {
      rawtransaction: "0200000001stu901...vwx234",
      params: {
        source: "bc1qtest123",
        asset: "NEWASSET",
        quantity: 1000,
        divisible: false,
        description: "New test asset",
        lock: true,
      },
      tx_hex: "0200000001stu901...vwx234",
      data: "434e545250525459...",
      btc_in: 10000,
      btc_out: 0,
      btc_change: 9000,
      btc_fee: 1000,
      tx_size: 300,
      fee_per_kb: 3333,
      fee_per_kb_normalized: 0.00003333,
    },
    dispenser: {
      rawtransaction: "0200000001yz567...890abc",
      params: {
        source: "bc1qtest123",
        asset: "A4399874976698242000",
        give_quantity: 1,
        escrow_quantity: 10,
        mainchainrate: 100000,
        status: 0,
      },
      tx_hex: "0200000001yz567...890abc",
      data: "434e545250525459...",
      btc_in: 11000,
      btc_out: 10000,
      btc_change: 454,
      btc_fee: 546,
      tx_size: 290,
      fee_per_kb: 1883,
      fee_per_kb_normalized: 0.00001883,
    },
    fairmint: {
      rawtransaction: "0200000001fair123...mint456",
      params: {
        source: "bc1qtest123",
        asset: "FAIRASSET",
        quantity: 100,
      },
      tx_hex: "0200000001fair123...mint456",
      data: "434e545250525459...",
      btc_in: 10000,
      btc_out: 0,
      btc_change: 9454,
      btc_fee: 546,
      tx_size: 250,
      fee_per_kb: 2184,
      fee_per_kb_normalized: 0.00002184,
    },
  },

  // Error responses
  errors: {
    nodeDown: {
      status: 500,
      body: "Internal Server Error",
    },
    invalidAddress: {
      error: {
        message: "invalid base58 string",
        code: -5,
      },
    },
    insufficientFunds: {
      error: {
        message: "Insufficient BTC for transaction fee",
        code: -6,
      },
    },
    assetNotFound: {
      error: {
        message: "Asset not found",
        code: -8,
      },
    },
    invalidParameters: {
      error: {
        message: "Invalid parameters",
        code: -32602,
      },
    },
  },

  // Health check responses
  health: {
    healthy: {
      result: {
        status: "Healthy",
        services: {
          database: "ok",
          bitcoin: "ok",
          indexer: "ok",
        },
        version: "10.5.0",
      },
    },
    unhealthy: {
      result: {
        status: "Unhealthy",
        services: {
          database: "ok",
          bitcoin: "error",
          indexer: "ok",
        },
        version: "10.5.0",
      },
    },
  },

  // Pagination test data
  pagination: {
    cursors: ["cursor1", "cursor2", "cursor3", null],
    limits: [10, 50, 100, 500, 1000],
    pages: [1, 2, 5, 10, 100],
  },

  // Fee rate test scenarios
  feeRates: {
    valid: [
      { satsPerVB: 1, satsPerKB: 1000 },
      { satsPerVB: 10, satsPerKB: 10000 },
      { satsPerVB: 100, satsPerKB: 100000 },
      { satsPerVB: 0.1, satsPerKB: 100 }, // Minimum allowed
    ],
    invalid: [
      { satsPerVB: 0 },
      { satsPerVB: 0.05 }, // Below minimum
      { satsPerVB: -1 },
      {}, // No fee rate provided
    ],
  },
};

// Helper functions for test data generation
export const xcpTestHelpers = {
  /**
   * Generate a batch of mock dispensers
   */
  generateDispensers(count: number, cpid: string = "A4399874976698242000") {
    return Array.from({ length: count }, (_, i) => ({
      ...counterpartyApiServiceFixtures.dispensers.open,
      tx_hash: `dispenser_${i}`,
      block_index: 850000 + i,
      give_remaining: Math.max(0, 10 - i),
      status: i < 5 ? 0 : 10, // Half open, half closed
    }));
  },

  /**
   * Generate a batch of mock balances
   */
  generateBalances(count: number, address: string = "bc1qtest") {
    return Array.from({ length: count }, (_, i) => ({
      address: `${address}${i}`,
      asset: `A${4399874976698242000 + i}`,
      quantity: Math.floor(Math.random() * 100) + 1,
      utxo: i % 2 === 0 ? `utxo${i}:0` : "",
      utxo_address: `${address}${i}`,
      divisible: false,
    }));
  },

  /**
   * Generate a batch of mock dispense events
   */
  generateDispenseEvents(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      event_index: 1000 + i,
      event: "DISPENSE",
      params: {
        asset: `A${4399874976698242000 + (i % 10)}`,
        block_index: 851000 + i,
        btc_amount: 100000000 + (i * 10000),
        destination: `bc1qdest${i}`,
        dispense_index: i + 1,
        dispense_quantity: 1,
        dispenser_tx_hash: `dispenser_${i % 5}`,
        source: `bc1qsource${i % 3}`,
        tx_hash: `dispense_tx_${i}`,
        tx_index: 1000 + i,
      },
      tx_hash: `dispense_tx_${i}`,
      block_index: 851000 + i,
    }));
  },

  /**
   * Generate mock API response with pagination
   */
  generatePaginatedResponse<T>(
    items: T[],
    cursor?: string | null,
    total?: number,
  ) {
    return {
      result: items,
      next_cursor: cursor !== undefined
        ? cursor
        : (items.length >= 1000 ? "next_cursor" : null),
      result_count: items.length,
      total: total || items.length,
    };
  },

  /**
   * Generate error response
   */
  generateErrorResponse(
    type: keyof typeof counterpartyApiServiceFixtures.errors,
  ) {
    const errorConfig = counterpartyApiServiceFixtures.errors[type];
    if ("error" in errorConfig) {
      return {
        error: errorConfig.error,
        status: 400,
      };
    } else {
      return {
        error: errorConfig.body,
        status: errorConfig.status,
      };
    }
  },
};

export default counterpartyApiServiceFixtures;
