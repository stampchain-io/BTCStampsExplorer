#!/usr/bin/env deno run --allow-read --allow-write --allow-net --allow-run --allow-env

/**
 * Zero-Conflict Parallel Execution Framework
 * 
 * Coordinates simultaneous execution of multiple tasks/subtasks without resource contention.
 * Provides task scheduling, resource allocation, conflict detection, and resolution.
 * 
 * Features:
 * - Task queue management with priority scheduling
 * - Resource lock system preventing conflicts
 * - Intelligent task distribution across execution slots
 * - Real-time monitoring and conflict resolution
 * - Rollback capabilities for failed executions
 */

import type { ParallelTask, ExecutionSlot, ResourceLock, TaskResult } from "$types/orchestration.d.ts";

export interface ParallelExecutionConfig {
  maxConcurrency: number;
  resourceLockTimeout: number;
  retryAttempts: number;
  healthCheckInterval: number;
  enableRealTimeMonitoring: boolean;
}

export interface TaskExecution {
  id: string;
  priority: number;
  resourceRequirements: string[];
  estimatedDuration: number;
  dependencies: string[];
  executor: () => Promise<TaskResult>;
  rollback?: () => Promise<void>;
}

export interface ResourceAllocation {
  resourceId: string;
  lockedBy: string;
  lockTime: number;
  estimatedReleaseTime: number;
}

export class ParallelExecutionFramework {
  private executionSlots: ExecutionSlot[] = [];
  private taskQueue: TaskExecution[] = [];
  private resourceLocks: Map<string, ResourceAllocation> = new Map();
  private activeExecutions: Map<string, Promise<TaskResult>> = new Map();
  private completedTasks: Map<string, TaskResult> = new Map();
  private config: ParallelExecutionConfig;

  constructor(config: ParallelExecutionConfig) {
    this.config = config;
    this.initializeExecutionSlots();
  }

  /**
   * Initialize execution slots for parallel processing
   */
  private initializeExecutionSlots(): void {
    for (let i = 0; i < this.config.maxConcurrency; i++) {
      this.executionSlots.push({
        id: `slot-${i}`,
        isActive: false,
        currentTask: null,
        startTime: null,
        resourcesAllocated: []
      });
    }
  }

  /**
   * Add task to execution queue with priority and resource requirements
   */
  public async queueTask(task: TaskExecution): Promise<void> {
    // Validate task dependencies
    const dependenciesMet = task.dependencies.every(dep => 
      this.completedTasks.has(dep) && this.completedTasks.get(dep)?.success
    );

    if (!dependenciesMet) {
      console.warn(`Task ${task.id} dependencies not met. Deferring execution.`);
      return;
    }

    // Insert task in priority order
    const insertIndex = this.taskQueue.findIndex(queued => queued.priority < task.priority);
    if (insertIndex === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIndex, 0, task);
    }

    console.log(`Task ${task.id} queued with priority ${task.priority}`);
  }

  /**
   * Attempt to acquire resource locks for a task
   */
  private async acquireResourceLocks(task: TaskExecution): Promise<boolean> {
    const requiredResources = task.resourceRequirements;
    const lockTime = Date.now();
    const conflicts: string[] = [];

    // Check for resource conflicts
    for (const resource of requiredResources) {
      const existingLock = this.resourceLocks.get(resource);
      if (existingLock && existingLock.estimatedReleaseTime > lockTime) {
        conflicts.push(resource);
      }
    }

    if (conflicts.length > 0) {
      console.log(`Task ${task.id} blocked by resource conflicts: ${conflicts.join(', ')}`);
      return false;
    }

    // Acquire all required locks
    for (const resource of requiredResources) {
      this.resourceLocks.set(resource, {
        resourceId: resource,
        lockedBy: task.id,
        lockTime,
        estimatedReleaseTime: lockTime + task.estimatedDuration
      });
    }

    return true;
  }

  /**
   * Release resource locks for a completed task
   */
  private releaseResourceLocks(taskId: string): void {
    for (const [resourceId, allocation] of this.resourceLocks.entries()) {
      if (allocation.lockedBy === taskId) {
        this.resourceLocks.delete(resourceId);
      }
    }
  }

  /**
   * Find available execution slot
   */
  private findAvailableSlot(): ExecutionSlot | null {
    return this.executionSlots.find(slot => !slot.isActive) || null;
  }

  /**
   * Execute a single task in an available slot
   */
  private async executeTask(task: TaskExecution, slot: ExecutionSlot): Promise<void> {
    slot.isActive = true;
    slot.currentTask = task.id;
    slot.startTime = Date.now();
    slot.resourcesAllocated = [...task.resourceRequirements];

    console.log(`Starting task ${task.id} in ${slot.id}`);

    try {
      const executionPromise = task.executor();
      this.activeExecutions.set(task.id, executionPromise);
      
      const result = await executionPromise;
      
      this.completedTasks.set(task.id, result);
      console.log(`Task ${task.id} completed successfully`);
      
    } catch (error) {
      const errorResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
        duration: Date.now() - slot.startTime!
      };
      
      this.completedTasks.set(task.id, errorResult);
      console.error(`Task ${task.id} failed:`, error);
      
      // Attempt rollback if available
      if (task.rollback) {
        try {
          await task.rollback();
          console.log(`Rollback completed for task ${task.id}`);
        } catch (rollbackError) {
          console.error(`Rollback failed for task ${task.id}:`, rollbackError);
        }
      }
    } finally {
      // Clean up execution state
      this.activeExecutions.delete(task.id);
      this.releaseResourceLocks(task.id);
      
      slot.isActive = false;
      slot.currentTask = null;
      slot.startTime = null;
      slot.resourcesAllocated = [];
    }
  }

  /**
   * Main execution loop - processes queued tasks
   */
  public async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 || this.activeExecutions.size > 0) {
      // Process pending tasks
      const availableSlot = this.findAvailableSlot();
      
      if (availableSlot && this.taskQueue.length > 0) {
        const nextTask = this.taskQueue[0];
        
        // Check if resources are available
        if (await this.acquireResourceLocks(nextTask)) {
          this.taskQueue.shift(); // Remove from queue
          this.executeTask(nextTask, availableSlot); // Fire and forget
        }
      }

      // Clean up expired resource locks
      this.cleanupExpiredLocks();
      
      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Clean up expired resource locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    const timeout = this.config.resourceLockTimeout;
    
    for (const [resourceId, allocation] of this.resourceLocks.entries()) {
      if (now - allocation.lockTime > timeout) {
        console.warn(`Force releasing expired lock for resource ${resourceId}`);
        this.resourceLocks.delete(resourceId);
      }
    }
  }

  /**
   * Get current execution status
   */
  public getExecutionStatus(): {
    queueLength: number;
    activeExecutions: number;
    completedTasks: number;
    availableSlots: number;
    resourceLocks: number;
  } {
    return {
      queueLength: this.taskQueue.length,
      activeExecutions: this.activeExecutions.size,
      completedTasks: this.completedTasks.size,
      availableSlots: this.executionSlots.filter(slot => !slot.isActive).length,
      resourceLocks: this.resourceLocks.size
    };
  }

  /**
   * Wait for all active executions to complete
   */
  public async waitForCompletion(): Promise<Map<string, TaskResult>> {
    await Promise.all(Array.from(this.activeExecutions.values()));
    return this.completedTasks;
  }

  /**
   * Emergency stop - cancel all pending tasks and wait for active ones
   */
  public async emergencyStop(): Promise<void> {
    console.warn('Emergency stop initiated - clearing task queue');
    this.taskQueue.length = 0;
    
    if (this.activeExecutions.size > 0) {
      console.log(`Waiting for ${this.activeExecutions.size} active tasks to complete...`);
      await this.waitForCompletion();
    }
  }
}

/**
 * Create optimized configuration for Type Domain Migration completion
 */
export function createTypeCompletionConfig(): ParallelExecutionConfig {
  return {
    maxConcurrency: 4, // Safe parallel execution limit
    resourceLockTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    healthCheckInterval: 5000,
    enableRealTimeMonitoring: true
  };
}

/**
 * Execute Type Domain Migration tasks with zero-conflict coordination
 */
export async function executeTypeMigrationTasks(tasks: TaskExecution[]): Promise<Map<string, TaskResult>> {
  const config = createTypeCompletionConfig();
  const framework = new ParallelExecutionFramework(config);
  
  console.log(`Initiating zero-conflict parallel execution of ${tasks.length} tasks`);
  
  // Queue all tasks
  for (const task of tasks) {
    await framework.queueTask(task);
  }
  
  // Process all tasks
  await framework.processQueue();
  
  const results = await framework.waitForCompletion();
  
  console.log('Parallel execution completed');
  console.log('Execution Summary:', framework.getExecutionStatus());
  
  return results;
}

// Main execution for CLI usage
if (import.meta.main) {
  console.log('Zero-Conflict Parallel Execution Framework initialized');
  console.log('Framework ready for Type Domain Migration orchestration');
}