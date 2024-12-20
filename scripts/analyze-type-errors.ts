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
 * Parse "TSxxxx [ERROR]: ..." or "error TSxxxx:" or "error[...]:" lines, etc.
 * Also parse lines prefixed by "at file://" to extract file and line numbers.
 * If your output doesn't match one of these patterns, tweak the regexes below.
 */
async function getTypeErrors(): Promise<TypeError[]> {
  console.log("Running 'deno task check:types' and capturing output...");

  // Use Deno.Command to run and capture the output from your "check:types" script.
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

  // We’ll hold partial info in currentError until we see the next error boundary
  let currentError: Partial<TypeError> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    // This pattern matches:
    //   "TS18046 [ERROR]: ..."
    //   "error TS18046:"
    //   "error[ts18046]:"
    //   "error:"
    const errorMatch = trimmedLine.match(
      /(?:TS\d+\s*\[ERROR\]:)|(?:error\s*TS\d+:)|(?:error\[.*?\]:)|(?:error:)/i,
    );

    if (errorMatch) {
      // If we had a partially accumulated error, store it
      if (currentError.file && currentError.message) {
        errors.push(currentError as TypeError);
      }
      // Start a new error with a default category
      let category = "type-error";

      // Attempt to capture TS code from line (like TS18046)
      const tsCodeMatch = trimmedLine.match(/TS(\d+)\s*\[ERROR\]/i) ||
        trimmedLine.match(/TS(\d+):/i);
      if (tsCodeMatch) {
        category = `TS${tsCodeMatch[1]}`;
      }

      // The message is everything after the colon, if we want a rough read
      const errorMsgParts = trimmedLine.split(":").slice(1);
      currentError = {
        category,
        message: errorMsgParts.join(":").trim() || "",
      };
      continue;
    }

    // Match file references in the “at file:///…:line:col” lines
    // Example: at file:///home/ubuntu/BTCStampsExplorer/server/services/xcpService.ts:1607:11
    const fileMatch = trimmedLine.match(
      /at (file:\/\/\/.*?\.(?:ts|tsx)):(\d+):(\d+)/,
    );
    if (fileMatch) {
      currentError.file = fileMatch[1];
      currentError.line = parseInt(fileMatch[2]);
      continue;
    }

    // If the line contains more text and we haven't assigned a message yet,
    // we can use it to expand on the current error message
    if (currentError.category && trimmedLine.length) {
      currentError.message = (currentError.message ?? "") + " " + trimmedLine;
    }
  }

  // Finally, push any leftover partial error if it’s populated
  if (currentError.file && currentError.message) {
    errors.push(currentError as TypeError);
  }

  return errors;
}

function categorizeErrors(errors: TypeError[]): Record<string, TypeError[]> {
  const categories: Record<string, TypeError[]> = {};
  for (const err of errors) {
    if (!categories[err.category]) {
      categories[err.category] = [];
    }
    categories[err.category].push(err);
  }

  // Sort categories by descending number of errors
  const sortedCategories: Record<string, TypeError[]> = {};
  Object.entries(categories)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([categoryKey, categoryErrors]) => {
      sortedCategories[categoryKey] = categoryErrors;
    });

  return sortedCategories;
}

function generateReport(categories: Record<string, TypeError[]>): string {
  let report = "🔎 **# TypeScript Error Analysis Report**\n\n";

  const totalErrors = Object.values(categories)
    .reduce((sum, errs) => sum + errs.length, 0);

  report += "## Summary\n\n";
  report += `🚨 **Total number of errors:** ${totalErrors}\n\n`;

  report += "## Error Categories\n\n";
  for (const [category, errs] of Object.entries(categories)) {
    // Show an emoji next to each category
    let categoryEmoji = "❓";
    // Some fun examples:
    //   TS2339 might be a property related error -> "🏷️"
    //   TS2304 might be a not found error -> "🔍"
    //   TS7005 or TS7006 might be param error -> "🔧"
    // Feel free to add more if/else mappings or a dictionary
    if (/TS2339/.test(category)) categoryEmoji = "🏷️";
    if (/TS2304/.test(category)) categoryEmoji = "🔍";
    if (/TS7005|TS7006/.test(category)) categoryEmoji = "🔧";

    report += `### ${categoryEmoji} ${category} (${errs.length} errors)\n\n`;

    // Group by file
    const fileMap: Record<string, TypeError[]> = {};
    for (const err of errs) {
      if (!fileMap[err.file]) {
        fileMap[err.file] = [];
      }
      fileMap[err.file].push(err);
    }

    // Sort files by descending # of errors
    const sortedFiles = Object.entries(fileMap).sort(([, a], [, b]) =>
      b.length - a.length
    );

    for (const [file, fileErrors] of sortedFiles) {
      report += `#### 📁 ${file} (${fileErrors.length} errors)\n\n`;
      for (const error of fileErrors.sort((a, b) => a.line - b.line)) {
        // Include a colored bullet (like a red circle) for each error
        report += `- 🔴 **Line ${error.line}**: ${error.message}\n`;
      }
      report += "\n";
    }
  }

  report += "## Recommendations\n\n";
  // Styled with bullets and an emoji
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
      // Add an arrow bullet and a warning triangle
      report += `- 🔸 **${file}**: ${count} errors\n`;
    });

  return report;
}

async function main() {
  console.log("Analyzing type errors...");

  try {
    await Deno.mkdir("reports", { recursive: true });
    const errors = await getTypeErrors();
    const categories = categorizeErrors(errors);
    const report = generateReport(categories);

    await Deno.writeTextFile("reports/type-errors-report.md", report);
    console.log(
      `Analysis complete! Found ${errors.length} errors. Check reports/type-errors-report.md for details.`,
    );
  } catch (error) {
    console.error("Error during analysis:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
