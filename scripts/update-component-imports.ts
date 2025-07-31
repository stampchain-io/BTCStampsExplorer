#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Script to update component imports from globals.d.ts to domain-specific modules
 * Uses ts-morph to parse and transform TypeScript/TSX files
 * 
 * Usage: deno run --allow-read --allow-write scripts/update-component-imports.ts [--dry-run]
 */

import { Project, SourceFile, ImportDeclaration, Node } from "https://deno.land/x/ts_morph@20.0.0/mod.ts";
import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { green, yellow, red, blue } from "https://deno.land/std@0.208.0/fmt/colors.ts";

// Type mapping from globals.d.ts to domain modules
const TYPE_MAPPING: Record<string, { module: string; isType: boolean }> = {
  // Stamp types
  "StampRow": { module: "@/lib/types/stamp.d.ts", isType: true },
  "StampBalance": { module: "@/lib/types/stamp.d.ts", isType: true },
  "StampFilters": { module: "@/lib/types/stamp.d.ts", isType: true },
  "StampMetadata": { module: "@/lib/types/stamp.d.ts", isType: true },
  "StampValidationResult": { module: "@/lib/types/stamp.d.ts", isType: true },
  "StampWithOptionalMarketData": { module: "@/lib/types/stamp.d.ts", isType: true },
  "ValidatedStamp": { module: "@/lib/types/stamp.d.ts", isType: true },
  "STAMP_TYPES": { module: "@/lib/types/stamp.d.ts", isType: true },
  "STAMP_FILTER_TYPES": { module: "@/lib/types/stamp.d.ts", isType: true },
  "STAMP_MARKETPLACE": { module: "@/lib/types/stamp.d.ts", isType: true },
  
  // SRC-20 types
  "SRC20Row": { module: "@/lib/types/src20.d.ts", isType: true },
  "EnrichedSRC20Row": { module: "@/lib/types/src20.d.ts", isType: true },
  "SRC20Balance": { module: "@/lib/types/src20.d.ts", isType: true },
  "SRC20Filters": { module: "@/lib/types/src20.d.ts", isType: true },
  "SRC20WithOptionalMarketData": { module: "@/lib/types/src20.d.ts", isType: true },
  "Deployment": { module: "@/lib/types/src20.d.ts", isType: true },
  "MintStatus": { module: "@/lib/types/src20.d.ts", isType: true },
  "SRC20_TYPES": { module: "@/lib/types/src20.d.ts", isType: true },
  "SRC20_FILTER_TYPES": { module: "@/lib/types/src20.d.ts", isType: true },
  
  // API types
  "PaginatedStampResponseBody": { module: "@/lib/types/api.d.ts", isType: true },
  "PaginatedSrc20ResponseBody": { module: "@/lib/types/api.d.ts", isType: true },
  "StampPageProps": { module: "@/lib/types/api.d.ts", isType: true },
  "StampsAndSrc20": { module: "@/lib/types/api.d.ts", isType: true },
  
  // UI Component types
  "StampGalleryProps": { module: "@/lib/types/ui.d.ts", isType: true },
  "CollectionGalleryProps": { module: "@/lib/types/ui.d.ts", isType: true },
  "ButtonProps": { module: "@/lib/types/ui.d.ts", isType: true },
  "InputProps": { module: "@/lib/types/ui.d.ts", isType: true },
  "SelectProps": { module: "@/lib/types/ui.d.ts", isType: true },
  "TableProps": { module: "@/lib/types/ui.d.ts", isType: true },
  "Theme": { module: "@/lib/types/ui.d.ts", isType: true },
  
  // Base types
  "BlockRow": { module: "@/lib/types/base.d.ts", isType: true },
  "SUBPROTOCOLS": { module: "@/lib/types/base.d.ts", isType: true },
  "BTCBalance": { module: "@/lib/types/base.d.ts", isType: true },
  "UTXO": { module: "@/lib/types/base.d.ts", isType: true },
  
  // Transaction types
  "SendRow": { module: "@/lib/types/transaction.d.ts", isType: true },
  "TX": { module: "@/lib/types/transaction.d.ts", isType: true },
  "TXError": { module: "@/lib/types/transaction.d.ts", isType: true },
  
  // Wallet types
  "WalletInfo": { module: "@/lib/types/wallet.d.ts", isType: true },
  "BTCBalanceInfo": { module: "@/lib/types/wallet.d.ts", isType: true },
  
  // Market data types
  "StampWithMarketData": { module: "@/lib/types/marketData.d.ts", isType: true },
  "SRC20WithMarketData": { module: "@/lib/types/marketData.d.ts", isType: true },
  "CacheStatus": { module: "@/lib/types/marketData.d.ts", isType: true },
  
  // Collection types (temporary - might need updating)
  "Collection": { module: "@/lib/types/stamp.d.ts", isType: true }, // Or create collection.d.ts
  "CollectionRow": { module: "@/lib/types/stamp.d.ts", isType: true },
  
  // Pagination types
  "Pagination": { module: "@/lib/types/pagination.d.ts", isType: true },
  "PaginationProps": { module: "@/lib/types/pagination.d.ts", isType: true },
  "PaginationState": { module: "@/lib/types/pagination.d.ts", isType: true },
  
  // Service types
  "Dispenser": { module: "@/lib/types/services.d.ts", isType: true },
  "DispenserFilter": { module: "@/lib/types/services.d.ts", isType: true },
};

interface UpdateResult {
  file: string;
  importsBefore: number;
  importsAfter: number;
  typesUpdated: string[];
  errors: string[];
}

interface UpdateOptions {
  dryRun: boolean;
  verbose: boolean;
}

function updateImportsInFile(sourceFile: SourceFile, options: UpdateOptions): UpdateResult {
  const result: UpdateResult = {
    file: sourceFile.getFilePath(),
    importsBefore: 0,
    importsAfter: 0,
    typesUpdated: [],
    errors: [],
  };

  try {
    // Find all import declarations from globals
    const globalImports = sourceFile.getImportDeclarations()
      .filter(imp => {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        return moduleSpecifier === "$globals" || 
               moduleSpecifier === "../../globals" ||
               moduleSpecifier === "../globals" ||
               moduleSpecifier.endsWith("/globals.d.ts");
      });

    result.importsBefore = globalImports.length;

    // Process each global import
    for (const importDecl of globalImports) {
      const namedImports = importDecl.getNamedImports();
      
      // Group imports by target module
      const importsByModule = new Map<string, { names: string[]; isTypeOnly: boolean }>();
      
      for (const namedImport of namedImports) {
        const importName = namedImport.getName();
        const mapping = TYPE_MAPPING[importName];
        
        if (mapping) {
          if (!importsByModule.has(mapping.module)) {
            importsByModule.set(mapping.module, { names: [], isTypeOnly: mapping.isType });
          }
          importsByModule.get(mapping.module)!.names.push(importName);
          result.typesUpdated.push(importName);
        } else {
          result.errors.push(`No mapping found for type: ${importName}`);
        }
      }
      
      // Create new import declarations
      if (importsByModule.size > 0) {
        const importStatements: string[] = [];
        
        for (const [module, { names, isTypeOnly }] of importsByModule) {
          const sortedNames = names.sort();
          const importKeyword = isTypeOnly ? "import type" : "import";
          
          if (sortedNames.length === 1) {
            importStatements.push(`${importKeyword} { ${sortedNames[0]} } from "${module}";`);
          } else {
            const formattedNames = sortedNames.join(", ");
            importStatements.push(`${importKeyword} { ${formattedNames} } from "${module}";`);
          }
        }
        
        // Replace the old import with new ones
        if (!options.dryRun) {
          const index = importDecl.getChildIndex();
          const parent = importDecl.getParent();
          
          // Remove old import
          importDecl.remove();
          
          // Add new imports at the same position
          for (let i = importStatements.length - 1; i >= 0; i--) {
            parent.insertStatements(index, importStatements[i]);
          }
          
          result.importsAfter += importStatements.length;
        } else {
          result.importsAfter += importStatements.length;
        }
      }
    }
    
    // Save the file if not in dry-run mode
    if (!options.dryRun && result.importsBefore > 0) {
      sourceFile.saveSync();
    }
    
  } catch (error) {
    result.errors.push(`Error processing file: ${error.message}`);
  }
  
  return result;
}

async function main() {
  const args = parse(Deno.args, {
    boolean: ["dry-run", "verbose", "help"],
    alias: { d: "dry-run", v: "verbose", h: "help" },
  });

  if (args.help) {
    console.log(`
Update Component Imports Script

Updates import statements in React component files from globals.d.ts to domain-specific modules.

Usage:
  deno run --allow-read --allow-write scripts/update-component-imports.ts [options]

Options:
  --dry-run, -d    Preview changes without modifying files
  --verbose, -v    Show detailed output for each file
  --help, -h       Show this help message

Example:
  deno run --allow-read --allow-write scripts/update-component-imports.ts --dry-run
    `);
    Deno.exit(0);
  }

  const options: UpdateOptions = {
    dryRun: args["dry-run"] || false,
    verbose: args.verbose || false,
  };

  console.log(blue("🔄 Starting component import updates..."));
  if (options.dryRun) {
    console.log(yellow("🔍 Running in dry-run mode - no files will be modified"));
  }

  // Create ts-morph project
  const project = new Project({
    compilerOptions: {
      jsx: "react-jsx",
      jsxImportSource: "preact",
      target: "ES2022",
      module: "ES2022",
      moduleResolution: "bundler",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
    },
  });

  // Add source files - search in current directory
  const sourceFiles = project.addSourceFilesAtPaths([
    "./components/**/*.ts",
    "./components/**/*.tsx", 
    "./islands/**/*.ts",
    "./islands/**/*.tsx",
  ]);

  console.log(`📁 Found ${sourceFiles.length} component files to process`);

  const results: UpdateResult[] = [];
  let totalUpdated = 0;
  let totalErrors = 0;

  // Process each file
  for (const sourceFile of sourceFiles) {
    const result = updateImportsInFile(sourceFile, options);
    results.push(result);

    if (result.importsBefore > 0) {
      totalUpdated++;
      
      if (options.verbose || result.errors.length > 0) {
        console.log(`\n📄 ${result.file}`);
        console.log(`   Imports: ${result.importsBefore} → ${result.importsAfter}`);
        
        if (result.typesUpdated.length > 0) {
          console.log(`   Types updated: ${green(result.typesUpdated.join(", "))}`);
        }
        
        if (result.errors.length > 0) {
          totalErrors += result.errors.length;
          for (const error of result.errors) {
            console.log(`   ${red("Error:")} ${error}`);
          }
        }
      }
    }
  }

  // Summary
  console.log("\n" + blue("📊 Summary:"));
  console.log(`   Files processed: ${sourceFiles.length}`);
  console.log(`   Files updated: ${totalUpdated}`);
  console.log(`   Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log(yellow("\n⚠️  Some types could not be mapped. Please update TYPE_MAPPING."));
  }

  if (options.dryRun) {
    console.log(yellow("\n🔍 Dry-run complete. Run without --dry-run to apply changes."));
  } else {
    console.log(green("\n✅ Import updates complete!"));
  }

  // Exit with error code if there were errors
  if (totalErrors > 0) {
    Deno.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  main().catch((error) => {
    console.error(red("Fatal error:"), error);
    Deno.exit(1);
  });
}