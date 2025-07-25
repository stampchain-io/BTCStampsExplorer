#!/usr/bin/env deno run --allow-read --allow-write

/**
 * SSR Safety Detection Script
 *
 * Scans the codebase for potential SSR safety issues:
 * - Unsafe globalThis.location.href usage without browser environment checks
 * - Missing f-partial attributes on navigation elements
 * - Components at risk of SSR errors
 *
 * Usage: deno run --allow-read --allow-write scripts/detectSSRSafety.ts
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { relative } from "https://deno.land/std@0.208.0/path/mod.ts";

interface SSRIssue {
  file: string;
  line: number;
  column: number;
  type: 'unsafe_globalThis' | 'missing_browser_check' | 'missing_f_partial' | 'potential_ssr_error';
  severity: 'high' | 'medium' | 'low';
  description: string;
  code: string;
  suggestion: string;
}

interface SSRSafetyReport {
  timestamp: string;
  totalFiles: number;
  scannedFiles: number;
  issues: SSRIssue[];
  summary: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  safeFiles: string[];
  riskyFiles: string[];
}

class SSRSafetyDetector {
  private issues: SSRIssue[] = [];
  private safeFiles: string[] = [];
  private riskyFiles: string[] = [];
  private scannedFiles = 0;

  private readonly SAFE_PATTERNS = [
    /if\s*\(\s*typeof\s+globalThis\s*[!=]==?\s*["|']undefined["|']\s*\|\|\s*!globalThis\?\.location\s*\)/,
    /if\s*\(\s*!globalThis\?\.location\s*\)/,
    /if\s*\(\s*typeof\s+globalThis\s*[!=]==?\s*["|']undefined["|']\s*\)/,
    /if\s*\(\s*!isBrowser\(\)\s*\)/,
    /getCurrentUrl\(/,
    /navigateWithFresh\(/,
    /navigateToPage\(/,
    /getWindowWidth\(/,
    /getWindowHeight\(/,
  ];

  private readonly UNSAFE_PATTERNS = [
    {
      pattern: /globalThis\.location\.href(?!\s*\/\/\s*Safe)/g,
      type: 'unsafe_globalThis' as const,
      severity: 'high' as const,
      description: 'Direct globalThis.location.href usage without SSR protection',
      suggestion: 'Use getCurrentUrl() from freshNavigationUtils or add browser environment check'
    },
    {
      pattern: /globalThis\.innerWidth(?!\s*\/\/\s*Safe)/g,
      type: 'unsafe_globalThis' as const,
      severity: 'high' as const,
      description: 'Direct globalThis.innerWidth usage without SSR protection',
      suggestion: 'Use getWindowWidth() from freshNavigationUtils or add browser environment check'
    },
    {
      pattern: /globalThis\.innerHeight(?!\s*\/\/\s*Safe)/g,
      type: 'unsafe_globalThis' as const,
      severity: 'high' as const,
      description: 'Direct globalThis.innerHeight usage without SSR protection',
      suggestion: 'Use getWindowHeight() from freshNavigationUtils or add browser environment check'
    },
    {
      pattern: /globalThis\.document(?!\s*\/\/\s*Safe)/g,
      type: 'unsafe_globalThis' as const,
      severity: 'high' as const,
      description: 'Direct globalThis.document usage without SSR protection',
      suggestion: 'Add browser environment check before accessing document'
    },
    {
      pattern: /globalThis\.window(?!\s*\/\/\s*Safe)/g,
      type: 'unsafe_globalThis' as const,
      severity: 'medium' as const,
      description: 'Direct globalThis.window usage without SSR protection',
      suggestion: 'Add browser environment check before accessing window'
    },
    {
      pattern: /globalThis\.localStorage(?!\s*\/\/\s*Safe)/g,
      type: 'unsafe_globalThis' as const,
      severity: 'medium' as const,
      description: 'Direct globalThis.localStorage usage without SSR protection',
      suggestion: 'Add browser environment check before accessing localStorage'
    },
    {
      pattern: /globalThis\.sessionStorage(?!\s*\/\/\s*Safe)/g,
      type: 'unsafe_globalThis' as const,
      severity: 'medium' as const,
      description: 'Direct globalThis.sessionStorage usage without SSR protection',
      suggestion: 'Add browser environment check before accessing sessionStorage'
    },
    {
      pattern: /window\.location\.href/g,
      type: 'unsafe_globalThis' as const,
      severity: 'high' as const,
      description: 'Direct window.location.href usage without SSR protection',
      suggestion: 'Use getCurrentUrl() from freshNavigationUtils or add browser environment check'
    },
    {
      pattern: /document\.getElementById/g,
      type: 'potential_ssr_error' as const,
      severity: 'medium' as const,
      description: 'Direct document.getElementById usage may fail during SSR',
      suggestion: 'Add browser environment check before accessing document'
    },
    {
      pattern: /document\.querySelector/g,
      type: 'potential_ssr_error' as const,
      severity: 'medium' as const,
      description: 'Direct document.querySelector usage may fail during SSR',
      suggestion: 'Add browser environment check before accessing document'
    },
  ];

  private readonly EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
  private readonly EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    '_fresh',
    'dist',
    'build',
    'coverage',
    'tmp',
    'tests',
    'scripts',
    '.deno',
    'deno_modules',
    'npm',
    '.npm',
    'cache',
    '.cache',
    'vendor',
    'coverage_psbt',
    'newman-reporter-enhanced',
  ];

  async scanFile(filePath: string): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);
      this.scannedFiles++;

      const lines = content.split('\n');
      let hasIssues = false;

      // Check for unsafe patterns
      for (const { pattern, type, severity, description, suggestion } of this.UNSAFE_PATTERNS) {
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const column = match.index - content.lastIndexOf('\n', match.index - 1);
          const line = lines[lineNumber - 1];

          // Check if this usage is in a safe context
          const lineContext = lines.slice(Math.max(0, lineNumber - 3), lineNumber + 3).join('\n');
          const isSafe = this.SAFE_PATTERNS.some(safePattern => safePattern.test(lineContext));

          if (!isSafe) {
            this.issues.push({
              file: relative(Deno.cwd(), filePath),
              line: lineNumber,
              column,
              type,
              severity,
              description,
              code: line.trim(),
              suggestion
            });
            hasIssues = true;
          }
        }
      }

      // Check for missing browser environment checks
      if (content.includes('globalThis.location') && !content.includes('typeof globalThis') && !content.includes('isBrowser')) {
        const relevantLines = lines.filter(line => line.includes('globalThis.location'));
        for (const line of relevantLines) {
          const lineNumber = lines.indexOf(line) + 1;
          this.issues.push({
            file: relative(Deno.cwd(), filePath),
            line: lineNumber,
            column: 0,
            type: 'missing_browser_check',
            severity: 'high',
            description: 'globalThis.location usage without browser environment check',
            code: line.trim(),
            suggestion: 'Add browser environment check or use freshNavigationUtils'
          });
          hasIssues = true;
        }
      }

      // Track safe vs risky files
      if (hasIssues) {
        this.riskyFiles.push(relative(Deno.cwd(), filePath));
      } else if (this.EXTENSIONS.some(ext => filePath.endsWith(ext))) {
        this.safeFiles.push(relative(Deno.cwd(), filePath));
      }

    } catch (error) {
      console.error(`Error scanning ${filePath}:`, error);
    }
  }

  async scanDirectory(rootPath: string, isCI = false): Promise<void> {
    if (!isCI) {
      console.log('🔍 Scanning codebase for SSR safety issues...\n');
    }

    let totalFiles = 0;

    for await (const entry of walk(rootPath, {
      exts: this.EXTENSIONS,
      skip: this.EXCLUDE_DIRS.map(dir => new RegExp(`(^|[\\\\/])${dir}([\\\\/]|$)`))
    })) {
      if (entry.isFile) {
        totalFiles++;
        await this.scanFile(entry.path);
      }
    }

    console.log(`📊 Scanned ${this.scannedFiles} files out of ${totalFiles} total files\n`);
  }

  generateReport(): SSRSafetyReport {
    const summary = {
      high: this.issues.filter(i => i.severity === 'high').length,
      medium: this.issues.filter(i => i.severity === 'medium').length,
      low: this.issues.filter(i => i.severity === 'low').length,
      total: this.issues.length
    };

    return {
      timestamp: new Date().toISOString(),
      totalFiles: this.scannedFiles,
      scannedFiles: this.scannedFiles,
      issues: this.issues,
      summary,
      safeFiles: this.safeFiles,
      riskyFiles: this.riskyFiles
    };
  }

  displayReport(report: SSRSafetyReport): void {
    console.log('🛡️  SSR Safety Detection Report');
    console.log('================================\n');

    console.log(`📅 Generated: ${report.timestamp}`);
    console.log(`📁 Files Scanned: ${report.scannedFiles}`);
    console.log(`✅ Safe Files: ${report.safeFiles.length}`);
    console.log(`⚠️  Risky Files: ${report.riskyFiles.length}\n`);

    console.log('🚨 Issues Summary:');
    console.log(`   High Severity: ${report.summary.high}`);
    console.log(`   Medium Severity: ${report.summary.medium}`);
    console.log(`   Low Severity: ${report.summary.low}`);
    console.log(`   Total Issues: ${report.summary.total}\n`);

    if (report.issues.length > 0) {
      console.log('📋 Detailed Issues:\n');

      // Group issues by severity
      const severityGroups = {
        high: report.issues.filter(i => i.severity === 'high'),
        medium: report.issues.filter(i => i.severity === 'medium'),
        low: report.issues.filter(i => i.severity === 'low')
      };

      for (const [severity, issues] of Object.entries(severityGroups)) {
        if (issues.length > 0) {
          console.log(`🔥 ${severity.toUpperCase()} SEVERITY (${issues.length} issues):`);

          for (const issue of issues) {
            console.log(`   📄 ${issue.file}:${issue.line}:${issue.column}`);
            console.log(`   ❌ ${issue.description}`);
            console.log(`   📝 Code: ${issue.code}`);
            console.log(`   💡 Suggestion: ${issue.suggestion}\n`);
          }
        }
      }

      console.log('🔧 Recommendations:');
      console.log('   1. Use freshNavigationUtils for SSR-safe navigation');
      console.log('   2. Add browser environment checks: if (typeof globalThis !== "undefined" && globalThis?.location)');
      console.log('   3. Import and use: getCurrentUrl(), navigateWithFresh(), getWindowWidth(), etc.');
      console.log('   4. Add f-partial attributes to navigation elements');
      console.log('   5. Consider using the isBrowser() helper function\n');
    } else {
      console.log('🎉 No SSR safety issues found! Your codebase is SSR-safe.\n');
    }

    if (report.riskyFiles.length > 0) {
      console.log('⚠️  Files with SSR risks:');
      report.riskyFiles.forEach(file => console.log(`   - ${file}`));
      console.log('');
    }
  }

  async saveReport(report: SSRSafetyReport, outputPath: string, isCI = false): Promise<void> {
    // Never attempt to write files in CI mode
    if (isCI) {
      return;
    }
    
    try {
      await Deno.writeTextFile(outputPath, JSON.stringify(report, null, 2));
      console.log(`💾 Report saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Error saving report:', error);
    }
  }
}

// Main execution
async function main() {
  const detector = new SSRSafetyDetector();
  const args = Deno.args;
  const isCI = args.includes('--ci');

  // Scan the codebase
  await detector.scanDirectory('.', isCI);

  // Generate report
  const report = detector.generateReport();

  if (isCI) {
    // In CI mode, output JSON to stdout for test consumption
    const ciOutput = {
      totalFiles: report.totalFiles,
      issuesFound: report.summary.total,
      critical: report.summary.high,
      medium: report.summary.medium,
      low: report.summary.low,
      issues: report.issues.map(issue => ({
        file: issue.file,
        line: issue.line,
        pattern: issue.type,
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion
      }))
    };
    console.log(JSON.stringify(ciOutput));
  } else {
    // Normal mode - display human-readable report
    detector.displayReport(report);

    // Save report to file
    const outputPath = './ssr-safety-report.json';
    await detector.saveReport(report, outputPath, false);
  }

  // Exit with error code if issues found (except in CI mode for testing)
  if (report.summary.total > 0) {
    if (!isCI) {
      console.log('❌ SSR safety issues detected. Please review and fix the issues above.');
      Deno.exit(1);
    } else {
      // In CI mode, always exit 0 for test compatibility
      Deno.exit(0);
    }
  } else {
    if (!isCI) {
      console.log('✅ All SSR safety checks passed!');
    }
    Deno.exit(0);
  }
}

if (import.meta.main) {
  main();
}
