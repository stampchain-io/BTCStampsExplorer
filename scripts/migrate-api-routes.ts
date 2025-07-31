#!/usr/bin/env -S deno run -A
/**
 * Script to migrate API route imports from globals.d.ts to domain modules
 * Using direct domain imports strategy as recommended by orchestrator
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, red, yellow, blue } from "https://deno.land/std@0.208.0/fmt/colors.ts";

// Type mappings from globals.d.ts to domain modules (direct domain strategy)
const TYPE_MAPPING: Record<string, string> = {
  // Stamp types -> stamp.d.ts
  "StampRow": "$types/stamp.d.ts",
  "StampBalance": "$types/stamp.d.ts",
  "StampStatus": "$types/stamp.d.ts",
  "StampWithOptionalMarketData": "$types/stamp.d.ts",
  "ValidatedStamp": "$types/stamp.d.ts",
  "StampFilters": "$types/stamp.d.ts",
  "StampValidationResult": "$types/stamp.d.ts",
  "StampMetadata": "$types/stamp.d.ts",
  "STAMP_TYPES": "$types/stamp.d.ts",
  "STAMP_FILTER_TYPES": "$types/stamp.d.ts",
  "STAMP_MARKETPLACE": "$types/stamp.d.ts",
  
  // SRC-20 types -> src20.d.ts
  "SRC20Row": "$types/src20.d.ts",
  "SRC20Balance": "$types/src20.d.ts",
  "SRC20Operation": "$types/src20.d.ts",
  "SRC20MintStatus": "$types/src20.d.ts",
  "SRC20Filters": "$types/src20.d.ts",
  "SRC20WithOptionalMarketData": "$types/src20.d.ts",
  "EnrichedSRC20Row": "$types/src20.d.ts",
  "SRC20HolderData": "$types/src20.d.ts",
  "SRC20TrxRequestParams": "$types/src20.d.ts",
  "SRC20BalanceRequestParams": "$types/src20.d.ts",
  "SRC20SnapshotRequestParams": "$types/src20.d.ts",
  "PaginatedSRC20WithMarketDataResponse": "$types/src20.d.ts",
  "SRC20_TYPES": "$types/src20.d.ts",
  "SRC20_STATUS": "$types/src20.d.ts",
  "SRC20_FILTER_TYPES": "$types/src20.d.ts",
  "SRC20_MARKET": "$types/src20.d.ts",
  "SRC20_DETAILS": "$types/src20.d.ts",
  "Deployment": "$types/src20.d.ts",
  
  // SRC-101 types -> src101.d.ts
  "SRC101Balance": "$types/src101.d.ts",
  
  // Transaction types -> transaction.d.ts
  "SendRow": "$types/transaction.d.ts",
  "TX": "$types/transaction.d.ts",
  "TXError": "$types/transaction.d.ts",
  "BlockInfo": "$types/transaction.d.ts",
  "MintStampInputData": "$types/transaction.d.ts",
  "ScriptTypeInfo": "$types/transaction.d.ts",
  "Output": "$types/transaction.d.ts",
  "InputTypeForSizeEstimation": "$types/transaction.d.ts",
  "OutputTypeForSizeEstimation": "$types/transaction.d.ts",
  
  // Bitcoin base types -> base.d.ts
  "BlockRow": "$types/base.d.ts",
  "BTCBalance": "$types/base.d.ts",
  "BtcInfo": "$types/base.d.ts",
  "UTXO": "$types/base.d.ts",
  "BasicUTXO": "$types/base.d.ts",
  "ScriptType": "$types/base.d.ts",
  "TransactionInput": "$types/base.d.ts",
  "TransactionOutput": "$types/base.d.ts",
  "FeeDetails": "$types/base.d.ts",
  "FeeEstimationParams": "$types/base.d.ts",
  "FeeEstimationResult": "$types/base.d.ts",
  "AncestorInfo": "$types/base.d.ts",
  "Config": "$types/base.d.ts",
  "XCPParams": "$types/base.d.ts",
  "WalletDataTypes": "$types/base.d.ts",
  "SUBPROTOCOLS": "$types/base.d.ts",
  "ROOT_DOMAIN_TYPES": "$types/base.d.ts",
  
  // API types -> api.d.ts
  "StampPageProps": "$types/api.d.ts",
  "PaginatedStampResponseBody": "$types/api.d.ts",
  "PaginatedSrc20ResponseBody": "$types/api.d.ts",
  "PaginatedIdResponseBody": "$types/api.d.ts",
  "PaginatedTickResponseBody": "$types/api.d.ts",
  "PaginatedStampBalanceResponseBody": "$types/api.d.ts",
  "PaginatedSrc20BalanceResponseBody": "$types/api.d.ts",
  "PaginatedDispenserResponseBody": "$types/api.d.ts",
  "AddressHandlerContext": "$types/api.d.ts",
  "AddressTickHandlerContext": "$types/api.d.ts",
  "IdentHandlerContext": "$types/api.d.ts",
  "TickHandlerContext": "$types/api.d.ts",
  "BlockHandlerContext": "$types/api.d.ts",
  "BlockInfoResponseBody": "$types/api.d.ts",
  "StampBlockResponseBody": "$types/api.d.ts",
  "DeployResponseBody": "$types/api.d.ts",
  "Src20ResponseBody": "$types/api.d.ts",
  "Src20BalanceResponseBody": "$types/api.d.ts",
  "StampsAndSrc20": "$types/api.d.ts",
  "ApiResponse": "$types/api.d.ts",
  "ApiSuccessResponse": "$types/api.d.ts",
  "ApiErrorResponse": "$types/api.d.ts",
  
  // Wallet types -> wallet.d.ts
  "WalletInfo": "$types/wallet.d.ts",
  "Wallet": "$types/wallet.d.ts",
  "MempoolAddressResponse": "$types/wallet.d.ts",
  "BTCBalanceInfo": "$types/wallet.d.ts",
  "BTCBalanceInfoOptions": "$types/wallet.d.ts",
  "BlockCypherAddressBalanceResponse": "$types/wallet.d.ts",
  "SignPSBTResult": "$types/wallet.d.ts",
  
  // Pagination types -> pagination.d.ts
  "PaginatedResponse": "$types/pagination.d.ts",
  "PaginationProps": "$types/pagination.d.ts",
  "PaginationQueryParams": "$types/pagination.d.ts",
  
  // Error types -> errors.d.ts
  "ValidationError": "$types/errors.d.ts",
  "APIError": "$types/errors.d.ts",
  "BaseError": "$types/errors.d.ts",
  "StampError": "$types/errors.d.ts",
  "SRC20Error": "$types/errors.d.ts",
  "BitcoinError": "$types/errors.d.ts",
  "Result": "$types/errors.d.ts",
  "AsyncResult": "$types/errors.d.ts",
  "ValidationResult": "$types/errors.d.ts",
  
  // Market data types -> marketData.d.ts
  "StampWithMarketData": "$types/marketData.d.ts",
  "SRC20WithMarketData": "$types/marketData.d.ts",
  "CollectionWithMarketData": "$types/marketData.d.ts",
  "MarketDataSource": "$types/marketData.d.ts",
  "CacheStatus": "$types/marketData.d.ts",
  "ExchangeSources": "$types/marketData.d.ts",
  "VolumeSources": "$types/marketData.d.ts",
  "StampMarketDataResponse": "$types/marketData.d.ts",
  "SRC20MarketDataResponse": "$types/marketData.d.ts",
  
  // Utils types -> utils.d.ts
  "DeepPartial": "$types/utils.d.ts",
  "Optional": "$types/utils.d.ts",
  "NonEmptyArray": "$types/utils.d.ts",
  "RequiredKeys": "$types/utils.d.ts",
  "PartialKeys": "$types/utils.d.ts",
  "TypeGuard": "$types/utils.d.ts",
  "ValidationFunction": "$types/utils.d.ts",
  
  // Collection types -> server/types/collection.d.ts
  "Collection": "$server/types/collection.d.ts",
  "CollectionRow": "$server/types/collection.d.ts",
  "CollectionQueryParams": "$server/types/collection.d.ts",
  "CollectionWithOptionalMarketData": "$server/types/collection.d.ts",
  "PaginatedCollectionResponseBody": "$server/types/collection.d.ts",
  "PaginatedCollectionWithMarketDataResponseBody": "$server/types/collection.d.ts",
  
  // Service types -> services.d.ts
  "Dispenser": "$types/services.d.ts",
  "DispenserFilter": "$types/services.d.ts",
  "DispenserStats": "$types/services.d.ts",
  "ServiceConfig": "$types/services.d.ts",
  "ServiceError": "$types/services.d.ts",
  "ServiceResponse": "$types/services.d.ts",
};

// Extract imported types from import statement
function extractImportedTypes(importStatement: string): string[] {
  const types: string[] = [];
  
  // Match import type { ... } from
  const typeImportMatch = importStatement.match(/import\s+type\s*\{([^}]+)\}/);
  if (typeImportMatch) {
    const typeList = typeImportMatch[1];
    types.push(...typeList.split(',').map(t => t.trim()));
  }
  
  // Match import { type ... } from  
  const mixedImportMatch = importStatement.match(/import\s*\{([^}]+)\}/);
  if (mixedImportMatch) {
    const importList = mixedImportMatch[1];
    const typeMatches = importList.match(/type\s+(\w+)/g);
    if (typeMatches) {
      types.push(...typeMatches.map(t => t.replace('type', '').trim()));
    }
  }
  
  return types;
}

// Build new import statements using direct domain strategy
function buildNewImports(types: string[]): Map<string, string[]> {
  const importMap = new Map<string, string[]>();
  
  for (const type of types) {
    const module = TYPE_MAPPING[type];
    if (module) {
      if (!importMap.has(module)) {
        importMap.set(module, []);
      }
      importMap.get(module)!.push(type);
    } else {
      console.warn(yellow(`⚠️  No mapping found for type "${type}"`));
    }
  }
  
  return importMap;
}

// Process a single API route file
async function processFile(filePath: string): Promise<boolean> {
  try {
    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    
    console.log(blue(`\n📄 Processing: ${filePath}`));
    
    // Find all imports from $globals or @/globals
    const importRegex = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+["'](\$globals|@\/globals)["'];?/g;
    const imports = [...content.matchAll(importRegex)];
    
    if (imports.length === 0) {
      console.log(`   ℹ️  No global imports found`);
      return false;
    }
    
    console.log(`   🔍 Found ${imports.length} global import(s) to migrate`);
    
    // Extract all types from all imports
    const allTypes: string[] = [];
    for (const match of imports) {
      const types = extractImportedTypes(match[0]);
      allTypes.push(...types);
      console.log(`   📦 Extracting types: ${types.join(', ')}`);
    }
    
    // Build new imports using direct domain strategy
    const newImports = buildNewImports(allTypes);
    
    console.log(`   ✨ Mapping to ${newImports.size} domain module(s):`);
    for (const [module, types] of newImports) {
      console.log(`      📁 ${module}: ${types.join(', ')}`);
    }
    
    // Remove old imports
    content = content.replace(importRegex, '');
    
    // Build import statements (direct domain imports)
    const importStatements: string[] = [];
    for (const [module, types] of newImports) {
      const sortedTypes = types.sort();
      if (sortedTypes.length === 1) {
        importStatements.push(`import type { ${sortedTypes[0]} } from "${module}";`);
      } else if (sortedTypes.length <= 3) {
        importStatements.push(`import type { ${sortedTypes.join(', ')} } from "${module}";`);
      } else {
        importStatements.push(`import type {\n  ${sortedTypes.join(',\n  ')},\n} from "${module}";`);
      }
    }
    
    // Find where to insert new imports
    const firstImportMatch = content.match(/^import\s+/m);
    if (firstImportMatch && firstImportMatch.index !== undefined) {
      // Insert before first existing import
      const insertPosition = firstImportMatch.index;
      content = content.slice(0, insertPosition) + 
                importStatements.join('\n') + '\n' +
                content.slice(insertPosition);
    } else {
      // No imports found, add at the beginning after any comments
      const shebangMatch = content.match(/^#!/);
      const insertPosition = shebangMatch ? content.indexOf('\n') + 1 : 0;
      content = content.slice(0, insertPosition) + 
                importStatements.join('\n') + '\n\n' +
                content.slice(insertPosition);
    }
    
    // Clean up multiple consecutive blank lines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Write back if changed
    if (content !== originalContent) {
      await Deno.writeTextFile(filePath, content);
      console.log(green(`   ✅ Successfully migrated!`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(red(`   ❌ Error processing ${filePath}: ${error.message}`));
    return false;
  }
}

// Main function
async function main() {
  console.log(blue("🚀 Migrating API route imports from globals.d.ts to domain modules"));
  console.log(blue("📋 Using direct domain import strategy (recommended by orchestrator)\n"));
  
  let totalFiles = 0;
  let updatedFiles = 0;
  const updatedFilesList: string[] = [];
  
  // Process .ts files in routes/api directory
  for await (const entry of walk("./routes/api", {
    exts: [".ts"],
    skip: [/node_modules/, /\.git/, /\.test\./, /\.spec\./],
  })) {
    totalFiles++;
    if (await processFile(entry.path)) {
      updatedFiles++;
      updatedFilesList.push(entry.path);
    }
  }
  
  console.log(blue("\n" + "=".repeat(60)));
  console.log(green("🎉 API Route Migration Complete!"));
  console.log(`📊 Total files scanned: ${totalFiles}`);
  console.log(`✅ Files updated: ${updatedFiles}`);
  
  if (updatedFilesList.length > 0) {
    console.log(blue("\n📁 Updated files:"));
    updatedFilesList.forEach(file => console.log(`   • ${file}`));
  }
  
  console.log(blue("\n🏗️  Architecture: Direct domain imports strategy applied"));
  console.log(blue("🔗 Import pattern: $types/domain.d.ts (not centralized index)"));
  console.log(blue("=" + "=".repeat(59)));
}

// Run the migration
if (import.meta.main) {
  await main();
}