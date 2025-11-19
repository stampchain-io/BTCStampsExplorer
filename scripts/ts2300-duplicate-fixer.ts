#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * TS2300 Duplicate Identifier Fixer
 * Coordinates multiple agents to fix duplicate identifier errors
 */

// No external imports needed for this script

interface DuplicateError {
  file: string;
  identifier: string;
  line: number;
  type: 'import' | 'property' | 'type';
}

interface FixResult {
  file: string;
  fixed: boolean;
  error?: string;
  changes: string[];
}

// Agent to analyze TS2300 errors
class AnalysisAgent {
  async analyzeErrors(): Promise<DuplicateError[]> {
    console.log("[AnalysisAgent] Analyzing TS2300 errors...");
    
    const errors: DuplicateError[] = [];
    
    // Run deno check and capture output
    const proc = new Deno.Command("deno", {
      args: ["check", "main.ts"],
      stderr: "piped",
      stdout: "piped"
    });
    
    const { stderr } = await proc.output();
    const errorText = new TextDecoder().decode(stderr);
    
    // Parse TS2300 errors
    const lines = errorText.split('\n');
    let currentFile = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Capture file path
      if (line.includes('at file:///')) {
        const match = line.match(/at file:\/\/(.+?):\d+:\d+/);
        if (match) currentFile = match[1];
      }
      
      // Capture TS2300 errors
      if (line.includes('TS2300') && line.includes('Duplicate identifier')) {
        const identMatch = line.match(/Duplicate identifier '(.+?)'/);
        if (identMatch && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const lineMatch = lines[i + 2]?.match(/at .+?:(\d+):/);
          
          if (identMatch[1] === 'OffsetPaginationParams') {
            errors.push({
              file: currentFile,
              identifier: identMatch[1],
              line: lineMatch ? parseInt(lineMatch[1]) : 0,
              type: 'import'
            });
          } else {
            errors.push({
              file: currentFile,
              identifier: identMatch[1],
              line: lineMatch ? parseInt(lineMatch[1]) : 0,
              type: 'property'
            });
          }
        }
      }
    }
    
    // Group by file
    const uniqueErrors = new Map<string, DuplicateError[]>();
    errors.forEach(error => {
      if (!uniqueErrors.has(error.file)) {
        uniqueErrors.set(error.file, []);
      }
      uniqueErrors.get(error.file)!.push(error);
    });
    
    console.log(`[AnalysisAgent] Found ${errors.length} duplicate identifier errors in ${uniqueErrors.size} files`);
    return errors;
  }
}

// Agent to fix duplicate imports
class ImportFixAgent {
  async fixDuplicateImports(file: string, errors: DuplicateError[]): Promise<FixResult> {
    console.log(`[ImportFixAgent] Fixing ${file}...`);
    
    const changes: string[] = [];
    try {
      const content = await Deno.readTextFile(file);
      const lines = content.split('\n');
      const seenImports = new Set<string>();
      const newLines: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for duplicate OffsetPaginationParams imports
        if (line.includes('import type { OffsetPaginationParams }')) {
          const importKey = 'OffsetPaginationParams';
          if (seenImports.has(importKey)) {
            changes.push(`Removed duplicate import at line ${i + 1}`);
            continue; // Skip duplicate import
          }
          seenImports.add(importKey);
        }
        
        newLines.push(line);
      }
      
      // Write fixed content
      await Deno.writeTextFile(file, newLines.join('\n'));
      
      return {
        file,
        fixed: true,
        changes
      };
    } catch (error) {
      return {
        file,
        fixed: false,
        error: error.message,
        changes
      };
    }
  }
}

// Agent to fix duplicate properties in interfaces
class PropertyFixAgent {
  async fixDuplicateProperties(file: string, errors: DuplicateError[]): Promise<FixResult> {
    console.log(`[PropertyFixAgent] Analyzing ${file} for property duplicates...`);
    
    const propertyErrors = errors.filter(e => e.type === 'property');
    if (propertyErrors.length === 0) {
      return { file, fixed: true, changes: [] };
    }
    
    const changes: string[] = [];
    
    // For now, just report the duplicate properties
    // These often require manual review as they may be in different interfaces
    propertyErrors.forEach(error => {
      changes.push(`Found duplicate property '${error.identifier}' at line ${error.line} - requires manual review`);
    });
    
    return {
      file,
      fixed: false,
      changes
    };
  }
}

// Main coordinator
class DuplicateFixerCoordinator {
  private analysisAgent = new AnalysisAgent();
  private importFixAgent = new ImportFixAgent();
  private propertyFixAgent = new PropertyFixAgent();
  
  async run() {
    console.log("=== TS2300 Duplicate Identifier Fixer ===\n");
    
    // Phase 1: Analysis
    const errors = await this.analysisAgent.analyzeErrors();
    
    if (errors.length === 0) {
      console.log("No TS2300 errors found!");
      return;
    }
    
    // Group errors by file
    const errorsByFile = new Map<string, DuplicateError[]>();
    errors.forEach(error => {
      if (!errorsByFile.has(error.file)) {
        errorsByFile.set(error.file, []);
      }
      errorsByFile.get(error.file)!.push(error);
    });
    
    // Phase 2: Fix in parallel
    console.log("\n[Coordinator] Deploying fix agents...");
    
    const fixPromises: Promise<FixResult>[] = [];
    
    for (const [file, fileErrors] of errorsByFile) {
      // Deploy appropriate agents based on error types
      const importErrors = fileErrors.filter(e => e.type === 'import');
      const propertyErrors = fileErrors.filter(e => e.type === 'property');
      
      if (importErrors.length > 0) {
        fixPromises.push(this.importFixAgent.fixDuplicateImports(file, importErrors));
      }
      
      if (propertyErrors.length > 0) {
        fixPromises.push(this.propertyFixAgent.fixDuplicateProperties(file, propertyErrors));
      }
    }
    
    // Wait for all fixes
    const results = await Promise.all(fixPromises);
    
    // Phase 3: Report results
    console.log("\n=== Fix Results ===");
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach(result => {
      if (result.fixed) {
        successCount++;
        console.log(`✅ ${result.file}`);
        result.changes.forEach(change => console.log(`   - ${change}`));
      } else {
        failureCount++;
        console.log(`❌ ${result.file}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        result.changes.forEach(change => console.log(`   - ${change}`));
      }
    });
    
    console.log(`\nSummary: ${successCount} files fixed, ${failureCount} files require manual review`);
    
    // Phase 4: Validate
    console.log("\n[Coordinator] Running validation...");
    await this.validate();
  }
  
  private async validate() {
    const proc = new Deno.Command("deno", {
      args: ["check", "main.ts"],
      stderr: "piped"
    });
    
    const { stderr } = await proc.output();
    const errorText = new TextDecoder().decode(stderr);
    
    const remainingTS2300 = (errorText.match(/TS2300/g) || []).length;
    console.log(`\nRemaining TS2300 errors: ${remainingTS2300}`);
    
    if (remainingTS2300 === 0) {
      console.log("✅ All TS2300 errors fixed!");
    } else {
      console.log("⚠️  Some TS2300 errors remain. Run 'deno check main.ts' for details.");
    }
  }
}

// Run the coordinator
if (import.meta.main) {
  const coordinator = new DuplicateFixerCoordinator();
  await coordinator.run();
}