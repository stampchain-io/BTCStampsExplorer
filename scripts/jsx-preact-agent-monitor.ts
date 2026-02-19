#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * JSX-PREACT-Agent Progress Monitor
 * Tracks TS2345 error resolution progress in real-time
 */

interface TS2345Error {
  file: string;
  line: number;
  column: number;
  message: string;
  category: 'state-updater' | 'psbt-fees' | 'undefined-values' | 'event-handlers' | 'component-props' | 'other';
}

interface ProgressReport {
  timestamp: string;
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByFile: Record<string, number>;
  recentlyFixed: string[];
  remainingWork: string[];
}

class JSXPreactAgentMonitor {
  private baselineErrors: number = 33;
  private startTime: Date = new Date();

  async getTS2345Errors(): Promise<TS2345Error[]> {
    const cmd = new Deno.Command('deno', {
      args: ['check', '--quiet'],
      stdout: 'piped',
      stderr: 'piped',
    });

    const { stdout, stderr } = await cmd.output();
    const output = new TextDecoder().decode(stderr);
    
    const errors: TS2345Error[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('TS2345')) {
        const match = line.match(/^(.+):(\d+):(\d+) - error TS2345: (.+)$/);
        if (match) {
          const [, file, lineStr, columnStr, message] = match;
          const error: TS2345Error = {
            file: file.replace(/^.*\/App\//, ''),
            line: parseInt(lineStr),
            column: parseInt(columnStr),
            message: message.trim(),
            category: this.categorizeError(message)
          };
          errors.push(error);
        }
      }
    }

    return errors;
  }

  private categorizeError(message: string): TS2345Error['category'] {
    if (message.includes('StateUpdater') || message.includes('FormState')) {
      return 'state-updater';
    }
    if (message.includes('PSBTFees') || message.includes('minerFee') || message.includes('estMinerFee')) {
      return 'psbt-fees';
    }
    if (message.includes('undefined') || message.includes('| undefined')) {
      return 'undefined-values';
    }
    if (message.includes('Event') || message.includes('onChange') || message.includes('GenericEventHandler')) {
      return 'event-handlers';
    }
    if (message.includes('IntrinsicAttributes') || message.includes('Props')) {
      return 'component-props';
    }
    return 'other';
  }

  async generateProgressReport(): Promise<ProgressReport> {
    const errors = await this.getTS2345Errors();
    const timestamp = new Date().toISOString();

    const errorsByCategory: Record<string, number> = {};
    const errorsByFile: Record<string, number> = {};

    for (const error of errors) {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsByFile[error.file] = (errorsByFile[error.file] || 0) + 1;
    }

    const progress = Math.round(((this.baselineErrors - errors.length) / this.baselineErrors) * 100);
    const remainingWork = this.generateRemainingWorkList(errors);

    return {
      timestamp,
      totalErrors: errors.length,
      errorsByCategory,
      errorsByFile,
      recentlyFixed: [], // Would be populated by comparing with previous run
      remainingWork
    };
  }

  private generateRemainingWorkList(errors: TS2345Error[]): string[] {
    const categories = Object.keys(errors.reduce((acc, error) => {
      acc[error.category] = true;
      return acc;
    }, {} as Record<string, boolean>));

    return categories.map(category => {
      const count = errors.filter(e => e.category === category).length;
      return `${category}: ${count} errors`;
    });
  }

  async displayProgress(): Promise<void> {
    console.clear();
    console.log('🔥 JSX-PREACT-Agent Progress Monitor');
    console.log('=====================================\n');

    const report = await this.generateProgressReport();
    const progress = Math.round(((this.baselineErrors - report.totalErrors) / this.baselineErrors) * 100);
    const elapsed = Math.round((Date.now() - this.startTime.getTime()) / 1000 / 60);

    console.log(`📊 Overall Progress: ${progress}% (${this.baselineErrors - report.totalErrors}/${this.baselineErrors} errors fixed)`);
    console.log(`⏱️  Time Elapsed: ${elapsed} minutes`);
    console.log(`🎯 Remaining Errors: ${report.totalErrors}\n`);

    if (report.totalErrors > 0) {
      console.log('📋 Errors by Category:');
      Object.entries(report.errorsByCategory)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          const emoji = this.getCategoryEmoji(category);
          console.log(`   ${emoji} ${category}: ${count} errors`);
        });

      console.log('\n📁 Errors by File:');
      Object.entries(report.errorsByFile)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([file, count]) => {
          console.log(`   📄 ${file}: ${count} errors`);
        });

      console.log('\n🎯 Current Focus Areas:');
      report.remainingWork.forEach(item => {
        console.log(`   • ${item}`);
      });
    } else {
      console.log('🎉 ALL TS2345 ERRORS RESOLVED!');
      console.log('✅ JSX-PREACT-Agent mission accomplished!');
    }

    console.log(`\n⏰ Last updated: ${new Date().toLocaleTimeString()}`);
  }

  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      'state-updater': '🔄',
      'psbt-fees': '💰',
      'undefined-values': '❓',
      'event-handlers': '🖱️',
      'component-props': '🧩',
      'other': '🔧'
    };
    return emojis[category] || '❓';
  }

  async updateTaskMaster(report: ProgressReport): Promise<void> {
    const progress = Math.round(((this.baselineErrors - report.totalErrors) / this.baselineErrors) * 100);
    const elapsed = Math.round((Date.now() - this.startTime.getTime()) / 1000 / 60);

    const message = `JSX-PREACT-Agent Progress Update:
${progress}% complete (${this.baselineErrors - report.totalErrors}/${this.baselineErrors} errors fixed)
Time elapsed: ${elapsed} minutes
Remaining: ${report.totalErrors} TS2345 errors

Focus areas:
${report.remainingWork.map(item => `• ${item}`).join('\n')}`;

    try {
      const cmd = new Deno.Command('task-master', {
        args: ['update-subtask', '--id=43.19', `--prompt=${message}`],
        stdout: 'piped',
        stderr: 'piped',
      });
      await cmd.output();
    } catch (error) {
      console.log(`⚠️  Could not update Task Master: ${error.message}`);
    }
  }

  async startMonitoring(): Promise<void> {
    console.log('🚀 Starting JSX-PREACT-Agent monitoring...\n');
    
    // Initial report
    await this.displayProgress();
    
    // Update every 30 seconds
    setInterval(async () => {
      await this.displayProgress();
      
      // Update Task Master every 5 minutes
      if (Date.now() % (5 * 60 * 1000) < 30000) {
        const report = await this.generateProgressReport();
        await this.updateTaskMaster(report);
      }
    }, 30000);
  }
}

// Main execution
if (import.meta.main) {
  const monitor = new JSXPreactAgentMonitor();
  await monitor.startMonitoring();
}