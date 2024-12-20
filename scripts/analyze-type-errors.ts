#!/usr/bin/env -S deno run --allow-run --allow-write

interface TypeError {
  file: string;
  line: number;
  message: string;
  category: string;
}

async function getTypeErrors(): Promise<TypeError[]> {
  const process = new Deno.Command("deno", {
    args: ["task", "check:types"],
    stderr: "piped",
  });

  const { stderr } = await process.output();
  const output = new TextDecoder().decode(stderr);
  const errors: TypeError[] = [];

  // Parse the error output
  const lines = output.split("\n");
  for (const line of lines) {
    if (line.includes("error[")) {
      const match = line.match(/error\[(.*?)\]/);
      if (match) {
        const category = match[1];
        const fileMatch = line.match(/-->\s+(.*?):/);
        const lineMatch = line.match(/:(\d+):/);
        const messageMatch = line.match(/:\s+(.+)$/);

        if (fileMatch && lineMatch && messageMatch) {
          errors.push({
            file: fileMatch[1],
            line: parseInt(lineMatch[1]),
            message: messageMatch[1].trim(),
            category: category,
          });
        }
      }
    }
  }

  return errors;
}

function categorizeErrors(errors: TypeError[]): Record<string, TypeError[]> {
  const categories: Record<string, TypeError[]> = {};

  for (const error of errors) {
    if (!categories[error.category]) {
      categories[error.category] = [];
    }
    categories[error.category].push(error);
  }

  return categories;
}

function generateReport(categories: Record<string, TypeError[]>): string {
  let report = "# TypeScript Error Analysis Report\n\n";

  // Summary
  report += "## Summary\n\n";
  report += "Total number of errors: " + Object.values(categories)
    .reduce((sum, errors) => sum + errors.length, 0) +
    "\n\n";

  // Categories breakdown
  report += "## Error Categories\n\n";
  for (const [category, errors] of Object.entries(categories)) {
    report += `### ${category} (${errors.length} errors)\n\n`;

    // Group by file
    const fileGroups: Record<string, TypeError[]> = {};
    for (const error of errors) {
      if (!fileGroups[error.file]) {
        fileGroups[error.file] = [];
      }
      fileGroups[error.file].push(error);
    }

    // List errors by file
    for (const [file, fileErrors] of Object.entries(fileGroups)) {
      report += `#### ${file} (${fileErrors.length} errors)\n\n`;
      for (const error of fileErrors) {
        report += `- Line ${error.line}: ${error.message}\n`;
      }
      report += "\n";
    }
  }

  // Recommendations
  report += "## Recommendations\n\n";
  report += "1. Start with the most frequent error categories\n";
  report += "2. Focus on files with the most errors first\n";
  report += "3. Look for patterns in similar errors\n";
  report += "4. Consider using `@ts-ignore` temporarily for complex cases\n";
  report += "5. Update type definitions for external libraries if needed\n";

  return report;
}

async function main() {
  console.log("Analyzing type errors...");

  const errors = await getTypeErrors();
  const categories = categorizeErrors(errors);
  const report = generateReport(categories);

  // Save report to file
  await Deno.writeTextFile("./reports/type-errors-report.md", report);

  console.log(
    "Analysis complete! Check ./reports/type-errors-report.md for details.",
  );
}

if (import.meta.main) {
  main();
}
