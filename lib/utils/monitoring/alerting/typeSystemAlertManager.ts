/**
 * Type System Alert Manager
 * Task 35.5 - Implement Automated Alerting and Dashboard System
 *
 * Comprehensive alerting system with threshold-based notifications for
 * type system health monitoring, compilation performance, and type safety issues.
 */

import { logger } from "$lib/utils/logger.ts";
import type {
  CompilationMetrics,
  PerformanceRegression,
} from "../compilation/performanceTracker.ts";
import type {
  TypeSafetyReport,
  TypeSafetyViolation,
} from "../types/astAnalyzer.ts";
import type { TypeCoverageAnalysis } from "../types/coverageAnalyzer.ts";

export interface AlertConfiguration {
  /** Alert thresholds configuration */
  thresholds: AlertThresholds;
  /** Notification settings */
  notifications: NotificationSettings;
  /** Escalation policies */
  escalation: EscalationPolicy;
  /** Alert filtering and routing */
  routing: AlertRouting;
}

export interface AlertThresholds {
  /** Compilation performance thresholds */
  compilation: {
    /** Maximum acceptable compilation time (ms) */
    maxCompilationTime: number;
    /** Maximum acceptable memory usage (MB) */
    maxMemoryUsage: number;
    /** Minimum cache effectiveness percentage */
    minCacheEffectiveness: number;
    /** Maximum error count */
    maxErrors: number;
  };
  /** Type safety thresholds */
  typeSafety: {
    /** Minimum type coverage percentage */
    minCoverage: number;
    /** Maximum any type usage */
    maxAnyTypes: number;
    /** Minimum safety score */
    minSafetyScore: number;
    /** Maximum critical violations */
    maxCriticalViolations: number;
  };
  /** Performance regression thresholds */
  regression: {
    /** Maximum acceptable performance degradation percentage */
    maxPerformanceDegradation: number;
    /** Maximum acceptable coverage decrease */
    maxCoverageDecrease: number;
    /** Maximum acceptable safety score decrease */
    maxSafetyScoreDecrease: number;
  };
}

export interface NotificationSettings {
  /** Enable/disable notifications */
  enabled: boolean;
  /** Webhook URLs for different severities */
  webhooks: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  /** Email settings */
  email: {
    enabled: boolean;
    recipients: {
      critical: string[];
      high: string[];
      medium: string[];
    };
    smtpConfig?: SMTPConfig;
  };
  /** Slack integration */
  slack: {
    enabled: boolean;
    channels: {
      critical: string;
      high: string;
      medium: string;
    };
    webhookUrl?: string;
  };
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EscalationPolicy {
  /** Time to wait before escalating (minutes) */
  escalationTime: number;
  /** Maximum escalation levels */
  maxEscalationLevel: number;
  /** Escalation rules by severity */
  rules: {
    critical: EscalationRule;
    high: EscalationRule;
    medium: EscalationRule;
  };
}

interface EscalationRule {
  /** Initial notification targets */
  initial: string[];
  /** Escalation levels with targets */
  levels: {
    level: number;
    targets: string[];
    delayMinutes: number;
  }[];
}

export interface AlertRouting {
  /** Route alerts based on file patterns */
  filePatterns: {
    pattern: string;
    targets: string[];
  }[];
  /** Route alerts based on alert types */
  alertTypes: {
    type: string;
    targets: string[];
  }[];
  /** Default routing targets */
  defaultTargets: string[];
}

export interface TypeSystemAlert {
  /** Unique alert identifier */
  id: string;
  /** Alert type */
  type:
    | "compilation_performance"
    | "type_safety"
    | "coverage_degradation"
    | "regression_detected";
  /** Severity level */
  severity: "critical" | "high" | "medium" | "low";
  /** Alert title */
  title: string;
  /** Detailed alert message */
  message: string;
  /** Timestamp when alert was created */
  timestamp: number;
  /** Source data that triggered the alert */
  sourceData:
    | CompilationMetrics
    | TypeSafetyReport
    | TypeCoverageAnalysis
    | PerformanceRegression;
  /** Affected files or components */
  affectedComponents: string[];
  /** Suggested remediation actions */
  remediation: string[];
  /** Alert status */
  status: "active" | "acknowledged" | "resolved" | "suppressed";
  /** Escalation information */
  escalation: {
    level: number;
    lastEscalated: number | null;
    acknowledgedBy?: string;
    resolvedBy?: string;
  };
  /** Notification history */
  notifications: NotificationRecord[];
}

interface NotificationRecord {
  /** Notification timestamp */
  timestamp: number;
  /** Notification target */
  target: string;
  /** Notification method */
  method: "webhook" | "email" | "slack";
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Type System Alert Manager
 *
 * Manages alerts for type system health monitoring, including threshold
 * checking, notification sending, and escalation handling.
 */
export class TypeSystemAlertManager {
  private config: AlertConfiguration;
  private activeAlerts: Map<string, TypeSystemAlert> = new Map();
  private alertHistory: TypeSystemAlert[] = [];

  private readonly MAX_ALERT_HISTORY = 1000;
  private readonly ALERT_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor(config: AlertConfiguration) {
    this.config = config;
    this.startAlertCleanup();
  }

  /**
   * Process compilation metrics and generate alerts if needed
   */
  async processCompilationMetrics(
    metrics: CompilationMetrics,
  ): Promise<TypeSystemAlert[]> {
    const alerts: TypeSystemAlert[] = [];

    // Check compilation time threshold
    if (
      metrics.duration > this.config.thresholds.compilation.maxCompilationTime
    ) {
      const alert = this.createAlert({
        type: "compilation_performance",
        severity: this.getSeverityForThreshold(
          metrics.duration,
          this.config.thresholds.compilation.maxCompilationTime,
          0.2, // 20% over threshold = high severity
        ),
        title: "Compilation Time Exceeded",
        message:
          `Compilation took ${metrics.duration}ms, exceeding threshold of ${this.config.thresholds.compilation.maxCompilationTime}ms`,
        sourceData: metrics,
        affectedComponents: metrics.fileMetrics.map((f) => f.filePath),
        remediation: [
          "Check for new dependencies causing slow compilation",
          "Verify incremental compilation is working properly",
          "Consider optimizing complex type definitions",
          "Review import patterns for efficiency",
        ],
      });
      alerts.push(alert);
    }

    // Check memory usage threshold
    if (
      metrics.memoryUsage.peak >
        this.config.thresholds.compilation.maxMemoryUsage
    ) {
      const alert = this.createAlert({
        type: "compilation_performance",
        severity: this.getSeverityForThreshold(
          metrics.memoryUsage.peak,
          this.config.thresholds.compilation.maxMemoryUsage,
          0.3,
        ),
        title: "Compilation Memory Usage High",
        message: `Peak memory usage was ${
          metrics.memoryUsage.peak.toFixed(1)
        }MB, exceeding threshold of ${this.config.thresholds.compilation.maxMemoryUsage}MB`,
        sourceData: metrics,
        affectedComponents: ["TypeScript Compiler"],
        remediation: [
          "Check for memory leaks in type definitions",
          "Consider breaking up large type unions",
          "Verify garbage collection is working effectively",
        ],
      });
      alerts.push(alert);
    }

    // Check cache effectiveness
    if (
      metrics.performanceFlags.cacheEffectiveness <
        this.config.thresholds.compilation.minCacheEffectiveness
    ) {
      const alert = this.createAlert({
        type: "compilation_performance",
        severity: "medium",
        title: "Low Cache Effectiveness",
        message: `Cache effectiveness is ${
          (metrics.performanceFlags.cacheEffectiveness * 100).toFixed(1)
        }%, below threshold of ${
          (this.config.thresholds.compilation.minCacheEffectiveness * 100)
            .toFixed(1)
        }%`,
        sourceData: metrics,
        affectedComponents: ["Incremental Compilation"],
        remediation: [
          "Check if compilation cache is being invalidated unnecessarily",
          "Verify file modification timestamps are correct",
          "Consider cache warming strategies",
        ],
      });
      alerts.push(alert);
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }

    return alerts;
  }

  /**
   * Process type safety report and generate alerts if needed
   */
  async processTypeSafetyReport(
    report: TypeSafetyReport,
  ): Promise<TypeSystemAlert[]> {
    const alerts: TypeSystemAlert[] = [];

    // Check type coverage threshold
    if (
      report.coverage.coveragePercentage <
        this.config.thresholds.typeSafety.minCoverage
    ) {
      const alert = this.createAlert({
        type: "type_safety",
        severity: "medium",
        title: "Low Type Coverage",
        message: `Type coverage is ${
          report.coverage.coveragePercentage.toFixed(1)
        }%, below threshold of ${this.config.thresholds.typeSafety.minCoverage}%`,
        sourceData: report,
        affectedComponents: Object.keys(report.coverage.coverageByFileType),
        remediation: [
          "Add explicit type annotations to untyped variables",
          "Replace any types with specific type definitions",
          "Implement type guards for runtime type checking",
        ],
      });
      alerts.push(alert);
    }

    // Check any type usage
    if (
      report.coverage.anyTypes > this.config.thresholds.typeSafety.maxAnyTypes
    ) {
      const alert = this.createAlert({
        type: "type_safety",
        severity: "high",
        title: "Excessive Any Type Usage",
        message:
          `Found ${report.coverage.anyTypes} any types, exceeding threshold of ${this.config.thresholds.typeSafety.maxAnyTypes}`,
        sourceData: report,
        affectedComponents: this.extractAffectedFilesFromViolations(
          report.violations,
        ),
        remediation: [
          "Replace any types with specific type definitions",
          "Use union types for multiple possible types",
          "Implement proper type guards",
        ],
      });
      alerts.push(alert);
    }

    // Check safety score
    if (report.safetyScore < this.config.thresholds.typeSafety.minSafetyScore) {
      const alert = this.createAlert({
        type: "type_safety",
        severity: "high",
        title: "Low Type Safety Score",
        message:
          `Type safety score is ${report.safetyScore}, below threshold of ${this.config.thresholds.typeSafety.minSafetyScore}`,
        sourceData: report,
        affectedComponents: this.extractAffectedFilesFromViolations(
          report.violations,
        ),
        remediation: [
          "Address critical type safety violations",
          "Improve type coverage across the codebase",
          "Implement stricter TypeScript compiler options",
        ],
      });
      alerts.push(alert);
    }

    // Check critical violations
    const criticalViolations = report.violations.filter((v) =>
      v.severity === "critical"
    );
    if (
      criticalViolations.length >
        this.config.thresholds.typeSafety.maxCriticalViolations
    ) {
      const alert = this.createAlert({
        type: "type_safety",
        severity: "critical",
        title: "Critical Type Safety Violations",
        message:
          `Found ${criticalViolations.length} critical violations, exceeding threshold of ${this.config.thresholds.typeSafety.maxCriticalViolations}`,
        sourceData: report,
        affectedComponents: criticalViolations.map((v) => v.file),
        remediation: criticalViolations.map((v) => v.remediation).slice(0, 5),
      });
      alerts.push(alert);
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }

    return alerts;
  }

  /**
   * Process coverage analysis and generate alerts if needed
   */
  async processCoverageAnalysis(
    analysis: TypeCoverageAnalysis,
  ): Promise<TypeSystemAlert[]> {
    const alerts: TypeSystemAlert[] = [];

    // Check for coverage degradation
    if (
      analysis.trend &&
      analysis.trend.coverageChange <
        -this.config.thresholds.regression.maxCoverageDecrease
    ) {
      const alert = this.createAlert({
        type: "coverage_degradation",
        severity: "high",
        title: "Type Coverage Degradation",
        message: `Type coverage decreased by ${
          Math.abs(analysis.trend.coverageChange).toFixed(1)
        }%`,
        sourceData: analysis,
        affectedComponents: analysis.trend.degradedFiles,
        remediation: [
          "Review recent changes that may have reduced type coverage",
          "Add type annotations to recently modified files",
          "Investigate coverage measurement accuracy",
        ],
      });
      alerts.push(alert);
    }

    // Check low coverage files
    if (analysis.lowCoverageFiles.length > 5) {
      const alert = this.createAlert({
        type: "type_safety",
        severity: "medium",
        title: "Multiple Low Coverage Files",
        message:
          `${analysis.lowCoverageFiles.length} files have coverage below 80%`,
        sourceData: analysis,
        affectedComponents: analysis.lowCoverageFiles.map((f) => f.filePath)
          .slice(0, 10),
        remediation: [
          "Prioritize adding type annotations to low coverage files",
          "Focus on files with high complexity scores first",
          "Consider breaking up complex files",
        ],
      });
      alerts.push(alert);
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }

    return alerts;
  }

  /**
   * Process performance regression and generate alerts
   */
  async processPerformanceRegression(
    regression: PerformanceRegression,
  ): Promise<TypeSystemAlert[]> {
    const alerts: TypeSystemAlert[] = [];

    const alert = this.createAlert({
      type: "regression_detected",
      severity: regression.severity === "critical" ? "critical" : "high",
      title: `Performance Regression: ${regression.type}`,
      message: `${regression.type} regression detected: ${
        regression.magnitude.toFixed(1)
      }% increase`,
      sourceData: regression,
      affectedComponents: [regression.currentMetrics.sessionId],
      remediation: regression.remediation,
    });

    alerts.push(alert);
    await this.processAlert(alert);

    return alerts;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): TypeSystemAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter((alert) => alert.status === "active")
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
  ): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = "acknowledged";
    alert.escalation.acknowledgedBy = acknowledgedBy;

    logger.info(
      "system",
      { message: `[alert-manager] Alert acknowledged: ${alertId} by ${acknowledgedBy}` },
    );
    return true;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = "resolved";
    alert.escalation.resolvedBy = resolvedBy;

    // Move to history
    this.alertHistory.push(alert);
    this.activeAlerts.delete(alertId);

    logger.info("system", { message: `[alert-manager] Alert resolved: ${alertId} by ${resolvedBy}` });
    return true;
  }

  /**
   * Create a new alert
   */
  private createAlert(params: {
    type: TypeSystemAlert["type"];
    severity: TypeSystemAlert["severity"];
    title: string;
    message: string;
    sourceData: TypeSystemAlert["sourceData"];
    affectedComponents: string[];
    remediation: string[];
  }): TypeSystemAlert {
    const alertId = `${params.type}_${Date.now()}_${
      Math.random().toString(36).substr(2, 9)
    }`;

    return {
      id: alertId,
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      timestamp: Date.now(),
      sourceData: params.sourceData,
      affectedComponents: params.affectedComponents,
      remediation: params.remediation,
      status: "active",
      escalation: {
        level: 0,
        lastEscalated: null,
      },
      notifications: [],
    };
  }

  /**
   * Process an alert (store and send notifications)
   */
  private async processAlert(alert: TypeSystemAlert): Promise<void> {
    // Store alert
    this.activeAlerts.set(alert.id, alert);

    // Send initial notifications
    await this.sendNotifications(alert);

    logger.info(
      "system",
      { message: `[alert-manager] Alert created: ${alert.id} (${alert.severity}) - ${alert.title}` },
    );
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: TypeSystemAlert): Promise<void> {
    if (!this.config.notifications.enabled) {
      return;
    }

    const targets = this.getNotificationTargets(alert);

    // Send webhook notifications
    for (const webhookUrl of targets.webhooks) {
      try {
        await this.sendWebhookNotification(alert, webhookUrl);
        alert.notifications.push({
          timestamp: Date.now(),
          target: webhookUrl,
          method: "webhook",
          success: true,
        });
      } catch (error) {
        alert.notifications.push({
          timestamp: Date.now(),
          target: webhookUrl,
          method: "webhook",
          success: false,
          error: error.message,
        });
        logger.error(
          "system",
          { message: `[alert-manager] Webhook notification failed: ${error.message}` },
        );
      }
    }

    // Send email notifications
    for (const email of targets.emails) {
      try {
        await this.sendEmailNotification(alert, email);
        alert.notifications.push({
          timestamp: Date.now(),
          target: email,
          method: "email",
          success: true,
        });
      } catch (error) {
        alert.notifications.push({
          timestamp: Date.now(),
          target: email,
          method: "email",
          success: false,
          error: error.message,
        });
        logger.error(
          "system",
          { message: `[alert-manager] Email notification failed: ${error.message}` },
        );
      }
    }

    // Send Slack notifications
    if (targets.slackChannel && this.config.notifications.slack.webhookUrl) {
      try {
        await this.sendSlackNotification(alert, targets.slackChannel);
        alert.notifications.push({
          timestamp: Date.now(),
          target: targets.slackChannel,
          method: "slack",
          success: true,
        });
      } catch (error) {
        alert.notifications.push({
          timestamp: Date.now(),
          target: targets.slackChannel,
          method: "slack",
          success: false,
          error: error.message,
        });
        logger.error(
          "system",
          { message: `[alert-manager] Slack notification failed: ${error.message}` },
        );
      }
    }
  }

  /**
   * Get notification targets for an alert
   */
  private getNotificationTargets(alert: TypeSystemAlert): {
    webhooks: string[];
    emails: string[];
    slackChannel?: string;
  } {
    const webhooks = this.config.notifications.webhooks[alert.severity] || [];
    const emails = this.config.notifications.email.recipients[alert.severity] ||
      [];
    const slackChannel =
      this.config.notifications.slack.channels[alert.severity];

    return { webhooks, emails, slackChannel };
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    alert: TypeSystemAlert,
    webhookUrl: string,
  ): Promise<void> {
    const payload = {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      affectedComponents: alert.affectedComponents,
      remediation: alert.remediation,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    alert: TypeSystemAlert,
    email: string,
  ): Promise<void> {
    // In a real implementation, this would use an email service
    logger.info("system", { message: `[alert-manager] Would send email to ${email}: ${alert.title}` });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    alert: TypeSystemAlert,
    channel: string,
  ): Promise<void> {
    if (!this.config.notifications.slack.webhookUrl) {
      throw new Error("Slack webhook URL not configured");
    }

    const color = this.getSlackColor(alert.severity);
    const payload = {
      channel,
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: [
          {
            title: "Severity",
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: "Type",
            value: alert.type,
            short: true,
          },
          {
            title: "Affected Components",
            value: alert.affectedComponents.slice(0, 5).join(", "),
            short: false,
          },
        ],
        ts: Math.floor(alert.timestamp / 1000),
      }],
    };

    const response = await fetch(this.config.notifications.slack.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Get Slack color for alert severity
   */
  private getSlackColor(severity: TypeSystemAlert["severity"]): string {
    switch (severity) {
      case "critical":
        return "#ff0000";
      case "high":
        return "#ff8800";
      case "medium":
        return "#ffaa00";
      case "low":
        return "#00aa00";
      default:
        return "#cccccc";
    }
  }

  /**
   * Get severity based on threshold breach magnitude
   */
  private getSeverityForThreshold(
    actualValue: number,
    threshold: number,
    highSeverityMultiplier: number,
  ): "critical" | "high" | "medium" | "low" {
    const ratio = actualValue / threshold;

    if (ratio > 1 + (highSeverityMultiplier * 2)) return "critical";
    if (ratio > 1 + highSeverityMultiplier) return "high";
    if (ratio > 1.1) return "medium";
    return "low";
  }

  /**
   * Extract affected files from type safety violations
   */
  private extractAffectedFilesFromViolations(
    violations: TypeSafetyViolation[],
  ): string[] {
    return [...new Set(violations.map((v) => v.file))].slice(0, 10);
  }

  /**
   * Start alert cleanup process
   */
  private startAlertCleanup(): void {
    setInterval(() => {
      this.cleanupOldAlerts();
    }, this.ALERT_CLEANUP_INTERVAL);
  }

  /**
   * Clean up old resolved alerts
   */
  private cleanupOldAlerts(): void {
    const now = Date.now();
    const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

    const initialCount = this.alertHistory.length;
    this.alertHistory = this.alertHistory.filter(
      (alert) => now - alert.timestamp < retentionPeriod,
    );

    // Keep only the most recent alerts if we exceed the limit
    if (this.alertHistory.length > this.MAX_ALERT_HISTORY) {
      this.alertHistory = this.alertHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_ALERT_HISTORY);
    }

    const cleaned = initialCount - this.alertHistory.length;
    if (cleaned > 0) {
      logger.info("system", { message: `[alert-manager] Cleaned up ${cleaned} old alerts` });
    }
  }
}

/**
 * Default alert configuration
 */
export const defaultAlertConfiguration: AlertConfiguration = {
  thresholds: {
    compilation: {
      maxCompilationTime: 30000, // 30 seconds
      maxMemoryUsage: 1024, // 1GB
      minCacheEffectiveness: 0.7, // 70%
      maxErrors: 0,
    },
    typeSafety: {
      minCoverage: 80, // 80%
      maxAnyTypes: 10,
      minSafetyScore: 75,
      maxCriticalViolations: 0,
    },
    regression: {
      maxPerformanceDegradation: 20, // 20%
      maxCoverageDecrease: 5, // 5%
      maxSafetyScoreDecrease: 10, // 10 points
    },
  },
  notifications: {
    enabled: true,
    webhooks: {
      critical: [],
      high: [],
      medium: [],
      low: [],
    },
    email: {
      enabled: false,
      recipients: {
        critical: [],
        high: [],
        medium: [],
      },
    },
    slack: {
      enabled: false,
      channels: {
        critical: "#alerts-critical",
        high: "#alerts-high",
        medium: "#alerts-medium",
      },
    },
  },
  escalation: {
    escalationTime: 30, // 30 minutes
    maxEscalationLevel: 3,
    rules: {
      critical: {
        initial: ["team-lead"],
        levels: [
          { level: 1, targets: ["engineering-manager"], delayMinutes: 15 },
          { level: 2, targets: ["director"], delayMinutes: 30 },
          { level: 3, targets: ["on-call"], delayMinutes: 60 },
        ],
      },
      high: {
        initial: ["team-lead"],
        levels: [
          { level: 1, targets: ["engineering-manager"], delayMinutes: 60 },
        ],
      },
      medium: {
        initial: ["team-lead"],
        levels: [],
      },
    },
  },
  routing: {
    filePatterns: [],
    alertTypes: [],
    defaultTargets: ["team-lead"],
  },
};
