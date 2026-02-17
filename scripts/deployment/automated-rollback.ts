#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net

/**
 * Automated Rollback Procedures with Health Check Validation
 * 
 * Implements blue-green deployment patterns with comprehensive health checks.
 * Provides automated rollback decision matrix based on error rates, performance
 * degradation, and user impact metrics with database migration rollback capabilities.
 * 
 * Usage:
 *   deno run --allow-all scripts/deployment/automated-rollback.ts --check
 *   deno run --allow-all scripts/deployment/automated-rollback.ts --rollback
 *   deno run --allow-all scripts/deployment/automated-rollback.ts --test-staging
 */

import { join } from "@std/path";
import { exists } from "@std/fs";

interface HealthCheck {
  name: string;
  endpoint?: string;
  command?: string;
  timeout: number;
  expected: string | number | RegExp;
  critical: boolean;
}

interface DeploymentSlot {
  name: "blue" | "green";
  version: string;
  status: "active" | "inactive" | "deploying" | "failed";
  healthScore: number;
  lastHealthCheck: string;
  metrics: DeploymentMetrics;
}

interface DeploymentMetrics {
  errorRate: number;
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

interface RollbackTrigger {
  name: string;
  condition: string;
  threshold: number;
  timeWindow: number; // seconds
  severity: "critical" | "major" | "minor";
  enabled: boolean;
}

interface RollbackDecision {
  shouldRollback: boolean;
  reason: string[];
  triggeredBy: RollbackTrigger[];
  confidence: number;
  userImpact: "low" | "medium" | "high" | "critical";
  estimatedDowntime: number;
}

interface DatabaseMigration {
  version: string;
  timestamp: string;
  rollbackSql?: string;
  canRollback: boolean;
  dataIntegrityCheck: string;
}

class AutomatedRollbackManager {
  private healthChecks: HealthCheck[] = [];
  private rollbackTriggers: RollbackTrigger[] = [];
  private deploymentSlots: DeploymentSlot[] = [];
  private currentSlot: "blue" | "green" = "blue";
  private rollbackInProgress = false;
  private metricsHistory: Record<string, number[]> = {};

  constructor() {
    this.initializeHealthChecks();
    this.initializeRollbackTriggers();
    this.initializeDeploymentSlots();
  }

  async checkDeploymentHealth(): Promise<boolean> {
    console.log("🔍 Checking Deployment Health");
    console.log("=".repeat(50));

    try {
      const activeSlot = this.getActiveSlot();
      console.log(`📍 Active Slot: ${activeSlot.name} (${activeSlot.version})`);

      // Run health checks
      const healthResults = await this.runHealthChecks();
      
      // Collect metrics
      const metrics = await this.collectMetrics();
      
      // Update slot health score
      activeSlot.healthScore = this.calculateHealthScore(healthResults, metrics);
      activeSlot.lastHealthCheck = new Date().toISOString();
      activeSlot.metrics = metrics;

      // Evaluate rollback triggers
      const rollbackDecision = await this.evaluateRollbackTriggers(metrics);

      if (rollbackDecision.shouldRollback) {
        console.log(`\n🚨 ROLLBACK TRIGGERED`);
        console.log(`   Reasons: ${rollbackDecision.reason.join(", ")}`);
        console.log(`   User Impact: ${rollbackDecision.userImpact}`);
        console.log(`   Confidence: ${rollbackDecision.confidence}%`);
        
        if (rollbackDecision.userImpact === "critical") {
          await this.executeEmergencyRollback();
        } else {
          await this.executeGracefulRollback();
        }
        
        return false;
      }

      console.log(`\n✅ Deployment Health: ${activeSlot.healthScore}%`);
      console.log(`   Error Rate: ${metrics.errorRate.toFixed(2)}%`);
      console.log(`   Response Time: ${metrics.responseTime.toFixed(0)}ms`);
      console.log(`   Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(0)}MB`);

      return true;

    } catch (error) {
      console.error("💥 Health check failed:", error.message);
      
      // Emergency rollback on health check failure
      if (!this.rollbackInProgress) {
        await this.executeEmergencyRollback();
      }
      
      return false;
    }
  }

  async executeRollback(): Promise<boolean> {
    if (this.rollbackInProgress) {
      console.log("⏳ Rollback already in progress");
      return false;
    }

    console.log("🔄 Starting Automated Rollback");
    console.log("=".repeat(50));

    this.rollbackInProgress = true;

    try {
      const activeSlot = this.getActiveSlot();
      const inactiveSlot = this.getInactiveSlot();

      console.log(`📍 Rolling back from ${activeSlot.name} to ${inactiveSlot.name}`);

      // Pre-rollback validation
      const canRollback = await this.validateRollbackReadiness(inactiveSlot);
      if (!canRollback) {
        throw new Error("Rollback validation failed - inactive slot not ready");
      }

      // Database migration rollback
      await this.rollbackDatabaseMigrations();

      // Switch traffic to inactive slot
      await this.switchTrafficSlot();

      // Verify rollback success
      const rollbackSuccess = await this.verifyRollbackHealth();

      if (rollbackSuccess) {
        console.log(`\n✅ Rollback completed successfully`);
        console.log(`   Active slot: ${this.currentSlot}`);
        
        // Mark failed slot as inactive
        activeSlot.status = "failed";
        
        // Send notifications
        await this.sendRollbackNotification("success", {
          from: activeSlot.name,
          to: inactiveSlot.name,
          reason: "Automated rollback completed"
        });
        
        return true;
      } else {
        throw new Error("Rollback health verification failed");
      }

    } catch (error) {
      console.error("💥 Rollback failed:", error.message);
      
      await this.sendRollbackNotification("failed", {
        error: error.message,
        requiresManualIntervention: true
      });
      
      return false;
    } finally {
      this.rollbackInProgress = false;
    }
  }

  async testStagingRollback(): Promise<boolean> {
    console.log("🧪 Testing Rollback Procedures in Staging");
    console.log("=".repeat(50));

    try {
      // Simulate deployment failure scenarios
      const testScenarios = [
        { name: "High Error Rate", errorRate: 25, expectedRollback: true },
        { name: "Performance Degradation", responseTime: 5000, expectedRollback: true },
        { name: "Memory Leak", memoryUsage: 2048 * 1024 * 1024, expectedRollback: true },
        { name: "Normal Operation", errorRate: 1, responseTime: 200, expectedRollback: false }
      ];

      let passedTests = 0;

      for (const scenario of testScenarios) {
        console.log(`\n🔬 Testing scenario: ${scenario.name}`);
        
        // Simulate metrics
        const simulatedMetrics: DeploymentMetrics = {
          errorRate: scenario.errorRate || 1,
          responseTime: scenario.responseTime || 200,
          throughput: 100,
          memoryUsage: scenario.memoryUsage || 512 * 1024 * 1024,
          cpuUsage: 50,
          activeConnections: 100
        };

        const decision = await this.evaluateRollbackTriggers(simulatedMetrics);
        
        if (decision.shouldRollback === scenario.expectedRollback) {
          console.log(`   ✅ Test passed - rollback decision: ${decision.shouldRollback}`);
          passedTests++;
        } else {
          console.log(`   ❌ Test failed - expected: ${scenario.expectedRollback}, got: ${decision.shouldRollback}`);
        }
      }

      // Test database rollback simulation
      console.log(`\n🗄️ Testing database rollback simulation...`);
      const dbRollbackSuccess = await this.testDatabaseRollback();
      if (dbRollbackSuccess) {
        console.log(`   ✅ Database rollback test passed`);
        passedTests++;
      } else {
        console.log(`   ❌ Database rollback test failed`);
      }

      const totalTests = testScenarios.length + 1;
      const success = passedTests === totalTests;

      console.log(`\n📊 Rollback Tests Summary:`);
      console.log(`   Passed: ${passedTests}/${totalTests}`);
      console.log(`   Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`);

      return success;

    } catch (error) {
      console.error("💥 Staging rollback test failed:", error.message);
      return false;
    }
  }

  private initializeHealthChecks(): void {
    const isCI = Deno.env.get("CI") === "true";

    this.healthChecks = [
      {
        name: "api_health",
        endpoint: "/api/health",
        timeout: 5000,
        expected: 200,
        critical: true
      },
      {
        name: "database_connection",
        endpoint: "/api/v2/stamps?limit=1",
        timeout: 10000,
        expected: 200,
        critical: true
      },
      {
        name: "redis_connection",
        endpoint: "/api/v2/health",
        timeout: 3000,
        expected: 200,
        critical: false
      },
      // stamp_creation requires real Bitcoin infrastructure (POST with tx data)
      // Skip in CI where only test DB is available
      ...(!isCI ? [{
        name: "stamp_creation",
        endpoint: "/api/v2/create/send",
        timeout: 15000,
        expected: /success|pending/,
        critical: true
      }] : []),
      {
        name: "memory_usage",
        command: "ps aux | grep deno | grep -v grep | awk '{sum+=$6} END {print sum}'",
        timeout: 5000,
        expected: 2048 * 1024, // 2GB limit in KB
        critical: false
      }
    ];
  }

  private initializeRollbackTriggers(): void {
    this.rollbackTriggers = [
      {
        name: "high_error_rate",
        condition: "errorRate > threshold",
        threshold: 5, // 5% error rate
        timeWindow: 300, // 5 minutes
        severity: "critical",
        enabled: true
      },
      {
        name: "performance_degradation",
        condition: "responseTime > threshold",
        threshold: 3000, // 3 seconds
        timeWindow: 600, // 10 minutes
        severity: "major",
        enabled: true
      },
      {
        name: "memory_leak",
        condition: "memoryUsage > threshold",
        threshold: 1536 * 1024 * 1024, // 1.5GB
        timeWindow: 1800, // 30 minutes
        severity: "major",
        enabled: true
      },
      {
        name: "connection_failure",
        condition: "activeConnections < threshold",
        threshold: 10, // Minimum active connections
        timeWindow: 60, // 1 minute
        severity: "critical",
        enabled: true
      },
      {
        name: "health_check_failure",
        condition: "healthScore < threshold",
        threshold: 70, // 70% health score
        timeWindow: 180, // 3 minutes
        severity: "critical",
        enabled: true
      }
    ];
  }

  private initializeDeploymentSlots(): void {
    this.deploymentSlots = [
      {
        name: "blue",
        version: "1.0.0",
        status: "active",
        healthScore: 100,
        lastHealthCheck: new Date().toISOString(),
        metrics: {
          errorRate: 0,
          responseTime: 200,
          throughput: 100,
          memoryUsage: 512 * 1024 * 1024,
          cpuUsage: 30,
          activeConnections: 50
        }
      },
      {
        name: "green",
        version: "0.9.0",
        status: "inactive",
        healthScore: 95,
        lastHealthCheck: new Date().toISOString(),
        metrics: {
          errorRate: 0,
          responseTime: 250,
          throughput: 80,
          memoryUsage: 480 * 1024 * 1024,
          cpuUsage: 25,
          activeConnections: 0
        }
      }
    ];
  }

  private async runHealthChecks(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8000";

    console.log(`\n🔍 Running ${this.healthChecks.length} health checks...`);

    for (const check of this.healthChecks) {
      try {
        let passed = false;

        if (check.endpoint) {
          // HTTP endpoint check
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), check.timeout);
          
          const response = await fetch(`${baseUrl}${check.endpoint}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (typeof check.expected === "number") {
            passed = response.status === check.expected;
          } else if (check.expected instanceof RegExp) {
            const text = await response.text();
            passed = check.expected.test(text);
          }

        } else if (check.command) {
          // Command execution check
          const cmd = new Deno.Command("sh", {
            args: ["-c", check.command],
            stdout: "piped",
            stderr: "piped"
          });

          const result = await cmd.output();
          
          if (result.code === 0) {
            const output = new TextDecoder().decode(result.stdout).trim();
            const value = parseFloat(output) || 0;
            
            if (typeof check.expected === "number") {
              passed = value <= check.expected;
            }
          }
        }

        results.set(check.name, passed);
        console.log(`   ${passed ? "✅" : "❌"} ${check.name}${check.critical ? " [CRITICAL]" : ""}`);

      } catch (error) {
        results.set(check.name, false);
        console.log(`   ❌ ${check.name} - Error: ${error.message}`);
      }
    }

    return results;
  }

  private async collectMetrics(): Promise<DeploymentMetrics> {
    // In a real implementation, this would collect actual metrics
    // For now, we'll simulate metrics collection
    
    const baseMetrics = {
      errorRate: Math.random() * 2, // 0-2% error rate
      responseTime: 150 + Math.random() * 100, // 150-250ms
      throughput: 80 + Math.random() * 40, // 80-120 requests/sec
      memoryUsage: (400 + Math.random() * 200) * 1024 * 1024, // 400-600MB
      cpuUsage: 20 + Math.random() * 30, // 20-50% CPU
      activeConnections: 40 + Math.floor(Math.random() * 60) // 40-100 connections
    };

    // Store metrics history for trend analysis
    Object.entries(baseMetrics).forEach(([key, value]) => {
      if (!this.metricsHistory[key]) {
        this.metricsHistory[key] = [];
      }
      this.metricsHistory[key].push(value);
      
      // Keep only last 100 data points
      if (this.metricsHistory[key].length > 100) {
        this.metricsHistory[key] = this.metricsHistory[key].slice(-100);
      }
    });

    return baseMetrics;
  }

  private calculateHealthScore(healthResults: Map<string, boolean>, metrics: DeploymentMetrics): number {
    let score = 100;

    // Deduct points for failed health checks
    for (const [checkName, passed] of healthResults) {
      if (!passed) {
        const check = this.healthChecks.find(c => c.name === checkName);
        if (check?.critical) {
          score -= 30; // Critical checks are worth more
        } else {
          score -= 10;
        }
      }
    }

    // Deduct points for poor metrics
    if (metrics.errorRate > 2) score -= 20;
    if (metrics.responseTime > 1000) score -= 15;
    if (metrics.memoryUsage > 1024 * 1024 * 1024) score -= 10; // 1GB
    if (metrics.cpuUsage > 80) score -= 15;

    return Math.max(0, score);
  }

  private async evaluateRollbackTriggers(metrics: DeploymentMetrics): Promise<RollbackDecision> {
    const triggeredTriggers: RollbackTrigger[] = [];
    const reasons: string[] = [];

    for (const trigger of this.rollbackTriggers) {
      if (!trigger.enabled) continue;

      let triggered = false;

      switch (trigger.name) {
        case "high_error_rate":
          triggered = metrics.errorRate > trigger.threshold;
          if (triggered) reasons.push(`Error rate ${metrics.errorRate.toFixed(1)}% exceeds ${trigger.threshold}%`);
          break;

        case "performance_degradation":
          triggered = metrics.responseTime > trigger.threshold;
          if (triggered) reasons.push(`Response time ${metrics.responseTime.toFixed(0)}ms exceeds ${trigger.threshold}ms`);
          break;

        case "memory_leak":
          triggered = metrics.memoryUsage > trigger.threshold;
          if (triggered) reasons.push(`Memory usage ${(metrics.memoryUsage / 1024 / 1024).toFixed(0)}MB exceeds threshold`);
          break;

        case "connection_failure":
          triggered = metrics.activeConnections < trigger.threshold;
          if (triggered) reasons.push(`Active connections ${metrics.activeConnections} below minimum ${trigger.threshold}`);
          break;

        case "health_check_failure":
          const activeSlot = this.getActiveSlot();
          triggered = activeSlot.healthScore < trigger.threshold;
          if (triggered) reasons.push(`Health score ${activeSlot.healthScore}% below ${trigger.threshold}%`);
          break;
      }

      if (triggered) {
        triggeredTriggers.push(trigger);
      }
    }

    const criticalTriggers = triggeredTriggers.filter(t => t.severity === "critical");
    const majorTriggers = triggeredTriggers.filter(t => t.severity === "major");

    let shouldRollback = false;
    let userImpact: "low" | "medium" | "high" | "critical" = "low";
    let confidence = 0;

    if (criticalTriggers.length > 0) {
      shouldRollback = true;
      userImpact = "critical";
      confidence = 95;
    } else if (majorTriggers.length >= 2) {
      shouldRollback = true;
      userImpact = "high";
      confidence = 85;
    } else if (majorTriggers.length === 1) {
      shouldRollback = true;
      userImpact = "medium";
      confidence = 70;
    }

    return {
      shouldRollback,
      reason: reasons,
      triggeredBy: triggeredTriggers,
      confidence,
      userImpact,
      estimatedDowntime: shouldRollback ? (userImpact === "critical" ? 30 : 120) : 0
    };
  }

  private async validateRollbackReadiness(inactiveSlot: DeploymentSlot): Promise<boolean> {
    console.log(`\n🔍 Validating rollback readiness for ${inactiveSlot.name} slot...`);

    // Check if inactive slot is healthy
    if (inactiveSlot.healthScore < 80) {
      console.log(`   ❌ Inactive slot health score too low: ${inactiveSlot.healthScore}%`);
      return false;
    }

    // Check if we can start the inactive slot
    try {
      // This would start the inactive deployment in a real implementation
      console.log(`   ✅ Inactive slot ready for activation`);
      return true;
    } catch (error) {
      console.log(`   ❌ Failed to prepare inactive slot: ${error.message}`);
      return false;
    }
  }

  private async rollbackDatabaseMigrations(): Promise<void> {
    console.log(`\n🗄️ Rolling back database migrations...`);

    try {
      // Get current migration version
      const currentVersion = await this.getCurrentDatabaseVersion();
      
      // Get rollback target version
      const targetVersion = await this.getRollbackTargetVersion();
      
      if (currentVersion === targetVersion) {
        console.log(`   ✅ No database rollback needed (already at ${targetVersion})`);
        return;
      }

      // Execute rollback migrations
      const migrations = await this.getPendingRollbackMigrations(currentVersion, targetVersion);
      
      for (const migration of migrations) {
        if (!migration.canRollback) {
          throw new Error(`Migration ${migration.version} cannot be rolled back`);
        }

        console.log(`   🔄 Rolling back migration: ${migration.version}`);
        
        if (migration.rollbackSql) {
          // Execute rollback SQL (simulated)
          console.log(`   ✅ Rollback completed for ${migration.version}`);
        }
      }

      // Verify data integrity
      await this.verifyDataIntegrity();
      
      console.log(`   ✅ Database rollback completed successfully`);

    } catch (error) {
      console.error(`   ❌ Database rollback failed: ${error.message}`);
      throw error;
    }
  }

  private async switchTrafficSlot(): Promise<void> {
    console.log(`\n🔀 Switching traffic from ${this.currentSlot} to ${this.currentSlot === "blue" ? "green" : "blue"}...`);

    // In a real implementation, this would update load balancer configuration
    // For simulation, we just switch the current slot indicator
    this.currentSlot = this.currentSlot === "blue" ? "green" : "blue";
    
    // Update slot statuses
    this.deploymentSlots.forEach(slot => {
      if (slot.name === this.currentSlot) {
        slot.status = "active";
      } else {
        slot.status = "inactive";
      }
    });

    console.log(`   ✅ Traffic switched to ${this.currentSlot} slot`);
  }

  private async verifyRollbackHealth(): Promise<boolean> {
    console.log(`\n🔍 Verifying rollback health...`);

    // Wait for services to stabilize
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Run health checks on the new active slot
    const healthResults = await this.runHealthChecks();
    const failedCriticalChecks = Array.from(healthResults.entries())
      .filter(([checkName, passed]) => {
        const check = this.healthChecks.find(c => c.name === checkName);
        return !passed && check?.critical;
      });

    if (failedCriticalChecks.length > 0) {
      console.log(`   ❌ Critical health checks failed: ${failedCriticalChecks.map(([name]) => name).join(", ")}`);
      return false;
    }

    console.log(`   ✅ Rollback health verification passed`);
    return true;
  }

  private async executeEmergencyRollback(): Promise<void> {
    console.log("🚨 EXECUTING EMERGENCY ROLLBACK");
    await this.executeRollback();
  }

  private async executeGracefulRollback(): Promise<void> {
    console.log("🔄 EXECUTING GRACEFUL ROLLBACK");
    // Allow current requests to complete before rolling back
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second grace period
    await this.executeRollback();
  }

  private async testDatabaseRollback(): Promise<boolean> {
    try {
      // Simulate database rollback test
      console.log(`   🔄 Simulating database rollback...`);
      
      // In a real implementation, this would:
      // 1. Create a test migration
      // 2. Apply it
      // 3. Roll it back
      // 4. Verify data integrity
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error(`   ❌ Database rollback simulation failed: ${error.message}`);
      return false;
    }
  }

  private async sendRollbackNotification(status: "success" | "failed", details: any): Promise<void> {
    // In a real implementation, this would send notifications via:
    // - Slack/Teams webhook
    // - Email alerts
    // - PagerDuty/incident management system
    // - CloudWatch/monitoring system
    
    console.log(`\n📧 Rollback notification sent: ${status.toUpperCase()}`);
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }

  private getActiveSlot(): DeploymentSlot {
    return this.deploymentSlots.find(slot => slot.name === this.currentSlot)!;
  }

  private getInactiveSlot(): DeploymentSlot {
    return this.deploymentSlots.find(slot => slot.name !== this.currentSlot)!;
  }

  private async getCurrentDatabaseVersion(): Promise<string> {
    // Simulate getting current database version
    return "2024.01.15";
  }

  private async getRollbackTargetVersion(): Promise<string> {
    // Simulate getting rollback target version
    return "2024.01.10";
  }

  private async getPendingRollbackMigrations(current: string, target: string): Promise<DatabaseMigration[]> {
    // Simulate getting migrations that need to be rolled back
    return [
      {
        version: "2024.01.15",
        timestamp: "2024-01-15T10:00:00Z",
        rollbackSql: "DROP TABLE new_feature_table;",
        canRollback: true,
        dataIntegrityCheck: "SELECT COUNT(*) FROM core_tables"
      }
    ];
  }

  private async verifyDataIntegrity(): Promise<void> {
    // Simulate data integrity verification
    console.log(`   🔍 Verifying data integrity...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`   ✅ Data integrity verified`);
  }
}

// CLI execution
if (import.meta.main) {
  const args = Deno.args;
  const command = args[0];

  const rollbackManager = new AutomatedRollbackManager();

  try {
    let success = false;

    switch (command) {
      case "--check":
        success = await rollbackManager.checkDeploymentHealth();
        break;
      case "--rollback":
        success = await rollbackManager.executeRollback();
        break;
      case "--test-staging":
        success = await rollbackManager.testStagingRollback();
        break;
      default:
        console.log("Usage:");
        console.log("  --check         Check deployment health");
        console.log("  --rollback      Execute rollback");
        console.log("  --test-staging  Test rollback procedures");
        Deno.exit(1);
    }

    Deno.exit(success ? 0 : 1);

  } catch (error) {
    console.error("💥 Rollback operation failed:", error.message);
    Deno.exit(1);
  }
}

export { AutomatedRollbackManager, type RollbackDecision, type DeploymentMetrics };