/**
 * Monitoring and alerting utilities for fee estimation system
 */

export interface FeeSourceMetrics {
  source: "mempool" | "quicknode" | "cached" | "default";
  successCount: number;
  failureCount: number;
  lastSuccess: number | null;
  lastFailure: number | null;
  averageResponseTime: number;
  totalRequests: number;
}

export interface FeeMonitoringData {
  metrics: Record<string, FeeSourceMetrics>;
  alerts: FeeAlert[];
  lastReset: number;
}

export interface FeeAlert {
  id: string;
  type:
    | "source_failure"
    | "high_failure_rate"
    | "slow_response"
    | "fallback_usage";
  source: string;
  message: string;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
}

// In-memory monitoring data (in production, this could be stored in Redis)
let monitoringData: FeeMonitoringData = {
  metrics: {},
  alerts: [],
  lastReset: Date.now(),
};

// Configuration
const MONITORING_CONFIG = {
  // Alert thresholds
  HIGH_FAILURE_RATE_THRESHOLD: 0.5, // 50% failure rate
  SLOW_RESPONSE_THRESHOLD: 5000, // 5 seconds
  CONSECUTIVE_FAILURES_THRESHOLD: 3,

  // Time windows
  METRICS_RETENTION_HOURS: 24,
  ALERT_RETENTION_HOURS: 72,

  // Reset intervals
  METRICS_RESET_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Initialize metrics for a fee source
 */
function initializeMetrics(source: string): FeeSourceMetrics {
  return {
    source: source as any,
    successCount: 0,
    failureCount: 0,
    lastSuccess: null,
    lastFailure: null,
    averageResponseTime: 0,
    totalRequests: 0,
  };
}

/**
 * Record a successful fee estimation
 */
export function recordFeeSuccess(
  source: string,
  responseTime: number,
): void {
  if (!monitoringData.metrics[source]) {
    monitoringData.metrics[source] = initializeMetrics(source);
  }

  const metrics = monitoringData.metrics[source];
  metrics.successCount++;
  metrics.totalRequests++;
  metrics.lastSuccess = Date.now();

  // Update average response time
  const totalTime = metrics.averageResponseTime * (metrics.totalRequests - 1) +
    responseTime;
  metrics.averageResponseTime = totalTime / metrics.totalRequests;

  // Resolve any existing alerts for this source
  resolveAlertsForSource(source, ["source_failure"]);

  console.log(
    `[monitoring] Fee success recorded for ${source}: ${responseTime}ms`,
  );
}

/**
 * Record a failed fee estimation
 */
export function recordFeeFailure(
  source: string,
  error: string,
  responseTime?: number,
): void {
  if (!monitoringData.metrics[source]) {
    monitoringData.metrics[source] = initializeMetrics(source);
  }

  const metrics = monitoringData.metrics[source];
  metrics.failureCount++;
  metrics.totalRequests++;
  metrics.lastFailure = Date.now();

  if (responseTime) {
    const totalTime =
      metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime;
    metrics.averageResponseTime = totalTime / metrics.totalRequests;
  }

  console.error(`[monitoring] Fee failure recorded for ${source}: ${error}`);

  // Check for alert conditions
  checkAlertConditions(source, error);
}

/**
 * Record fallback usage
 */
export function recordFallbackUsage(
  primarySource: string,
  fallbackSource: string,
  reason: string,
): void {
  const alert: FeeAlert = {
    id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: "fallback_usage",
    source: primarySource,
    message: `Fallback to ${fallbackSource} due to: ${reason}`,
    timestamp: Date.now(),
    severity: fallbackSource === "default" ? "high" : "medium",
    resolved: false,
  };

  monitoringData.alerts.push(alert);

  console.warn(
    `[monitoring] Fallback usage: ${primarySource} → ${fallbackSource} (${reason})`,
  );
}

/**
 * Check for alert conditions and create alerts if necessary
 */
function checkAlertConditions(source: string, error: string): void {
  const metrics = monitoringData.metrics[source];

  // Check failure rate
  if (metrics.totalRequests >= 10) { // Only check after sufficient data
    const failureRate = metrics.failureCount / metrics.totalRequests;
    if (failureRate >= MONITORING_CONFIG.HIGH_FAILURE_RATE_THRESHOLD) {
      createAlert({
        type: "high_failure_rate",
        source,
        message: `High failure rate detected: ${
          (failureRate * 100).toFixed(1)
        }% (${metrics.failureCount}/${metrics.totalRequests})`,
        severity: failureRate >= 0.8 ? "critical" : "high",
      });
    }
  }

  // Check consecutive failures
  const recentFailures = getConsecutiveFailures(source);
  if (recentFailures >= MONITORING_CONFIG.CONSECUTIVE_FAILURES_THRESHOLD) {
    createAlert({
      type: "source_failure",
      source,
      message:
        `${recentFailures} consecutive failures detected. Last error: ${error}`,
      severity: recentFailures >= 5 ? "critical" : "high",
    });
  }

  // Check slow response times
  if (metrics.averageResponseTime > MONITORING_CONFIG.SLOW_RESPONSE_THRESHOLD) {
    createAlert({
      type: "slow_response",
      source,
      message: `Slow response times detected: ${
        metrics.averageResponseTime.toFixed(0)
      }ms average`,
      severity: "medium",
    });
  }
}

/**
 * Create a new alert
 */
function createAlert(
  alertData: Omit<FeeAlert, "id" | "timestamp" | "resolved">,
): void {
  // Check if similar alert already exists and is unresolved
  const existingAlert = monitoringData.alerts.find(
    (alert) =>
      !alert.resolved &&
      alert.type === alertData.type &&
      alert.source === alertData.source,
  );

  if (existingAlert) {
    // Update existing alert
    existingAlert.message = alertData.message;
    existingAlert.severity = alertData.severity;
    existingAlert.timestamp = Date.now();
    return;
  }

  // Create new alert
  const alert: FeeAlert = {
    id: `${alertData.type}_${Date.now()}_${
      Math.random().toString(36).substr(2, 9)
    }`,
    timestamp: Date.now(),
    resolved: false,
    ...alertData,
  };

  monitoringData.alerts.push(alert);

  console.warn(
    `[monitoring] Alert created: ${alert.severity.toUpperCase()} - ${alert.message}`,
  );
}

/**
 * Resolve alerts for a specific source and types
 */
function resolveAlertsForSource(source: string, types: string[]): void {
  monitoringData.alerts
    .filter((alert) =>
      !alert.resolved &&
      alert.source === source &&
      types.includes(alert.type)
    )
    .forEach((alert) => {
      alert.resolved = true;
      console.log(`[monitoring] Alert resolved: ${alert.id}`);
    });
}

/**
 * Get consecutive failures for a source (simplified - in production would check timestamps)
 */
function getConsecutiveFailures(source: string): number {
  const metrics = monitoringData.metrics[source];
  if (!metrics || !metrics.lastFailure) return 0;

  // Simplified: return failure count if last event was a failure
  // In production, this would analyze the actual sequence of events
  if (metrics.lastFailure > (metrics.lastSuccess || 0)) {
    return Math.min(metrics.failureCount, 10); // Cap at 10 for practical purposes
  }

  return 0;
}

/**
 * Get current monitoring metrics
 */
export function getMonitoringMetrics(): FeeMonitoringData {
  cleanupOldData();
  return { ...monitoringData };
}

/**
 * Get metrics for a specific source
 */
export function getSourceMetrics(source: string): FeeSourceMetrics | null {
  return monitoringData.metrics[source] || null;
}

/**
 * Get active (unresolved) alerts
 */
export function getActiveAlerts(): FeeAlert[] {
  cleanupOldData();
  return monitoringData.alerts.filter((alert) => !alert.resolved);
}

/**
 * Get alerts by severity
 */
export function getAlertsBySeverity(
  severity: FeeAlert["severity"],
): FeeAlert[] {
  return monitoringData.alerts.filter(
    (alert) => !alert.resolved && alert.severity === severity,
  );
}

/**
 * Get fee source health summary
 */
export function getFeeSourceHealth(): Record<string, {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  avgResponseTime: number;
  recentFailures: number;
}> {
  const health: Record<string, any> = {};

  for (const [source, metrics] of Object.entries(monitoringData.metrics)) {
    const failureRate = metrics.totalRequests > 0
      ? metrics.failureCount / metrics.totalRequests
      : 0;

    let status: "healthy" | "degraded" | "unhealthy";
    if (failureRate < 0.1) {
      status = "healthy";
    } else if (failureRate < 0.5) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    const uptime = metrics.totalRequests > 0
      ? (metrics.successCount / metrics.totalRequests) * 100
      : 0;

    health[source] = {
      status,
      uptime: Math.round(uptime * 100) / 100,
      avgResponseTime: Math.round(metrics.averageResponseTime),
      recentFailures: getConsecutiveFailures(source),
    };
  }

  return health;
}

/**
 * Reset monitoring data (useful for testing or periodic cleanup)
 */
export function resetMonitoringData(): void {
  monitoringData = {
    metrics: {},
    alerts: [],
    lastReset: Date.now(),
  };
  console.log("[monitoring] Monitoring data reset");
}

/**
 * Clean up old alerts and reset metrics if needed
 */
function cleanupOldData(): void {
  const now = Date.now();
  const alertRetentionMs = MONITORING_CONFIG.ALERT_RETENTION_HOURS * 60 * 60 *
    1000;

  // Remove old alerts
  const initialAlertCount = monitoringData.alerts.length;
  monitoringData.alerts = monitoringData.alerts.filter(
    (alert) => now - alert.timestamp < alertRetentionMs,
  );

  if (monitoringData.alerts.length < initialAlertCount) {
    console.log(
      `[monitoring] Cleaned up ${
        initialAlertCount - monitoringData.alerts.length
      } old alerts`,
    );
  }

  // Reset metrics if needed
  if (
    now - monitoringData.lastReset > MONITORING_CONFIG.METRICS_RESET_INTERVAL
  ) {
    console.log("[monitoring] Resetting metrics after 24 hours");
    monitoringData.metrics = {};
    monitoringData.lastReset = now;
  }
}

/**
 * Log monitoring summary (useful for debugging)
 */
export function logMonitoringSummary(): void {
  const health = getFeeSourceHealth();
  const activeAlerts = getActiveAlerts();

  console.log("[monitoring] === Fee Source Health Summary ===");
  for (const [source, data] of Object.entries(health)) {
    console.log(
      `[monitoring] ${source}: ${data.status} (${data.uptime}% uptime, ${data.avgResponseTime}ms avg)`,
    );
  }

  if (activeAlerts.length > 0) {
    console.log(`[monitoring] Active alerts: ${activeAlerts.length}`);
    activeAlerts.forEach((alert) => {
      console.log(
        `[monitoring] - ${alert.severity.toUpperCase()}: ${alert.message}`,
      );
    });
  } else {
    console.log("[monitoring] No active alerts");
  }
}
