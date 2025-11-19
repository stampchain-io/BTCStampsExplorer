/**
 * Centralized fixture data loader for test factories
 * Loads real fixture data to make tests more realistic and maintainable
 */

import stampFixtures from "../../fixtures/stampData.json" with { type: "json" };
import marketDataFixtures from "../../fixtures/marketData.json" with {
  type: "json",
};
import collectionFixtures from "../../fixtures/collectionData.json" with {
  type: "json",
};
import src20Fixtures from "../../fixtures/src20Data.json" with { type: "json" };

export interface FixturePool<T> {
  getRandomItem(): T;
  getItemByIndex(index: number): T;
  getAllItems(): T[];
  count(): number;
}

class FixturePoolImpl<T> implements FixturePool<T> {
  constructor(private items: T[]) {}

  getRandomItem(): T {
    if (this.items.length === 0) {
      throw new Error("No fixture items available");
    }
    const randomIndex = Math.floor(Math.random() * this.items.length);
    return this.items[randomIndex];
  }

  getItemByIndex(index: number): T {
    if (index < 0 || index >= this.items.length) {
      throw new Error(
        `Index ${index} out of bounds for fixture pool with ${this.items.length} items`,
      );
    }
    return this.items[index];
  }

  getAllItems(): T[] {
    return [...this.items];
  }

  count(): number {
    return this.items.length;
  }
}

// Fixture pools for different data types
export const StampFixtures = {
  regular: new FixturePoolImpl(stampFixtures.regularStamps),
  cursed: new FixturePoolImpl(stampFixtures.cursedStamps),
  all: new FixturePoolImpl([
    ...stampFixtures.regularStamps,
    ...stampFixtures.cursedStamps,
  ]),
};

export const MarketDataFixtures = {
  stampMarketData: new FixturePoolImpl(marketDataFixtures.stampMarketData),
  src20MarketData: new FixturePoolImpl(
    marketDataFixtures.src20MarketData || [],
  ),
};

export const CollectionFixtures = {
  collections: new FixturePoolImpl(collectionFixtures.collections),
};

export const SRC20Fixtures = {
  valid: new FixturePoolImpl(src20Fixtures.src20Valid || []),
  all: new FixturePoolImpl(src20Fixtures.src20All || []),
  tokenStats: new FixturePoolImpl(src20Fixtures.tokenStats || []),
  metadata: new FixturePoolImpl(src20Fixtures.metadata || []),
};

// Utility functions for common fixture operations
export function getRandomStamp(type: "regular" | "cursed" | "all" = "all") {
  return StampFixtures[type].getRandomItem();
}

export function getRandomMarketData(type: "stamp" | "src20" = "stamp") {
  return type === "stamp"
    ? MarketDataFixtures.stampMarketData.getRandomItem()
    : MarketDataFixtures.src20MarketData.getRandomItem();
}

export function getRandomCollection() {
  return CollectionFixtures.collections.getRandomItem();
}

export function getRandomSRC20Token() {
  return SRC20Fixtures.valid.getRandomItem();
}

export function getRandomSRC20Stats() {
  return SRC20Fixtures.tokenStats.getRandomItem();
}

// Helper to create realistic Bitcoin addresses from fixtures
export function getRealisticBitcoinAddresses() {
  const stamps = StampFixtures.all.getAllItems().slice(0, 10);
  return stamps.map((stamp) => stamp.creator).filter(Boolean);
}

// Helper to create realistic transaction hashes from fixtures
export function getRealisticTxHashes() {
  const stamps = StampFixtures.all.getAllItems().slice(0, 10);
  return stamps.map((stamp) => stamp.tx_hash).filter(Boolean);
}

// Helper to create realistic CPIDs from fixtures
export function getRealisticCPIDs() {
  const stamps = StampFixtures.all.getAllItems().slice(0, 10);
  return stamps.map((stamp) => stamp.cpid).filter(Boolean);
}
