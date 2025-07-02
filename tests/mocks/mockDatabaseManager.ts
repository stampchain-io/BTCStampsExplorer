import stampFixturesData from "../fixtures/stampData.json" with {
  type: "json",
};
import marketDataFixturesData from "../fixtures/marketData.json" with {
  type: "json",
};
import src20FixturesData from "../fixtures/src20Data.json" with {
  type: "json",
};
import collectionFixturesData from "../fixtures/collectionData.json" with {
  type: "json",
};

interface QueryResult {
  rows: any[];
  [key: string]: any;
}

/**
 * Mock implementation of DatabaseManager for unit testing.
 * Returns fixture data instead of executing real database queries.
 */
export class MockDatabaseManager {
  private queryHistory: Array<{ query: string; params: unknown[] }> = [];
  private mockResponses: Map<string, QueryResult> = new Map();

  /**
   * Execute a query and return mocked results based on the query pattern
   */
  executeQuery<T>(query: string, params: unknown[]): Promise<T> {
    // Log the query for verification in tests
    this.queryHistory.push({ query, params });

    // Get mock data (which checks for custom responses first)
    const result = this.getMockDataForQuery(query, params);
    return Promise.resolve(result as T);
  }

  /**
   * Execute a query with cache - same as executeQuery for mock
   */
  executeQueryWithCache<T>(
    query: string,
    params: unknown[],
    _cacheDuration: number | "never",
  ): Promise<T> {
    // In mock, cache duration is ignored
    return this.executeQuery<T>(query, params);
  }

  /**
   * Set a specific mock response for a query pattern
   */
  setMockResponse(
    query: string,
    params: unknown[],
    response: QueryResult,
  ): void {
    const key = this.generateMockKey(query, params);
    this.mockResponses.set(key, response);
  }

  /**
   * Get the history of queries that were executed
   */
  getQueryHistory(): Array<{ query: string; params: unknown[] }> {
    return [...this.queryHistory];
  }

  /**
   * Clear query history
   */
  clearQueryHistory(): void {
    this.queryHistory = [];
  }

  /**
   * Clear all mock responses
   */
  clearMockResponses(): void {
    this.mockResponses.clear();
  }

  /**
   * Generate a unique key for a query + params combination
   */
  private generateMockKey(query: string, params: unknown[]): string {
    return `${query.trim().toLowerCase()}::${JSON.stringify(params)}`;
  }

  /**
   * Return appropriate mock data based on the query pattern
   */
  private getMockDataForQuery(query: string, params: unknown[]): QueryResult {
    const normalizedQuery = query.toLowerCase();

    // Check if there's a specific mock response set first
    const mockKey = this.generateMockKey(query, params);
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey)!;
    }

    // Count queries - Check BEFORE collection queries since count queries may contain "from collections"
    const hasCountClause = normalizedQuery.includes("count(*)") ||
      normalizedQuery.includes("count(distinct");
    const hasAsTotal = normalizedQuery.includes("as total");
    const noHex = !normalizedQuery.includes("hex(");
    const noGroupConcat = !normalizedQuery.includes("group_concat");

    const isCountQuery = hasCountClause && hasAsTotal && noHex && noGroupConcat;

    if (isCountQuery) {
      return this.getCountData(normalizedQuery, params);
    }

    // Collection queries - check AFTER count queries
    if (
      normalizedQuery.includes("from collections") ||
      normalizedQuery.includes("collections c") ||
      normalizedQuery.includes("hex(c.collection_id)") // Specific to collection queries
    ) {
      return this.getCollectionData(normalizedQuery, params);
    }

    // Stamp queries (non-count)
    if (
      normalizedQuery.includes("from stamps") ||
      normalizedQuery.includes("from stampstablev4") ||
      normalizedQuery.includes("stampstablev4") ||
      normalizedQuery.includes("st.stamp") // Common pattern in stamp queries
    ) {
      return this.getStampData(normalizedQuery, params);
    }

    // Market data queries
    if (normalizedQuery.includes("from stamp_market_data")) {
      return this.getStampMarketData(normalizedQuery, params);
    }

    if (normalizedQuery.includes("from src20_market_data")) {
      return this.getSrc20MarketData(normalizedQuery, params);
    }

    // SRC-20 queries
    if (
      normalizedQuery.includes("from src20valid") ||
      normalizedQuery.includes("from balances") ||
      normalizedQuery.includes("src20_balance") ||
      normalizedQuery.includes("src20valid") // Also match table name without FROM
    ) {
      return this.getSrc20Data(normalizedQuery, params);
    }

    // Creator queries
    if (normalizedQuery.includes("from creator")) {
      return this.getCreatorData(normalizedQuery, params);
    }

    // Block queries
    if (normalizedQuery.includes("from blocks")) {
      return this.getBlockData(normalizedQuery, params);
    }

    // INSERT/UPDATE queries
    if (
      normalizedQuery.includes("insert") || normalizedQuery.includes("update")
    ) {
      return this.getMutationResult(normalizedQuery, params);
    }

    // Default empty result
    return { rows: [] };
  }

  /**
   * Get stamp data from fixtures
   */
  private getStampData(query: string, params: unknown[]): QueryResult {
    const stampFixtures = stampFixturesData as any;
    let stamps = [
      ...stampFixtures.regularStamps,
      ...stampFixtures.cursedStamps,
      ...stampFixtures.src20Stamps,
      ...stampFixtures.stampsWithMarketData,
    ];

    const normalizedQuery = query.toLowerCase();

    // Filter by stamp type based on WHERE clause
    if (normalizedQuery.includes("where")) {
      // Regular stamps filter: (st.stamp >= 0 AND st.ident != 'SRC-20')
      if (
        normalizedQuery.includes("st.stamp >= 0") &&
        normalizedQuery.includes("st.ident != 'src-20'")
      ) {
        stamps = stamps.filter((s) => s.stamp >= 0 && s.ident !== "SRC-20");
      } // Cursed stamps filter: (st.stamp < 0)
      else if (normalizedQuery.includes("st.stamp < 0")) {
        stamps = stamps.filter((s) => s.stamp < 0);
      } // Filter by CPID if present
      else if (normalizedQuery.includes("cpid")) {
        const cpidIndex = params.findIndex((p) =>
          typeof p === "string" && p.length > 0
        );
        if (cpidIndex >= 0) {
          const cpid = params[cpidIndex];
          stamps = stamps.filter((s) => s.cpid === cpid);
        }
      } // Filter by stamp number if present
      else if (normalizedQuery.includes("stamp =")) {
        const stampIndex = params.findIndex((p) => typeof p === "number");
        if (stampIndex >= 0) {
          const stampNum = params[stampIndex];
          stamps = stamps.filter((s) => s.stamp === stampNum);
        }
      }
    }

    // Apply limit if present
    if (normalizedQuery.includes("limit")) {
      const limitMatch = query.match(/limit\s+(\d+|\?)/i);
      if (limitMatch) {
        const limitIndex = params.length - 2; // Usually second to last param
        const limit = params[limitIndex] as number || 100;
        stamps = stamps.slice(0, limit);
      }
    }

    return { rows: stamps };
  }

  /**
   * Get stamp market data from fixtures
   */
  private getStampMarketData(query: string, params: unknown[]): QueryResult {
    const marketDataFixtures = marketDataFixturesData as any;
    let marketData = [...marketDataFixtures.stampMarketData];

    // Filter by CPID if present
    if (query.includes("where") && query.includes("cpid")) {
      const cpidIndex = params.findIndex((p) =>
        typeof p === "string" && p.length > 0
      );
      if (cpidIndex >= 0) {
        const cpid = params[cpidIndex];
        marketData = marketData.filter((m) => m.cpid === cpid);
      }
    }

    // Handle IN clause for bulk queries
    if (query.includes("cpid in")) {
      marketData = marketData.filter((m) => params.includes(m.cpid));
    }

    return { rows: marketData };
  }

  /**
   * Get SRC-20 market data from fixtures
   */
  private getSrc20MarketData(query: string, params: unknown[]): QueryResult {
    const marketDataFixtures = marketDataFixturesData as any;
    let marketData = [...marketDataFixtures.src20MarketData];

    // Filter by tick if present
    if (query.includes("where") && query.includes("tick")) {
      const tickIndex = params.findIndex((p) => typeof p === "string");
      if (tickIndex >= 0) {
        const tick = params[tickIndex];
        marketData = marketData.filter((m) => m.tick === tick);
      }
    }

    return { rows: marketData };
  }

  /**
   * Get SRC-20 data from fixtures
   */
  private getSrc20Data(query: string, params: unknown[]): QueryResult {
    const normalizedQuery = query.toLowerCase();
    const src20Fixtures = src20FixturesData as any;

    // Handle balance queries
    if (
      normalizedQuery.includes("src20_balance") ||
      normalizedQuery.includes("balances")
    ) {
      // Return mock balance data
      return {
        rows: [{
          address: "bc1test",
          p: "src-20",
          tick: "PEPE",
          amt: "1000000",
          block_time: "2024-01-01T00:00:00Z",
          last_update: "2024-01-01T00:00:00Z",
        }],
      };
    }

    const src20Data = src20Fixtures.src20Valid ||
      src20Fixtures.src20Transactions || [];

    // Special handling for mint progress queries (fetchSrc20MintProgress)
    if (
      normalizedQuery.includes("src20_token_stats") ||
      (normalizedQuery.includes("dep.tick") &&
        normalizedQuery.includes("dep.max") &&
        normalizedQuery.includes("dep.deci") &&
        normalizedQuery.includes("op = 'deploy'"))
    ) {
      // Get the requested tick from params
      const requestedTick = params[0] as string;

      // For mint progress queries, only return data for ticks that exist in fixtures
      // The fixture has a DEPLOY transaction with tick "!"
      if (requestedTick === "!" || requestedTick === "\\U00000021") {
        const deployTx = src20Data.find((tx: any) =>
          tx.op === "DEPLOY" && tx.tick === "!"
        );
        if (deployTx) {
          return {
            rows: [{
              max: deployTx.max || "1000000",
              deci: deployTx.deci || 18,
              lim: deployTx.lim || "1000",
              tx_hash: deployTx.tx_hash || "mock_tx_hash",
              tick: deployTx.tick, // This should be "!"
              total_minted: "500000",
              holders_count: 100,
              total_mints: 50,
            }],
          };
        }
      }

      // For any other tick (including NOPE!, undefined, etc.), return empty rows
      return { rows: [] };
    }

    // Filter based on query parameters
    let filtered = [...src20Data];

    // Apply filters based on params
    if (normalizedQuery.includes("where")) {
      // Filter by tick
      if (
        normalizedQuery.includes("tick =") ||
        normalizedQuery.includes("tick in")
      ) {
        const tickParams = params.filter((p) =>
          typeof p === "string" && p.length > 2
        );
        if (tickParams.length > 0) {
          filtered = filtered.filter((tx) => tickParams.includes(tx.tick));
        }
      }

      // Filter by op
      if (
        normalizedQuery.includes("op =") || normalizedQuery.includes("op in")
      ) {
        const opParams = params.filter((p) =>
          typeof p === "string" &&
          ["DEPLOY", "MINT", "TRANSFER"].includes(p as string)
        );
        if (opParams.length > 0) {
          filtered = filtered.filter((tx) => opParams.includes(tx.op));
        }
      }
    }

    // Apply limit
    if (normalizedQuery.includes("limit")) {
      const limitIndex = params.findIndex((p) =>
        typeof p === "number" && p > 0 && p < 1000
      );
      if (limitIndex >= 0) {
        const limit = params[limitIndex] as number;
        filtered = filtered.slice(0, limit);
      }
    }

    return { rows: filtered };
  }

  /**
   * Get collection data from fixtures
   */
  private getCollectionData(query: string, params: unknown[]): QueryResult {
    const normalizedQuery = query.toLowerCase();
    const collectionFixtures = collectionFixturesData as any;

    // Check if there's a specific mock response set for collection queries
    const mockKey = this.generateMockKey(query, params);
    if (this.mockResponses.has(mockKey)) {
      const mockResponse = this.mockResponses.get(mockKey)!;
      // Special handling for getCollectionDetails - apply post-processing
      if (
        normalizedQuery.includes("hex(c.collection_id)") && mockResponse.rows
      ) {
        return {
          ...mockResponse,
          rows: mockResponse.rows,
        };
      }
      return mockResponse;
    }

    // Handle collection by name - check this BEFORE general collection details
    if (normalizedQuery.includes("where c.collection_name = ?")) {
      const collectionName = params[0] as string;
      const collections = collectionFixtures.collections || [];

      const collection = collections.find(
        (c: any) => c.collection_name === collectionName,
      );

      if (collection) {
        const collectionCreators = collectionFixtures.collectionCreators || [];
        const collectionStamps = collectionFixtures.collectionStamps || [];

        const creators = collectionCreators
          .filter((cc: any) => cc.collection_id === collection.collection_id)
          .map((cc: any) => cc.creator_address);

        const stamps = collectionStamps
          .filter((cs: any) => cs.collection_id === collection.collection_id)
          .map((cs: any) => cs.stamp);

        // Check if this is a detailed query with HEX() and GROUP_CONCAT
        if (
          normalizedQuery.includes("hex(c.collection_id)") &&
          normalizedQuery.includes("group_concat")
        ) {
          return {
            rows: [{
              collection_id: collection.collection_id,
              collection_name: collection.collection_name,
              collection_description: collection.collection_description,
              creators: creators.join(","),
              stamp_count: stamps.length.toString(),
              stamp_numbers: stamps.join(","),
              total_editions: (stamps.length * 100).toString(),
            }],
          };
        }

        // Simple collection by name query
        return {
          rows: [{
            collection_id: collection.collection_id,
            collection_name: collection.collection_name,
            collection_description: collection.collection_description,
            creators: creators.join(","),
            stamp_count: stamps.length.toString(),
            total_editions: (stamps.length * 100).toString(),
          }],
        };
      }
      // Return empty rows for non-existent collections
      return { rows: [] };
    }

    // Handle collection details queries with joins
    if (
      normalizedQuery.includes("hex(c.collection_id)") &&
      normalizedQuery.includes("collections c")
    ) {
      const collections = collectionFixtures.collections || [];
      const collectionCreators = collectionFixtures.collectionCreators || [];
      const collectionStamps = collectionFixtures.collectionStamps || [];

      // Check if this is a market data query
      const includesMarketData =
        normalizedQuery.includes("cmd.min_floor_price_btc") ||
        normalizedQuery.includes("stamp_market_data");

      // Transform collection data with creators and stamps
      const transformedCollections = collections.map((collection: any) => {
        // Find creators for this collection
        const creators = collectionCreators
          .filter((cc: any) => cc.collection_id === collection.collection_id)
          .map((cc: any) => cc.creator_address);

        // Find stamps for this collection
        const stamps = collectionStamps
          .filter((cs: any) => cs.collection_id === collection.collection_id)
          .map((cs: any) => cs.stamp);

        const baseData = {
          collection_id: collection.collection_id,
          collection_name: collection.collection_name,
          collection_description: collection.collection_description,
          creators: creators.join(","),
          stamp_numbers: stamps.join(","),
          stamp_count: stamps.length.toString(),
          total_editions: (stamps.length * 100).toString(), // Mock total editions
        };

        // Add market data fields if query includes them
        if (includesMarketData) {
          return {
            ...baseData,
            minFloorPriceBTC: "0.001",
            maxFloorPriceBTC: "0.01",
            avgFloorPriceBTC: "0.005",
            medianFloorPriceBTC: null,
            totalVolume24hBTC: "0.5",
            stampsWithPricesCount: stamps.length.toString(),
            minHolderCount: "5",
            maxHolderCount: "20",
            avgHolderCount: "12.5",
            medianHolderCount: null,
            totalUniqueHolders: "50",
            avgDistributionScore: "0.75",
            totalStampsCount: stamps.length.toString(),
            marketDataLastUpdated: "2024-01-01T00:00:00Z",
          };
        }

        return baseData;
      });

      // Apply filters
      let filteredData = transformedCollections;

      // Filter by creator if specified
      if (
        normalizedQuery.includes("where cc.creator_address = ?") && params[0]
      ) {
        const creatorAddress = params[0];
        filteredData = filteredData.filter((c: any) =>
          c.creators.includes(creatorAddress)
        );
      }

      // Filter by minimum stamp count if HAVING clause is present
      if (normalizedQuery.includes("having count(distinct cs.stamp) >= ?")) {
        const minStampCountIndex = params.findIndex((p: any, idx: number) =>
          typeof p === "number" &&
          idx > 0 && // Skip first param if it's for creator filter
          p > 0
        );
        if (minStampCountIndex >= 0) {
          const minStampCount = params[minStampCountIndex] as number;
          filteredData = filteredData.filter((c: any) =>
            parseInt(c.stamp_count) >= minStampCount
          );
        }
      }

      // Handle pagination
      const limitMatch = normalizedQuery.match(/limit\s+\?/i);
      const offsetMatch = normalizedQuery.match(/offset\s+\?/i);
      if (limitMatch && offsetMatch) {
        const limit = params[params.length - 2] as number;
        const offset = params[params.length - 1] as number;
        filteredData = filteredData.slice(offset, offset + limit);
      }

      return { rows: filteredData };
    }

    // Handle collection names query
    if (
      normalizedQuery.includes("select") &&
      normalizedQuery.includes("collection_name")
    ) {
      const collections = collectionFixtures.collections || [];
      const names = collections.map((c: any) => ({
        collection_name: c.collection_name,
      }));

      // Handle pagination
      const limitMatch = normalizedQuery.match(/limit\s+\?/i);
      const offsetMatch = normalizedQuery.match(/offset\s+\?/i);
      if (limitMatch && offsetMatch) {
        const limit = params[params.length - 2] as number;
        const offset = params[params.length - 1] as number;
        return { rows: names.slice(offset, offset + limit) };
      }

      return { rows: names };
    }

    // Default - return all collections
    const collections = collectionFixtures.collections || [];
    return { rows: collections };
  }

  /**
   * Get creator data from fixtures
   */
  private getCreatorData(query: string, params: unknown[]): QueryResult {
    const stampFixtures = stampFixturesData as any;
    const creators = stampFixtures.creators || [];

    // Filter by address if present
    if (query.includes("where") && params.length > 0) {
      const address = params[0] as string;
      const creator = creators.find((c: any) => c.address === address);
      if (creator) {
        return { rows: [{ creator: creator.creator }] };
      }
      return { rows: [] };
    }

    return { rows: creators };
  }

  /**
   * Get block data - return mock block data
   */
  private getBlockData(_query: string, _params: unknown[]): QueryResult {
    // Return mock block data
    const mockBlock = {
      block_index: 827424,
      block_time: "2024-01-26T10:36:03.000Z",
      block_hash:
        "00000000000000000000c2a3b5e8f6d4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      previous_block_hash:
        "00000000000000000000b1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
      ledger_hash: "abcdef1234567890",
      txlist_hash: "1234567890abcdef",
      messages_hash: "fedcba0987654321",
    };

    return { rows: [mockBlock] };
  }

  /**
   * Get count data - return appropriate counts based on query
   */
  private getCountData(query: string, params: unknown[]): QueryResult {
    const normalizedQuery = query.toLowerCase();
    const src20Fixtures = src20FixturesData as any;
    const collectionFixtures = collectionFixturesData as any;

    if (
      normalizedQuery.includes("from stamps") ||
      normalizedQuery.includes("stampstablev4") ||
      normalizedQuery.includes("stamptablev4") ||
      normalizedQuery.includes("count(*) as total") // Common count pattern
    ) {
      const stampFixtures = stampFixturesData as any;
      let stamps = [
        ...stampFixtures.regularStamps,
        ...stampFixtures.cursedStamps,
        ...stampFixtures.src20Stamps,
        ...stampFixtures.stampsWithMarketData,
      ];

      // Apply same filters as getStampData for consistent counting
      if (normalizedQuery.includes("where")) {
        if (
          normalizedQuery.includes("st.stamp >= 0") &&
          normalizedQuery.includes("st.ident != 'src-20'")
        ) {
          stamps = stamps.filter((s: any) =>
            s.stamp >= 0 && s.ident !== "SRC-20"
          );
        } else if (normalizedQuery.includes("st.stamp < 0")) {
          stamps = stamps.filter((s: any) => s.stamp < 0);
        }
      }

      return { rows: [{ total: stamps.length }] };
    }

    if (
      normalizedQuery.includes("from src20valid") ||
      normalizedQuery.includes("src20valid")
    ) {
      // Return total SRC-20 transactions
      const src20Data = src20Fixtures.src20Valid ||
        src20Fixtures.src20Transactions || [];
      return { rows: [{ total: src20Data.length }] };
    }

    if (
      normalizedQuery.includes("src20_balance") ||
      normalizedQuery.includes("balances")
    ) {
      // For balance count queries, return based on fixture data
      const src20Data = src20Fixtures.src20Valid ||
        src20Fixtures.src20Transactions || [];
      return { rows: [{ total: src20Data.length }] };
    }

    if (
      normalizedQuery.includes("from collections") ||
      normalizedQuery.includes("count(distinct c.collection_id)")
    ) {
      const collections = collectionFixtures.collections || [];
      const collectionCreators = collectionFixtures.collectionCreators || [];

      // Check if filtering by creator
      if (
        normalizedQuery.includes("join collection_creators") &&
        params.length > 0
      ) {
        const creatorAddress = params[0];
        const creatorCollectionIds = collectionCreators
          .filter((cc: any) => cc.creator_address === creatorAddress)
          .map((cc: any) => cc.collection_id);

        const filteredCollections = collections.filter((c: any) =>
          creatorCollectionIds.includes(c.collection_id)
        );

        return { rows: [{ total: filteredCollections.length }] };
      }

      // Check for minimum stamp count filter (with subquery)
      if (normalizedQuery.includes("having count(distinct cs.stamp) >= ?")) {
        const collectionStamps = collectionFixtures.collectionStamps || [];
        const minStampCount = params[params.length - 1] as number;

        // Count stamps per collection
        const collectionStampCounts = new Map<string, number>();
        collectionStamps.forEach((cs: any) => {
          const count = collectionStampCounts.get(cs.collection_id) || 0;
          collectionStampCounts.set(cs.collection_id, count + 1);
        });

        // Filter collections by minimum stamp count
        const filteredCount = collections.filter((c: any) => {
          const stampCount = collectionStampCounts.get(c.collection_id) || 0;
          return stampCount >= minStampCount;
        }).length;

        return { rows: [{ total: filteredCount }] };
      }

      return { rows: [{ total: collections.length }] };
    }

    // Default count
    return { rows: [{ total: 0 }] };
  }

  /**
   * Verify that a query was called with specific parameters
   */
  verifyQueryCalled(
    queryPattern: string | RegExp,
    params?: unknown[],
  ): boolean {
    return this.queryHistory.some(({ query, params: queryParams }) => {
      const queryMatches = typeof queryPattern === "string"
        ? query.toLowerCase().includes(queryPattern.toLowerCase())
        : queryPattern.test(query);

      if (!queryMatches) return false;

      if (params) {
        return JSON.stringify(queryParams) === JSON.stringify(params);
      }

      return true;
    });
  }

  /**
   * Get the number of times a query pattern was called
   */
  getQueryCallCount(queryPattern: string | RegExp): number {
    return this.queryHistory.filter(({ query }) => {
      return typeof queryPattern === "string"
        ? query.toLowerCase().includes(queryPattern.toLowerCase())
        : queryPattern.test(query);
    }).length;
  }

  /**
   * Get result for INSERT/UPDATE/DELETE queries
   */
  private getMutationResult(_query: string, _params: unknown[]): QueryResult {
    // Return a successful mutation result by default
    return {
      rows: [],
      affectedRows: 1,
      insertId: 1,
    };
  }
}
