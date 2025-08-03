#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Quick Import Pattern Analysis
 * 
 * Simplified version to quickly understand current import patterns
 * in the codebase for Type Domain Migration strategy.
 */

interface ImportPattern {
  pattern: string;
  count: number;
  files: string[];
  examples: string[];
}

async function quickAnalysis() {
  console.log("🔍 Quick Import Pattern Analysis");
  console.log("=".repeat(40));
  
  const patterns = new Map<string, ImportPattern>();
  let totalFiles = 0;
  let totalImports = 0;
  
  // Key directories to analyze
  const dirs = ["components", "routes", "server", "lib"];
  
  for (const dir of dirs) {
    try {
      console.log(`\n📁 Analyzing ${dir}/...`);
      const files = await findTSFiles(dir);
      
      for (const file of files) {
        totalFiles++;
        const imports = await extractImports(file);
        totalImports += imports.length;
        
        for (const imp of imports) {
          if (!patterns.has(imp.pattern)) {
            patterns.set(imp.pattern, {
              pattern: imp.pattern,
              count: 0,
              files: [],
              examples: []
            });
          }
          
          const p = patterns.get(imp.pattern)!;
          p.count++;
          
          if (!p.files.includes(file)) {
            p.files.push(file);
          }
          
          if (p.examples.length < 3) {
            p.examples.push(imp.source);
          }
        }
      }
      
      console.log(`   Found ${files.length} TypeScript files`);
    } catch (error) {
      console.log(`   ⚠️ Directory ${dir} not accessible`);
    }
  }
  
  // Sort patterns by usage
  const sortedPatterns = Array.from(patterns.values())
    .sort((a, b) => b.count - a.count);
  
  console.log(`\n📊 SUMMARY`);
  console.log(`Files analyzed: ${totalFiles}`);
  console.log(`Total imports: ${totalImports}`);
  console.log(`Import patterns found: ${patterns.size}`);
  
  console.log(`\n🔝 TOP IMPORT PATTERNS:`);
  sortedPatterns.slice(0, 15).forEach((pattern, index) => {
    const percentage = ((pattern.count / totalImports) * 100).toFixed(1);
    console.log(`${index + 1}. ${pattern.pattern}: ${pattern.count} (${percentage}%)`);
    console.log(`   Files: ${pattern.files.length}, Examples: ${pattern.examples.slice(0, 2).join(', ')}`);
  });
  
  // Generate recommendations
  console.log(`\n💡 QUICK RECOMMENDATIONS:`);
  
  const domainPatterns = sortedPatterns.filter(p => 
    p.pattern.includes('$types/') && p.pattern.includes('.d.ts')
  );
  const centralizedPatterns = sortedPatterns.filter(p => 
    p.pattern.includes('$types/index') || p.pattern === '$types' || p.pattern === '$globals'
  );
  
  const domainCount = domainPatterns.reduce((sum, p) => sum + p.count, 0);
  const centralizedCount = centralizedPatterns.reduce((sum, p) => sum + p.count, 0);
  
  const domainPercent = ((domainCount / totalImports) * 100).toFixed(1);
  const centralizedPercent = ((centralizedCount / totalImports) * 100).toFixed(1);
  
  console.log(`• Direct domain imports: ${domainCount} (${domainPercent}%)`);
  console.log(`• Centralized imports: ${centralizedCount} (${centralizedPercent}%)`);
  
  if (domainCount > centralizedCount) {
    console.log(`✅ RECOMMENDATION: Continue with direct domain import strategy`);
  } else if (centralizedCount > domainCount) {
    console.log(`✅ RECOMMENDATION: Consolidate to centralized import strategy`);
  } else {
    console.log(`⚠️ MIXED: No clear preference - architectural decision needed`);
  }
  
  // Save detailed results
  const report = {
    summary: {
      totalFiles,
      totalImports,
      patternsFound: patterns.size,
      domainImports: domainCount,
      centralizedImports: centralizedCount,
      analysisDate: new Date().toISOString()
    },
    patterns: sortedPatterns.slice(0, 50),
    recommendations: [
      `Direct domain imports: ${domainPercent}%`,
      `Centralized imports: ${centralizedPercent}%`,
      domainCount > centralizedCount ? 
        "Continue with direct domain strategy" : 
        centralizedCount > domainCount ? 
          "Move to centralized strategy" : 
          "Mixed patterns - choose architectural approach"
    ]
  };
  
  try {
    await Deno.mkdir('.taskmaster/reports', { recursive: true });
    await Deno.writeTextFile(
      '.taskmaster/reports/quick-import-analysis.json',
      JSON.stringify(report, null, 2)
    );
    console.log(`\n📋 Detailed results saved to .taskmaster/reports/quick-import-analysis.json`);
  } catch (error) {
    console.log(`⚠️ Could not save report: ${error.message}`);
  }
}

async function findTSFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;
      
      if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(path);
      } else if (entry.isDirectory && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await findTSFiles(path);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    // Directory not accessible
  }
  
  return files;
}

async function extractImports(filePath: string): Promise<Array<{pattern: string, source: string}>> {
  try {
    const content = await Deno.readTextFile(filePath);
    const imports: Array<{pattern: string, source: string}> = [];
    
    // Simple regex to find import statements
    const importRegex = /import\s+(?:type\s+)?(?:\*\s+as\s+\w+|{[^}]*}|\w+|{[^}]*}(?:\s*,\s*\w+)?)\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const source = match[1];
      
      // Categorize the import pattern
      let pattern = 'external';
      
      if (source.startsWith('$types/') && source.endsWith('.d.ts')) {
        pattern = 'direct-domain';
      } else if (source === '$types' || source === '$types/index.d.ts') {
        pattern = 'centralized-types';
      } else if (source === '$globals') {
        pattern = 'globals';
      } else if (source.startsWith('$')) {
        pattern = 'alias-import';
      } else if (source.startsWith('./') || source.startsWith('../')) {
        pattern = 'relative';
      } else if (source.startsWith('http') || !source.includes('/')) {
        pattern = 'external';
      }
      
      imports.push({ pattern, source });
    }
    
    return imports;
  } catch (error) {
    return [];
  }
}

if (import.meta.main) {
  quickAnalysis();
}