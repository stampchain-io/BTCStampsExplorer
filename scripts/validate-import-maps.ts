#!/usr/bin/env -S deno run -A
/**
 * Comprehensive import map validation script
 * Validates that we're using import map aliases throughout the application
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, red, yellow, blue, cyan, magenta } from "https://deno.land/std@0.208.0/fmt/colors.ts";

interface ImportMapConfig {
  imports: Record<string, string>;
}

interface ValidationResult {
  totalFiles: number;
  filesWithIssues: number;
  hardcodedUrls: Array<{ file: string; line: number; url: string }>;
  missingAliases: Array<{ file: string; line: number; import: string; suggestedAlias?: string }>;
  mixedPatterns: Array<{ file: string; line: number; pattern: string }>;
  importMapMismatches: Array<{ alias: string; mainPath: string; testPath: string }>;
}

// Load and parse import map
async function loadImportMap(path: string): Promise<ImportMapConfig | null> {
  try {
    const content = await Deno.readTextFile(path);
    const config = JSON.parse(content);
    return config;
  } catch (error) {
    console.error(red(`❌ Failed to load ${path}: ${error.message}`));
    return null;
  }
}

// Check for hardcoded deno.land URLs
function findHardcodedUrls(content: string, filePath: string): Array<{ file: string; line: number; url: string }> {
  const issues: Array<{ file: string; line: number; url: string }> = [];
  const lines = content.split('\n');
  
  const urlPattern = /https:\/\/deno\.land\/[^"'`\s]+/g;
  
  lines.forEach((line, index) => {
    const matches = line.matchAll(urlPattern);
    for (const match of matches) {
      // Skip if it's in a comment explaining what the URL should be
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        issues.push({
          file: filePath,
          line: index + 1,
          url: match[0]
        });
      }
    }
  });
  
  return issues;
}

// Find imports that could use aliases
function findMissingAliases(content: string, filePath: string, importMap: ImportMapConfig): Array<{ file: string; line: number; import: string; suggestedAlias?: string }> {
  const issues: Array<{ file: string; line: number; import: string; suggestedAlias?: string }> = [];
  const lines = content.split('\n');
  
  // Pattern to match imports
  const importPattern = /import\s+.*?from\s+["']([^"']+)["']/g;
  
  lines.forEach((line, index) => {
    const matches = line.matchAll(importPattern);
    for (const match of matches) {
      const importPath = match[1];
      
      // Check if this import could use an alias
      let suggestedAlias: string | undefined;
      
      // Check for relative paths that should use aliases
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Skip if it's a local relative import (same directory level)
        if (!importPath.includes('/types/') && !importPath.includes('@/') && !importPath.includes('$')) {
          continue;
        }
      }
      
      // Check for paths that match import map patterns
      for (const [alias, path] of Object.entries(importMap.imports)) {
        if (importPath.includes(path.replace('/', '')) && !importPath.startsWith(alias)) {
          suggestedAlias = alias;
          break;
        }
      }
      
      // Check for common patterns that should use aliases
      if (importPath.includes('/lib/types/') && !importPath.startsWith('$types/')) {
        suggestedAlias = '$types/';
      } else if (importPath.includes('/server/') && !importPath.startsWith('$server/')) {
        suggestedAlias = '$server/';
      } else if (importPath.includes('/components/') && !importPath.startsWith('$')) {
        suggestedAlias = '$component/';
      }
      
      if (suggestedAlias && !importPath.startsWith('https://') && !importPath.startsWith('node:')) {
        issues.push({
          file: filePath,
          line: index + 1,
          import: importPath,
          suggestedAlias
        });
      }
    }
  });
  
  return issues;
}

// Find mixed import patterns (centralized vs direct domain)
function findMixedPatterns(content: string, filePath: string): Array<{ file: string; line: number; pattern: string }> {
  const issues: Array<{ file: string; line: number; pattern: string }> = [];
  const lines = content.split('\n');
  
  let hasCentralizedImports = false;
  let hasDirectDomainImports = false;
  let centralizedLines: number[] = [];
  let directDomainLines: number[] = [];
  
  lines.forEach((line, index) => {
    // Check for centralized imports (index.d.ts)
    if (line.includes('from "$types/index.d.ts"') || line.includes('from "$types"')) {
      hasCentralizedImports = true;
      centralizedLines.push(index + 1);
    }
    
    // Check for direct domain imports
    if (line.match(/from "\$types\/(stamp|src20|src101|base|transaction|api|wallet|errors|utils|marketData)\.d\.ts"/)) {
      hasDirectDomainImports = true;
      directDomainLines.push(index + 1);
    }
  });
  
  // Report if mixed patterns are found
  if (hasCentralizedImports && hasDirectDomainImports) {
    issues.push({
      file: filePath,
      line: centralizedLines[0],
      pattern: `Mixed patterns: centralized (lines ${centralizedLines.join(',')}) and direct domain (lines ${directDomainLines.join(',')})`
    });
  }
  
  return issues;
}

// Compare import maps - correctly handle relative path differences
function compareImportMaps(mainMap: ImportMapConfig, testMap: ImportMapConfig): Array<{ alias: string; mainPath: string; testPath: string }> {
  const mismatches: Array<{ alias: string; mainPath: string; testPath: string }> = [];
  
  // Helper function to convert main path to expected test path
  function convertMainToExpectedTestPath(mainPath: string): string {
    if (mainPath.startsWith("./")) {
      return mainPath.replace("./", "../");
    }
    return mainPath;
  }
  
  // Check for mismatches in common aliases
  for (const [alias, mainPath] of Object.entries(mainMap.imports)) {
    const testPath = testMap.imports[alias];
    
    if (testPath) {
      const expectedTestPath = convertMainToExpectedTestPath(mainPath);
      
      // Only flag as mismatch if test path doesn't match expected relative path
      if (testPath !== expectedTestPath) {
        mismatches.push({ alias, mainPath, testPath });
      }
    }
  }
  
  return mismatches;
}

// Process a single file
async function processFile(filePath: string, importMap: ImportMapConfig): Promise<{
  hardcodedUrls: Array<{ file: string; line: number; url: string }>;
  missingAliases: Array<{ file: string; line: number; import: string; suggestedAlias?: string }>;
  mixedPatterns: Array<{ file: string; line: number; pattern: string }>;
}> {
  try {
    const content = await Deno.readTextFile(filePath);
    
    return {
      hardcodedUrls: findHardcodedUrls(content, filePath),
      missingAliases: findMissingAliases(content, filePath, importMap),
      mixedPatterns: findMixedPatterns(content, filePath)
    };
  } catch (error) {
    console.error(red(`❌ Error reading ${filePath}: ${error.message}`));
    return { hardcodedUrls: [], missingAliases: [], mixedPatterns: [] };
  }
}

// Main validation function
async function main() {
  console.log(cyan("🕵️  Import Map Validation Report"));
  console.log(cyan("=" + "=".repeat(50)));
  
  // Load import maps
  console.log(blue("\n📋 Loading import map configurations..."));
  const mainImportMap = await loadImportMap("./deno.json");
  const testImportMap = await loadImportMap("./tests/deno.json");
  
  if (!mainImportMap) {
    console.error(red("❌ Cannot proceed without main deno.json"));
    Deno.exit(1);
  }
  
  console.log(green(`✅ Loaded main deno.json with ${Object.keys(mainImportMap.imports).length} import aliases`));
  
  if (testImportMap) {
    console.log(green(`✅ Loaded tests/deno.json with ${Object.keys(testImportMap.imports).length} import aliases`));
  } else {
    console.log(yellow("⚠️  tests/deno.json not found or invalid"));
  }
  
  const result: ValidationResult = {
    totalFiles: 0,
    filesWithIssues: 0,
    hardcodedUrls: [],
    missingAliases: [],
    mixedPatterns: [],
    importMapMismatches: []
  };
  
  // Compare import maps if both exist
  if (testImportMap) {
    console.log(blue("\n🔍 Comparing import maps..."));
    result.importMapMismatches = compareImportMaps(mainImportMap, testImportMap);
    
    if (result.importMapMismatches.length === 0) {
      console.log(green("✅ Import maps are aligned"));
    } else {
      console.log(red(`❌ Found ${result.importMapMismatches.length} import map mismatches`));
    }
  }
  
  // Scan all TypeScript files
  console.log(blue("\n🔍 Scanning TypeScript files..."));
  
  const filesToScan = [
    { pattern: ".", extensions: [".ts", ".tsx"], description: "All TypeScript files" }
  ];
  
  for (const { pattern, extensions, description } of filesToScan) {
    console.log(blue(`\n📁 Scanning ${description}...`));
    
    for await (const entry of walk(pattern, {
      exts: extensions,
      skip: [/node_modules/, /\.git/, /build/, /dist/, /coverage/, /scripts\/migrate-/, /scripts\/fix-/],
    })) {
      result.totalFiles++;
      
      if (result.totalFiles % 50 === 0) {
        console.log(cyan(`   📊 Processed ${result.totalFiles} files...`));
      }
      
      const fileResult = await processFile(entry.path, mainImportMap);
      
      if (fileResult.hardcodedUrls.length > 0 || 
          fileResult.missingAliases.length > 0 || 
          fileResult.mixedPatterns.length > 0) {
        result.filesWithIssues++;
      }
      
      result.hardcodedUrls.push(...fileResult.hardcodedUrls);
      result.missingAliases.push(...fileResult.missingAliases);
      result.mixedPatterns.push(...fileResult.mixedPatterns);
    }
  }
  
  // Generate report
  console.log(cyan("\n" + "=".repeat(60)));
  console.log(cyan("📊 VALIDATION REPORT"));
  console.log(cyan("=" + "=".repeat(59)));
  
  console.log(blue(`\n📈 Summary:`));
  console.log(`   Total files scanned: ${result.totalFiles}`);
  console.log(`   Files with issues: ${result.filesWithIssues}`);
  console.log(`   Issue-free files: ${result.totalFiles - result.filesWithIssues}`);
  
  // Report import map mismatches
  if (result.importMapMismatches.length > 0) {
    console.log(red(`\n❌ Import Map Mismatches (${result.importMapMismatches.length}):`));
    result.importMapMismatches.forEach(({ alias, mainPath, testPath }) => {
      console.log(red(`   • ${alias}:`));
      console.log(`     Main: ${mainPath}`);
      console.log(`     Test: ${testPath}`);
    });
  }
  
  // Report hardcoded URLs
  if (result.hardcodedUrls.length > 0) {
    console.log(red(`\n❌ Hardcoded deno.land URLs (${result.hardcodedUrls.length}):`));
    result.hardcodedUrls.slice(0, 10).forEach(({ file, line, url }) => {
      console.log(red(`   • ${file}:${line} - ${url}`));
    });
    if (result.hardcodedUrls.length > 10) {
      console.log(red(`   ... and ${result.hardcodedUrls.length - 10} more`));
    }
  }
  
  // Report missing aliases (top 20)
  if (result.missingAliases.length > 0) {
    console.log(yellow(`\n⚠️  Potential Missing Aliases (${result.missingAliases.length}):`));
    result.missingAliases.slice(0, 20).forEach(({ file, line, import: imp, suggestedAlias }) => {
      console.log(yellow(`   • ${file}:${line}`));
      console.log(`     Import: ${imp}`);
      if (suggestedAlias) {
        console.log(`     Suggested: ${suggestedAlias}...`);
      }
    });
    if (result.missingAliases.length > 20) {
      console.log(yellow(`   ... and ${result.missingAliases.length - 20} more`));
    }
  }
  
  // Report mixed patterns
  if (result.mixedPatterns.length > 0) {
    console.log(magenta(`\n🔀 Mixed Import Patterns (${result.mixedPatterns.length}):`));
    result.mixedPatterns.forEach(({ file, line, pattern }) => {
      console.log(magenta(`   • ${file}:${line} - ${pattern}`));
    });
  }
  
  // Final assessment
  console.log(cyan("\n" + "=".repeat(60)));
  
  if (result.hardcodedUrls.length === 0 && 
      result.importMapMismatches.length === 0 && 
      result.mixedPatterns.length === 0) {
    console.log(green("🎉 VALIDATION PASSED!"));
    console.log(green("✅ No hardcoded URLs found"));
    console.log(green("✅ Import maps are aligned"));
    console.log(green("✅ No mixed import patterns detected"));
    
    if (result.missingAliases.length > 0) {
      console.log(yellow(`⚠️  Found ${result.missingAliases.length} potential alias improvements`));
    }
  } else {
    console.log(red("❌ VALIDATION FAILED!"));
    console.log(red(`Found ${result.hardcodedUrls.length} hardcoded URLs`));
    console.log(red(`Found ${result.importMapMismatches.length} import map mismatches`));
    console.log(red(`Found ${result.mixedPatterns.length} mixed import patterns`));
  }
  
  console.log(cyan("=" + "=".repeat(59)));
  
  // Return exit code based on critical issues
  const criticalIssues = result.hardcodedUrls.length + result.importMapMismatches.length;
  if (criticalIssues > 0) {
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}