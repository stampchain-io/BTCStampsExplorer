/**
 * Migration Orchestrator - Task 38.1
 * Core orchestration system for type domain migration completion
 *
 * Progressive completion tracking: 210/221 subtasks (95.02%)
 * Drives systematic completion from 95.02% to 100%
 */

// Using native EventTarget from global scope

// === Core Migration Status Interface ===
export interface TypeMigrationStatus {
  readonly id: string;
  readonly taskId: string;
  readonly status: MigrationState;
  readonly progress: number; // 0-100
  readonly startTime: Date;
  readonly lastUpdate: Date;
  readonly completionTime?: Date | undefined;
  readonly assignedSpecialist?: string | undefined;
  readonly blockers: BlockerInfo[];
  readonly metadata: Record<string, unknown>;
}

export type MigrationState =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed"
  | "blocked";

export interface BlockerInfo {
  readonly id: string;
  readonly type: "dependency" | "technical" | "resource" | "external";
  readonly description: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly createdAt: Date;
  readonly resolvedAt?: Date;
  readonly assignedTo?: string;
}

// === Delegation Monitoring ===
export interface DelegationMonitor {
  readonly assignments: Map<string, SpecialistAssignment>;

  assignSpecialist(
    taskId: string,
    specialist: string,
    capabilities: string[],
  ): void;
  getAssignment(taskId: string): SpecialistAssignment | undefined;
  releaseSpecialist(taskId: string): void;
  getWorkload(specialist: string): number;
  listActiveAssignments(): SpecialistAssignment[];
}

export interface SpecialistAssignment {
  readonly taskId: string;
  readonly specialist: string;
  readonly capabilities: string[];
  readonly assignedAt: Date;
  readonly expectedCompletion?: Date;
  readonly status: "assigned" | "active" | "completed" | "reassigned";
}

// === Progress Reporting ===
export interface ProgressReporter {
  generateReport(): MigrationProgressReport;
  getCompletionRate(): number;
  getBlockerSummary(): BlockerSummary;
  getSpecialistUtilization(): SpecialistUtilization[];
  estimateCompletion(): Date | null;
}

export interface MigrationProgressReport {
  readonly timestamp: Date;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly inProgressTasks: number;
  readonly blockedTasks: number;
  readonly failedTasks: number;
  readonly completionRate: number; // 0-100
  readonly estimatedCompletion?: Date | undefined;
  readonly criticalBlockers: BlockerInfo[];
  readonly topBottlenecks: string[];
  readonly specialistUtilization: SpecialistUtilization[];
}

export interface BlockerSummary {
  readonly totalBlockers: number;
  readonly criticalBlockers: number;
  readonly blockersByType: Record<string, number>;
  readonly oldestBlocker?: BlockerInfo;
  readonly averageResolutionTime: number; // in hours
}

export interface SpecialistUtilization {
  readonly specialist: string;
  readonly activeTasks: number;
  readonly completedTasks: number;
  readonly utilizationRate: number; // 0-100
  readonly averageTaskTime: number; // in hours
  readonly capabilities: string[];
}

// === Event System ===
export interface MigrationEvent {
  readonly type: MigrationEventType;
  readonly timestamp: Date;
  readonly taskId?: string;
  readonly data: Record<string, unknown>;
}

export type MigrationEventType =
  | "task-started"
  | "task-completed"
  | "task-failed"
  | "task-blocked"
  | "blocker-resolved"
  | "specialist-assigned"
  | "specialist-released"
  | "milestone-reached"
  | "critical-blocker-detected";

// === Core Migration Orchestrator ===
export class MigrationOrchestrator extends EventTarget {
  private readonly migrations = new Map<string, TypeMigrationStatus>();
  private readonly delegationMonitor: DelegationMonitor;
  private readonly progressReporter: ProgressReporter;
  // Start time is preserved for potential future analytics

  // Progressive completion tracking constants
  public static readonly TOTAL_SUBTASKS = 221;
  public static readonly CURRENT_COMPLETED = 210;

  constructor() {
    super();
    this.delegationMonitor = new DefaultDelegationMonitor();
    this.progressReporter = new DefaultProgressReporter(
      this.migrations,
      this.delegationMonitor,
    );

    // Initialize with current progress state
    this.initializeProgressState();
  }

  // === Core Migration Management ===

  /**
   * Register a new migration task
   */
  registerTask(
    id: string,
    taskId: string,
    metadata: Record<string, unknown> = {},
  ): TypeMigrationStatus {
    const migration: TypeMigrationStatus = {
      id,
      taskId,
      status: "pending",
      progress: 0,
      startTime: new Date(),
      lastUpdate: new Date(),
      blockers: [],
      metadata: { ...metadata },
    };

    this.migrations.set(id, migration);
    this.emitEvent("task-started", { taskId, migrationId: id });

    return migration;
  }

  /**
   * Update migration status
   */
  updateStatus(
    id: string,
    status: MigrationState,
    progress?: number,
    metadata?: Record<string, unknown>,
  ): void {
    const migration = this.migrations.get(id);
    if (!migration) {
      throw new Error(`Migration not found: ${id}`);
    }

    const updated: TypeMigrationStatus = {
      ...migration,
      status,
      progress: progress ?? migration.progress,
      lastUpdate: new Date(),
      completionTime: status === "completed" ? new Date() : undefined,
      metadata: { ...migration.metadata, ...metadata },
    };

    this.migrations.set(id, updated);
    this.emitEvent(this.mapStatusToEventType(status), {
      taskId: migration.taskId,
      migrationId: id,
      progress: updated.progress,
    });

    // Check for milestone completion
    this.checkMilestones();
  }

  /**
   * Add blocker to migration
   */
  addBlocker(
    migrationId: string,
    blocker: Omit<BlockerInfo, "id" | "createdAt">,
  ): void {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    const newBlocker: BlockerInfo = {
      ...blocker,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    const updated: TypeMigrationStatus = {
      ...migration,
      status: "blocked",
      blockers: [...migration.blockers, newBlocker],
      lastUpdate: new Date(),
    };

    this.migrations.set(migrationId, updated);

    if (blocker.severity === "critical") {
      this.emitEvent("critical-blocker-detected", {
        taskId: migration.taskId,
        migrationId,
        blocker: newBlocker,
      });
    } else {
      this.emitEvent("task-blocked", {
        taskId: migration.taskId,
        migrationId,
        blocker: newBlocker,
      });
    }
  }

  /**
   * Resolve blocker
   */
  resolveBlocker(migrationId: string, blockerId: string): void {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    const updatedBlockers = migration.blockers.map((blocker) =>
      blocker.id === blockerId
        ? { ...blocker, resolvedAt: new Date() }
        : blocker
    );

    const activeBlockers = updatedBlockers.filter((b) => !b.resolvedAt);
    const newStatus = activeBlockers.length === 0 ? "pending" : "blocked";

    const updated: TypeMigrationStatus = {
      ...migration,
      status: newStatus,
      blockers: updatedBlockers,
      lastUpdate: new Date(),
    };

    this.migrations.set(migrationId, updated);
    this.emitEvent("blocker-resolved", {
      taskId: migration.taskId,
      migrationId,
      blockerId,
      remainingBlockers: activeBlockers.length,
    });
  }

  // === Specialist Management ===

  /**
   * Assign specialist to task
   */
  assignSpecialist(
    migrationId: string,
    specialist: string,
    capabilities: string[],
  ): void {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    this.delegationMonitor.assignSpecialist(
      migration.taskId,
      specialist,
      capabilities,
    );

    const updated: TypeMigrationStatus = {
      ...migration,
      assignedSpecialist: specialist,
      lastUpdate: new Date(),
    };

    this.migrations.set(migrationId, updated);
    this.emitEvent("specialist-assigned", {
      taskId: migration.taskId,
      migrationId,
      specialist,
      capabilities,
    });
  }

  /**
   * Release specialist from task
   */
  releaseSpecialist(migrationId: string): void {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    const specialist = migration.assignedSpecialist;
    if (specialist) {
      this.delegationMonitor.releaseSpecialist(migration.taskId);

      const updated: TypeMigrationStatus = {
        ...migration,
        assignedSpecialist: undefined,
        lastUpdate: new Date(),
      };

      this.migrations.set(migrationId, updated);
      this.emitEvent("specialist-released", {
        taskId: migration.taskId,
        migrationId,
        specialist,
      });
    }
  }

  // === Progress Tracking ===

  /**
   * Get current completion rate
   */
  getCompletionRate(): number {
    return this.progressReporter.getCompletionRate();
  }

  /**
   * Generate comprehensive progress report
   */
  generateProgressReport(): MigrationProgressReport {
    return this.progressReporter.generateReport();
  }

  /**
   * Get next actionable tasks (not blocked, not assigned to overloaded specialists)
   */
  getNextActionableTasks(limit = 5): TypeMigrationStatus[] {
    const actionable = Array.from(this.migrations.values())
      .filter((migration) => {
        // Must be pending or failed (retryable)
        if (!["pending", "failed"].includes(migration.status)) {
          return false;
        }

        // Must not have active blockers
        const activeBlockers = migration.blockers.filter((b) => !b.resolvedAt);
        if (activeBlockers.length > 0) {
          return false;
        }

        // Check specialist availability if assigned
        if (migration.assignedSpecialist) {
          const workload = this.delegationMonitor.getWorkload(
            migration.assignedSpecialist,
          );
          if (workload >= 3) { // Max 3 concurrent tasks per specialist
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Prioritize by: failed tasks first, then by creation time
        if (a.status === "failed" && b.status !== "failed") return -1;
        if (b.status === "failed" && a.status !== "failed") return 1;
        return a.startTime.getTime() - b.startTime.getTime();
      })
      .slice(0, limit);

    return actionable;
  }

  /**
   * Get critical blockers requiring immediate attention
   */
  getCriticalBlockers(): BlockerInfo[] {
    const criticalBlockers: BlockerInfo[] = [];

    for (const migration of this.migrations.values()) {
      const activeBlockers = migration.blockers.filter((b) =>
        !b.resolvedAt && b.severity === "critical"
      );
      criticalBlockers.push(...activeBlockers);
    }

    return criticalBlockers.sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  // === Private Implementation ===

  private initializeProgressState(): void {
    // Initialize with current 95.02% completion state
    const currentProgress = (MigrationOrchestrator.CURRENT_COMPLETED /
      MigrationOrchestrator.TOTAL_SUBTASKS) * 100;

    this.emitEvent("milestone-reached", {
      milestone: "95_percent_completion",
      completionRate: currentProgress,
      remainingTasks: MigrationOrchestrator.TOTAL_SUBTASKS -
        MigrationOrchestrator.CURRENT_COMPLETED,
    });
  }

  private checkMilestones(): void {
    const completionRate = this.getCompletionRate();
    const previousMilestones = [96, 97, 98, 99, 100];

    for (const milestone of previousMilestones) {
      if (completionRate >= milestone && !this.hasReachedMilestone(milestone)) {
        this.emitEvent("milestone-reached", {
          milestone: `${milestone}_percent_completion`,
          completionRate,
          timestamp: new Date(),
        });
        this.markMilestoneReached(milestone);
      }
    }
  }

  private hasReachedMilestone(milestone: number): boolean {
    // Simple in-memory tracking - could be persisted in production
    return (this as any)[`milestone_${milestone}_reached`] === true;
  }

  private markMilestoneReached(milestone: number): void {
    (this as any)[`milestone_${milestone}_reached`] = true;
  }

  private mapStatusToEventType(status: MigrationState): MigrationEventType {
    switch (status) {
      case "completed":
        return "task-completed";
      case "failed":
        return "task-failed";
      case "blocked":
        return "task-blocked";
      default:
        return "task-started";
    }
  }

  private emitEvent(
    type: MigrationEventType,
    data: Record<string, unknown>,
  ): void {
    const event = new CustomEvent("migration", {
      detail: {
        type,
        timestamp: new Date(),
        data,
      } satisfies MigrationEvent,
    });

    this.dispatchEvent(event);
  }
}

// === Default Implementations ===

class DefaultDelegationMonitor implements DelegationMonitor {
  readonly assignments = new Map<string, SpecialistAssignment>();

  assignSpecialist(
    taskId: string,
    specialist: string,
    capabilities: string[],
  ): void {
    const assignment: SpecialistAssignment = {
      taskId,
      specialist,
      capabilities,
      assignedAt: new Date(),
      status: "assigned",
    };

    this.assignments.set(taskId, assignment);
  }

  getAssignment(taskId: string): SpecialistAssignment | undefined {
    return this.assignments.get(taskId);
  }

  releaseSpecialist(taskId: string): void {
    const assignment = this.assignments.get(taskId);
    if (assignment) {
      this.assignments.set(taskId, {
        ...assignment,
        status: "completed",
      });
    }
  }

  getWorkload(specialist: string): number {
    return Array.from(this.assignments.values())
      .filter((a) =>
        a.specialist === specialist && ["assigned", "active"].includes(a.status)
      )
      .length;
  }

  listActiveAssignments(): SpecialistAssignment[] {
    return Array.from(this.assignments.values())
      .filter((a) => ["assigned", "active"].includes(a.status));
  }
}

class DefaultProgressReporter implements ProgressReporter {
  constructor(
    private readonly migrations: Map<string, TypeMigrationStatus>,
    private readonly delegationMonitor: DelegationMonitor,
  ) {}

  generateReport(): MigrationProgressReport {
    const migrations = Array.from(this.migrations.values());
    const completed = migrations.filter((m) => m.status === "completed").length;
    const inProgress =
      migrations.filter((m) => m.status === "in-progress").length;
    const blocked = migrations.filter((m) => m.status === "blocked").length;
    const failed = migrations.filter((m) => m.status === "failed").length;

    return {
      timestamp: new Date(),
      totalTasks: migrations.length,
      completedTasks: completed,
      inProgressTasks: inProgress,
      blockedTasks: blocked,
      failedTasks: failed,
      completionRate: migrations.length > 0
        ? (completed / migrations.length) * 100
        : 0,
      estimatedCompletion: this.estimateCompletion() ?? undefined,
      criticalBlockers: this.getCriticalBlockers(),
      topBottlenecks: this.identifyBottlenecks(),
      specialistUtilization: this.getSpecialistUtilization(),
    };
  }

  getCompletionRate(): number {
    const migrations = Array.from(this.migrations.values());
    if (migrations.length === 0) return 95.02; // Current baseline

    const completed = migrations.filter((m) => m.status === "completed").length;
    const baselineCompleted = MigrationOrchestrator.CURRENT_COMPLETED;
    const totalTasks = MigrationOrchestrator.TOTAL_SUBTASKS;

    return ((baselineCompleted + completed) / totalTasks) * 100;
  }

  getBlockerSummary(): BlockerSummary {
    const allBlockers: BlockerInfo[] = [];

    for (const migration of this.migrations.values()) {
      allBlockers.push(...migration.blockers.filter((b) => !b.resolvedAt));
    }

    const criticalBlockers =
      allBlockers.filter((b) => b.severity === "critical").length;
    const blockersByType = allBlockers.reduce((acc, blocker) => {
      acc[blocker.type] = (acc[blocker.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestBlocker = allBlockers
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

    // Calculate average resolution time from resolved blockers
    const resolvedBlockers = Array.from(this.migrations.values())
      .flatMap((m) => m.blockers.filter((b) => b.resolvedAt));

    const averageResolutionTime = resolvedBlockers.length > 0
      ? resolvedBlockers.reduce((sum, b) => {
        const resolutionTime =
          (b.resolvedAt!.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + resolutionTime;
      }, 0) / resolvedBlockers.length
      : 0;

    return {
      totalBlockers: allBlockers.length,
      criticalBlockers,
      blockersByType,
      oldestBlocker,
      averageResolutionTime,
    };
  }

  getSpecialistUtilization(): SpecialistUtilization[] {
    const specialists = new Map<string, {
      active: number;
      completed: number;
      capabilities: Set<string>;
      totalTime: number;
      taskCount: number;
    }>();

    // Collect specialist data
    for (const assignment of this.delegationMonitor.listActiveAssignments()) {
      const spec = specialists.get(assignment.specialist) || {
        active: 0,
        completed: 0,
        capabilities: new Set(),
        totalTime: 0,
        taskCount: 0,
      };

      if (["assigned", "active"].includes(assignment.status)) {
        spec.active++;
      } else if (assignment.status === "completed") {
        spec.completed++;
        // Add estimated task time (placeholder calculation)
        spec.totalTime += 2; // 2 hours average
        spec.taskCount++;
      }

      assignment.capabilities.forEach((cap) => spec.capabilities.add(cap));
      specialists.set(assignment.specialist, spec);
    }

    return Array.from(specialists.entries()).map(([specialist, data]) => ({
      specialist,
      activeTasks: data.active,
      completedTasks: data.completed,
      utilizationRate: Math.min(100, (data.active / 3) * 100), // Max 3 concurrent tasks
      averageTaskTime: data.taskCount > 0 ? data.totalTime / data.taskCount : 0,
      capabilities: Array.from(data.capabilities),
    }));
  }

  estimateCompletion(): Date | null {
    const inProgress = Array.from(this.migrations.values())
      .filter((m) => ["pending", "in-progress"].includes(m.status)).length;

    if (inProgress === 0) return new Date(); // Already complete

    const activeSpecialists =
      this.delegationMonitor.listActiveAssignments().length;
    const avgTaskHours = 2; // Estimated average task completion time

    if (activeSpecialists === 0) return null; // Cannot estimate without specialists

    const parallelCapacity = Math.min(activeSpecialists * 3, inProgress); // 3 tasks per specialist max
    const estimatedHours = (inProgress / parallelCapacity) * avgTaskHours;

    const completion = new Date();
    completion.setHours(completion.getHours() + estimatedHours);

    return completion;
  }

  private getCriticalBlockers(): BlockerInfo[] {
    const criticalBlockers: BlockerInfo[] = [];

    for (const migration of this.migrations.values()) {
      const activeBlockers = migration.blockers.filter((b) =>
        !b.resolvedAt && b.severity === "critical"
      );
      criticalBlockers.push(...activeBlockers);
    }

    return criticalBlockers;
  }

  private identifyBottlenecks(): string[] {
    // Identify common bottleneck patterns
    const bottlenecks: string[] = [];

    const blockedTasks = Array.from(this.migrations.values())
      .filter((m) => m.status === "blocked");

    if (blockedTasks.length > 5) {
      bottlenecks.push("High number of blocked tasks");
    }

    const overloadedSpecialists = this.getSpecialistUtilization()
      .filter((s) => s.utilizationRate > 80);

    if (overloadedSpecialists.length > 0) {
      bottlenecks.push("Specialist capacity constraints");
    }

    const oldBlockers = this.getBlockerSummary();
    if (oldBlockers.averageResolutionTime > 24) {
      bottlenecks.push("Slow blocker resolution");
    }

    return bottlenecks;
  }
}

// === Singleton Instance ===
export const migrationOrchestrator = new MigrationOrchestrator();

// === Type Guards ===
export function isTypeMigrationStatus(
  obj: unknown,
): obj is TypeMigrationStatus {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).id === "string" &&
    typeof (obj as any).taskId === "string" &&
    typeof (obj as any).status === "string"
  );
}

export function isMigrationEvent(obj: unknown): obj is MigrationEvent {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).type === "string" &&
    (obj as any).timestamp instanceof Date
  );
}
