#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Scope-Aware Agent Monitor
 * Tracks agent completion based on their assigned scopes, not total project errors
 */

interface AgentScope {
  name: string;
  targetErrors: string[];
  assignedCount: number;
  completedCount: number;
  status: 'complete' | 'active' | 'functionally-complete';
  scopeDescription: string;
}

class ScopeAwareMonitor {
  private errorCounts = new Map<string, number>();
  private totalErrors = 0;

  // Agent scope definitions based on actual assignments
  private agentScopes: AgentScope[] = [
    {
      name: 'TS2554-Agent',
      targetErrors: ['TS2554'],
      assignedCount: 64,
      completedCount: 64,
      status: 'complete',
      scopeDescription: 'Function call parameter errors'
    },
    {
      name: 'ASSIGNMENT-Agent',
      targetErrors: ['TS2322'],
      assignedCount: 14, // lib/server scope only
      completedCount: 8, // 6 handed off to PROPERTY-Agent
      status: 'complete',
      scopeDescription: 'lib/server type assignment errors'
    },
    {
      name: 'CLEANUP-Agent',
      targetErrors: ['TS6133', 'TS6196'],
      assignedCount: 43,
      completedCount: 40, // 3 monitoring infrastructure preserved
      status: 'functionally-complete',
      scopeDescription: 'Unused code cleanup (excluding infrastructure)'
    },
    {
      name: 'PROPERTY-Agent',
      targetErrors: ['TS2339'],
      assignedCount: 128, // components/islands scope only
      completedCount: 128,
      status: 'complete',
      scopeDescription: 'components/islands property errors'
    },
    {
      name: 'FOUNDATION-Agent',
      targetErrors: ['TS2304', 'TS2305'],
      assignedCount: 108, // Current active assignment
      completedCount: 0, // Still working
      status: 'active',
      scopeDescription: 'lib/types/*.d.ts import/export errors'
    }
  ];

  async scanErrors(): Promise<void> {
    try {
      const command = new Deno.Command('deno', {
        args: ['check', '--unstable-byonm', 'main.ts'],
        stdout: 'piped',
        stderr: 'piped'
      });

      const result = await command.output();
      const output = new TextDecoder().decode(result.stdout) +
                    new TextDecoder().decode(result.stderr);

      // Strip ANSI escape codes
      const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');

      this.errorCounts.clear();
      this.totalErrors = 0;

      const lines = cleanOutput.split('\n');
      for (const line of lines) {
        const match = line.match(/^TS(\d+) \[ERROR\]:/);
        if (match) {
          const errorCode = `TS${match[1]}`;
          this.errorCounts.set(errorCode, (this.errorCounts.get(errorCode) || 0) + 1);
          this.totalErrors++;
        }
      }
    } catch (error) {
      console.error('❌ Error scanning:', error);
    }
  }

  displayStatus(): void {
    const timestamp = new Date().toLocaleTimeString();

    console.clear();
    console.log('🎯 SCOPE-AWARE AGENT MONITOR');
    console.log('='.repeat(60));
    console.log(`📊 Total Errors: ${this.totalErrors} | ${timestamp}`);
    console.log();

    // Agent status based on scopes
    console.log('🤖 AGENT SCOPE STATUS:');
    console.log('-'.repeat(60));

    this.agentScopes.forEach(agent => {
      const currentErrors = agent.targetErrors.reduce((sum, errorType) =>
        sum + (this.errorCounts.get(errorType) || 0), 0);

      let icon = '⏸️';
      let statusText = 'PENDING';
      let progressBar = '░'.repeat(15);

      if (agent.status === 'complete') {
        icon = '✅';
        statusText = 'COMPLETE';
        progressBar = '█'.repeat(15);
      } else if (agent.status === 'functionally-complete') {
        icon = '✅';
        statusText = 'FUNC-COMPLETE';
        progressBar = '█'.repeat(14) + '░';
      } else if (agent.status === 'active') {
        icon = '🔥';
        statusText = 'ACTIVE';
        const progress = Math.max(0, agent.assignedCount - currentErrors);
        const percentage = Math.round((progress / agent.assignedCount) * 15);
        progressBar = '█'.repeat(percentage) + '░'.repeat(15 - percentage);
      }

      console.log(`${icon} ${agent.name.padEnd(18)} │ ${progressBar} │ ${statusText}`);
      console.log(`   └─ Scope: ${agent.scopeDescription}`);

      if (agent.status === 'complete' || agent.status === 'functionally-complete') {
        console.log(`   └─ Result: ${agent.completedCount}/${agent.assignedCount} scope errors fixed`);
      } else if (agent.status === 'active') {
        const remaining = currentErrors;
        const fixed = Math.max(0, agent.assignedCount - remaining);
        console.log(`   └─ Progress: ${fixed}/${agent.assignedCount} (${remaining} remaining)`);
      }
      console.log();
    });

    // Overall summary
    const completedAgents = this.agentScopes.filter(a =>
      a.status === 'complete' || a.status === 'functionally-complete').length;
    const totalAgents = this.agentScopes.length;
    const completionRate = Math.round((completedAgents / totalAgents) * 100);

    console.log('📈 SUMMARY:');
    console.log(`   Agent Completion: ${completedAgents}/${totalAgents} (${completionRate}%)`);
    console.log(`   Total Project Errors: ${this.totalErrors}`);

    const activeAgents = this.agentScopes.filter(a => a.status === 'active');
    if (activeAgents.length > 0) {
      console.log(`   Active: ${activeAgents.map(a => a.name).join(', ')}`);
    }

    // Critical path status
    const foundationAgent = this.agentScopes.find(a => a.name === 'FOUNDATION-Agent');
    if (foundationAgent && foundationAgent.status === 'active') {
      console.log();
      console.log('🔥 CRITICAL PATH: FOUNDATION-Agent completion unlocks Phase 3!');
    }
  }

  async watch(intervalSeconds = 10): Promise<void> {
    console.log(`👀 Starting scope-aware monitor (${intervalSeconds}s refresh)...`);
    console.log('Press Ctrl+C to exit\n');

    // Initial scan
    await this.scanErrors();
    this.displayStatus();

    // Set up interval
    const interval = setInterval(async () => {
      await this.scanErrors();
      this.displayStatus();
    }, intervalSeconds * 1000);

    // Handle exit
    const cleanup = () => {
      clearInterval(interval);
      console.log('\n👋 Monitor stopped.');
      Deno.exit(0);
    };

    // Keep alive
    try {
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      cleanup();
    }
  }
}

// CLI
if (import.meta.main) {
  const monitor = new ScopeAwareMonitor();
  const args = Deno.args;

  if (args.includes('--watch') || args.includes('-w')) {
    const intervalArg = args.find(arg => arg.startsWith('--interval='));
    const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) :
                    args.includes('--fast') ? 5 : 10;

    await monitor.watch(interval);
  } else {
    await monitor.scanErrors();
    monitor.displayStatus();
  }
}

export { ScopeAwareMonitor };
