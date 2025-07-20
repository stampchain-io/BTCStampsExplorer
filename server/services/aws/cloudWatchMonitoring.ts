// server/services/aws/cloudWatchMonitoring.ts
import { logger } from "$lib/utils/logger.ts";
import process from "node:process";
import { objectPoolManager } from "../memory/objectPool.ts";
import { memoryMonitor } from "../monitoring/memoryMonitorService.ts";
import { ecsDetection, type ECSMetadata } from "./ecsDetection.ts";

export interface CloudWatchMetric {
  MetricName: string;
  Value: number;
  Unit: 'Count' | 'Percent' | 'Bytes' | 'Milliseconds' | 'Seconds' | 'None';
  Timestamp: Date;
  Dimensions?: Array<{ Name: string; Value: string }>;
}

export interface CloudWatchLogEvent {
  timestamp: number;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface BusinessMetrics {
  btcPriceFetchSuccessRate: number;
  btcPriceFetchLatency: number;
  src20ProcessingThroughput: number;
  apiResponseTime: number;
  errorRate: number;
  circuitBreakerState: string;
}

export class CloudWatchMonitoringService {
  private static instance: CloudWatchMonitoringService;
  private isInitialized = false;
  private ecsMetadata: ECSMetadata | null = null;
  private businessMetrics: BusinessMetrics = {
    btcPriceFetchSuccessRate: 0,
    btcPriceFetchLatency: 0,
    src20ProcessingThroughput: 0,
    apiResponseTime: 0,
    errorRate: 0,
    circuitBreakerState: 'CLOSED'
  };
  private metricQueue: CloudWatchMetric[] = [];
  private logQueue: CloudWatchLogEvent[] = [];
  private correlationIdCounter = 0;

  private constructor() {}

  public static getInstance(): CloudWatchMonitoringService {
    if (!CloudWatchMonitoringService.instance) {
      CloudWatchMonitoringService.instance = new CloudWatchMonitoringService();
    }
    return CloudWatchMonitoringService.instance;
  }

  /**
   * Initialize CloudWatch monitoring
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Detect ECS environment
      this.ecsMetadata = await ecsDetection.detectECSEnvironment();

      if (this.ecsMetadata.isECS) {
        logger.info("system", {
          message: "CloudWatch monitoring initialized for ECS environment",
          service: this.ecsMetadata.serviceName,
          cluster: this.ecsMetadata.clusterName,
          region: this.ecsMetadata.region
        });

        // Start metric collection intervals for ECS
        this.startECSMetricCollection();
      } else {
        logger.info("system", {
          message: "CloudWatch monitoring initialized for non-ECS environment",
          note: "Some ECS-specific features will be disabled"
        });
      }

      // Start general metric collection
      this.startGeneralMetricCollection();

      this.isInitialized = true;
    } catch (error) {
      logger.error("system", {
        message: "Failed to initialize CloudWatch monitoring",
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Start ECS-specific metric collection
   */
  private startECSMetricCollection(): void {
    if (!this.ecsMetadata?.isECS) {
      return;
    }

    // Collect ECS-specific metrics every 60 seconds
    setInterval(() => {
      this.collectECSMetrics();
    }, 60000);

    // Collect high-frequency metrics every 15 seconds
    setInterval(() => {
      this.collectHighFrequencyMetrics();
    }, 15000);
  }

  /**
   * Start general metric collection (works on any platform)
   */
  private startGeneralMetricCollection(): void {
    // Collect memory metrics every 30 seconds
    setInterval(() => {
      this.collectMemoryMetrics();
    }, 30000);

    // Collect business metrics every 2 minutes
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 120000);

    // Process metric queue every 60 seconds
    setInterval(() => {
      this.processMetricQueue();
    }, 60000);
  }

  /**
   * Collect ECS-specific metrics
   */
  private collectECSMetrics(): void {
    if (!this.ecsMetadata?.isECS) {
      return;
    }

    try {
      // ECS Task CPU and Memory utilization
      const memoryStats = memoryMonitor.getMemoryStats();
      const containerLimit = memoryStats.limits.heapLimit;
      const memoryUtilization = containerLimit > 0
        ? (memoryStats.usage.current.rss / containerLimit) * 100
        : 0;

      // Add ECS-specific dimensions
      const dimensions = [
        { Name: 'ServiceName', Value: this.ecsMetadata.serviceName || 'btc-stamps-explorer' },
        { Name: 'ClusterName', Value: this.ecsMetadata.clusterName || 'unknown' },
        { Name: 'TaskDefinitionFamily', Value: this.ecsMetadata.taskDefinitionFamily || 'unknown' }
      ];

      this.addMetric({
        MetricName: 'ECS.MemoryUtilization',
        Value: memoryUtilization,
        Unit: 'Percent',
        Timestamp: new Date(),
        Dimensions: dimensions
      });

      this.addMetric({
        MetricName: 'ECS.MemoryUsed',
        Value: memoryStats.usage.current.rss,
        Unit: 'Bytes',
        Timestamp: new Date(),
        Dimensions: dimensions
      });

      // Object pool metrics for ECS
      const poolStats = objectPoolManager.getAllMetrics();
      Object.entries(poolStats).forEach(([poolName, stats]) => {
        this.addMetric({
          MetricName: 'ECS.ObjectPool.HitRate',
          Value: stats.hitRate,
          Unit: 'Percent',
          Timestamp: new Date(),
          Dimensions: [...dimensions, { Name: 'PoolName', Value: poolName }]
        });
      });

      logger.debug("system", {
        message: "ECS metrics collected",
        memoryUtilization: `${memoryUtilization.toFixed(2)}%`,
        memoryUsed: `${(memoryStats.usage.current.rss / 1024 / 1024).toFixed(2)} MB`
      });

    } catch (error) {
      logger.error("system", {
        message: "Failed to collect ECS metrics",
        error: String(error)
      });
    }
  }

  /**
   * Collect high-frequency metrics
   */
  private collectHighFrequencyMetrics(): void {
    try {
      const memoryStats = memoryMonitor.getMemoryStats();

      // Memory pressure alerts
      if (memoryStats.health.pressure === 'critical') {
        this.addMetric({
          MetricName: 'Application.MemoryPressure.Critical',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date()
        });
      }

      // API response time (placeholder - to be integrated with actual API metrics)
      this.addMetric({
        MetricName: 'Application.ResponseTime.Average',
        Value: this.businessMetrics.apiResponseTime,
        Unit: 'Milliseconds',
        Timestamp: new Date()
      });

    } catch (error) {
      logger.error("system", {
        message: "Failed to collect high-frequency metrics",
        error: String(error)
      });
    }
  }

  /**
   * Collect memory metrics for CloudWatch
   */
  private collectMemoryMetrics(): void {
    try {
      const memoryStats = memoryMonitor.getMemoryStats();
      const timestamp = new Date();

      // System memory metrics
      this.addMetric({
        MetricName: 'Application.Memory.RSS',
        Value: memoryStats.usage.current.rss,
        Unit: 'Bytes',
        Timestamp: timestamp
      });

      this.addMetric({
        MetricName: 'Application.Memory.HeapUsed',
        Value: memoryStats.usage.current.heapUsed,
        Unit: 'Bytes',
        Timestamp: timestamp
      });

      this.addMetric({
        MetricName: 'Application.Memory.External',
        Value: memoryStats.usage.current.external,
        Unit: 'Bytes',
        Timestamp: timestamp
      });

      // Memory pressure level as numeric value
      const pressureLevelMap: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
      this.addMetric({
        MetricName: 'Application.Memory.PressureLevel',
        Value: pressureLevelMap[memoryStats.health.pressure] || 0,
        Unit: 'None',
        Timestamp: timestamp
      });

    } catch (error) {
      logger.error("system", {
        message: "Failed to collect memory metrics",
        error: String(error)
      });
    }
  }

  /**
   * Collect business-specific metrics
   */
  private collectBusinessMetrics(): void {
    try {
      const timestamp = new Date();

      // BTC Price service metrics
      this.addMetric({
        MetricName: 'Business.BTCPrice.SuccessRate',
        Value: this.businessMetrics.btcPriceFetchSuccessRate,
        Unit: 'Percent',
        Timestamp: timestamp
      });

      this.addMetric({
        MetricName: 'Business.BTCPrice.Latency',
        Value: this.businessMetrics.btcPriceFetchLatency,
        Unit: 'Milliseconds',
        Timestamp: timestamp
      });

      // SRC20 processing throughput
      this.addMetric({
        MetricName: 'Business.SRC20.ProcessingThroughput',
        Value: this.businessMetrics.src20ProcessingThroughput,
        Unit: 'Count',
        Timestamp: timestamp
      });

      // Error rate
      this.addMetric({
        MetricName: 'Application.ErrorRate',
        Value: this.businessMetrics.errorRate,
        Unit: 'Percent',
        Timestamp: timestamp
      });

      // Circuit breaker state as numeric
      const circuitBreakerStates = { 'CLOSED': 0, 'OPEN': 1, 'HALF_OPEN': 2 };
      this.addMetric({
        MetricName: 'Application.CircuitBreakerState',
        Value: circuitBreakerStates[this.businessMetrics.circuitBreakerState as keyof typeof circuitBreakerStates] || 0,
        Unit: 'None',
        Timestamp: timestamp
      });

    } catch (error) {
      logger.error("system", {
        message: "Failed to collect business metrics",
        error: String(error)
      });
    }
  }

  /**
   * Add metric to queue for batch processing
   */
  private addMetric(metric: CloudWatchMetric): void {
    this.metricQueue.push(metric);

    // If queue gets too large, process immediately
    if (this.metricQueue.length >= 20) {
      this.processMetricQueue();
    }
  }

  /**
   * Process metric queue (send to CloudWatch or log locally)
   */
  private processMetricQueue(): void {
    if (this.metricQueue.length === 0) {
      return;
    }

    const metrics = this.metricQueue.splice(0); // Clear queue

    if (this.ecsMetadata?.isECS && this.isAWSEnvironment()) {
      // In AWS ECS environment - would send to CloudWatch
      // For now, we'll log the metrics in a structured format
      logger.info("system", {
        message: "CloudWatch metrics batch",
        count: metrics.length,
        metrics: metrics.map(m => ({
          name: m.MetricName,
          value: m.Value,
          unit: m.Unit,
          dimensions: m.Dimensions
        }))
      });
    } else {
      // Non-AWS environment - log metrics for local monitoring
      logger.info("system", {
        message: "Application metrics (non-AWS)",
        count: metrics.length,
        metrics: metrics.slice(0, 5) // Log first 5 for brevity
      });
    }
  }

  /**
   * Generate correlation ID for distributed tracing
   */
  public generateCorrelationId(): string {
    this.correlationIdCounter = (this.correlationIdCounter + 1) % 1000000;
    const timestamp = Date.now().toString(36);
    const counter = this.correlationIdCounter.toString(36).padStart(4, '0');
    return `${timestamp}-${counter}`;
  }

  /**
   * Add structured log event
   */
  public addLogEvent(event: Omit<CloudWatchLogEvent, 'timestamp'>): void {
    this.logQueue.push({
      ...event,
      timestamp: Date.now()
    });

    // Process log queue if it gets large
    if (this.logQueue.length >= 50) {
      this.processLogQueue();
    }
  }

  /**
   * Process log queue
   */
  private processLogQueue(): void {
    if (this.logQueue.length === 0) {
      return;
    }

    const logs = this.logQueue.splice(0); // Clear queue

    // In production ECS, these would go to CloudWatch Logs
    // For now, output structured logs
    logs.forEach(log => {
      const logMessage = {
        timestamp: new Date(log.timestamp).toISOString(),
        level: log.level,
        source: log.source,
        message: log.message,
        ...(log.correlationId && { correlationId: log.correlationId }),
        ...(log.metadata && { metadata: log.metadata })
      };

      switch (log.level) {
        case 'ERROR':
          logger.error("system", logMessage);
          break;
        case 'WARN':
          logger.warn("system", logMessage);
          break;
        case 'DEBUG':
          logger.debug("system", logMessage);
          break;
        default:
          logger.info("system", logMessage);
      }
    });
  }

  /**
   * Update business metrics
   */
  public updateBusinessMetrics(updates: Partial<BusinessMetrics>): void {
    this.businessMetrics = { ...this.businessMetrics, ...updates };
  }

  /**
   * Check if running in AWS environment
   */
  private isAWSEnvironment(): boolean {
    return !!(
      process.env.AWS_REGION ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      this.ecsMetadata?.isECS
    );
  }

  /**
   * Get health check data for ECS ALB
   */
  public getHealthCheckData(): Record<string, any> {
    const memoryStats = memoryMonitor.getMemoryStats();
    const poolStats = objectPoolManager.getAllMetrics();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      memory: {
        current: memoryStats.usage.current,
        limits: memoryStats.limits,
        pressure: memoryStats.health.pressure,
        utilizationPercent: memoryStats.limits.heapLimit > 0
          ? ((memoryStats.usage.current.rss / memoryStats.limits.heapLimit) * 100).toFixed(2)
          : 'unknown'
      },
      objectPools: Object.entries(poolStats).reduce((acc, [name, stats]) => {
        acc[name] = {
          hitRate: `${stats.hitRate.toFixed(2)}%`,
          borrowed: stats.totalBorrowed,
          available: stats.currentPoolSize
        };
        return acc;
      }, {} as Record<string, any>),
      businessMetrics: this.businessMetrics,
      ecs: this.ecsMetadata?.isECS ? {
        service: this.ecsMetadata.serviceName,
        cluster: this.ecsMetadata.clusterName,
        region: this.ecsMetadata.region
      } : null
    };
  }

  /**
   * Get monitoring status
   */
  public getMonitoringStatus(): Record<string, any> {
    return {
      initialized: this.isInitialized,
      ecsDetected: this.ecsMetadata?.isECS || false,
      awsEnvironment: this.isAWSEnvironment(),
      metricQueueSize: this.metricQueue.length,
      logQueueSize: this.logQueue.length,
      metadata: this.ecsMetadata
    };
  }
}

// Export singleton instance
export const cloudWatchMonitoring = CloudWatchMonitoringService.getInstance();
