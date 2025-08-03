#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Enhanced Deno-native TypeScript analysis script for globals.d.ts
 * Extracts all type definitions with metadata for domain migration
 * 
 * Usage: deno run --allow-read --allow-write scripts/analyze-globals-types-v2.ts
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

class EnhancedTypeAnalyzer {
  private fileContent: string = '';
  private lines: string[] = [];
  private types: TypeDefinition[] = [];

  async analyzeFile(filePath: string): Promise<TypeInventory> {
    console.log(`🔍 Analyzing ${filePath}...`);
    
    try {
      this.fileContent = await Deno.readTextFile(filePath);
      this.lines = this.fileContent.split('\n');
      
      console.log(`📄 File contains ${this.lines.length} lines`);
      
      await this.extractTypesRegex();
      await this.categorizeTypes();
      await this.analyzeDependencies();
      
      return this.generateInventory();
    } catch (error) {
      console.error(`❌ Error analyzing file: ${error.message}`);
      throw error;
    }
  }

  private async extractTypesRegex(): Promise<void> {
    console.log('🔍 Extracting type definitions using comprehensive regex patterns...');
    
    // Define comprehensive regex patterns for different type definitions
    const patterns = [
      // Export type aliases
      {
        regex: /^export\s+type\s+([A-Z_][A-Z0-9_]*)\s*=/gm,
        kind: 'type' as const
      },
      // Export interfaces  
      {
        regex: /^export\s+interface\s+(\w+)/gm,
        kind: 'interface' as const
      },
      // Regular interfaces
      {
        regex: /^interface\s+(\w+)/gm,
        kind: 'interface' as const
      },
      // Regular type aliases
      {
        regex: /^type\s+([A-Z_][A-Z0-9_]*)\s*=/gm,
        kind: 'type' as const
      },
      // Declare interfaces
      {
        regex: /^declare\s+interface\s+(\w+)/gm,
        kind: 'interface' as const
      },
      // Declare namespaces
      {
        regex: /^declare\s+namespace\s+(\w+)/gm,
        kind: 'namespace' as const
      },
      // Declare global
      {
        regex: /^declare\s+global\s*\{/gm,
        kind: 'declare' as const
      }
    ];

    // Process each pattern
    for (const { regex, kind } of patterns) {
      let match;
      while ((match = regex.exec(this.fileContent)) !== null) {
        const typeName = match[1] || 'GlobalDeclaration';
        const startIndex = match.index;
        const startLine = this.fileContent.substring(0, startIndex).split('\n').length;
        
        // Find the end of this type definition
        const endInfo = this.findTypeEnd(startIndex, kind);
        
        const typeDefinition: TypeDefinition = {
          name: typeName,
          kind,
          startLine,
          endLine: endInfo.endLine,
          content: endInfo.content,
          dependencies: this.extractDependencies(endInfo.content),
          category: '',
          targetFile: '',
          complexity: this.calculateComplexity(endInfo.content),
          description: this.extractDescription(endInfo.content)
        };
        
        this.types.push(typeDefinition);
      }
    }
    
    console.log(`✅ Extracted ${this.types.length} type definitions`);
    
    // Log found types for verification
    console.log('📋 Found types:', this.types.map(t => `${t.name} (${t.kind})`).join(', '));
  }

  private findTypeEnd(startIndex: number, kind: TypeDefinition['kind']): { endLine: number; content: string } {
    const remainingContent = this.fileContent.substring(startIndex);
    const lines = remainingContent.split('\n');
    
    let braceCount = 0;
    let endLineIndex = 0;
    let inString = false;
    let stringChar = '';
    
    // For single-line type aliases
    if (kind === 'type' && lines[0].includes('=') && lines[0].includes(';')) {
      return {
        endLine: this.fileContent.substring(0, startIndex).split('\n').length,
        content: lines[0]
      };
    }
    
    // For multi-line structures
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle string literals
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (!inString) {
          if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
          } else if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
          }
        } else {
          if (char === stringChar && line[j-1] !== '\\') {
            inString = false;
            stringChar = '';
          }
        }
      }
      
      // Check for end conditions
      if (i > 0) { // Don't end on the first line
        if (braceCount === 0 && (line.includes('}') || line.includes(';'))) {
          endLineIndex = i;
          break;
        }
        
        // For union types or simple types that end with semicolon
        if (kind === 'type' && line.trim().endsWith(';') && braceCount === 0) {
          endLineIndex = i;
          break;
        }
      }
      
      endLineIndex = i; // Update end line as we go
    }
    
    const content = lines.slice(0, endLineIndex + 1).join('\n');
    const startLineNum = this.fileContent.substring(0, startIndex).split('\n').length;
    
    return {
      endLine: startLineNum + endLineIndex,
      content
    };
  }

  private extractDependencies(content: string): string[] {
    const dependencies = new Set<string>();
    
    // Remove comments and strings to avoid false positives
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/"[^"]*"/g, '""') // Remove string literals
      .replace(/'[^']*'/g, "''") // Remove string literals
      .replace(/`[^`]*`/g, '``'); // Remove template literals
    
    // Find type references in various contexts
    const patterns = [
      /:\s*([A-Z]\w+)/g, // Property types: foo: SomeType
      /<([A-Z]\w+)/g, // Generic parameters: Array<SomeType>
      /extends\s+([A-Z]\w+)/g, // Interface extension: extends SomeType
      /implements\s+([A-Z]\w+)/g, // Class implementation: implements SomeType
      /\|\s*([A-Z]\w+)/g, // Union types: string | SomeType
      /&\s*([A-Z]\w+)/g, // Intersection types: string & SomeType
      /\[\]\s*:\s*([A-Z]\w+)/g, // Array types: SomeType[]
      /typeof\s+([A-Z]\w+)/g, // Typeof: typeof SomeType
      /keyof\s+([A-Z]\w+)/g, // Keyof: keyof SomeType
      /import\s*\(\s*["']([^"']+)["']\s*\)/g, // Dynamic imports
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(cleanContent)) !== null) {
        const typeName = match[1];
        if (typeName && this.isCustomType(typeName)) {
          dependencies.add(typeName);
        }
      }
    }
    
    return Array.from(dependencies);
  }

  private isCustomType(typeName: string): boolean {
    // Filter out built-in types
    const builtInTypes = new Set([
      'string', 'number', 'boolean', 'object', 'any', 'unknown', 'never', 'void',
      'undefined', 'null', 'Array', 'Promise', 'Date', 'RegExp', 'Error',
      'Map', 'Set', 'WeakMap', 'WeakSet', 'Function', 'Object', 'String',
      'Number', 'Boolean', 'Symbol', 'BigInt', 'Record', 'Partial', 'Required',
      'Readonly', 'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable',
      'ReturnType', 'InstanceType', 'ThisType', 'Parameters', 'ConstructorParameters'
    ]);
    
    return !builtInTypes.has(typeName) && /^[A-Z]/.test(typeName);
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;
    
    // Count structural elements
    complexity += (content.match(/\{/g)?.length || 0) * 2; // Object/interface depth
    complexity += (content.match(/\[\]/g)?.length || 0) * 1; // Array types
    complexity += (content.match(/\|/g)?.length || 0) * 1; // Union types
    complexity += (content.match(/&/g)?.length || 0) * 1; // Intersection types
    complexity += (content.match(/<[^>]+>/g)?.length || 0) * 2; // Generic types
    complexity += (content.match(/\?:/g)?.length || 0) * 1; // Optional properties
    complexity += (content.match(/extends/g)?.length || 0) * 2; // Inheritance
    
    // Count properties/methods
    const lines = content.split('\n');
    const propertyLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.includes(':') && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('/*') &&
             !trimmed.startsWith('*') &&
             trimmed !== '';
    });
    
    complexity += propertyLines.length;
    
    return complexity;
  }

  private extractDescription(content: string): string | undefined {
    // Look for JSDoc comments
    const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (jsdocMatch) {
      return jsdocMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line !== '')
        .join(' ')
        .trim();
    }
    
    // Look for single-line comments above the type
    const lineCommentMatch = content.match(/\/\/\s*(.+)\n/);
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
    if (targetFile.includes('collection.d.ts') || targetFile.includes('database.d.ts')) {
      return 'server';
    }
    return 'client';
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
  console.log('🚀 Starting enhanced globals.d.ts type analysis...\n');
  
  const analyzer = new EnhancedTypeAnalyzer();
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

## Comprehensive Type Inventory

### All Detected Types

${inventory.migrationOrder.map((typeName, index) => {
  const category = Object.keys(inventory.typesByCategory).find(file => 
    inventory.typesByCategory[file].some(t => t.name === typeName)
  );
  const type = inventory.typesByCategory[category || '']?.find(t => t.name === typeName);
  return `${index + 1}. **${typeName}** (${type?.kind}) → \`${type?.targetFile || 'unknown'}\` [Complexity: ${type?.complexity || 0}]`;
}).join('\n')}

## Target File Structure

### Client Types (\`lib/types/\`)

${Object.entries(inventory.typesByCategory)
  .filter(([file]) => !file.includes('collection.d.ts') && !file.includes('database.d.ts'))
  .map(([file, types]) => `#### \`${file}\`
- **Type Count**: ${types.length}
- **Types**: ${types.map(t => `${t.name} (${t.kind})`).join(', ')}
- **Avg Complexity**: ${types.length ? Math.round(types.reduce((sum, t) => sum + t.complexity, 0) / types.length) : 0}
- **Total Lines**: ${types.reduce((sum, t) => sum + (t.endLine - t.startLine + 1), 0)}`)
  .join('\n\n')}

### Server Types (\`server/types/\`)

${Object.entries(inventory.typesByCategory)
  .filter(([file]) => file.includes('collection.d.ts') || file.includes('database.d.ts'))
  .map(([file, types]) => `#### \`${file}\`
- **Type Count**: ${types.length}
- **Types**: ${types.map(t => `${t.name} (${t.kind})`).join(', ')}
- **Avg Complexity**: ${types.length ? Math.round(types.reduce((sum, t) => sum + t.complexity, 0) / types.length) : 0}
- **Total Lines**: ${types.reduce((sum, t) => sum + (t.endLine - t.startLine + 1), 0)}`)
  .join('\n\n')}

## Migration Order

The following migration order minimizes dependency conflicts:

${inventory.migrationOrder.map((typeName, index) => {
  const category = Object.keys(inventory.typesByCategory).find(file => 
    inventory.typesByCategory[file].some(t => t.name === typeName)
  );
  const type = inventory.typesByCategory[category || '']?.find(t => t.name === typeName);
  return `${index + 1}. **${typeName}** → \`${type?.targetFile || 'unknown'}\` (Lines ${type?.startLine}-${type?.endLine})`;
}).join('\n')}

## Complexity Analysis

### Most Complex Types (Top 10)
${inventory.analysis.mostComplex.map((type, index) => 
  `${index + 1}. **${type.name}** (complexity: ${type.complexity}) → \`${type.targetFile}\` [Lines ${type.startLine}-${type.endLine}]`
).join('\n')}

### Most Referenced Types (Top 10)
${inventory.analysis.mostDependent.map((type, index) => 
  `${index + 1}. **${type.name}** → \`${type.targetFile}\` (${inventory.migrationOrder.filter(name => {
    const t = Object.values(inventory.typesByCategory).flat().find(x => x.name === name);
    return t?.dependencies.includes(type.name);
  }).length} dependents)`
).join('\n')}

### Orphaned Types (No Dependencies)
${inventory.analysis.orphaned.map((type, index) => 
  `${index + 1}. **${type.name}** → \`${type.targetFile}\` [Lines ${type.startLine}-${type.endLine}]`
).join('\n')}

## Detected Conflicts

${inventory.analysis.conflicts.length === 0 ? 'No conflicts detected! 🎉' : 
inventory.analysis.conflicts.map((conflict, index) => 
  `### ${index + 1}. ${conflict.name}

**Issue**: ${conflict.reason}

**Suggestions**:
${conflict.suggestions.map(s => `- ${s}`).join('\n')}
`).join('\n')}

## Dependency Analysis

### Dependency Graph
\`\`\`json
${JSON.stringify(inventory.dependencyGraph, null, 2)}
\`\`\`

## Migration Implementation Steps

### Phase 1: Preparation (Tasks 4-8)
- [ ] Create all 16 target type definition files with proper structure
- [ ] Set up TypeScript path mapping in \`deno.json\` and \`tsconfig.json\`
- [ ] Create migration validation scripts
- [ ] Set up automated import/export generation

### Phase 2: Base Types Migration (Tasks 9-12)
- [ ] Migrate foundational types to \`base.d.ts\`
- [ ] Move Bitcoin/blockchain primitives
- [ ] Establish core type dependencies
- [ ] Validate base type compilation

### Phase 3: Domain Types Migration (Tasks 13-20)
- [ ] Migrate types following dependency order
- [ ] Update import statements incrementally
- [ ] Validate each domain file compilation
- [ ] Run tests after each migration

### Phase 4: Server Types Migration (Tasks 21-22)
- [ ] Migrate collection types to \`server/types/collection.d.ts\`
- [ ] Migrate database types to \`server/types/database.d.ts\`
- [ ] Update server-side imports

### Phase 5: Cleanup & Validation (Tasks 23-25)
- [ ] Remove original \`globals.d.ts\` file
- [ ] Update all remaining import statements
- [ ] Run comprehensive type checking
- [ ] Update build and test configurations
- [ ] Performance testing and optimization

## Risk Mitigation

### High-Risk Areas
1. **Complex Types**: ${inventory.analysis.mostComplex.slice(0, 3).map(t => t.name).join(', ')}
2. **Highly Referenced**: ${inventory.analysis.mostDependent.slice(0, 3).map(t => t.name).join(', ')}
3. **Cross-Domain Dependencies**: ${inventory.analysis.conflicts.filter(c => c.reason.includes('Cross-domain')).length} detected

### Rollback Strategy
- Maintain \`globals.d.ts\` backup until full migration complete
- Git branching strategy for each migration phase
- Automated rollback scripts if critical issues detected
- Incremental deployment with canary releases

## Success Criteria

- [ ] All ${inventory.totalTypes} types successfully migrated
- [ ] Zero TypeScript compilation errors
- [ ] All tests passing (unit, integration, e2e)
- [ ] No runtime type errors in production
- [ ] Improved development experience with domain-specific IntelliSense
- [ ] Build time improvements measured and documented
- [ ] Code review approval for all migration changes

## Post-Migration Benefits

1. **Better Organization**: Types grouped by functional domain
2. **Improved Developer Experience**: Focused IntelliSense and imports
3. **Easier Maintenance**: Changes scoped to relevant domains
4. **Better Testing**: Domain-specific type testing
5. **Reduced Build Times**: Smaller type dependency graphs
6. **Clear Boundaries**: Explicit client/server type separation
7. **Enhanced Collaboration**: Teams can work on specific type domains
8. **Better Documentation**: Each file can have domain-specific documentation

---

*Generated by Enhanced Deno Type Analyzer on ${new Date().toISOString()}*
*Analysis processed ${inventory.totalLines} lines and identified ${inventory.totalTypes} type definitions*
`;

  const strategyPath = 'docs/type-migration/migration-strategy.md';
  await Deno.writeTextFile(strategyPath, strategyContent);
  console.log(`📋 Migration strategy written to ${strategyPath}`);
}

if (import.meta.main) {
  await main();
}