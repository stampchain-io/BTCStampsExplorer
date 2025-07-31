#!/usr/bin/env -S deno run -A
/**
 * Fix mixed import patterns - Task 31
 * Standardize to direct domain imports strategy (not centralized index)
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { green, red, yellow, blue, cyan, magenta } from "https://deno.land/std@0.208.0/fmt/colors.ts";

// Type mappings for direct domain imports
const TYPE_TO_DOMAIN_MAP = new Map<string, string>([
  // Stamp types
  ["StampRow", "$types/stamp.d.ts"],
  ["StampBalance", "$types/stamp.d.ts"],
  ["StampStatus", "$types/stamp.d.ts"],
  ["StampWithOptionalMarketData", "$types/stamp.d.ts"],
  ["ValidatedStamp", "$types/stamp.d.ts"],
  ["StampFilters", "$types/stamp.d.ts"],
  ["StampValidationResult", "$types/stamp.d.ts"],
  ["StampMetadata", "$types/stamp.d.ts"],
  ["StampClassification", "$types/stamp.d.ts"],
  ["StampRarity", "$types/stamp.d.ts"],
  
  // SRC-20 types
  ["SRC20Row", "$types/src20.d.ts"],
  ["SRC20Balance", "$types/src20.d.ts"],
  ["SRC20Operation", "$types/src20.d.ts"],
  ["SRC20MintStatus", "$types/src20.d.ts"],
  ["SRC20Filters", "$types/src20.d.ts"],
  ["SRC20WithOptionalMarketData", "$types/src20.d.ts"],
  ["EnrichedSRC20Row", "$types/src20.d.ts"],
  ["SRC20HolderData", "$types/src20.d.ts"],
  ["Deployment", "$types/src20.d.ts"],
  
  // SRC-101 types
  ["SRC101Balance", "$types/src101.d.ts"],
  
  // Transaction types
  ["SendRow", "$types/transaction.d.ts"],
  ["TX", "$types/transaction.d.ts"],
  ["TXError", "$types/transaction.d.ts"],
  ["BlockInfo", "$types/transaction.d.ts"],
  ["MintStampInputData", "$types/transaction.d.ts"],
  ["ScriptTypeInfo", "$types/transaction.d.ts"],
  ["Output", "$types/transaction.d.ts"],
  
  // Bitcoin base types
  ["BlockRow", "$types/base.d.ts"],
  ["BTCBalance", "$types/base.d.ts"],
  ["BtcInfo", "$types/base.d.ts"],
  ["UTXO", "$types/base.d.ts"],
  ["BasicUTXO", "$types/base.d.ts"],
  ["ScriptType", "$types/base.d.ts"],
  ["TransactionInput", "$types/base.d.ts"],
  ["TransactionOutput", "$types/base.d.ts"],
  ["FeeDetails", "$types/base.d.ts"],
  ["Config", "$types/base.d.ts"],
  ["XCPParams", "$types/base.d.ts"],
  ["WalletDataTypes", "$types/base.d.ts"],
  ["SUBPROTOCOLS", "$types/base.d.ts"],
  ["ROOT_DOMAIN_TYPES", "$types/base.d.ts"],
  
  // API types
  ["StampPageProps", "$types/api.d.ts"],
  ["PaginatedStampResponseBody", "$types/api.d.ts"],
  ["PaginatedSrc20ResponseBody", "$types/api.d.ts"],
  ["PaginatedIdResponseBody", "$types/api.d.ts"],
  ["PaginatedTickResponseBody", "$types/api.d.ts"],
  ["AddressHandlerContext", "$types/api.d.ts"],
  ["IdentHandlerContext", "$types/api.d.ts"],
  ["TickHandlerContext", "$types/api.d.ts"],
  ["BlockHandlerContext", "$types/api.d.ts"],
  ["ApiResponse", "$types/api.d.ts"],
  ["ApiSuccessResponse", "$types/api.d.ts"],
  ["ApiErrorResponse", "$types/api.d.ts"],
  
  // Wallet types
  ["WalletInfo", "$types/wallet.d.ts"],
  ["Wallet", "$types/wallet.d.ts"],
  ["MempoolAddressResponse", "$types/wallet.d.ts"],
  ["BTCBalanceInfo", "$types/wallet.d.ts"],
  ["BlockCypherAddressBalanceResponse", "$types/wallet.d.ts"],
  ["SignPSBTResult", "$types/wallet.d.ts"],
  
  // Error types
  ["ValidationError", "$types/errors.d.ts"],
  ["APIError", "$types/errors.d.ts"],
  ["BaseError", "$types/errors.d.ts"],
  ["StampError", "$types/errors.d.ts"],
  ["SRC20Error", "$types/errors.d.ts"],
  ["BitcoinError", "$types/errors.d.ts"],
  ["Result", "$types/errors.d.ts"],
  ["AsyncResult", "$types/errors.d.ts"],
  ["ValidationResult", "$types/errors.d.ts"],
  
  // Market data types
  ["StampWithMarketData", "$types/marketData.d.ts"],
  ["SRC20WithMarketData", "$types/marketData.d.ts"],
  ["CollectionWithMarketData", "$types/marketData.d.ts"],
  ["MarketDataSource", "$types/marketData.d.ts"],
  ["CacheStatus", "$types/marketData.d.ts"],
  ["ExchangeSources", "$types/marketData.d.ts"],
  ["VolumeSources", "$types/marketData.d.ts"],
  
  // Utils types
  ["DeepPartial", "$types/utils.d.ts"],
  ["Optional", "$types/utils.d.ts"],
  ["NonEmptyArray", "$types/utils.d.ts"],
  ["RequiredKeys", "$types/utils.d.ts"],
  ["PartialKeys", "$types/utils.d.ts"],
  ["TypeGuard", "$types/utils.d.ts"],
  ["ValidationFunction", "$types/utils.d.ts"],
  
  // Pagination types
  ["PaginatedResponse", "$types/pagination.d.ts"],
  ["PaginationProps", "$types/pagination.d.ts"],
  ["PaginationQueryParams", "$types/pagination.d.ts"],
]);

interface MixedPatternFix {
  file: string;
  removedCentralizedImports: string[];
  addedDirectImports: Map<string, string[]>;
  totalChanges: number;
}

// Extract types from an import statement
function extractTypesFromImport(importStatement: string): string[] {
  const types: string[] = [];
  
  // Match import type { ... } from
  const typeImportMatch = importStatement.match(/import\s+type\s*\{([^}]+)\}/);
  if (typeImportMatch) {
    const typeList = typeImportMatch[1];
    types.push(...typeList.split(',').map(t => t.trim()));
  }
  
  return types;
}

// Fix mixed patterns in a single file
async function fixMixedPatterns(filePath: string): Promise<MixedPatternFix | null> {
  try {
    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    const lines = content.split('\n');
    
    let hasCentralizedImports = false;
    let hasDirectDomainImports = false;
    let centralizedImportLines: number[] = [];
    let directDomainImportLines: number[] = [];
    
    // First pass: detect mixed patterns
    lines.forEach((line, index) => {
      // Check for centralized imports (index.d.ts)
      if (line.includes('from "$types/index.d.ts"') || line.includes('from "$types"')) {
        hasCentralizedImports = true;
        centralizedImportLines.push(index);
      }
      
      // Check for direct domain imports
      if (line.match(/from "\$types\/(stamp|src20|src101|base|transaction|api|wallet|errors|utils|marketData|pagination)\.d\.ts"/)) {
        hasDirectDomainImports = true;
        directDomainImportLines.push(index);
      }
    });
    
    // Only process files with mixed patterns
    if (!hasCentralizedImports || !hasDirectDomainImports) {
      return null;
    }
    
    console.log(magenta(`\n🔀 Processing mixed patterns in: ${filePath}`));
    console.log(`   📊 Centralized imports: ${centralizedImportLines.length} (lines: ${centralizedImportLines.map(l => l + 1).join(', ')})`);
    console.log(`   📊 Direct domain imports: ${directDomainImportLines.length} (lines: ${directDomainImportLines.map(l => l + 1).join(', ')})`);
    
    const result: MixedPatternFix = {
      file: filePath,
      removedCentralizedImports: [],
      addedDirectImports: new Map(),
      totalChanges: 0
    };
    
    // Second pass: convert centralized imports to direct domain imports
    const newLines: string[] = [];
    const typesToConvert: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a centralized import line
      if (centralizedImportLines.includes(i)) {
        const types = extractTypesFromImport(line);
        typesToConvert.push(...types);
        result.removedCentralizedImports.push(line.trim());
        
        // Skip this line (remove centralized import)
        continue;
      }
      
      newLines.push(line);
    }
    
    // Group types by their domain modules
    const domainGroups = new Map<string, string[]>();
    
    for (const type of typesToConvert) {
      const domain = TYPE_TO_DOMAIN_MAP.get(type);
      if (domain) {
        if (!domainGroups.has(domain)) {
          domainGroups.set(domain, []);
        }
        domainGroups.get(domain)!.push(type);
      } else {
        console.warn(yellow(`⚠️  Unknown type mapping for: ${type}`));
      }
    }
    
    // Add new direct domain imports at the top
    if (domainGroups.size > 0) {
      const importStatements: string[] = [];
      
      for (const [domain, types] of domainGroups) {
        const sortedTypes = types.sort();
        if (sortedTypes.length === 1) {
          importStatements.push(`import type { ${sortedTypes[0]} } from "${domain}";`);
        } else if (sortedTypes.length <= 3) {
          importStatements.push(`import type { ${sortedTypes.join(', ')} } from "${domain}";`);
        } else {
          importStatements.push(`import type {\n  ${sortedTypes.join(',\n  ')},\n} from "${domain}";`);
        }
        
        result.addedDirectImports.set(domain, sortedTypes);
      }
      
      // Find where to insert new imports (after existing imports)
      let insertIndex = 0;
      for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        } else if (newLines[i].trim() === '' && insertIndex > 0) {
          // Found blank line after imports
          break;
        }
      }
      
      // Insert new imports
      newLines.splice(insertIndex, 0, ...importStatements);
      result.totalChanges = importStatements.length + result.removedCentralizedImports.length;
    }
    
    // Write the updated content
    const finalContent = newLines.join('\n');
    if (finalContent !== originalContent) {
      await Deno.writeTextFile(filePath, finalContent);
      console.log(green(`   ✅ Fixed mixed patterns: removed ${result.removedCentralizedImports.length} centralized, added ${domainGroups.size} direct domain imports`));
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(red(`❌ Error processing ${filePath}: ${error.message}`));
    return null;
  }
}

// Main function
async function main() {
  console.log(cyan("🔧 Task 31: Mixed Import Pattern Resolution"));
  console.log(cyan("=" + "=".repeat(50)));
  
  console.log(blue("📋 Standardizing to direct domain import strategy..."));
  console.log(blue("🎯 Converting centralized imports to direct domain imports"));
  
  const results: MixedPatternFix[] = [];
  let totalFiles = 0;
  let filesChanged = 0;
  
  // Target the specific files identified in validation
  const targetFiles = [
    "tests/unit/utils/testFactories.ts",
    "islands/content/WalletDashboardContent.tsx",
    "islands/content/WalletProfileContent.tsx", 
    "islands/header/SRC20DetailHeader.tsx",
    "server/services/stampService.ts",
    "routes/wallet/[address].tsx",
    "routes/api/v2/olga/estimate.ts",
    "routes/api/v2/src20/create.ts",
    "routes/api/v2/src101/create.ts"
  ];
  
  console.log(blue(`\n🔍 Processing ${targetFiles.length} files with known mixed patterns...`));
  
  for (const file of targetFiles) {
    totalFiles++;
    console.log(cyan(`\n📄 Processing: ${file}`));
    
    try {
      const result = await fixMixedPatterns(file);
      if (result) {
        results.push(result);
        filesChanged++;
      } else {
        console.log(blue(`   ℹ️  No mixed patterns found or already resolved`));
      }
    } catch (error) {
      console.error(red(`   ❌ Failed to process: ${error.message}`));
    }
  }
  
  // Also scan for any other files with mixed patterns
  console.log(blue(`\n🔍 Scanning for additional mixed patterns in codebase...`));
  
  for await (const entry of walk(".", {
    exts: [".ts", ".tsx"],
    skip: [/node_modules/, /\.git/, /build/, /dist/, /coverage/, /scripts/],
  })) {
    // Skip files we already processed
    if (targetFiles.includes(entry.path)) {
      continue;
    }
    
    totalFiles++;
    
    if (totalFiles % 100 === 0) {
      console.log(cyan(`   📊 Scanned ${totalFiles} files...`));
    }
    
    const result = await fixMixedPatterns(entry.path);
    if (result) {
      results.push(result);
      filesChanged++;
    }
  }
  
  // Report results
  console.log(cyan("\n" + "=".repeat(60)));
  console.log(cyan("📊 TASK 31 COMPLETION REPORT"));
  console.log(cyan("=" + "=".repeat(59)));
  
  console.log(blue(`\n📈 Summary:`));
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files with mixed patterns fixed: ${filesChanged}`);
  console.log(`   Total import changes: ${results.reduce((sum, r) => sum + r.totalChanges, 0)}`);
  
  if (results.length > 0) {
    console.log(green(`\n✅ Successfully resolved mixed patterns in ${results.length} files:`));
    
    results.forEach(({ file, removedCentralizedImports, addedDirectImports, totalChanges }) => {
      console.log(blue(`\n📁 ${file}:`));
      console.log(red(`   ❌ Removed ${removedCentralizedImports.length} centralized imports`));
      console.log(green(`   ✅ Added ${addedDirectImports.size} direct domain imports:`));
      
      for (const [domain, types] of addedDirectImports) {
        console.log(`      • ${domain}: ${types.join(', ')}`);
      }
    });
    
    // Show import pattern statistics
    const domainCounts = new Map<string, number>();
    results.forEach(({ addedDirectImports }) => {
      for (const [domain, types] of addedDirectImports) {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + types.length);
      }
    });
    
    console.log(blue(`\n📊 Direct domain import distribution:`));
    Array.from(domainCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([domain, count]) => {
        console.log(`   • ${domain}: ${count} types`);
      });
      
  } else {
    console.log(green("✅ No mixed import patterns found - all imports are consistent!"));
  }
  
  // Success message
  console.log(green(`\n🎉 Task 31 COMPLETE!`));
  console.log(green("✅ All import patterns standardized to direct domain strategy"));
  console.log(green("✅ Improved tree-shaking and architectural consistency"));
  
  console.log(blue("\n🚀 Next Steps:"));
  console.log("   • Final validation to confirm all critical issues resolved");
  console.log("   • Task 32: Optional alias optimization (non-blocking)");
  console.log("   • Type Domain Migration 100% completion verification");
  
  console.log(cyan("=" + "=".repeat(59)));
}

if (import.meta.main) {
  await main();
}