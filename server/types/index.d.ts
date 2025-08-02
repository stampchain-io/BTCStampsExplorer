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

// Core type exports with import for type preservation
export type DatabaseSchema = import('./database.d.ts').DatabaseSchema;
export type TableDefinitions = import('./database.d.ts').TableDefinitions;
export type TableDefinition = import('./database.d.ts').TableDefinition;
export type ColumnDefinitions = import('./database.d.ts').ColumnDefinitions;
export type ColumnDefinition = import('./database.d.ts').ColumnDefinition;
export type ColumnType = import('./database.d.ts').ColumnType;
export type DatabaseEngine = import('./database.d.ts').DatabaseEngine;

// Index and constraint type exports
export type IndexDefinitions = import('./database.d.ts').IndexDefinitions;
export type IndexDefinition = import('./database.d.ts').IndexDefinition;
export type IndexColumn = import('./database.d.ts').IndexColumn;
export type IndexType = import('./database.d.ts').IndexType;
export type IndexAlgorithm = import('./database.d.ts').IndexAlgorithm;
export type ConstraintDefinitions = import('./database.d.ts').ConstraintDefinitions;
export type ConstraintDefinition = import('./database.d.ts').ConstraintDefinition;
export type ConstraintType = import('./database.d.ts').ConstraintType;
export type ReferentialAction = import('./database.d.ts').ReferentialAction;

// Query building type exports
export type QueryBuilder = import('./database.d.ts').QueryBuilder;
export type SelectQueryBuilder = import('./database.d.ts').SelectQueryBuilder;
export type InsertQueryBuilder = import('./database.d.ts').InsertQueryBuilder;
export type UpdateQueryBuilder = import('./database.d.ts').UpdateQueryBuilder;
export type DeleteQueryBuilder = import('./database.d.ts').DeleteQueryBuilder;
export type WhereCondition = import('./database.d.ts').WhereCondition;
export type WhereOperator = import('./database.d.ts').WhereOperator;
export type JoinCondition = import('./database.d.ts').JoinCondition;
export type ComparisonOperator = import('./database.d.ts').ComparisonOperator;
export type OrderDirection = import('./database.d.ts').OrderDirection;

// Query result type exports
export type QueryResult = import('./database.d.ts').QueryResult;
export type InsertResult = import('./database.d.ts').InsertResult;
export type UpdateResult = import('./database.d.ts').UpdateResult;
export type DeleteResult = import('./database.d.ts').DeleteResult;
export type FieldInfo = import('./database.d.ts').FieldInfo;

// ORM and model type exports
export type Model = import('./database.d.ts').Model;
export type ModelCasts = import('./database.d.ts').ModelCasts;
export type CastType = import('./database.d.ts').CastType;
export type ModelRelations = import('./database.d.ts').ModelRelations;
export type RelationDefinition = import('./database.d.ts').RelationDefinition;
export type RelationType = import('./database.d.ts').RelationType;
export type ModelQueryBuilder = import('./database.d.ts').ModelQueryBuilder;
export type PaginatedResult = import('./database.d.ts').PaginatedResult;
export type ModelLifecycleHooks = import('./database.d.ts').ModelLifecycleHooks;
export type QueryScope = import('./database.d.ts').QueryScope;

// Database connection type exports
export type DatabaseConnection = import('./database.d.ts').DatabaseConnection;
export type DatabaseType = import('./database.d.ts').DatabaseType;
export type DatabaseConnectionConfig = import('./database.d.ts').DatabaseConnectionConfig;
export type PoolConfig = import('./database.d.ts').PoolConfig;
export type Transaction = import('./database.d.ts').Transaction;
export type SQLDatabase = import('./database.d.ts').SQLDatabase;
export type NoSQLDatabase = import('./database.d.ts').NoSQLDatabase;
export type RedisDatabase = import('./database.d.ts').RedisDatabase;

// Collection type exports
export type Collection = import('./database.d.ts').Collection;
export type FindOptions = import('./database.d.ts').FindOptions;
export type UpdateOptions = import('./database.d.ts').UpdateOptions;
export type IndexOptions = import('./database.d.ts').IndexOptions;
export type CollectionOptions = import('./database.d.ts').CollectionOptions;
export type InsertOneResult = import('./database.d.ts').InsertOneResult;
export type InsertManyResult = import('./database.d.ts').InsertManyResult;
export type UpdateOneResult = import('./database.d.ts').UpdateOneResult;
export type UpdateManyResult = import('./database.d.ts').UpdateManyResult;
export type DeleteOneResult = import('./database.d.ts').DeleteOneResult;
export type DeleteManyResult = import('./database.d.ts').DeleteManyResult;

// Migration type exports
export type Migration = import('./database.d.ts').Migration;
export type MigrationOperation = import('./database.d.ts').MigrationOperation;
export type MigrationOperationType = import('./database.d.ts').MigrationOperationType;
export type SchemaBuilder = import('./database.d.ts').SchemaBuilder;
export type TableBuilder = import('./database.d.ts').TableBuilder;
export type ColumnBuilder = import('./database.d.ts').ColumnBuilder;
export type ForeignKeyBuilder = import('./database.d.ts').ForeignKeyBuilder;
export type MigrationRunner = import('./database.d.ts').MigrationRunner;
export type MigrationResult = import('./database.d.ts').MigrationResult;
export type MigrationStatus = import('./database.d.ts').MigrationStatus;
export type SeedRunner = import('./database.d.ts').SeedRunner;
export type SeedResult = import('./database.d.ts').SeedResult;
export type SeedStatus = import('./database.d.ts').SeedStatus;

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
  CollectionWithCreators,
  CollectionWithOptionalMarketData,
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
  PaginatedCollectionWithMarketDataResponseBody,
  
  // Collection processing
  CollectionProcessor,
  CollectionProcessingOptions,
  CollectionProcessingResult,
  CollectionProcessingError,
  CollectionProcessingMetrics,
  
  // Collection aggregation
  CollectionAggregator,
  CollectionMarketDataAggregation,
  CollectionMetrics,
  CreatorStatistics,
  CollectionSummary,
  RankingOptions,
  CollectionRanking,
  
  // Collection indexing
  CollectionIndex,
  CollectionSearchQuery,
  CollectionSortField,
  
  // Collection validation
  CollectionValidator,
  CollectionValidationRules,
  CollectionValidationError,
  CollectionValidationErrorCode,
  
  // Collection service
  CollectionServiceConfig,
  CollectionServiceOptions,
  CollectionCreateParams,
  CollectionUpdateParams,
  CollectionServiceResult,
  
  // Collection caching
  CollectionCacheEntry,
  CollectionCacheStats,
  CollectionCacheOptions,
  
  // Type guards
  isCollectionRow,
  isCollectionWithMarketData,
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
// Note: Database-related types are already exported above in the Core Database Infrastructure Types section

// Namespace for backwards compatibility
export namespace Database {
  export type Connection = DatabaseConnection;
  export type Type = DatabaseType;
  export type ConnectionConfig = DatabaseConnectionConfig;
  export type DatabaseTransaction = Transaction;
  export type Result = QueryResult;
  export type Schema = DatabaseSchema;
  export type TableDef = TableDefinition;
  export type ColumnDef = ColumnDefinition;
  export type IndexDef = IndexDefinition;
  export type ConstraintDef = ConstraintDefinition;
  export type QueryBuilderType = QueryBuilder;
  export type SelectQueryBuilderType = SelectQueryBuilder;
  export type InsertQueryBuilderType = InsertQueryBuilder;
  export type UpdateQueryBuilderType = UpdateQueryBuilder;
  export type DeleteQueryBuilderType = DeleteQueryBuilder;
  export type ModelType = Model;
  export type ModelQueryBuilderType = ModelQueryBuilder;
  export type RepositoryType = Repository;
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
  export type RepositoryType = import('./database.d.ts').Repository;
  export type StampRepository = import('./database.d.ts').StampRepository;
  export type SRC20Repository = import('./database.d.ts').SRC20Repository;
  export type TransactionRepository = import('./database.d.ts').TransactionRepository;
  export type FindAllOptions = import('./database.d.ts').FindAllOptions;
  export type OrderBy = import('./database.d.ts').OrderBy;
  export type StampStatistics = import('./database.d.ts').StampStatistics;
  export type SRC20TokenStats = import('./database.d.ts').SRC20TokenStats;
  export type FeeStatistics = import('./database.d.ts').FeeStatistics;
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
  export type CollectionRow = import('./collection.d.ts').CollectionRow;
  export type CollectionWithCreators = import('./collection.d.ts').CollectionWithCreators;
  export type CollectionWithOptionalMarketData = import('./collection.d.ts').CollectionWithOptionalMarketData;
  export type CollectionQueryParams = import('./collection.d.ts').CollectionQueryParams;
  export type PaginatedCollectionResponseBody = import('./collection.d.ts').PaginatedCollectionResponseBody;
  export type PaginatedCollectionWithMarketDataResponseBody = import('./collection.d.ts').PaginatedCollectionWithMarketDataResponseBody;
  
  export type CollectionProcessor = import('./collection.d.ts').CollectionProcessor;
  export type CollectionProcessingOptions = import('./collection.d.ts').CollectionProcessingOptions;
  export type CollectionProcessingResult = import('./collection.d.ts').CollectionProcessingResult;
  export type CollectionProcessingError = import('./collection.d.ts').CollectionProcessingError;
  export type CollectionProcessingMetrics = import('./collection.d.ts').CollectionProcessingMetrics;
  
  export type CollectionAggregator = import('./collection.d.ts').CollectionAggregator;
  export type CollectionMarketDataAggregation = import('./collection.d.ts').CollectionMarketDataAggregation;
  export type CollectionMetrics = import('./collection.d.ts').CollectionMetrics;
  export type CreatorStatistics = import('./collection.d.ts').CreatorStatistics;
  export type CollectionSummary = import('./collection.d.ts').CollectionSummary;
  export type RankingOptions = import('./collection.d.ts').RankingOptions;
  export type CollectionRanking = import('./collection.d.ts').CollectionRanking;
  
  export type CollectionIndex = import('./collection.d.ts').CollectionIndex;
  export type CollectionSearchQuery = import('./collection.d.ts').CollectionSearchQuery;
  export type CollectionSortField = import('./collection.d.ts').CollectionSortField;
  
  export type CollectionValidator = import('./collection.d.ts').CollectionValidator;
  export type CollectionValidationRules = import('./collection.d.ts').CollectionValidationRules;
  export type CollectionValidationError = import('./collection.d.ts').CollectionValidationError;
  export type CollectionValidationErrorCode = import('./collection.d.ts').CollectionValidationErrorCode;
  
  export type CollectionServiceConfig = import('./collection.d.ts').CollectionServiceConfig;
  export type CollectionServiceOptions = import('./collection.d.ts').CollectionServiceOptions;
  export type CollectionCreateParams = import('./collection.d.ts').CollectionCreateParams;
  export type CollectionUpdateParams = import('./collection.d.ts').CollectionUpdateParams;
  export type CollectionServiceResult = import('./collection.d.ts').CollectionServiceResult;
  
  export type CollectionCacheEntry = import('./collection.d.ts').CollectionCacheEntry;
  export type CollectionCacheStats = import('./collection.d.ts').CollectionCacheStats;
  export type CollectionCacheOptions = import('./collection.d.ts').CollectionCacheOptions;
  
  export const isCollectionRow = import('./collection.d.ts').isCollectionRow;
  export const isCollectionWithMarketData = import('./collection.d.ts').isCollectionWithMarketData;
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
  export type QueryPerformanceMetrics = import('./database.d.ts').QueryPerformanceMetrics;
  export type QueryWarning = import('./database.d.ts').QueryWarning;
  export type ConnectionPoolStatistics = import('./database.d.ts').ConnectionPoolStatistics;
  export type DatabaseHealthCheck = import('./database.d.ts').DatabaseHealthCheck;
  export type HealthStatus = import('./database.d.ts').HealthStatus;
  export type HealthCheckResult = import('./database.d.ts').HealthCheckResult;
  export type PerformanceMetrics = import('./database.d.ts').PerformanceMetrics;
  export type StorageMetrics = import('./database.d.ts').StorageMetrics;
  export type ReplicationStatus = import('./database.d.ts').ReplicationStatus;
  export type BackupOperation = import('./database.d.ts').BackupOperation;
  export type RestoreOperation = import('./database.d.ts').RestoreOperation;
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
  export type Migration = import('./database.d.ts').Migration;
  export type MigrationOperation = import('./database.d.ts').MigrationOperation;
  export type MigrationOperationType = import('./database.d.ts').MigrationOperationType;
  export type SchemaBuilder = import('./database.d.ts').SchemaBuilder;
  export type TableBuilder = import('./database.d.ts').TableBuilder;
  export type ColumnBuilder = import('./database.d.ts').ColumnBuilder;
  export type ForeignKeyBuilder = import('./database.d.ts').ForeignKeyBuilder;
  export type MigrationRunner = import('./database.d.ts').MigrationRunner;
  export type MigrationResult = import('./database.d.ts').MigrationResult;
  export type MigrationStatus = import('./database.d.ts').MigrationStatus;
  
  // Bitcoin-specific schemas
  export type StampTableSchema = import('./database.d.ts').StampTableSchema;
  export type SRC20TokenTableSchema = import('./database.d.ts').SRC20TokenTableSchema;
  export type SRC20BalanceTableSchema = import('./database.d.ts').SRC20BalanceTableSchema;
  export type TransactionTableSchema = import('./database.d.ts').TransactionTableSchema;
  export type BlockTableSchema = import('./database.d.ts').BlockTableSchema;
  export type UTXOTableSchema = import('./database.d.ts').UTXOTableSchema;
  export type WalletBalanceTableSchema = import('./database.d.ts').WalletBalanceTableSchema;
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
// Note: DatabaseConnectionConfig and Migration already exported above

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