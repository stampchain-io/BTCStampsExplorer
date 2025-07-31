#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Database Layer Import Migration Script
 * 
 * Migrates server/database/* files to use domain-specific type imports:
 * - $globals → $types/ for shared domain types
 * - Update import paths to match new type organization
 * 
 * Part of Type Domain Migration (Task 23.3)
 */

interface ImportMapping {
  oldImport: string;
  newImport: string;
  reason: string;
}

const DATABASE_IMPORT_MAPPINGS: ImportMapping[] = [
  // Collection types
  {
    oldImport: 'import { Collection } from "$globals";',
    newImport: 'import type { Collection } from "$types/collection.d.ts";',
    reason: "Collection type moved to domain-specific module"
  },
  
  // Stamp types
  {
    oldImport: 'import type { StampFilters, StampRow } from "$globals";',
    newImport: 'import type { StampFilters, StampRow } from "$types/stamp.d.ts";',
    reason: "Stamp types moved to domain-specific module"
  },
  {
    oldImport: 'import type { StampRow } from "$globals";',
    newImport: 'import type { StampRow } from "$types/stamp.d.ts";',
    reason: "StampRow type moved to domain-specific module"
  },
  
  // Market data types (already correctly imported)
  {
    oldImport: 'import type {\n    CacheStatus,\n    CollectionMarketData,\n    CollectionMarketDataRow,\n    SRC20MarketData,\n    SRC20MarketDataRow,\n    StampHolderCache,\n    StampHolderCacheRow,\n    StampMarketData,\n    StampMarketDataRow,\n    StampWithMarketData,\n} from "$lib/types/marketData.d.ts";',
    newImport: 'import type {\n    CacheStatus,\n    CollectionMarketData,\n    CollectionMarketDataRow,\n    SRC20MarketData,\n    SRC20MarketDataRow,\n    StampHolderCache,\n    StampHolderCacheRow,\n    StampMarketData,\n    StampMarketDataRow,\n    StampWithMarketData,\n} from "$types/marketData.d.ts";',
    reason: "Market data types moved to domain-specific module"
  }
];

const DATABASE_FILES = [
  "server/database/collectionRepository.ts",
  "server/database/marketDataRepository.ts", 
  "server/database/summary.ts"
];

async function migrateFile(filePath: string): Promise<{ success: boolean; changes: number; errors?: string[] }> {
  try {
    console.log(`\n📄 Processing: ${filePath}`);
    
    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    let changeCount = 0;
    const errors: string[] = [];

    // Apply import mappings
    for (const mapping of DATABASE_IMPORT_MAPPINGS) {
      if (content.includes(mapping.oldImport)) {
        content = content.replace(mapping.oldImport, mapping.newImport);
        changeCount++;
        console.log(`  ✅ ${mapping.reason}`);
        console.log(`     ${mapping.oldImport.split('\n')[0]}... → ${mapping.newImport.split('\n')[0]}...`);
      }
    }

    // Write the updated content
    if (changeCount > 0) {
      await Deno.writeTextFile(filePath, content);
      console.log(`  📝 Updated ${filePath} with ${changeCount} changes`);
    } else {
      console.log(`  ℹ️  No changes needed for ${filePath}`);
    }

    return { success: true, changes: changeCount, errors: errors.length > 0 ? errors : undefined };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
    return { success: false, changes: 0, errors: [error.message] };
  }
}

async function main() {
  console.log("🔄 Database Layer Import Migration");
  console.log("==================================");
  console.log("Migrating server/database/* files to domain-specific type imports\n");

  let totalChanges = 0;
  let successCount = 0;
  const allErrors: string[] = [];

  for (const file of DATABASE_FILES) {
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
  console.log(`   Files processed: ${DATABASE_FILES.length}`);
  console.log(`   Files successful: ${successCount}`);
  console.log(`   Total changes: ${totalChanges}`);
  
  if (allErrors.length > 0) {
    console.log(`   Errors: ${allErrors.length}`);
    console.log("\n❌ Errors encountered:");
    allErrors.forEach(error => console.log(`   - ${error}`));
  }

  if (successCount === DATABASE_FILES.length && totalChanges > 0) {
    console.log("\n🎉 Database layer import migration completed successfully!");
    console.log("   All database files now use domain-specific type imports");
  } else if (successCount === DATABASE_FILES.length && totalChanges === 0) {
    console.log("\n✅ Database layer already uses correct imports - no changes needed");
  } else {
    console.log("\n⚠️  Migration completed with some issues - review errors above");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}