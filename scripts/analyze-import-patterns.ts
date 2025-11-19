#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Import Pattern Analysis Script
 *
 * Analyzes current import patterns across the codebase to establish
 * optimal standardization strategy for Type Domain Migration.
 *
 * Features:
 * - Comprehensive import pattern detection
 * - Usage frequency analysis
 * - Performance impact assessment
 * - Recommendation engine
 *
 * Part of Task 28.1 - Type Domain Migration
 */

interface ImportAnalysis {
  filePath: string;
  imports: ImportStatement[];
  totalImports: number;
  directDomainImports: number;
  centralizedImports: number;
  mixedPatterns: boolean;
}

interface ImportStatement {
  source: string;
  importType: 'direct-domain' | 'centralized' | 'relative' | 'external' | 'globals';
  specifiers: string[];
  isTypeOnly: boolean;
  lineNumber: number;
  rawStatement: string;
}

interface PatternStatistics {
  totalFiles: number;
  totalImports: number;
  directDomainCount: number;
  centralizedCount: number;
  mixedPatternFiles: number;
  topImportSources: Array<{ source: string; count: number; percentage: number }>;
  typeOnlyPercentage: number;
  recommendations: string[];
}

interface DomainUsage {
  domain: string;
  directImports: number;
  centralizedImports: number;
  files: string[];
  mostUsedTypes: string[];
}

class ImportPatternAnalyzer {
  private analyses: ImportAnalysis[] = [];
  private domainUsage: Map<string, DomainUsage> = new Map();

  // Known domain patterns
  private readonly DOMAIN_PATTERNS = [
    { pattern: /\$types\/stamp\.d\.ts/, domain: 'stamp' },
    { pattern: /\$types\/src20\.d\.ts/, domain: 'src20' },
    { pattern: /\$types\/src101\.d\.ts/, domain: 'src101' },
    { pattern: /\$types\/transaction\.d\.ts/, domain: 'transaction' },
    { pattern: /\$types\/api\.d\.ts/, domain: 'api' },
    { pattern: /\$types\/marketData\.d\.ts/, domain: 'marketData' },
    { pattern: /\$types\/wallet\.d\.ts/, domain: 'wallet' },
    { pattern: /\$types\/pagination\.d\.ts/, domain: 'pagination' },
    { pattern: /\$types\/errors\.d\.ts/, domain: 'errors' },
    { pattern: /\$types\/ui\.d\.ts/, domain: 'ui' },
    { pattern: /\$server\/types\//, domain: 'server-types' },
  ];

  private readonly CENTRALIZED_PATTERNS = [
    /\$types\/index\.d\.ts/,
    /\$types$/,
    /\$globals/,
    /from ['"](\$types)['"]$/
  ];

  async analyzeProject(): Promise<PatternStatistics> {
    console.log("🔍 Starting comprehensive import pattern analysis...\n");

    // Find all TypeScript files
    const tsFiles = await this.findTypeScriptFiles();
    console.log(`📁 Found ${tsFiles.length} TypeScript files to analyze\n`);

    // Analyze each file
    let processedCount = 0;
    for (const file of tsFiles) {
      try {
        const analysis = await this.analyzeFile(file);
        if (analysis) {
          this.analyses.push(analysis);
          this.updateDomainUsage(analysis);
        }

        processedCount++;
        if (processedCount % 50 === 0) {
          console.log(`📊 Processed ${processedCount}/${tsFiles.length} files...`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${file}: ${error.message}`);
      }
    }

    console.log(`✅ Analysis complete! Processed ${this.analyses.length} files\n`);

    // Generate statistics and recommendations
    return this.generateStatistics();
  }

  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];

    // Define directories to scan
    const directories = [
      "components",
      "routes",
      "lib",
      "server",
      "client",
      "islands",
      "test",
      "tests"
    ];

    for (const dir of directories) {
      try {
        for await (const entry of Deno.readDir(dir)) {
          if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(`${dir}/${entry.name}`);
          } else if (entry.isDirectory) {
            const subFiles = await this.findTypeScriptFilesRecursive(`${dir}/${entry.name}`);
            files.push(...subFiles);
          }
        }
      } catch (error) {
        // Directory might not exist, skip
        console.log(`Directory ${dir} not found, skipping...`);
      }
    }

    return files.filter(file =>
      !file.includes('node_modules') &&
      !file.includes('.git') &&
      !file.includes('dist') &&
      !file.includes('build')
    );
  }

  private async findTypeScriptFilesRecursive(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      for await (const entry of Deno.readDir(dir)) {
        const fullPath = `${dir}/${entry.name}`;

        if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        } else if (entry.isDirectory) {
          const subFiles = await this.findTypeScriptFilesRecursive(fullPath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      // Permission denied or other error, skip directory
    }

    return files;
  }

  private async analyzeFile(filePath: string): Promise<ImportAnalysis | null> {
    try {
      const content = await Deno.readTextFile(filePath);
      const imports = this.extractImports(content);

      if (imports.length === 0) {
        return null; // Skip files with no imports
      }

      const directDomainImports = imports.filter(imp => imp.importType === 'direct-domain').length;
      const centralizedImports = imports.filter(imp => imp.importType === 'centralized').length;
      const mixedPatterns = directDomainImports > 0 && centralizedImports > 0;

      return {
        filePath,
        imports,
        totalImports: imports.length,
        directDomainImports,
        centralizedImports,
        mixedPatterns
      };
    } catch (error) {
      return null;
    }
  }

  private extractImports(content: string): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments and non-import lines
      if (!line.startsWith('import') || line.startsWith('//')) {
        continue;
      }

      // Handle multi-line imports
      let importStatement = line;
      let lineNumber = i + 1;

      // If import statement doesn't end with semicolon and has opening brace, it might be multi-line
      if (!line.endsWith(';') && line.includes('{') && !line.includes('}')) {
        let j = i + 1;
        while (j < lines.length && !lines[j].includes('}')) {
          importStatement += ' ' + lines[j].trim();
          j++;
        }
        if (j < lines.length) {
          importStatement += ' ' + lines[j].trim();
        }
      }

      const importInfo = this.parseImportStatement(importStatement, lineNumber);
      if (importInfo) {
        imports.push(importInfo);
      }
    }

    return imports;
  }

  private parseImportStatement(statement: string, lineNumber: number): ImportStatement | null {
    // Match various import patterns
    const patterns = [
      // import type { Type } from "source"
      /import\s+type\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/,
      // import { Type } from "source"
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/,
      // import DefaultExport from "source"
      /import\s+(\w+)\s*from\s*['"]([^'"]+)['"]/,
      // import * as Name from "source"
      /import\s+\*\s+as\s+(\w+)\s*from\s*['"]([^'"]+)['"]/,
      // import "source" (side effects)
      /import\s*['"]([^'"]+)['"]/
    ];

    for (const pattern of patterns) {
      const match = statement.match(pattern);
      if (match) {
        const isTypeOnly = statement.includes('import type');
        const source = match[2] || match[1]; // Handle side-effect imports
        const specifiers = match[1] ?
          match[1].split(',').map(s => s.trim()).filter(s => s.length > 0) :
          [];

        return {
          source,
          importType: this.categorizeImport(source),
          specifiers,
          isTypeOnly,
          lineNumber,
          rawStatement: statement
        };
      }
    }

    return null;
  }

  private categorizeImport(source: string): ImportStatement['importType'] {
    // Check for domain-specific imports
    for (const domainPattern of this.DOMAIN_PATTERNS) {
      if (domainPattern.pattern.test(source)) {
        return 'direct-domain';
      }
    }

    // Check for centralized imports
    for (const centralizedPattern of this.CENTRALIZED_PATTERNS) {
      if (centralizedPattern.test(source)) {
        return 'centralized';
      }
    }

    // Check for relative imports
    if (source.startsWith('./') || source.startsWith('../')) {
      return 'relative';
    }

    // Check for globals
    if (source.includes('$globals')) {
      return 'globals';
    }

    // Everything else is external
    return 'external';
  }

  private updateDomainUsage(analysis: ImportAnalysis): void {
    for (const importStmt of analysis.imports) {
      if (importStmt.importType === 'direct-domain') {
        // Find which domain this belongs to
        for (const domainPattern of this.DOMAIN_PATTERNS) {
          if (domainPattern.pattern.test(importStmt.source)) {
            const domain = domainPattern.domain;

            if (!this.domainUsage.has(domain)) {
              this.domainUsage.set(domain, {
                domain,
                directImports: 0,
                centralizedImports: 0,
                files: [],
                mostUsedTypes: []
              });
            }

            const usage = this.domainUsage.get(domain)!;
            usage.directImports++;

            if (!usage.files.includes(analysis.filePath)) {
              usage.files.push(analysis.filePath);
            }

            // Track type usage
            for (const specifier of importStmt.specifiers) {
              usage.mostUsedTypes.push(specifier);
            }
            break;
          }
        }
      }
    }
  }

  private generateStatistics(): PatternStatistics {
    const totalFiles = this.analyses.length;
    const totalImports = this.analyses.reduce((sum, analysis) => sum + analysis.totalImports, 0);
    const directDomainCount = this.analyses.reduce((sum, analysis) => sum + analysis.directDomainImports, 0);
    const centralizedCount = this.analyses.reduce((sum, analysis) => sum + analysis.centralizedImports, 0);
    const mixedPatternFiles = this.analyses.filter(analysis => analysis.mixedPatterns).length;

    // Count import sources
    const sourceCounts = new Map<string, number>();
    let typeOnlyCount = 0;

    for (const analysis of this.analyses) {
      for (const importStmt of analysis.imports) {
        sourceCounts.set(importStmt.source, (sourceCounts.get(importStmt.source) || 0) + 1);
        if (importStmt.isTypeOnly) {
          typeOnlyCount++;
        }
      }
    }

    // Get top import sources
    const topImportSources = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([source, count]) => ({
        source,
        count,
        percentage: (count / totalImports) * 100
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      totalFiles,
      totalImports,
      directDomainCount,
      centralizedCount,
      mixedPatternFiles
    });

    return {
      totalFiles,
      totalImports,
      directDomainCount,
      centralizedCount,
      mixedPatternFiles,
      topImportSources,
      typeOnlyPercentage: (typeOnlyCount / totalImports) * 100,
      recommendations
    };
  }

  private generateRecommendations(stats: {
    totalFiles: number;
    totalImports: number;
    directDomainCount: number;
    centralizedCount: number;
    mixedPatternFiles: number;
  }): string[] {
    const recommendations: string[] = [];

    const directDomainPercentage = (stats.directDomainCount / stats.totalImports) * 100;
    const centralizedPercentage = (stats.centralizedCount / stats.totalImports) * 100;
    const mixedPatternPercentage = (stats.mixedPatternFiles / stats.totalFiles) * 100;

    // Analysis-based recommendations
    if (directDomainPercentage > 60) {
      recommendations.push("✅ RECOMMENDATION: Continue with direct domain import strategy - already well established");
      recommendations.push("🔧 ACTION: Standardize remaining centralized imports to direct domain imports");
    } else if (centralizedPercentage > 60) {
      recommendations.push("✅ RECOMMENDATION: Consolidate to centralized import strategy - currently predominant");
      recommendations.push("🔧 ACTION: Move direct domain imports to centralized index.d.ts exports");
    } else {
      recommendations.push("⚠️  MIXED PATTERNS: No clear preference detected - choose based on architectural goals");
      recommendations.push("🎯 ARCHITECTURAL DECISION NEEDED: Consider tree-shaking vs. simplicity trade-offs");
    }

    if (mixedPatternPercentage > 30) {
      recommendations.push("🔴 HIGH PRIORITY: Reduce mixed patterns in files - creates maintenance confusion");
      recommendations.push("🛠️  ACTION: Create automated migration script to standardize patterns per file");
    }

    // Performance recommendations
    recommendations.push("🚀 PERFORMANCE: Direct domain imports provide better tree-shaking for bundle size");
    recommendations.push("🧠 DEVELOPER EXPERIENCE: Centralized imports provide simpler import statements");

    return recommendations;
  }

  async generateReport(stats: PatternStatistics): Promise<void> {
    const reportPath = '.taskmaster/reports/import-pattern-analysis.md';

    // Ensure reports directory exists
    try {
      await Deno.mkdir('.taskmaster/reports', { recursive: true });
    } catch {
      // Directory might already exist
    }

    const report = this.formatReport(stats);
    await Deno.writeTextFile(reportPath, report);

    console.log(`📋 Detailed report saved to: ${reportPath}`);
  }

  private formatReport(stats: PatternStatistics): string {
    const domainUsageReport = Array.from(this.domainUsage.entries())
      .sort((a, b) => b[1].directImports - a[1].directImports)
      .map(([domain, usage]) => {
        const topTypes = Array.from(new Set(usage.mostUsedTypes))
          .slice(0, 10)
          .join(', ');

        return `### ${domain} Domain
- **Direct Imports**: ${usage.directImports}
- **Files Using**: ${usage.files.length}
- **Top Types**: ${topTypes}
`;
      }).join('\n');

    return `# Import Pattern Analysis Report

*Generated on: ${new Date().toISOString()}*

## Overview

This analysis examines import patterns across the TypeScript codebase to establish optimal standardization strategies for the Type Domain Migration project.

## Statistics

- **Total Files Analyzed**: ${stats.totalFiles}
- **Total Import Statements**: ${stats.totalImports}
- **Direct Domain Imports**: ${stats.directDomainCount} (${((stats.directDomainCount / stats.totalImports) * 100).toFixed(1)}%)
- **Centralized Imports**: ${stats.centralizedCount} (${((stats.centralizedCount / stats.totalImports) * 100).toFixed(1)}%)
- **Files with Mixed Patterns**: ${stats.mixedPatternFiles} (${((stats.mixedPatternFiles / stats.totalFiles) * 100).toFixed(1)}%)
- **Type-Only Imports**: ${stats.typeOnlyPercentage.toFixed(1)}%

## Top Import Sources

${stats.topImportSources.map((source, index) =>
  `${index + 1}. **${source.source}** - ${source.count} imports (${source.percentage.toFixed(1)}%)`
).join('\n')}

## Domain Usage Analysis

${domainUsageReport}

## Recommendations

${stats.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. **Review Recommendations**: Evaluate the suggested import strategy based on project goals
2. **Architectural Decision**: Choose between direct domain imports vs centralized imports
3. **Create Migration Plan**: Develop automated tooling for pattern standardization
4. **Implement Gradually**: Start with high-traffic modules and expand systematically
5. **Establish Governance**: Create rules and pre-commit hooks for pattern enforcement

---

*This report is part of Task 28.1 - Import Pattern Analysis for Type Domain Migration*
`;
  }
}

// Main execution
async function main() {
  console.log("🎯 Import Pattern Analysis - Type Domain Migration");
  console.log("=".repeat(55));
  console.log();

  const analyzer = new ImportPatternAnalyzer();

  try {
    const statistics = await analyzer.analyzeProject();

    // Display summary
    console.log("📊 ANALYSIS SUMMARY");
    console.log("=".repeat(30));
    console.log(`Files Analyzed: ${statistics.totalFiles}`);
    console.log(`Total Imports: ${statistics.totalImports}`);
    console.log(`Direct Domain: ${statistics.directDomainCount} (${((statistics.directDomainCount / statistics.totalImports) * 100).toFixed(1)}%)`);
    console.log(`Centralized: ${statistics.centralizedCount} (${((statistics.centralizedCount / statistics.totalImports) * 100).toFixed(1)}%)`);
    console.log(`Mixed Pattern Files: ${statistics.mixedPatternFiles} (${((statistics.mixedPatternFiles / statistics.totalFiles) * 100).toFixed(1)}%)`);
    console.log();

    // Display top recommendations
    console.log("🎯 KEY RECOMMENDATIONS");
    console.log("=".repeat(30));
    statistics.recommendations.slice(0, 5).forEach(rec => console.log(rec));
    console.log();

    // Generate detailed report
    await analyzer.generateReport(statistics);

    console.log("✅ Import pattern analysis completed successfully!");

  } catch (error) {
    console.error("❌ Analysis failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
