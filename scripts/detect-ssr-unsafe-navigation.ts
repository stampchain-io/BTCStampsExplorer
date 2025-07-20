#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * SSR Safety Detection Script
 *
 * Scans the codebase for globalThis.location.href usage without proper SSR protection
 * and identifies components at risk of "Cannot read properties of undefined" errors
 */

interface UnsafePattern {
  file: string;
  line: number;
  content: string;
  severity: "high" | "medium" | "low";
  reason: string;
  suggestion: string;
}

interface SafePattern {
  file: string;
  line: number;
  content: string;
  pattern: string;
}

interface ScanResult {
  unsafePatterns: UnsafePattern[];
  safePatterns: SafePattern[];
  fPartialUsage: { file: string; line: number; content: string; }[];
  summary: {
    totalFilesScanned: number;
    filesWithUnsafePatterns: number;
    filesWithSafePatterns: number;
    filesWithFPartial: number;
    criticalIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}

// Directories to scan
const SCAN_DIRECTORIES = [
  "islands/",
  "components/",
  "routes/",
  "lib/",
  "client/"
];

// File extensions to scan
const SCAN_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

// Patterns to detect
const UNSAFE_PATTERNS = [
  {
    regex: /globalThis\.location\.href(?!\s*(?:;|\)|,|\s*$))/g,
    severity: "high" as const,
    reason: "Direct globalThis.location.href access without SSR protection",
    suggestion: "Add browser environment check: if (typeof globalThis === 'undefined' || !globalThis?.location) { return '/'; }"
  },
  {
    regex: /globalThis\.location\.search/g,
    severity: "high" as const,
    reason: "Direct globalThis.location.search access without SSR protection",
    suggestion: "Add browser environment check before accessing globalThis.location.search"
  },
  {
    regex: /globalThis\.location\.pathname/g,
    severity: "high" as const,
    reason: "Direct globalThis.location.pathname access without SSR protection",
    suggestion: "Add browser environment check before accessing globalThis.location.pathname"
  },
  {
    regex: /window\.location\.href/g,
    severity: "medium" as const,
    reason: "Direct window.location.href access without SSR protection",
    suggestion: "Replace with globalThis.location.href and add SSR protection"
  },
  {
    regex: /new URL\(.*location\.href/g,
    severity: "medium" as const,
    reason: "URL constructor using location.href without SSR protection",
    suggestion: "Add browser environment check before creating URL from location.href"
  }
];

// Safe patterns to recognize
const SAFE_PATTERNS = [
  {
    regex: /if\s*\(\s*typeof\s+globalThis\s*===\s*['"']undefined['"']\s*\|\|\s*!globalThis\?\.location\s*\)/g,
    pattern: "Browser environment check"
  },
  {
    regex: /typeof\s+globalThis\s*!==\s*['"']undefined['"']\s*&&\s*globalThis\?\.location/g,
    pattern: "Safe globalThis check"
  },
  {
    regex: /globalThis\?\.location/g,
    pattern: "Optional chaining on globalThis.location"
  }
];

// Pattern to detect Fresh.js partial navigation
const F_PARTIAL_PATTERN = /f-partial\s*=\s*{[^}]*}/g;

async function scanFile(filePath: string): Promise<{
  unsafePatterns: UnsafePattern[];
  safePatterns: SafePattern[];
  fPartialUsage: { file: string; line: number; content: string; }[];
}> {
  const unsafePatterns: UnsafePattern[] = [];
  const safePatterns: SafePattern[] = [];
  const fPartialUsage: { file: string; line: number; content: string; }[] = [];

  try {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for unsafe patterns
      for (const pattern of UNSAFE_PATTERNS) {
        const matches = line.match(pattern.regex);
        if (matches) {
          // Check if this line has SSR protection nearby
          const hasSSRProtection = checkSSRProtection(lines, index);

          if (!hasSSRProtection) {
            unsafePatterns.push({
              file: filePath,
              line: lineNum,
              content: line.trim(),
              severity: pattern.severity,
              reason: pattern.reason,
              suggestion: pattern.suggestion
            });
          }
        }
      }

      // Check for safe patterns
      for (const pattern of SAFE_PATTERNS) {
        const matches = line.match(pattern.regex);
        if (matches) {
          safePatterns.push({
            file: filePath,
            line: lineNum,
            content: line.trim(),
            pattern: pattern.pattern
          });
        }
      }

      // Check for f-partial usage
      const fPartialMatches = line.match(F_PARTIAL_PATTERN);
      if (fPartialMatches) {
        fPartialUsage.push({
          file: filePath,
          line: lineNum,
          content: line.trim()
        });
      }
    });

  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }

  return { unsafePatterns, safePatterns, fPartialUsage };
}

function checkSSRProtection(lines: string[], currentIndex: number): boolean {
  // Check current line and 5 lines before and after for SSR protection patterns
  const start = Math.max(0, currentIndex - 5);
  const end = Math.min(lines.length, currentIndex + 5);

  for (let i = start; i < end; i++) {
    const line = lines[i];

    // Check for browser environment checks
    if (line.includes('typeof globalThis === "undefined"') ||
        line.includes('typeof globalThis === \'undefined\'') ||
        line.includes('!globalThis?.location') ||
        line.includes('typeof window === "undefined"') ||
        line.includes('typeof window === \'undefined\'')) {
      return true;
    }
  }

  return false;
}

async function getAllFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  try {
    for await (const dirEntry of Deno.readDir(directory)) {
      const fullPath = `${directory}/${dirEntry.name}`;

      if (dirEntry.isDirectory) {
        // Recursively scan subdirectories
        const subFiles = await getAllFiles(fullPath);
        files.push(...subFiles);
      } else if (dirEntry.isFile) {
        // Check if file has scannable extension
        if (SCAN_EXTENSIONS.some(ext => dirEntry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error.message);
  }

  return files;
}

async function scanCodebase(): Promise<ScanResult> {
  const result: ScanResult = {
    unsafePatterns: [],
    safePatterns: [],
    fPartialUsage: [],
    summary: {
      totalFilesScanned: 0,
      filesWithUnsafePatterns: 0,
      filesWithSafePatterns: 0,
      filesWithFPartial: 0,
      criticalIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    }
  };

  console.log("🔍 Scanning codebase for SSR-unsafe navigation patterns...\n");

  // Get all files to scan
  const allFiles: string[] = [];
  for (const directory of SCAN_DIRECTORIES) {
    const files = await getAllFiles(directory);
    allFiles.push(...files);
  }

  result.summary.totalFilesScanned = allFiles.length;

  // Scan each file
  for (const file of allFiles) {
    const { unsafePatterns, safePatterns, fPartialUsage } = await scanFile(file);

    result.unsafePatterns.push(...unsafePatterns);
    result.safePatterns.push(...safePatterns);
    result.fPartialUsage.push(...fPartialUsage);

    if (unsafePatterns.length > 0) {
      result.summary.filesWithUnsafePatterns++;
    }

    if (safePatterns.length > 0) {
      result.summary.filesWithSafePatterns++;
    }

    if (fPartialUsage.length > 0) {
      result.summary.filesWithFPartial++;
    }
  }

  // Count severity levels
  result.summary.criticalIssues = result.unsafePatterns.filter(p => p.severity === "high").length;
  result.summary.mediumIssues = result.unsafePatterns.filter(p => p.severity === "medium").length;
  result.summary.lowIssues = result.unsafePatterns.filter(p => p.severity === "low").length;

  return result;
}

function generateReport(result: ScanResult): string {
  let report = "# SSR Safety Detection Report\n\n";

  // Summary
  report += "## Summary\n\n";
  report += `- **Total Files Scanned**: ${result.summary.totalFilesScanned}\n`;
  report += `- **Files with Unsafe Patterns**: ${result.summary.filesWithUnsafePatterns}\n`;
  report += `- **Files with Safe Patterns**: ${result.summary.filesWithSafePatterns}\n`;
  report += `- **Files with f-partial**: ${result.summary.filesWithFPartial}\n`;
  report += `- **Critical Issues**: ${result.summary.criticalIssues}\n`;
  report += `- **Medium Issues**: ${result.summary.mediumIssues}\n`;
  report += `- **Low Issues**: ${result.summary.lowIssues}\n\n`;

  // Critical Issues
  if (result.summary.criticalIssues > 0) {
    report += "## 🚨 Critical Issues (High Priority)\n\n";
    result.unsafePatterns
      .filter(p => p.severity === "high")
      .forEach(pattern => {
        report += `### ${pattern.file}:${pattern.line}\n`;
        report += `**Code**: \`${pattern.content}\`\n`;
        report += `**Issue**: ${pattern.reason}\n`;
        report += `**Suggestion**: ${pattern.suggestion}\n\n`;
      });
  }

  // Medium Issues
  if (result.summary.mediumIssues > 0) {
    report += "## ⚠️ Medium Issues\n\n";
    result.unsafePatterns
      .filter(p => p.severity === "medium")
      .forEach(pattern => {
        report += `### ${pattern.file}:${pattern.line}\n`;
        report += `**Code**: \`${pattern.content}\`\n`;
        report += `**Issue**: ${pattern.reason}\n`;
        report += `**Suggestion**: ${pattern.suggestion}\n\n`;
      });
  }

  // Safe Patterns (Good Examples)
  if (result.safePatterns.length > 0) {
    report += "## ✅ Safe Patterns Found\n\n";
    const safeByFile = result.safePatterns.reduce((acc, pattern) => {
      if (!acc[pattern.file]) acc[pattern.file] = [];
      acc[pattern.file].push(pattern);
      return acc;
    }, {} as Record<string, SafePattern[]>);

    Object.entries(safeByFile).forEach(([file, patterns]) => {
      report += `### ${file}\n`;
      patterns.forEach(pattern => {
        report += `- Line ${pattern.line}: ${pattern.pattern}\n`;
      });
      report += "\n";
    });
  }

  // f-partial Usage
  if (result.fPartialUsage.length > 0) {
    report += "## 🔄 Fresh.js Partial Navigation Usage\n\n";
    const fPartialByFile = result.fPartialUsage.reduce((acc, usage) => {
      if (!acc[usage.file]) acc[usage.file] = [];
      acc[usage.file].push(usage);
      return acc;
    }, {} as Record<string, typeof result.fPartialUsage[0][]>);

    Object.entries(fPartialByFile).forEach(([file, usages]) => {
      report += `### ${file}\n`;
      usages.forEach(usage => {
        report += `- Line ${usage.line}: \`${usage.content}\`\n`;
      });
      report += "\n";
    });
  }

  return report;
}

// Main execution
async function main() {
  const result = await scanCodebase();
  const report = generateReport(result);

  // Print summary to console
  console.log("📊 Scan Results:");
  console.log(`   Total Files: ${result.summary.totalFilesScanned}`);
  console.log(`   🚨 Critical Issues: ${result.summary.criticalIssues}`);
  console.log(`   ⚠️ Medium Issues: ${result.summary.mediumIssues}`);
  console.log(`   ✅ Safe Patterns: ${result.safePatterns.length}`);
  console.log(`   🔄 f-partial Usage: ${result.fPartialUsage.length}`);

  // Save report to file
  const reportPath = "reports/ssr-safety-report.md";
  await Deno.mkdir("reports", { recursive: true });
  await Deno.writeTextFile(reportPath, report);
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Exit with error code if critical issues found
  if (result.summary.criticalIssues > 0) {
    console.log("\n🚨 Critical SSR safety issues found! Please fix before deployment.");
    Deno.exit(1);
  }

  console.log("\n✅ SSR safety scan completed successfully!");
}

if (import.meta.main) {
  main();
}
