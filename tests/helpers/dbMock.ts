/**
 * Test helper for mocking database manager methods
 */
import { stub } from "@std/testing/mock";
import { dbManager } from "$server/database/databaseManager.ts";

export type QueryResult = {
  rows: any[];
  rowCount: number;
  affectedRows?: number;
};

export type StubConfig = {
  method: "executeQuery" | "executeQueryWithCache";
  response: QueryResult | Error;
};

export class DbMock {
  private stubs: any[] = [];

  /**
   * Mock a database method with a response
   */
  mock(config: StubConfig) {
    const { method, response } = config;

    const stubInstance = stub(
      dbManager,
      method as any,
      () => {
        if (response instanceof Error) {
          return Promise.reject(response);
        }
        return Promise.resolve(response);
      },
    );

    this.stubs.push(stubInstance);
    return stubInstance;
  }

  /**
   * Mock executeQueryWithCache method
   */
  mockQuery(response: QueryResult | Error) {
    return this.mock({
      method: "executeQueryWithCache",
      response,
    });
  }

  /**
   * Mock executeQuery method (for non-cached queries)
   */
  mockExecute(response: QueryResult | Error) {
    return this.mock({
      method: "executeQuery",
      response,
    });
  }

  /**
   * Restore all stubs
   */
  restore() {
    this.stubs.forEach((s) => {
      if (s && typeof s.restore === "function") {
        s.restore();
      }
    });
    this.stubs = [];
  }
}
