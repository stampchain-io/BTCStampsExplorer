#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * SSR Safety Validation Script
 * Scans codebase for SSR unsafe navigation patterns
 * Designed for CI/CD integration and pre-commit hooks
 */

import { existsSync } from "@std/fs";
import { join, relative } from "@std/path";

interface SSRIssue {
  file: string;
  line: number;
  pattern: string;
  severity: "critical" | "medium" | "low";
  description: string;
  suggestion: string;
}

interface ValidationResult {
  totalFiles: number;
  issuesFound: number;
  critical: number;
  medium: number;
  low: number;
  issues: SSRIssue[];
}

const UNSAFE_PATTERNS = [
  {
    pattern: /globalThis\.location\.href\s*=/,
    severity: "critical" as const,
    description: "Unsafe globalThis.location.href assignment",
    suggestion: "Add browser check: if (typeof globalThis === 'undefined' || !globalThis?.location) return;",
  },
  {
    pattern: /window\.location\.href\s*=/,
    severity: "critical" as const,
    description: "Unsafe window.location.href assignment",
    suggestion: "Add browser check: if (typeof window === 'undefined' || !window?.location) return;",
  },
  {
    pattern: /location\.href\s*=/,
    severity: "critical" as const,
    description: "Unsafe location.href assignment",
    suggestion: "Add browser check: if (typeof globalThis === 'undefined' || !globalThis?.location) return;",
  },
  {
    pattern: /location\.assign\s*\(/,
    severity: "critical" as const,
    description: "Unsafe location.assign() call",
    suggestion: "Add browser check before location.assign()",
  },
  {
    pattern: /location\.replace\s*\(/,
    severity: "critical" as const,
    description: "Unsafe location.replace() call",
    suggestion: "Add browser check before location.replace()",
  },
  {
    pattern: /onClick=\{.*e\.preventDefault\(\).*globalThis\.location\.href/,
    severity: "medium" as const,
    description: "Anchor tag with onClick handler preventing default navigation",
    suggestion: "Remove onClick handler and use href attribute for proper Fresh.js navigation",
  },
  {
    pattern: /onClick=\{.*e\.preventDefault\(\).*window\.location\.href/,
    severity: "medium" as const,
    description: "Anchor tag with onClick handler preventing default navigation",
    suggestion: "Remove onClick handler and use href attribute for proper Fresh.js navigation",
  },
];

const SAFE_PATTERNS = [
  /typeof globalThis === ['""]undefined['""]/,
  /typeof window === ['""]undefined['""]/,
  /!globalThis\?\./,
  /!window\?\./,
  /!globalThis\s*\|\|\s*!globalThis\.location/,
  /!window\s*\|\|\s*!window\.location/,
  /globalThis === ['""]undefined['""]/,
  /window === ['""]undefined['""]/,
  /isBrowser\(\)/,
  /if\s*\(\s*!isBrowser\(\)\s*\)/,
];

const DIRECTORIES_TO_SCAN = [
  "islands",
  "components",
  "routes",
  "lib",
  "client",
  "hooks",
];

const FILE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function getProjectRoot(): string {
  // Navigate up from scripts directory to project root
  const scriptDir = new URL(".", import.meta.url).pathname;
  return join(scriptDir, "..");
}

function shouldScanFile(filePath: string): boolean {
  const ext = filePath.substring(filePath.lastIndexOf("."));
  return FILE_EXTENSIONS.includes(ext);
}

function isInScanDirectory(filePath: string, projectRoot: string): boolean {
  const relativePath = relative(projectRoot, filePath);
  return DIRECTORIES_TO_SCAN.some(dir => relativePath.startsWith(dir));
}

function hasSafetyCheck(code: string, lineNumber: number): boolean {
  const lines = code.split("\n");
  const contextLines = 50; // Check 50 lines before and after

  const startLine = Math.max(0, lineNumber - contextLines);
  const endLine = Math.min(lines.length, lineNumber + contextLines);

  const contextCode = lines.slice(startLine, endLine).join("\n");

  // Check for safety patterns
  if (SAFE_PATTERNS.some(pattern => pattern.test(contextCode))) {
    return true;
  }

  // Look for function-level safety checks by finding the function start
  const functionStart = findFunctionStart(lines, lineNumber);
  if (functionStart !== -1) {
    const functionCode = lines.slice(functionStart, lineNumber + 5).join("\n");
    if (SAFE_PATTERNS.some(pattern => pattern.test(functionCode))) {
      return true;
    }
  }

  return false;
}

function findFunctionStart(lines: string[], lineNumber: number): number {
  // Look backwards for function declaration
  for (let i = lineNumber; i >= Math.max(0, lineNumber - 100); i--) {
    const line = lines[i];
    if (line.includes("function") || line.includes("=>") || line.includes("= (")) {
      return i;
    }
  }
  return -1;
}

async function scanFile(filePath: string): Promise<SSRIssue[]> {
  const issues: SSRIssue[] = [];

  try {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const unsafePattern of UNSAFE_PATTERNS) {
        if (unsafePattern.pattern.test(line)) {
          // Check if there's a safety check nearby
          if (!hasSafetyCheck(content, i)) {
            issues.push({
              file: filePath,
              line: i + 1,
              pattern: unsafePattern.pattern.toString(),
              severity: unsafePattern.severity,
              description: unsafePattern.description,
              suggestion: unsafePattern.suggestion,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
  }

  return issues;
}

async function scanDirectory(dirPath: string): Promise<SSRIssue[]> {
  const issues: SSRIssue[] = [];

  try {
    for await (const entry of Deno.readDir(dirPath)) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory && !entry.name.startsWith(".")) {
        const subIssues = await scanDirectory(fullPath);
        issues.push(...subIssues);
      } else if (entry.isFile && shouldScanFile(fullPath)) {
        const fileIssues = await scanFile(fullPath);
        issues.push(...fileIssues);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return issues;
}

async function validateSSRSafety(silent = false): Promise<ValidationResult> {
  const projectRoot = getProjectRoot();
  const allIssues: SSRIssue[] = [];
  let totalFiles = 0;

  if (!silent) {
    console.log("🔍 Scanning for SSR safety issues...");
  }

  for (const directory of DIRECTORIES_TO_SCAN) {
    const dirPath = join(projectRoot, directory);

    if (existsSync(dirPath)) {
      if (!silent) {
        console.log(`📁 Scanning ${directory}/`);
      }
      const issues = await scanDirectory(dirPath);
      allIssues.push(...issues);

      // Count files in this directory
      for await (const entry of Deno.readDir(dirPath)) {
        if (entry.isFile && shouldScanFile(entry.name)) {
          totalFiles++;
        }
      }
    } else {
      if (!silent) {
        console.log(`⚠️  Directory ${directory}/ not found, skipping`);
      }
    }
  }

  const critical = allIssues.filter(issue => issue.severity === "critical").length;
  const medium = allIssues.filter(issue => issue.severity === "medium").length;
  const low = allIssues.filter(issue => issue.severity === "low").length;

  return {
    totalFiles,
    issuesFound: allIssues.length,
    critical,
    medium,
    low,
    issues: allIssues,
  };
}

function printResults(result: ValidationResult): void {
  console.log("\n" + "=".repeat(60));
  console.log("🛡️  SSR Safety Validation Report");
  console.log("=".repeat(60));

  console.log(`📊 Files scanned: ${result.totalFiles}`);
  console.log(`🔍 Issues found: ${result.issuesFound}`);
  console.log(`🚨 Critical: ${result.critical}`);
  console.log(`⚠️  Medium: ${result.medium}`);
  console.log(`ℹ️  Low: ${result.low}`);

  if (result.issues.length === 0) {
    console.log("\n✅ No SSR safety issues found! All navigation patterns are safe.");
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("🚨 Issues Found:");
  console.log("=".repeat(60));

  // Group issues by severity
  const groupedIssues = {
    critical: result.issues.filter(issue => issue.severity === "critical"),
    medium: result.issues.filter(issue => issue.severity === "medium"),
    low: result.issues.filter(issue => issue.severity === "low"),
  };

  for (const [severity, issues] of Object.entries(groupedIssues)) {
    if (issues.length === 0) continue;

    const icon = severity === "critical" ? "🚨" : severity === "medium" ? "⚠️" : "ℹ️";
    console.log(`\n${icon} ${severity.toUpperCase()} Issues (${issues.length}):`);

    for (const issue of issues) {
      console.log(`\n  📄 ${issue.file}:${issue.line}`);
      console.log(`     ${issue.description}`);
      console.log(`     💡 ${issue.suggestion}`);
    }
  }
}

async function main(): Promise<void> {
  const args = Deno.args;
  const isCI = args.includes("--ci");
  const exitOnError = args.includes("--fail-on-error");

  try {
    const result = await validateSSRSafety(isCI);

    if (!isCI) {
      printResults(result);
    } else {
      // CI-friendly output
      console.log(JSON.stringify(result, null, 2));
    }

    if (exitOnError && result.critical > 0) {
      console.error("\n❌ Critical SSR safety issues found. Exiting with error code 1.");
      Deno.exit(1);
    }

    if (result.issues.length > 0 && !isCI) {
      console.log("\n🔧 Run with suggestions to fix these issues automatically.");
      console.log("   deno run --allow-read --allow-write scripts/validate-ssr-safety.ts --fix");
    }

  } catch (error) {
    console.error("Error during validation:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
