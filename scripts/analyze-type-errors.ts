#!/usr/bin/env -S deno run --allow-run --allow-write

/**
 * Comprehensive TypeScript error analysis for BTCStampsExplorer
 * Generates detailed reports on type errors across the project
 */

interface ErrorCategory {
  name: string;
  count: number;
  description: string;
}

interface FileError {
  file: string;
  errorCount: number;
  errors: string[];
}

interface AnalysisResult {
  totalErrors: number;
  totalFiles: number;
  errorCategories: ErrorCategory[];
  criticalFiles: FileError[];
  summary: string;
}

async function runTypeCheck(): Promise<string> {
  console.log("🔍 Running TypeScript type check...");

  try {
    const cmd = new Deno.Command("deno", {
      args: ["check", "main.ts", "dev.ts"],
      stdout: "piped",
      stderr: "piped",
    });

    const result = await cmd.output();
    const stderr = new TextDecoder().decode(result.stderr);
    const stdout = new TextDecoder().decode(result.stdout);

    return stderr + stdout;
  } catch (error) {
    console.error("❌ Failed to run type check:", error);
    return "";
  }
}

function parseTypeErrors(output: string): AnalysisResult {
  const lines = output.split("\n");
  const errorCategories = new Map<string, number>();
  const fileErrors = new Map<string, string[]>();

  let totalErrors = 0;
  let currentErrorBlock: string[] = [];
  let currentFileName = "";

  console.log("🔍 Debugging: Total lines to process:", lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for start of new error (TS#### [ERROR])
    if (line.includes("[ERROR]") && line.match(/TS\d+/)) {
      // Process previous error block if exists
      if (currentErrorBlock.length > 0 && currentFileName) {
        if (!fileErrors.has(currentFileName)) {
          fileErrors.set(currentFileName, []);
        }
        fileErrors.get(currentFileName)!.push(...currentErrorBlock);
        console.log("🔍 Added error block to file:", currentFileName);
      }

      // Start new error block
      currentErrorBlock = [line];
      currentFileName = "";
      totalErrors++;

      // Categorize error based on TypeScript error code
      if (line.includes("TS2339")) {
        errorCategories.set(
          "MISSING_PROPERTY",
          (errorCategories.get("MISSING_PROPERTY") || 0) + 1,
        );
      } else if (line.includes("TS7006")) {
        errorCategories.set(
          "IMPLICIT_ANY",
          (errorCategories.get("IMPLICIT_ANY") || 0) + 1,
        );
      } else if (line.includes("TS2345")) {
        errorCategories.set(
          "TYPE_MISMATCH",
          (errorCategories.get("TYPE_MISMATCH") || 0) + 1,
        );
      } else if (line.includes("TS2322")) {
        errorCategories.set(
          "ASSIGNMENT_ERROR",
          (errorCategories.get("ASSIGNMENT_ERROR") || 0) + 1,
        );
      } else if (line.includes("TS2375")) {
        errorCategories.set(
          "ASSIGNMENT_ERROR",
          (errorCategories.get("ASSIGNMENT_ERROR") || 0) + 1,
        );
      } else if (line.includes("TS2304")) {
        errorCategories.set(
          "UNDEFINED_NAME",
          (errorCategories.get("UNDEFINED_NAME") || 0) + 1,
        );
      } else {
        errorCategories.set("OTHER", (errorCategories.get("OTHER") || 0) + 1);
      }
    } else if (currentErrorBlock.length > 0) {
      // Add line to current error block
      currentErrorBlock.push(line);

      // Check if this line contains the file path - look for lines starting with whitespace and "at file://"
      if (line.trim().startsWith("at file://")) {
        console.log("🔍 Found file path line:", line.trim());
        // Extract the file path after the base directory
        const fileMatch = line.match(
          /at file:\/\/.*\/BTCStampsExplorer\/(.+):(\d+):(\d+)/,
        );
        if (fileMatch) {
          currentFileName = fileMatch[1];
          console.log("🔍 Extracted file name:", currentFileName);
        } else {
          console.log("🔍 File path regex did not match");
        }
      }
    }
  }

  // Process final error block
  if (currentErrorBlock.length > 0 && currentFileName) {
    if (!fileErrors.has(currentFileName)) {
      fileErrors.set(currentFileName, []);
    }
    fileErrors.get(currentFileName)!.push(...currentErrorBlock);
    console.log("🔍 Added final error block to file:", currentFileName);
  }

  console.log("🔍 Total files with errors:", fileErrors.size);
  console.log("🔍 Files found:", Array.from(fileErrors.keys()).slice(0, 5));

  // Convert to sorted arrays
  const sortedCategories: ErrorCategory[] = Array.from(
    errorCategories.entries(),
  )
    .map(([name, count]) => ({
      name,
      count,
      description: getErrorDescription(name),
    }))
    .sort((a, b) => b.count - a.count);

  const sortedFiles: FileError[] = Array.from(fileErrors.entries())
    .map(([file, errors]) => ({
      file,
      errorCount: errors.length,
      errors,
    }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 20); // Top 20 files

  return {
    totalErrors,
    totalFiles: fileErrors.size,
    errorCategories: sortedCategories,
    criticalFiles: sortedFiles,
    summary: generateSummary(totalErrors, fileErrors.size, sortedCategories),
  };
}

function getErrorDescription(errorType: string): string {
  const descriptions: Record<string, string> = {
    "MISSING_PROPERTY": "Property does not exist on type",
    "IMPLICIT_ANY": "Parameter implicitly has an any type",
    "TYPE_MISMATCH": "Argument type mismatch",
    "ASSIGNMENT_ERROR": "Type assignment error",
    "UNDEFINED_NAME": "Cannot find name",
    "OTHER": "Other TypeScript errors",
  };

  return descriptions[errorType] || "Unknown error type";
}

function generateSummary(
  totalErrors: number,
  totalFiles: number,
  categories: ErrorCategory[],
): string {
  if (totalErrors === 0) {
    return "🎉 No TypeScript errors found! The codebase has excellent type safety.";
  }

  const topCategory = categories[0];
  const errorDensity = Math.round((totalErrors / totalFiles) * 100) / 100;

  return `📊 Found ${totalErrors} TypeScript errors across ${totalFiles} files (${errorDensity} errors per file on average). ` +
    `Top issue: ${topCategory.name} (${topCategory.count} errors, ${
      Math.round((topCategory.count / totalErrors) * 100)
    }%).`;
}

async function generateReport(analysis: AnalysisResult): Promise<void> {
  console.log("📝 Generating type analysis report...");

  // Ensure reports directory exists
  try {
    await Deno.mkdir("reports", { recursive: true });
  } catch (error) {
    // Directory might already exist
    console.log("📁 Reports directory ready");
  }

  const report = `# TypeScript Error Analysis Report
Generated: ${new Date().toISOString()}

## Summary
${analysis.summary}

**Total Errors**: ${analysis.totalErrors}  
**Files with Errors**: ${analysis.totalFiles}  
**Average Errors per File**: ${
    Math.round((analysis.totalErrors / (analysis.totalFiles || 1)) * 100) / 100
  }

## Error Categories

| Category | Count | Percentage | Description |
|----------|-------|------------|-------------|
${
    analysis.errorCategories.map((cat) =>
      `| ${cat.name} | ${cat.count} | ${
        Math.round((cat.count / analysis.totalErrors) * 100)
      }% | ${cat.description} |`
    ).join("\n")
  }

## Critical Files (Top 20)

| File | Error Count | Impact |
|------|-------------|---------|
${
    analysis.criticalFiles.map((file) => {
      const impact = file.errorCount > 20
        ? "🔥 Critical"
        : file.errorCount > 10
        ? "⚠️ High"
        : file.errorCount > 5
        ? "💡 Medium"
        : "📝 Low";
      return `| ${file.file} | ${file.errorCount} | ${impact} |`;
    }).join("\n")
  }

## Recommendations

### Immediate Actions (High Impact)
1. **Focus on IMPLICIT_ANY errors** - Add explicit type annotations
2. **Fix MISSING_PROPERTY errors** - Often indicates outdated interfaces
3. **Address files with 10+ errors** - These need the most attention

### Gradual Improvement Strategy
1. **File-by-File Approach**: Use \`deno check <file>\` to fix individual files
2. **Error Type Focus**: Start with the most common error category (${
    analysis.errorCategories[0]?.name || "N/A"
  })
3. **Critical Path Priority**: Focus on server/, lib/, and routes/ directories first

### Tools Available
- \`deno task check:types\` - Check main entry points
- \`deno task check:types:staged\` - Check only staged files
- \`deno check <file>\` - Check individual files

## Progress Tracking
- **Current Status**: ${analysis.totalErrors} errors
- **Target Goal**: Reduce by 10% per month
- **Next Milestone**: ${
    Math.max(0, analysis.totalErrors - Math.ceil(analysis.totalErrors * 0.1))
  } errors

---
*This report is generated automatically by \`deno task analyze:types\`*
`;

  await Deno.writeTextFile("reports/type-error-analysis.md", report);
  console.log("✅ Report saved to reports/type-error-analysis.md");
}

async function main() {
  console.log("🚀 Starting TypeScript error analysis...");

  const typeCheckOutput = await runTypeCheck();

  if (!typeCheckOutput.trim()) {
    console.log("🎉 No TypeScript errors found!");

    // Still generate a report for successful case
    const analysis: AnalysisResult = {
      totalErrors: 0,
      totalFiles: 0,
      errorCategories: [],
      criticalFiles: [],
      summary:
        "🎉 No TypeScript errors found! The codebase has excellent type safety.",
    };

    await generateReport(analysis);
    return;
  }

  console.log("📊 Analyzing error patterns...");
  const analysis = parseTypeErrors(typeCheckOutput);

  console.log(`\n📈 Analysis Complete:`);
  console.log(`   Total Errors: ${analysis.totalErrors}`);
  console.log(`   Files Affected: ${analysis.totalFiles}`);
  console.log(
    `   Top Error Type: ${analysis.errorCategories[0]?.name || "N/A"} (${
      analysis.errorCategories[0]?.count || 0
    } errors)`,
  );

  await generateReport(analysis);

  console.log("\n💡 Next Steps:");
  console.log(
    "   1. Review the generated report: reports/type-error-analysis.md",
  );
  console.log("   2. Focus on the top error categories");
  console.log("   3. Use 'deno check <file>' to fix individual files");
  console.log("   4. Track progress with regular runs of this analysis");
}

if (import.meta.main) {
  await main();
}
