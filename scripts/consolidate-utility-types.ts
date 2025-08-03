#!/usr/bin/env deno run --allow-read --allow-write --allow-env

/**
 * Utility Type Consolidation Script
 * 
 * This script consolidates remaining utility types into appropriate domain modules
 * and performs comprehensive validation of the complete type migration.
 */

import type { UtilityType } from "$types/utils.d.ts";
import { Project, SourceFile, TypeAliasDeclaration, InterfaceDeclaration, EnumDeclaration } from "npm:ts-morph@20.0.0";
import { join, dirname } from "https://deno.land/std@0.203.0/path/mod.ts";


interface ConsolidationResult {
  totalTypesFound: number;
  utilityTypesConsolidated: number;
  filesModified: string[];
  validationErrors: string[];
  migrationComplete: boolean;
}

const UTILITY_TYPE_PATTERNS = [
  /^(Helper|Util|Common|Generic|Base|Abstract)/i,
  /Helper$|Util$|Utils$/i,
  /^(Error|Exception|Result|Response|Request|Config|Options|Params)$/i,
  /State$|Props$|Context$/i,
];

const UTILITY_DOMAIN_MAPPING = {
  'error': '$types/errors.d.ts',
  'config': '$types/base.d.ts',
  'helper': '$types/utils.d.ts',
  'state': '$types/ui.d.ts',
  'context': '$types/ui.d.ts',
  'response': '$types/api.d.ts',
  'request': '$types/api.d.ts',
  'generic': '$types/base.d.ts',
  'common': '$types/base.d.ts',
};

async function consolidateUtilityTypes(): Promise<ConsolidationResult> {
  console.log("🔧 Starting utility type consolidation...");
  
  const project = new Project({
    tsConfigFilePath: join(Deno.cwd(), "deno.json"),
  });

  // Add all TypeScript files to the project
  const sourceFiles = project.addSourceFilesAtPaths([
    "**/*.ts",
    "**/*.tsx",
    "!node_modules/**",
    "!.git/**",
    "!dist/**",
    "!coverage/**",
  ]);

  console.log(`📂 Analyzing ${sourceFiles.length} files for utility types...`);

  const utilityTypes: UtilityType[] = [];
  let totalTypesFound = 0;

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    
    // Skip type definition files
    if (filePath.includes('.d.ts')) {
      continue;
    }

    // Find all inline type definitions
    const interfaces = sourceFile.getInterfaces();
    const typeAliases = sourceFile.getTypeAliases();
    const enums = sourceFile.getEnums();

    for (const iface of interfaces) {
      totalTypesFound++;
      const name = iface.getName();
      
      if (isUtilityType(name)) {
        utilityTypes.push({
          file: filePath,
          line: iface.getStartLineNumber(),
          name,
          definition: iface.getText().split('\n')[0],
          category: 'interface',
          suggestedLocation: determineUtilityLocation(name),
          size: iface.getProperties().length,
          exported: iface.isExported(),
        });
      }
    }

    for (const typeAlias of typeAliases) {
      totalTypesFound++;
      const name = typeAlias.getName();
      
      if (isUtilityType(name)) {
        utilityTypes.push({
          file: filePath,
          line: typeAlias.getStartLineNumber(),
          name,
          definition: typeAlias.getText().split('\n')[0],
          category: 'type',
          suggestedLocation: determineUtilityLocation(name),
          size: 1,
          exported: typeAlias.isExported(),
        });
      }
    }

    for (const enumDecl of enums) {
      totalTypesFound++;
      const name = enumDecl.getName();
      
      if (isUtilityType(name)) {
        utilityTypes.push({
          file: filePath,
          line: enumDecl.getStartLineNumber(),
          name,
          definition: enumDecl.getText().split('\n')[0],
          category: 'enum',
          suggestedLocation: determineUtilityLocation(name),
          size: enumDecl.getMembers().length,
          exported: enumDecl.isExported(),
        });
      }
    }
  }

  console.log(`🔍 Found ${utilityTypes.length} utility types out of ${totalTypesFound} total types`);

  // Group utility types by target location
  const typesByLocation = new Map<string, UtilityType[]>();
  for (const utilType of utilityTypes) {
    const location = utilType.suggestedLocation;
    if (!typesByLocation.has(location)) {
      typesByLocation.set(location, []);
    }
    typesByLocation.get(location)!.push(utilType);
  }

  const filesModified: string[] = [];
  const validationErrors: string[] = [];

  // Consolidate types by location
  for (const [location, types] of typesByLocation) {
    try {
      await consolidateTypesToLocation(location, types);
      filesModified.push(location);
      
      // Update source files to import from consolidated location
      for (const utilType of types) {
        await updateSourceFileImports(utilType, location);
      }
    } catch (error) {
      validationErrors.push(`Failed to consolidate types to ${location}: ${error.message}`);
    }
  }

  return {
    totalTypesFound,
    utilityTypesConsolidated: utilityTypes.length,
    filesModified,
    validationErrors,
    migrationComplete: validationErrors.length === 0,
  };
}

function isUtilityType(typeName: string): boolean {
  return UTILITY_TYPE_PATTERNS.some(pattern => pattern.test(typeName));
}

function determineUtilityLocation(typeName: string): string {
  const lowerName = typeName.toLowerCase();
  
  for (const [key, location] of Object.entries(UTILITY_DOMAIN_MAPPING)) {
    if (lowerName.includes(key)) {
      return location;
    }
  }
  
  // Default to utils.d.ts for unclassified utility types
  return '$types/utils.d.ts';
}

async function consolidateTypesToLocation(location: string, types: UtilityType[]): Promise<void> {
  const filePath = location.replace('$types/', 'lib/types/');
  
  console.log(`📝 Adding ${types.length} utility types to ${filePath}`);
  
  // Read existing file content
  let existingContent = '';
  try {
    existingContent = await Deno.readTextFile(filePath);
  } catch {
    // File doesn't exist, create it
    const dir = dirname(filePath);
    await Deno.mkdir(dir, { recursive: true });
  }

  // Extract type definitions from source files
  const typeDefinitions: string[] = [];
  
  for (const utilType of types) {
    const sourceContent = await Deno.readTextFile(utilType.file);
    const lines = sourceContent.split('\n');
    
    // Find the full type definition
    let startLine = utilType.line - 1; // Convert to 0-based
    let endLine = startLine;
    
    // Find the end of the type definition
    let braceCount = 0;
    let inDefinition = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      if (!inDefinition && (line.includes('interface') || line.includes('type') || line.includes('enum'))) {
        inDefinition = true;
      }
      
      if (inDefinition) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount === 0 && i > startLine) {
          endLine = i;
          break;
        }
      }
    }
    
    const typeDefinition = lines.slice(startLine, endLine + 1).join('\n');
    typeDefinitions.push(`\n/**\n * ${utilType.name} - Migrated from ${utilType.file}\n */\n${typeDefinition}`);
  }

  // Append new types to the file
  const newContent = existingContent + '\n' + typeDefinitions.join('\n') + '\n';
  await Deno.writeTextFile(filePath, newContent);
}

async function updateSourceFileImports(utilType: UtilityType, targetLocation: string): Promise<void> {
  const sourceContent = await Deno.readTextFile(utilType.file);
  const lines = sourceContent.split('\n');
  
  // Remove the original type definition
  let startLine = utilType.line - 1;
  let endLine = startLine;
  
  // Find the end of the type definition
  let braceCount = 0;
  let inDefinition = false;
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inDefinition && (line.includes('interface') || line.includes('type') || line.includes('enum'))) {
      inDefinition = true;
    }
    
    if (inDefinition) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount === 0 && i > startLine) {
        endLine = i;
        break;
      }
    }
  }
  
  // Remove the type definition lines
  lines.splice(startLine, endLine - startLine + 1);
  
  // Add import statement at the top
  const importStatement = `import type { ${utilType.name} } from "${targetLocation}";`;
  
  // Find the best place to insert the import
  const existingImports = lines.findIndex(line => line.startsWith('import'));
  if (existingImports >= 0) {
    lines.splice(existingImports, 0, importStatement);
  } else {
    lines.unshift(importStatement);
  }
  
  // Write the updated content
  const updatedContent = lines.join('\n');
  await Deno.writeTextFile(utilType.file, updatedContent);
}

async function performComprehensiveValidation(): Promise<{ errors: string[], success: boolean }> {
  console.log("🔍 Performing comprehensive validation...");
  
  const errors: string[] = [];
  
  try {
    // Check if TypeScript compilation passes
    const typeCheckProcess = new Deno.Command("deno", {
      args: ["check", "--all", "**/*.ts", "**/*.tsx"],
      cwd: Deno.cwd(),
    });
    
    const typeCheckResult = await typeCheckProcess.output();
    
    if (!typeCheckResult.success) {
      const errorOutput = new TextDecoder().decode(typeCheckResult.stderr);
      errors.push(`TypeScript compilation errors: ${errorOutput}`);
    }
    
    // Verify globals.d.ts has been significantly reduced
    try {
      const globalsContent = await Deno.readTextFile("globals.d.ts");
      const globalsLines = globalsContent.split('\n').length;
      
      if (globalsLines > 100) {
        errors.push(`globals.d.ts still contains ${globalsLines} lines - expected significant reduction`);
      } else {
        console.log(`✅ globals.d.ts reduced to ${globalsLines} lines`);
      }
    } catch {
      console.log("✅ globals.d.ts not found - likely fully migrated");
    }
    
    // Check that all domain modules exist and are properly structured
    const domainModules = [
      'lib/types/base.d.ts',
      'lib/types/api.d.ts',
      'lib/types/stamp.d.ts',
      'lib/types/src20.d.ts',
      'lib/types/src101.d.ts',
      'lib/types/wallet.d.ts',
      'lib/types/transaction.d.ts',
      'lib/types/ui.d.ts',
      'lib/types/utils.d.ts',
      'lib/types/services.d.ts',
      'lib/types/marketData.d.ts',
      'lib/types/errors.d.ts',
    ];
    
    for (const module of domainModules) {
      try {
        const content = await Deno.readTextFile(module);
        if (content.length < 100) {
          errors.push(`Domain module ${module} appears to be empty or too small`);
        }
      } catch {
        errors.push(`Domain module ${module} not found`);
      }
    }
    
  } catch (error) {
    errors.push(`Validation process failed: ${error.message}`);
  }
  
  return {
    errors,
    success: errors.length === 0,
  };
}

async function generateComplianceReport(result: ConsolidationResult, validation: { errors: string[], success: boolean }): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    migrationSummary: {
      totalTypesFound: result.totalTypesFound,
      utilityTypesConsolidated: result.utilityTypesConsolidated,
      filesModified: result.filesModified.length,
      migrationComplete: result.migrationComplete && validation.success,
    },
    validationResults: {
      typeCheckPassed: validation.success,
      errors: validation.errors,
      warnings: result.validationErrors,
    },
    complianceStatus: {
      auditCompliant: result.migrationComplete && validation.success,
      physicalVerificationRequired: true,
      nextSteps: validation.success ? ["Manual review complete"] : ["Fix validation errors", "Re-run validation"],
    },
    filesModified: result.filesModified,
  };
  
  const reportPath = ".taskmaster/reports/utility-type-consolidation-report.json";
  await Deno.mkdir(dirname(reportPath), { recursive: true });
  await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 Compliance report generated: ${reportPath}`);
  console.log(`\n🎯 Migration Summary:`);
  console.log(`   • Total types analyzed: ${result.totalTypesFound}`);
  console.log(`   • Utility types consolidated: ${result.utilityTypesConsolidated}`);
  console.log(`   • Files modified: ${result.filesModified.length}`);
  console.log(`   • Migration complete: ${report.migrationSummary.migrationComplete ? '✅' : '❌'}`);
  console.log(`   • Audit compliant: ${report.complianceStatus.auditCompliant ? '✅' : '❌'}`);
  
  if (validation.errors.length > 0) {
    console.log(`\n❌ Validation Errors:`);
    validation.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  if (result.validationErrors.length > 0) {
    console.log(`\n⚠️  Migration Warnings:`);
    result.validationErrors.forEach(warning => console.log(`   • ${warning}`));
  }
}

// Main execution
if (import.meta.main) {
  try {
    const consolidationResult = await consolidateUtilityTypes();
    const validationResult = await performComprehensiveValidation();
    await generateComplianceReport(consolidationResult, validationResult);
    
    if (consolidationResult.migrationComplete && validationResult.success) {
      console.log("\n🎉 Utility type consolidation completed successfully!");
      console.log("✅ All types migrated to domain modules");
      console.log("✅ TypeScript compilation passes");
      console.log("✅ Audit compliance achieved");
    } else {
      console.log("\n⚠️  Consolidation completed with issues - review the report");
      Deno.exit(1);
    }
  } catch (error) {
    console.error("❌ Consolidation failed:", error);
    Deno.exit(1);
  }
}