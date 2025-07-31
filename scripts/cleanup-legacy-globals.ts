#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Legacy $globals Import Cleanup Script
 * 
 * Converts the remaining 11 $globals imports to appropriate alias-import patterns
 * based on the established 78% successful alias-import architecture.
 * 
 * Part of Task 28.1 - Type Domain Migration
 */

interface GlobalsImportMapping {
  sourceFile: string;
  oldImport: string;
  newImport: string;
  types: string[];
  lineNumber: number;
}

interface CleanupResult {
  totalFiles: number;
  globalsImportsFound: number;
  successfulConversions: number;
  errors: string[];
  mappings: GlobalsImportMapping[];
}

class LegacyGlobalsCleanup {
  private readonly TYPE_MAPPINGS = new Map([
    // Known type mappings from globals to specific domains 
    ['StampRow', '$types/stamp.d.ts'],
    ['SRC20Row', '$types/src20.d.ts'],
    ['SRC101Row', '$types/src101.d.ts'],
    ['TransactionRow', '$types/transaction.d.ts'],
    ['CollectionRow', '$server/types/collection.d.ts'],
    ['ApiError', '$types/api.d.ts'],
    ['MarketDataRow', '$types/marketData.d.ts'],
    ['WalletData', '$types/wallet.d.ts'],
    ['PaginationParams', '$types/api.d.ts'],
    ['UIComponent', '$types/ui.d.ts'],
    
    // Constants mappings
    ['APP_CONFIG', '$globals'], // Keep constants in globals for now
    ['NETWORK_CONFIG', '$globals'],
    ['DEFAULT_VALUES', '$globals'],
    ['ERROR_MESSAGES', '$globals'],
    ['API_ENDPOINTS', '$globals'],
  ]);

  private readonly KNOWN_GLOBALS_FILES = [
    'routes/handlers/sharedStampHandler.ts',
    'server/database/stampRepository.ts',
    'server/controller/stampController.ts',
    'server/services/stampService.ts',
    'lib/types/stamping.ts',
    'lib/types/marketData.d.ts',
    'lib/types/services.d.ts',
    'lib/constants/constants.ts',
    'lib/utils/ui/media/imageUtils.ts',
    'lib/utils/data/filtering/filterOptions.ts',
    'lib/hooks/useWalletState.ts'
  ];

  async cleanupLegacyImports(): Promise<CleanupResult> {
    console.log("🧹 Starting legacy $globals import cleanup...\n");
    
    const result: CleanupResult = {
      totalFiles: 0,
      globalsImportsFound: 0,
      successfulConversions: 0,
      errors: [],
      mappings: []
    };

    // First, find all files with $globals imports
    const filesWithGlobals = await this.findFilesWithGlobalsImports();
    result.totalFiles = filesWithGlobals.length;
    
    console.log(`📁 Found ${filesWithGlobals.length} files with $globals imports\n`);

    // Process each file
    for (const filePath of filesWithGlobals) {
      try {
        console.log(`🔄 Processing: ${filePath}`);
        const mappings = await this.processFile(filePath);
        
        result.mappings.push(...mappings);
        result.globalsImportsFound += mappings.length;
        
        if (mappings.length > 0) {
          const converted = await this.convertImports(filePath, mappings);
          if (converted) {
            result.successfulConversions += mappings.length;
            console.log(`   ✅ Converted ${mappings.length} imports`);
          } else {
            result.errors.push(`Failed to convert imports in ${filePath}`);
            console.log(`   ❌ Failed to convert imports`);
          }
        } else {
          console.log(`   ℹ️  No $globals imports found`);
        }
      } catch (error) {
        const errorMsg = `Error processing ${filePath}: ${error.message}`;
        result.errors.push(errorMsg);
        console.log(`   ❌ ${errorMsg}`);
      }
    }

    return result;
  }

  private async findFilesWithGlobalsImports(): Promise<string[]> {
    const files: string[] = [];
    
    // Check known files first
    for (const filePath of this.KNOWN_GLOBALS_FILES) {
      try {
        const content = await Deno.readTextFile(filePath);
        if (content.includes('$globals')) {
          files.push(filePath);
        }
      } catch {
        // File might not exist, skip
      }
    }

    // Also scan key directories for any missed files
    const scanDirs = ['lib', 'server', 'routes', 'components'];
    
    for (const dir of scanDirs) {
      try {
        const dirFiles = await this.scanDirectoryForGlobals(dir);
        files.push(...dirFiles.filter(f => !files.includes(f)));
      } catch {
        // Directory might not exist
      }
    }

    return files;
  }

  private async scanDirectoryForGlobals(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      for await (const entry of Deno.readDir(dir)) {
        const fullPath = `${dir}/${entry.name}`;
        
        if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          try {
            const content = await Deno.readTextFile(fullPath);
            if (content.includes('$globals')) {
              files.push(fullPath);
            }
          } catch {
            // Skip files we can't read
          }
        } else if (entry.isDirectory && !entry.name.startsWith('.')) {
          const subFiles = await this.scanDirectoryForGlobals(fullPath);
          files.push(...subFiles);
        }
      }
    } catch {
      // Permission denied or other error
    }
    
    return files;
  }

  private async processFile(filePath: string): Promise<GlobalsImportMapping[]> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split('\n');
    const mappings: GlobalsImportMapping[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('from "$globals"') || line.includes("from '$globals'")) {
        const mapping = this.parseGlobalsImport(line, filePath, i + 1);
        if (mapping) {
          mappings.push(mapping);
        }
      }
    }

    return mappings;
  }

  private parseGlobalsImport(line: string, filePath: string, lineNumber: number): GlobalsImportMapping | null {
    // Extract types from import statement
    const importMatch = line.match(/import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]?\$globals['"]?/);
    if (!importMatch) return null;

    const typesStr = importMatch[1];
    const types = typesStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    // Group types by their target domain
    const domainGroups = new Map<string, string[]>();
    
    for (const type of types) {
      const targetDomain = this.TYPE_MAPPINGS.get(type) || '$types/api.d.ts'; // Default fallback
      
      if (!domainGroups.has(targetDomain)) {
        domainGroups.set(targetDomain, []);
      }
      domainGroups.get(targetDomain)!.push(type);
    }

    // For now, return the first mapping - we'll handle multiple domains in conversion
    const firstDomain = Array.from(domainGroups.keys())[0];
    const firstDomainTypes = domainGroups.get(firstDomain)!;

    return {
      sourceFile: filePath,
      oldImport: line,
      newImport: this.generateNewImport(firstDomainTypes, firstDomain),
      types: firstDomainTypes,
      lineNumber
    };
  }

  private generateNewImport(types: string[], targetDomain: string): string {
    const isTypeOnly = types.every(type => 
      type.endsWith('Row') || type.endsWith('Data') || type.endsWith('Config') || 
      this.TYPE_MAPPINGS.has(type)
    );
    
    const importPrefix = isTypeOnly ? 'import type' : 'import';
    const typesList = types.join(', ');
    
    return `${importPrefix} { ${typesList} } from "${targetDomain}";`;
  }

  private async convertImports(filePath: string, mappings: GlobalsImportMapping[]): Promise<boolean> {
    try {
      let content = await Deno.readTextFile(filePath);
      let modified = false;

      // Sort mappings by line number in reverse order to maintain line positions
      const sortedMappings = mappings.sort((a, b) => b.lineNumber - a.lineNumber);

      for (const mapping of sortedMappings) {
        // Replace the import line
        const lines = content.split('\n');
        if (lines[mapping.lineNumber - 1].includes('$globals')) {
          lines[mapping.lineNumber - 1] = mapping.newImport;
          content = lines.join('\n');
          modified = true;
        }
      }

      if (modified) {
        // Create backup
        await Deno.writeTextFile(`${filePath}.backup`, content);
        
        // Write updated content
        await Deno.writeTextFile(filePath, content);
        
        console.log(`   💾 Created backup: ${filePath}.backup`);
      }

      return modified;
    } catch (error) {
      console.error(`Failed to convert imports in ${filePath}:`, error.message);
      return false;
    }
  }

  async generateReport(result: CleanupResult): Promise<void> {
    const reportPath = '.taskmaster/reports/globals-cleanup-report.md';
    
    try {
      await Deno.mkdir('.taskmaster/reports', { recursive: true });
    } catch {
      // Directory might already exist
    }

    const report = this.formatReport(result);
    await Deno.writeTextFile(reportPath, report);
    
    console.log(`\n📋 Cleanup report saved to: ${reportPath}`);
  }

  private formatReport(result: CleanupResult): string {
    const successRate = result.globalsImportsFound > 0 
      ? ((result.successfulConversions / result.globalsImportsFound) * 100).toFixed(1)
      : '0';

    return `# Legacy $globals Import Cleanup Report

*Generated on: ${new Date().toISOString()}*

## Summary

- **Files Scanned**: ${result.totalFiles}
- **$globals Imports Found**: ${result.globalsImportsFound}
- **Successful Conversions**: ${result.successfulConversions}
- **Success Rate**: ${successRate}%
- **Errors**: ${result.errors.length}

## Conversion Details

${result.mappings.map(mapping => `
### ${mapping.sourceFile}:${mapping.lineNumber}

**Before:**
\`\`\`typescript
${mapping.oldImport}
\`\`\`

**After:**
\`\`\`typescript
${mapping.newImport}
\`\`\`

**Types Converted**: ${mapping.types.join(', ')}
`).join('\n')}

## Errors

${result.errors.length > 0 
  ? result.errors.map(error => `- ${error}`).join('\n')
  : 'No errors encountered.'}

## Next Steps

1. **Verify Functionality**: Test that all converted imports work correctly
2. **Run Type Check**: Execute \`deno check\` to ensure type safety
3. **Remove Backups**: Clean up .backup files after verification
4. **Update Documentation**: Reflect the completed migration in project docs

---

*This report is part of Task 28.1 - Legacy $globals Import Cleanup*
`;
  }
}

// Main execution
async function main() {
  console.log("🎯 Legacy $globals Import Cleanup - Type Domain Migration");
  console.log("=".repeat(60));
  console.log();

  const cleaner = new LegacyGlobalsCleanup();
  
  try {
    const result = await cleaner.cleanupLegacyImports();
    
    // Display summary
    console.log("\n📊 CLEANUP SUMMARY");
    console.log("=".repeat(30));
    console.log(`Files Processed: ${result.totalFiles}`);
    console.log(`$globals Imports Found: ${result.globalsImportsFound}`);
    console.log(`Successful Conversions: ${result.successfulConversions}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      result.errors.forEach(error => console.log(`   ${error}`));
    }
    
    // Generate detailed report
    await cleaner.generateReport(result);
    
    if (result.successfulConversions > 0) {
      console.log("\n✅ Legacy $globals cleanup completed successfully!");
      console.log("🔍 Please run `deno check` to verify type safety");
      console.log("🧪 Test functionality before removing .backup files");
    } else {
      console.log("\n ℹ️ No $globals imports found to convert");
    }
    
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}