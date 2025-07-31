/**
 * BTCStampsExplorer Server Type Definitions - Public API
 * 
 * This file provides the main entry point for all server-side type definitions
 * used throughout the BTCStampsExplorer backend services. Types are organized by
 * functional domains and exported using TypeScript 5.3+ patterns for Node.js compatibility.
 * 
 * @fileoverview Public API exports for server-side type definitions
 * @version 2.0.0
 * @author BTCStampsExplorer Team
 * 
 * Usage:
 * ```typescript
 * import type { DatabaseConnection, CollectionRow, ServiceConfig } from '@server/types';
 * import type { Database } from '@server/types'; // Namespace import
 * ```
 * 
 * Export Organization:
 * - Database Types: Schema, connections, query builders, ORM interfaces
 * - Collection Types: Collection data structures and operations
 * - Service Types: Backend service configurations and interfaces
 * - Repository Types: Data access patterns and CRUD operations
 * - Performance Types: Monitoring, metrics, and health checks
 */

// ============================================================================
// Core Database Infrastructure Types
// ============================================================================

export type {
  // Database schema and structure
  DatabaseSchema,
  TableDefinitions,
  TableDefinition,
  ColumnDefinitions,
  ColumnDefinition,
  ColumnType,
  DatabaseEngine,
  
  // Index and constraint definitions
  IndexDefinitions,
  IndexDefinition,
  IndexColumn,
  IndexType,
  IndexAlgorithm,
  ConstraintDefinitions,
  ConstraintDefinition,
  ConstraintType,
  ReferentialAction,
  
  // Query building interfaces
  QueryBuilder,
  SelectQueryBuilder,
  InsertQueryBuilder,
  UpdateQueryBuilder,
  DeleteQueryBuilder,
  WhereCondition,
  WhereOperator,
  JoinCondition,
  ComparisonOperator,
  OrderDirection,
  
  // Query results and execution
  QueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
  FieldInfo,
} from "./database.d.ts";

export type {
  // ORM and model definitions
  Model,
  ModelCasts,
  CastType,
  ModelRelations,
  RelationDefinition,
  RelationType,
  ModelQueryBuilder,
  PaginatedResult,
  ModelLifecycleHooks,
  QueryScope,
  
  // Database connections and transactions
  DatabaseConnection,
  DatabaseType,
  DatabaseConnectionConfig,
  PoolConfig,
  Transaction,
  SQLDatabase,
  NoSQLDatabase,
  RedisDatabase,
  
  // Collection operations (MongoDB)
  Collection,
  FindOptions,
  UpdateOptions,
  IndexOptions,
  CollectionOptions,
  InsertOneResult,
  InsertManyResult,
  UpdateOneResult,
  UpdateManyResult,
  DeleteOneResult,
  DeleteManyResult,
} from "./database.d.ts";

export type {
  // Migration system types
  Migration,
  MigrationOperation,
  MigrationOperationType,
  SchemaBuilder,
  TableBuilder,
  ColumnBuilder,
  ForeignKeyBuilder,
  MigrationRunner,
  MigrationResult,
  MigrationStatus,
  SeedRunner,
  SeedResult,
  SeedStatus,
} from "./database.d.ts";

// ============================================================================
// Bitcoin Stamps Specific Database Schema Types
// ============================================================================

export type {
  // Core table schemas
  StampTableSchema,
  SRC20TokenTableSchema,
  SRC20TokenStatus,
  SRC20BalanceTableSchema,
  SRC20TransferTableSchema,
  SRC20TransferType,
  TransferStatus,
  TransactionTableSchema,
  BlockTableSchema,
  UTXOTableSchema,
  WalletBalanceTableSchema,
} from "./database.d.ts";

// ============================================================================
// Collection Management Types
// ============================================================================

export type {
  // Core collection data structures
  CollectionRow,
  CollectionWithOptionalMarketData,
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
  PaginatedCollectionWithMarketDataResponseBody,
} from "./collection.d.ts";

// ============================================================================
// Repository Pattern Types
// ============================================================================

export type {
  // Generic repository interfaces
  Repository,
  FindAllOptions,
  OrderBy,
  
  // Bitcoin-specific repositories
  StampRepository,
  SRC20Repository,
  TransactionRepository,
  
  // Statistics and metrics
  StampStatistics,
  SRC20TokenStats,
  FeeStatistics,
} from "./database.d.ts";

// ============================================================================
// Performance Monitoring & Health Check Types
// ============================================================================

export type {
  // Query performance and monitoring
  QueryPerformanceMetrics,
  QueryWarning,
  ConnectionPoolStatistics,
  DatabaseHealthCheck,
  HealthStatus,
  HealthCheckResult,
  PerformanceMetrics,
  StorageMetrics,
  ReplicationStatus,
  
  // Backup and restore operations
  BackupOperation,
  BackupType,
  BackupStatus,
  CompressionType,
  RestoreOperation,
  RestoreStatus,
  RestoreOptions,
} from "./database.d.ts";

// ============================================================================
// Service Integration Types
// ============================================================================

/**
 * Re-export service types from services/index.ts
 * This allows unified imports for all service-related types
 */
export * from "./services/index.ts";

// ============================================================================
// Namespace Exports for Organized Server-Side Access
// ============================================================================

/**
 * Database-related types organized under a namespace
 * 
 * Usage:
 * ```typescript
 * import type { Database } from '@server/types';
 * 
 * const connection: Database.DatabaseConnection = { ... };
 * const schema: Database.TableDefinition = { ... };
 * ```
 */
export namespace Database {
  export {
    type DatabaseConnection,
    type DatabaseType,
    type DatabaseConnectionConfig,
    type Transaction,
    type QueryResult,
    
    type DatabaseSchema,
    type TableDefinition,
    type ColumnDefinition,
    type IndexDefinition,
    type ConstraintDefinition,
    
    type QueryBuilder,
    type SelectQueryBuilder,
    type InsertQueryBuilder,
    type UpdateQueryBuilder,
    type DeleteQueryBuilder,
    
    type Model,
    type ModelQueryBuilder,
    type Repository,
  } from "./database.d.ts";
}

/**
 * Repository pattern types organized under a namespace
 * 
 * Usage:
 * ```typescript
 * import type { Repository } from '@server/types';
 * 
 * const stampRepo: Repository.StampRepository = { ... };
 * const src20Repo: Repository.SRC20Repository = { ... };
 * ```
 */
export namespace Repository {
  export {
    type Repository,
    type StampRepository,
    type SRC20Repository,
    type TransactionRepository,
    type FindAllOptions,
    type OrderBy,
    type StampStatistics,
    type SRC20TokenStats,
    type FeeStatistics,
  } from "./database.d.ts";
}

/**
 * Collection management types organized under a namespace
 * 
 * Usage:
 * ```typescript
 * import type { Collections } from '@server/types';
 * 
 * const collection: Collections.CollectionRow = { ... };
 * const params: Collections.CollectionQueryParams = { ... };
 * ```
 */
export namespace Collections {
  export {
    type CollectionRow,
    type CollectionWithOptionalMarketData,
    type CollectionQueryParams,
    type PaginatedCollectionResponseBody,
    type PaginatedCollectionWithMarketDataResponseBody,
  } from "./collection.d.ts";
}

/**
 * Performance monitoring types organized under a namespace
 * 
 * Usage:
 * ```typescript
 * import type { Monitoring } from '@server/types';
 * 
 * const metrics: Monitoring.QueryPerformanceMetrics = { ... };
 * const health: Monitoring.DatabaseHealthCheck = { ... };
 * ```
 */
export namespace Monitoring {
  export {
    type QueryPerformanceMetrics,
    type QueryWarning,
    type ConnectionPoolStatistics,
    type DatabaseHealthCheck,
    type HealthStatus,
    type HealthCheckResult,
    type PerformanceMetrics,
    type StorageMetrics,
    type ReplicationStatus,
    type BackupOperation,
    type RestoreOperation,
  } from "./database.d.ts";
}

/**
 * Schema management types organized under a namespace
 * 
 * Usage:
 * ```typescript
 * import type { Schema } from '@server/types';
 * 
 * const migration: Schema.Migration = { ... };
 * const builder: Schema.SchemaBuilder = { ... };
 * ```
 */
export namespace Schema {
  export {
    type Migration,
    type MigrationOperation,
    type MigrationOperationType,
    type SchemaBuilder,
    type TableBuilder,
    type ColumnBuilder,
    type ForeignKeyBuilder,
    type MigrationRunner,
    type MigrationResult,
    type MigrationStatus,
    
    // Bitcoin-specific schemas
    type StampTableSchema,
    type SRC20TokenTableSchema,
    type SRC20BalanceTableSchema,
    type TransactionTableSchema,
    type BlockTableSchema,
    type UTXOTableSchema,
    type WalletBalanceTableSchema,
  } from "./database.d.ts";
}

// ============================================================================
// Server Environment Configuration Types
// ============================================================================

/**
 * Server environment and configuration types
 * These types help ensure proper server configuration and deployment
 */
export interface ServerEnvironment {
  /** Application environment mode */
  NODE_ENV: "development" | "production" | "test" | "staging";
  
  /** Server port configuration */
  PORT: number;
  HOST?: string;
  
  /** Database configuration */
  DATABASE_URL: string;
  DATABASE_HOST?: string;
  DATABASE_PORT?: number;
  DATABASE_NAME?: string;
  DATABASE_USER?: string;
  DATABASE_PASSWORD?: string;
  
  /** Redis configuration */
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  
  /** External service URLs */
  BITCOIN_NODE_URL?: string;
  COUNTERPARTY_API_URL?: string;
  
  /** Security and authentication */
  JWT_SECRET?: string;
  API_KEY?: string;
  
  /** Monitoring and logging */
  LOG_LEVEL?: "error" | "warn" | "info" | "debug";
  ENABLE_METRICS?: boolean;
  METRICS_PORT?: number;
  
  /** Performance tuning */
  DATABASE_POOL_SIZE?: number;
  REQUEST_TIMEOUT?: number;
  CACHE_TTL?: number;
}

/**
 * Server startup configuration
 */
// Re-export key types needed for configuration
export type { DatabaseConnectionConfig, Migration } from "./database.d.ts";

export interface ServerConfig {
  environment: ServerEnvironment;
  database: DatabaseConnectionConfig;
  redis?: DatabaseConnectionConfig;
  services: ServiceConfiguration;
  monitoring: MonitoringConfiguration;
  security: SecurityConfiguration;
}

export interface ServiceConfiguration {
  bitcoinNode: {
    url: string;
    timeout: number;
    retries: number;
  };
  counterpartyApi: {
    url: string;
    timeout: number;
    retries: number;
  };
  marketData: {
    enabled: boolean;
    refreshInterval: number;
    sources: string[];
  };
}

export interface MonitoringConfiguration {
  enabled: boolean;
  port: number;
  healthCheck: {
    interval: number;
    timeout: number;
  };
  metrics: {
    enabled: boolean;
    endpoint: string;
  };
  logging: {
    level: string;
    format: "json" | "text";
    destination: "console" | "file" | "both";
  };
}

export interface SecurityConfiguration {
  cors: {
    enabled: boolean;
    origins: string[];
    credentials: boolean;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  authentication: {
    required: boolean;
    jwtSecret?: string;
    tokenExpiry: number;
  };
}

// ============================================================================
// Legacy Compatibility & Migration Support
// ============================================================================

/**
 * Legacy database types for backward compatibility
 * @deprecated Use new Database namespace types instead
 */
export interface LegacyDatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Migration helper types for upgrading from legacy systems
 */
export interface DatabaseMigrationPlan {
  version: string;
  fromVersion: string;
  toVersion: string;
  migrations: Migration[];
  rollbackPlan: Migration[];
  dataTransformations: DataTransformation[];
  validationRules: ValidationRule[];
}

export interface DataTransformation {
  table: string;
  operation: "rename" | "split" | "merge" | "convert";
  source: string | string[];
  target: string | string[];
  transformer: (data: any) => any;
}

export interface ValidationRule {
  table: string;
  rule: string;
  description: string;
  validator: (data: any) => boolean;
}

// ============================================================================
// Module Type Validation
// ============================================================================

/**
 * Type-only assertion to ensure all exports are type-only
 * This prevents accidental runtime imports and supports tree-shaking
 */
declare const __SERVER_TYPE_ONLY_MODULE__: unique symbol;
export type { __SERVER_TYPE_ONLY_MODULE__ };

/**
 * Server-specific module marker
 * Helps distinguish server types from client types in IDE
 */
declare const __SERVER_MODULE_MARKER__: "server-types";
export type { __SERVER_MODULE_MARKER__ };