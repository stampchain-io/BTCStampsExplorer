#!/usr/bin/env -S deno run --allow-read

/**
 * Simple test script to validate import extraction logic
 */

const testFile = "components/layout/MetaTags.tsx";

try {
  const content = await Deno.readTextFile(testFile);
  console.log("File content preview:");
  console.log(content.split('\n').slice(0, 15).join('\n'));
  console.log("\n" + "=".repeat(50));
  
  // Test import extraction
  const importRegex = /^import\s/;
  const lines = content.split('\n');
  const importLines = lines.filter(line => importRegex.test(line.trim()));
  
  console.log(`Found ${importLines.length} import lines:`);
  importLines.forEach((line, index) => {
    console.log(`${index + 1}: ${line}`);
  });
  
} catch (error) {
  console.error("Test failed:", error);
}