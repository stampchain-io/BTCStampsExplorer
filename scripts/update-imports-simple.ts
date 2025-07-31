#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Simple script to update imports from globals.d.ts to domain modules
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, yellow, red, blue } from "https://deno.land/std@0.208.0/fmt/colors.ts";

// Type mapping from globals.d.ts to domain modules
const TYPE_MAPPING: Record<string, string> = {
  // Stamp types
  "StampRow": "$types/stamp.d.ts",
  "StampBalance": "$types/stamp.d.ts",
  "StampFilters": "$types/stamp.d.ts",
  "StampMetadata": "$types/stamp.d.ts",
  "StampValidationResult": "$types/stamp.d.ts",
  "StampWithOptionalMarketData": "$types/stamp.d.ts",
  "ValidatedStamp": "$types/stamp.d.ts",
  "STAMP_TYPES": "$types/stamp.d.ts",
  "STAMP_FILTER_TYPES": "$types/stamp.d.ts",
  "STAMP_MARKETPLACE": "$types/stamp.d.ts",
  
  // SRC-20 types
  "SRC20Row": "$types/src20.d.ts",
  "EnrichedSRC20Row": "$types/src20.d.ts",
  "SRC20Balance": "$types/src20.d.ts",
  "SRC20Filters": "$types/src20.d.ts",
  "SRC20WithOptionalMarketData": "$types/src20.d.ts",
  "Deployment": "$types/src20.d.ts",
  "MintStatus": "$types/src20.d.ts",
  "SRC20_TYPES": "$types/src20.d.ts",
  "SRC20_FILTER_TYPES": "$types/src20.d.ts",
  
  // API types  
  "PaginatedStampResponseBody": "$types/api.d.ts",
  "PaginatedSrc20ResponseBody": "$types/api.d.ts",
  "StampPageProps": "$types/api.d.ts",
  "StampsAndSrc20": "$types/api.d.ts",
  
  // UI Component types
  "StampGalleryProps": "$types/ui.d.ts",
  "CollectionGalleryProps": "$types/ui.d.ts",
  "ButtonProps": "$types/ui.d.ts",
  "InputProps": "$types/ui.d.ts",
  "SelectProps": "$types/ui.d.ts",
  "TableProps": "$types/ui.d.ts",
  "Theme": "$types/ui.d.ts",
  
  // Base types
  "BlockRow": "$types/base.d.ts",
  "SUBPROTOCOLS": "$types/base.d.ts",
  "BTCBalance": "$types/base.d.ts",
  "UTXO": "$types/base.d.ts",
  
  // Transaction types
  "SendRow": "$types/transaction.d.ts",
  "TX": "$types/transaction.d.ts",
  "TXError": "$types/transaction.d.ts",
  
  // Wallet types
  "WalletInfo": "$types/wallet.d.ts",
  "BTCBalanceInfo": "$types/wallet.d.ts",
  "WalletDataTypes": "$types/base.d.ts", // Note: this is in base.d.ts, not wallet.d.ts
  
  // Market data types
  "StampWithMarketData": "$types/marketData.d.ts",
  "SRC20WithMarketData": "$types/marketData.d.ts",
  "CacheStatus": "$types/marketData.d.ts",
  
  // Collection types - TODO: might need to create collection.d.ts
  "Collection": "$types/stamp.d.ts",
  "CollectionRow": "$types/stamp.d.ts",
  
  // Pagination types
  "Pagination": "$types/pagination.d.ts",
  "PaginationProps": "$types/pagination.d.ts",
  "PaginationState": "$types/pagination.d.ts",
  
  // Base/Config types
  "Config": "$types/base.d.ts",
  "ROOT_DOMAIN_TYPES": "$types/base.d.ts",
  
  // SRC-101 types
  "SRC101Balance": "$types/src101.d.ts",
  "Src101Detail": "$types/src101.d.ts",
  
  // Stamp filter constants
  "STAMP_EDITIONS": "$types/stamp.d.ts",
  "STAMP_FILESIZES": "$types/stamp.d.ts",
  "STAMP_FILETYPES": "$types/stamp.d.ts",
  "STAMP_RANGES": "$types/stamp.d.ts",
  
  // Market data types
  "MarketListingAggregated": "$types/marketData.d.ts",
  
  // Wallet types (WalletDataTypes already exists in base.d.ts)
  "WALLET_FILTER_TYPES": "$types/wallet.d.ts",
  
  // Collection/Listing filter types - these need to be migrated from globals.d.ts
  // For now, keeping them in globals.d.ts as they're not yet migrated
  // "COLLECTION_FILTER_TYPES": "$types/collection.d.ts", // TODO: migrate
  // "LISTING_FILTER_TYPES": "$types/collection.d.ts", // TODO: migrate
};

async function processFile(path: string, dryRun: boolean): Promise<{ updated: boolean; changes: string[] }> {
  const content = await Deno.readTextFile(path);
  let updated = false;
  const changes: string[] = [];
  
  // Match import statements from globals
  const importRegex = /import\s+(?:type\s+)?{([^}]+)}\s+from\s+["'](?:\$globals|\.\.\/globals|\.\.\/\.\.\/globals|.*\/globals\.d\.ts)["'];?/g;
  
  let newContent = content;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const fullImport = match[0];
    const imports = match[1].split(',').map(imp => imp.trim());
    
    // Group imports by target module
    const importsByModule = new Map<string, string[]>();
    const unmappedTypes: string[] = [];
    
    for (const imp of imports) {
      const cleanImport = imp.split(' as ')[0].trim(); // Handle aliased imports
      const targetModule = TYPE_MAPPING[cleanImport];
      
      if (targetModule) {
        if (!importsByModule.has(targetModule)) {
          importsByModule.set(targetModule, []);
        }
        importsByModule.get(targetModule)!.push(imp);
      } else {
        unmappedTypes.push(imp);
      }
    }
    
    // Build new import statements
    const newImports: string[] = [];
    
    for (const [module, types] of importsByModule) {
      const sortedTypes = types.sort();
      newImports.push(`import type { ${sortedTypes.join(', ')} } from "${module}";`);
    }
    
    if (unmappedTypes.length > 0) {
      console.log(yellow(`  ⚠️  Unmapped types in ${path}: ${unmappedTypes.join(', ')}`));
    }
    
    if (newImports.length > 0) {
      const replacement = newImports.join('\n');
      newContent = newContent.replace(fullImport, replacement);
      changes.push(`Replaced: ${fullImport}`);
      changes.push(`With: ${replacement}`);
      updated = true;
    }
  }
  
  if (updated && !dryRun) {
    await Deno.writeTextFile(path, newContent);
  }
  
  return { updated, changes };
}

async function main() {
  const dryRun = Deno.args.includes("--dry-run") || Deno.args.includes("-d");
  const verbose = Deno.args.includes("--verbose") || Deno.args.includes("-v");
  
  console.log(blue("🔄 Starting component import updates..."));
  if (dryRun) {
    console.log(yellow("🔍 Running in dry-run mode - no files will be modified"));
  }
  
  let filesProcessed = 0;
  let filesUpdated = 0;
  
  // Walk through component directories
  for await (const entry of walk(".", {
    includeDirs: false,
    match: [/\.(ts|tsx)$/],
    skip: [/node_modules/, /\.git/, /dist/, /build/, /scripts/],
  })) {
    if (entry.path.includes("components/") || entry.path.includes("islands/")) {
      const content = await Deno.readTextFile(entry.path);
      
      // Check if file imports from globals
      if (content.includes('from "$globals') || content.includes('from "../globals') || content.includes('from "../../globals')) {
        filesProcessed++;
        
        const result = await processFile(entry.path, dryRun);
        
        if (result.updated) {
          filesUpdated++;
          console.log(green(`✓ ${entry.path}`));
          
          if (verbose) {
            for (const change of result.changes) {
              console.log(`  ${change}`);
            }
          }
        }
      }
    }
  }
  
  // Summary
  console.log("\n" + blue("📊 Summary:"));
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Files updated: ${filesUpdated}`);
  
  if (dryRun) {
    console.log(yellow("\n🔍 Dry-run complete. Run without --dry-run to apply changes."));
  } else {
    console.log(green("\n✅ Import updates complete!"));
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(red("Fatal error:"), error);
    Deno.exit(1);
  });
}