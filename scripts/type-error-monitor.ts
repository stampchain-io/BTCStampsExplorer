#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Real-Time TypeScript Error Monitoring System
 *
 * Coordinates parallel agent deployment for Type Domain Migration cleanup
 * Tracks error counts, categorizes by type, and prevents agent work duplication
 */

interface ErrorCount {
  errorCode: string;
  count: number;
  description: string;
  assignedAgent?: string;
  lastUpdated: Date;
}

interface AgentStatus {
  name: string;
  errorTypes: string[];
  status: 'active' | 'idle' | 'complete';
  errorsAssigned: number;
  errorsResolved: number;
  lastActivity: Date;
}

class TypeScriptErrorMonitor {
  private errorCounts: Map<string, ErrorCount> = new Map();
  private agentStatus: Map<string, AgentStatus> = new Map();
  private baselineErrors: number = 0;

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    const agents: AgentStatus[] = [
      {
        name: 'TS2339-Agent',
        errorTypes: ['TS2339'],
        status: 'active',
        errorsAssigned: 239,
        errorsResolved: 0,
        lastActivity: new Date()
      },
      {
        name: 'TS2322-Agent',
        errorTypes: ['TS2322'],
        status: 'active',
        errorsAssigned: 157,
        errorsResolved: 0,
        lastActivity: new Date()
      },
      {
        name: 'TS6133-6196-Agent',
        errorTypes: ['TS6133', 'TS6196'],
        status: 'active',
        errorsAssigned: 219,
        errorsResolved: 0,
        lastActivity: new Date()
      },
      {
        name: 'TS2304-2305-Agent',
        errorTypes: ['TS2304', 'TS2305'],
        status: 'active',
        errorsAssigned: 160,
        errorsResolved: 0,
        lastActivity: new Date()
      },
      {
        name: 'TS2554-Agent',
        errorTypes: ['TS2554'],
        status: 'active',
        errorsAssigned: 64,
        errorsResolved: 0,
        lastActivity: new Date()
      }
    ];

    agents.forEach(agent => {
      this.agentStatus.set(agent.name, agent);
    });
  }

  async getCurrentErrorCounts(): Promise<void> {
    try {
      console.log('🔍 Scanning TypeScript errors...');

      const process = new Deno.Command('deno', {
        args: ['check', '--unstable-byonm', 'main.ts'],
        stdout: 'piped',
        stderr: 'piped'
      });

      const { code, stdout, stderr } = await process.output();
      const rawOutput = new TextDecoder().decode(stderr) + new TextDecoder().decode(stdout);
      // Strip ANSI escape codes
      const errorOutput = rawOutput.replace(/\x1b\[[0-9;]*m/g, '');

      if (code === 0) {
        console.log('✅ No TypeScript errors found!');
        return;
      }

      // Parse error output
      const lines = errorOutput.split('\n').filter(line => line.trim());
      const errorCounts = new Map<string, number>();

      lines.forEach(line => {
        const match = line.match(/^TS(\d+) \[ERROR\]:/);
        if (match) {
          const errorCode = `TS${match[1]}`;
          errorCounts.set(errorCode, (errorCounts.get(errorCode) || 0) + 1);
        }
      });

      // Update our tracking
      this.errorCounts.clear();
      errorCounts.forEach((count, errorCode) => {
        const agent = this.findAssignedAgent(errorCode);
        this.errorCounts.set(errorCode, {
          errorCode,
          count,
          description: this.getErrorDescription(errorCode),
          assignedAgent: agent?.name,
          lastUpdated: new Date()
        });
      });

      this.baselineErrors = Array.from(errorCounts.values()).reduce((sum, count) => sum + count, 0);
    } catch (error) {
      console.error('❌ Error scanning TypeScript errors:', error);
    }
  }

  private findAssignedAgent(errorCode: string): AgentStatus | undefined {
    for (const [name, agent] of this.agentStatus) {
      if (agent.errorTypes.includes(errorCode)) {
        return agent;
      }
    }
    return undefined;
  }

  private getErrorDescription(errorCode: string): string {
    const descriptions: Record<string, string> = {
      'TS2339': 'Property does not exist on type',
      'TS2322': 'Type assignment mismatch',
      'TS6133': 'Unused variable/import',
      'TS6196': 'Unused destructured property',
      'TS2304': 'Cannot find name',
      'TS2305': 'Module has no exported member',
      'TS2554': 'Expected X arguments, but got Y'
    };
    return descriptions[errorCode] || 'Unknown error type';
  }

  generateCoordinationReport(): void {
    console.log('\n📊 AGENT COORDINATION REPORT');
    console.log('='.repeat(50));
    console.log(`Total Errors: ${this.baselineErrors}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    console.log('\n🎯 ERROR DISTRIBUTION BY AGENT:');
    for (const [errorCode, errorInfo] of this.errorCounts) {
      const agent = errorInfo.assignedAgent || 'UNASSIGNED';
      const priority = errorInfo.count > 100 ? '🔥 HIGH' : errorInfo.count > 50 ? '⚠️  MED' : '🟢 LOW';
      console.log(`  ${errorCode}: ${errorInfo.count} errors → ${agent} ${priority}`);
      console.log(`    ${errorInfo.description}`);
    }

    console.log('\n👥 AGENT STATUS:');
    for (const [name, agent] of this.agentStatus) {
      const progressPercent = Math.round((agent.errorsResolved / agent.errorsAssigned) * 100);
      const statusIcon = agent.status === 'active' ? '🟢' : agent.status === 'complete' ? '✅' : '⏸️';
      console.log(`  ${statusIcon} ${name}: ${agent.errorsResolved}/${agent.errorsAssigned} (${progressPercent}%)`);
    }

    console.log('\n🚨 COORDINATION ALERTS:');
    this.checkForConflicts();
  }

  private checkForConflicts(): void {
    let hasConflicts = false;

    // Check for unassigned errors
    for (const [errorCode, errorInfo] of this.errorCounts) {
      if (!errorInfo.assignedAgent) {
        console.log(`  ⚠️  ${errorCode} (${errorInfo.count} errors) - NO ASSIGNED AGENT`);
        hasConflicts = true;
      }
    }

    // Check for count mismatches
    for (const [name, agent] of this.agentStatus) {
      const actualCount = agent.errorTypes.reduce((sum, errorCode) => {
        return sum + (this.errorCounts.get(errorCode)?.count || 0);
      }, 0);

      if (actualCount !== agent.errorsAssigned) {
        console.log(`  ⚠️  ${name}: Expected ${agent.errorsAssigned}, Found ${actualCount} errors`);
        hasConflicts = true;
      }
    }

    if (!hasConflicts) {
      console.log('  ✅ No coordination conflicts detected');
    }
  }

  async watchMode(): Promise<void> {
    console.log('👀 Starting real-time error monitoring...');
    console.log('Press Ctrl+C to exit\n');

    while (true) {
      await this.getCurrentErrorCounts();
      this.generateCoordinationReport();

      console.log('\n⏱️  Checking again in 30 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  async saveReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.baselineErrors,
      errorBreakdown: Object.fromEntries(this.errorCounts),
      agentStatus: Object.fromEntries(this.agentStatus)
    };

    const reportPath = 'reports/error-monitoring-report.json';
    await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📝 Report saved to ${reportPath}`);
  }
}

// CLI interface
if (import.meta.main) {
  const monitor = new TypeScriptErrorMonitor();

  const args = Deno.args;

  if (args.includes('--watch')) {
    await monitor.watchMode();
  } else {
    await monitor.getCurrentErrorCounts();
    monitor.generateCoordinationReport();

    if (args.includes('--save')) {
      await monitor.saveReport();
    }
  }
}

export { TypeScriptErrorMonitor };
