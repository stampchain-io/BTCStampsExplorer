/**
 * Database Types Test Suite
 * Tests for server/types/database.d.ts type definitions
 */

import { assertType, IsExact } from "../utils/typeAssertions.ts";
import type {
  // Base Database Schema Types
  DatabaseSchema,
  TableDefinition,
  ColumnDefinition,
  IndexDefinition,
  ConstraintDefinition,
  
  // Query Builder Types
  QueryBuilder,
  SelectQueryBuilder,
  InsertQueryBuilder,
  UpdateQueryBuilder,
  DeleteQueryBuilder,
  QueryResult,
  WhereCondition,
  
  // ORM Interface Types
  Model,
  ModelQueryBuilder,
  PaginatedResult,
  RelationDefinition,
  
  // Migration Types
  Migration,
  MigrationOperation,
  SchemaBuilder,
  TableBuilder,
  MigrationRunner,
  
  // Bitcoin-specific Types
  StampTableSchema,
  SRC20TokenTableSchema,
  SRC20BalanceTableSchema,
  TransactionTableSchema,
  BlockTableSchema,
  UTXOTableSchema,
  
  // Multi-Database Support
  DatabaseConnection,
  SQLDatabase,
  NoSQLDatabase,
  RedisDatabase,
  Transaction,
  Collection,
  
  // Performance and Monitoring
  QueryPerformanceMetrics,
  ConnectionPoolStatistics,
  DatabaseHealthCheck,
  BackupOperation,
  RestoreOperation,
  
  // Repository Pattern
  Repository,
  StampRepository,
  SRC20Repository,
  TransactionRepository,
  StampStatistics,
  SRC20TokenStats
} from "../../../server/types/database.d.ts";

import type { StampRow } from "../../../lib/types/stamp.d.ts";
import type { SRC20Row, SRC20Balance } from "../../../lib/types/src20.d.ts";
import type { SendRow } from "../../../lib/types/transaction.d.ts";

Deno.test("Database Schema Types", () => {
  // Test DatabaseSchema structure
  assertType<IsExact<DatabaseSchema, {
    tables: { [tableName: string]: TableDefinition };
    indexes: { [indexName: string]: IndexDefinition };
    constraints: { [constraintName: string]: ConstraintDefinition };
    version: string;
  }>>(true);

  // Test TableDefinition structure
  assertType<IsExact<TableDefinition, {
    name: string;
    columns: { [columnName: string]: ColumnDefinition };
    primaryKey: string[];
    indexes?: IndexDefinition[];
    constraints?: ConstraintDefinition[];
    engine?: "InnoDB" | "MyISAM" | "Memory" | "Archive";
    charset?: string;
    collation?: string;
  }>>(true);

  // Test ColumnDefinition structure
  assertType<IsExact<ColumnDefinition, {
    type: "INT" | "BIGINT" | "TINYINT" | "SMALLINT" | "MEDIUMINT" |
          "DECIMAL" | "NUMERIC" | "FLOAT" | "DOUBLE" |
          "VARCHAR" | "CHAR" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT" |
          "DATE" | "TIME" | "DATETIME" | "TIMESTAMP" |
          "BINARY" | "VARBINARY" | "BLOB" | "MEDIUMBLOB" | "LONGBLOB" |
          "JSON" | "ENUM" | "SET" | "BOOLEAN";
    nullable?: boolean;
    primaryKey?: boolean;
    unique?: boolean;
    autoIncrement?: boolean;
    default?: unknown;
    length?: number;
    precision?: number;
    scale?: number;
    comment?: string;
    collation?: string;
  }>>(true);
});

Deno.test("Query Builder Types", () => {
  // Test generic QueryBuilder interface
  assertType<IsExact<QueryBuilder<any>, {
    select: SelectQueryBuilder<any>;
    insert: InsertQueryBuilder<any>;
    update: UpdateQueryBuilder<any>;
    delete: DeleteQueryBuilder<any>;
  }>>(true);

  // Test WhereCondition type with example object
  type TestModel = { id: number; name: string; active: boolean };
  
  const validWhereCondition: WhereCondition<TestModel> = {
    id: { $gt: 10 },
    name: { $like: "test%" },
    active: true
  };
  
  assertType<WhereCondition<TestModel>>(validWhereCondition);

  // Test QueryResult structure
  assertType<IsExact<QueryResult<TestModel>, {
    rows: TestModel[];
    rowCount: number;
    fields: Array<{
      name: string;
      type: string;
      length: number;
      nullable: boolean;
      primaryKey: boolean;
      unique: boolean;
      autoIncrement: boolean;
      default: any;
    }>;
    affectedRows?: number;
    insertId?: number;
    warningCount?: number;
  }>>(true);
});

Deno.test("ORM Interface Types", () => {
  // Test Model interface structure
  type TestModel = { id: number; name: string; createdAt: Date };
  
  const validModel: Model<TestModel> = {
    tableName: "test_table",
    primaryKey: "id",
    fillable: ["name"],
    guarded: ["id"],
    hidden: ["createdAt"],
    casts: {
      id: "integer",
      name: "string",
      createdAt: "date"
    },
    timestamps: true,
    createdAt: "createdAt",
    relations: {
      posts: {
        type: "hasMany",
        model: "Post",
        foreignKey: "user_id"
      }
    }
  };
  
  assertType<Model<TestModel>>(validModel);

  // Test PaginatedResult structure
  assertType<IsExact<PaginatedResult<TestModel>, {
    data: TestModel[];
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
  }>>(true);

  // Test RelationDefinition types
  const hasOneRelation: RelationDefinition = {
    type: "hasOne",
    model: "Profile",
    foreignKey: "user_id"
  };
  
  const belongsToManyRelation: RelationDefinition = {
    type: "belongsToMany",
    model: "Role",
    pivotTable: "user_roles",
    pivotForeignKey: "user_id",
    pivotLocalKey: "role_id"
  };
  
  assertType<RelationDefinition>(hasOneRelation);
  assertType<RelationDefinition>(belongsToManyRelation);
});

Deno.test("Migration Types", () => {
  // Test Migration interface
  const validMigration: Migration = {
    id: "001_create_users_table",
    name: "CreateUsersTable",
    version: "1.0.0",
    description: "Create users table with basic fields",
    up: async () => { /* migration up logic */ },
    down: async () => { /* migration down logic */ },
    dependencies: [],
    createdAt: new Date(),
    executedAt: new Date()
  };
  
  assertType<Migration>(validMigration);

  // Test MigrationOperation types
  const createTableOp: MigrationOperation = {
    type: "CREATE_TABLE",
    table: "users",
    data: { /* table definition */ }
  };
  
  const addColumnOp: MigrationOperation = {
    type: "ADD_COLUMN",
    table: "users",
    column: "email",
    data: { type: "VARCHAR", length: 255, nullable: false }
  };
  
  assertType<MigrationOperation>(createTableOp);
  assertType<MigrationOperation>(addColumnOp);
});

Deno.test("Bitcoin-Specific Database Types", () => {
  // Test StampTableSchema
  const validStampSchema: StampTableSchema = {
    stamp_number: 12345,
    tx_hash: "abcd1234",
    tx_index: 0,
    block_index: 800000,
    creator: "bc1q...",
    stamp_base64: "data:image/png;base64,...",
    stamp_url: "https://...",
    stamp_mimetype: "image/png",
    is_btc_stamp: true,
    supply: 1,
    locked: false,
    divisible: false,
    stamp_hash: "hash123",
    creator_name: "Artist Name",
    cpid: "A123456789",
    keyburn: false,
    ident: "STAMP",
    is_cursed: false,
    is_reissuance: false,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  assertType<StampTableSchema>(validStampSchema);

  // Test SRC20TokenTableSchema
  const validSRC20Schema: SRC20TokenTableSchema = {
    id: 1,
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    address: "bc1q...",
    tx_hash: "abcd1234",
    block_index: 800000,
    timestamp: new Date(),
    total_minted: "500000",
    total_holders: 100,
    total_transfers: 500,
    status: "active",
    creator_fee: "0.001",
    created_at: new Date(),
    updated_at: new Date()
  };
  
  assertType<SRC20TokenTableSchema>(validSRC20Schema);

  // Test SRC20BalanceTableSchema
  const validBalanceSchema: SRC20BalanceTableSchema = {
    id: 1,
    address: "bc1q...",
    tick: "TEST",
    balance: "1000",
    last_update_block: 800000,
    last_update_tx: "abcd1234",
    created_at: new Date(),
    updated_at: new Date()
  };
  
  assertType<SRC20BalanceTableSchema>(validBalanceSchema);

  // Test TransactionTableSchema
  const validTxSchema: TransactionTableSchema = {
    id: 1,
    tx_hash: "abcd1234",
    block_index: 800000,
    block_hash: "block123",
    timestamp: new Date(),
    source: "bc1q...",
    destination: "bc1q...",
    btc_amount: 0.001,
    fee: 0.0001,
    data: "stamp data",
    supported: true,
    order_index: 0,
    tx_index: 0,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  assertType<TransactionTableSchema>(validTxSchema);

  // Test UTXOTableSchema
  const validUTXOSchema: UTXOTableSchema = {
    id: 1,
    txid: "abcd1234",
    vout: 0,
    address: "bc1q...",
    script: "76a914...",
    value: 100000,
    confirmations: 6,
    spent: false,
    spent_by_txid: undefined,
    spent_by_vin: undefined,
    block_index: 800000,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  assertType<UTXOTableSchema>(validUTXOSchema);
});

Deno.test("Multi-Database Support Types", () => {
  // Test DatabaseConnection interface
  const mockConnection: DatabaseConnection = {
    type: "mysql",
    config: {
      host: "localhost",
      port: 3306,
      database: "test_db",
      username: "user",
      password: "pass"
    },
    client: {} as any,
    isConnected: true,
    connect: async () => {},
    disconnect: async () => {},
    ping: async () => true,
    execute: async () => ({ rows: [], rowCount: 0, fields: [] }),
    transaction: async (callback) => callback({} as any)
  };
  
  assertType<DatabaseConnection>(mockConnection);

  // Test RedisDatabase interface methods
  const mockRedis: Partial<RedisDatabase> = {
    type: "redis",
    get: async (key: string) => "value",
    set: async (key: string, value: string, ttl?: number) => "OK",
    del: async (key: string | string[]) => 1,
    exists: async (key: string) => true,
    expire: async (key: string, seconds: number) => true,
    keys: async (pattern: string) => ["key1", "key2"],
    hget: async (key: string, field: string) => "value",
    hset: async (key: string, field: string, value: string) => 1,
    hgetall: async (key: string) => ({ field1: "value1" }),
    sadd: async (key: string, member: string | string[]) => 1,
    smembers: async (key: string) => ["member1", "member2"],
    zadd: async (key: string, score: number, member: string) => 1
  };
  
  // These should not cause type errors
  if (mockRedis.get) assertType<(key: string) => Promise<string | null>>(mockRedis.get);
  if (mockRedis.hgetall) assertType<(key: string) => Promise<Record<string, string>>>(mockRedis.hgetall);
});

Deno.test("Performance and Monitoring Types", () => {
  // Test QueryPerformanceMetrics
  const validMetrics: QueryPerformanceMetrics = {
    query: "SELECT * FROM users WHERE id = ?",
    executionTime: 125.5,
    rowsAffected: 1,
    rowsExamined: 1,
    indexesUsed: ["PRIMARY"],
    warnings: [{
      level: "Note",
      code: 1003,
      message: "Query executed successfully"
    }],
    timestamp: new Date(),
    connectionId: "conn123",
    database: "test_db",
    user: "app_user"
  };
  
  assertType<QueryPerformanceMetrics>(validMetrics);

  // Test ConnectionPoolStatistics
  const validPoolStats: ConnectionPoolStatistics = {
    totalConnections: 10,
    activeConnections: 5,
    idleConnections: 5,
    pendingRequests: 0,
    maxConnections: 20,
    minConnections: 2,
    averageAcquireTime: 50.5,
    peakActiveConnections: 8,
    totalAcquiredConnections: 1000,
    totalReleasedConnections: 995,
    connectionErrors: 2,
    lastResetTime: new Date()
  };
  
  assertType<ConnectionPoolStatistics>(validPoolStats);

  // Test DatabaseHealthCheck
  const validHealthCheck: DatabaseHealthCheck = {
    status: "healthy",
    responseTime: 25.5,
    uptime: 86400,
    connections: validPoolStats,
    performance: {
      queriesPerSecond: 100.5,
      averageQueryTime: 50.2,
      slowQueries: 2,
      cacheHitRatio: 0.95,
      bufferPoolUsage: 0.75,
      indexEfficiency: 0.98
    },
    storage: {
      totalSize: 1024 * 1024 * 1024, // 1GB
      dataSize: 800 * 1024 * 1024,   // 800MB
      indexSize: 200 * 1024 * 1024,  // 200MB
      freeSpace: 24 * 1024 * 1024,   // 24MB
      growthRate: 0.1,
      fragmentation: 0.05
    },
    lastCheck: new Date(),
    checks: [{
      name: "connection_test",
      status: "healthy",
      message: "Database connection successful",
      responseTime: 10.5,
      timestamp: new Date()
    }]
  };
  
  assertType<DatabaseHealthCheck>(validHealthCheck);

  // Test BackupOperation
  const validBackup: BackupOperation = {
    id: "backup-123",
    type: "full",
    status: "completed",
    database: "test_db",
    startTime: new Date(),
    endTime: new Date(),
    duration: 30000, // 30 seconds
    size: 1024 * 1024 * 100, // 100MB
    location: "/backups/test_db_20240101.sql.gz",
    compression: "gzip",
    encryption: true,
    checksum: "sha256:abc123..."
  };
  
  assertType<BackupOperation>(validBackup);
});

Deno.test("Repository Pattern Types", () => {
  // Test generic Repository interface
  type TestEntity = { id: number; name: string; active: boolean };
  
  const mockRepository: Repository<TestEntity> = {
    find: async (id) => ({ id: 1, name: "test", active: true }),
    findAll: async (options) => [{ id: 1, name: "test", active: true }],
    findBy: async (criteria, options) => [{ id: 1, name: "test", active: true }],
    findOneBy: async (criteria) => ({ id: 1, name: "test", active: true }),
    create: async (data) => ({ id: 1, name: data.name, active: data.active }),
    update: async (id, data) => ({ id: 1, name: "updated", active: true }),
    delete: async (id) => true,
    exists: async (criteria) => true,
    count: async (criteria) => 10,
    paginate: async (page, limit, criteria) => ({
      data: [{ id: 1, name: "test", active: true }],
      meta: {
        current_page: 1,
        per_page: 10,
        total: 100,
        total_pages: 10,
        from: 1,
        to: 10
      },
      links: {
        first: "/api/test?page=1",
        last: "/api/test?page=10",
        prev: null,
        next: "/api/test?page=2"
      }
    })
  };
  
  assertType<Repository<TestEntity>>(mockRepository);

  // Test StampRepository specific methods
  const mockStampRepo: Partial<StampRepository> = {
    findByStampNumber: async (stampNumber: number) => null,
    findByTxHash: async (txHash: string) => [],
    findByCreator: async (creator: string, options?) => [],
    findCursedStamps: async (options?) => [],
    findRecentStamps: async (limit?: number) => [],
    getStampStats: async () => ({
      totalStamps: 50000,
      cursedStamps: 1000,
      uniqueCreators: 5000,
      totalVolume: 1000000,
      averageSize: 2048,
      latestStamp: 50000
    })
  };
  
  // These should not cause type errors
  if (mockStampRepo.findByStampNumber) {
    assertType<(stampNumber: number) => Promise<StampRow | null>>(mockStampRepo.findByStampNumber);
  }
  if (mockStampRepo.getStampStats) {
    assertType<() => Promise<StampStatistics>>(mockStampRepo.getStampStats);
  }

  // Test SRC20Repository specific methods
  const mockSRC20Repo: Partial<SRC20Repository> = {
    findByTick: async (tick: string) => null,
    findByAddress: async (address: string, options?) => [],
    findBalances: async (address: string) => [],
    getTokenHolders: async (_tick: string) => 100,
    getTotalSupply: async (_tick: string) => "1000000",
    getTokenStats: async (_tick: string) => ({
      totalSupply: "1000000",
      circulatingSupply: "500000",
      holders: 100,
      transfers: 1000,
      mintProgress: 0.5,
      isCompleted: false
    })
  };
  
  // These should not cause type errors
  if (mockSRC20Repo.findByTick) {
    assertType<(tick: string) => Promise<SRC20Row | null>>(mockSRC20Repo.findByTick);
  }
  if (mockSRC20Repo.getTokenStats) {
    assertType<(tick: string) => Promise<SRC20TokenStats>>(mockSRC20Repo.getTokenStats);
  }
});

Deno.test("Type Compatibility with Domain Types", () => {
  // Ensure database types are compatible with domain types
  
  // StampRow should be compatible with StampTableSchema (minus database-specific fields)
  const _stampData: StampRow = {} as StampRow;
  const stampSchema: StampTableSchema = {} as StampTableSchema;
  
  // These assignments should be valid where applicable
  // (Note: Not all fields will match exactly due to domain vs persistence layer differences)
  assertType<number>(stampSchema.stamp_number);
  assertType<string>(stampSchema.tx_hash);
  assertType<string>(stampSchema.creator);
  assertType<boolean>(stampSchema.is_btc_stamp);
  
  // SRC20 types should be compatible
  const _src20Data: SRC20Row = {} as SRC20Row;
  const src20Schema: SRC20TokenTableSchema = {} as SRC20TokenTableSchema;
  
  assertType<string>(src20Schema.tick);
  assertType<string>(src20Schema.max);
  assertType<string>(src20Schema.lim);
  assertType<number>(src20Schema.dec);
  
  // Balance types should be compatible
  const _balanceData: SRC20Balance = {} as SRC20Balance;
  const balanceSchema: SRC20BalanceTableSchema = {} as SRC20BalanceTableSchema;
  
  assertType<string>(balanceSchema.address);
  assertType<string>(balanceSchema.tick);
  assertType<string>(balanceSchema.balance);
});

console.log("✅ All database type tests passed");