#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Quick and Simple Agent Monitor
 * Reliable real-time updates without complex features
 */

interface AgentProgress {
  name: string;
  target: number;
  current: number;
  progress: number;
  status: string;
}

class QuickMonitor {
  private errorCounts = new Map<string, number>();
  private totalErrors = 0;
  private updateCount = 0;

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

      this.updateCount++;
    } catch (error) {
      console.error('❌ Error scanning:', error);
    }
  }

  displayStatus(): void {
    const timestamp = new Date().toLocaleTimeString();

    console.clear();
    console.log('🎯 QUICK AGENT MONITOR');
    console.log('='.repeat(50));
    console.log(`📊 Total Errors: ${this.totalErrors} | Update: ${this.updateCount} | ${timestamp}`);
    console.log();

    // Agent progress
    const agents: AgentProgress[] = [
      {
        name: 'PROPERTY-Agent',
        target: 128,
        current: this.errorCounts.get('TS2339') || 0,
        progress: 0,
        status: 'components/islands'
      },
      {
        name: 'ASSIGNMENT-Agent',
        target: 152,
        current: this.errorCounts.get('TS2322') || 0,
        progress: 0,
        status: 'lib/server'
      },
      {
        name: 'FOUNDATION-Agent',
        target: 129,
        current: (this.errorCounts.get('TS2304') || 0) + (this.errorCounts.get('TS2305') || 0),
        progress: 0,
        status: 'lib/types'
      },
      {
        name: 'CLEANUP-Agent',
        target: 3,
        current: this.errorCounts.get('TS6133') || 0,
        progress: 0,
        status: 'cleanup'
      }
    ];

    // Calculate progress
    agents.forEach(agent => {
      const fixed = Math.max(0, agent.target - agent.current);
      agent.progress = agent.target > 0 ? Math.round((fixed / agent.target) * 100) : 100;
    });

    console.log('🤖 ACTIVE AGENTS:');
    console.log('-'.repeat(50));

    agents.forEach(agent => {
      const icon = agent.progress === 100 ? '✅' :
                  agent.progress > 50 ? '🔥' :
                  agent.progress > 0 ? '🔄' : '⏸️';
      const bar = '█'.repeat(Math.floor(agent.progress / 10)) +
                  '░'.repeat(10 - Math.floor(agent.progress / 10));

      console.log(`${icon} ${agent.name.padEnd(16)} │ ${bar} │ ${agent.progress}% (${agent.current}/${agent.target})`);
      console.log(`   └─ Focus: ${agent.status}`);
    });

    // Summary stats
    const totalProgress = agents.reduce((sum, a) => sum + a.progress, 0) / agents.length;
    const activeAgents = agents.filter(a => a.progress < 100 && a.progress > 0).length;
    const completedAgents = agents.filter(a => a.progress === 100).length;

    console.log();
    console.log('📈 SUMMARY:');
    console.log(`   Overall Progress: ${Math.round(totalProgress)}%`);
    console.log(`   Active Agents: ${activeAgents}`);
    console.log(`   Completed: ${completedAgents}`);
    console.log(`   Total Errors: ${this.totalErrors}`);

    // Top remaining errors
    const sortedErrors = Array.from(this.errorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (sortedErrors.length > 0) {
      console.log();
      console.log('⚠️  TOP ERRORS:');
      sortedErrors.forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
  }

  async watch(intervalSeconds = 10): Promise<void> {
    console.log(`👀 Starting monitor (${intervalSeconds}s refresh)...`);
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

    // Listen for Ctrl+C
    globalThis.addEventListener('unload', cleanup);

    // Keep alive (simpler approach)
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
  const monitor = new QuickMonitor();
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

export { QuickMonitor };
