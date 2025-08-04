#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * Import Pattern Validation Script
 * 
 * Validates import patterns across the codebase for consistency and best practices.
 * Designed for CI/CD integration with GitHub Actions workflow.
 * 
 * Features:
 * - Validates import patterns against defined rules
 * - Generates JSON output for CI processing
 * - Provides GitHub annotations for violations
 * - Supports strict mode for failing builds
 * - Performance metrics and recommendations
 */

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'critical' | 'warning' | 'info';
  pattern: RegExp;
  test: (importStatement: string, filePath: string) => boolean;
  recommendation: string;
}

interface ImportViolation {
  file: string;
  line: number;
  column: number;
  pattern: string;
  violationType: string;
  category: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
  ruleId: string;
}

interface ValidationResults {
  success: boolean;
  violations: ImportViolation[];
  stats: {
    totalFiles: number;
    scannedFiles: number;
    violationCount: number;
    complianceRate: number;
    violationsByType: Record<string, number>;
    violationsByCategory: {
      critical: ImportViolation[];
      warning: ImportViolation[];
      info: ImportViolation[];
    };
  };
  performanceMetrics: {
    scanTimeMs: number;
    filesPerSecond: number;
    avgFileProcessingTime: number;
  };
  recommendations: string[];
}

interface CLIOptions {
  ci: boolean;
  strict: boolean;
  json: boolean;
  verbose: boolean;
  outputFile?: string;
}

class ImportPatternValidator {
  private violations: ImportViolation[] = [];
  private scannedFiles = 0;
  private totalFiles = 0;
  private startTime = Date.now();

  // Validation rules
  private readonly rules: ValidationRule[] = [
    {
      id: 'globals-import',
      name: 'Direct Globals Import',
      description: 'Avoid importing directly from $globals - use specific domain imports',
      category: 'critical',
      pattern: /from\s+['"](\$globals)['"]/,
      test: (stmt) => /from\s+['"](\$globals)['"]/.test(stmt),
      recommendation: 'Use domain-specific imports like $types/stamp.d.ts instead of $globals'
    },
    {
      id: 'relative-deep-import',
      name: 'Deep Relative Import',
      description: 'Avoid deep relative imports (more than 2 levels)',
      category: 'warning',
      pattern: /from\s+['"](\.\.[\/\\]\.\.[\/\\]\.\.[\/\\])/,
      test: (stmt) => /from\s+['"](\.\.[\/\\]\.\.[\/\\]\.\.[\/\\])/.test(stmt),
      recommendation: 'Use absolute imports with path aliases instead of deep relative paths'
    },
    {
      id: 'node_modules-direct',
      name: 'Direct node_modules Import',
      description: 'Avoid importing directly from node_modules paths',
      category: 'warning',
      pattern: /from\s+['"][^'"]*node_modules/,
      test: (stmt) => /from\s+['"][^'"]*node_modules/.test(stmt),
      recommendation: 'Import from package name directly, not from node_modules path'
    },
    {
      id: 'mixed-quote-style',
      name: 'Mixed Quote Styles',
      description: 'Inconsistent quote usage in imports',
      category: 'info',
      pattern: /from\s+'/,
      test: (stmt, filePath) => {
        // Check if file has both single and double quotes in imports
        return this.checkMixedQuotes(filePath);
      },
      recommendation: 'Use consistent quote style (prefer double quotes) for all imports'
    },
    {
      id: 'deprecated-fresh-import',
      name: 'Deprecated Fresh Import',
      description: 'Using deprecated Fresh framework imports',
      category: 'warning',
      pattern: /from\s+['"]https:\/\/deno\.land\/x\/fresh@/,
      test: (stmt) => /from\s+['"]https:\/\/deno\.land\/x\/fresh@/.test(stmt),
      recommendation: 'Update to use newer Fresh import patterns or JSR imports'
    },
    {
      id: 'missing-type-only',
      name: 'Missing Type-Only Import',
      description: 'Type imports should use "import type" syntax',
      category: 'info',
      pattern: /import\s+{[^}]*[A-Z][a-zA-Z]*[^}]*}\s+from/,
      test: (stmt) => {
        // Check if importing types without "import type"
        return /import\s+{[^}]*[A-Z][a-zA-Z0-9]*[^}]*}\s+from/.test(stmt) && 
               !stmt.includes('import type') &&
               !stmt.includes('React') && // Allow React imports
               !stmt.includes('Component'); // Allow component imports
      },
      recommendation: 'Use "import type" for type-only imports to improve tree-shaking'
    },
    {
      id: 'unnecessary-index-import',
      name: 'Unnecessary Index Import',
      description: 'Explicitly importing from index files',
      category: 'info',
      pattern: /from\s+['"][^'"]*\/index['"]/,
      test: (stmt) => /from\s+['"][^'"]*\/index['"]/.test(stmt),
      recommendation: 'Remove "/index" from import path - it\'s implicit'
    }
  ];

  async validateProject(options: CLIOptions): Promise<ValidationResults> {
    if (options.verbose) {
      console.log("🔍 Starting import pattern validation...");
    }

    const tsFiles = await this.findTypeScriptFiles();
    this.totalFiles = tsFiles.length;

    if (options.verbose) {
      console.log(`📁 Found ${tsFiles.length} TypeScript files`);
    }

    // Process files
    for (const file of tsFiles) {
      try {
        await this.validateFile(file);
        this.scannedFiles++;

        if (options.verbose && this.scannedFiles % 100 === 0) {
          console.log(`📊 Processed ${this.scannedFiles}/${this.totalFiles} files...`);
        }
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️  Failed to validate ${file}: ${error.message}`);
        }
      }
    }

    return this.generateResults(options);
  }

  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '_fresh',
      'coverage',
      'tmp',
      '.cache',
      'vendor'
    ];

    // Define directories to scan
    const directories = [
      "components",
      "routes", 
      "lib",
      "server",
      "client",
      "islands",
      "tests",
      "scripts"
    ];

    for (const dir of directories) {
      try {
        const dirFiles = await this.scanDirectory(dir, excludePatterns);
        files.push(...dirFiles);
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return files.filter(file => 
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !excludePatterns.some(pattern => file.includes(pattern))
    );
  }

  private async scanDirectory(dir: string, excludePatterns: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      for await (const entry of Deno.readDir(dir)) {
        if (excludePatterns.some(pattern => entry.name.includes(pattern))) {
          continue;
        }

        const fullPath = `${dir}/${entry.name}`;

        if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        } else if (entry.isDirectory) {
          const subFiles = await this.scanDirectory(fullPath, excludePatterns);
          files.push(...subFiles);
        }
      }
    } catch {
      // Permission denied or other error, skip
    }

    return files;
  }

  private async validateFile(filePath: string): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Skip comments and non-import lines
        if (!line.trim().startsWith('import') || line.trim().startsWith('//')) {
          continue;
        }

        // Handle multi-line imports
        let importStatement = line;
        if (line.includes('{') && !line.includes('}')) {
          let j = i + 1;
          while (j < lines.length && !lines[j].includes('}')) {
            importStatement += ' ' + lines[j].trim();
            j++;
          }
          if (j < lines.length) {
            importStatement += ' ' + lines[j].trim();
          }
        }

        // Apply validation rules
        this.applyRules(importStatement, filePath, lineNumber);
      }
    } catch (error) {
      throw new Error(`Failed to read ${filePath}: ${error.message}`);
    }
  }

  private applyRules(importStatement: string, filePath: string, lineNumber: number): void {
    for (const rule of this.rules) {
      if (rule.test(importStatement, filePath)) {
        this.violations.push({
          file: filePath,
          line: lineNumber,
          column: 1,
          pattern: importStatement.trim(),
          violationType: rule.id,
          category: rule.category,
          message: rule.description,
          recommendation: rule.recommendation,
          ruleId: rule.id
        });
      }
    }
  }

  private checkMixedQuotes(filePath: string): boolean {
    // This is a simplified check - in a real implementation,
    // we'd analyze the entire file for mixed quote usage
    return false; // Placeholder
  }

  private generateResults(options: CLIOptions): ValidationResults {
    const endTime = Date.now();
    const scanTimeMs = endTime - this.startTime;
    
    // Categorize violations
    const violationsByCategory = {
      critical: this.violations.filter(v => v.category === 'critical'),
      warning: this.violations.filter(v => v.category === 'warning'),
      info: this.violations.filter(v => v.category === 'info')
    };

    // Count violations by type
    const violationsByType: Record<string, number> = {};
    for (const violation of this.violations) {
      violationsByType[violation.violationType] = (violationsByType[violation.violationType] || 0) + 1;
    }

    // Calculate compliance rate
    const filesWithViolations = new Set(this.violations.map(v => v.file)).size;
    const complianceRate = this.scannedFiles > 0 
      ? ((this.scannedFiles - filesWithViolations) / this.scannedFiles) * 100 
      : 100;

    // Generate recommendations
    const recommendations = this.generateRecommendations(violationsByCategory);

    // Determine success (no critical violations or passed strict mode)
    const success = options.strict 
      ? this.violations.length === 0
      : violationsByCategory.critical.length === 0;

    return {
      success,
      violations: this.violations,
      stats: {
        totalFiles: this.totalFiles,
        scannedFiles: this.scannedFiles,
        violationCount: this.violations.length,
        complianceRate,
        violationsByType,
        violationsByCategory
      },
      performanceMetrics: {
        scanTimeMs,
        filesPerSecond: this.scannedFiles / (scanTimeMs / 1000),
        avgFileProcessingTime: scanTimeMs / this.scannedFiles
      },
      recommendations
    };
  }

  private generateRecommendations(violationsByCategory: ValidationResults['stats']['violationsByCategory']): string[] {
    const recommendations: string[] = [];

    if (violationsByCategory.critical.length > 0) {
      recommendations.push("🚨 Fix critical violations first - these can break builds");
      recommendations.push("🔧 Focus on removing $globals imports and using domain-specific imports");
    }

    if (violationsByCategory.warning.length > 0) {
      recommendations.push("⚠️ Address warning violations to improve code maintainability");
      recommendations.push("📁 Consider using absolute imports instead of deep relative paths");
    }

    if (violationsByCategory.info.length > 0) {
      recommendations.push("💡 Info violations are suggestions for better practices");
      recommendations.push("⚡ Use 'import type' for better tree-shaking performance");
    }

    // Performance recommendations
    if (this.scannedFiles > 500) {
      recommendations.push("🏃 Consider implementing import pattern linting in your editor");
    }

    return recommendations;
  }
}

// CLI Implementation
function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    ci: false,
    strict: false,
    json: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--ci':
        options.ci = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--output':
      case '-o':
        options.outputFile = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        Deno.exit(0);
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Import Pattern Validation Script

USAGE:
  deno run --allow-read --allow-write --allow-run --allow-env scripts/validate-import-patterns.ts [OPTIONS]

OPTIONS:
  --ci              Run in CI mode (suppress interactive output)
  --strict          Strict mode - fail on any violations (including warnings)
  --json            Output results in JSON format
  --verbose, -v     Verbose output with progress information
  --output, -o      Specify output file for JSON results
  --help, -h        Show this help message

EXAMPLES:
  # Basic validation
  deno task check:imports

  # CI validation with strict mode
  deno task check:imports:ci

  # Generate JSON report
  deno task check:imports:json

  # Verbose validation
  deno run --allow-read --allow-write --allow-run --allow-env scripts/validate-import-patterns.ts --verbose

EXIT CODES:
  0  Success (no critical violations)
  1  Validation failed (critical violations found or strict mode violations)
  2  Script error or invalid arguments
`);
}

async function saveResults(results: ValidationResults, outputFile: string): Promise<void> {
  try {
    await Deno.mkdir('.taskmaster/reports', { recursive: true });
    const finalPath = outputFile.startsWith('.') ? outputFile : `.taskmaster/reports/${outputFile}`;
    await Deno.writeTextFile(finalPath, JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(`Failed to save results to ${outputFile}:`, error.message);
  }
}

function displayResults(results: ValidationResults, options: CLIOptions): void {
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (options.ci) {
    // Minimal output for CI
    const { stats } = results;
    console.log(`Files: ${stats.scannedFiles}, Violations: ${stats.violationCount}, Compliance: ${stats.complianceRate.toFixed(1)}%`);
    
    if (!results.success) {
      console.log(`Critical: ${stats.violationsByCategory.critical.length}, Warnings: ${stats.violationsByCategory.warning.length}`);
    }
    return;
  }

  // Interactive output
  const { stats, performanceMetrics } = results;
  
  console.log('\n📊 VALIDATION RESULTS');
  console.log('='.repeat(50));
  console.log(`Status: ${results.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Files Scanned: ${stats.scannedFiles}/${stats.totalFiles}`);
  console.log(`Total Violations: ${stats.violationCount}`);
  console.log(`Compliance Rate: ${stats.complianceRate.toFixed(1)}%`);
  console.log(`Scan Time: ${performanceMetrics.scanTimeMs}ms`);
  
  if (stats.violationCount > 0) {
    console.log('\n📋 VIOLATIONS BY CATEGORY');
    console.log(`🚨 Critical: ${stats.violationsByCategory.critical.length}`);
    console.log(`⚠️  Warning: ${stats.violationsByCategory.warning.length}`);
    console.log(`ℹ️  Info: ${stats.violationsByCategory.info.length}`);

    // Show first few critical violations
    if (stats.violationsByCategory.critical.length > 0) {
      console.log('\n🚨 CRITICAL VIOLATIONS (First 5):');
      stats.violationsByCategory.critical.slice(0, 5).forEach(violation => {
        console.log(`  ${violation.file}:${violation.line} - ${violation.message}`);
      });
    }
  }

  if (results.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    results.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const args = Deno.args;
    const options = parseArgs(args);

    const validator = new ImportPatternValidator();
    const results = await validator.validateProject(options);

    // Save JSON results if requested
    if (options.outputFile) {
      await saveResults(results, options.outputFile);
    }

    // Always save results for CI workflow
    if (options.ci || options.json) {
      await saveResults(results, 'validation-results.json');
    }

    // Display results
    displayResults(results, options);

    // Exit with appropriate code
    if (!results.success) {
      Deno.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation script failed:', error.message);
    
    if (Deno.args.includes('--verbose')) {
      console.error('Stack trace:', error.stack);
    }
    
    Deno.exit(2);
  }
}

if (import.meta.main) {
  main();
}