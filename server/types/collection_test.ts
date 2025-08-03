/**
 * Tests for server collection types
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  CollectionRow,
  CollectionWithCreators,
  CollectionWithOptionalMarketData,
  CollectionProcessor,
  CollectionServiceConfig,
  CollectionCacheEntry,
  CollectionValidationErrorCode,
  isCollectionRow,
  isCollectionWithMarketData,
} from "./collection.d.ts";

Deno.test("CollectionRow - basic structure", () => {
  const collection: CollectionRow = {
    collection_id: "collection_123",
    collection_name: "Test Collection",
    collection_description: "A test collection",
    creators: ["bc1q..."],
    stamp_count: 10,
    total_editions: 100,
    stamps: [1, 2, 3, 4, 5],
    img: "https://example.com/image.png",
  };

  assertEquals(collection.collection_id, "collection_123");
  assertEquals(collection.stamp_count, 10);
  assertEquals(collection.stamps.length, 5);
});

Deno.test("CollectionWithCreators - extended structure", () => {
  const collection: CollectionWithCreators = {
    collection_id: "collection_123",
    collection_name: "Test Collection",
    collection_description: "A test collection",
    creators: ["bc1q..."],
    creator_names: ["Artist Name"],
    stamp_count: 10,
    total_editions: 100,
    stamps: [1, 2, 3],
    img: "https://example.com/image.png",
  };

  assertExists(collection.creator_names);
  assertEquals(collection.creator_names[0], "Artist Name");
});

Deno.test("CollectionWithOptionalMarketData - market data structure", () => {
  const collection: CollectionWithOptionalMarketData = {
    collection_id: "collection_123",
    collection_name: "Test Collection",
    collection_description: "A test collection",
    creators: ["bc1q..."],
    stamp_count: 10,
    total_editions: 100,
    stamps: [1, 2, 3],
    img: "https://example.com/image.png",
    marketData: {
      collectionId: "collection_123",
      minFloorPriceBTC: 0.01,
      maxFloorPriceBTC: 0.05,
      avgFloorPriceBTC: 0.03,
      medianFloorPriceBTC: 0.04,
      totalVolume24hBTC: 1.5,
      stampsWithPricesCount: 5,
      minHolderCount: 2,
      maxHolderCount: 10,
      avgHolderCount: 5,
      medianHolderCount: 4,
      totalUniqueHolders: 25,
      avgDistributionScore: 0.6,
      totalStampsCount: 10,
      lastUpdated: new Date(),
    },
    cacheStatus: "fresh",
    floorPriceRange: {
      min: 0.01,
      max: 0.05,
      avg: 0.03,
    },
  };

  assertExists(collection.marketData);
  assertEquals(collection.marketData.totalVolume24hBTC, 1.5);
  assertEquals(collection.cacheStatus, "fresh");
});

Deno.test("CollectionProcessor interface", () => {
  const processor: CollectionProcessor = {
    processRawCollection: (raw: any) => ({
      collection_id: raw.id,
      collection_name: raw.name,
      collection_description: raw.description || "",
      creators: raw.creators || [],
      stamp_count: raw.stamps?.length || 0,
      total_editions: raw.editions || 0,
      stamps: raw.stamps || [],
      img: raw.image || "",
    }),
    enrichCollection: async (collection) => ({
      ...collection,
      marketData: null,
    }),
    processBatch: async (collections) => 
      Promise.all(collections.map(c => processor.enrichCollection(c))),
    transformForApi: (collection) => ({
      id: collection.collection_id,
      name: collection.collection_name,
      ...collection,
    }),
  };

  const raw = { id: "123", name: "Test", stamps: [1, 2, 3] };
  const processed = processor.processRawCollection(raw);
  
  assertEquals(processed.collection_id, "123");
  assertEquals(processed.stamp_count, 3);
});

Deno.test("CollectionValidationErrorCode enum", () => {
  assertEquals(CollectionValidationErrorCode.INVALID_ID, "INVALID_ID");
  assertEquals(CollectionValidationErrorCode.NAME_TOO_LONG, "NAME_TOO_LONG");
  assertEquals(CollectionValidationErrorCode.DUPLICATE_STAMPS, "DUPLICATE_STAMPS");
});

Deno.test("CollectionServiceConfig structure", () => {
  const config: CollectionServiceConfig = {
    cacheEnabled: true,
    cacheTTL: 3600,
    enrichmentEnabled: true,
    marketDataEnabled: true,
    batchSize: 100,
    maxConcurrentRequests: 10,
  };

  assertEquals(config.cacheEnabled, true);
  assertEquals(config.cacheTTL, 3600);
  assertEquals(config.batchSize, 100);
});

Deno.test("CollectionCacheEntry structure", () => {
  const cacheEntry: CollectionCacheEntry = {
    collection: {
      collection_id: "123",
      collection_name: "Test",
      collection_description: "Test collection",
      creators: ["bc1q..."],
      stamp_count: 5,
      total_editions: 50,
      stamps: [1, 2, 3, 4, 5],
      img: "https://example.com/img.png",
    },
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    hits: 10,
    source: "database",
  };

  assertExists(cacheEntry.cachedAt);
  assertEquals(cacheEntry.hits, 10);
  assertEquals(cacheEntry.source, "database");
});

Deno.test("isCollectionRow type guard", () => {
  const validCollection = {
    collection_id: "123",
    collection_name: "Test",
    collection_description: "Test",
    creators: ["bc1q..."],
    stamp_count: 5,
    total_editions: 50,
    stamps: [1, 2, 3],
    img: "https://example.com/img.png",
  };

  const invalidCollection = {
    collection_id: 123, // Should be string
    collection_name: "Test",
  };

  assertEquals(isCollectionRow(validCollection), true);
  assertEquals(isCollectionRow(invalidCollection), false);
  assertEquals(isCollectionRow(null), false);
  assertEquals(isCollectionRow(undefined), false);
});

Deno.test("isCollectionWithMarketData type guard", () => {
  const collectionWithMarket: CollectionWithOptionalMarketData = {
    collection_id: "123",
    collection_name: "Test",
    collection_description: "Test",
    creators: ["bc1q..."],
    stamp_count: 5,
    total_editions: 50,
    stamps: [1, 2, 3],
    img: "https://example.com/img.png",
    marketData: null,
  };

  const collectionWithoutMarket: CollectionRow = {
    collection_id: "123",
    collection_name: "Test",
    collection_description: "Test",
    creators: ["bc1q..."],
    stamp_count: 5,
    total_editions: 50,
    stamps: [1, 2, 3],
    img: "https://example.com/img.png",
  };

  assertEquals(isCollectionWithMarketData(collectionWithMarket), true);
  assertEquals(isCollectionWithMarketData(collectionWithoutMarket), false);
});