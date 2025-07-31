#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Service Files Import Migration Script
 * 
 * Migrates remaining server/services/* files to use domain-specific imports:
 * - Constants from $globals → $constants
 * - Type imports from $globals → appropriate $types/ modules
 * - Mixed imports → proper separation
 * 
 * Part of Type Domain Migration (Task 23.4)
 */

interface ImportMigration {
  file: string;
  oldImport: string;
  newImports: string[];
  reason: string;
}

// Define specific migration mappings for service files
const SERVICE_IMPORT_MIGRATIONS: ImportMigration[] = [
  // stampService.ts - Constants only
  {
    file: "server/services/stampService.ts",
    oldImport: `import {
  STAMP_EDITIONS,
  STAMP_FILESIZES,
  STAMP_FILETYPES,
  STAMP_FILTER_TYPES,
  STAMP_MARKETPLACE,
  STAMP_RANGES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  SUBPROTOCOLS,
} from "$globals";`,
    newImports: [
      `import {
  STAMP_EDITIONS,
  STAMP_FILESIZES,
  STAMP_FILETYPES,
  STAMP_FILTER_TYPES,
  STAMP_MARKETPLACE,
  STAMP_RANGES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  SUBPROTOCOLS,
} from "$constants";`
    ],
    reason: "Stamp constants moved to $constants"
  },

  // SRC20 Transaction Service - Types
  {
    file: "server/services/src20/transactionService.ts",
    oldImport: `import { TX, TXError } from "$globals";`,
    newImports: [
      `import type { TX, TXError } from "$types/transaction.d.ts";`
    ],
    reason: "Transaction types moved to domain-specific module"
  },

  // SRC20 Utility Service - Types
  {
    file: "server/services/src20/utilityService.ts", 
    oldImport: `import { Src20Detail } from "$globals";`,
    newImports: [
      `import type { Src20Detail } from "$types/src20.d.ts";`
    ],
    reason: "SRC20 types moved to domain-specific module"
  }
];

// Common patterns for bulk migrations
const COMMON_MIGRATION_PATTERNS = [
  {
    pattern: /import\s*{\s*([^}]*STAMP[^}]*)\s*}\s*from\s*['"]\$globals['"];?/g,
    replacement: 'import {\n  $1\n} from "$constants";',
    reason: "STAMP constants to $constants"
  },
  {
    pattern: /import\s*{\s*([^}]*SRC20[^}]*)\s*}\s*from\s*['"]\$globals['"];?/g,
    replacement: 'import type {\n  $1\n} from "$types/src20.d.ts";',
    reason: "SRC20 types to domain module"
  },
  {
    pattern: /import\s*{\s*([^}]*SRC101[^}]*)\s*}\s*from\s*['"]\$globals['"];?/g,
    replacement: 'import type {\n  $1\n} from "$types/src101.d.ts";',
    reason: "SRC101 types to domain module"
  },
  {
    pattern: /import\s*{\s*(TX|TXError|.*Transaction.*)\s*}\s*from\s*['"]\$globals['"];?/g,
    replacement: 'import type { $1 } from "$types/transaction.d.ts";',
    reason: "Transaction types to domain module"
  }
];

async function migrateFile(filePath: string): Promise<{ success: boolean; changes: number; errors?: string[] }> {
  try {
    console.log(`\n📄 Processing: ${filePath}`);
    
    if (!await fileExists(filePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return { success: true, changes: 0 };
    }

    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    let changeCount = 0;
    const errors: string[] = [];

    // First, try specific migrations for this file
    const specificMigration = SERVICE_IMPORT_MIGRATIONS.find(m => m.file === filePath);
    if (specificMigration) {
      if (content.includes(specificMigration.oldImport)) {
        // Replace with all new imports
        const newImportsText = specificMigration.newImports.join('\n');
        content = content.replace(specificMigration.oldImport, newImportsText);
        changeCount++;
        console.log(`  ✅ ${specificMigration.reason}`);
        console.log(`     Specific migration applied`);
      }
    } else {
      // Fall back to pattern-based migrations
      for (const pattern of COMMON_MIGRATION_PATTERNS) {
        const beforeReplace = content;
        content = content.replace(pattern.pattern, pattern.replacement);
        if (content !== beforeReplace) {
          changeCount++;
          console.log(`  ✅ ${pattern.reason}`);
        }
      }
    }

    // Write the updated content if changes were made
    if (changeCount > 0) {
      await Deno.writeTextFile(filePath, content);
      console.log(`  📝 Updated ${filePath} with ${changeCount} changes`);
    } else {
      console.log(`  ℹ️  No migration needed for ${filePath}`);
    }

    return { success: true, changes: changeCount, errors: errors.length > 0 ? errors : undefined };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
    return { success: false, changes: 0, errors: [error.message] };
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await Deno.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findServiceFiles(): Promise<string[]> {
  const serviceFiles: string[] = [];
  
  // Get all service files that still import from $globals
  const command = new Deno.Command("grep", {
    args: ["-r", "-l", 'from "$globals"', "server/services/", "server/controller/"],
    stdout: "piped",
    stderr: "piped"
  });
  
  try {
    const { stdout } = await command.output();
    const files = new TextDecoder().decode(stdout)
      .split('\n')
      .filter(line => line.trim() && line.endsWith('.ts'));
    
    serviceFiles.push(...files);
  } catch (error) {
    console.warn("Could not find files with grep, using predefined list");
  }

  // Add known files from investigation
  const knownFiles = [
    "server/services/stampService.ts",
    "server/services/src20/utilityService.ts", 
    "server/services/src20/transactionService.ts",
    "server/services/src20/queryService.ts",
    "server/services/src101/utilityService.ts",
    "server/services/src101/transactionService.ts",
    "server/services/core/collectionService.ts",
    "server/services/src101/queryService.ts",
    "server/services/src20/marketDataEnrichmentService.ts",
    "server/services/core/blockService.ts"
  ];

  // Combine and deduplicate
  const allFiles = [...new Set([...serviceFiles, ...knownFiles])];
  
  return allFiles.filter(file => file.includes('server/services/') || file.includes('server/controller/'));
}

async function main() {
  console.log("🔄 Service Files Import Migration");
  console.log("================================");
  console.log("Migrating server service files from $globals to domain-specific imports\n");

  // Find all service files that need migration
  const serviceFiles = await findServiceFiles();
  
  console.log(`Found ${serviceFiles.length} service files to process:`);
  serviceFiles.forEach(file => console.log(`  - ${file}`));
  console.log();

  let totalChanges = 0;
  let successCount = 0;
  const allErrors: string[] = [];

  for (const file of serviceFiles) {
    const result = await migrateFile(file);
    
    if (result.success) {
      successCount++;
      totalChanges += result.changes;
    }
    
    if (result.errors) {
      allErrors.push(...result.errors);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary:");
  console.log(`   Files processed: ${serviceFiles.length}`);
  console.log(`   Files successful: ${successCount}`);
  console.log(`   Total changes: ${totalChanges}`);
  
  if (allErrors.length > 0) {
    console.log(`   Errors: ${allErrors.length}`);
    console.log("\n❌ Errors encountered:");
    allErrors.forEach(error => console.log(`   - ${error}`));
  }

  if (successCount === serviceFiles.length && totalChanges > 0) {
    console.log("\n🎉 Service files import migration completed successfully!");
    console.log("   All service files now use domain-specific imports");
  } else if (successCount === serviceFiles.length && totalChanges === 0) {
    console.log("\n✅ Service files already use correct imports - no changes needed");
  } else {
    console.log("\n⚠️  Migration completed with some issues - review errors above");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}