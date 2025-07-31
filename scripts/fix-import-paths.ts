#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Script to fix import paths from @/lib/types/ to $types/
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, yellow, red, blue } from "https://deno.land/std@0.208.0/fmt/colors.ts";

async function fixImportPaths() {
  console.log(blue("🔄 Fixing import paths from @/lib/types/ to $types/..."));
  
  let filesProcessed = 0;
  let filesUpdated = 0;
  
  // Walk through all TypeScript/TSX files
  for await (const entry of walk(".", {
    includeDirs: false,
    match: [/\.(ts|tsx)$/],
    skip: [/node_modules/, /\.git/, /dist/, /build/, /scripts/, /_fresh/],
  })) {
    const content = await Deno.readTextFile(entry.path);
    
    // Check if file contains the incorrect pattern
    if (content.includes('@/lib/types/')) {
      filesProcessed++;
      
      // Replace @/lib/types/ with $types/
      const newContent = content.replace(/@\/lib\/types\//g, '$types/');
      
      if (newContent !== content) {
        await Deno.writeTextFile(entry.path, newContent);
        filesUpdated++;
        console.log(green(`✓ ${entry.path}`));
      }
    }
  }
  
  // Summary
  console.log("\n" + blue("📊 Summary:"));
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Files updated: ${filesUpdated}`);
  console.log(green("\n✅ Import path fixes complete!"));
}

if (import.meta.main) {
  fixImportPaths().catch((error) => {
    console.error(red("Fatal error:"), error);
    Deno.exit(1);
  });
}