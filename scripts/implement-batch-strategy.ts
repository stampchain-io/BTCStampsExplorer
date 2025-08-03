#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Maximum Velocity Batch Strategy Implementation
 * 
 * This script implements the batch processing strategy for optimizing
 * import aliases across the codebase in coordinated batches.
 * 
 * Designed for Task 32.2: Implement Maximum Velocity Batch Strategy
 */

import { type AnalysisReport, type ImportImprovement } from "./analyze-import-alias-improvements.ts";

interface BatchConfiguration {
  batchId: number;
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedFiles: number;
  estimatedDuration: string;
  dependencies: number[];
  validationLevel: "comprehensive" | "standard" | "minimal";
}

interface BatchExecutionPlan {
  batches: BatchConfiguration[];
  executionOrder: number[];
  totalFiles: number;
  estimatedDuration: string;
  parallelExecutionCompatible: boolean;
  rollbackStrategy: string;
}

class BatchStrategyPlanner {
  private report: AnalysisReport;
  
  constructor(report: AnalysisReport) {
    this.report = report;
  }

  createExecutionPlan(): BatchExecutionPlan {
    console.log("📋 Creating maximum velocity batch execution plan...");
    
    const batches = this.defineBatches();
    const executionOrder = this.determineExecutionOrder(batches);
    
    const plan: BatchExecutionPlan = {
      batches,
      executionOrder,
      totalFiles: this.report.totalImprovements,
      estimatedDuration: this.calculateTotalDuration(batches),
      parallelExecutionCompatible: this.assessParallelCompatibility(),
      rollbackStrategy: this.defineRollbackStrategy()
    };

    console.log("✅ Batch execution plan created successfully");
    return plan;
  }

  private defineBatches(): BatchConfiguration[] {
    const { batch1, batch2, batch3, batch4 } = this.report.batchStrategy;
    
    return [
      {
        batchId: 1,
        name: "High-Impact Services and API Routes",
        description: "Priority processing of core services, API endpoints, and critical business logic files",
        priority: "high" as const,
        estimatedFiles: batch1.length,
        estimatedDuration: this.estimateDuration(batch1.length, "high"),
        dependencies: [],
        validationLevel: "comprehensive" as const
      },
      {
        batchId: 2,
        name: "Core Components and UI Modules",
        description: "Frequent usage targets including islands, components, and UI-critical modules",
        priority: "high" as const,
        estimatedFiles: batch2.length,
        estimatedDuration: this.estimateDuration(batch2.length, "high"),
        dependencies: [1], // Wait for services to be stable
        validationLevel: "comprehensive" as const
      },
      {
        batchId: 3,
        name: "Utility and Helper Files",
        description: "Systematic optimization of lib utilities, helpers, and type definitions",
        priority: "medium" as const,
        estimatedFiles: batch3.length,
        estimatedDuration: this.estimateDuration(batch3.length, "medium"),
        dependencies: [1, 2], // Ensure core systems are stable
        validationLevel: "standard" as const
      },
      {
        batchId: 4,
        name: "Test Files and Configuration",
        description: "Final consistency pass for test files, configuration, and edge cases",
        priority: "low" as const,
        estimatedFiles: batch4.length,
        estimatedDuration: this.estimateDuration(batch4.length, "low"),
        dependencies: [1, 2, 3], // Execute after all production code
        validationLevel: "minimal" as const
      }
    ];
  }

  private estimateDuration(fileCount: number, priority: "high" | "medium" | "low"): string {
    // Base processing time per file based on priority
    const baseTimePerFile = {
      high: 30,    // 30 seconds per file (more validation)
      medium: 20,  // 20 seconds per file (standard validation)
      low: 15      // 15 seconds per file (minimal validation)
    };

    const totalSeconds = fileCount * baseTimePerFile[priority];
    const minutes = Math.ceil(totalSeconds / 60);
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  private determineExecutionOrder(batches: BatchConfiguration[]): number[] {
    // Sort by priority and dependencies for optimal execution
    const sorted = [...batches].sort((a, b) => {
      // High priority first
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Then by dependency count (fewer dependencies first)
      return a.dependencies.length - b.dependencies.length;
    });

    return sorted.map(batch => batch.batchId);
  }

  private calculateTotalDuration(batches: BatchConfiguration[]): string {
    // Calculate if executing in sequence vs parallel
    const sequentialMinutes = batches.reduce((total, batch) => {
      const minutes = parseInt(batch.estimatedDuration.split(' ')[0]);
      return total + minutes;
    }, 0);

    // Parallel execution assumes some batches can run concurrently
    const parallelMinutes = Math.max(
      ...batches.map(batch => parseInt(batch.estimatedDuration.split(' ')[0]))
    ) * 1.5; // 50% overhead for coordination

    const optimalMinutes = Math.min(sequentialMinutes, parallelMinutes);

    if (optimalMinutes < 60) {
      return `${optimalMinutes} minutes`;
    } else {
      const hours = Math.floor(optimalMinutes / 60);
      const remainingMinutes = optimalMinutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  private assessParallelCompatibility(): boolean {
    // Check if batches can be executed in parallel based on dependencies
    const { batch1, batch2, batch3, batch4 } = this.report.batchStrategy;
    
    // Parallel execution is feasible if:
    // 1. No overlapping file modifications
    // 2. Minimal cross-dependencies
    // 3. Independent validation paths
    
    const hasOverlappingFiles = this.checkFileOverlap([batch1, batch2, batch3, batch4]);
    const hasCrossDependencies = this.checkCrossDependencies();
    
    return !hasOverlappingFiles && !hasCrossDependencies;
  }

  private checkFileOverlap(batches: ImportImprovement[][]): boolean {
    const allFiles = new Set<string>();
    
    for (const batch of batches) {
      for (const improvement of batch) {
        if (allFiles.has(improvement.file)) {
          return true; // Found overlap
        }
        allFiles.add(improvement.file);
      }
    }
    
    return false;
  }

  private checkCrossDependencies(): boolean {
    // For import optimizations, cross-dependencies are minimal
    // The main concern is ensuring type definitions are stable before usage
    const typeFiles = this.report.priorityRanking.filter(imp => 
      imp.category === "types" || imp.file.includes("/types/")
    );
    
    const usageFiles = this.report.priorityRanking.filter(imp =>
      imp.category !== "types" && !imp.file.includes("/types/")
    );

    return typeFiles.length > 0 && usageFiles.length > 0;
  }

  private defineRollbackStrategy(): string {
    return `
**Rollback Strategy for Import Alias Optimization**

1. **Git-based Rollback**:
   - Each batch creates a separate commit for easy rollback
   - Use: git revert [commit-hash] for specific batch rollback
   - Full rollback: git reset --hard [pre-batch commit]

2. **Backup Strategy**:
   - Create backup branch before starting: git checkout -b backup/pre-import-optimization
   - Preserve original file patterns in backup files
   - Document all changes in batch reports

3. **Validation Checkpoints**:
   - TypeScript compilation must pass after each batch
   - Test suite execution required for high-priority batches
   - Performance benchmarks for critical paths

4. **Automated Rollback Triggers**:
   - Compilation errors: Auto-rollback affected batch
   - Test failures: Selective rollback with manual review
   - Performance degradation >10%: Full rollback recommended

5. **Recovery Procedures**:
   - Use TypeScript compiler errors to identify problematic imports
   - Selective file restoration from backup branch
   - Re-run analysis to identify remaining improvements post-rollback
`;
  }

  generateBatchSummary(plan: BatchExecutionPlan): void {
    console.log("\n🚀 MAXIMUM VELOCITY BATCH EXECUTION PLAN");
    console.log("=" .repeat(60));
    console.log(`Total files to process: ${plan.totalFiles}`);
    console.log(`Estimated total duration: ${plan.estimatedDuration}`);
    console.log(`Parallel execution compatible: ${plan.parallelExecutionCompatible ? "✅ Yes" : "❌ No"}`);
    
    console.log("\n📊 Batch Configuration:");
    for (const batch of plan.batches) {
      console.log(`\n  Batch ${batch.batchId}: ${batch.name}`);
      console.log(`    Files: ${batch.estimatedFiles}`);
      console.log(`    Priority: ${batch.priority.toUpperCase()}`);
      console.log(`    Duration: ${batch.estimatedDuration}`);
      console.log(`    Validation: ${batch.validationLevel}`);
      if (batch.dependencies.length > 0) {
        console.log(`    Dependencies: Batch ${batch.dependencies.join(", ")}`);
      }
    }

    console.log("\n🔄 Execution Order:");
    const orderedBatches = plan.executionOrder.map(id => 
      plan.batches.find(b => b.batchId === id)!
    );
    orderedBatches.forEach((batch, index) => {
      console.log(`  ${index + 1}. Batch ${batch.batchId}: ${batch.name} (${batch.estimatedFiles} files)`);
    });

    console.log("\n⚡ Performance Optimization:");
    if (plan.parallelExecutionCompatible) {
      console.log("  • Batch 1 & 2 can run in parallel (different file types)");
      console.log("  • Batch 3 can start once Batch 1 completes (type stability)");
      console.log("  • Batch 4 executes independently (test files)");
    } else {
      console.log("  • Sequential execution recommended");
      console.log("  • Dependencies between batches require coordination");
    }

    console.log("\n📋 Next Steps:");
    console.log("  1. Run: deno task type:check  # Baseline validation");
    console.log("  2. Execute: ./scripts/execute-batch-processing.ts --batch=1");
    console.log("  3. Validate: deno task check && deno task test:unit");
    console.log("  4. Continue with subsequent batches");
  }
}

// Load analysis report and create batch strategy
async function main() {
  try {
    const reportPath = "./scripts/import-alias-analysis-report.json";
    const reportContent = await Deno.readTextFile(reportPath);
    const report: AnalysisReport = JSON.parse(reportContent);

    const planner = new BatchStrategyPlanner(report);
    const plan = planner.createExecutionPlan();

    // Save the execution plan
    const planPath = "./scripts/batch-execution-plan.json";
    await Deno.writeTextFile(planPath, JSON.stringify(plan, null, 2));

    // Generate summary
    planner.generateBatchSummary(plan);

    console.log(`\n💾 Execution plan saved to: ${planPath}`);
    console.log("✅ Maximum velocity batch strategy ready for implementation!");

    return plan;
  } catch (error) {
    console.error("❌ Error creating batch strategy:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}

export { BatchStrategyPlanner, type BatchConfiguration, type BatchExecutionPlan };