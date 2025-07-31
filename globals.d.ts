declare global {
  interface GlobalThis {
    SKIP_REDIS_CONNECTION: boolean | undefined;
    DENO_BUILD_MODE: boolean | undefined;
    LeatherProvider: {
      request: (method: string, params?: any) => Promise<any>;
      // Add other known properties and methods of LeatherProvider here
    };
    mockTxData: {
      vout: Array<{
        scriptPubKey: {
          type: string;
          hex: string;
        };
      }>;
    };
    Buffer?: typeof import("node:buffer").Buffer;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DENO_ENV?: "development" | "production" | "test";
    DEV_BASE_URL?: string;
    SKIP_REDIS_CONNECTION?: "true" | "false";
    // Add other environment variables here if needed
  }
}

export {};
