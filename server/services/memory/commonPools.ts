/**
 * Common Object Pools for stampchain.io
 * Pre-configured pools for frequently used data structures
 */

import { objectPoolManager } from "$server/services/memory/objectPool.ts";

/**
 * Common data structures that get created/destroyed frequently
 */

// API Response objects
interface APIResponse {
  data?: any;
  status?: number;
  message?: string;
  timestamp?: number;
  reset(): void;
}

// UTXO objects for blockchain operations
interface UTXOData {
  txid?: string;
  vout?: number;
  value?: bigint;
  script?: string;
  confirmations?: number;
  reset(): void;
}

// SRC20 transaction data
interface SRC20TxData {
  tx_hash?: string;
  block_index?: number;
  tick?: string;
  op?: string;
  amt?: bigint;
  from_address?: string;
  to_address?: string;
  status?: string;
  reset(): void;
}

// Stamp data structure
interface StampData {
  stamp?: number;
  block_index?: number;
  cpid?: string;
  creator?: string;
  divisible?: boolean;
  keyburn?: boolean;
  locked?: boolean;
  stamp_base64?: string;
  stamp_mimetype?: string;
  stamp_url?: string;
  supply?: bigint;
  timestamp?: number;
  tx_hash?: string;
  tx_index?: number;
  ident?: string;
  reset(): void;
}

/**
 * Initialize common object pools
 */
export function initializeCommonPools(): void {
  // API Response Pool
  objectPoolManager.registerPool<APIResponse>("apiResponse", {
    maxSize: 100,
    createFn: () => ({
      reset() {
        delete this.data;
        delete this.status;
        delete this.message;
        delete this.timestamp;
      }
    } as APIResponse)
  });

  // UTXO Data Pool
  objectPoolManager.registerPool<UTXOData>("utxoData", {
    maxSize: 200,  // UTXOs are frequently processed
    createFn: () => ({
      reset() {
        delete this.txid;
        delete this.vout;
        delete this.value;
        delete this.script;
        delete this.confirmations;
      }
    } as UTXOData)
  });

  // SRC20 Transaction Pool
  objectPoolManager.registerPool<SRC20TxData>("src20TxData", {
    maxSize: 150,
    createFn: () => ({
      reset() {
        delete this.tx_hash;
        delete this.block_index;
        delete this.tick;
        delete this.op;
        delete this.amt;
        delete this.from_address;
        delete this.to_address;
        delete this.status;
      }
    } as SRC20TxData)
  });

  // Stamp Data Pool
  objectPoolManager.registerPool<StampData>("stampData", {
    maxSize: 100,
    createFn: () => ({
      reset() {
        delete this.stamp;
        delete this.block_index;
        delete this.cpid;
        delete this.creator;
        delete this.divisible;
        delete this.keyburn;
        delete this.locked;
        delete this.stamp_base64;
        delete this.stamp_mimetype;
        delete this.stamp_url;
        delete this.supply;
        delete this.timestamp;
        delete this.tx_hash;
        delete this.tx_index;
        delete this.ident;
      }
    } as StampData)
  });

  // Generic Array Pool (for collecting results)
  objectPoolManager.registerPool<any[]>("genericArray", {
    maxSize: 50,
    createFn: () => [],
    resetFn: (arr) => {
      arr.length = 0;  // Clear array efficiently
    }
  });

  // Generic Object Pool (for building responses)
  objectPoolManager.registerPool<Record<string, any>>("genericObject", {
    maxSize: 75,
    createFn: () => ({}),
    resetFn: (obj) => {
      // Clear all properties
      for (const key in obj) {
        delete obj[key];
      }
    }
  });

  console.log("[ObjectPools] Common object pools initialized");
}

/**
 * Helper functions for using common pools
 */
export class PooledObjectHelpers {
  /**
   * Get a pooled API response object
   */
  static borrowAPIResponse(): APIResponse {
    const pool = objectPoolManager.getPool<APIResponse>("apiResponse");
    return pool?.borrow() || {
      reset() {
        delete this.data;
        delete this.status;
        delete this.message;
        delete this.timestamp;
      }
    } as APIResponse;
  }

  /**
   * Return an API response object to the pool
   */
  static returnAPIResponse(obj: APIResponse): void {
    const pool = objectPoolManager.getPool<APIResponse>("apiResponse");
    pool?.return(obj);
  }

  /**
   * Get a pooled UTXO data object
   */
  static borrowUTXOData(): UTXOData {
    const pool = objectPoolManager.getPool<UTXOData>("utxoData");
    return pool?.borrow() || {
      reset() {
        delete this.txid;
        delete this.vout;
        delete this.value;
        delete this.script;
        delete this.confirmations;
      }
    } as UTXOData;
  }

  /**
   * Return a UTXO data object to the pool
   */
  static returnUTXOData(obj: UTXOData): void {
    const pool = objectPoolManager.getPool<UTXOData>("utxoData");
    pool?.return(obj);
  }

  /**
   * Get a pooled array
   */
  static borrowArray<T>(): T[] {
    const pool = objectPoolManager.getPool<T[]>("genericArray");
    return pool?.borrow() || [];
  }

  /**
   * Return an array to the pool
   */
  static returnArray<T>(arr: T[]): void {
    const pool = objectPoolManager.getPool<T[]>("genericArray");
    pool?.return(arr);
  }

  /**
   * Get a pooled object
   */
  static borrowObject(): Record<string, any> {
    const pool = objectPoolManager.getPool<Record<string, any>>("genericObject");
    return pool?.borrow() || {};
  }

  /**
   * Return an object to the pool
   */
  static returnObject(obj: Record<string, any>): void {
    const pool = objectPoolManager.getPool<Record<string, any>>("genericObject");
    pool?.return(obj);
  }
}

/**
 * Pre-warm all pools for better startup performance
 */
export function warmUpCommonPools(): void {
  const pools = [
    { name: "apiResponse", count: 20 },
    { name: "utxoData", count: 50 },
    { name: "src20TxData", count: 30 },
    { name: "stampData", count: 25 },
    { name: "genericArray", count: 15 },
    { name: "genericObject", count: 20 }
  ];

  for (const { name, count } of pools) {
    const pool = objectPoolManager.getPool(name);
    if (pool) {
      pool.warmUp(count);
      console.log(`[ObjectPools] Pre-warmed ${name} pool with ${count} objects`);
    }
  }
}
