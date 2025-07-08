#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Helper script for fixing IMPLICIT_ANY TypeScript errors
 * Usage: deno run --allow-read --allow-write --allow-run scripts/fix-implicit-any.ts
 */

import { execSync } from "node:child_process";

interface ImplicitAnyError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

async function getImplicitAnyErrors(): Promise<ImplicitAnyError[]> {
  console.log("🔍 Analyzing IMPLICIT_ANY errors...");

  try {
    // Run TypeScript check and capture output
    const output = execSync(
      "deno check --unstable-byonm **/*.ts **/*.tsx 2>&1",
      {
        encoding: "utf8",
      },
    );

    const errors: ImplicitAnyError[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      // Match TypeScript error format: file:line:column - TS7006 or TS7053
      const match = line.match(
        /^(.+):(\d+):(\d+)\s*-\s*(TS70(?:06|53)):\s*(.+)$/,
      );
      if (match) {
        const [, file, lineNum, column, code, message] = match;
        if (code === "TS7006" || code === "TS7053") { // IMPLICIT_ANY error codes
          errors.push({
            file: file.replace(Deno.cwd() + "/", ""),
            line: parseInt(lineNum),
            column: parseInt(column),
            message,
            code,
          });
        }
      }
    }

    return errors;
  } catch (error) {
    console.error("Error running TypeScript check:", error);
    return [];
  }
}

function groupErrorsByFile(
  errors: ImplicitAnyError[],
): Map<string, ImplicitAnyError[]> {
  const grouped = new Map<string, ImplicitAnyError[]>();

  for (const error of errors) {
    if (!grouped.has(error.file)) {
      grouped.set(error.file, []);
    }
    grouped.get(error.file)!.push(error);
  }

  return grouped;
}

async function main() {
  console.log("🎯 IMPLICIT_ANY Error Fixing Helper");
  console.log("=====================================");

  const errors = await getImplicitAnyErrors();

  if (errors.length === 0) {
    console.log("🎉 No IMPLICIT_ANY errors found!");
    return;
  }

  console.log(`📊 Found ${errors.length} IMPLICIT_ANY errors`);

  const groupedErrors = groupErrorsByFile(errors);
  const sortedFiles = Array.from(groupedErrors.entries())
    .sort(([, a], [, b]) => b.length - a.length);

  console.log("\n📁 Files with IMPLICIT_ANY errors (sorted by count):");
  console.log("================================================");

  for (const [file, fileErrors] of sortedFiles) {
    console.log(`\n${file} (${fileErrors.length} errors):`);
    for (const error of fileErrors) {
      console.log(
        `  Line ${error.line}:${error.column} - ${error.code}: ${error.message}`,
      );
    }
  }

  console.log("\n🔧 Suggested fix order:");
  console.log("======================");
  for (let i = 0; i < Math.min(5, sortedFiles.length); i++) {
    const [file, fileErrors] = sortedFiles[i];
    console.log(`${i + 1}. ${file} (${fileErrors.length} errors)`);
  }

  console.log("\n💡 Quick commands:");
  console.log("==================");
  console.log("# Check specific file:");
  if (sortedFiles.length > 0) {
    console.log(`deno check ${sortedFiles[0][0]}`);
  }
  console.log("\n# Check all files:");
  console.log("deno task analyze:types:v2");
  console.log("\n# Check linting:");
  console.log("deno task check:lint");

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalErrors: errors.length,
    files: Object.fromEntries(groupedErrors),
    priorityOrder: sortedFiles.map(([file, errors]) => ({
      file,
      count: errors.length,
    })),
  };

  await Deno.writeTextFile(
    "reports/implicit-any-errors.json",
    JSON.stringify(report, null, 2),
  );

  console.log(
    "\n📄 Detailed report saved to: reports/implicit-any-errors.json",
  );
}

if (import.meta.main) {
  main().catch(console.error);
}
