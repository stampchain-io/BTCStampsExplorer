#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Enhanced TypeScript Error Monitor with Real-Time Updates
 * Improved refresh capabilities, cleaner display, and better coordination tracking
 */

interface AgentInfo {
  name: string;
  errorTypes: string[];
  errorsAssigned: number;
  priority: 'HIGH' | 'MED' | 'LOW';
  description: string;
  lastProgress?: number;
  progressHistory?: number[];
}

interface MonitoringConfig {
  refreshInterval: number; // seconds
  showProgressHistory: boolean;
  clearScreen: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
}

class EnhancedTypeScriptMonitor {
  private errorCounts = new Map<string, number>();
  private agentStatus = new Map<string, { assigned: number; actual: number; progress: number }>();
  private baselineErrors = 0;
  private lastUpdateTime = new Date();
  private updateCount = 0;
  private progressHistory: Array<{ timestamp: Date; totalErrors: number }> = [];
  private config: MonitoringConfig;

  private readonly agents: Map<string, AgentInfo> = new Map([
    ['TS2339-Agent', {
      name: 'PROPERTY-Agent',
      errorTypes: ['TS2339'],
      errorsAssigned: 128,
      priority: 'HIGH',
      description: 'Property does not exist on type',
      progressHistory: []
    }],
    ['TS2322-Agent', {
      name: 'ASSIGNMENT-Agent',
      errorTypes: ['TS2322'],
      errorsAssigned: 152,
      priority: 'HIGH',
      description: 'Type assignment mismatch'
    }],
    ['TS6133-6196-Agent', {
      name: 'CLEANUP-Agent',
      errorTypes: ['TS6133', 'TS6196'],
      errorsAssigned: 3,
      priority: 'LOW',
      description: 'Unused variable/import'
    }],
    ['TS2304-2305-Agent', {
      name: 'FOUNDATION-Agent',
      errorTypes: ['TS2304', 'TS2305'],
      errorsAssigned: 129,
      priority: 'HIGH',
      description: 'Cannot find name/Missing export'
    }],
    ['TS2554-Agent', {
      name: 'COMPLETE-Agent',
      errorTypes: ['TS2554'],
      errorsAssigned: 0,
      priority: 'LOW',
      description: 'MISSION ACCOMPLISHED'
    }]
  ]);

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      refreshInterval: 10, // faster default refresh
      showProgressHistory: true,
      clearScreen: true,
      showTimestamps: true,
      compactMode: false,
      ...config
    };
  }

  private clearScreen(): void {
    if (this.config.clearScreen) {
      console.clear();
    }
  }

  private getProgressBar(current: number, total: number, width = 20): string {
    if (total === 0) return '█'.repeat(width) + ' 100%';

    const progress = Math.min(current / total, 1);
    const filled = Math.floor(progress * width);
    const empty = width - filled;

    const percentage = Math.round(progress * 100);
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    return `${bar} ${percentage}%`;
  }

  private getProgressIcon(current: number, total: number): string {
    if (current === total) return '✅';
    if (current > total * 0.75) return '🔥';
    if (current > total * 0.25) return '🔄';
    return '⏸️';
  }

  private formatTimestamp(): string {
    return this.config.showTimestamps
      ? new Date().toLocaleTimeString()
      : '';
  }

  async getCurrentErrorCounts(): Promise<void> {
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
      this.baselineErrors = 0;

      const lines = cleanOutput.split('\n');
      for (const line of lines) {
        const match = line.match(/^TS(\d+) \[ERROR\]:/);
        if (match) {
          const errorCode = `TS${match[1]}`;
          this.errorCounts.set(errorCode, (this.errorCounts.get(errorCode) || 0) + 1);
          this.baselineErrors++;
        }
      }

      this.lastUpdateTime = new Date();
      this.updateCount++;

      // Track progress history
      this.progressHistory.push({
        timestamp: new Date(),
        totalErrors: this.baselineErrors
      });

      // Keep only last 20 data points
      if (this.progressHistory.length > 20) {
        this.progressHistory.shift();
      }

    } catch (error) {
      console.error('❌ Error scanning TypeScript errors:', error);
    }
  }

  private calculateProgress(): { totalEliminated: number; rate: string; trend: string } {
    if (this.progressHistory.length < 2) {
      return { totalEliminated: 0, rate: 'N/A', trend: '➡️' };
    }

    const first = this.progressHistory[0];
    const last = this.progressHistory[this.progressHistory.length - 1];
    const recent = this.progressHistory.slice(-3);

    const totalEliminated = first.totalErrors - last.totalErrors;
    const timeElapsed = (last.timestamp.getTime() - first.timestamp.getTime()) / 1000;
    const rate = timeElapsed > 0 ? (totalEliminated / timeElapsed * 60).toFixed(1) : '0';

    // Calculate trend from recent data
    let trend = '➡️';
    if (recent.length >= 3) {
      const recentTrend = recent[0].totalErrors - recent[recent.length - 1].totalErrors;
      trend = recentTrend > 0 ? '⬇️' : recentTrend < 0 ? '⬆️' : '➡️';
    }

    return { totalEliminated, rate, trend };
  }

  generateEnhancedReport(): void {
    this.clearScreen();

    const timestamp = this.formatTimestamp();
    const progress = this.calculateProgress();

    // Header with real-time info
    console.log('🎯 ENHANCED AGENT COORDINATION DASHBOARD');
    console.log('=' .repeat(70));
    console.log(`📊 Total Errors: ${this.baselineErrors} | Updates: ${this.updateCount} | ${timestamp}`);
    console.log(`📈 Progress: ${progress.totalEliminated} eliminated | Rate: ${progress.rate}/min | ${progress.trend}`);
    console.log();

    // Agent status with enhanced visuals
    console.log('🤖 ACTIVE AGENT STATUS:');
    console.log('-'.repeat(70));

    this.agents.forEach((agent, agentKey) => {
      const actualErrorCount = agent.errorTypes.reduce((sum, type) =>
        sum + (this.errorCounts.get(type) || 0), 0);

      const assigned = agent.errorsAssigned;
      const completed = Math.max(0, assigned - actualErrorCount);
      const progressPercent = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;

      const icon = this.getProgressIcon(completed, assigned);
      const progressBar = this.getProgressBar(completed, assigned, 15);
      const priority = agent.priority === 'HIGH' ? '🔥' : agent.priority === 'MED' ? '⚠️' : '🟢';

      // Track progress changes
      const prevProgress = agent.lastProgress || 0;
      const progressChange = progressPercent - prevProgress;
      const changeIndicator = progressChange > 0 ? `+${progressChange}%` :
                            progressChange < 0 ? `${progressChange}%` : '';

      console.log(`${icon} ${priority} ${agent.name.padEnd(16)} │ ${progressBar} │ ${completed}/${assigned} ${changeIndicator}`);

      if (!this.config.compactMode && actualErrorCount > 0) {
        console.log(`    └─ Target: ${agent.errorTypes.join(', ')} (${actualErrorCount} remaining)`);
      }

      // Update progress tracking
      agent.lastProgress = progressPercent;
    });

    console.log();

    // Quick stats section
    const activeAgents = Array.from(this.agents.values()).filter(a => a.errorsAssigned > 0);
    const completedAgents = activeAgents.filter(a => {
      const actual = a.errorTypes.reduce((sum, type) => sum + (this.errorCounts.get(type) || 0), 0);
      return actual === 0;
    });

    console.log('📊 COORDINATION METRICS:');
    console.log('-'.repeat(30));
    console.log(`👥 Active Agents: ${activeAgents.length}`);
    console.log(`✅ Completed: ${completedAgents.length}`);
    console.log(`🔄 In Progress: ${activeAgents.length - completedAgents.length}`);
    console.log(`⚡ Error Rate: ${progress.rate} errors/min`);

    // Show top unassigned errors if any
    const unassignedErrors = new Map<string, number>();
    const assignedTypes = new Set(
      Array.from(this.agents.values()).flatMap(a => a.errorTypes)
    );

    this.errorCounts.forEach((count, type) => {
      if (!assignedTypes.has(type) && count > 5) {
        unassignedErrors.set(type, count);
      }
    });

    if (unassignedErrors.size > 0) {
      console.log('\n⚠️  TOP UNASSIGNED ERRORS:');
      console.log('-'.repeat(30));
      Array.from(unassignedErrors.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count} errors`);
        });
    }
  }

    async watchMode(customInterval?: number): Promise<void> {
    const interval = customInterval || this.config.refreshInterval;

    console.log('👀 ENHANCED REAL-TIME MONITORING ACTIVE');
    console.log(`⏱️  Refresh: Every ${interval}s | Press Ctrl+C to exit\n`);

    // Initial scan and display
    console.log('🔄 Initial scan...');
    await this.getCurrentErrorCounts();
    this.generateEnhancedReport();

    // Set up interval for updates
    const watchInterval = setInterval(async () => {
      try {
        console.log('🔄 Updating...');
        await this.getCurrentErrorCounts();
        this.generateEnhancedReport();

        // Show refresh indicator
        console.log(`\n🔄 Last updated: ${this.formatTimestamp()} | Next update in ${interval}s`);
      } catch (error) {
        console.error('⚠️  Update error:', error);
      }
    }, interval * 1000);

    // Handle Ctrl+C gracefully
    const cleanup = () => {
      clearInterval(watchInterval);
      console.log('\n\n👋 Monitoring stopped.');
      Deno.exit(0);
    };

    // Handle different signal types
    try {
      Deno.addSignalListener('SIGINT', cleanup);
      Deno.addSignalListener('SIGTERM', cleanup);
    } catch (error) {
      // Fallback for environments that don't support signal listeners
      console.log('Signal listeners not supported, use Ctrl+C to exit');
    }

    // Keep the process alive with a more reliable approach
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async quickScan(): Promise<void> {
    await this.getCurrentErrorCounts();
    this.generateEnhancedReport();
  }
}

// CLI interface with enhanced options
if (import.meta.main) {
  const args = Deno.args;

  // Parse CLI arguments
  const config: Partial<MonitoringConfig> = {};
  let customInterval: number | undefined;

  if (args.includes('--fast')) config.refreshInterval = 5;
  if (args.includes('--slow')) config.refreshInterval = 30;
  if (args.includes('--compact')) config.compactMode = true;
  if (args.includes('--no-clear')) config.clearScreen = false;
  if (args.includes('--no-timestamps')) config.showTimestamps = false;

  const intervalArg = args.find(arg => arg.startsWith('--interval='));
  if (intervalArg) {
    customInterval = parseInt(intervalArg.split('=')[1]);
  }

  const monitor = new EnhancedTypeScriptMonitor(config);

  if (args.includes('--watch') || args.includes('-w')) {
    await monitor.watchMode(customInterval);
  } else {
    await monitor.quickScan();
  }
}

export { EnhancedTypeScriptMonitor };
