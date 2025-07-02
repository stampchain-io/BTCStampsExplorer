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

    // Count queries - Check BEFORE stamp queries since count queries may also include table names
    if (
      normalizedQuery.includes("count(*)") ||
      normalizedQuery.includes("count(*) as total")
    ) {
      return this.getCountData(normalizedQuery, params);
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
      normalizedQuery.includes("from balances")
    ) {
      return this.getSrc20Data(normalizedQuery, params);
    }

    // Collection queries
    if (normalizedQuery.includes("from collections")) {
      return this.getCollectionData(normalizedQuery, params);
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
    const src20Fixtures = src20FixturesData as any;
    const src20Data = src20Fixtures.src20Valid ||
      src20Fixtures.src20Transactions || [];

    // Filter based on query parameters
    let filtered = [...src20Data];

    // Apply filters based on params
    if (query.includes("where")) {
      // Filter by tick
      if (query.includes("tick =")) {
        const tickParam = params.find((p) => typeof p === "string");
        if (tickParam) {
          filtered = filtered.filter((tx) => tx.tick === tickParam);
        }
      }

      // Filter by op
      if (query.includes("op =")) {
        const opIndex = params.findIndex((p) =>
          typeof p === "string" &&
          ["DEPLOY", "MINT", "TRANSFER"].includes(p as string)
        );
        if (opIndex >= 0) {
          filtered = filtered.filter((tx) => tx.op === params[opIndex]);
        }
      }
    }

    // Apply limit
    if (query.includes("limit")) {
      const limitIndex = params.length - 2;
      const limit = params[limitIndex] as number || 50;
      filtered = filtered.slice(0, limit);
    }

    return { rows: filtered };
  }

  /**
   * Get collection data from fixtures
   */
  private getCollectionData(_query: string, _params: unknown[]): QueryResult {
    const collectionFixtures = collectionFixturesData as any;
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
  private getCountData(query: string, _params: unknown[]): QueryResult {
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

    if (normalizedQuery.includes("from src20valid")) {
      // Return total SRC-20 transactions
      const src20Data = src20Fixtures.src20Valid ||
        src20Fixtures.src20Transactions || [];
      return { rows: [{ total: src20Data.length }] };
    }

    if (normalizedQuery.includes("from collections")) {
      // Return total collections
      return { rows: [{ total: collectionFixtures.collections?.length || 0 }] };
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
