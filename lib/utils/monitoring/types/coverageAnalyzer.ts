/**
 * Type Coverage Analyzer
 * Task 35.4 - Develop Type Safety Validation Pipelines
 *
 * Provides comprehensive type coverage analysis to ensure all parts
 * of the codebase have proper type annotations and safety.
 */

import { logger } from "$lib/utils/logger.ts";

export interface TypeCoverageAnalysis {
  /** Analysis timestamp */
  timestamp: number;
  /** Overall coverage statistics */
  overall: CoverageStats;
  /** Coverage by directory */
  byDirectory: Record<string, CoverageStats>;
  /** Coverage by file type */
  byFileType: Record<string, CoverageStats>;
  /** Files with lowest coverage */
  lowCoverageFiles: FileCoverageInfo[];
  /** Type annotation recommendations */
  recommendations: TypeRecommendation[];
  /** Trend analysis compared to previous runs */
  trend?: CoverageTrend;
}

export interface CoverageStats {
  /** Total number of identifiers that could have type annotations */
  totalIdentifiers: number;
  /** Number of identifiers with explicit type annotations */
  typedIdentifiers: number;
  /** Number of identifiers with inferred types */
  inferredIdentifiers: number;
  /** Number of identifiers with any type */
  anyIdentifiers: number;
  /** Number of identifiers with unknown type */
  unknownIdentifiers: number;
  /** Coverage percentage (0-100) */
  coveragePercentage: number;
  /** Type safety score (0-100) */
  safetyScore: number;
}

export interface FileCoverageInfo {
  /** File path */
  filePath: string;
  /** Coverage statistics for this file */
  coverage: CoverageStats;
  /** Specific issues in this file */
  issues: TypeCoverageIssue[];
  /** File size in lines */
  lineCount: number;
  /** File complexity score */
  complexityScore: number;
}

export interface TypeCoverageIssue {
  /** Issue type */
  type:
    | "missing_annotation"
    | "any_usage"
    | "implicit_any"
    | "unsafe_assertion";
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  /** Line number where issue occurs */
  line: number;
  /** Column number */
  column: number;
  /** Issue description */
  description: string;
  /** Code snippet showing the issue */
  codeSnippet: string;
  /** Suggested fix */
  suggestedFix: string;
}

export interface TypeRecommendation {
  /** Recommendation category */
  category: "coverage" | "safety" | "performance" | "maintainability";
  /** Priority level */
  priority: "low" | "medium" | "high" | "critical";
  /** Recommendation description */
  description: string;
  /** Files affected by this recommendation */
  affectedFiles: string[];
  /** Estimated effort to implement */
  effort: "low" | "medium" | "high";
  /** Expected impact */
  impact: string;
}

export interface CoverageTrend {
  /** Previous analysis for comparison */
  previousAnalysis: TypeCoverageAnalysis;
  /** Coverage change since last analysis */
  coverageChange: number;
  /** Safety score change */
  safetyScoreChange: number;
  /** Trend direction */
  trend: "improving" | "stable" | "degrading";
  /** Files that improved */
  improvedFiles: string[];
  /** Files that degraded */
  degradedFiles: string[];
}

/**
 * Type Coverage Analyzer
 *
 * Analyzes TypeScript files to determine type coverage and safety,
 * identifying areas that need better type annotations.
 */
export class TypeCoverageAnalyzer {
  private previousAnalysis: TypeCoverageAnalysis | null = null;

  /**
   * Analyze type coverage across the project
   */
  async analyzeCoverage(
    projectRoot: string = ".",
  ): Promise<TypeCoverageAnalysis> {
    const startTime = performance.now();
    logger.info("system", {
      message: "[coverage-analyzer] Starting type coverage analysis",
    });

    try {
      // Get all TypeScript files
      const files = await this.getTypeScriptFiles(projectRoot);
      logger.info("system", {
        message: `[coverage-analyzer] Found ${files.length} TypeScript files`,
      });

      // Analyze each file
      const fileAnalyses = await Promise.all(
        files.map((file) => this.analyzeFile(file)),
      );

      // Calculate overall statistics
      const overall = this.calculateOverallStats(fileAnalyses);

      // Group by directory
      const byDirectory = this.groupByDirectory(fileAnalyses);

      // Group by file type
      const byFileType = this.groupByFileType(fileAnalyses);

      // Find files with low coverage
      const lowCoverageFiles = this.findLowCoverageFiles(fileAnalyses);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        fileAnalyses,
        overall,
      );

      // Perform trend analysis if previous data exists
      let trend: CoverageTrend | undefined;
      if (this.previousAnalysis) {
        trend = this.analyzeTrend(overall, fileAnalyses);
      }

      const analysis: TypeCoverageAnalysis = {
        timestamp: Date.now(),
        overall,
        byDirectory,
        byFileType,
        lowCoverageFiles,
        recommendations,
        trend,
      };

      const duration = performance.now() - startTime;
      logger.info(
        "system",
        {
          message: `[coverage-analyzer] Analysis completed in ${
            duration.toFixed(1)
          }ms`,
        },
      );

      // Store for future trend analysis
      this.previousAnalysis = analysis;

      return analysis;
    } catch (error) {
      logger.error("system", {
        message: `[coverage-analyzer] Analysis failed: ${
          (error as Error).message
        }`,
      });
      throw error;
    }
  }

  /**
   * Get all TypeScript files in the project
   */
  private async getTypeScriptFiles(projectRoot: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const command = new Deno.Command("find", {
        args: [
          projectRoot,
          "-type",
          "f",
          "(",
          "-name",
          "*.ts",
          "-o",
          "-name",
          "*.tsx",
          ")",
          "-not",
          "-path",
          "*/node_modules/*",
          "-not",
          "-path",
          "*/_fresh/*",
          "-not",
          "-path",
          "*/.git/*",
          "-not",
          "-path",
          "*/coverage/*",
          "-not",
          "-path",
          "*/tmp/*",
          "-not",
          "-path",
          "*/.taskmaster/*",
          "-not",
          "-name",
          "*.d.ts", // Skip declaration files
        ],
        stdout: "piped",
      });

      const result = await command.output();
      if (result.code === 0) {
        const output = new TextDecoder().decode(result.stdout);
        files.push(...output.split("\n").filter((f) => f.trim().length > 0));
      }
    } catch (error) {
      logger.warn(
        "system",
        {
          message: `[coverage-analyzer] Failed to enumerate files: ${
            (error as Error).message
          }`,
        },
      );
    }

    return files.sort();
  }

  /**
   * Analyze type coverage for a single file
   */
  private async analyzeFile(filePath: string): Promise<FileCoverageInfo> {
    try {
      const content = await Deno.readTextFile(filePath);
      const lines = content.split("\n");

      const coverage = await this.analyzeFileContent(content);
      const issues = await this.findFileIssues(content, lines);
      const complexityScore = this.calculateComplexityScore(content);

      return {
        filePath,
        coverage,
        issues,
        lineCount: lines.length,
        complexityScore,
      };
    } catch (error) {
      logger.warn(
        "system",
        {
          message: `[coverage-analyzer] Failed to analyze ${filePath}: ${
            (error as Error).message
          }`,
        },
      );

      // Return minimal coverage info for failed files
      return {
        filePath,
        coverage: {
          totalIdentifiers: 0,
          typedIdentifiers: 0,
          inferredIdentifiers: 0,
          anyIdentifiers: 0,
          unknownIdentifiers: 0,
          coveragePercentage: 0,
          safetyScore: 0,
        },
        issues: [],
        lineCount: 0,
        complexityScore: 0,
      };
    }
  }

  /**
   * Analyze type coverage in file content
   */
  private async analyzeFileContent(content: string): Promise<CoverageStats> {
    let totalIdentifiers = 0;
    let typedIdentifiers = 0;
    let inferredIdentifiers = 0;
    let anyIdentifiers = 0;
    let unknownIdentifiers = 0;

    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
        continue;
      }

      // Analyze variable declarations
      if (
        trimmed.includes("const ") || trimmed.includes("let ") ||
        trimmed.includes("var ")
      ) {
        const matches = trimmed.match(
          /(?:const|let|var)\s+(\w+)(\s*:\s*([^=]+))?/g,
        );
        if (matches) {
          for (const match of matches) {
            totalIdentifiers++;
            if (match.includes(": any")) {
              anyIdentifiers++;
            } else if (match.includes(": unknown")) {
              unknownIdentifiers++;
            } else if (match.includes(":")) {
              typedIdentifiers++;
            } else {
              inferredIdentifiers++;
            }
          }
        }
      }

      // Analyze function parameters and return types
      if (
        trimmed.includes("function ") || trimmed.includes("=>") ||
        trimmed.includes("async ")
      ) {
        const functionMatches = trimmed.match(
          /\(([^)]*)\)(\s*:\s*([^{=>\s]+))?/g,
        );
        if (functionMatches) {
          for (const match of functionMatches) {
            // Count parameters
            const paramSection = match.match(/\(([^)]*)\)/)?.[1];
            if (paramSection) {
              const params = paramSection.split(",").filter((p) => p.trim());
              for (const param of params) {
                totalIdentifiers++;
                if (param.includes(": any")) {
                  anyIdentifiers++;
                } else if (param.includes(": unknown")) {
                  unknownIdentifiers++;
                } else if (param.includes(":")) {
                  typedIdentifiers++;
                } else {
                  inferredIdentifiers++;
                }
              }
            }

            // Count return type
            if (match.includes("): ")) {
              totalIdentifiers++;
              if (match.includes(": any")) {
                anyIdentifiers++;
              } else if (match.includes(": unknown")) {
                unknownIdentifiers++;
              } else {
                typedIdentifiers++;
              }
            }
          }
        }
      }

      // Analyze interface and type properties
      if (trimmed.includes("interface ") || trimmed.includes("type ")) {
        const propertyMatches = trimmed.match(/(\w+)(\??):\s*([^;,}]+)/g);
        if (propertyMatches) {
          for (const match of propertyMatches) {
            totalIdentifiers++;
            if (match.includes(": any")) {
              anyIdentifiers++;
            } else if (match.includes(": unknown")) {
              unknownIdentifiers++;
            } else {
              typedIdentifiers++;
            }
          }
        }
      }
    }

    // Calculate percentages
    const coveragePercentage = totalIdentifiers > 0
      ? ((typedIdentifiers + inferredIdentifiers) / totalIdentifiers) * 100
      : 100;

    const safetyScore = totalIdentifiers > 0
      ? ((typedIdentifiers + inferredIdentifiers) / totalIdentifiers) * 100 -
        ((anyIdentifiers + unknownIdentifiers) / totalIdentifiers) * 50
      : 100;

    return {
      totalIdentifiers,
      typedIdentifiers,
      inferredIdentifiers,
      anyIdentifiers,
      unknownIdentifiers,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      safetyScore: Math.round(Math.max(0, safetyScore) * 100) / 100,
    };
  }

  /**
   * Find type coverage issues in a file
   */
  private async findFileIssues(
    content: string,
    lines: string[],
  ): Promise<TypeCoverageIssue[]> {
    const issues: TypeCoverageIssue[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith("//") || trimmed.startsWith("/*")) {
        continue;
      }

      // Check for explicit any usage
      if (line.includes(": any") && !trimmed.startsWith("//")) {
        issues.push({
          type: "any_usage",
          severity: "medium",
          line: i + 1,
          column: line.indexOf(": any"),
          description: "Explicit any type detected",
          codeSnippet: trimmed,
          suggestedFix: "Replace any with specific type annotation",
        });
      }

      // Check for type assertions
      if (line.includes(" as ") && !trimmed.startsWith("//")) {
        issues.push({
          type: "unsafe_assertion",
          severity: "low",
          line: i + 1,
          column: line.indexOf(" as "),
          description: "Type assertion detected",
          codeSnippet: trimmed,
          suggestedFix: "Verify type assertion safety or use type guards",
        });
      }

      // Check for untyped parameters
      const functionMatch = line.match(/function\s+\w+\s*\(([^)]*)\)/);
      if (functionMatch) {
        const params = functionMatch[1];
        if (params && !params.includes(":") && params.trim() !== "") {
          issues.push({
            type: "missing_annotation",
            severity: "medium",
            line: i + 1,
            column: line.indexOf("("),
            description: "Function parameters missing type annotations",
            codeSnippet: trimmed,
            suggestedFix: "Add type annotations to function parameters",
          });
        }
      }
    }

    return issues;
  }

  /**
   * Calculate complexity score for a file
   */
  private calculateComplexityScore(content: string): number {
    let complexity = 0;

    // Count various complexity indicators
    const ifCount = (content.match(/\bif\b/g) || []).length;
    const forCount = (content.match(/\bfor\b/g) || []).length;
    const whileCount = (content.match(/\bwhile\b/g) || []).length;
    const switchCount = (content.match(/\bswitch\b/g) || []).length;
    const tryCount = (content.match(/\btry\b/g) || []).length;
    const functionCount = (content.match(/\bfunction\b/g) || []).length;
    const classCount = (content.match(/\bclass\b/g) || []).length;
    const interfaceCount = (content.match(/\binterface\b/g) || []).length;

    complexity = ifCount + forCount + whileCount + (switchCount * 2) +
      tryCount + functionCount + (classCount * 2) + interfaceCount;

    return Math.min(complexity, 100); // Cap at 100
  }

  /**
   * Calculate overall statistics from file analyses
   */
  private calculateOverallStats(
    fileAnalyses: FileCoverageInfo[],
  ): CoverageStats {
    let totalIdentifiers = 0;
    let typedIdentifiers = 0;
    let inferredIdentifiers = 0;
    let anyIdentifiers = 0;
    let unknownIdentifiers = 0;

    for (const analysis of fileAnalyses) {
      const stats = analysis.coverage;
      totalIdentifiers += stats.totalIdentifiers;
      typedIdentifiers += stats.typedIdentifiers;
      inferredIdentifiers += stats.inferredIdentifiers;
      anyIdentifiers += stats.anyIdentifiers;
      unknownIdentifiers += stats.unknownIdentifiers;
    }

    const coveragePercentage = totalIdentifiers > 0
      ? ((typedIdentifiers + inferredIdentifiers) / totalIdentifiers) * 100
      : 100;

    const safetyScore = totalIdentifiers > 0
      ? ((typedIdentifiers + inferredIdentifiers) / totalIdentifiers) * 100 -
        ((anyIdentifiers + unknownIdentifiers) / totalIdentifiers) * 50
      : 100;

    return {
      totalIdentifiers,
      typedIdentifiers,
      inferredIdentifiers,
      anyIdentifiers,
      unknownIdentifiers,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      safetyScore: Math.round(Math.max(0, safetyScore) * 100) / 100,
    };
  }

  /**
   * Group analyses by directory
   */
  private groupByDirectory(
    fileAnalyses: FileCoverageInfo[],
  ): Record<string, CoverageStats> {
    const byDirectory: Record<string, FileCoverageInfo[]> = {};

    // Group files by directory
    for (const analysis of fileAnalyses) {
      const dir = analysis.filePath.split("/").slice(0, -1).join("/") || ".";
      if (!byDirectory[dir]) {
        byDirectory[dir] = [];
      }
      byDirectory[dir].push(analysis);
    }

    // Calculate stats for each directory
    const result: Record<string, CoverageStats> = {};
    for (const [dir, analyses] of Object.entries(byDirectory)) {
      result[dir] = this.calculateOverallStats(analyses);
    }

    return result;
  }

  /**
   * Group analyses by file type
   */
  private groupByFileType(
    fileAnalyses: FileCoverageInfo[],
  ): Record<string, CoverageStats> {
    const byFileType: Record<string, FileCoverageInfo[]> = {};

    // Group files by extension
    for (const analysis of fileAnalyses) {
      const ext = analysis.filePath.split(".").pop() || "unknown";
      if (!byFileType[ext]) {
        byFileType[ext] = [];
      }
      byFileType[ext].push(analysis);
    }

    // Calculate stats for each file type
    const result: Record<string, CoverageStats> = {};
    for (const [type, analyses] of Object.entries(byFileType)) {
      result[type] = this.calculateOverallStats(analyses);
    }

    return result;
  }

  /**
   * Find files with low coverage
   */
  private findLowCoverageFiles(
    fileAnalyses: FileCoverageInfo[],
  ): FileCoverageInfo[] {
    return fileAnalyses
      .filter((analysis) => analysis.coverage.coveragePercentage < 80)
      .sort((a, b) =>
        a.coverage.coveragePercentage - b.coverage.coveragePercentage
      )
      .slice(0, 10); // Top 10 lowest coverage files
  }

  /**
   * Generate type coverage recommendations
   */
  private generateRecommendations(
    fileAnalyses: FileCoverageInfo[],
    overall: CoverageStats,
  ): TypeRecommendation[] {
    const recommendations: TypeRecommendation[] = [];

    // Overall coverage recommendations
    if (overall.coveragePercentage < 80) {
      recommendations.push({
        category: "coverage",
        priority: "high",
        description: `Overall type coverage is ${
          overall.coveragePercentage.toFixed(1)
        }%. Target: 85%+`,
        affectedFiles: fileAnalyses
          .filter((f) => f.coverage.coveragePercentage < 80)
          .map((f) => f.filePath)
          .slice(0, 5),
        effort: "high",
        impact: "Improved type safety and developer experience",
      });
    }

    // Any type usage recommendations
    if (overall.anyIdentifiers > 0) {
      const filesWithAny = fileAnalyses.filter((f) =>
        f.coverage.anyIdentifiers > 0
      );
      recommendations.push({
        category: "safety",
        priority: "medium",
        description:
          `${overall.anyIdentifiers} 'any' types detected across ${filesWithAny.length} files`,
        affectedFiles: filesWithAny.map((f) => f.filePath).slice(0, 5),
        effort: "medium",
        impact: "Reduced type safety vulnerabilities",
      });
    }

    // Complex files recommendations
    const complexFiles = fileAnalyses
      .filter((f) => f.complexityScore > 20)
      .sort((a, b) => b.complexityScore - a.complexityScore);

    if (complexFiles.length > 0) {
      recommendations.push({
        category: "maintainability",
        priority: "medium",
        description:
          `${complexFiles.length} files have high complexity and may benefit from better typing`,
        affectedFiles: complexFiles.map((f) => f.filePath).slice(0, 5),
        effort: "high",
        impact: "Improved maintainability and reduced bugs",
      });
    }

    return recommendations;
  }

  /**
   * Analyze trends compared to previous analysis
   */
  private analyzeTrend(
    currentOverall: CoverageStats,
    currentFileAnalyses: FileCoverageInfo[],
  ): CoverageTrend {
    if (!this.previousAnalysis) {
      throw new Error("No previous analysis available for trend analysis");
    }

    const previousOverall = this.previousAnalysis.overall;
    const coverageChange = currentOverall.coveragePercentage -
      previousOverall.coveragePercentage;
    const safetyScoreChange = currentOverall.safetyScore -
      previousOverall.safetyScore;

    let trend: "improving" | "stable" | "degrading";
    if (coverageChange > 1 && safetyScoreChange > 1) {
      trend = "improving";
    } else if (coverageChange < -1 || safetyScoreChange < -1) {
      trend = "degrading";
    } else {
      trend = "stable";
    }

    // Find improved and degraded files
    const currentFileMap = new Map(
      currentFileAnalyses.map((f) => [f.filePath, f]),
    );
    const previousLowCoverageMap = new Map(
      this.previousAnalysis.lowCoverageFiles.map((f) => [f.filePath, f]),
    );

    const improvedFiles: string[] = [];
    const degradedFiles: string[] = [];

    for (const [path, current] of currentFileMap) {
      const previous = previousLowCoverageMap.get(path);
      if (previous) {
        const change = current.coverage.coveragePercentage -
          previous.coverage.coveragePercentage;
        if (change > 5) {
          improvedFiles.push(path);
        } else if (change < -5) {
          degradedFiles.push(path);
        }
      }
    }

    return {
      previousAnalysis: this.previousAnalysis,
      coverageChange,
      safetyScoreChange,
      trend,
      improvedFiles,
      degradedFiles,
    };
  }
}

/**
 * Global type coverage analyzer instance
 */
export const typeCoverageAnalyzer = new TypeCoverageAnalyzer();
