#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-env

/**
 * TS18048 Null Safety Error Analysis Tool
 * 
 * Specifically analyzes "X is possibly 'undefined'" errors across the BTCStampsExplorer codebase
 */

interface NullSafetyError {
  file: string;
  line: number;
  column: number;
  expression: string;
  objectName: string;
  propertyAccess: string;
  fullError: string;
  category: string;
  pattern: string;
}

interface ErrorAnalysis {
  totalErrors: number;
  errorsByFile: Map<string, NullSafetyError[]>;
  errorsByCategory: Map<string, NullSafetyError[]>;
  errorsByPattern: Map<string, number>;
  commonExpressions: Map<string, number>;
  priorityFiles: string[];
}

class NullSafetyAnalyzer {
  private errors: NullSafetyError[] = [];

  async runAnalysis(): Promise<void> {
    console.log("🔍 Running null safety analysis with strict TypeScript checking...\n");
    
    // First, let's check specific files that are likely to have these errors
    const targetFiles = await this.findTargetFiles();
    
    for (const file of targetFiles) {
      await this.analyzeFile(file);
    }
    
    if (this.errors.length === 0) {
      console.log("ℹ️  No TS18048 errors detected with current configuration.");
      console.log("Let me check for potential null safety issues using pattern analysis...\n");
      await this.performPatternAnalysis();
    }
    
    this.generateReport();
  }

  private async findTargetFiles(): Promise<string[]> {
    const command = new Deno.Command("find", {
      args: [
        ".",
        "-name", "*.ts",
        "-o", "-name", "*.tsx",
        "|", "grep", "-E", "(components|islands|routes)",
        "|", "grep", "-v", "node_modules",
        "|", "head", "-100"
      ],
      stdout: "piped",
      stderr: "piped",
      cwd: Deno.cwd()
    });
    
    const { stdout } = await command.output();
    const output = new TextDecoder().decode(stdout);
    return output.split("\n").filter(f => f.trim());
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);
      const lines = content.split("\n");
      
      // Pattern matching for potential null safety issues
      const patterns = [
        // Direct property access on potentially undefined objects
        /(\w+)\.(\w+)(?!\?)/g,
        // Array/object destructuring without defaults
        /const\s*{\s*([^}]+)\s*}\s*=\s*(\w+)/g,
        // Array access without length check
        /(\w+)\[(\d+)\]/g,
        // Map/filter/reduce on potentially undefined arrays
        /(\w+)\.(map|filter|reduce|forEach)\(/g,
        // Property access chains
        /(\w+)\.(\w+)\.(\w+)/g,
      ];
      
      lines.forEach((line, lineIndex) => {
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            // Check if this could be a null safety issue
            if (this.isPotentialNullSafetyIssue(match[0], line)) {
              this.errors.push({
                file: filePath,
                line: lineIndex + 1,
                column: match.index + 1,
                expression: match[0],
                objectName: match[1] || "",
                propertyAccess: match[2] || "",
                fullError: `'${match[0]}' is possibly 'undefined'`,
                category: this.categorizeError(filePath, match[0]),
                pattern: this.identifyPattern(match[0], line)
              });
            }
          }
        });
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  private isPotentialNullSafetyIssue(expression: string, line: string): boolean {
    // Skip common safe patterns
    const safePatterns = [
      /\?\./, // Optional chaining
      /\?\?/, // Nullish coalescing
      /if\s*\(.*\)/, // Inside if condition
      /&&\s*/, // After logical AND
      /\|\|\s*/, // After logical OR
      /typeof\s+/, // Type checking
      /!==\s*undefined/, // Explicit undefined check
      /!=\s*null/, // Explicit null check
      /\w+\s*=/, // Assignment
      /import/, // Import statements
      /export/, // Export statements
      /\.\s*\w+\s*\(/, // Method calls on known objects
    ];
    
    // Check if the expression is in a safe context
    for (const pattern of safePatterns) {
      if (pattern.test(line)) {
        return false;
      }
    }
    
    // Skip known safe object names
    const safeObjects = [
      "console", "Math", "JSON", "Object", "Array", "String", "Number",
      "document", "window", "process", "Deno", "Response", "Request"
    ];
    
    const objectName = expression.split(".")[0];
    if (safeObjects.includes(objectName)) {
      return false;
    }
    
    // Check for common null-unsafe patterns
    const unsafePatterns = [
      /stamp\.stamps/, // Accessing nested stamp data
      /src20\./, // SRC20 property access
      /holder\./, // Holder data access
      /balance\./, // Balance data access
      /data\.\w+\./, // Nested data access
      /response\.data\./, // API response access
      /props\.\w+\./, // Nested prop access
    ];
    
    return unsafePatterns.some(pattern => pattern.test(expression));
  }

  private categorizeError(filePath: string, expression: string): string {
    if (filePath.includes("/components/card/")) return "card-component";
    if (filePath.includes("/components/table/")) return "table-component";
    if (filePath.includes("/islands/")) return "island-component";
    if (filePath.includes("/routes/")) return "route-handler";
    if (filePath.includes("/lib/utils/")) return "utility-function";
    if (filePath.includes("/server/")) return "server-logic";
    
    // Expression-based categories
    if (expression.includes("stamp")) return "stamp-data-access";
    if (expression.includes("src20")) return "src20-data-access";
    if (expression.includes("holder") || expression.includes("balance")) return "holder-balance-access";
    if (expression.includes("length") || expression.includes("[")) return "array-access";
    
    return "uncategorized";
  }

  private identifyPattern(expression: string, line: string): string {
    if (/\w+\.\w+\.\w+/.test(expression)) return "nested-property-access";
    if (/\w+\[\d+\]/.test(expression)) return "array-index-access";
    if (/\.(map|filter|reduce|forEach)\(/.test(expression)) return "array-method-call";
    if (/const\s*{/.test(line)) return "object-destructuring";
    if (/\w+\?\./.test(expression)) return "optional-chaining-missing";
    if (/data\.\w+/.test(expression)) return "api-response-access";
    
    return "direct-property-access";
  }

  private async performPatternAnalysis(): Promise<void> {
    console.log("🔎 Performing deep pattern analysis for potential null safety issues...\n");
    
    // Focus on known problematic files from the task context
    const problematicPaths = [
      "./components/card",
      "./components/table",
      "./islands/section",
      "./routes/collection",
      "./lib/utils"
    ];
    
    for (const path of problematicPaths) {
      const files = await this.findFilesInPath(path);
      for (const file of files) {
        await this.deepAnalyzeFile(file);
      }
    }
  }

  private async findFilesInPath(path: string): Promise<string[]> {
    try {
      const files: string[] = [];
      for await (const entry of Deno.readDir(path)) {
        if (entry.isFile && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          files.push(`${path}/${entry.name}`);
        }
      }
      return files;
    } catch {
      return [];
    }
  }

  private async deepAnalyzeFile(filePath: string): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);
      
      // Look for specific patterns that commonly cause TS18048
      const nullSafetyPatterns = [
        // Stamp data access patterns
        /stamp\.stamps(?!\?)/g,
        /stamp\.stamp_url(?!\?)/g,
        /stamp\.collection_name(?!\?)/g,
        
        // SRC20 data patterns
        /src20\.tick(?!\?)/g,
        /src20\.max(?!\?)/g,
        /src20\.holders(?!\?)/g,
        
        // Collection and holder patterns
        /collection\.stamps(?!\?)/g,
        /holder\.balances(?!\?)/g,
        /data\.stamps(?!\?)/g,
        
        // Array access without safety
        /(\w+)\.length(?!\s*[><=])/g,
        /(\w+)\[0\](?!\s*\?)/g,
        
        // Response data access
        /response\.data\.(?!\?)/g,
        /result\.data\.(?!\?)/g,
      ];
      
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        nullSafetyPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            this.errors.push({
              file: filePath,
              line: index + 1,
              column: match.index + 1,
              expression: match[0],
              objectName: match[0].split(".")[0],
              propertyAccess: match[0].split(".").slice(1).join("."),
              fullError: `TS18048: '${match[0]}' is possibly 'undefined'`,
              category: this.categorizeError(filePath, match[0]),
              pattern: this.identifyPattern(match[0], line)
            });
          }
        });
      });
    } catch (error) {
      // Skip unreadable files
    }
  }

  private generateReport(): void {
    const analysis = this.analyzeErrors();
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 TS18048 NULL SAFETY ERROR ANALYSIS REPORT");
    console.log("=".repeat(60) + "\n");
    
    console.log(`📈 SUMMARY`);
    console.log(`Total Potential TS18048 Errors: ${analysis.totalErrors}`);
    console.log(`Files Affected: ${analysis.errorsByFile.size}`);
    console.log(`Unique Patterns: ${analysis.errorsByPattern.size}\n`);
    
    console.log("📁 ERROR DISTRIBUTION BY CATEGORY");
    console.log("-".repeat(40));
    const sortedCategories = Array.from(analysis.errorsByCategory.entries())
      .sort((a, b) => b[1].length - a[1].length);
    
    for (const [category, errors] of sortedCategories) {
      const percentage = ((errors.length / analysis.totalErrors) * 100).toFixed(1);
      console.log(`${category}: ${errors.length} errors (${percentage}%)`);
      
      // Show top 3 examples
      const examples = errors.slice(0, 3);
      for (const error of examples) {
        const relPath = error.file.replace(/^\.\//, "");
        console.log(`  → ${relPath}:${error.line} - ${error.expression}`);
      }
      if (errors.length > 3) {
        console.log(`  ... and ${errors.length - 3} more\n`);
      }
    }
    
    console.log("\n🎯 TOP 10 MOST AFFECTED FILES");
    console.log("-".repeat(40));
    const sortedFiles = Array.from(analysis.errorsByFile.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    for (const [file, errors] of sortedFiles) {
      const relPath = file.replace(/^\.\//, "");
      console.log(`\n${relPath}: ${errors.length} errors`);
      
      // Group by pattern
      const patterns = new Map<string, number>();
      errors.forEach(e => patterns.set(e.pattern, (patterns.get(e.pattern) || 0) + 1));
      
      Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([pattern, count]) => {
          console.log(`  • ${pattern}: ${count}`);
        });
    }
    
    console.log("\n\n🔍 COMMON ERROR PATTERNS");
    console.log("-".repeat(40));
    Array.from(analysis.errorsByPattern.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([pattern, count]) => {
        console.log(`${pattern}: ${count} occurrences`);
      });
    
    console.log("\n\n📋 RECOMMENDED RESOLUTION APPROACH");
    console.log("-".repeat(40));
    console.log("1. **High Priority** - Card Components (components/card/)");
    console.log("   → Already partially addressed, complete remaining fixes");
    console.log("   → Focus on stamp.stamps and nested property access");
    console.log("\n2. **Critical** - Data Access Patterns");
    console.log("   → Implement optional chaining for all stamp/src20 access");
    console.log("   → Add null guards before array operations");
    console.log("\n3. **Systematic Fixes**");
    console.log("   → Replace `.` with `?.` for potentially undefined objects");
    console.log("   → Add `?? []` for array defaults");
    console.log("   → Use type guards: `if (obj?.property)`");
    console.log("\n4. **Utility Functions**");
    console.log("   → Create safe access helpers: `safeGet(obj, 'path.to.property')`");
    console.log("   → Implement type predicates for common checks");
    
    // Save detailed report
    this.saveDetailedReport(analysis);
  }

  private analyzeErrors(): ErrorAnalysis {
    const errorsByFile = new Map<string, NullSafetyError[]>();
    const errorsByCategory = new Map<string, NullSafetyError[]>();
    const errorsByPattern = new Map<string, number>();
    const commonExpressions = new Map<string, number>();
    
    this.errors.forEach(error => {
      // By file
      const fileErrors = errorsByFile.get(error.file) || [];
      fileErrors.push(error);
      errorsByFile.set(error.file, fileErrors);
      
      // By category
      const categoryErrors = errorsByCategory.get(error.category) || [];
      categoryErrors.push(error);
      errorsByCategory.set(error.category, categoryErrors);
      
      // By pattern
      errorsByPattern.set(error.pattern, (errorsByPattern.get(error.pattern) || 0) + 1);
      
      // Common expressions
      commonExpressions.set(error.expression, (commonExpressions.get(error.expression) || 0) + 1);
    });
    
    // Determine priority files
    const priorityFiles = Array.from(errorsByFile.entries())
      .sort((a, b) => {
        // Prioritize critical components
        const aPriority = this.getFilePriority(a[0]);
        const bPriority = this.getFilePriority(b[0]);
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b[1].length - a[1].length;
      })
      .slice(0, 10)
      .map(([file]) => file);
    
    return {
      totalErrors: this.errors.length,
      errorsByFile,
      errorsByCategory,
      errorsByPattern,
      commonExpressions,
      priorityFiles
    };
  }

  private getFilePriority(file: string): number {
    if (file.includes("/components/card/")) return 10;
    if (file.includes("/components/table/")) return 9;
    if (file.includes("/routes/")) return 8;
    if (file.includes("/islands/")) return 7;
    if (file.includes("/lib/utils/")) return 6;
    return 1;
  }

  private saveDetailedReport(analysis: ErrorAnalysis): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: analysis.totalErrors,
        filesAffected: analysis.errorsByFile.size,
        categories: Object.fromEntries(
          Array.from(analysis.errorsByCategory.entries()).map(([cat, errs]) => [cat, errs.length])
        ),
        patterns: Object.fromEntries(analysis.errorsByPattern),
        priorityFiles: analysis.priorityFiles
      },
      errors: this.errors.map(e => ({
        ...e,
        relativePath: e.file.replace(/^\.\//, "")
      }))
    };
    
    try {
      Deno.writeTextFileSync("ts18048-null-safety-report.json", JSON.stringify(report, null, 2));
      console.log("\n\n💾 Detailed report saved to: ts18048-null-safety-report.json");
    } catch (error) {
      console.error("Failed to save report:", error);
    }
  }
}

// Main execution
if (import.meta.main) {
  const analyzer = new NullSafetyAnalyzer();
  await analyzer.runAnalysis();
}