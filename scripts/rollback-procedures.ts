// Rollback and Recovery Procedures
// Purpose: Automated rollback for falsely completed tasks
// Part of Task 40.5: Rollback and Recovery Procedures

import { join } from "@std/path";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export interface RollbackAction {
  type: "revert_status" | "delete_files" | "restore_backup" | "regenerate_subtasks";
  target: string;
  details: string;
  timestamp: string;
}

export interface RollbackPlan {
  taskId: string;
  reason: string;
  dependencies: string[];
  actions: RollbackAction[];
  backupLocation?: string;
  rollbackTimestamp: string;
}

export interface DependencyChain {
  taskId: string;
  dependentTasks: string[];
  dependencyDepth: number;
  impactLevel: "low" | "medium" | "high" | "critical";
}

const RollbackPlanSchema = z.object({
  taskId: z.string(),
  reason: z.string(),
  dependencies: z.array(z.string()),
  actions: z.array(z.object({
    type: z.enum(["revert_status", "delete_files", "restore_backup", "regenerate_subtasks"]),
    target: z.string(),
    details: z.string(),
    timestamp: z.string()
  })),
  backupLocation: z.string().optional(),
  rollbackTimestamp: z.string()
});

export class RollbackManager {
  private projectRoot: string;
  private rollbackDir: string;
  private tasksPath: string;

  constructor(projectRoot: string = Deno.cwd()) {
    this.projectRoot = projectRoot;
    this.rollbackDir = join(projectRoot, ".taskmaster", "rollbacks");
    this.tasksPath = join(projectRoot, ".taskmaster", "tasks", "tasks.json");
  }

  async createRollbackPlan(
    taskId: string,
    reason: string
  ): Promise<RollbackPlan> {
    await this.ensureRollbackDirectory();

    // Analyze dependency chain
    const dependencyChain = await this.analyzeDependencyChain(taskId);
    
    // Create backup before rollback
    const backupLocation = await this.createBackup(taskId);

    const actions: RollbackAction[] = [];

    // Revert task status
    actions.push({
      type: "revert_status",
      target: taskId,
      details: `Revert task ${taskId} status from 'done' to 'pending'`,
      timestamp: new Date().toISOString()
    });

    // Revert dependent tasks if necessary
    for (const depTaskId of dependencyChain.dependentTasks) {
      actions.push({
        type: "revert_status",
        target: depTaskId,
        details: `Revert dependent task ${depTaskId} due to ${taskId} rollback`,
        timestamp: new Date().toISOString()
      });
    }

    // Regenerate subtasks for incomplete work
    actions.push({
      type: "regenerate_subtasks",
      target: taskId,
      details: `Generate new subtasks to complete remaining work for ${taskId}`,
      timestamp: new Date().toISOString()
    });

    const plan: RollbackPlan = {
      taskId,
      reason,
      dependencies: dependencyChain.dependentTasks,
      actions,
      backupLocation,
      rollbackTimestamp: new Date().toISOString()
    };

    // Save rollback plan
    await this.saveRollbackPlan(plan);

    return RollbackPlanSchema.parse(plan);
  }

  async executeRollback(plan: RollbackPlan): Promise<boolean> {
    const executionLog: string[] = [];

    try {
      // Load current tasks
      const tasksData = await this.loadTasksData();

      for (const action of plan.actions) {
        switch (action.type) {
          case "revert_status":
            await this.revertTaskStatus(tasksData, action.target);
            executionLog.push(`✅ Reverted status for task ${action.target}`);
            break;

          case "regenerate_subtasks":
            await this.regenerateSubtasks(tasksData, action.target, plan.reason);
            executionLog.push(`✅ Regenerated subtasks for task ${action.target}`);
            break;

          case "delete_files":
            await this.deleteFiles(action.target);
            executionLog.push(`✅ Deleted files: ${action.target}`);
            break;

          case "restore_backup":
            await this.restoreBackup(action.target, plan.backupLocation!);
            executionLog.push(`✅ Restored backup for: ${action.target}`);
            break;
        }
      }

      // Save updated tasks data
      await this.saveTasksData(tasksData);

      // Save execution log
      await this.saveExecutionLog(plan.taskId, executionLog);

      return true;
    } catch (error) {
      executionLog.push(`❌ Rollback failed: ${error.message}`);
      await this.saveExecutionLog(plan.taskId, executionLog);
      return false;
    }
  }

  private async analyzeDependencyChain(taskId: string): Promise<DependencyChain> {
    const tasksData = await this.loadTasksData();
    const dependentTasks: string[] = [];

    // Find tasks that depend on this task
    for (const task of tasksData.tasks) {
      if (task.dependencies?.includes(parseInt(taskId)) || 
          task.dependencies?.includes(taskId)) {
        dependentTasks.push(task.id.toString());

        // Recursively find dependent tasks
        const nestedDependents = await this.findNestedDependents(
          task.id.toString(),
          tasksData
        );
        dependentTasks.push(...nestedDependents);
      }
    }

    // Remove duplicates
    const uniqueDependents = [...new Set(dependentTasks)];

    return {
      taskId,
      dependentTasks: uniqueDependents,
      dependencyDepth: uniqueDependents.length,
      impactLevel: this.calculateImpactLevel(uniqueDependents.length)
    };
  }

  private async findNestedDependents(
    taskId: string,
    tasksData: any,
    visited: Set<string> = new Set()
  ): Promise<string[]> {
    if (visited.has(taskId)) return [];
    visited.add(taskId);

    const dependents: string[] = [];

    for (const task of tasksData.tasks) {
      if (task.dependencies?.includes(parseInt(taskId)) || 
          task.dependencies?.includes(taskId)) {
        dependents.push(task.id.toString());
        const nested = await this.findNestedDependents(
          task.id.toString(),
          tasksData,
          visited
        );
        dependents.push(...nested);
      }
    }

    return dependents;
  }

  private calculateImpactLevel(dependencyCount: number): "low" | "medium" | "high" | "critical" {
    if (dependencyCount === 0) return "low";
    if (dependencyCount <= 2) return "medium";
    if (dependencyCount <= 5) return "high";
    return "critical";
  }

  private async createBackup(taskId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(this.rollbackDir, `backup-${taskId}-${timestamp}`);
    
    await Deno.mkdir(backupDir, { recursive: true });

    // Backup tasks.json
    const tasksBackup = join(backupDir, "tasks.json");
    await Deno.copyFile(this.tasksPath, tasksBackup);

    // Backup any task-related files
    const taskFiles = await this.findTaskRelatedFiles(taskId);
    for (const file of taskFiles) {
      const relativePath = file.replace(this.projectRoot, "");
      const backupPath = join(backupDir, "files", relativePath);
      await Deno.mkdir(join(backupPath, ".."), { recursive: true });
      await Deno.copyFile(file, backupPath);
    }

    return backupDir;
  }

  private async findTaskRelatedFiles(taskId: string): Promise<string[]> {
    const files: string[] = [];
    
    // Search for files that might be related to the task
    const searchPaths = [
      "lib/types",
      "components", 
      "islands",
      "routes",
      "server",
      "tests",
      "scripts",
      ".taskmaster/tasks"
    ];

    for (const searchPath of searchPaths) {
      const fullPath = join(this.projectRoot, searchPath);
      try {
        await this.searchDirectoryForTaskFiles(fullPath, taskId, files);
      } catch {
        // Directory might not exist
      }
    }

    return files;
  }

  private async searchDirectoryForTaskFiles(
    dirPath: string,
    taskId: string,
    results: string[]
  ): Promise<void> {
    try {
      for await (const entry of Deno.readDir(dirPath)) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory) {
          await this.searchDirectoryForTaskFiles(fullPath, taskId, results);
        } else if (entry.isFile) {
          // Check if file name or content mentions the task
          if (entry.name.includes(taskId)) {
            results.push(fullPath);
          } else {
            try {
              const content = await Deno.readTextFile(fullPath);
              if (content.includes(`task ${taskId}`) || 
                  content.includes(`task-${taskId}`) ||
                  content.includes(`Task ${taskId}`)) {
                results.push(fullPath);
              }
            } catch {
              // File might be binary or unreadable
            }
          }
        }
      }
    } catch {
      // Directory access error
    }
  }

  private async revertTaskStatus(tasksData: any, taskId: string): Promise<void> {
    const task = tasksData.tasks.find((t: any) => t.id.toString() === taskId);
    if (task) {
      task.status = "pending";
      
      // Also revert subtasks
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          if (subtask.status === "done") {
            subtask.status = "pending";
          }
        }
      }
    }
  }

  private async regenerateSubtasks(
    tasksData: any,
    taskId: string,
    reason: string
  ): Promise<void> {
    const task = tasksData.tasks.find((t: any) => t.id.toString() === taskId);
    if (task) {
      // Add a new subtask to address the incomplete work
      const newSubtask = {
        id: task.subtasks ? task.subtasks.length + 1 : 1,
        title: `Address Incomplete Work (Rollback Recovery)`,
        description: `Complete the work that was incorrectly marked as done. Reason for rollback: ${reason}`,
        status: "pending",
        dependencies: [],
        details: `This subtask was generated due to rollback of falsely completed task. Original completion claim needs to be properly implemented.`,
        testStrategy: `Verify actual completion with physical evidence before marking as done.`
      };

      if (!task.subtasks) {
        task.subtasks = [];
      }
      task.subtasks.push(newSubtask);
    }
  }

  private async deleteFiles(target: string): Promise<void> {
    try {
      await Deno.remove(target, { recursive: true });
    } catch {
      // File might not exist
    }
  }

  private async restoreBackup(target: string, backupLocation: string): Promise<void> {
    const backupFile = join(backupLocation, "files", target);
    try {
      await Deno.copyFile(backupFile, target);
    } catch {
      // Backup file might not exist
    }
  }

  private async loadTasksData(): Promise<any> {
    const content = await Deno.readTextFile(this.tasksPath);
    return JSON.parse(content);
  }

  private async saveTasksData(data: any): Promise<void> {
    await Deno.writeTextFile(this.tasksPath, JSON.stringify(data, null, 2));
  }

  private async ensureRollbackDirectory(): Promise<void> {
    try {
      await Deno.mkdir(this.rollbackDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  private async saveRollbackPlan(plan: RollbackPlan): Promise<void> {
    const planPath = join(this.rollbackDir, `rollback-plan-${plan.taskId}-${Date.now()}.json`);
    await Deno.writeTextFile(planPath, JSON.stringify(plan, null, 2));
  }

  private async saveExecutionLog(taskId: string, log: string[]): Promise<void> {
    const logPath = join(this.rollbackDir, `execution-log-${taskId}-${Date.now()}.txt`);
    await Deno.writeTextFile(logPath, log.join('\n'));
  }
}

// Progress recalculation after rollback
export async function recalculateProgress(): Promise<{
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  totalSubtasks: number;
  completedSubtasks: number;
  subtaskCompletionPercentage: number;
}> {
  const rollbackManager = new RollbackManager();
  const tasksData = await rollbackManager.loadTasksData();

  let totalTasks = 0;
  let completedTasks = 0;
  let totalSubtasks = 0;
  let completedSubtasks = 0;

  for (const task of tasksData.tasks) {
    totalTasks++;
    if (task.status === "done") {
      completedTasks++;
    }

    if (task.subtasks) {
      for (const subtask of task.subtasks) {
        totalSubtasks++;
        if (subtask.status === "done") {
          completedSubtasks++;
        }
      }
    }
  }

  return {
    totalTasks,
    completedTasks,
    completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    totalSubtasks,
    completedSubtasks,
    subtaskCompletionPercentage: totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0
  };
}

// CLI Entry Point
if (import.meta.main) {
  const command = Deno.args[0];
  const taskId = Deno.args[1];
  const reason = Deno.args[2];

  if (command === "plan" && taskId && reason) {
    const manager = new RollbackManager();
    const plan = await manager.createRollbackPlan(taskId, reason);
    console.log("Rollback plan created:");
    console.log(JSON.stringify(plan, null, 2));
  } else if (command === "execute" && taskId) {
    // Load and execute most recent rollback plan for task
    const manager = new RollbackManager();
    const rollbackDir = join(Deno.cwd(), ".taskmaster", "rollbacks");
    
    // Find most recent plan file
    let latestPlan: RollbackPlan | null = null;
    let latestTime = 0;
    
    try {
      for await (const entry of Deno.readDir(rollbackDir)) {
        if (entry.name.startsWith(`rollback-plan-${taskId}-`) && entry.name.endsWith('.json')) {
          const stat = await Deno.stat(join(rollbackDir, entry.name));
          if (stat.mtime && stat.mtime.getTime() > latestTime) {
            latestTime = stat.mtime.getTime();
            const content = await Deno.readTextFile(join(rollbackDir, entry.name));
            latestPlan = JSON.parse(content);
          }
        }
      }
    } catch {
      // Rollback directory might not exist
    }

    if (latestPlan) {
      const success = await manager.executeRollback(latestPlan);
      console.log(success ? "✅ Rollback executed successfully" : "❌ Rollback failed");
      Deno.exit(success ? 0 : 1);
    } else {
      console.error(`No rollback plan found for task ${taskId}`);
      Deno.exit(1);
    }
  } else if (command === "recalculate") {
    const progress = await recalculateProgress();
    console.log("Updated progress after rollback:");
    console.log(JSON.stringify(progress, null, 2));
  } else {
    console.error("Usage: ");
    console.error("  deno run scripts/rollback-procedures.ts plan <taskId> <reason>");
    console.error("  deno run scripts/rollback-procedures.ts execute <taskId>");
    console.error("  deno run scripts/rollback-procedures.ts recalculate");
    Deno.exit(1);
  }
}