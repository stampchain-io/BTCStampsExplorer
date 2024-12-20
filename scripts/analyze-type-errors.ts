#!/usr/bin/env -S deno run --allow-run --allow-write

interface TypeError {
  file: string;
  line: number;
  message: string;
  category: string;
}

function stripColorCodes(text: string): string {
  // Matches ANSI escape sequences like \x1b[...m
  return text.replaceAll(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Run the "check:types" task and parse any discovered TypeScript errors.
 */
async function getTypeErrors(): Promise<TypeError[]> {
  console.log("Running 'deno task check:types' and capturing output...");

  const process = new Deno.Command("deno", {
    args: ["task", "check:types"],
    stderr: "piped",
    stdout: "piped",
  });

  const { stderr, stdout } = await process.output();
  let mergedOutput = new TextDecoder().decode(stderr) +
    new TextDecoder().decode(stdout);

  // Strip ANSI color sequences globally so your regex matches cleanly
  mergedOutput = stripColorCodes(mergedOutput);

  // Debug: log the entire raw output (without colors) to see what's being parsed
  console.log("Raw check:types output (color-stripped):\n", mergedOutput);

  const lines = mergedOutput.split("\n");
  const errors: TypeError[] = [];

  let currentError: Partial<TypeError> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    // This pattern matches lines like "TS18046 [ERROR]: ..." or "error TS18046:", etc.
    const errorMatch = trimmedLine.match(
      /(?:TS\d+\s*\[ERROR\]:)|(?:error\s*TS\d+:)|(?:error\[.*?\]:)|(?:error:)/i,
    );

    if (errorMatch) {
      // If we had a partially accumulated error, store it
      if (currentError.file && currentError.message) {
        errors.push(currentError as TypeError);
      }
      let category = "type-error";

      // Attempt to capture TS code
      const tsCodeMatch = trimmedLine.match(/TS(\d+)\s*\[ERROR\]/i) ||
        trimmedLine.match(/TS(\d+):/i);
      if (tsCodeMatch) {
        category = `TS${tsCodeMatch[1]}`;
      }

      const errorMsgParts = trimmedLine.split(":").slice(1);
      currentError = {
        category,
        message: errorMsgParts.join(":").trim() || "",
      };
      continue;
    }

    // Match file references in lines like “at file:///…:line:column”
    const fileMatch = trimmedLine.match(
      /at (file:\/\/\/.*?\.(?:ts|tsx)):(\d+):(\d+)/,
    );
    if (fileMatch) {
      currentError.file = fileMatch[1];
      currentError.line = parseInt(fileMatch[2]);
      continue;
    }

    // If line has more text, append to the current error message
    if (currentError.category && trimmedLine.length) {
      currentError.message = (currentError.message ?? "") + " " + trimmedLine;
    }
  }

  // Push any leftover error
  if (currentError.file && currentError.message) {
    errors.push(currentError as TypeError);
  }

  return errors;
}

function categorizeErrors(errors: TypeError[]): Record<string, TypeError[]> {
  const categories: Record<string, TypeError[]> = {};
  for (const err of errors) {
    categories[err.category] ||= [];
    categories[err.category].push(err);
  }

  // Sort categories by descending number of errors
  const sortedCategories: Record<string, TypeError[]> = {};
  Object.entries(categories)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([key, value]) => {
      sortedCategories[key] = value;
    });

  return sortedCategories;
}

/**
 * Generate a Markdown-based error report that's more human-friendly.
 */
function generateMarkdownReport(
  categories: Record<string, TypeError[]>,
): string {
  let report = "🔎 **# TypeScript Error Analysis Report**\n\n";

  const totalErrors = Object.values(categories)
    .reduce((sum, errs) => sum + errs.length, 0);

  report += "## Summary\n\n";
  report += `🚨 **Total number of errors:** ${totalErrors}\n\n`;

  report += "## Error Categories\n\n";
  for (const [category, errs] of Object.entries(categories)) {
    let categoryEmoji = "❓";
    if (/TS2339/.test(category)) categoryEmoji = "🏷️";
    if (/TS2304/.test(category)) categoryEmoji = "🔍";
    if (/TS7005|TS7006/.test(category)) categoryEmoji = "🔧";

    report += `### ${categoryEmoji} ${category} (${errs.length} errors)\n\n`;

    // Group by file
    const fileMap: Record<string, TypeError[]> = {};
    for (const err of errs) {
      fileMap[err.file] ||= [];
      fileMap[err.file].push(err);
    }

    // Sort files by descending # of errors
    const sortedFiles = Object.entries(fileMap).sort(([, a], [, b]) =>
      b.length - a.length
    );

    for (const [file, fileErrors] of sortedFiles) {
      report += `#### 📁 ${file} (${fileErrors.length} errors)\n\n`;
      for (const error of fileErrors.sort((a, b) => a.line - b.line)) {
        report += `- 🔴 **Line ${error.line}**: ${error.message}\n`;
      }
      report += "\n";
    }
  }

  report += "## Recommendations\n\n";
  report += "1. ✅ **Check the most frequent error categories first**\n";
  report += "2. ✅ **Focus on files with the most errors first**\n";
  report += "3. ✅ **Look for patterns in similar errors**\n";
  report +=
    "4. ✅ **Consider using `@ts-ignore` temporarily for high-complexity issues**\n";
  report +=
    "5. ✅ **Update or add type definitions for external libraries if needed**\n\n";

  report += "## Statistics\n\n";
  report += "### Top 5 Files with Most Errors\n\n";
  const fileCounts: Record<string, number> = {};
  Object.values(categories).flat().forEach((err) => {
    fileCounts[err.file] = (fileCounts[err.file] || 0) + 1;
  });

  Object.entries(fileCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([file, count]) => {
      report += `- 🔸 **${file}**: ${count} errors\n`;
    });

  return report;
}

/**
 * Generate a machine-readable JSON report of the raw errors (no grouping).
 */
function generateJsonReport(errors: TypeError[]): string {
  return JSON.stringify(errors, null, 2);
}

async function main() {
  console.log("Analyzing type errors...");

  try {
    await Deno.mkdir("reports", { recursive: true });
    const errors = await getTypeErrors();
    const categories = categorizeErrors(errors);

    // Generate the human-readable Markdown report
    const markdownReport = generateMarkdownReport(categories);
    await Deno.writeTextFile("reports/type-errors-report.md", markdownReport);

    // Generate JSON for AI or other machine consumption
    const jsonReport = generateJsonReport(errors);
    await Deno.writeTextFile("reports/type-errors-report.json", jsonReport);

    console.log(
      `Analysis complete! Found ${errors.length} errors.
       • Check reports/type-errors-report.md for a human-readable summary.
       • Check reports/type-errors-report.json for machine-readable data.`,
    );
  } catch (error) {
    console.error("Error during analysis:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
