// API Test Fixtures for Newman/Postman Testing
// Extends existing fixtures with comprehensive test data for all API endpoints

import process from "node:process";
import { marketDataFixtures } from "./marketDataFixtures.ts";

export const apiTestFixtures = {
  // System endpoints test data
  system: {
    health: {
      expectedResponse: {
        status: ["OK", "ERROR"],
        services: {
          api: true,
          indexer: [true, false],
          mempool: [true, false],
          database: [true, false],
          xcp: [true, false],
        },
      },
    },
    version: {
      expectedFormat: /^\d+\.\d+\.\d+$/, // Semantic versioning
    },
  },

  // Valid test addresses from production data
  addresses: {
    withBalance: [
      "bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq", // Known creator
      "bc1qzzgzhlnrw8rwxr8xplppnmwpfhvxnw22vpatch", // Known holder
      "bc1qh52hsgrlhkgky3t3pkzsj4qtl6n6lzcsglad6u", // Test address
    ],
    invalid: [
      "invalid_address",
      "1234567890",
      "",
    ],
  },

  // Stamps test data
  stamps: {
    validIds: [1, 100, 1000, 1135630, 1135402], // Mix of early and recent stamps
    validCpids: [
      "A4399874976698242000",
      "A10389027814845518000",
      "A555445545554455454",
      "A7187740802699165000",
    ],
    validIdents: ["STAMP", "SRC-721", "CLASSIC"],
    validTxHashes: [
      "106c17f61644e3f9952513e42911ffe78316a4b02d2a288fab8622bcfba3f064",
      "1b1edd5534b983635b5df76a31c3797537689a63aa1fe3cf931d542cfebe1e41",
      "da8a5131a990b4654c177a948eeb8031b79fece0a6922402908fc9b880faa48a",
    ],
    paginationTests: {
      limits: [1, 5, 10, 50, 100],
      pages: [1, 2, 10, 100],
    },
  },

  // Block test data
  blocks: {
    withStamps: [779652, 802900, 850000, 900000, 903108],
    withoutStamps: [1, 100, 500000],
    blockCounts: [1, 10, 50, 100],
    invalid: [-1, 0, 999999999],
  },

  // SRC-20 test data
  src20: {
    validTicks: ["STAMP", "PEPE", "KEVIN", "RARE", "WOJAK"],
    deploymentData: {
      deploy: {
        toAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
        changeAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
        op: "deploy",
        tick: "TEST",
        max: "21000000",
        lim: "1000",
        dec: 18,
        satsPerVB: 12,
      },
      mint: {
        toAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
        changeAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
        op: "mint",
        tick: "TEST",
        amt: "1000",
        satsPerVB: 12,
      },
      transfer: {
        toAddress: "bc1qh52hsgrlhkgky3t3pkzsj4qtl6n6lzcsglad6u",
        changeAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
        op: "transfer",
        tick: "TEST",
        amt: "100",
        satsPerVB: 12,
      },
    },
  },

  // SRC-101 test data
  src101: {
    validDeployHashes: [
      // These would need to be populated with actual SRC-101 deploy hashes
    ],
    deploymentData: {
      toAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
      changeAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
      traits: {
        name: "Test NFT Collection",
        symbol: "TNFT",
        description: "Test collection for API testing",
      },
      satsPerVB: 12,
    },
  },

  // Cursed stamps test data
  cursed: {
    validIds: [-1, -100, -1000], // Negative IDs for cursed stamps
    paginationTests: {
      limits: [1, 5, 10, 50],
      pages: [1, 2, 5],
    },
  },

  // Collections test data
  collections: {
    knownCollections: [
      "rare-pepes",
      "fake-rares",
      "dank-rares",
    ],
    creators: [
      "bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq",
      "bc1qzzgzhlnrw8rwxr8xplppnmwpfhvxnw22vpatch",
    ],
  },

  // Transaction test data
  transactions: {
    stampAttach: {
      sourceAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
      destinationAddress: "bc1qh52hsgrlhkgky3t3pkzsj4qtl6n6lzcsglad6u",
      stampId: 1000,
      quantity: 1,
      satsPerVB: 12,
    },
    stampDetach: {
      sourceAddress: "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
      stampId: 1000,
      quantity: 1,
      satsPerVB: 12,
    },
  },

  // Error scenarios
  errorScenarios: {
    notFound: {
      stampId: 999999999,
      address: "bc1qnotfound",
      blockIndex: 999999999,
      txHash:
        "0000000000000000000000000000000000000000000000000000000000000000",
    },
    invalidParams: {
      negativeLimit: -1,
      zeroLimit: 0,
      oversizedLimit: 10000,
      invalidPage: "abc",
      malformedAddress: "xyz123",
    },
  },

  // Import existing fixtures for consistency
  marketData: marketDataFixtures,
};

// Environment-specific configurations
export const testEnvironments = {
  development: {
    baseUrl: "http://host.docker.internal:8000",
    apiKey: process.env.DEV_API_KEY || "",
    timeout: 30000,
  },
  production: {
    baseUrl: "https://stampchain.io",
    apiKey: process.env.PROD_API_KEY || "",
    timeout: 10000,
  },
  ci: {
    baseUrl: "http://api:8000", // Docker service name in CI
    apiKey: process.env.CI_API_KEY || "",
    timeout: 60000,
  },
};

// Test data cleanup queries for database
export const cleanupQueries = {
  // These would be used if testing against a real database
  deleteTestStamps: `DELETE FROM stamps WHERE creator LIKE 'bc1qtest%'`,
  deleteTestSrc20: `DELETE FROM src20 WHERE tick LIKE 'TEST%'`,
  deleteTestTransactions: `DELETE FROM transactions WHERE memo LIKE '%TEST%'`,
};

// Response validation schemas
export const responseSchemas = {
  paginatedResponse: {
    required: ["data", "page", "limit", "totalPages", "total"],
    properties: {
      data: { type: "array" },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1 },
      totalPages: { type: "number", minimum: 0 },
      total: { type: "number", minimum: 0 },
    },
  },
  errorResponse: {
    required: ["error"],
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      statusCode: { type: "number" },
    },
  },
};
