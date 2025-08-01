/**
 * Type System Health Monitoring - Main Exports
 * Tasks 35.3, 35.4, 35.5 - Complete Type System Health Monitoring Implementation
 *
 * Centralized exports for all type system health monitoring components.
 */

// Main orchestrator
export {
  type HealthMonitorReport,
  type MonitoringConfiguration,
  TypeSystemHealthMonitor,
  typeSystemHealthMonitor,
} from "./typeSystemHealthMonitor.ts";

// Compilation Performance Tracking (Task 35.3)
export {
  type CompilationMetrics,
  CompilationPerformanceTracker,
  compilationPerformanceTracker,
  type PerformanceBaseline,
  type PerformanceRegression,
} from "./compilation/performanceTracker.ts";

export {
  CompilationMetricsCollector,
  DenoCheckWrapper,
  denoCheckWrapper,
} from "./compilation/metricsCollector.ts";

// Type Safety Validation (Task 35.4)
export {
  ASTTypeSafetyAnalyzer,
  astTypeSafetyAnalyzer,
  type DomainTypeValidation,
  type TypeSafetyReport,
  type TypeSafetyViolation,
} from "./types/astAnalyzer.ts";

export {
  type CoverageStats,
  type TypeCoverageAnalysis,
  TypeCoverageAnalyzer,
  typeCoverageAnalyzer,
  type TypeRecommendation,
} from "./types/coverageAnalyzer.ts";

// Alerting and Dashboard (Task 35.5)
export {
  type AlertConfiguration,
  type AlertThresholds,
  defaultAlertConfiguration,
  type TypeSystemAlert,
  TypeSystemAlertManager,
} from "./alerting/typeSystemAlertManager.ts";

export {
  type DashboardData,
  type SystemHealthSummary,
  type SystemInsight,
  TypeSystemDashboard,
  typeSystemDashboard,
} from "./dashboard/typeSystemDashboard.ts";

// Re-export existing monitoring utilities for compatibility
export * from "./errors/index.ts";
export * from "./logging/index.ts";
export * from "./metrics/index.ts";
export * from "./notifications/index.ts";
