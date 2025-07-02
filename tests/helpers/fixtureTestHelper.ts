/**
 * Shared test helper for working with fixtures and mocking database calls
 */
import { Stub, stub } from "@std/testing/mock";
import { dbManager } from "$server/database/databaseManager.ts";

export interface MockResponse {
  rows: any[];
  rowCount: number;
  affectedRows?: number;
}

export interface MockConfig {
  method?: "executeQuery" | "executeQueryWithCache";
  response: MockResponse | Error;
  mapFixture?: (data: any) => any;
}

/**
 * FixtureTestHelper provides utilities for mocking database calls with fixture data
 */
export class FixtureTestHelper {
  private stubs: Map<string, Stub> = new Map();

  /**
   * Mock a database call with fixture data
   * @param config Mock configuration
   * @returns The created stub
   */
  mockDbCall(config: MockConfig): Stub {
    const method = config.method || "executeQueryWithCache";

    // Remove existing stub if present
    this.restore(method);

    const stubInstance = stub(
      dbManager,
      method as any,
      () => {
        if (config.response instanceof Error) {
          return Promise.reject(config.response);
        }

        let response = config.response;

        // Apply fixture mapping if provided
        if (config.mapFixture && response.rows) {
          response = {
            ...response,
            rows: response.rows.map(config.mapFixture),
          };
        }

        return Promise.resolve(response);
      },
    );

    this.stubs.set(method, stubInstance);
    return stubInstance;
  }

  /**
   * Mock a cached query with fixture data
   */
  mockCachedQuery(rows: any[], mapFn?: (data: any) => any): Stub {
    return this.mockDbCall({
      method: "executeQueryWithCache",
      response: { rows, rowCount: rows.length },
      mapFixture: mapFn,
    });
  }

  /**
   * Mock a non-cached query with fixture data
   */
  mockQuery(
    rows: any[],
    affectedRows?: number,
    mapFn?: (data: any) => any,
  ): Stub {
    return this.mockDbCall({
      method: "executeQuery",
      response: {
        rows,
        rowCount: rows.length,
        affectedRows: affectedRows ?? rows.length,
      },
      mapFixture: mapFn,
    });
  }

  /**
   * Mock an error response
   */
  mockError(
    error: string | Error,
    method: "executeQuery" | "executeQueryWithCache" = "executeQueryWithCache",
  ): Stub {
    return this.mockDbCall({
      method,
      response: error instanceof Error ? error : new Error(error),
    });
  }

  /**
   * Mock an empty result
   */
  mockEmpty(
    method: "executeQuery" | "executeQueryWithCache" = "executeQueryWithCache",
  ): Stub {
    return this.mockDbCall({
      method,
      response: { rows: [], rowCount: 0 },
    });
  }

  /**
   * Common fixture mappers
   */
  static mappers = {
    /**
     * Add creator_name field to stamp fixtures
     */
    addCreatorName: (stamp: any) => ({
      ...stamp,
      creator_name: null,
    }),

    /**
     * Map to specific fields only
     */
    pickFields: (fields: string[]) => (data: any) => {
      const result: any = {};
      fields.forEach((field) => {
        if (field in data) {
          result[field] = data[field];
        }
      });
      return result;
    },

    /**
     * Add calculated fields
     */
    withCalculatedFields:
      (calculations: Record<string, (data: any) => any>) => (data: any) => {
        const result = { ...data };
        Object.entries(calculations).forEach(([field, calc]) => {
          result[field] = calc(data);
        });
        return result;
      },
  };

  /**
   * Restore a specific stub
   */
  restore(method?: string): void {
    if (method) {
      const stub = this.stubs.get(method);
      if (stub && typeof stub.restore === "function") {
        stub.restore();
      }
      this.stubs.delete(method);
    } else {
      this.restoreAll();
    }
  }

  /**
   * Restore all stubs
   */
  restoreAll(): void {
    this.stubs.forEach((stub) => {
      if (stub && typeof stub.restore === "function") {
        stub.restore();
      }
    });
    this.stubs.clear();
  }

  /**
   * Helper to create a test context with automatic cleanup
   */
  static createTestContext() {
    const helper = new FixtureTestHelper();

    return {
      helper,
      afterEach: () => helper.restoreAll(),
    };
  }
}

/**
 * Pre-configured helpers for common test scenarios
 */
export const fixtureHelpers = {
  /**
   * Mock stamp queries with proper field mapping
   */
  mockStampQuery: (helper: FixtureTestHelper, stamps: any[]) => {
    return helper.mockCachedQuery(
      stamps,
      FixtureTestHelper.mappers.addCreatorName,
    );
  },

  /**
   * Mock market data queries
   */
  mockMarketDataQuery: (helper: FixtureTestHelper, marketData: any[]) => {
    return helper.mockCachedQuery(marketData);
  },

  /**
   * Mock SRC-20 queries
   */
  mockSrc20Query: (helper: FixtureTestHelper, src20Data: any[]) => {
    return helper.mockCachedQuery(src20Data);
  },

  /**
   * Mock count queries
   */
  mockCountQuery: (helper: FixtureTestHelper, count: number) => {
    return helper.mockCachedQuery([{ count: count.toString() }]);
  },
};
