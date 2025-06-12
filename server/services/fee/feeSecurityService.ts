import { logger } from "$lib/utils/logger.ts";

export interface FeeSecurityConfig {
  minFeeRate: number; // Minimum allowed fee rate (sats/vB)
  maxFeeRate: number; // Maximum allowed fee rate (sats/vB)
  maxCacheAge: number; // Maximum cache age in milliseconds
  suspiciousThreshold: number; // Threshold for suspicious activity
  alertCooldown: number; // Cooldown between alerts in milliseconds
}

export interface SecurityValidationResult {
  isValid: boolean;
  violations: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  action: "allow" | "warn" | "block";
}

export interface SecurityEvent {
  type: "cache_poisoning" | "invalid_data" | "suspicious_activity" | "rate_limit_exceeded";
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  details: Record<string, any>;
  timestamp: number;
  clientInfo?: {
    ip?: string;
    userAgent?: string;
    referer?: string;
  };
}

export class FeeSecurityService {
  private static config: FeeSecurityConfig = {
    minFeeRate: 1, // 1 sat/vB minimum
    maxFeeRate: 1000, // 1000 sats/vB maximum (extremely high but possible during congestion)
    maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
    suspiciousThreshold: 10, // 10 violations per hour
    alertCooldown: 5 * 60 * 1000, // 5 minutes between alerts
  };

  private static recentEvents: SecurityEvent[] = [];
  private static lastAlertTime = new Map<string, number>();
  private static violationCounts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Validate fee data for security issues
   */
  static validateFeeData(
    feeData: any,
    source: string,
    clientInfo?: SecurityEvent["clientInfo"],
  ): SecurityValidationResult {
    const violations: string[] = [];
    let riskLevel: SecurityValidationResult["riskLevel"] = "low";

    // Basic structure validation
    if (!feeData || typeof feeData !== "object") {
      violations.push("Invalid fee data structure");
      riskLevel = "high";
    }

    // Fee rate validation
    if (feeData && typeof feeData.recommendedFee !== "number") {
      violations.push("Missing or invalid recommendedFee");
      riskLevel = "high";
    } else if (feeData) {
      if (feeData.recommendedFee < this.config.minFeeRate) {
        violations.push(`Fee rate too low: ${feeData.recommendedFee} < ${this.config.minFeeRate}`);
        // Only set to medium if risk level is still low
        if (riskLevel === "low") {
          riskLevel = "medium";
        }
      }

      if (feeData.recommendedFee > this.config.maxFeeRate) {
        violations.push(`Fee rate too high: ${feeData.recommendedFee} > ${this.config.maxFeeRate}`);
        // Always set to high for fee too high
        riskLevel = "high";
      }
    }

    // Source validation
    if (!feeData || !feeData.source || typeof feeData.source !== "string") {
      violations.push("Missing or invalid source");
      // Only set to medium if risk level is still low
      if (riskLevel === "low") {
        riskLevel = "medium";
      }
    }

          // Timestamp validation
      if (feeData && feeData.timestamp) {
        const age = Date.now() - feeData.timestamp;
        if (age > this.config.maxCacheAge) {
          violations.push(`Data too old: ${Math.round(age / 1000 / 60)} minutes`);
          // Only set to medium if risk level is still low
          if (riskLevel === "low") {
            riskLevel = "medium";
          }
        }
      }

    // Check for suspicious patterns
    if (feeData && this.detectSuspiciousPatterns(feeData, source)) {
      violations.push("Suspicious data patterns detected");
      // Only elevate risk level if it's not already high or critical
      if (riskLevel === "low") {
        riskLevel = "high";
      }
    }

    // Determine action based on risk level
    let action: SecurityValidationResult["action"] = "allow";
    if (riskLevel === "high" || riskLevel === "critical") {
      action = "block";
    } else if (riskLevel === "medium") {
      action = "warn";
    }

    // Log security event if violations found
    if (violations.length > 0) {
      this.logSecurityEvent({
        type: "invalid_data",
        severity: riskLevel,
        source,
        details: {
          violations,
          feeData: this.sanitizeFeeData(feeData),
        },
        timestamp: Date.now(),
        clientInfo,
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      riskLevel,
      action,
    };
  }

  /**
   * Monitor for cache poisoning attempts
   */
  static monitorCachePoisoning(
    cacheKey: string,
    oldValue: any,
    newValue: any,
    source: string,
  ): boolean {
    const suspiciousChanges: string[] = [];

    // Check for dramatic fee changes
    if (oldValue?.recommendedFee && newValue?.recommendedFee) {
      const changeRatio = newValue.recommendedFee / oldValue.recommendedFee;
      if (changeRatio > 10 || changeRatio < 0.1) {
        suspiciousChanges.push(
          `Dramatic fee change: ${oldValue.recommendedFee} → ${newValue.recommendedFee}`,
        );
      }
    }

    // Check for source inconsistencies
    if (oldValue?.source && newValue?.source && oldValue.source !== newValue.source) {
      // Allow fallback transitions but flag unexpected source changes
      const validTransitions = [
        "mempool → quicknode",
        "mempool → cached",
        "quicknode → cached",
        "cached → mempool",
        "cached → quicknode",
      ];
      const transition = `${oldValue.source} → ${newValue.source}`;
      if (!validTransitions.includes(transition)) {
        suspiciousChanges.push(`Unexpected source change: ${transition}`);
      }
    }

    // Check for timestamp manipulation
    if (newValue?.timestamp && newValue.timestamp > Date.now() + 60000) {
      suspiciousChanges.push("Future timestamp detected");
    }

    if (suspiciousChanges.length > 0) {
      this.logSecurityEvent({
        type: "cache_poisoning",
        severity: "high",
        source,
        details: {
          cacheKey,
          suspiciousChanges,
          oldValue: this.sanitizeFeeData(oldValue),
          newValue: this.sanitizeFeeData(newValue),
        },
        timestamp: Date.now(),
      });

      return true; // Suspicious activity detected
    }

    return false;
  }

  /**
   * Log security events and trigger alerts
   */
  static logSecurityEvent(event: SecurityEvent): void {
    // Add to recent events
    this.recentEvents.push(event);

    // Keep only last 1000 events
    if (this.recentEvents.length > 1000) {
      this.recentEvents = this.recentEvents.slice(-1000);
    }

    // Update violation counts
    this.updateViolationCounts(event.source);

    // Log to application logger
    logger.warn("stamps", {
      message: "Security event detected",
      type: event.type,
      severity: event.severity,
      source: event.source,
      details: event.details,
      clientInfo: event.clientInfo,
    });

    // Log security event for monitoring
    console.warn(
      `[SECURITY MONITORING] ${event.type.toUpperCase()}: ${event.severity} severity from ${event.source}`,
      {
        violations: event.details.violations || [],
        clientInfo: event.clientInfo,
      },
    );

    // Trigger immediate alerts for critical events
    if (event.severity === "critical") {
      this.triggerImmediateAlert(event);
    }

    console.warn(
      `[SECURITY] ${event.type.toUpperCase()}: ${event.severity} severity from ${event.source}`,
      event.details,
    );
  }

  /**
   * Get security statistics and recent events
   */
  static getSecurityReport(): {
    config: FeeSecurityConfig;
    recentEvents: SecurityEvent[];
    violationCounts: Record<string, { count: number; resetTime: number }>;
    summary: {
      totalEvents: number;
      eventsByType: Record<string, number>;
      eventsBySeverity: Record<string, number>;
      topSources: Array<{ source: string; count: number }>;
    };
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};

    this.recentEvents.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      sourceCounts[event.source] = (sourceCounts[event.source] || 0) + 1;
    });

    const topSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      config: { ...this.config },
      recentEvents: [...this.recentEvents],
      violationCounts: Object.fromEntries(this.violationCounts),
      summary: {
        totalEvents: this.recentEvents.length,
        eventsByType,
        eventsBySeverity,
        topSources,
      },
    };
  }

  /**
   * Update security configuration
   */
  static updateConfig(newConfig: Partial<FeeSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    logger.info("stamps", {
      message: "Fee security configuration updated",
      config: this.config,
    });
  }

  /**
   * Clear security events (for testing or maintenance)
   */
  static clearEvents(): void {
    this.recentEvents = [];
    this.violationCounts.clear();
    this.lastAlertTime.clear();
    
    logger.info("stamps", {
      message: "Security events cleared",
    });
  }

  /**
   * Detect suspicious patterns in fee data
   */
  private static detectSuspiciousPatterns(feeData: any, source: string): boolean {
    // Check for impossible fee combinations
    if (feeData.fastestFee && feeData.halfHourFee && feeData.hourFee) {
      if (
        feeData.fastestFee < feeData.halfHourFee ||
        feeData.halfHourFee < feeData.hourFee
      ) {
        return true; // Fee priorities are inverted
      }
    }

    // Check for repeated identical values (possible static/fake data)
    if (feeData.fastestFee === feeData.halfHourFee && feeData.halfHourFee === feeData.hourFee) {
      return true; // All fees identical (suspicious)
    }

    // Check for non-integer fees (mempool.space returns integers)
    if (source === "mempool" && feeData.recommendedFee % 1 !== 0) {
      return true; // Non-integer fee from mempool.space
    }

    return false;
  }

  /**
   * Sanitize fee data for logging (remove sensitive info)
   */
  private static sanitizeFeeData(feeData: any): any {
    if (!feeData || typeof feeData !== "object") {
      return feeData;
    }

    // Create a copy with only safe fields
    return {
      recommendedFee: feeData.recommendedFee,
      fastestFee: feeData.fastestFee,
      halfHourFee: feeData.halfHourFee,
      hourFee: feeData.hourFee,
      source: feeData.source,
      timestamp: feeData.timestamp,
      fallbackUsed: feeData.fallbackUsed,
    };
  }

  /**
   * Update violation counts for rate limiting
   */
  private static updateViolationCounts(source: string): void {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    const current = this.violationCounts.get(source);
    if (!current || now > current.resetTime) {
      this.violationCounts.set(source, { count: 1, resetTime: now + hourMs });
    } else {
      current.count++;
    }
  }

  /**
   * Trigger immediate alert for critical events
   */
  private static triggerImmediateAlert(event: SecurityEvent): void {
    const alertKey = `${event.type}_${event.source}`;
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;
    const now = Date.now();

    if (now - lastAlert > this.config.alertCooldown) {
      this.lastAlertTime.set(alertKey, now);

      // In a real system, this would send alerts via email, Slack, etc.
      console.error(
        `[CRITICAL SECURITY ALERT] ${event.type} from ${event.source}:`,
        event.details,
      );

      // Log critical alert
      logger.error("stamps", {
        message: "Critical security alert triggered",
        event,
      });
    }
  }
} 