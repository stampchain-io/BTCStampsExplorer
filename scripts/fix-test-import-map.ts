#!/usr/bin/env -S deno run -A
/**
 * Fix tests/deno.json import map alignment with main deno.json
 * Task 29.1: Critical import map alignment - IMMEDIATE EXECUTION
 */

import { green, red, blue, cyan } from "https://deno.land/std@0.208.0/fmt/colors.ts";

interface ImportMapConfig {
  imports: Record<string, string>;
  [key: string]: any;
}

// Load and parse import map
async function loadImportMap(path: string): Promise<ImportMapConfig | null> {
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content);
  } catch (error) {
    console.error(red(`❌ Failed to load ${path}: ${error.message}`));
    return null;
  }
}

// Save import map
async function saveImportMap(path: string, config: ImportMapConfig): Promise<boolean> {
  try {
    const content = JSON.stringify(config, null, 2);
    await Deno.writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error(red(`❌ Failed to save ${path}: ${error.message}`));
    return false;
  }
}

// Fix path alignment - convert main paths to test paths
function convertMainPathToTestPath(mainPath: string): string {
  // Main paths use "./" prefix, test paths need "../" since tests/ is a subdirectory
  if (mainPath.startsWith("./")) {
    return mainPath.replace("./", "../");
  }
  return mainPath;
}

// Main function
async function main() {
  console.log(cyan("🔧 Task 29.1: Fix Import Map Alignment"));
  console.log(cyan("=" + "=".repeat(50)));
  
  // Load both import maps
  console.log(blue("\n📋 Loading import map configurations..."));
  const mainConfig = await loadImportMap("./deno.json");
  const testConfig = await loadImportMap("./tests/deno.json");
  
  if (!mainConfig || !testConfig) {
    console.error(red("❌ Cannot proceed without both deno.json files"));
    Deno.exit(1);
  }
  
  console.log(green(`✅ Loaded main deno.json with ${Object.keys(mainConfig.imports).length} import aliases`));
  console.log(green(`✅ Loaded tests/deno.json with ${Object.keys(testConfig.imports).length} import aliases`));
  
  // Identify aliases that need alignment
  const aliasesToAlign = [
    "$/", "$client/", "$components/", "$constants", "$globals", "$handlers/",
    "$islands/", "$lib/", "$routes/", "$server/", "$types/", "$utils/",
    "$layout", "$header", "$content", "$section", "$card", "$tool",
    "$text", "$button", "$icon", "$form", "$notification", "$table",
    "$fees", "$animation"
  ];
  
  console.log(blue(`\n🔍 Checking ${aliasesToAlign.length} aliases for alignment...`));
  
  let alignmentCount = 0;
  const misalignments: Array<{ alias: string; mainPath: string; testPath: string; fixedPath: string }> = [];
  
  // Check each alias
  for (const alias of aliasesToAlign) {
    const mainPath = mainConfig.imports[alias];
    const testPath = testConfig.imports[alias];
    
    if (mainPath && testPath) {
      const expectedTestPath = convertMainPathToTestPath(mainPath);
      
      if (testPath !== expectedTestPath) {
        misalignments.push({
          alias,
          mainPath,
          testPath,
          fixedPath: expectedTestPath
        });
      }
    } else if (mainPath && !testPath) {
      // Missing in test config
      const expectedTestPath = convertMainPathToTestPath(mainPath);
      misalignments.push({
        alias,
        mainPath,
        testPath: "(missing)",
        fixedPath: expectedTestPath
      });
    }
  }
  
  console.log(blue(`\n📊 Found ${misalignments.length} misalignments to fix:`));
  
  if (misalignments.length === 0) {
    console.log(green("✅ No misalignments found - import maps are already aligned!"));
    return;
  }
  
  // Display misalignments
  misalignments.forEach(({ alias, mainPath, testPath, fixedPath }) => {
    console.log(red(`\n❌ ${alias}:`));
    console.log(`   Main:     ${mainPath}`);
    console.log(`   Test:     ${testPath}`);
    console.log(green(`   Fixed:    ${fixedPath}`));
  });
  
  // Apply fixes
  console.log(blue(`\n🔧 Applying ${misalignments.length} fixes...`));
  
  for (const { alias, fixedPath } of misalignments) {
    testConfig.imports[alias] = fixedPath;
    alignmentCount++;
    console.log(green(`✅ Fixed ${alias} -> ${fixedPath}`));
  }
  
  // Save the updated test config
  console.log(blue("\n💾 Saving updated tests/deno.json..."));
  const saved = await saveImportMap("./tests/deno.json", testConfig);
  
  if (saved) {
    console.log(green("✅ Successfully saved updated tests/deno.json"));
  } else {
    console.error(red("❌ Failed to save tests/deno.json"));
    Deno.exit(1);
  }
  
  // Validation
  console.log(blue("\n🔍 Validating fixes..."));
  const updatedTestConfig = await loadImportMap("./tests/deno.json");
  
  if (!updatedTestConfig) {
    console.error(red("❌ Failed to validate updated config"));
    Deno.exit(1);
  }
  
  let validationErrors = 0;
  for (const { alias, fixedPath } of misalignments) {
    if (updatedTestConfig.imports[alias] !== fixedPath) {
      console.error(red(`❌ Validation failed for ${alias}`));
      validationErrors++;
    }
  }
  
  if (validationErrors === 0) {
    console.log(green("✅ All fixes validated successfully"));
  } else {
    console.error(red(`❌ ${validationErrors} validation errors found`));
    Deno.exit(1);
  }
  
  // Final report
  console.log(cyan("\n" + "=".repeat(60)));
  console.log(cyan("📊 TASK 29.1 COMPLETION REPORT"));
  console.log(cyan("=" + "=".repeat(59)));
  
  console.log(green(`✅ Successfully aligned ${alignmentCount} import map entries`));
  console.log(green("✅ Tests/deno.json now matches main deno.json structure"));
  console.log(green("✅ Import map misalignment blocking issue RESOLVED"));
  
  console.log(blue("\n🚀 Next Steps:"));
  console.log("   • Task 29.2: Validate zero misalignments remain");
  console.log("   • Task 30: Begin hardcoded URL cleanup");
  console.log("   • Task 31: Resolve mixed import patterns");
  
  console.log(cyan("=" + "=".repeat(59)));
}

if (import.meta.main) {
  await main();
}