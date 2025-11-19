import type { SRC20Balance, SRC20Row } from "$types/src20.d.ts";
import type { StampRow } from "$types/stamp.d.ts";
import type { SendRow } from "$types/transaction.d.ts";

/**
 * Base Database Schema Types
 * Defines fundamental database schema structures and constraints
 */
export interface DatabaseSchema {
  tables: TableDefinitions;
  indexes: IndexDefinitions;
  constraints: ConstraintDefinitions;
  version: string;
}

export interface TableDefinitions {
  [tableName: string]: TableDefinition;
}

import type { ColumnDefinition } from "$types/ui.d.ts";

// Alias for database column definitions
export type UIColumnDefinition = ColumnDefinition<any>;

export interface TableDefinition {
  name: string;
  columns: { [columnName: string]: UIColumnDefinition };
  primaryKey: string[];
  indexes?: IndexDefinition[];
  constraints?: ConstraintDefinition[];
  engine?: DatabaseEngine;
  charset?: string;
  collation?: string;
}

export interface ColumnDefinitions {
  [columnName: string]: UIColumnDefinition;
}

export type DatabaseEngine = "InnoDB" | "MyISAM" | "Memory" | "Archive";

export interface IndexDefinitions {
  [indexName: string]: IndexDefinition;
}

export interface IndexDefinition {
  name: string;
  table: string;
  columns: IndexColumn[];
  type?: IndexType;
  unique?: boolean;
  algorithm?: IndexAlgorithm;
}

export interface IndexColumn {
  column: string;
  length?: number;
  order?: "ASC" | "DESC";
}

export type IndexType = "BTREE" | "HASH" | "FULLTEXT" | "SPATIAL";
export type IndexAlgorithm = "DEFAULT" | "INPLACE" | "COPY";

export interface ConstraintDefinitions {
  [constraintName: string]: ConstraintDefinition;
}

export interface ConstraintDefinition {
  name: string;
  type: ConstraintType;
  table: string;
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

export type ConstraintType = "FOREIGN_KEY" | "CHECK" | "UNIQUE" | "PRIMARY_KEY";
export type ReferentialAction = "CASCADE" | "SET_NULL" | "RESTRICT" | "NO_ACTION" | "SET_DEFAULT";

/**
 * Query Builder Types
 * Type-safe query building interfaces for database operations
 */
export interface QueryBuilder<T = any> {
  select: SelectQueryBuilder<T>;
  insert: InsertQueryBuilder<T>;
  update: UpdateQueryBuilder<T>;
  delete: DeleteQueryBuilder<T>;
}

export interface SelectQueryBuilder<T = any> {
  from(table: string): SelectQueryBuilder<T>;
  select(columns?: keyof T | (keyof T)[] | string | string[]): SelectQueryBuilder<T>;
  where(condition: WhereCondition<T> | string, value?: any): SelectQueryBuilder<T>;
  whereIn(column: keyof T | string, values: any[]): SelectQueryBuilder<T>;
  whereNotIn(column: keyof T | string, values: any[]): SelectQueryBuilder<T>;
  whereBetween(column: keyof T | string, min: any, max: any): SelectQueryBuilder<T>;
  whereNull(column: keyof T | string): SelectQueryBuilder<T>;
  whereNotNull(column: keyof T | string): SelectQueryBuilder<T>;
  join(table: string, on: JoinCondition): SelectQueryBuilder<T>;
  leftJoin(table: string, on: JoinCondition): SelectQueryBuilder<T>;
  rightJoin(table: string, on: JoinCondition): SelectQueryBuilder<T>;
  innerJoin(table: string, on: JoinCondition): SelectQueryBuilder<T>;
  groupBy(columns: keyof T | (keyof T)[] | string | string[]): SelectQueryBuilder<T>;
  having(condition: string): SelectQueryBuilder<T>;
  orderBy(column: keyof T | string, direction?: OrderDirection): SelectQueryBuilder<T>;
  limit(count: number): SelectQueryBuilder<T>;
  offset(count: number): SelectQueryBuilder<T>;
  distinct(): SelectQueryBuilder<T>;
  count(column?: keyof T | string): SelectQueryBuilder<T>;
  sum(column: keyof T | string): SelectQueryBuilder<T>;
  avg(column: keyof T | string): SelectQueryBuilder<T>;
  min(column: keyof T | string): SelectQueryBuilder<T>;
  max(column: keyof T | string): SelectQueryBuilder<T>;
  toSQL(): string;
  execute(): Promise<QueryResult<T>>;
}

export interface InsertQueryBuilder<T = any> {
  into(table: string): InsertQueryBuilder<T>;
  values(data: Partial<T> | Partial<T>[]): InsertQueryBuilder<T>;
  onDuplicateKeyUpdate(data: Partial<T>): InsertQueryBuilder<T>;
  ignore(): InsertQueryBuilder<T>;
  toSQL(): string;
  execute(): Promise<InsertResult>;
}

export interface UpdateQueryBuilder<T = any> {
  table(table: string): UpdateQueryBuilder<T>;
  set(data: Partial<T>): UpdateQueryBuilder<T>;
  where(condition: WhereCondition<T> | string, value?: any): UpdateQueryBuilder<T>;
  whereIn(column: keyof T | string, values: any[]): UpdateQueryBuilder<T>;
  limit(count: number): UpdateQueryBuilder<T>;
  toSQL(): string;
  execute(): Promise<UpdateResult>;
}

export interface DeleteQueryBuilder<T = any> {
  from(table: string): DeleteQueryBuilder<T>;
  where(condition: WhereCondition<T> | string, value?: any): DeleteQueryBuilder<T>;
  whereIn(column: keyof T | string, values: any[]): DeleteQueryBuilder<T>;
  limit(count: number): DeleteQueryBuilder<T>;
  toSQL(): string;
  execute(): Promise<DeleteResult>;
}

export type WhereCondition<T> = {
  [K in keyof T]?: T[K] | WhereOperator<T[K]>;
};

export interface WhereOperator<T> {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $like?: string;
  $notLike?: string;
  $between?: [T, T];
  $notBetween?: [T, T];
  $isNull?: boolean;
  $isNotNull?: boolean;
}

export type JoinCondition = string | {
  left: string;
  operator: ComparisonOperator;
  right: string;
};

export type ComparisonOperator = "=" | "!=" | "<>" | "<" | "<=" | ">" | ">=" | "LIKE" | "NOT LIKE";
export type OrderDirection = "ASC" | "DESC";

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields: FieldInfo[];
  affectedRows?: number;
  insertId?: number;
  warningCount?: number;
}

export interface InsertResult {
  insertId: number;
  affectedRows: number;
  warningCount?: number;
}

export interface UpdateResult {
  affectedRows: number;
  changedRows: number;
  warningCount?: number;
}

export interface DeleteResult {
  affectedRows: number;
  warningCount?: number;
}

export interface FieldInfo {
  name: string;
  type: string;
  length: number;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  default: any;
}

/**
 * ORM Interface Types
 * Object-Relational Mapping interfaces for model definitions and relationships
 */
export interface Model<T = any> {
  tableName: string;
  primaryKey: keyof T | (keyof T)[];
  fillable?: (keyof T)[];
  guarded?: (keyof T)[];
  hidden?: (keyof T)[];
  casts?: ModelCasts<T>;
  timestamps?: boolean;
  createdAt?: keyof T;
  updatedAt?: keyof T;
  deletedAt?: keyof T; // For soft deletes
  relations?: ModelRelations<T>;
}

export type ModelCasts<T> = {
  [K in keyof T]?: CastType;
};

export type CastType =
  | "string" | "number" | "boolean" | "date" | "json"
  | "array" | "decimal" | "integer" | "float";

export interface ModelRelations<T> {
  [relationName: string]: RelationDefinition;
}

export interface RelationDefinition {
  type: RelationType;
  model: string;
  foreignKey?: string;
  localKey?: string;
  pivotTable?: string;
  pivotForeignKey?: string;
  pivotLocalKey?: string;
  through?: string;
  throughForeignKey?: string;
  throughLocalKey?: string;
}

export type RelationType =
  | "hasOne" | "hasMany" | "belongsTo" | "belongsToMany"
  | "hasManyThrough" | "hasOneThrough" | "morphOne" | "morphMany" | "morphTo";

export interface ModelQueryBuilder<T = any> extends SelectQueryBuilder<T> {
  create(data: Omit<T, 'id'>): Promise<T>;
  find(id: number | string): Promise<T | null>;
  findOrFail(id: number | string): Promise<T>;
  first(): Promise<T | null>;
  firstOrFail(): Promise<T>;
  get(): Promise<T[]>;
  paginate(page: number, perPage: number): Promise<PaginatedResult<T>>;
  with(relations: string | string[]): ModelQueryBuilder<T>;
  withCount(relations: string | string[]): ModelQueryBuilder<T>;
  scopes(scopes: string | string[]): ModelQueryBuilder<T>;
  fresh(): ModelQueryBuilder<T>;
  trashed(): ModelQueryBuilder<T>; // For soft deletes
  withTrashed(): ModelQueryBuilder<T>; // For soft deletes
  onlyTrashed(): ModelQueryBuilder<T>; // For soft deletes
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    from: number;
    to: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface ModelLifecycleHooks<T> {
  creating?: (model: Partial<T>) => Promise<void> | void;
  created?: (model: T) => Promise<void> | void;
  updating?: (model: Partial<T>) => Promise<void> | void;
  updated?: (model: T) => Promise<void> | void;
  saving?: (model: Partial<T>) => Promise<void> | void;
  saved?: (model: T) => Promise<void> | void;
  deleting?: (model: T) => Promise<void> | void;
  deleted?: (model: T) => Promise<void> | void;
  restoring?: (model: T) => Promise<void> | void; // For soft deletes
  restored?: (model: T) => Promise<void> | void; // For soft deletes
}

export interface QueryScope<T> {
  [scopeName: string]: (query: ModelQueryBuilder<T>, ...args: any[]) => ModelQueryBuilder<T>;
}

/**
 * Database Migration Types
 * Schema change operations and version control types
 */
export interface Migration {
  id: string;
  name: string;
  version: string;
  description?: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  dependencies?: string[];
  createdAt?: Date;
  executedAt?: Date;
}

export interface MigrationOperation {
  type: MigrationOperationType;
  table?: string;
  column?: string;
  index?: string;
  constraint?: string;
  data?: any;
}

export type MigrationOperationType =
  // Table operations
  | "CREATE_TABLE" | "DROP_TABLE" | "RENAME_TABLE" | "ALTER_TABLE"
  // Column operations
  | "ADD_COLUMN" | "DROP_COLUMN" | "MODIFY_COLUMN" | "RENAME_COLUMN"
  // Index operations
  | "CREATE_INDEX" | "DROP_INDEX" | "RENAME_INDEX"
  // Constraint operations
  | "ADD_CONSTRAINT" | "DROP_CONSTRAINT"
  // Data operations
  | "INSERT_DATA" | "UPDATE_DATA" | "DELETE_DATA"
  // Custom operations
  | "RAW_SQL";

export interface SchemaBuilder {
  createTable(name: string, callback: (table: TableBuilder) => void): Promise<void>;
  dropTable(name: string): Promise<void>;
  renameTable(from: string, to: string): Promise<void>;
  alterTable(name: string, callback: (table: TableBuilder) => void): Promise<void>;
  hasTable(name: string): Promise<boolean>;
  hasColumn(table: string, column: string): Promise<boolean>;
  hasIndex(table: string, index: string): Promise<boolean>;
  raw(sql: string, bindings?: any[]): Promise<void>;
}

export interface TableBuilder {
  // Column creation methods
  increments(name?: string): ColumnBuilder;
  integer(name: string): ColumnBuilder;
  bigInteger(name: string): ColumnBuilder;
  tinyInteger(name: string): ColumnBuilder;
  smallInteger(name: string): ColumnBuilder;
  mediumInteger(name: string): ColumnBuilder;
  decimal(name: string, precision?: number, scale?: number): ColumnBuilder;
  float(name: string, precision?: number, scale?: number): ColumnBuilder;
  double(name: string, precision?: number, scale?: number): ColumnBuilder;
  string(name: string, length?: number): ColumnBuilder;
  char(name: string, length?: number): ColumnBuilder;
  text(name: string): ColumnBuilder;
  mediumText(name: string): ColumnBuilder;
  longText(name: string): ColumnBuilder;
  date(name: string): ColumnBuilder;
  dateTime(name: string): ColumnBuilder;
  time(name: string): ColumnBuilder;
  timestamp(name: string): ColumnBuilder;
  timestamps(): void;
  binary(name: string): ColumnBuilder;
  boolean(name: string): ColumnBuilder;
  json(name: string): ColumnBuilder;
  enum(name: string, values: string[]): ColumnBuilder;

  // Index methods
  primary(columns: string | string[]): void;
  unique(columns: string | string[], indexName?: string): void;
  index(columns: string | string[], indexName?: string): void;
  fulltext(columns: string | string[], indexName?: string): void;
  spatial(columns: string | string[], indexName?: string): void;

  // Foreign key methods
  foreign(columns: string | string[]): ForeignKeyBuilder;

  // Column modification methods
  dropColumn(name: string | string[]): void;
  renameColumn(from: string, to: string): void;
  dropPrimary(indexName?: string): void;
  dropUnique(indexName: string): void;
  dropIndex(indexName: string): void;
  dropForeign(indexName: string): void;
}

export interface ColumnBuilder {
  nullable(): ColumnBuilder;
  notNullable(): ColumnBuilder;
  primary(): ColumnBuilder;
  unique(): ColumnBuilder;
  index(): ColumnBuilder;
  defaultTo(value: any): ColumnBuilder;
  comment(text: string): ColumnBuilder;
  collate(collation: string): ColumnBuilder;
  after(column: string): ColumnBuilder;
  first(): ColumnBuilder;
  unsigned(): ColumnBuilder;
  autoIncrement(): ColumnBuilder;
}

export interface ForeignKeyBuilder {
  references(column: string): ForeignKeyBuilder;
  inTable(table: string): ForeignKeyBuilder;
  onDelete(action: ReferentialAction): ForeignKeyBuilder;
  onUpdate(action: ReferentialAction): ForeignKeyBuilder;
}

export interface MigrationRunner {
  up(target?: string): Promise<MigrationResult[]>;
  down(target?: string): Promise<MigrationResult[]>;
  rollback(steps?: number): Promise<MigrationResult[]>;
  reset(): Promise<MigrationResult[]>;
  refresh(): Promise<MigrationResult[]>;
  status(): Promise<MigrationStatus[]>;
  make(name: string): Promise<string>;
}

export interface MigrationResult {
  migration: Migration;
  success: boolean;
  error?: Error;
  executionTime?: number;
}

export interface MigrationStatus {
  migration: Migration;
  executed: boolean;
  executedAt?: Date;
  batch?: number;
}

/**
 * Bitcoin Stamps Database-Specific Types
 * Schema definitions for Bitcoin Stamps, SRC-20 tokens, and related data
 */
export interface StampTableSchema {
  stamp_number: number;
  tx_hash: string;
  tx_index: number;
  block_index: number;
  creator: string;
  stamp_base64: string;
  stamp_url: string;
  stamp_mimetype: string;
  is_btc_stamp: boolean;
  supply: number;
  locked: boolean;
  divisible: boolean;
  stamp_hash: string;
  creator_name?: string;
  cpid?: string;
  keyburn?: boolean;
  ident?: string;
  is_cursed?: boolean;
  is_reissuance?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SRC20TokenTableSchema {
  id: number;
  tick: string;
  max: string;
  lim: string;
  dec: number;
  address: string;
  tx_hash: string;
  block_index: number;
  timestamp: Date;
  total_minted: string;
  total_holders: number;
  total_transfers: number;
  status: SRC20TokenStatus;
  creator_fee?: string;
  created_at: Date;
  updated_at: Date;
}

export type SRC20TokenStatus = "active" | "completed" | "invalid" | "cancelled";

export interface SRC20BalanceTableSchema {
  id: number;
  address: string;
  tick: string;
  balance: string;
  last_update_block: number;
  last_update_tx: string;
  created_at: Date;
  updated_at: Date;
}

export interface SRC20TransferTableSchema {
  id: number;
  tick: string;
  from_address: string;
  to_address: string;
  amount: string;
  tx_hash: string;
  block_index: number;
  timestamp: Date;
  transfer_type: SRC20TransferType;
  status: TransferStatus;
  created_at: Date;
  updated_at: Date;
}

export type SRC20TransferType = "mint" | "transfer" | "deploy";
export type TransferStatus = "confirmed" | "pending" | "failed";

export interface TransactionTableSchema {
  id: number;
  tx_hash: string;
  block_index: number;
  block_hash: string;
  timestamp: Date;
  source: string;
  destination?: string;
  btc_amount: number;
  fee: number;
  data?: string;
  supported: boolean;
  order_index: number;
  tx_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface BlockTableSchema {
  block_index: number;
  block_hash: string;
  block_time: Date;
  previous_block_hash: string;
  difficulty: number;
  ledger_hash: string;
  txlist_hash: string;
  messages_hash: string;
  indexed_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UTXOTableSchema {
  id: number;
  txid: string;
  vout: number;
  address: string;
  script: string;
  value: number;
  confirmations: number;
  spent: boolean;
  spent_by_txid?: string;
  spent_by_vin?: number;
  block_index?: number;
  created_at: Date;
  updated_at: Date;
}

export interface WalletBalanceTableSchema {
  id: number;
  address: string;
  balance: number;
  unconfirmed_balance: number;
  last_update_block: number;
  last_seen_tx: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Multi-Database Support Types
 * Unified interfaces for SQL and NoSQL database patterns
 */
export interface DatabaseConnection {
  type: DatabaseType;
  config: DatabaseConnectionConfig;
  client: any;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  ping(): Promise<boolean>;
  execute(query: string, params?: any[]): Promise<QueryResult>;
  transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T>;
}

export type DatabaseType = "mysql" | "postgresql" | "sqlite" | "mongodb" | "redis";

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  charset?: string;
  timezone?: string;
  connectTimeout?: number;
  acquireTimeout?: number;
  timeout?: number;
  reconnect?: boolean;
  pool?: PoolConfig;
}

export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
  propagateCreateError?: boolean;
}

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  savepoint(name: string): Promise<void>;
  rollbackTo(name: string): Promise<void>;
  release(name: string): Promise<void>;
  isCompleted(): boolean;
  query(sql: string, params?: any[]): Promise<QueryResult>;
}

// SQL Database Interfaces
export interface SQLDatabase extends DatabaseConnection {
  type: "mysql" | "postgresql" | "sqlite";
  schema: SchemaBuilder;
  migrate: MigrationRunner;
  seed: SeedRunner;
}

// NoSQL Database Interfaces
export interface NoSQLDatabase extends DatabaseConnection {
  type: "mongodb";
  collection(name: string): Collection;
  listCollections(): Promise<string[]>;
  createCollection(name: string, options?: CollectionOptions): Promise<Collection>;
  dropCollection(name: string): Promise<boolean>;
}

export interface Collection {
  name: string;
  find(filter?: any, options?: FindOptions): Promise<any[]>;
  findOne(filter?: any, options?: FindOptions): Promise<any | null>;
  insertOne(document: any): Promise<InsertOneResult>;
  insertMany(documents: any[]): Promise<InsertManyResult>;
  updateOne(filter: any, update: any, options?: UpdateOptions): Promise<UpdateOneResult>;
  updateMany(filter: any, update: any, options?: UpdateOptions): Promise<UpdateManyResult>;
  deleteOne(filter: any): Promise<DeleteOneResult>;
  deleteMany(filter: any): Promise<DeleteManyResult>;
  countDocuments(filter?: any): Promise<number>;
  createIndex(keys: any, options?: IndexOptions): Promise<string>;
  dropIndex(indexName: string): Promise<void>;
  aggregate(pipeline: any[]): Promise<any[]>;
}

export interface FindOptions {
  limit?: number;
  skip?: number;
  sort?: any;
  projection?: any;
}

export interface UpdateOptions {
  upsert?: boolean;
  multi?: boolean;
}

export interface IndexOptions {
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  name?: string;
  expireAfterSeconds?: number;
}

export interface InsertOneResult {
  insertedId: any;
  acknowledged: boolean;
}

export interface InsertManyResult {
  insertedIds: any[];
  insertedCount: number;
  acknowledged: boolean;
}

export interface UpdateOneResult {
  matchedCount: number;
  modifiedCount: number;
  upsertedId?: any;
  acknowledged: boolean;
}

export interface UpdateManyResult {
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  upsertedIds: any[];
  acknowledged: boolean;
}

export interface DeleteOneResult {
  deletedCount: number;
  acknowledged: boolean;
}

export interface DeleteManyResult {
  deletedCount: number;
  acknowledged: boolean;
}

export interface CollectionOptions {
  capped?: boolean;
  size?: number;
  max?: number;
  validator?: any;
  validationLevel?: "off" | "strict" | "moderate";
  validationAction?: "error" | "warn";
}

// Redis Cache Types
export interface RedisDatabase extends DatabaseConnection {
  type: "redis";
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<string>;
  del(key: string | string[]): Promise<number>;
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<string>;
  flushall(): Promise<string>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, field: string | string[]): Promise<number>;
  sadd(key: string, member: string | string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, member: string | string[]): Promise<number>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zrem(key: string, member: string | string[]): Promise<number>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string | string[]): Promise<void>;
  unsubscribe(channel?: string | string[]): Promise<void>;
}

/**
 * Performance and Monitoring Types
 * Query performance metrics and database health monitoring
 */
export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  rowsExamined: number;
  indexesUsed: string[];
  warnings: QueryWarning[];
  timestamp: Date;
  connectionId: string;
  database: string;
  user: string;
}

export interface QueryWarning {
  level: "Note" | "Warning" | "Error";
  code: number;
  message: string;
}

export interface ConnectionPoolStatistics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  maxConnections: number;
  minConnections: number;
  averageAcquireTime: number;
  peakActiveConnections: number;
  totalAcquiredConnections: number;
  totalReleasedConnections: number;
  connectionErrors: number;
  lastResetTime: Date;
}

export interface DatabaseHealthCheck {
  status: HealthStatus;
  responseTime: number;
  uptime: number;
  connections: ConnectionPoolStatistics;
  performance: PerformanceMetrics;
  storage: StorageMetrics;
  replication?: ReplicationStatus;
  lastCheck: Date;
  checks: HealthCheckResult[];
}

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message: string;
  responseTime: number;
  timestamp: Date;
}

export interface PerformanceMetrics {
  queriesPerSecond: number;
  averageQueryTime: number;
  slowQueries: number;
  cacheHitRatio: number;
  bufferPoolUsage: number;
  indexEfficiency: number;
}

export interface StorageMetrics {
  totalSize: number;
  dataSize: number;
  indexSize: number;
  freeSpace: number;
  growthRate: number;
  fragmentation: number;
}

export interface ReplicationStatus {
  role: "master" | "slave" | "replica";
  lag: number;
  connected: boolean;
  replicatingDatabases: string[];
  lastIOError?: string;
  lastSQLError?: string;
}

export interface BackupOperation {
  id: string;
  type: BackupType;
  status: BackupStatus;
  database: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size?: number;
  location: string;
  compression?: CompressionType;
  encryption?: boolean;
  checksum?: string;
  error?: string;
}

export type BackupType = "full" | "incremental" | "differential" | "log";
export type BackupStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type CompressionType = "none" | "gzip" | "bzip2" | "lz4" | "zstd";

export interface RestoreOperation {
  id: string;
  backupId: string;
  status: RestoreStatus;
  database: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pointInTime?: Date;
  options: RestoreOptions;
  error?: string;
}

export type RestoreStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface RestoreOptions {
  overwrite: boolean;
  verifyChecksum: boolean;
  skipData: boolean;
  skipIndexes: boolean;
  targetDatabase?: string;
  pointInTime?: Date;
}

export interface SeedRunner {
  run(seedName?: string): Promise<SeedResult[]>;
  make(name: string): Promise<string>;
  rollback(): Promise<SeedResult[]>;
  status(): Promise<SeedStatus[]>;
}

export interface SeedResult {
  seed: string;
  success: boolean;
  error?: Error;
  executionTime?: number;
}

export interface SeedStatus {
  seed: string;
  executed: boolean;
  executedAt?: Date;
}

/**
 * Database Repository Pattern Types
 * Repository pattern interfaces for data access layer
 */
export interface Repository<T = any> {
  find(id: string | number): Promise<T | null>;
  findAll(options?: FindAllOptions): Promise<T[]>;
  findBy(criteria: Partial<T>, options?: FindOptions): Promise<T[]>;
  findOneBy(criteria: Partial<T>): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T | null>;
  delete(id: string | number): Promise<boolean>;
  exists(criteria: Partial<T>): Promise<boolean>;
  count(criteria?: Partial<T>): Promise<number>;
  paginate(page: number, limit: number, criteria?: Partial<T>): Promise<PaginatedResult<T>>;
}

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  orderBy?: OrderBy[];
  include?: string[];
}

export interface OrderBy {
  field: string;
  direction: "ASC" | "DESC";
}

// Bitcoin-specific repository interfaces
export interface StampRepository extends Repository<StampRow> {
  findByStampNumber(stampNumber: number): Promise<StampRow | null>;
  findByTxHash(txHash: string): Promise<StampRow[]>;
  findByCreator(creator: string, options?: FindAllOptions): Promise<StampRow[]>;
  findCursedStamps(options?: FindAllOptions): Promise<StampRow[]>;
  findRecentStamps(limit?: number): Promise<StampRow[]>;
  getStampStats(): Promise<StampStatistics>;
}

export interface SRC20Repository extends Repository<SRC20Row> {
  findByTick(tick: string): Promise<SRC20Row | null>;
  findByAddress(address: string, options?: FindAllOptions): Promise<SRC20Row[]>;
  findBalances(address: string): Promise<SRC20Balance[]>;
  getTokenHolders(tick: string): Promise<number>;
  getTotalSupply(tick: string): Promise<string>;
  getTokenStats(tick: string): Promise<SRC20TokenStats>;
}

export interface TransactionRepository extends Repository<SendRow> {
  findByHash(hash: string): Promise<SendRow | null>;
  findByBlock(blockIndex: number, options?: FindAllOptions): Promise<SendRow[]>;
  findByAddress(address: string, options?: FindAllOptions): Promise<SendRow[]>;
  findPending(options?: FindAllOptions): Promise<SendRow[]>;
  getTransactionFees(limit?: number): Promise<FeeStatistics>;
}

export interface StampStatistics {
  totalStamps: number;
  cursedStamps: number;
  uniqueCreators: number;
  totalVolume: number;
  averageSize: number;
  latestStamp: number;
}

export interface SRC20TokenStats {
  totalSupply: string;
  circulatingSupply: string;
  holders: number;
  transfers: number;
  mintProgress: number;
  isCompleted: boolean;
}

export interface FeeStatistics {
  averageFee: number;
  medianFee: number;
  minFee: number;
  maxFee: number;
  totalFees: number;
  samples: number;
  timestamp: Date;
}
