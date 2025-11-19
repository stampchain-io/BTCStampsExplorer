#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Master Agent Coordination System for TypeScript Error Resolution
 * 
 * Coordinates 6 parallel agents working on TypeScript error resolution:
 * - 4x TS2322 agents (Component-Props, Event-Handler, Type-Union, Import-Alignment)
 * - 1x TS2345 agent (JSX-PREACT)
 * - 1x TS18048 agent (NULL-SAFETY)
 * 
 * Real-time monitoring, conflict detection, and progress aggregation
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

// ==================== INTERFACES ====================

interface AgentStatus {
  id: string;
  name: string;
  branch: string;
  errorType: string;
  targetErrors: number;
  currentErrors: number;
  progress: number;
  status: 'active' | 'completed' | 'blocked' | 'error';
  lastUpdate: Date;
  conflicts: string[];
  assignedFiles: string[];
}

interface CoordinationReport {
  timestamp: Date;
  totalTargetErrors: number;
  totalCurrentErrors: number;
  totalProgress: number;
  agents: AgentStatus[];
  conflicts: ConflictReport[];
  recommendations: string[];
}

interface ConflictReport {
  type: 'branch' | 'file' | 'dependency';
  agents: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution: string;
}

// ==================== CONFIGURATION ====================

const AGENT_CONFIG: Omit<AgentStatus, 'currentErrors' | 'progress' | 'lastUpdate' | 'conflicts'>[] = [
  {
    id: 'ts2322-component-props',
    name: 'Component-Props Agent',
    branch: 'fix/ts2322-component-props',
    errorType: 'TS2322',
    targetErrors: 60,
    status: 'active',
    assignedFiles: [
      'components/card/*.tsx',
      'components/button/*.tsx',
      'islands/**/*.tsx'
    ]
  },
  {
    id: 'ts2322-event-handlers',
    name: 'Event-Handler Agent',
    branch: 'fix/ts2322-event-handlers',
    errorType: 'TS2322',
    targetErrors: 38,
    status: 'active',
    assignedFiles: [
      'components/table/**/*.tsx',
      'islands/modal/*.tsx',
      'islands/section/**/*.tsx'
    ]
  },
  {
    id: 'ts2322-type-unions',
    name: 'Type-Union Agent',
    branch: 'fix/ts2322-type-unions',
    errorType: 'TS2322',
    targetErrors: 40,
    status: 'active',
    assignedFiles: [
      'lib/types/*.d.ts',
      'server/types/*.d.ts'
    ]
  },
  {
    id: 'ts2322-import-alignment',
    name: 'Import-Alignment Agent',
    branch: 'fix/ts2322-import-alignment',
    errorType: 'TS2322',
    targetErrors: 25,
    status: 'active',
    assignedFiles: [
      'client/**/*.ts',
      'lib/utils/**/*.ts'
    ]
  },
  {
    id: 'ts2345-jsx-arguments',
    name: 'JSX-PREACT Agent',
    branch: 'fix/ts2345-jsx-arguments',
    errorType: 'TS2345',
    targetErrors: 51,
    status: 'active',
    assignedFiles: [
      'components/**/*.tsx',
      'islands/**/*.tsx',
      'routes/**/*.tsx'
    ]
  },
  {
    id: 'ts18048-null-safety',
    name: 'NULL-SAFETY Agent',
    branch: 'fix/ts18048-null-safety',
    errorType: 'TS18048',
    targetErrors: 47,
    status: 'active',
    assignedFiles: [
      'components/card/*.tsx',
      'components/display/*.tsx'
    ]
  }
];

// ==================== CORE COORDINATION CLASS ====================

class MasterAgentCoordinator {
  private agents: AgentStatus[] = [];
  private reportHistory: CoordinationReport[] = [];
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.initializeAgents();
  }

  // ===== INITIALIZATION =====

  private initializeAgents(): void {
    this.agents = AGENT_CONFIG.map(config => ({
      ...config,
      currentErrors: 0,
      progress: 0,
      lastUpdate: new Date(),
      conflicts: []
    }));
  }

  // ===== REAL-TIME MONITORING =====

  async startMonitoring(): Promise<void> {
    console.log("🚀 Starting Master Agent Coordination System");
    console.log("📊 Monitoring 6 parallel TypeScript error resolution agents\n");

    // Initial status check
    await this.updateAllAgentStatus();
    await this.generateReport();

    // Start monitoring loop
    const monitoringInterval = setInterval(async () => {
      await this.updateAllAgentStatus();
      await this.detectConflicts();
      await this.generateReport();
      await this.updateTaskmaster();
    }, 30000); // Check every 30 seconds

    // Graceful shutdown
    Deno.addSignalListener("SIGINT", () => {
      clearInterval(monitoringInterval);
      console.log("\n🛑 Monitoring stopped");
      Deno.exit(0);
    });
  }

  // ===== STATUS UPDATES =====

  private async updateAllAgentStatus(): Promise<void> {
    const promises = this.agents.map(agent => this.updateAgentStatus(agent));
    await Promise.all(promises);
  }

  private async updateAgentStatus(agent: AgentStatus): Promise<void> {
    try {
      // Check if branch exists
      const branchExists = await this.checkBranchExists(agent.branch);
      if (!branchExists) {
        agent.status = 'error';
        agent.conflicts.push(`Branch ${agent.branch} does not exist`);
        return;
      }

      // Get current error count for this agent's domain
      const currentErrors = await this.getErrorCountForAgent(agent);
      agent.currentErrors = currentErrors;
      
      // Calculate progress
      agent.progress = Math.max(0, Math.min(100, 
        ((agent.targetErrors - currentErrors) / agent.targetErrors) * 100
      ));
      
      // Update status based on progress
      if (agent.progress >= 100) {
        agent.status = 'completed';
      } else if (agent.progress > 0) {
        agent.status = 'active';
      }
      
      agent.lastUpdate = new Date();

    } catch (error) {
      agent.status = 'error';
      agent.conflicts.push(`Error updating status: ${error.message}`);
    }
  }

  private async checkBranchExists(branchName: string): Promise<boolean> {
    try {
      const result = await this.runCommand(['git', 'show-ref', '--verify', '--quiet', `refs/heads/${branchName}`]);
      return result.success;
    } catch {
      return false;
    }
  }

  private async getErrorCountForAgent(agent: AgentStatus): Promise<number> {
    try {
      // Run deno check and filter by error type and agent's assigned files
      const result = await this.runCommand(['deno', 'check', '--all']);
      if (!result.success) {
        const errors = result.stderr.split('\n')
          .filter(line => line.includes(agent.errorType))
          .filter(line => this.isFileAssignedToAgent(line, agent));
        return errors.length;
      }
      return 0;
    } catch {
      return agent.targetErrors; // Assume no progress if can't check
    }
  }

  private isFileAssignedToAgent(errorLine: string, agent: AgentStatus): boolean {
    return agent.assignedFiles.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(errorLine);
    });
  }

  // ===== CONFLICT DETECTION =====

  private async detectConflicts(): Promise<ConflictReport[]> {
    const conflicts: ConflictReport[] = [];

    // Check for file overlap conflicts
    const fileConflicts = this.detectFileOverlaps();
    conflicts.push(...fileConflicts);

    // Check for branch conflicts
    const branchConflicts = await this.detectBranchConflicts();
    conflicts.push(...branchConflicts);

    // Update agent conflicts
    this.agents.forEach(agent => {
      agent.conflicts = conflicts
        .filter(conflict => conflict.agents.includes(agent.id))
        .map(conflict => conflict.description);
    });

    return conflicts;
  }

  private detectFileOverlaps(): ConflictReport[] {
    const conflicts: ConflictReport[] = [];
    const fileMap = new Map<string, string[]>();

    // Build file assignment map
    this.agents.forEach(agent => {
      agent.assignedFiles.forEach(pattern => {
        if (!fileMap.has(pattern)) {
          fileMap.set(pattern, []);
        }
        fileMap.get(pattern)!.push(agent.id);
      });
    });

    // Find overlaps
    fileMap.forEach((agents, pattern) => {
      if (agents.length > 1) {
        conflicts.push({
          type: 'file',
          agents,
          description: `File pattern overlap: ${pattern}`,
          severity: 'medium',
          resolution: 'Coordinate file-level changes between agents'
        });
      }
    });

    return conflicts;
  }

  private async detectBranchConflicts(): Promise<ConflictReport[]> {
    const conflicts: ConflictReport[] = [];

    for (const agent of this.agents) {
      try {
        const result = await this.runCommand(['git', 'merge-tree', 'main', agent.branch]);
        if (!result.success && result.stdout.trim()) {
          conflicts.push({
            type: 'branch',
            agents: [agent.id],
            description: `Merge conflicts detected in ${agent.branch}`,
            severity: 'high',
            resolution: 'Resolve merge conflicts before proceeding'
          });
        }
      } catch {
        // Ignore git errors for non-existent branches
      }
    }

    return conflicts;
  }

  // ===== REPORTING =====

  private async generateReport(): Promise<void> {
    const conflicts = await this.detectConflicts();
    
    const report: CoordinationReport = {
      timestamp: new Date(),
      totalTargetErrors: this.agents.reduce((sum, agent) => sum + agent.targetErrors, 0),
      totalCurrentErrors: this.agents.reduce((sum, agent) => sum + agent.currentErrors, 0),
      totalProgress: this.calculateTotalProgress(),
      agents: [...this.agents],
      conflicts,
      recommendations: this.generateRecommendations(conflicts)
    };

    this.reportHistory.push(report);
    await this.displayReport(report);
    await this.saveReport(report);
  }

  private calculateTotalProgress(): number {
    const totalTarget = this.agents.reduce((sum, agent) => sum + agent.targetErrors, 0);
    const totalCurrent = this.agents.reduce((sum, agent) => sum + agent.currentErrors, 0);
    return totalTarget > 0 ? ((totalTarget - totalCurrent) / totalTarget) * 100 : 0;
  }

  private generateRecommendations(conflicts: ConflictReport[]): string[] {
    const recommendations: string[] = [];

    // High priority conflicts
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high');
    if (highSeverityConflicts.length > 0) {
      recommendations.push("🚨 URGENT: Resolve merge conflicts before continuing");
    }

    // Progress-based recommendations
    const stalledAgents = this.agents.filter(agent => 
      agent.progress < 10 && 
      Date.now() - agent.lastUpdate.getTime() > 300000 // 5 minutes
    );
    
    if (stalledAgents.length > 0) {
      recommendations.push(`⚠️ Stalled agents detected: ${stalledAgents.map(a => a.name).join(', ')}`);
    }

    // Completion recommendations
    const completedAgents = this.agents.filter(agent => agent.status === 'completed');
    if (completedAgents.length > 0) {
      recommendations.push(`✅ Ready for merge: ${completedAgents.map(a => a.name).join(', ')}`);
    }

    return recommendations;
  }

  private async displayReport(report: CoordinationReport): Promise<void> {
    console.clear();
    console.log("🎯 TypeScript Error Resolution - Master Coordination Dashboard");
    console.log("═".repeat(80));
    console.log(`📅 ${report.timestamp.toLocaleString()}`);
    console.log(`🎯 Total Progress: ${report.totalProgress.toFixed(1)}% (${report.totalCurrentErrors}/${report.totalTargetErrors} errors remaining)\n`);

    // Agent status table
    console.log("📊 Agent Status:");
    console.log("─".repeat(80));
    console.log("Agent                    | Branch                  | Progress | Status    | Conflicts");
    console.log("─".repeat(80));

    report.agents.forEach(agent => {
      const progress = `${agent.progress.toFixed(1)}%`.padEnd(8);
      const status = this.getStatusEmoji(agent.status).padEnd(10);
      const conflicts = agent.conflicts.length > 0 ? `⚠️ ${agent.conflicts.length}` : '✅ 0';
      
      console.log(
        `${agent.name.padEnd(24)} | ${agent.branch.padEnd(23)} | ${progress} | ${status} | ${conflicts}`
      );
    });

    // Conflicts section
    if (report.conflicts.length > 0) {
      console.log("\n⚠️ Active Conflicts:");
      console.log("─".repeat(50));
      report.conflicts.forEach((conflict, index) => {
        const severity = this.getSeverityEmoji(conflict.severity);
        console.log(`${index + 1}. ${severity} ${conflict.description}`);
        console.log(`   💡 ${conflict.resolution}`);
      });
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      console.log("─".repeat(30));
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log("\n" + "═".repeat(80));
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'active': return '🔄 Active';
      case 'completed': return '✅ Done';
      case 'blocked': return '🚫 Blocked';
      case 'error': return '❌ Error';
      default: return '❓ Unknown';
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  }

  // ===== TASKMASTER INTEGRATION =====

  private async updateTaskmaster(): Promise<void> {
    try {
      // Update the coordination subtask with current progress
      const progressSummary = `
Agent Coordination Update (${new Date().toLocaleTimeString()}):

Progress Summary:
- Total: ${this.calculateTotalProgress().toFixed(1)}% complete
- TS2322 Agents: ${this.agents.filter(a => a.errorType === 'TS2322').map(a => `${a.name} ${a.progress.toFixed(1)}%`).join(', ')}
- TS2345 Agent: ${this.agents.find(a => a.errorType === 'TS2345')?.progress.toFixed(1)}%
- TS18048 Agent: ${this.agents.find(a => a.errorType === 'TS18048')?.progress.toFixed(1)}%

Active Conflicts: ${this.agents.reduce((sum, agent) => sum + agent.conflicts.length, 0)}
Completed Agents: ${this.agents.filter(a => a.status === 'completed').length}/6
      `.trim();

      await this.runCommand([
        'task-master', 'update-subtask', 
        '--id=43.18', 
        `--prompt=${progressSummary}`
      ]);
    } catch (error) {
      console.error('Failed to update Taskmaster:', error.message);
    }
  }

  // ===== FILE OPERATIONS =====

  private async saveReport(report: CoordinationReport): Promise<void> {
    const reportDir = join(this.projectRoot, '.taskmaster', 'reports');
    await Deno.mkdir(reportDir, { recursive: true });
    
    const filename = `agent-coordination-${report.timestamp.toISOString().split('T')[0]}.json`;
    const filepath = join(reportDir, filename);
    
    await Deno.writeTextFile(filepath, JSON.stringify(report, null, 2));
  }

  // ===== UTILITIES =====

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

  // ===== PUBLIC API =====

  async getStatus(): Promise<CoordinationReport> {
    await this.updateAllAgentStatus();
    const conflicts = await this.detectConflicts();
    
    return {
      timestamp: new Date(),
      totalTargetErrors: this.agents.reduce((sum, agent) => sum + agent.targetErrors, 0),
      totalCurrentErrors: this.agents.reduce((sum, agent) => sum + agent.currentErrors, 0),
      totalProgress: this.calculateTotalProgress(),
      agents: [...this.agents],
      conflicts,
      recommendations: this.generateRecommendations(conflicts)
    };
  }

  async generateOneTimeReport(): Promise<void> {
    await this.updateAllAgentStatus();
    await this.generateReport();
  }
}

// ==================== CLI INTERFACE ====================

async function main() {
  const projectRoot = Deno.cwd();
  const coordinator = new MasterAgentCoordinator(projectRoot);

  const command = Deno.args[0] || 'monitor';

  switch (command) {
    case 'monitor':
      await coordinator.startMonitoring();
      break;
    
    case 'status':
      await coordinator.generateOneTimeReport();
      break;
    
    case 'help':
      console.log(`
Master Agent Coordinator Commands:

  monitor    Start real-time monitoring (default)
  status     Generate one-time status report
  help       Show this help message

Usage:
  deno run --allow-all scripts/master-agent-coordinator.ts [command]
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

export { MasterAgentCoordinator };