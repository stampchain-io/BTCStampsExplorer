#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Progress Aggregation System for TypeScript Error Resolution Agents
 * 
 * Collects, aggregates, and reports progress from all 6 parallel agents
 * Provides real-time metrics, velocity tracking, and completion estimation
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

// ==================== INTERFACES ====================

interface AgentProgress {
  id: string;
  name: string;
  branch: string;
  errorType: string;
  targetErrors: number;
  currentErrors: number;
  resolvedErrors: number;
  progress: number;
  velocity: number; // errors per hour
  eta: string;
  status: 'not-started' | 'active' | 'completed' | 'blocked' | 'error';
  lastUpdate: Date;
  sessionDuration: number; // minutes
}

interface AggregatedMetrics {
  timestamp: Date;
  totalProgress: number;
  totalTargetErrors: number;
  totalCurrentErrors: number;
  totalResolvedErrors: number;
  overallVelocity: number;
  estimatedCompletion: Date;
  activeAgents: number;
  completedAgents: number;
  blockedAgents: number;
  criticalPath: string[];
  bottlenecks: string[];
}

interface ProgressSnapshot {
  timestamp: Date;
  agentProgress: AgentProgress[];
  aggregatedMetrics: AggregatedMetrics;
  qualityMetrics: QualityMetrics;
  alerts: Alert[];
}

interface QualityMetrics {
  regressionCount: number;
  compilationStatus: boolean;
  newErrorTypes: string[];
  codeHealthScore: number; // 0-100
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  agentId?: string;
  actionRequired: boolean;
}

// ==================== AGENT CONFIGURATION ====================

const AGENT_DEFINITIONS = [
  {
    id: 'ts2322-component-props',
    name: 'Component-Props Agent',
    branch: 'fix/ts2322-component-props',
    errorType: 'TS2322',
    targetErrors: 60,
    patterns: ['components/card/*.tsx', 'components/button/*.tsx', 'islands/**/*.tsx']
  },
  {
    id: 'ts2322-event-handlers',
    name: 'Event-Handler Agent',
    branch: 'fix/ts2322-event-handlers',
    errorType: 'TS2322',
    targetErrors: 38,
    patterns: ['components/table/**/*.tsx', 'islands/modal/*.tsx', 'islands/section/**/*.tsx']
  },
  {
    id: 'ts2322-type-unions',
    name: 'Type-Union Agent',
    branch: 'fix/ts2322-type-unions',
    errorType: 'TS2322',
    targetErrors: 40,
    patterns: ['lib/types/*.d.ts', 'server/types/*.d.ts']
  },
  {
    id: 'ts2322-import-alignment',
    name: 'Import-Alignment Agent',
    branch: 'fix/ts2322-import-alignment',
    errorType: 'TS2322',
    targetErrors: 25,
    patterns: ['client/**/*.ts', 'lib/utils/**/*.ts']
  },
  {
    id: 'ts2345-jsx-arguments',
    name: 'JSX-PREACT Agent',
    branch: 'fix/ts2345-jsx-arguments',
    errorType: 'TS2345',
    targetErrors: 51,
    patterns: ['components/**/*.tsx', 'islands/**/*.tsx', 'routes/**/*.tsx']
  },
  {
    id: 'ts18048-null-safety',
    name: 'NULL-SAFETY Agent',
    branch: 'fix/ts18048-null-safety',
    errorType: 'TS18048',
    targetErrors: 47,
    patterns: ['components/card/*.tsx', 'components/display/*.tsx']
  }
];

// ==================== PROGRESS AGGREGATOR CLASS ====================

class ProgressAggregator {
  private readonly projectRoot: string;
  private progressHistory: ProgressSnapshot[] = [];
  private baselineErrors: Map<string, number> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  // ===== INITIALIZATION =====

  async initialize(): Promise<void> {
    console.log("📊 Initializing Progress Aggregation System...");
    
    // Establish baseline error counts
    await this.establishBaseline();
    
    console.log("✅ Progress tracking initialized\n");
  }

  private async establishBaseline(): Promise<void> {
    console.log("📏 Establishing baseline error counts...");
    
    for (const errorType of ['TS2322', 'TS2345', 'TS18048']) {
      const count = await this.getErrorCount(errorType);
      this.baselineErrors.set(errorType, count);
      console.log(`   ${errorType}: ${count} errors`);
    }
  }

  // ===== MAIN COLLECTION =====

  async collectProgress(): Promise<ProgressSnapshot> {
    const timestamp = new Date();
    console.log(`🔄 Collecting progress data at ${timestamp.toLocaleTimeString()}...`);

    // Collect individual agent progress
    const agentProgress = await Promise.all(
      AGENT_DEFINITIONS.map(def => this.collectAgentProgress(def))
    );

    // Calculate aggregated metrics
    const aggregatedMetrics = this.calculateAggregatedMetrics(agentProgress, timestamp);

    // Assess quality metrics
    const qualityMetrics = await this.assessQualityMetrics();

    // Generate alerts
    const alerts = this.generateAlerts(agentProgress, aggregatedMetrics, qualityMetrics);

    const snapshot: ProgressSnapshot = {
      timestamp,
      agentProgress,
      aggregatedMetrics,
      qualityMetrics,
      alerts
    };

    // Store in history
    this.progressHistory.push(snapshot);
    
    // Keep only last 24 hours of data
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.progressHistory = this.progressHistory.filter(s => s.timestamp > cutoff);

    return snapshot;
  }

  // ===== AGENT PROGRESS COLLECTION =====

  private async collectAgentProgress(agentDef: any): Promise<AgentProgress> {
    const currentErrors = await this.getErrorCountForAgent(agentDef);
    const resolvedErrors = Math.max(0, agentDef.targetErrors - currentErrors);
    const progress = agentDef.targetErrors > 0 ? (resolvedErrors / agentDef.targetErrors) * 100 : 0;
    
    // Calculate velocity from historical data
    const velocity = this.calculateVelocity(agentDef.id);
    
    // Estimate completion time
    const eta = this.calculateETA(currentErrors, velocity);
    
    // Determine status
    const status = this.determineAgentStatus(agentDef, currentErrors, progress);
    
    // Session duration (simplified - would track actual session time in real implementation)
    const sessionDuration = this.getSessionDuration(agentDef.id);

    return {
      id: agentDef.id,
      name: agentDef.name,
      branch: agentDef.branch,
      errorType: agentDef.errorType,
      targetErrors: agentDef.targetErrors,
      currentErrors,
      resolvedErrors,
      progress,
      velocity,
      eta,
      status,
      lastUpdate: new Date(),
      sessionDuration
    };
  }

  private async getErrorCountForAgent(agentDef: any): Promise<number> {
    try {
      // Switch to agent branch for accurate count
      await this.runCommand(['git', 'checkout', agentDef.branch]);
      
      // Get errors for this agent's error type and file patterns
      const result = await this.runCommand(['deno', 'check', '--all']);
      if (!result.success) {
        const errors = result.stderr.split('\n')
          .filter(line => line.includes(agentDef.errorType))
          .filter(line => this.matchesAgentPatterns(line, agentDef.patterns));
        
        return errors.length;
      }
      
      return 0;
    } catch (error) {
      console.warn(`⚠️ Could not get error count for ${agentDef.id}: ${error.message}`);
      return agentDef.targetErrors; // Assume no progress if can't check
    }
  }

  private matchesAgentPatterns(errorLine: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // Convert glob pattern to regex
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(errorLine);
    });
  }

  private calculateVelocity(agentId: string): number {
    // Calculate errors resolved per hour based on recent history
    const recentSnapshots = this.progressHistory.slice(-6); // Last 3 hours (every 30 min)
    if (recentSnapshots.length < 2) return 0;

    const agentSnapshots = recentSnapshots
      .map(s => s.agentProgress.find(a => a.id === agentId))
      .filter(a => a !== undefined);

    if (agentSnapshots.length < 2) return 0;

    const firstSnapshot = agentSnapshots[0]!;
    const lastSnapshot = agentSnapshots[agentSnapshots.length - 1]!;
    
    const errorsResolved = firstSnapshot.currentErrors - lastSnapshot.currentErrors;
    const timeSpan = (lastSnapshot.lastUpdate.getTime() - firstSnapshot.lastUpdate.getTime()) / (1000 * 60 * 60); // hours
    
    return timeSpan > 0 ? errorsResolved / timeSpan : 0;
  }

  private calculateETA(currentErrors: number, velocity: number): string {
    if (velocity <= 0 || currentErrors <= 0) {
      return currentErrors <= 0 ? 'Completed' : 'Unknown';
    }

    const hoursRemaining = currentErrors / velocity;
    const completionTime = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
    
    if (hoursRemaining < 1) {
      return `${Math.round(hoursRemaining * 60)} minutes`;
    } else if (hoursRemaining < 24) {
      return `${hoursRemaining.toFixed(1)} hours`;
    } else {
      return completionTime.toLocaleDateString();
    }
  }

  private determineAgentStatus(agentDef: any, currentErrors: number, progress: number): AgentProgress['status'] {
    if (progress >= 100 || currentErrors === 0) return 'completed';
    if (progress === 0) return 'not-started';
    
    // Check if agent is actually working (has made recent progress)
    const recentProgress = this.hasRecentProgress(agentDef.id);
    if (!recentProgress) return 'blocked';
    
    return 'active';
  }

  private hasRecentProgress(agentId: string): boolean {
    const recentSnapshots = this.progressHistory.slice(-3); // Last 1.5 hours
    if (recentSnapshots.length < 2) return true; // Assume active if no history

    const agentSnapshots = recentSnapshots
      .map(s => s.agentProgress.find(a => a.id === agentId))
      .filter(a => a !== undefined);

    if (agentSnapshots.length < 2) return true;

    const firstSnapshot = agentSnapshots[0]!;
    const lastSnapshot = agentSnapshots[agentSnapshots.length - 1]!;
    
    return lastSnapshot.resolvedErrors > firstSnapshot.resolvedErrors;
  }

  private getSessionDuration(agentId: string): number {
    // Simplified calculation - would track actual session time in real implementation
    const recentSnapshots = this.progressHistory.filter(s => 
      s.agentProgress.some(a => a.id === agentId && a.status === 'active')
    );
    
    return recentSnapshots.length * 30; // 30 minutes per snapshot
  }

  // ===== AGGREGATED METRICS =====

  private calculateAggregatedMetrics(agentProgress: AgentProgress[], timestamp: Date): AggregatedMetrics {
    const totalTargetErrors = agentProgress.reduce((sum, agent) => sum + agent.targetErrors, 0);
    const totalCurrentErrors = agentProgress.reduce((sum, agent) => sum + agent.currentErrors, 0);
    const totalResolvedErrors = agentProgress.reduce((sum, agent) => sum + agent.resolvedErrors, 0);
    
    const totalProgress = totalTargetErrors > 0 ? (totalResolvedErrors / totalTargetErrors) * 100 : 0;
    
    const overallVelocity = agentProgress.reduce((sum, agent) => sum + agent.velocity, 0);
    
    const estimatedCompletion = this.calculateOverallETA(totalCurrentErrors, overallVelocity);
    
    const activeAgents = agentProgress.filter(a => a.status === 'active').length;
    const completedAgents = agentProgress.filter(a => a.status === 'completed').length;
    const blockedAgents = agentProgress.filter(a => a.status === 'blocked').length;
    
    const criticalPath = this.identifyCriticalPath(agentProgress);
    const bottlenecks = this.identifyBottlenecks(agentProgress);

    return {
      timestamp,
      totalProgress,
      totalTargetErrors,
      totalCurrentErrors,
      totalResolvedErrors,
      overallVelocity,
      estimatedCompletion,
      activeAgents,
      completedAgents,
      blockedAgents,
      criticalPath,
      bottlenecks
    };
  }

  private calculateOverallETA(totalCurrentErrors: number, overallVelocity: number): Date {
    if (overallVelocity <= 0 || totalCurrentErrors <= 0) {
      return new Date(); // Default to now if can't calculate
    }

    const hoursRemaining = totalCurrentErrors / overallVelocity;
    return new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
  }

  private identifyCriticalPath(agentProgress: AgentProgress[]): string[] {
    // Find agents with lowest progress and highest remaining work
    return agentProgress
      .filter(a => a.status !== 'completed')
      .sort((a, b) => {
        // Sort by progress (ascending) then by remaining errors (descending)
        if (a.progress !== b.progress) return a.progress - b.progress;
        return b.currentErrors - a.currentErrors;
      })
      .slice(0, 3)
      .map(a => a.id);
  }

  private identifyBottlenecks(agentProgress: AgentProgress[]): string[] {
    // Find agents with low velocity or blocked status
    return agentProgress
      .filter(a => a.status === 'blocked' || (a.status === 'active' && a.velocity < 1))
      .map(a => a.id);
  }

  // ===== QUALITY METRICS =====

  private async assessQualityMetrics(): Promise<QualityMetrics> {
    const regressionCount = await this.detectRegressions();
    const compilationStatus = await this.checkCompilationStatus();
    const newErrorTypes = await this.detectNewErrorTypes();
    const codeHealthScore = this.calculateCodeHealthScore(regressionCount, compilationStatus, newErrorTypes);

    return {
      regressionCount,
      compilationStatus,
      newErrorTypes,
      codeHealthScore
    };
  }

  private async detectRegressions(): Promise<number> {
    // Simplified regression detection
    // In real implementation, would compare current error counts with baseline
    let regressions = 0;
    
    for (const [errorType, baseline] of this.baselineErrors) {
      const current = await this.getErrorCount(errorType);
      if (current > baseline) {
        regressions += current - baseline;
      }
    }
    
    return regressions;
  }

  private async checkCompilationStatus(): Promise<boolean> {
    const result = await this.runCommand(['deno', 'check', '--all']);
    return result.success;
  }

  private async detectNewErrorTypes(): Promise<string[]> {
    const result = await this.runCommand(['deno', 'check', '--all']);
    if (result.success) return [];

    const errorTypes = new Set<string>();
    const lines = result.stderr.split('\n');
    
    for (const line of lines) {
      const match = line.match(/TS(\d+)/);
      if (match) {
        const errorCode = match[1];
        if (!['2322', '2345', '18048'].includes(errorCode)) {
          errorTypes.add(`TS${errorCode}`);
        }
      }
    }
    
    return Array.from(errorTypes);
  }

  private calculateCodeHealthScore(regressions: number, compilationStatus: boolean, newErrorTypes: string[]): number {
    let score = 100;
    
    // Deduct for regressions
    score -= regressions * 2;
    
    // Deduct if compilation fails
    if (!compilationStatus) score -= 30;
    
    // Deduct for new error types
    score -= newErrorTypes.length * 5;
    
    return Math.max(0, score);
  }

  // ===== ALERT GENERATION =====

  private generateAlerts(
    agentProgress: AgentProgress[],
    aggregatedMetrics: AggregatedMetrics,
    qualityMetrics: QualityMetrics
  ): Alert[] {
    const alerts: Alert[] = [];

    // Regression alerts
    if (qualityMetrics.regressionCount > 0) {
      alerts.push({
        type: 'error',
        message: `${qualityMetrics.regressionCount} regression(s) detected`,
        actionRequired: true
      });
    }

    // Compilation alerts
    if (!qualityMetrics.compilationStatus) {
      alerts.push({
        type: 'error',
        message: 'Project compilation failed',
        actionRequired: true
      });
    }

    // Blocked agent alerts
    agentProgress.filter(a => a.status === 'blocked').forEach(agent => {
      alerts.push({
        type: 'warning',
        message: `Agent ${agent.name} is blocked`,
        agentId: agent.id,
        actionRequired: true
      });
    });

    // Velocity alerts
    agentProgress.filter(a => a.status === 'active' && a.velocity < 0.5).forEach(agent => {
      alerts.push({
        type: 'warning',
        message: `Agent ${agent.name} has low velocity (${agent.velocity.toFixed(2)} errors/hour)`,
        agentId: agent.id,
        actionRequired: false
      });
    });

    // New error type alerts
    if (qualityMetrics.newErrorTypes.length > 0) {
      alerts.push({
        type: 'warning',
        message: `New error types detected: ${qualityMetrics.newErrorTypes.join(', ')}`,
        actionRequired: false
      });
    }

    // Progress milestone alerts
    if (aggregatedMetrics.totalProgress >= 50 && aggregatedMetrics.totalProgress < 55) {
      alerts.push({
        type: 'info',
        message: '🎉 50% progress milestone reached!',
        actionRequired: false
      });
    }

    if (aggregatedMetrics.totalProgress >= 90) {
      alerts.push({
        type: 'info',
        message: '🚀 Approaching completion - prepare for integration!',
        actionRequired: false
      });
    }

    return alerts;
  }

  // ===== UTILITIES =====

  private async getErrorCount(errorType: string): Promise<number> {
    try {
      const result = await this.runCommand(['deno', 'check', '--all']);
      if (!result.success) {
        const count = (result.stderr.match(new RegExp(errorType, 'g')) || []).length;
        return count;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private async runCommand(cmd: string[]): Promise<{ success: boolean; stdout: string; stderr: string }> {
    try {
      const process = new Deno.Command(cmd[0], { 
        args: cmd.slice(1),
        cwd: this.projectRoot,
        stdout: 'piped',
        stderr: 'piped'
      });
      
      const { success, stdout, stderr } = await process.output();
      
      return {
        success,
        stdout: new TextDecoder().decode(stdout),
        stderr: new TextDecoder().decode(stderr)
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error.message
      };
    }
  }

  // ===== REPORTING =====

  async generateProgressReport(snapshot: ProgressSnapshot): Promise<void> {
    const { agentProgress, aggregatedMetrics, qualityMetrics, alerts } = snapshot;

    console.clear();
    console.log("📊 TypeScript Error Resolution - Progress Dashboard");
    console.log("═".repeat(80));
    console.log(`📅 ${snapshot.timestamp.toLocaleString()}`);
    console.log(`🎯 Overall Progress: ${aggregatedMetrics.totalProgress.toFixed(1)}%`);
    console.log(`⚡ Velocity: ${aggregatedMetrics.overallVelocity.toFixed(1)} errors/hour`);
    console.log(`🕒 ETA: ${aggregatedMetrics.estimatedCompletion.toLocaleString()}\n`);

    // Agent progress table
    console.log("📋 Agent Progress:");
    console.log("─".repeat(80));
    console.log("Agent                 | Progress | Velocity | ETA        | Status");
    console.log("─".repeat(80));

    agentProgress.forEach(agent => {
      const progress = `${agent.progress.toFixed(1)}%`.padEnd(8);
      const velocity = `${agent.velocity.toFixed(1)}/h`.padEnd(8);
      const eta = agent.eta.padEnd(10);
      const status = this.getStatusEmoji(agent.status).padEnd(12);
      
      console.log(
        `${agent.name.padEnd(21)} | ${progress} | ${velocity} | ${eta} | ${status}`
      );
    });

    // Quality metrics
    console.log("\n🏥 Quality Metrics:");
    console.log("─".repeat(30));
    console.log(`Code Health Score: ${qualityMetrics.codeHealthScore}/100`);
    console.log(`Compilation Status: ${qualityMetrics.compilationStatus ? '✅ Passing' : '❌ Failed'}`);
    console.log(`Regressions: ${qualityMetrics.regressionCount}`);
    if (qualityMetrics.newErrorTypes.length > 0) {
      console.log(`New Error Types: ${qualityMetrics.newErrorTypes.join(', ')}`);
    }

    // Alerts
    if (alerts.length > 0) {
      console.log("\n🚨 Alerts:");
      console.log("─".repeat(20));
      alerts.forEach((alert, i) => {
        const icon = alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
        const action = alert.actionRequired ? ' [ACTION REQUIRED]' : '';
        console.log(`${i + 1}. ${icon} ${alert.message}${action}`);
      });
    }

    // Summary stats
    console.log("\n📈 Summary:");
    console.log("─".repeat(20));
    console.log(`Active Agents: ${aggregatedMetrics.activeAgents}/6`);
    console.log(`Completed Agents: ${aggregatedMetrics.completedAgents}/6`);
    console.log(`Total Errors Resolved: ${aggregatedMetrics.totalResolvedErrors}/${aggregatedMetrics.totalTargetErrors}`);
    console.log(`Remaining Errors: ${aggregatedMetrics.totalCurrentErrors}`);

    if (aggregatedMetrics.criticalPath.length > 0) {
      console.log(`Critical Path: ${aggregatedMetrics.criticalPath.join(', ')}`);
    }

    if (aggregatedMetrics.bottlenecks.length > 0) {
      console.log(`Bottlenecks: ${aggregatedMetrics.bottlenecks.join(', ')}`);
    }

    console.log("\n" + "═".repeat(80));
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'not-started': return '⏸️ Not Started';
      case 'active': return '🔄 Active';
      case 'completed': return '✅ Completed';
      case 'blocked': return '🚫 Blocked';
      case 'error': return '❌ Error';
      default: return '❓ Unknown';
    }
  }

  async saveSnapshot(snapshot: ProgressSnapshot): Promise<void> {
    const reportDir = join(this.projectRoot, '.taskmaster', 'reports');
    await Deno.mkdir(reportDir, { recursive: true });
    
    const filename = `progress-snapshot-${snapshot.timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = join(reportDir, filename);
    
    await Deno.writeTextFile(filepath, JSON.stringify(snapshot, null, 2));
  }

  // ===== PUBLIC API =====

  async startContinuousTracking(): Promise<void> {
    await this.initialize();

    console.log("🚀 Starting continuous progress tracking...\n");

    const trackingInterval = setInterval(async () => {
      try {
        const snapshot = await this.collectProgress();
        await this.generateProgressReport(snapshot);
        await this.saveSnapshot(snapshot);
      } catch (error) {
        console.error(`❌ Error during progress collection: ${error.message}`);
      }
    }, 30000); // Every 30 seconds

    // Graceful shutdown
    Deno.addSignalListener("SIGINT", () => {
      clearInterval(trackingInterval);
      console.log("\n🛑 Progress tracking stopped");
      Deno.exit(0);
    });
  }

  async generateOneTimeReport(): Promise<void> {
    await this.initialize();
    const snapshot = await this.collectProgress();
    await this.generateProgressReport(snapshot);
    await this.saveSnapshot(snapshot);
  }
}

// ==================== CLI INTERFACE ====================

async function main() {
  const projectRoot = Deno.cwd();
  const aggregator = new ProgressAggregator(projectRoot);

  const command = Deno.args[0] || 'track';

  switch (command) {
    case 'track':
      await aggregator.startContinuousTracking();
      break;
    
    case 'report':
      await aggregator.generateOneTimeReport();
      break;
    
    case 'help':
      console.log(`
Progress Aggregator Commands:

  track      Start continuous progress tracking (default)
  report     Generate one-time progress report
  help       Show this help message

Usage:
  deno run --allow-all scripts/progress-aggregator.ts [command]
      `);
      break;
    
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use "help" for available commands');
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}

export { ProgressAggregator };