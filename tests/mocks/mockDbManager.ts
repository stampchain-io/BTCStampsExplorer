/**
 * Mock implementation of database manager for testing
 */

export interface MockDbConfig {
  queryResults?: Map<string, any>;
  shouldThrowError?: boolean;
  errorMessage?: string;
}

export class MockDbManager {
  private config: MockDbConfig;
  private queryCallCount = 0;
  private queryHistory: Array<{ query: string; params: any[] }> = [];

  constructor(config: MockDbConfig = {}) {
    this.config = config;
  }

  executeQuery(query: string, params: any[] = []) {
    this.queryHistory.push({ query, params });
    this.queryCallCount++;

    if (this.config.shouldThrowError) {
      throw new Error(this.config.errorMessage || "Database error");
    }

    // Return configured result based on query pattern
    if (this.config.queryResults) {
      for (const [pattern, result] of this.config.queryResults) {
        if (query.includes(pattern)) {
          return Promise.resolve(result);
        }
      }
    }

    return Promise.resolve({ rows: [], rowCount: 0, affectedRows: 0 });
  }

  executeQueryWithCache(
    query: string,
    params: any[] = [],
    _cacheKey?: string,
    _cacheDuration?: number,
  ) {
    // Delegate to executeQuery for simplicity in tests
    return this.executeQuery(query, params);
  }

  getQueryCallCount() {
    return this.queryCallCount;
  }

  getQueryHistory() {
    return this.queryHistory;
  }

  reset() {
    this.queryCallCount = 0;
    this.queryHistory = [];
  }
}

/**
 * Create a mock database manager with preset responses
 */
export function createMockDbManager(config: MockDbConfig = {}) {
  return new MockDbManager(config);
}
