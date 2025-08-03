#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Deno-native TypeScript analysis script for globals.d.ts
 * Extracts all type definitions with metadata for domain migration
 * 
 * Usage: deno run --allow-read --allow-write scripts/analyze-globals-types.ts
 */

interface TypeDefinition {
  name: string;
  kind: 'type' | 'interface' | 'enum' | 'namespace' | 'declare' | 'export';
  startLine: number;
  endLine: number;
  content: string;
  dependencies: string[];
  category: string;
  targetFile: string;
  complexity: number;
  description?: string;
}

interface TypeInventory {
  totalTypes: number;
  totalLines: number;
  typesByCategory: Record<string, TypeDefinition[]>;
  dependencyGraph: Record<string, string[]>;
  migrationOrder: string[];
  analysis: {
    mostComplex: TypeDefinition[];
    mostDependent: TypeDefinition[];
    orphaned: TypeDefinition[];
    conflicts: Array<{
      name: string;
      reason: string;
      suggestions: string[];
    }>;
  };
}

const DOMAIN_CATEGORIES = {
  // lib/types/
  'base.d.ts': [
    'ROOT_DOMAIN_TYPES', 'SUBPROTOCOLS', 'BlockRow', 'BtcInfo', 'XCPParams',
    'Config', 'WalletDataTypes', 'NodeJS', 'GlobalThis'
  ],
  'stamp.d.ts': [
    'STAMP_TYPES', 'STAMP_FILTER_TYPES', 'STAMP_SUFFIX_FILTERS', 'STAMP_MARKETPLACE',
    'STAMP_FILETYPES', 'STAMP_EDITIONS', 'STAMP_RANGES', 'STAMP_FILESIZES',
    'StampRow', 'StampBalance', 'StampFilters', 'StampGalleryProps',
    'PaginatedStampResponseBody', 'PaginatedIdResponseBody', 'PaginatedStampBalanceResponseBody',
    'StampPageProps', 'StampBlockResponseBody', 'DisplayCountBreakpoints'
  ],
  'src20.d.ts': [
    'SRC20_TYPES', 'SRC20_FILTER_TYPES', 'SRC20_STATUS', 'SRC20_DETAILS', 'SRC20_MARKET',
    'SRC20Row', 'EnrichedSRC20Row', 'SRC20Filters', 'SRC20Balance', 'Src20Detail',
    'Src20SnapShotDetail', 'PaginatedSrc20ResponseBody', 'Src20ResponseBody',
    'PaginatedSrc20BalanceResponseBody', 'Src20BalanceResponseBody', 'SRC20SnapshotRequestParams',
    'SRC20TrxRequestParams', 'PaginatedTickResponseBody', 'DeployResponseBody',
    'StampsAndSrc20', 'MintStatus'
  ],
  'src101.d.ts': [
    'SRC101DeployDetail', 'SRC101Balance', 'Src101Detail', 'SRC101TokenidsParams',
    'SRC101ValidTxTotalCountParams', 'SRC101OwnerParams', 'SRC101TxParams',
    'SRC101ValidTxParams', 'Src101BalanceParams', 'PaginatedSrc101ResponseBody',
    'TotalSrc101ResponseBody', 'TokenidSrc101ResponseBody'
  ],
  'transaction.d.ts': [
    'TX', 'TXError', 'MintStampInputData', 'SendRow', 'BlockInfo',
    'BlockInfoResponseBody'
  ],
  'fee.d.ts': [
    'DispenserRow', 'DispenseRow', 'PaginatedDispenserResponseBody'
  ],
  'wallet.d.ts': [
    'WALLET_FILTER_TYPES', 'HolderRow', 'ProcessedHolder'
  ],
  'marketData.d.ts': [
    'MarketListingAggregated', 'MarketDataFilters', 'EmojiTickHandling'
  ],
  'api.d.ts': [
    'IdentHandlerContext', 'BlockHandlerContext', 'AddressTickHandlerContext',
    'AddressHandlerContext', 'TickHandlerContext'
  ],
  'errors.d.ts': [
    // No specific error types found in current globals.d.ts
  ],
  'pagination.d.ts': [
    'Pagination'
  ],
  'sorting.d.ts': [
    // No specific sorting types found in current globals.d.ts
  ],
  'utils.d.ts': [
    // No specific utility types found in current globals.d.ts
  ],
  'ui.d.ts': [
    'CollectionGalleryProps'
  ],
  'services.d.ts': [
    // No specific service types found in current globals.d.ts
  ],
  // server/types/
  'collection.d.ts': [
    'COLLECTION_FILTER_TYPES', 'Collection', 'CollectionGalleryProps'
  ],
  'database.d.ts': [
    // No specific database types found in current globals.d.ts
  ]
};

class TypeAnalyzer {
  private fileContent: string = '';
  private lines: string[] = [];
  private types: TypeDefinition[] = [];

  async analyzeFile(filePath: string): Promise<TypeInventory> {
    console.log(`🔍 Analyzing ${filePath}...`);
    
    try {
      this.fileContent = await Deno.readTextFile(filePath);
      this.lines = this.fileContent.split('\n');
      
      console.log(`📄 File contains ${this.lines.length} lines`);
      
      await this.extractTypes();
      await this.categorizeTypes();
      await this.analyzeDependencies();
      
      return this.generateInventory();
    } catch (error) {
      console.error(`❌ Error analyzing file: ${error.message}`);
      throw error;
    }
  }

  private async extractTypes(): Promise<void> {
    console.log('🔍 Extracting type definitions...');
    
    let currentType: Partial<TypeDefinition> | null = null;
    let braceCount = 0;
    let inMultiLineComment = false;
    let inStringLiteral = false;
    let stringDelimiter = '';

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      const lineNumber = i + 1;

      // Handle multi-line comments
      if (line.includes('/*')) {
        inMultiLineComment = true;
      }
      if (line.includes('*/')) {
        inMultiLineComment = false;
        continue;
      }
      if (inMultiLineComment || line.startsWith('//')) {
        continue;
      }

      // Handle string literals
      if (!inStringLiteral) {
        const stringMatch = line.match(/(['"`])/);
        if (stringMatch && !line.includes('\\' + stringMatch[1])) {
          inStringLiteral = true;
          stringDelimiter = stringMatch[1];
        }
      } else {
        if (line.includes(stringDelimiter) && !line.includes('\\' + stringDelimiter)) {
          inStringLiteral = false;
          stringDelimiter = '';
        }
        continue;
      }

      if (inStringLiteral) continue;

      // Detect type definitions - improved patterns
      const typePatterns = [
        /^export\s+type\s+(\w+)/,
        /^export\s+interface\s+(\w+)/,
        /^interface\s+(\w+)/,
        /^type\s+(\w+)/,
        /^export\s+enum\s+(\w+)/,
        /^enum\s+(\w+)/,
        /^declare\s+namespace\s+(\w+)/,
        /^declare\s+global/,
        /^export\s+\{/,
        // Additional patterns for various type definitions
        /^export\s+const\s+(\w+):\s*{/, // exported const objects with types
        /^export\s+declare\s+(\w+)/, // export declare patterns
        /^declare\s+interface\s+(\w+)/, // declare interface
        /^declare\s+type\s+(\w+)/, // declare type
        /^declare\s+const\s+(\w+)/, // declare const
        /^declare\s+function\s+(\w+)/, // declare function
        /^declare\s+class\s+(\w+)/, // declare class
        /^declare\s+var\s+(\w+)/, // declare var
        /^declare\s+let\s+(\w+)/, // declare let
      ];

      for (const pattern of typePatterns) {
        const match = line.match(pattern);
        if (match) {
          // Save previous type if exists
          if (currentType) {
            this.finalizeType(currentType, i - 1);
          }

          // Start new type
          currentType = {
            name: match[1] || 'GlobalDeclaration',
            kind: this.getTypeKind(line),
            startLine: lineNumber,
            content: line,
            dependencies: [],
            complexity: 0
          };
          braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
          
          // Handle single-line types
          if (line.includes(';') && braceCount === 0) {
            this.finalizeType(currentType, i);
            currentType = null;
          }
          break;
        }
      }

      // Continue building current type
      if (currentType) {
        if (i > currentType.startLine! - 1) {
          currentType.content += '\n' + line;
        }
        
        braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        
        // Type definition complete
        if (braceCount === 0 && (line.includes('}') || line.includes(';'))) {
          this.finalizeType(currentType, i);
          currentType = null;
        }
      }
    }

    // Handle any remaining type
    if (currentType) {
      this.finalizeType(currentType, this.lines.length - 1);
    }

    console.log(`✅ Extracted ${this.types.length} type definitions`);
  }

  private getTypeKind(line: string): TypeDefinition['kind'] {
    if (line.includes('interface')) return 'interface';
    if (line.includes('enum')) return 'enum';
    if (line.includes('type')) return 'type';
    if (line.includes('namespace')) return 'namespace';
    if (line.includes('declare')) return 'declare';
    return 'export';
  }

  private finalizeType(typeData: Partial<TypeDefinition>, endLine: number): void {
    if (!typeData.name || !typeData.startLine) return;

    const type: TypeDefinition = {
      name: typeData.name,
      kind: typeData.kind || 'type',
      startLine: typeData.startLine,
      endLine: endLine + 1,
      content: typeData.content || '',
      dependencies: this.extractDependencies(typeData.content || ''),
      category: '',
      targetFile: '',
      complexity: this.calculateComplexity(typeData.content || ''),
      description: this.extractDescription(typeData.content || '')
    };

    this.types.push(type);
  }

  private extractDependencies(content: string): string[] {
    const dependencies = new Set<string>();
    
    // Find type references (simplified pattern)
    const typeRefs = content.match(/:\s*(\w+)/g) || [];
    const genericRefs = content.match(/<(\w+)/g) || [];
    const extendsRefs = content.match(/extends\s+(\w+)/g) || [];
    const importRefs = content.match(/import.*?\{([^}]+)\}/g) || [];

    [...typeRefs, ...genericRefs, ...extendsRefs].forEach(ref => {
      const match = ref.match(/(\w+)/);
      if (match && match[1]) {
        dependencies.add(match[1]);
      }
    });

    importRefs.forEach(ref => {
      const match = ref.match(/\{([^}]+)\}/);
      if (match) {
        match[1].split(',').forEach(dep => {
          dependencies.add(dep.trim());
        });
      }
    });

    return Array.from(dependencies).filter(dep => 
      dep !== 'string' && dep !== 'number' && dep !== 'boolean' && 
      dep !== 'Date' && dep !== 'any' && dep !== 'unknown'
    );
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    
    // Count nested structures
    complexity += (content.match(/\{/g)?.length || 0) * 2;
    complexity += (content.match(/\[\]/g)?.length || 0) * 1;
    complexity += (content.match(/\|/g)?.length || 0) * 1;
    complexity += (content.match(/&/g)?.length || 0) * 1;
    complexity += (content.match(/<.*?>/g)?.length || 0) * 2;
    
    // Count properties/methods
    const lines = content.split('\n');
    complexity += lines.filter(line => 
      line.trim().includes(':') && !line.trim().startsWith('//')
    ).length;

    return complexity;
  }

  private extractDescription(content: string): string | undefined {
    const commentMatch = content.match(/\/\*\*(.*?)\*\//s);
    if (commentMatch) {
      return commentMatch[1].replace(/\*/g, '').trim();
    }
    
    const lineCommentMatch = content.match(/\/\/\s*(.+)/);
    if (lineCommentMatch) {
      return lineCommentMatch[1].trim();
    }
    
    return undefined;
  }

  private async categorizeTypes(): Promise<void> {
    console.log('🏷️  Categorizing types by domain...');
    
    for (const type of this.types) {
      let assigned = false;
      
      // Find matching category
      for (const [targetFile, typeNames] of Object.entries(DOMAIN_CATEGORIES)) {
        if (typeNames.includes(type.name)) {
          type.category = this.getCategory(targetFile);
          type.targetFile = targetFile;
          assigned = true;
          break;
        }
      }
      
      // Auto-categorize by name patterns if not found
      if (!assigned) {
        type.category = this.inferCategory(type.name);
        type.targetFile = this.inferTargetFile(type.category);
      }
    }
    
    console.log('✅ Categorization complete');
  }

  private getCategory(targetFile: string): string {
    if (targetFile.startsWith('lib/types/')) return 'client';
    if (targetFile.startsWith('server/types/')) return 'server';
    return targetFile.includes('collection') ? 'server' : 'client';
  }

  private inferCategory(typeName: string): string {
    const name = typeName.toLowerCase();
    
    if (name.includes('stamp')) return 'client';
    if (name.includes('src20')) return 'client';
    if (name.includes('src101')) return 'client';
    if (name.includes('block')) return 'client';
    if (name.includes('wallet')) return 'client';
    if (name.includes('market')) return 'client';
    if (name.includes('collection')) return 'server';
    if (name.includes('database') || name.includes('db')) return 'server';
    if (name.includes('pagination')) return 'client';
    if (name.includes('filter')) return 'client';
    if (name.includes('context')) return 'client';
    if (name.includes('handler')) return 'client';
    if (name.includes('response')) return 'client';
    if (name.includes('request')) return 'client';
    if (name.includes('params')) return 'client';
    
    return 'client'; // Default to client
  }

  private inferTargetFile(category: string): string {
    return category === 'server' ? 'database.d.ts' : 'utils.d.ts';
  }

  private async analyzeDependencies(): Promise<void> {
    console.log('🔗 Analyzing dependencies...');
    
    // Build dependency graph
    for (const type of this.types) {
      for (const dep of type.dependencies) {
        const depType = this.types.find(t => t.name === dep);
        if (depType) {
          // Circular dependency check
          if (depType.dependencies.includes(type.name)) {
            console.warn(`⚠️  Circular dependency detected: ${type.name} ↔ ${dep}`);
          }
        }
      }
    }
    
    console.log('✅ Dependency analysis complete');
  }

  private generateInventory(): TypeInventory {
    console.log('📊 Generating type inventory...');
    
    const typesByCategory: Record<string, TypeDefinition[]> = {};
    const dependencyGraph: Record<string, string[]> = {};
    
    // Group by category
    for (const type of this.types) {
      const category = type.targetFile;
      if (!typesByCategory[category]) {
        typesByCategory[category] = [];
      }
      typesByCategory[category].push(type);
      dependencyGraph[type.name] = type.dependencies;
    }
    
    // Calculate migration order (topological sort)
    const migrationOrder = this.calculateMigrationOrder();
    
    // Analysis
    const mostComplex = [...this.types]
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10);
    
    const dependentCounts = this.types.map(type => ({
      type,
      dependentCount: this.types.filter(t => t.dependencies.includes(type.name)).length
    }));
    
    const mostDependent = dependentCounts
      .sort((a, b) => b.dependentCount - a.dependentCount)
      .slice(0, 10)
      .map(item => item.type);
    
    const orphaned = this.types.filter(type => 
      type.dependencies.length === 0 && 
      !this.types.some(t => t.dependencies.includes(type.name))
    );
    
    const conflicts = this.detectConflicts();
    
    const inventory: TypeInventory = {
      totalTypes: this.types.length,
      totalLines: this.lines.length,
      typesByCategory,
      dependencyGraph,
      migrationOrder,
      analysis: {
        mostComplex,
        mostDependent,
        orphaned,
        conflicts
      }
    };
    
    console.log('✅ Inventory generation complete');
    return inventory;
  }

  private calculateMigrationOrder(): string[] {
    // Simple topological sort
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];
    
    const visit = (typeName: string) => {
      if (visiting.has(typeName)) {
        console.warn(`⚠️  Circular dependency involving ${typeName}`);
        return;
      }
      if (visited.has(typeName)) return;
      
      visiting.add(typeName);
      
      const type = this.types.find(t => t.name === typeName);
      if (type) {
        for (const dep of type.dependencies) {
          visit(dep);
        }
      }
      
      visiting.delete(typeName);
      visited.add(typeName);
      order.push(typeName);
    };
    
    for (const type of this.types) {
      visit(type.name);
    }
    
    return order;
  }

  private detectConflicts(): Array<{name: string; reason: string; suggestions: string[]}> {
    const conflicts: Array<{name: string; reason: string; suggestions: string[]}> = [];
    
    // Check for name collisions across categories
    const nameGroups: Record<string, TypeDefinition[]> = {};
    for (const type of this.types) {
      if (!nameGroups[type.name]) {
        nameGroups[type.name] = [];
      }
      nameGroups[type.name].push(type);
    }
    
    for (const [name, types] of Object.entries(nameGroups)) {
      if (types.length > 1) {
        conflicts.push({
          name,
          reason: 'Duplicate type name across files',
          suggestions: [
            'Consider renaming one of the types',
            'Use namespaces to avoid collisions',
            'Merge into single definition if semantically identical'
          ]
        });
      }
    }
    
    // Check for cross-domain dependencies
    for (const type of this.types) {
      for (const dep of type.dependencies) {
        const depType = this.types.find(t => t.name === dep);
        if (depType && type.category !== depType.category) {
          conflicts.push({
            name: `${type.name} → ${dep}`,
            reason: 'Cross-domain dependency (client ↔ server)',
            suggestions: [
              'Move both types to same domain',
              'Create shared types in base.d.ts',
              'Use dependency injection pattern'
            ]
          });
        }
      }
    }
    
    return conflicts;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting globals.d.ts type analysis...\n');
  
  const analyzer = new TypeAnalyzer();
  const globalsPath = './globals.d.ts';
  
  try {
    const inventory = await analyzer.analyzeFile(globalsPath);
    
    // Create output directories
    await Deno.mkdir('docs/type-migration', { recursive: true });
    
    // Write type inventory
    const inventoryPath = 'docs/type-migration/type-inventory.json';
    await Deno.writeTextFile(inventoryPath, JSON.stringify(inventory, null, 2));
    console.log(`📝 Type inventory written to ${inventoryPath}`);
    
    // Generate migration strategy
    await generateMigrationStrategy(inventory);
    
    console.log('\n✅ Analysis complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   • Total types: ${inventory.totalTypes}`);
    console.log(`   • Total lines: ${inventory.totalLines}`);
    console.log(`   • Target files: ${Object.keys(inventory.typesByCategory).length}`);
    console.log(`   • Conflicts detected: ${inventory.analysis.conflicts.length}`);
    
  } catch (error) {
    console.error(`❌ Analysis failed: ${error.message}`);
    Deno.exit(1);
  }
}

async function generateMigrationStrategy(inventory: TypeInventory) {
  const strategyContent = `# Type Migration Strategy

## Overview

This document outlines the comprehensive strategy for migrating all type definitions from the monolithic \`globals.d.ts\` file into 16 domain-specific type definition files.

### Migration Statistics

- **Total Types**: ${inventory.totalTypes}
- **Total Lines**: ${inventory.totalLines}
- **Target Files**: ${Object.keys(inventory.typesByCategory).length}
- **Detected Conflicts**: ${inventory.analysis.conflicts.length}

## Target File Structure

### Client Types (\`lib/types/\`)

${Object.entries(inventory.typesByCategory)
  .filter(([file]) => !file.includes('collection.d.ts') && !file.includes('database.d.ts'))
  .map(([file, types]) => `#### \`${file}\`
- **Type Count**: ${types.length}
- **Types**: ${types.map(t => t.name).join(', ')}
- **Avg Complexity**: ${Math.round(types.reduce((sum, t) => sum + t.complexity, 0) / types.length)}`)
  .join('\n\n')}

### Server Types (\`server/types/\`)

${Object.entries(inventory.typesByCategory)
  .filter(([file]) => file.includes('collection.d.ts') || file.includes('database.d.ts'))
  .map(([file, types]) => `#### \`${file}\`
- **Type Count**: ${types.length}
- **Types**: ${types.map(t => t.name).join(', ')}
- **Avg Complexity**: ${types.length ? Math.round(types.reduce((sum, t) => sum + t.complexity, 0) / types.length) : 0}`)
  .join('\n\n')}

## Migration Order

The following migration order minimizes dependency conflicts:

${inventory.migrationOrder.map((typeName, index) => {
  const type = inventory.typesByCategory[Object.keys(inventory.typesByCategory).find(file => 
    inventory.typesByCategory[file].some(t => t.name === typeName)
  ) || '']?.find(t => t.name === typeName);
  return `${index + 1}. **${typeName}** → \`${type?.targetFile || 'unknown'}\``;
}).join('\n')}

## Complexity Analysis

### Most Complex Types
${inventory.analysis.mostComplex.map((type, index) => 
  `${index + 1}. **${type.name}** (complexity: ${type.complexity}) → \`${type.targetFile}\``
).join('\n')}

### Most Referenced Types
${inventory.analysis.mostDependent.map((type, index) => 
  `${index + 1}. **${type.name}** → \`${type.targetFile}\``
).join('\n')}

### Orphaned Types
${inventory.analysis.orphaned.map((type, index) => 
  `${index + 1}. **${type.name}** → \`${type.targetFile}\``
).join('\n')}

## Detected Conflicts

${inventory.analysis.conflicts.length === 0 ? 'No conflicts detected! 🎉' : 
inventory.analysis.conflicts.map((conflict, index) => 
  `### ${index + 1}. ${conflict.name}

**Issue**: ${conflict.reason}

**Suggestions**:
${conflict.suggestions.map(s => `- ${s}`).join('\n')}
`).join('\n')}

## Migration Implementation Steps

### Phase 1: Preparation (Tasks 4-8)
- [ ] Create all 16 target type definition files
- [ ] Set up proper imports/exports structure  
- [ ] Configure TypeScript path mapping
- [ ] Create migration validation scripts

### Phase 2: Base Types Migration (Tasks 9-12)
- [ ] Migrate foundational types to \`base.d.ts\`
- [ ] Move Bitcoin/blockchain primitives
- [ ] Establish core type dependencies
- [ ] Validate base type compilation

### Phase 3: Domain Types Migration (Tasks 13-20)
- [ ] Migrate Stamp protocol types to \`stamp.d.ts\`
- [ ] Migrate SRC-20 types to \`src20.d.ts\`
- [ ] Migrate SRC-101 types to \`src101.d.ts\`
- [ ] Migrate transaction types to \`transaction.d.ts\`
- [ ] Migrate wallet types to \`wallet.d.ts\`
- [ ] Migrate market data types to \`marketData.d.ts\`
- [ ] Migrate API types to \`api.d.ts\`
- [ ] Migrate utility types to \`utils.d.ts\`

### Phase 4: Server Types Migration (Tasks 21-22)
- [ ] Migrate collection types to \`server/types/collection.d.ts\`
- [ ] Migrate database types to \`server/types/database.d.ts\`

### Phase 5: Cleanup & Validation (Tasks 23-25)
- [ ] Remove original \`globals.d.ts\` file
- [ ] Update all import statements across codebase
- [ ] Run comprehensive type checking
- [ ] Update build and test configurations

## Risk Mitigation

### High-Risk Areas
1. **Circular Dependencies**: Monitor types with cross-references
2. **Missing Imports**: Automated import generation recommended
3. **Build Failures**: Incremental migration with continuous validation
4. **Runtime Errors**: Comprehensive testing after each phase

### Rollback Strategy
- Maintain \`globals.d.ts\` until full migration complete
- Git branching strategy for each migration phase
- Automated rollback scripts if critical issues detected

## Success Criteria

- [ ] All ${inventory.totalTypes} types successfully migrated
- [ ] Zero TypeScript compilation errors
- [ ] All tests passing
- [ ] No runtime type errors
- [ ] Improved development experience with domain-specific IntelliSense
- [ ] Reduced coupling between client and server types

## Post-Migration Benefits

1. **Better Organization**: Types grouped by functional domain
2. **Improved Developer Experience**: Focused IntelliSense and imports
3. **Easier Maintenance**: Changes scoped to relevant domains
4. **Better Testing**: Domain-specific type testing
5. **Reduced Build Times**: Smaller type dependency graphs
6. **Clear Boundaries**: Explicit client/server type separation

---

*Generated by Deno Type Analyzer on ${new Date().toISOString()}*
`;

  const strategyPath = 'docs/type-migration/migration-strategy.md';
  await Deno.writeTextFile(strategyPath, strategyContent);
  console.log(`📋 Migration strategy written to ${strategyPath}`);
}

if (import.meta.main) {
  await main();
}