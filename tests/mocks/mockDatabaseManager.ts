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
import blockFixturesData from "../fixtures/blockData.json" with {
  type: "json",
};
import src101FixturesData from "../fixtures/src101Data.json" with {
  type: "json",
};
import { MAX_PAGINATION_LIMIT } from "$constants";

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
    // Normalize whitespace - replace multiple spaces/newlines with single space
    const normalizedQuery = query.trim().toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\s*;\s*$/, ""); // Remove trailing semicolon
    return `${normalizedQuery}::${JSON.stringify(params)}`;
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
    // Only treat as count query if it's a simple SELECT COUNT query, not complex WITH clauses
    const hasCountClause = normalizedQuery.includes("count(*)") ||
      normalizedQuery.includes("count(distinct");
    const hasAsTotal = normalizedQuery.includes("as total");
    const noHex = !normalizedQuery.includes("hex(");
    const noGroupConcat = !normalizedQuery.includes("group_concat");
    const noWithClause = !normalizedQuery.includes("with "); // Don't treat complex WITH queries as count queries
    const isSimpleSelect = normalizedQuery.trim().startsWith("select"); // Must be a simple SELECT

    const isCountQuery = hasCountClause && (hasAsTotal || true) && noHex &&
      noGroupConcat && noWithClause && isSimpleSelect;

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

    // SRC-101 queries
    if (
      normalizedQuery.includes("from src101") ||
      normalizedQuery.includes("src101") ||
      normalizedQuery.includes("from owners") ||
      normalizedQuery.includes("from recipients") ||
      normalizedQuery.includes("from src101price") ||
      normalizedQuery.includes("src101price") ||
      normalizedQuery.includes("recipients") ||
      normalizedQuery.includes("owners")
    ) {
      return this.getSrc101Data(normalizedQuery, params);
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
        const limit = params[limitIndex] as number || MAX_PAGINATION_LIMIT;
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

    // Handle balance queries - but only simple balance queries, not complex WITH clauses
    if (
      (normalizedQuery.includes("src20_balance") ||
        normalizedQuery.includes("from balances")) &&
      !normalizedQuery.includes("with ") && // Don't match complex WITH queries
      normalizedQuery.trim().startsWith("select") // Must be a simple SELECT
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
        const tickParams = params.filter((p) => typeof p === "string" // Remove length restriction to allow single character ticks like "!" and "?"
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
   * Get SRC-101 data from fixtures
   */
  private getSrc101Data(query: string, params: unknown[]): QueryResult {
    const normalizedQuery = query.toLowerCase();
    const src101Fixtures = src101FixturesData as any;

    // Handle price queries
    if (normalizedQuery.includes("src101price")) {
      const deployHash = params[0] as string;
      const prices = src101Fixtures.src101_prices || [];
      const filteredPrices = prices.filter((p: any) =>
        p.deploy_hash === deployHash
      );

      // Transform into expected result format
      const result: any = {};
      filteredPrices.forEach((row: any) => {
        result[row.len] = row.price;
      });

      return { rows: filteredPrices };
    }

    // Handle recipients queries
    if (normalizedQuery.includes("recipients")) {
      const deployHash = params[0] as string;
      const recipients = src101Fixtures.src101_recipients || [];
      const filteredRecipients = recipients.filter((r: any) =>
        r.deploy_hash === deployHash
      );
      return { rows: filteredRecipients };
    }

    // Handle owners queries
    if (normalizedQuery.includes("owners")) {
      const owners = src101Fixtures.src101_owners || [];
      let filteredOwners = [...owners];

      // Filter by owner address if present
      if (
        normalizedQuery.includes("where owner = ?") ||
        normalizedQuery.includes("owner = ?")
      ) {
        const ownerAddress = params[0] as string;
        filteredOwners = filteredOwners.filter((o: any) =>
          o.owner === ownerAddress
        );
      }

      // Filter by deploy_hash if present
      if (normalizedQuery.includes("deploy_hash = ?")) {
        // Look for the deploy hash in params - could be at any position
        let deployHash: string | undefined;

        // First check if there's a timestamp parameter (number) to skip it
        const timestampIndex = params.findIndex((p) =>
          typeof p === "number" && p > 1000000
        );

        // Find the deploy hash parameter (string that's not a timestamp)
        for (let i = 0; i < params.length; i++) {
          if (typeof params[i] === "string" && i !== timestampIndex) {
            deployHash = params[i] as string;
            break;
          }
        }

        if (deployHash) {
          filteredOwners = filteredOwners.filter((o: any) =>
            o.deploy_hash === deployHash
          );
        }
      }

      // Apply limit if present
      if (normalizedQuery.includes("limit")) {
        const limitIndex = params.findIndex((p) =>
          typeof p === "number" && p > 0
        );
        if (limitIndex >= 0) {
          const limit = params[limitIndex] as number;
          filteredOwners = filteredOwners.slice(0, limit);
        }
      }

      return { rows: filteredOwners };
    }

    // Handle deploy details queries
    if (
      normalizedQuery.includes("where tx_hash = ?") &&
      normalizedQuery.includes("op")
    ) {
      const txHash = params[0] as string;
      const transactions = src101Fixtures.src101_transactions || [];
      const transaction = transactions.find((t: any) => t.tx_hash === txHash);

      if (transaction) {
        // Add recipients from fixtures
        const recipients = src101Fixtures.src101_recipients
          .filter((r: any) => r.deploy_hash === txHash)
          .map((r: any) => r.address);

        return {
          rows: [{
            ...transaction,
            recipients,
          }],
        };
      }
      return { rows: [] };
    }

    // Handle general transaction queries (from src101 table)
    const transactions = src101Fixtures.src101_transactions || [];
    let filteredTransactions = [...transactions];

    // Apply filters based on params
    if (normalizedQuery.includes("where")) {
      // Filter by tick
      if (
        normalizedQuery.includes("tick = ?") ||
        normalizedQuery.includes("tick collate")
      ) {
        const tickIndex = params.findIndex((p) => typeof p === "string");
        if (tickIndex >= 0) {
          const tick = params[tickIndex];
          filteredTransactions = filteredTransactions.filter((t: any) =>
            t.tick === tick
          );
        }
      }

      // Filter by op
      if (normalizedQuery.includes("op = ?")) {
        const opIndex = params.findIndex((p) =>
          typeof p === "string" &&
          ["DEPLOY", "MINT", "TRANSFER"].includes(p as string)
        );
        if (opIndex >= 0) {
          const op = params[opIndex];
          filteredTransactions = filteredTransactions.filter((t: any) =>
            t.op === op
          );
        }
      }

      // Filter by deploy_hash
      if (normalizedQuery.includes("deploy_hash = ?")) {
        const deployHashIndex = params.findIndex((p) =>
          typeof p === "string" && p.startsWith("c")
        );
        if (deployHashIndex >= 0) {
          const deployHash = params[deployHashIndex];
          filteredTransactions = filteredTransactions.filter((t: any) =>
            t.deploy_hash === deployHash
          );
        }
      }

      // Filter by block_index
      if (normalizedQuery.includes("block_index = ?")) {
        const blockIndex = params.findIndex((p) => typeof p === "number");
        if (blockIndex >= 0) {
          const block = params[blockIndex];
          filteredTransactions = filteredTransactions.filter((t: any) =>
            t.block_index === block
          );
        }
      }

      // Filter by valid status
      if (normalizedQuery.includes("status is null")) {
        filteredTransactions = filteredTransactions.filter((t: any) =>
          t.status === null
        );
      } else if (normalizedQuery.includes("status is not null")) {
        filteredTransactions = filteredTransactions.filter((t: any) =>
          t.status !== null
        );
      }
    }

    // Apply limit
    if (normalizedQuery.includes("limit")) {
      const limitIndex = params.findIndex((p) =>
        typeof p === "number" && p > 0 && p < 1000
      );
      if (limitIndex >= 0) {
        const limit = params[limitIndex] as number;
        filteredTransactions = filteredTransactions.slice(0, limit);
      }
    }

    return { rows: filteredTransactions };
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
   * Get block data from fixtures
   */
  private getBlockData(query: string, params: unknown[]): QueryResult {
    const normalizedQuery = query.toLowerCase();
    const blockFixtures = blockFixturesData as any;
    const blocks = blockFixtures.blocks || [];
    const stampCounts = blockFixtures.stampCounts || [];

    // Handle MAX(block_index) query for getLastBlockFromDb
    if (normalizedQuery.includes("max(block_index)")) {
      if (blocks.length > 0) {
        const maxBlockIndex = Math.max(
          ...blocks.map((b: any) => b.block_index),
        );
        return { rows: [{ last_block: maxBlockIndex }] };
      }
      return { rows: [{ last_block: null }] };
    }

    // Handle query by block index or hash for getBlockInfoFromDb
    if (normalizedQuery.includes("where")) {
      if (
        normalizedQuery.includes("block_index = ?") && params[0] !== undefined
      ) {
        const blockIndex = Number(params[0]);
        const block = blocks.find((b: any) => b.block_index === blockIndex);
        return { rows: block ? [block] : [] };
      } else if (normalizedQuery.includes("block_hash = ?") && params[0]) {
        const blockHash = params[0] as string;
        const block = blocks.find((b: any) => b.block_hash === blockHash);
        if (
          normalizedQuery.includes("select block_index") &&
          normalizedQuery.includes("from blocks") &&
          normalizedQuery.includes("limit 1")
        ) {
          // This is for _getBlockIndexByHash - returns as number[]
          return block ? [block.block_index] as any : [] as any;
        }
        return { rows: block ? [block] : [] };
      }
    }

    // Handle getLastXBlocksFromDb - ORDER BY block_index DESC LIMIT ?
    if (
      normalizedQuery.includes("order by block_index desc") &&
      normalizedQuery.includes("limit") &&
      !normalizedQuery.includes("where")
    ) {
      const limit = params[0] as number || 10;
      const sortedBlocks = [...blocks].sort((a, b) =>
        b.block_index - a.block_index
      );
      const limitedBlocks = sortedBlocks.slice(0, limit);

      // This query also includes stamp counts, so we need to add tx_count
      if (
        normalizedQuery.includes("select") &&
        normalizedQuery.includes("block_index")
      ) {
        const result = limitedBlocks.map((block: any) => {
          const stampData = stampCounts.find((sc: any) =>
            sc.block_index === block.block_index
          );
          return {
            ...block,
            tx_count: stampData ? stampData.tx_count : 0,
          };
        });
        return { rows: result };
      }

      return { rows: limitedBlocks };
    }

    // Handle getRelatedBlocksWithStampsFromDb - blocks around a specific block
    if (
      normalizedQuery.includes("where block_index >= ? - 2") &&
      normalizedQuery.includes("and block_index <= ? + 2")
    ) {
      // The params are both the same block_index, and SQL does the arithmetic
      const centerIndex = params[0] as number;
      const startIndex = centerIndex - 2;
      const endIndex = centerIndex + 2;

      const relatedBlocks = blocks.filter((b: any) =>
        b.block_index >= startIndex && b.block_index <= endIndex
      );

      // Add stamp counts if this is a stamp count query
      if (normalizedQuery.includes("count(*) as stampcount")) {
        const stampCountData = stampCounts.filter((sc: any) =>
          sc.block_index >= startIndex && sc.block_index <= endIndex
        ).map((sc: any) => ({
          block_index: sc.block_index,
          stampcount: sc.stampcount || sc.tx_count || 0,
        }));
        return { rows: stampCountData };
      }

      return { rows: relatedBlocks };
    }

    // Default - return all blocks
    return { rows: blocks };
  }

  /**
   * Handle COUNT queries across different tables
   */
  private getCountData(query: string, params: unknown[]): QueryResult {
    const normalizedQuery = query.toLowerCase();

    // SRC101 count queries
    if (
      normalizedQuery.includes("from src101") ||
      normalizedQuery.includes("src101")
    ) {
      // Filter by tick if present
      if (normalizedQuery.includes("tick")) {
        return { rows: [{ total: 3 }] }; // 3 transactions with BITNAME tick
      }
      return { rows: [{ total: 4 }] }; // Total 4 transactions
    }

    if (normalizedQuery.includes("from owners")) {
      const src101Fixtures = src101FixturesData as any;
      const owners = src101Fixtures.src101_owners || [];

      // Check if query uses AS total
      const usesAsTotal = normalizedQuery.includes("as total");

      // Filter by owner if present (check this BEFORE deploy_hash)
      if (normalizedQuery.includes("where owner = ?")) {
        const ownerAddress = params[0] as string;
        const count = owners.filter((o: any) =>
          o.owner === ownerAddress
        ).length;
        return { rows: [{ [usesAsTotal ? "total" : "COUNT(*)"]: count }] };
      }

      // Filter by deploy_hash if present
      if (normalizedQuery.includes("deploy_hash = ?")) {
        const deployHash = params[0] as string;
        const count = owners.filter((o: any) =>
          o.deploy_hash === deployHash
        ).length;
        return { rows: [{ [usesAsTotal ? "total" : "COUNT(*)"]: count }] };
      }

      return {
        rows: [{ [usesAsTotal ? "total" : "COUNT(*)"]: owners.length }],
      };
    }

    // Stamp count queries
    if (
      normalizedQuery.includes("from stamps") ||
      normalizedQuery.includes("stampstablev4") ||
      normalizedQuery.includes("stamptablev4") || // Handle both variations
      normalizedQuery.includes("from stamptablev4") // Handle exact table name with FROM
    ) {
      // Check if this is counting cursed vs regular stamps
      if (normalizedQuery.includes("stamp < 0")) {
        return { rows: [{ total: 20 }] }; // Number of cursed stamps
      } else if (normalizedQuery.includes("stamp >= 0")) {
        return { rows: [{ total: 80 }] }; // Number of regular stamps
      }
      return { rows: [{ total: 100 }] }; // Total stamps
    }

    // Collection count queries
    if (
      normalizedQuery.includes("from collections") ||
      normalizedQuery.includes("collections")
    ) {
      const collectionFixtures = collectionFixturesData as any;
      const collections = collectionFixtures.collections || [];

      // Check for creator filter
      if (normalizedQuery.includes("creator_address = ?")) {
        const creatorAddress = params[0] as string;
        const collectionCreators = collectionFixtures.collectionCreators || [];
        const creatorCollectionIds = collectionCreators
          .filter((cc: any) => cc.creator_address === creatorAddress)
          .map((cc: any) => cc.collection_id);
        const count = collections.filter((c: any) =>
          creatorCollectionIds.includes(c.collection_id)
        ).length;
        return { rows: [{ total: count }] };
      }

      return { rows: [{ total: collections.length }] };
    }

    // SRC-20 count queries
    if (
      normalizedQuery.includes("from src20valid") ||
      normalizedQuery.includes("src20valid")
    ) {
      return { rows: [{ total: 50 }] }; // Mock SRC-20 count
    }

    // Block count queries
    if (normalizedQuery.includes("from blocks")) {
      return { rows: [{ total: 20 }] }; // Mock block count
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
