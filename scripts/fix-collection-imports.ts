#!/usr/bin/env -S deno run -A
/**
 * Fix Collection type imports in components that were incorrectly migrated
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, red } from "https://deno.land/std@0.208.0/fmt/colors.ts";

async function processFile(filePath: string): Promise<boolean> {
  try {
    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    
    // Fix Collection imports from wrong paths
    content = content.replace(
      /import type \{ Collection(.*?) \} from "\$types\/stamp\.d\.ts";/g,
      'import type { Collection$1 } from "$server/types/collection.d.ts";'
    );
    
    content = content.replace(
      /import type \{ (.*?), Collection(.*?) \} from "\$types\/stamp\.d\.ts";/g,
      'import type { $1 } from "$types/stamp.d.ts";\nimport type { Collection$2 } from "$server/types/collection.d.ts";'
    );
    
    if (content !== originalContent) {
      await Deno.writeTextFile(filePath, content);
      console.log(green(`✓ Fixed Collection imports in ${filePath}`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(red(`Error processing ${filePath}: ${error.message}`));
    return false;
  }
}

async function main() {
  console.log("Fixing Collection type imports...\n");
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  // Process all TypeScript files
  for await (const entry of walk(".", {
    exts: [".ts", ".tsx"],
    skip: [/node_modules/, /\.git/, /scripts/],
  })) {
    totalFiles++;
    if (await processFile(entry.path)) {
      updatedFiles++;
    }
  }
  
  console.log(`\nTotal files scanned: ${totalFiles}`);
  console.log(`Files updated: ${updatedFiles}`);
}

if (import.meta.main) {
  await main();
}