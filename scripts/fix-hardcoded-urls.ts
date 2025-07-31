#!/usr/bin/env -S deno run -A
/**
 * Fix hardcoded deno.land URLs - Task 30
 * Replace with @std import map aliases for better dependency management
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, red, yellow, blue, cyan } from "https://deno.land/std@0.208.0/fmt/colors.ts";

// URL replacements mapping hardcoded URLs to import map aliases
const URL_REPLACEMENTS: Record<string, string> = {
  // Assert module
  "https://deno.land/std@0.208.0/assert/mod.ts": "@std/assert",
  "https://deno.land/std@0.208.0/assert": "@std/assert",
  
  // Testing modules
  "https://deno.land/std@0.208.0/testing/mock.ts": "@std/testing/mock",
  "https://deno.land/std@0.208.0/testing/bdd.ts": "@std/testing/bdd",
  "https://deno.land/std@0.208.0/testing": "@std/testing",
  
  // Async modules
  "https://deno.land/std@0.208.0/async/mod.ts": "@std/async",
  "https://deno.land/std@0.208.0/async": "@std/async",
  
  // Crypto modules
  "https://deno.land/std@0.208.0/crypto/mod.ts": "@std/crypto",
  "https://deno.land/std@0.208.0/crypto": "@std/crypto",
  
  // Encoding modules
  "https://deno.land/std@0.208.0/encoding/mod.ts": "@std/encoding",
  "https://deno.land/std@0.208.0/encoding": "@std/encoding",
  
  // FS modules
  "https://deno.land/std@0.208.0/fs/mod.ts": "@std/fs",
  "https://deno.land/std@0.208.0/fs/walk.ts": "@std/fs/walk",
  "https://deno.land/std@0.208.0/fs": "@std/fs",
  
  // Path modules
  "https://deno.land/std@0.208.0/path/mod.ts": "@std/path",
  "https://deno.land/std@0.208.0/path": "@std/path",
  
  // Log modules
  "https://deno.land/std@0.208.0/log/mod.ts": "@std/log",
  "https://deno.land/std@0.208.0/log": "@std/log",
  
  // YAML modules
  "https://deno.land/std@0.208.0/yaml/mod.ts": "@std/yaml",
  "https://deno.land/std@0.208.0/yaml": "@std/yaml",
  
  // Dotenv modules
  "https://deno.land/std@0.208.0/dotenv/mod.ts": "@std/dotenv",
  "https://deno.land/std@0.208.0/dotenv": "@std/dotenv",
  
  // Format modules
  "https://deno.land/std@0.208.0/fmt/colors.ts": "@std/fmt/colors",
  "https://deno.land/std@0.208.0/fmt": "@std/fmt",
};

interface FixResult {
  file: string;
  changes: Array<{ line: number; oldUrl: string; newAlias: string }>;
}

// Fix hardcoded URLs in a single file
async function fixFileUrls(filePath: string): Promise<FixResult> {
  const result: FixResult = { file: filePath, changes: [] };
  
  try {
    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    const lines = content.split('\n');
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let lineChanged = false;
      
      // Check each URL replacement
      for (const [hardcodedUrl, alias] of Object.entries(URL_REPLACEMENTS)) {
        if (line.includes(hardcodedUrl)) {
          // Replace the URL with the alias
          const newLine = line.replace(hardcodedUrl, alias);
          if (newLine !== line) {
            result.changes.push({
              line: i + 1,
              oldUrl: hardcodedUrl,
              newAlias: alias
            });
            lines[i] = newLine;
            lineChanged = true;
          }
        }
      }
    }
    
    // Write back if changes were made
    if (result.changes.length > 0) {
      const newContent = lines.join('\n');
      await Deno.writeTextFile(filePath, newContent);
    }
    
  } catch (error) {
    console.error(red(`❌ Error processing ${filePath}: ${error.message}`));
  }
  
  return result;
}

// Main function
async function main() {
  console.log(cyan("🔧 Task 30: Hardcoded URL Cleanup"));
  console.log(cyan("=" + "=".repeat(50)));
  
  console.log(blue("📋 Replacing hardcoded deno.land URLs with @std aliases..."));
  console.log(blue(`🎯 Configured ${Object.keys(URL_REPLACEMENTS).length} URL replacements`));
  
  const results: FixResult[] = [];
  let totalFiles = 0;
  let filesChanged = 0;
  let totalReplacements = 0;
  
  // Process all TypeScript files
  console.log(blue("\n🔍 Scanning TypeScript files for hardcoded URLs..."));
  
  for await (const entry of walk(".", {
    exts: [".ts", ".tsx"],
    skip: [/node_modules/, /\.git/, /build/, /dist/, /coverage/, /scripts\/.*\.ts$/],
  })) {
    totalFiles++;
    
    if (totalFiles % 100 === 0) {
      console.log(cyan(`   📊 Processed ${totalFiles} files...`));
    }
    
    const result = await fixFileUrls(entry.path);
    
    if (result.changes.length > 0) {
      results.push(result);
      filesChanged++;
      totalReplacements += result.changes.length;
    }
  }
  
  // Report results
  console.log(cyan("\n" + "=".repeat(60)));
  console.log(cyan("📊 TASK 30 COMPLETION REPORT"));
  console.log(cyan("=" + "=".repeat(59)));
  
  console.log(blue(`\n📈 Summary:`));
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files changed: ${filesChanged}`);
  console.log(`   Total URL replacements: ${totalReplacements}`);
  
  if (results.length > 0) {
    console.log(green(`\n✅ Successfully fixed hardcoded URLs in ${results.length} files:`));
    
    results.forEach(({ file, changes }) => {
      console.log(blue(`\n📁 ${file}:`));
      changes.forEach(({ line, oldUrl, newAlias }) => {
        console.log(green(`   ✅ Line ${line}: ${oldUrl} → ${newAlias}`));
      });
    });
    
    // Show most common replacements
    const replacementCounts = new Map<string, number>();
    results.forEach(({ changes }) => {
      changes.forEach(({ newAlias }) => {
        replacementCounts.set(newAlias, (replacementCounts.get(newAlias) || 0) + 1);
      });
    });
    
    console.log(blue(`\n📊 Most common replacements:`));
    Array.from(replacementCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([alias, count]) => {
        console.log(`   • ${alias}: ${count} replacements`);
      });
      
  } else {
    console.log(yellow("⚠️  No hardcoded URLs found to replace"));
  }
  
  // Success message
  if (totalReplacements > 0) {
    console.log(green(`\n🎉 Task 30 COMPLETE!`));
    console.log(green(`✅ Replaced ${totalReplacements} hardcoded URLs with import aliases`));
    console.log(green("✅ Improved build consistency and dependency management"));
  } else {
    console.log(green(`\n✅ Task 30 COMPLETE - No hardcoded URLs found!`));
  }
  
  console.log(blue("\n🚀 Next Steps:"));
  console.log("   • Task 31: Resolve mixed import patterns");
  console.log("   • Task 32: Optimize remaining alias improvements");
  console.log("   • Final validation of all import issues");
  
  console.log(cyan("=" + "=".repeat(59)));
}

if (import.meta.main) {
  await main();
}