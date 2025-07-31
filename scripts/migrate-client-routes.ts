#!/usr/bin/env -S deno run -A
/**
 * Script to migrate client-side route imports from globals.d.ts to domain modules
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, red, yellow } from "https://deno.land/std@0.208.0/fmt/colors.ts";

// Type mappings from globals.d.ts to domain modules
const TYPE_MAPPING: Record<string, string> = {
  // Core stamp types
  "StampRow": "$types/stamp.d.ts",
  "StampBalance": "$types/stamp.d.ts",
  "StampStatus": "$types/stamp.d.ts",
  "StampTransactionType": "$types/stamp.d.ts",
  "StampWithOptionalMarketData": "$types/stamp.d.ts",
  "ValidatedStamp": "$types/stamp.d.ts",
  "StampFilters": "$types/stamp.d.ts",
  "StampValidationResult": "$types/stamp.d.ts",
  "StampMetadata": "$types/stamp.d.ts",
  "StampClassification": "$types/stamp.d.ts",
  "StampRarity": "$types/stamp.d.ts",
  "STAMP_TYPES": "$types/stamp.d.ts",
  "STAMP_FILTER_TYPES": "$types/stamp.d.ts",
  "STAMP_MARKETPLACE": "$types/stamp.d.ts",
  
  // SRC-20 types
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
  "PaginatedSRC20WithMarketDataResponse": "$types/src20.d.ts",
  "SRC20_TYPES": "$types/src20.d.ts",
  "SRC20_STATUS": "$types/src20.d.ts",
  "SRC20_FILTER_TYPES": "$types/src20.d.ts",
  "SRC20_MARKET": "$types/src20.d.ts",
  "SRC20_DETAILS": "$types/src20.d.ts",
  "Deployment": "$types/src20.d.ts",
  
  // SRC-101 types
  "SRC101Balance": "$types/src101.d.ts",
  
  // Transaction types
  "SendRow": "$types/transaction.d.ts",
  "TX": "$types/transaction.d.ts",
  "TXError": "$types/transaction.d.ts",
  "BlockInfo": "$types/transaction.d.ts",
  "MintStampInputData": "$types/transaction.d.ts",
  "ScriptTypeInfo": "$types/transaction.d.ts",
  "Output": "$types/transaction.d.ts",
  
  // Bitcoin base types
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
  
  // API types
  "StampPageProps": "$types/api.d.ts",
  "PaginatedStampResponseBody": "$types/api.d.ts",
  "PaginatedSrc20ResponseBody": "$types/api.d.ts",
  "PaginatedIdResponseBody": "$types/api.d.ts",
  "PaginatedTickResponseBody": "$types/api.d.ts",
  "AddressHandlerContext": "$types/api.d.ts",
  "IdentHandlerContext": "$types/api.d.ts",
  "TickHandlerContext": "$types/api.d.ts",
  "BlockHandlerContext": "$types/api.d.ts",
  "BlockInfoResponseBody": "$types/api.d.ts",
  "StampBlockResponseBody": "$types/api.d.ts",
  "PaginatedDispenserResponseBody": "$types/api.d.ts",
  "StampsAndSrc20": "$types/api.d.ts",
  
  // Wallet types
  "WalletInfo": "$types/wallet.d.ts",
  "Wallet": "$types/wallet.d.ts",
  "WalletData": "$types/wallet.d.ts",
  "MempoolAddressResponse": "$types/wallet.d.ts",
  "BTCBalanceInfo": "$types/wallet.d.ts",
  "BlockCypherAddressBalanceResponse": "$types/wallet.d.ts",
  
  // UI types
  "StampGalleryProps": "$types/ui.d.ts",
  "CollectionGalleryProps": "$types/ui.d.ts",
  "PaginationProps": "$types/ui.d.ts",
  "TableProps": "$types/ui.d.ts",
  "TableColumn": "$types/ui.d.ts",
  "ButtonProps": "$types/ui.d.ts",
  "InputProps": "$types/ui.d.ts",
  "SelectProps": "$types/ui.d.ts",
  "TextareaProps": "$types/ui.d.ts",
  "SRC20CardProps": "$types/ui.d.ts",
  "BaseComponentProps": "$types/ui.d.ts",
  "ComponentWithChildren": "$types/ui.d.ts",
  "FlexboxProps": "$types/ui.d.ts",
  "GridProps": "$types/ui.d.ts",
  "ContainerProps": "$types/ui.d.ts",
  "ResponsiveProps": "$types/ui.d.ts",
  "ResponsiveValue": "$types/ui.d.ts",
  
  // Pagination types
  "PaginatedResponse": "$types/pagination.d.ts",
  "PaginationQueryParams": "$types/pagination.d.ts",
  
  // Error types
  "ValidationError": "$types/errors.d.ts",
  "APIError": "$types/errors.d.ts",
  "BaseError": "$types/errors.d.ts",
  "StampError": "$types/errors.d.ts",
  "SRC20Error": "$types/errors.d.ts",
  "BitcoinError": "$types/errors.d.ts",
  "ApiResponse": "$types/errors.d.ts",
  "ApiErrorResponse": "$types/errors.d.ts",
  "ApiSuccessResponse": "$types/errors.d.ts",
  "Result": "$types/errors.d.ts",
  "AsyncResult": "$types/errors.d.ts",
  
  // Market data types
  "StampWithMarketData": "$types/marketData.d.ts",
  "SRC20WithMarketData": "$types/marketData.d.ts",
  "CollectionWithMarketData": "$types/marketData.d.ts",
  "MarketDataSource": "$types/marketData.d.ts",
  "CacheStatus": "$types/marketData.d.ts",
  "ExchangeSources": "$types/marketData.d.ts",
  "VolumeSources": "$types/marketData.d.ts",
  
  // Utils types
  "DeepPartial": "$types/utils.d.ts",
  "Optional": "$types/utils.d.ts",
  "NonEmptyArray": "$types/utils.d.ts",
  "RequiredKeys": "$types/utils.d.ts",
  "PartialKeys": "$types/utils.d.ts",
  
  // Collection types (from globals)
  "Collection": "$server/types/collection.d.ts",
  "CollectionRow": "$server/types/collection.d.ts",
  "CollectionQueryParams": "$server/types/collection.d.ts",
  "CollectionWithOptionalMarketData": "$server/types/collection.d.ts",
  "PaginatedCollectionResponseBody": "$server/types/collection.d.ts",
  "PaginatedCollectionWithMarketDataResponseBody": "$server/types/collection.d.ts",
};

// Parse TypeScript imports and extract types
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

// Build new import statements from type mappings
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
      console.warn(yellow(`Warning: No mapping found for type "${type}"`));
    }
  }
  
  return importMap;
}

// Process a single file
async function processFile(filePath: string): Promise<boolean> {
  try {
    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    
    // Find all imports from $globals
    const importRegex = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+["'](\$globals|@\/globals)["'];?/g;
    const imports = [...content.matchAll(importRegex)];
    
    if (imports.length === 0) {
      return false;
    }
    
    console.log(`\nProcessing: ${filePath}`);
    
    // Extract all types from all imports
    const allTypes: string[] = [];
    for (const match of imports) {
      const types = extractImportedTypes(match[0]);
      allTypes.push(...types);
    }
    
    // Build new imports
    const newImports = buildNewImports(allTypes);
    
    // Remove old imports
    content = content.replace(importRegex, '');
    
    // Build import statements
    const importStatements: string[] = [];
    for (const [module, types] of newImports) {
      const sortedTypes = types.sort();
      if (sortedTypes.length === 1) {
        importStatements.push(`import type { ${sortedTypes[0]} } from "${module}";`);
      } else {
        importStatements.push(`import type {\n  ${sortedTypes.join(',\n  ')}\n} from "${module}";`);
      }
    }
    
    // Find where to insert new imports
    const firstImportMatch = content.match(/^import\s+/m);
    if (firstImportMatch && firstImportMatch.index !== undefined) {
      // Insert at the position of first import
      const insertPosition = firstImportMatch.index;
      content = content.slice(0, insertPosition) + 
                importStatements.join('\n') + '\n' +
                content.slice(insertPosition);
    } else {
      // No imports found, add at the beginning
      content = importStatements.join('\n') + '\n\n' + content;
    }
    
    // Clean up multiple consecutive blank lines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Write back if changed
    if (content !== originalContent) {
      await Deno.writeTextFile(filePath, content);
      console.log(green(`✓ Updated ${filePath}`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(red(`Error processing ${filePath}: ${error.message}`));
    return false;
  }
}

// Main function
async function main() {
  console.log("Migrating client-side route imports from globals.d.ts to domain modules...\n");
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  // Process .tsx files in routes directory
  for await (const entry of walk("./routes", {
    exts: [".tsx"],
    skip: [/node_modules/, /\.git/],
  })) {
    totalFiles++;
    if (await processFile(entry.path)) {
      updatedFiles++;
    }
  }
  
  console.log(`\n${green("Migration complete!")}`);
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files updated: ${updatedFiles}`);
}

// Run the migration
if (import.meta.main) {
  await main();
}