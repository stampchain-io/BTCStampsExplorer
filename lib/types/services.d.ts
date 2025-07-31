import { StampRow } from "$globals";

export type DispenserFilter = "open" | "closed" | "all";

export interface Dispenser {
  tx_hash: string;
  block_index: number;
  source: string;
  cpid: string;
  give_quantity: number;
  give_remaining: number;
  escrow_quantity: number;
  satoshirate: number;
  btcrate: number;
  origin: string;
  confirmed: boolean;
  close_block_index: number | null;
  status: "open" | "closed" | "unknown";
  asset_info?: any;
  dispenser_info?: any;
  stamp?: StampRow | null;
}

export interface Dispense {
  tx_hash: string;
  block_index: number;
  cpid: string;
  source: string;
  destination: string;
  dispenser_tx_hash: string;
  dispense_quantity: number;
  confirmed: boolean;
  btc_amount: number | undefined;
  close_block_index: number | null;
  dispenser_details: any | null;
}

interface DispenseEvent {
  event_index: number;
  event: "DISPENSE";
  params: {
    asset: string;
    block_index: number;
    btc_amount: number;
    destination: string;
    dispense_index: number;
    dispense_quantity: number;
    dispenser_tx_hash: string;
    source: string;
    tx_hash: string;
    tx_index: number;
  };
  tx_hash: string;
  block_index: number;
  timestamp: string | null;
}

export interface Fairminter {
  tx_hash: string;
  tx_index: number;
  block_index: number;
  source: string;
  asset: string;
  asset_parent: string;
  asset_longname: string;
  description: string;
  price: number;
  quantity_by_price: number;
  hard_cap: number;
  burn_payment: boolean;
  max_mint_per_tx: number;
  premint_quantity: number;
  start_block: number;
  end_block: number;
  minted_asset_commission_int: number;
  soft_cap: number;
  soft_cap_deadline_block: number;
  lock_description: boolean;
  lock_quantity: boolean;
  divisible: boolean;
  pre_minted: boolean;
  status: string;
  paid_quantity: number | null;
  confirmed: boolean;
}

export interface XcpBalance {
  address: string | null;
  cpid: string;
  quantity: number;
  utxo: string;
  utxo_address: string;
  divisible: boolean;
}

export interface DispenserStats {
  open: number;
  closed: number;
  total: number;
  items: Dispenser[];
}

// ============================================================================
// Base Service Interface Structure
// ============================================================================

/**
 * Service health status information
 */
export interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  details?: string;
  timestamp: string;
  checks?: Record<string, boolean>;
}

/**
 * Base interface for all services in the system
 */
export interface IService {
  /** Service identifier */
  name: string;
  /** Service version */
  version: string;
  /** Initialize the service and its dependencies */
  initialize(): Promise<void>;
  /** Gracefully shutdown the service */
  shutdown(): Promise<void>;
  /** Check service health and readiness */
  healthCheck(): Promise<ServiceHealth>;
}

/**
 * Service container for dependency injection and service management
 */
export interface IServiceContainer {
  /** Register a service instance */
  register<T extends IService>(name: string, service: T): void;
  /** Get a registered service instance */
  get<T extends IService>(name: string): T;
  /** Get all registered services */
  getAll(): Map<string, IService>;
  /** Check if a service is registered */
  has(name: string): boolean;
  /** Unregister a service */
  unregister(name: string): boolean;
}

/**
 * Dependency injection configuration
 */
export interface ServiceDependency {
  name: string;
  required: boolean;
  version?: string;
}

/**
 * Service metadata and configuration
 */
export interface ServiceDescriptor {
  name: string;
  version: string;
  dependencies: ServiceDependency[];
  singleton: boolean;
  factory?: () => Promise<IService>;
}

// ============================================================================
// Promise-Based Service Interfaces
// ============================================================================

/**
 * Service operation result wrapper
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: Record<string, unknown>;
}

/**
 * Service error information
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  service: string;
  retryable: boolean;
}

/**
 * Async operation configuration
 */
export interface AsyncOperationConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  retryBackoff: "linear" | "exponential";
  circuit?: CircuitBreakerConfig;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  enabled: boolean;
}

/**
 * Retry configuration for failed operations
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Base async service interface with error handling
 */
export interface IAsyncService extends IService {
  /** Execute operation with retry and timeout handling */
  executeWithRetry<T>(
    operation: () => Promise<T>,
    config?: Partial<AsyncOperationConfig>,
  ): Promise<ServiceResult<T>>;

  /** Execute operation with circuit breaker protection */
  executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitName: string,
  ): Promise<ServiceResult<T>>;
}

// ============================================================================
// Service Configuration and Composition Types
// ============================================================================

/**
 * Base service configuration
 */
export interface ServiceConfig {
  name: string;
  enabled: boolean;
  environment: "development" | "staging" | "production";
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
  [key: string]: unknown;
}

/**
 * Logging configuration for services
 */
export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  format: "json" | "text";
  outputs: ("console" | "file" | "remote")[];
  contextFields: string[];
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  metricsEnabled: boolean;
  tracingEnabled: boolean;
  healthCheckInterval: number;
  performanceTracking: boolean;
}

/**
 * Service factory interface
 */
export interface IServiceFactory<T extends IService> {
  create(config: ServiceConfig): Promise<T>;
  createSingleton(config: ServiceConfig): Promise<T>;
  supports(serviceType: string): boolean;
}

/**
 * Service middleware interface
 */
export interface IServiceMiddleware {
  name: string;
  order: number;
  before?<T>(context: ServiceContext, input: T): Promise<T>;
  after?<T>(
    context: ServiceContext,
    result: ServiceResult<T>,
  ): Promise<ServiceResult<T>>;
  onError?(context: ServiceContext, error: ServiceError): Promise<void>;
}

/**
 * Service execution context
 */
export interface ServiceContext {
  serviceName: string;
  operationName: string;
  requestId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

/**
 * Service composition pipeline
 */
export interface IServicePipeline {
  addService<T extends IService>(service: T): IServicePipeline;
  addMiddleware(middleware: IServiceMiddleware): IServicePipeline;
  execute<TInput, TOutput>(
    input: TInput,
    context: ServiceContext,
  ): Promise<ServiceResult<TOutput>>;
}

// ============================================================================
// Repository Pattern Interfaces
// ============================================================================

/**
 * Generic repository interface for data access
 */
export interface IRepository<T, ID> {
  /** Find entity by ID */
  findById(id: ID): Promise<T | null>;
  /** Find all entities */
  findAll(): Promise<T[]>;
  /** Find entities with pagination */
  findPaginated(offset: number, limit: number): Promise<PaginatedResult<T>>;
  /** Save entity (create or update) */
  save(entity: T): Promise<T>;
  /** Delete entity by ID */
  delete(id: ID): Promise<boolean>;
  /** Count total entities */
  count(): Promise<number>;
  /** Check if entity exists */
  exists(id: ID): Promise<boolean>;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Query criteria for repository operations
 */
export interface QueryCriteria {
  filters?: Record<string, unknown>;
  sorting?: SortCriteria[];
  pagination?: PaginationCriteria;
}

/**
 * Sorting criteria
 */
export interface SortCriteria {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Pagination criteria
 */
export interface PaginationCriteria {
  offset: number;
  limit: number;
}

/**
 * Advanced repository with query capabilities
 */
export interface IQueryableRepository<T, ID> extends IRepository<T, ID> {
  /** Find entities matching criteria */
  findByCriteria(criteria: QueryCriteria): Promise<PaginatedResult<T>>;
  /** Find single entity by criteria */
  findOneByCriteria(
    criteria: Omit<QueryCriteria, "pagination">,
  ): Promise<T | null>;
  /** Update entities matching criteria */
  updateByCriteria(
    criteria: QueryCriteria,
    updates: Partial<T>,
  ): Promise<number>;
  /** Delete entities matching criteria */
  deleteByCriteria(criteria: QueryCriteria): Promise<number>;
}

// ============================================================================
// Event-Driven Service Types
// ============================================================================

/**
 * Service event data
 */
export interface ServiceEvent<T = unknown> {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (
  event: ServiceEvent<T>,
) => Promise<void>;

/**
 * Event emitter interface for services
 */
export interface IEventEmitter {
  /** Emit an event */
  emit<T>(
    eventType: string,
    data: T,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  /** Subscribe to events */
  on<T>(eventType: string, handler: EventHandler<T>): void;
  /** Unsubscribe from events */
  off<T>(eventType: string, handler: EventHandler<T>): void;
  /** Subscribe to events once */
  once<T>(eventType: string, handler: EventHandler<T>): void;
  /** Get event listener count */
  listenerCount(eventType: string): number;
}

/**
 * Message queue interface
 */
export interface IMessageQueue {
  /** Send message to queue */
  send<T>(
    queueName: string,
    message: T,
    options?: MessageOptions,
  ): Promise<void>;
  /** Subscribe to queue messages */
  subscribe<T>(queueName: string, handler: MessageHandler<T>): Promise<void>;
  /** Unsubscribe from queue */
  unsubscribe(queueName: string): Promise<void>;
  /** Get queue statistics */
  getQueueStats(queueName: string): Promise<QueueStats>;
}

/**
 * Message options for queue operations
 */
export interface MessageOptions {
  delay?: number;
  ttl?: number;
  priority?: number;
  retries?: number;
}

/**
 * Message handler function type
 */
export type MessageHandler<T = unknown> = (
  message: QueueMessage<T>,
) => Promise<void>;

/**
 * Queue message wrapper
 */
export interface QueueMessage<T = unknown> {
  id: string;
  data: T;
  timestamp: string;
  deliveryCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  name: string;
  size: number;
  processing: number;
  failed: number;
  completed: number;
}

/**
 * Pub/Sub interface
 */
export interface IPubSub {
  /** Publish message to topic */
  publish<T>(topic: string, message: T): Promise<void>;
  /** Subscribe to topic */
  subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<string>;
  /** Unsubscribe from topic */
  unsubscribe(subscriptionId: string): Promise<void>;
  /** Get topic subscribers count */
  getSubscriberCount(topic: string): Promise<number>;
}

// ============================================================================
// Service Monitoring Types
// ============================================================================

/**
 * Performance metrics for services
 */
export interface ServiceMetrics {
  serviceName: string;
  timestamp: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  customMetrics?: Record<string, number>;
}

/**
 * Service statistics aggregation
 */
export interface ServiceStatistics {
  serviceName: string;
  period: {
    start: string;
    end: string;
  };
  metrics: ServiceMetrics[];
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
    availability: number;
  };
}

/**
 * Service logging interface
 */
export interface IServiceLogger {
  /** Log debug message */
  debug(message: string, context?: Record<string, unknown>): void;
  /** Log info message */
  info(message: string, context?: Record<string, unknown>): void;
  /** Log warning message */
  warn(message: string, context?: Record<string, unknown>): void;
  /** Log error message */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void;
  /** Create child logger with additional context */
  child(context: Record<string, unknown>): IServiceLogger;
}

/**
 * Service tracing interface
 */
export interface IServiceTracer {
  /** Start a new trace span */
  startSpan(operationName: string, parentSpan?: TraceSpan): TraceSpan;
  /** Finish a trace span */
  finishSpan(span: TraceSpan): void;
  /** Add tags to span */
  addTags(span: TraceSpan, tags: Record<string, unknown>): void;
  /** Log event to span */
  logEvent(
    span: TraceSpan,
    event: string,
    data?: Record<string, unknown>,
  ): void;
}

/**
 * Trace span representation
 */
export interface TraceSpan {
  id: string;
  traceId: string;
  operationName: string;
  startTime: string;
  duration?: number;
  tags: Record<string, unknown>;
  events: TraceEvent[];
}

/**
 * Trace event
 */
export interface TraceEvent {
  timestamp: string;
  event: string;
  data?: Record<string, unknown>;
}

/**
 * Service monitoring interface
 */
export interface IServiceMonitor {
  /** Record service metrics */
  recordMetrics(metrics: ServiceMetrics): Promise<void>;
  /** Get service statistics */
  getStatistics(
    serviceName: string,
    period: TimePeriod,
  ): Promise<ServiceStatistics>;
  /** Get current health status */
  getHealthStatus(serviceName: string): Promise<ServiceHealth>;
  /** Register health check */
  registerHealthCheck(
    serviceName: string,
    check: () => Promise<ServiceHealth>,
  ): void;
  /** Start monitoring */
  startMonitoring(): Promise<void>;
  /** Stop monitoring */
  stopMonitoring(): Promise<void>;
}

/**
 * Time period specification
 */
export interface TimePeriod {
  start: string;
  end: string;
}

// ============================================================================
// Service Lifecycle and Management
// ============================================================================

/**
 * Service lifecycle hooks
 */
export interface IServiceLifecycle {
  /** Called before service initialization */
  onBeforeInit?(): Promise<void>;
  /** Called after service initialization */
  onAfterInit?(): Promise<void>;
  /** Called before service shutdown */
  onBeforeShutdown?(): Promise<void>;
  /** Called after service shutdown */
  onAfterShutdown?(): Promise<void>;
  /** Called on service error */
  onError?(error: ServiceError): Promise<void>;
}

/**
 * Service manager for orchestrating multiple services
 */
export interface IServiceManager {
  /** Register service with dependencies */
  register(descriptor: ServiceDescriptor): Promise<void>;
  /** Start all services in dependency order */
  startAll(): Promise<void>;
  /** Stop all services in reverse dependency order */
  stopAll(): Promise<void>;
  /** Get service status */
  getServiceStatus(serviceName: string): Promise<ServiceStatus>;
  /** Get all service statuses */
  getAllServiceStatuses(): Promise<Map<string, ServiceStatus>>;
}

/**
 * Service status information
 */
export interface ServiceStatus {
  name: string;
  status: "stopped" | "starting" | "running" | "stopping" | "error";
  health: ServiceHealth;
  uptime: number;
  version: string;
  dependencies: ServiceDependency[];
}
