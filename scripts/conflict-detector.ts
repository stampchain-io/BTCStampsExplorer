#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Conflict Detection and Resolution System
 * 
 * Detects and provides resolution strategies for conflicts between
 * parallel TypeScript error resolution agents
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

// ==================== INTERFACES ====================

interface ConflictAnalysis {
  fileConflicts: FileConflict[];
  branchConflicts: BranchConflict[];
  typeConflicts: TypeConflict[];
  dependencyConflicts: DependencyConflict[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
}

interface FileConflict {
  file: string;
  agents: string[];
  conflictType: 'modification' | 'creation' | 'deletion';
  resolution: string;
}

interface BranchConflict {
  branch: string;
  baseBranch: string;
  conflictFiles: string[];
  conflictType: 'merge' | 'rebase' | 'divergence';
  resolution: string;
}

interface TypeConflict {
  typeName: string;
  definitionLocations: string[];
  agents: string[];
  resolution: string;
}

interface DependencyConflict {
  file: string;
  dependencyChain: string[];
  affectedAgents: string[];
  resolution: string;
}

// ==================== AGENT CONFIGURATION ====================

const AGENT_BRANCHES = [
  'fix/ts2322-component-props',
  'fix/ts2322-event-handlers', 
  'fix/ts2322-type-unions',
  'fix/ts2322-import-alignment',
  'fix/ts2345-jsx-arguments',
  'fix/ts18048-null-safety'
];

const AGENT_FILE_PATTERNS = new Map([
  ['fix/ts2322-component-props', ['components/card/*.tsx', 'components/button/*.tsx', 'islands/**/*.tsx']],
  ['fix/ts2322-event-handlers', ['components/table/**/*.tsx', 'islands/modal/*.tsx', 'islands/section/**/*.tsx']],
  ['fix/ts2322-type-unions', ['lib/types/*.d.ts', 'server/types/*.d.ts']],
  ['fix/ts2322-import-alignment', ['client/**/*.ts', 'lib/utils/**/*.ts']],
  ['fix/ts2345-jsx-arguments', ['components/**/*.tsx', 'islands/**/*.tsx', 'routes/**/*.tsx']],
  ['fix/ts18048-null-safety', ['components/card/*.tsx', 'components/display/*.tsx']]
]);

// ==================== CORE CONFLICT DETECTOR ====================

class ConflictDetector {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  // ===== MAIN ANALYSIS =====

  async analyzeAllConflicts(): Promise<ConflictAnalysis> {
    console.log("🔍 Analyzing conflicts between agent branches...\n");

    const [fileConflicts, branchConflicts, typeConflicts, dependencyConflicts] = await Promise.all([
      this.detectFileConflicts(),
      this.detectBranchConflicts(),
      this.detectTypeConflicts(),
      this.detectDependencyConflicts()
    ]);

    const severity = this.calculateSeverity(fileConflicts, branchConflicts, typeConflicts, dependencyConflicts);
    const recommendedActions = this.generateRecommendations(fileConflicts, branchConflicts, typeConflicts, dependencyConflicts, severity);

    return {
      fileConflicts,
      branchConflicts,
      typeConflicts,
      dependencyConflicts,
      severity,
      recommendedActions
    };
  }

  // ===== FILE CONFLICT DETECTION =====

  private async detectFileConflicts(): Promise<FileConflict[]> {
    const conflicts: FileConflict[] = [];
    const fileModifications = new Map<string, string[]>();

    // Get modified files for each agent branch
    for (const branch of AGENT_BRANCHES) {
      try {
        const modifiedFiles = await this.getModifiedFiles(branch);
        modifiedFiles.forEach(file => {
          if (!fileModifications.has(file)) {
            fileModifications.set(file, []);
          }
          fileModifications.get(file)!.push(branch);
        });
      } catch (error) {
        console.warn(`⚠️ Could not analyze branch ${branch}: ${error.message}`);
      }
    }

    // Find overlapping modifications
    fileModifications.forEach((branches, file) => {
      if (branches.length > 1) {
        conflicts.push({
          file,
          agents: branches,
          conflictType: 'modification',
          resolution: this.getFileConflictResolution(file, branches)
        });
      }
    });

    return conflicts;
  }

  private async getModifiedFiles(branch: string): Promise<string[]> {
    const result = await this.runCommand(['git', 'diff', '--name-only', 'main...origin/' + branch]);
    if (result.success) {
      return result.stdout.trim().split('\n').filter(line => line.trim());
    }
    
    // Fallback to local branch if origin doesn't exist
    const localResult = await this.runCommand(['git', 'diff', '--name-only', 'main...' + branch]);
    if (localResult.success) {
      return localResult.stdout.trim().split('\n').filter(line => line.trim());
    }
    
    return [];
  }

  private getFileConflictResolution(file: string, branches: string[]): string {
    // Check if it's a type definition file
    if (file.endsWith('.d.ts')) {
      return `🎯 TYPE DEFINITION CONFLICT: Designate single owner for ${file}. Other agents import from canonical source.`;
    }
    
    // Check if it's a component file
    if (file.includes('components/') || file.includes('islands/')) {
      return `🧩 COMPONENT CONFLICT: Use feature flags or coordinate changes sequentially for ${file}.`;
    }
    
    // General resolution
    return `📝 GENERAL CONFLICT: Coordinate changes through git worktrees or sequential merging for ${file}.`;
  }

  // ===== BRANCH CONFLICT DETECTION =====

  private async detectBranchConflicts(): Promise<BranchConflict[]> {
    const conflicts: BranchConflict[] = [];

    for (const branch of AGENT_BRANCHES) {
      try {
        const mergeResult = await this.runCommand(['git', 'merge-tree', 'main', branch]);
        
        // If merge-tree produces output, there are conflicts
        if (mergeResult.stdout.trim()) {
          const conflictFiles = await this.extractConflictFiles(mergeResult.stdout);
          
          conflicts.push({
            branch,
            baseBranch: 'main',
            conflictFiles,
            conflictType: 'merge',
            resolution: this.getBranchConflictResolution(branch, conflictFiles)
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not check merge conflicts for ${branch}: ${error.message}`);
      }
    }

    return conflicts;
  }

  private async extractConflictFiles(mergeTreeOutput: string): Promise<string[]> {
    // Parse git merge-tree output to extract conflicted file paths
    const lines = mergeTreeOutput.split('\n');
    const files = new Set<string>();
    
    for (const line of lines) {
      if (line.startsWith('@@@ ') || line.includes('+++') || line.includes('---')) {
        const match = line.match(/[a-zA-Z0-9_\-\.\/]+\.(ts|tsx|js|jsx|d\.ts)$/);
        if (match) {
          files.add(match[0]);
        }
      }
    }
    
    return Array.from(files);
  }

  private getBranchConflictResolution(branch: string, conflictFiles: string[]): string {
    const fileCount = conflictFiles.length;
    
    if (fileCount === 0) {
      return `✅ No conflicts detected for ${branch}`;
    } else if (fileCount <= 3) {
      return `⚠️ Minor conflicts in ${branch}: Resolve manually and rebase`;
    } else if (fileCount <= 10) {
      return `🚨 Moderate conflicts in ${branch}: Stop agent, resolve conflicts, restart`;
    } else {
      return `🚨 Major conflicts in ${branch}: Full branch rebuild required`;
    }
  }

  // ===== TYPE CONFLICT DETECTION =====

  private async detectTypeConflicts(): Promise<TypeConflict[]> {
    const conflicts: TypeConflict[] = [];
    const typeDefinitions = new Map<string, string[]>();

    // Scan all type definition files across branches
    for (const branch of AGENT_BRANCHES) {
      try {
        const typeFiles = await this.getTypeFiles(branch);
        for (const file of typeFiles) {
          const types = await this.extractTypeNames(branch, file);
          types.forEach(typeName => {
            if (!typeDefinitions.has(typeName)) {
              typeDefinitions.set(typeName, []);
            }
            typeDefinitions.get(typeName)!.push(`${branch}:${file}`);
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze types in ${branch}: ${error.message}`);
      }
    }

    // Find duplicate type definitions
    typeDefinitions.forEach((locations, typeName) => {
      if (locations.length > 1) {
        const agents = [...new Set(locations.map(loc => loc.split(':')[0]))];
        if (agents.length > 1) {
          conflicts.push({
            typeName,
            definitionLocations: locations,
            agents,
            resolution: this.getTypeConflictResolution(typeName, agents)
          });
        }
      }
    });

    return conflicts;
  }

  private async getTypeFiles(branch: string): Promise<string[]> {
    const result = await this.runCommand(['git', 'ls-tree', '-r', '--name-only', branch, '*.d.ts']);
    if (result.success) {
      return result.stdout.trim().split('\n').filter(line => line.trim() && line.endsWith('.d.ts'));
    }
    return [];
  }

  private async extractTypeNames(branch: string, file: string): Promise<string[]> {
    try {
      const result = await this.runCommand(['git', 'show', `${branch}:${file}`]);
      if (!result.success) return [];

      const content = result.stdout;
      const types: string[] = [];
      
      // Extract interface, type, class, and enum names
      const patterns = [
        /interface\s+(\w+)/g,
        /type\s+(\w+)\s*=/g,
        /class\s+(\w+)/g,
        /enum\s+(\w+)/g
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          types.push(match[1]);
        }
      });

      return types;
    } catch {
      return [];
    }
  }

  private getTypeConflictResolution(typeName: string, agents: string[]): string {
    return `🎯 TYPE OWNERSHIP: Assign ${typeName} to single agent (${agents[0]}). Others import from canonical location.`;
  }

  // ===== DEPENDENCY CONFLICT DETECTION =====

  private async detectDependencyConflicts(): Promise<DependencyConflict[]> {
    const conflicts: DependencyConflict[] = [];
    
    // This is a simplified dependency analysis
    // In a real implementation, this would use TypeScript compiler API
    // to analyze import/export relationships
    
    return conflicts; // Placeholder for now
  }

  // ===== SEVERITY CALCULATION =====

  private calculateSeverity(
    fileConflicts: FileConflict[],
    branchConflicts: BranchConflict[],
    typeConflicts: TypeConflict[],
    dependencyConflicts: DependencyConflict[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    
    let score = 0;
    
    // File conflicts scoring
    score += fileConflicts.length * 2;
    
    // Branch conflicts scoring (higher weight)
    score += branchConflicts.length * 5;
    
    // Type conflicts scoring (critical for TypeScript)
    score += typeConflicts.length * 10;
    
    // Dependency conflicts scoring
    score += dependencyConflicts.length * 8;

    if (score >= 50) return 'critical';
    if (score >= 25) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  }

  // ===== RECOMMENDATIONS =====

  private generateRecommendations(
    fileConflicts: FileConflict[],
    branchConflicts: BranchConflict[],
    typeConflicts: TypeConflict[],
    dependencyConflicts: DependencyConflict[],
    severity: string
  ): string[] {
    const recommendations: string[] = [];

    // Critical actions first
    if (severity === 'critical') {
      recommendations.push("🚨 STOP ALL AGENTS: Critical conflicts detected");
      recommendations.push("🛠️ Implement conflict resolution protocol immediately");
    }

    // Type conflicts (highest priority)
    if (typeConflicts.length > 0) {
      recommendations.push(`🎯 Resolve ${typeConflicts.length} type definition conflicts first`);
      recommendations.push("📋 Establish type ownership matrix");
    }

    // Branch conflicts
    if (branchConflicts.length > 0) {
      recommendations.push(`🔄 Resolve ${branchConflicts.length} branch merge conflicts`);
      recommendations.push("🚀 Consider rebasing affected branches");
    }

    // File conflicts
    if (fileConflicts.length > 0) {
      recommendations.push(`📝 Coordinate ${fileConflicts.length} overlapping file modifications`);
      recommendations.push("🌲 Use git worktrees for parallel development");
    }

    // General recommendations
    if (severity !== 'low') {
      recommendations.push("📊 Implement real-time coordination monitoring");
      recommendations.push("🔒 Add file locking mechanism for critical files");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ No conflicts detected - proceed with current coordination");
    }

    return recommendations;
  }

  // ===== UTILITIES =====

  private async runCommand(cmd: string[]): Promise<{ success: boolean; stdout: string; stderr: string }> {
    try {
      const process = new Deno.Command(cmd[0], { 
        args: cmd.slice(1),
        cwd: this.projectRoot,
        stdout: 'piped',
        stderr: 'piped'
      });
      
      const { success, stdout, stderr } = await process.output();
      
      return {
        success,
        stdout: new TextDecoder().decode(stdout),
        stderr: new TextDecoder().decode(stderr)
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error.message
      };
    }
  }

  // ===== REPORTING =====

  async generateConflictReport(analysis: ConflictAnalysis): Promise<void> {
    console.log("🚨 Conflict Analysis Report");
    console.log("═".repeat(60));
    console.log(`📊 Overall Severity: ${this.getSeverityEmoji(analysis.severity)} ${analysis.severity.toUpperCase()}\n`);

    // File Conflicts
    if (analysis.fileConflicts.length > 0) {
      console.log("📁 File Conflicts:");
      console.log("─".repeat(40));
      analysis.fileConflicts.forEach((conflict, i) => {
        console.log(`${i + 1}. ${conflict.file}`);
        console.log(`   Agents: ${conflict.agents.join(', ')}`);
        console.log(`   🔧 ${conflict.resolution}\n`);
      });
    }

    // Branch Conflicts
    if (analysis.branchConflicts.length > 0) {
      console.log("🌿 Branch Conflicts:");
      console.log("─".repeat(40));
      analysis.branchConflicts.forEach((conflict, i) => {
        console.log(`${i + 1}. ${conflict.branch} -> ${conflict.baseBranch}`);
        console.log(`   Files: ${conflict.conflictFiles.length} conflicted`);
        console.log(`   🔧 ${conflict.resolution}\n`);
      });
    }

    // Type Conflicts
    if (analysis.typeConflicts.length > 0) {
      console.log("🎯 Type Definition Conflicts:");
      console.log("─".repeat(40));
      analysis.typeConflicts.forEach((conflict, i) => {
        console.log(`${i + 1}. ${conflict.typeName}`);
        console.log(`   Locations: ${conflict.definitionLocations.join(', ')}`);
        console.log(`   🔧 ${conflict.resolution}\n`);
      });
    }

    // Recommendations
    console.log("💡 Recommended Actions:");
    console.log("─".repeat(30));
    analysis.recommendedActions.forEach((action, i) => {
      console.log(`${i + 1}. ${action}`);
    });

    console.log("\n" + "═".repeat(60));
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '❓';
    }
  }
}

// ==================== CLI INTERFACE ====================

async function main() {
  const projectRoot = Deno.cwd();
  const detector = new ConflictDetector(projectRoot);

  const command = Deno.args[0] || 'analyze';

  switch (command) {
    case 'analyze':
      const analysis = await detector.analyzeAllConflicts();
      await detector.generateConflictReport(analysis);
      
      // Save report
      const reportDir = join(projectRoot, '.taskmaster', 'reports');
      await Deno.mkdir(reportDir, { recursive: true });
      const reportFile = join(reportDir, `conflict-analysis-${new Date().toISOString().split('T')[0]}.json`);
      await Deno.writeTextFile(reportFile, JSON.stringify(analysis, null, 2));
      console.log(`📄 Report saved to: ${reportFile}`);
      
      // Exit with error code if critical conflicts
      if (analysis.severity === 'critical') {
        Deno.exit(1);
      }
      break;
    
    case 'help':
      console.log(`
Conflict Detector Commands:

  analyze    Detect and analyze all conflicts (default)
  help       Show this help message

Usage:
  deno run --allow-all scripts/conflict-detector.ts [command]
      `);
      break;
    
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use "help" for available commands');
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}

export { ConflictDetector };