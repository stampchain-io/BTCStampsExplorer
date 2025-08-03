#!/usr/bin/env deno run --allow-run --allow-read --allow-write

import { parse } from "@std/path";

interface TS18048Error {
  file: string;
  line: number;
  column: number;
  property: string;
  objectType: string;
  fullError: string;
  category?: string;
}

interface ErrorSummary {
  totalErrors: number;
  byFile: Map<string, TS18048Error[]>;
  byCategory: Map<string, TS18048Error[]>;
  byProperty: Map<string, number>;
  priorityFiles: string[];
}

async function runTypeCheck(): Promise<string> {
  console.log("Running TypeScript compilation with strict null checking...");
  
  const command = new Deno.Command("deno", {
    args: ["check", "--config", "deno.json", "."],
    stdout: "piped",
    stderr: "piped",
  });
  
  const { stdout, stderr } = await command.output();
  
  const output = new TextDecoder().decode(stderr);
  return output;
}

function parseTS18048Errors(output: string): TS18048Error[] {
  const errors: TS18048Error[] = [];
  const lines = output.split("\n");
  
  // Pattern to match TS18048 errors
  // Example: error: TS18048 [ERROR]: 'stamp.stamps' is possibly 'undefined'.
  const errorPattern = /^error: TS18048 \[ERROR\]: '([^']+)' is possibly 'undefined'\./;
  const locationPattern = /^\s+at file:\/\/(.+):(\d+):(\d+)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const errorMatch = line.match(errorPattern);
    
    if (errorMatch) {
      const fullProperty = errorMatch[1];
      const propertyParts = fullProperty.split(".");
      const objectType = propertyParts[0];
      const property = propertyParts.slice(1).join(".");
      
      // Look for the location in the next line
      if (i + 1 < lines.length) {
        const locationMatch = lines[i + 1].match(locationPattern);
        
        if (locationMatch) {
          const error: TS18048Error = {
            file: locationMatch[1],
            line: parseInt(locationMatch[2], 10),
            column: parseInt(locationMatch[3], 10),
            property: property || objectType,
            objectType,
            fullError: line,
          };
          
          // Categorize the error
          error.category = categorizeError(error);
          errors.push(error);
        }
      }
    }
  }
  
  return errors;
}

function categorizeError(error: TS18048Error): string {
  const { file, property, objectType } = error;
  
  // Check for common patterns
  if (property.includes("stamp") || objectType.includes("stamp")) {
    return "stamp-data-access";
  }
  
  if (property.includes("src20") || objectType.includes("src20")) {
    return "src20-data-access";
  }
  
  if (property.includes("holder") || property.includes("balances")) {
    return "holder-balance-access";
  }
  
  if (file.includes("/components/card/")) {
    return "card-component";
  }
  
  if (file.includes("/components/table/")) {
    return "table-component";
  }
  
  if (file.includes("/islands/")) {
    return "island-component";
  }
  
  if (file.includes("/routes/")) {
    return "route-handler";
  }
  
  if (property.includes("length") || property.includes("map") || property.includes("filter")) {
    return "array-access";
  }
  
  if (property.includes("style") || property.includes("className")) {
    return "ui-property-access";
  }
  
  return "uncategorized";
}

function analyzePriority(errors: TS18048Error[]): string[] {
  const fileImpact = new Map<string, number>();
  
  for (const error of errors) {
    const count = fileImpact.get(error.file) || 0;
    fileImpact.set(error.file, count + 1);
  }
  
  // Sort by error count and component criticality
  const priorityFiles = Array.from(fileImpact.entries())
    .sort((a, b) => {
      // Prioritize critical components
      const aCritical = a[0].includes("/card/") || a[0].includes("/table/") || a[0].includes("/routes/");
      const bCritical = b[0].includes("/card/") || b[0].includes("/table/") || b[0].includes("/routes/");
      
      if (aCritical && !bCritical) return -1;
      if (!aCritical && bCritical) return 1;
      
      // Then by error count
      return b[1] - a[1];
    })
    .slice(0, 10)
    .map(([file]) => file);
  
  return priorityFiles;
}

function generateReport(errors: TS18048Error[]): ErrorSummary {
  const byFile = new Map<string, TS18048Error[]>();
  const byCategory = new Map<string, TS18048Error[]>();
  const byProperty = new Map<string, number>();
  
  for (const error of errors) {
    // Group by file
    const fileErrors = byFile.get(error.file) || [];
    fileErrors.push(error);
    byFile.set(error.file, fileErrors);
    
    // Group by category
    const categoryErrors = byCategory.get(error.category!) || [];
    categoryErrors.push(error);
    byCategory.set(error.category!, categoryErrors);
    
    // Count by property
    const propertyCount = byProperty.get(error.property) || 0;
    byProperty.set(error.property, propertyCount + 1);
  }
  
  return {
    totalErrors: errors.length,
    byFile,
    byCategory,
    byProperty,
    priorityFiles: analyzePriority(errors),
  };
}

function printReport(summary: ErrorSummary) {
  console.log("\n=== TS18048 NULL SAFETY ERROR ANALYSIS REPORT ===\n");
  
  console.log(`Total TS18048 Errors Found: ${summary.totalErrors}\n`);
  
  console.log("=== ERROR DISTRIBUTION BY CATEGORY ===");
  const sortedCategories = Array.from(summary.byCategory.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  for (const [category, errors] of sortedCategories) {
    console.log(`\n${category}: ${errors.length} errors`);
    console.log("-".repeat(40));
    
    // Show sample errors from this category
    const samples = errors.slice(0, 3);
    for (const error of samples) {
      const relativePath = error.file.replace(/.*\/BTCStampsExplorer\//, "");
      console.log(`  ${relativePath}:${error.line}:${error.column}`);
      console.log(`    Property: ${error.objectType}.${error.property}`);
    }
    
    if (errors.length > 3) {
      console.log(`  ... and ${errors.length - 3} more`);
    }
  }
  
  console.log("\n\n=== TOP 10 MOST AFFECTED FILES ===");
  const sortedFiles = Array.from(summary.byFile.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  for (const [file, errors] of sortedFiles) {
    const relativePath = file.replace(/.*\/BTCStampsExplorer\//, "");
    console.log(`\n${relativePath}: ${errors.length} errors`);
    
    // Group errors by property in this file
    const propertyCount = new Map<string, number>();
    for (const error of errors) {
      const key = `${error.objectType}.${error.property}`;
      propertyCount.set(key, (propertyCount.get(key) || 0) + 1);
    }
    
    const sortedProperties = Array.from(propertyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [prop, count] of sortedProperties) {
      console.log(`  - ${prop}: ${count} occurrences`);
    }
  }
  
  console.log("\n\n=== MOST COMMON PROPERTY ACCESS PATTERNS ===");
  const sortedProperties = Array.from(summary.byProperty.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  
  for (const [property, count] of sortedProperties) {
    console.log(`  ${property}: ${count} occurrences`);
  }
  
  console.log("\n\n=== PRIORITY RESOLUTION ORDER ===");
  console.log("Based on component criticality and error density:\n");
  
  for (let i = 0; i < summary.priorityFiles.length; i++) {
    const file = summary.priorityFiles[i];
    const relativePath = file.replace(/.*\/BTCStampsExplorer\//, "");
    const errors = summary.byFile.get(file)!;
    console.log(`${i + 1}. ${relativePath} (${errors.length} errors)`);
  }
  
  console.log("\n\n=== RECOMMENDED APPROACH ===");
  console.log("1. Start with card components (partially addressed in subtask 51.2)");
  console.log("2. Focus on stamp and src20 data access patterns");
  console.log("3. Implement null checks for array operations");
  console.log("4. Add proper type guards for optional properties");
  console.log("5. Use optional chaining (?.) and nullish coalescing (??)");
  console.log("6. Consider creating utility functions for safe property access");
}

async function saveDetailedReport(errors: TS18048Error[], summary: ErrorSummary) {
  const reportPath = "ts18048-error-report.json";
  const detailedReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: summary.totalErrors,
      byCategory: Object.fromEntries(
        Array.from(summary.byCategory.entries()).map(([cat, errs]) => [
          cat,
          errs.length,
        ])
      ),
      priorityFiles: summary.priorityFiles,
    },
    errors: errors.map(error => ({
      ...error,
      relativePath: error.file.replace(/.*\/BTCStampsExplorer\//, ""),
    })),
  };
  
  await Deno.writeTextFile(reportPath, JSON.stringify(detailedReport, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    const output = await runTypeCheck();
    const errors = parseTS18048Errors(output);
    
    if (errors.length === 0) {
      console.log("No TS18048 errors found!");
      return;
    }
    
    const summary = generateReport(errors);
    printReport(summary);
    await saveDetailedReport(errors, summary);
    
  } catch (error) {
    console.error("Error running analysis:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}