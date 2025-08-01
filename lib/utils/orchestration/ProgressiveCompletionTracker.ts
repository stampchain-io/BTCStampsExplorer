/**
 * Progressive Completion Tracker - Task 38.2
 *
 * Systematic orchestration algorithms for driving completion from 91.49% to 100%
 * Real-time progress updates with velocity tracking and milestone detection
 *
 * Current Status: 215/235 subtasks completed (91.49%), 37/41 tasks completed (90.24%)
 * Target: 100% completion through systematic orchestration
 */

import type {
  MigrationOrchestrator,
  MigrationProgressReport,
} from "./MigrationOrchestrator.ts";

// === Core Progress Tracking Types ===

export interface CompletionSnapshot {
  readonly timestamp: Date;
  readonly taskCompletion: TaskCompletionMetrics;
  readonly subtaskCompletion: SubtaskCompletionMetrics;
  readonly velocity: VelocityMetrics;
  readonly projections: CompletionProjections;
  readonly bottlenecks: BottleneckAnalysis;
}

export interface TaskCompletionMetrics {
  readonly total: number;
  readonly completed: number;
  readonly inProgress: number;
  readonly pending: number;
  readonly blocked: number;
  readonly completionRate: number; // 0-100
  readonly completionDelta: number; // Change since last measurement
}

export interface SubtaskCompletionMetrics {
  readonly total: number;
  readonly completed: number;
  readonly completionRate: number; // 0-100
  readonly categoryBreakdown: Map<string, CategoryMetrics>;
}

export interface CategoryMetrics {
  readonly category: string;
  readonly total: number;
  readonly completed: number;
  readonly completionRate: number;
  readonly averageVelocity: number; // completions per hour
  readonly estimatedRemaining: number; // hours to completion
}

export interface VelocityMetrics {
  readonly currentVelocity: number; // completions per hour
  readonly averageVelocity: number; // over tracking period
  readonly accelerationRate: number; // change in velocity per hour
  readonly trendDirection:
    | "accelerating"
    | "stable"
    | "decelerating"
    | "stalled";
  readonly velocityHistory: VelocityDataPoint[];
}

export interface VelocityDataPoint {
  readonly timestamp: Date;
  readonly velocity: number;
  readonly completedCount: number;
}

export interface CompletionProjections {
  readonly eta95Percent: Date | null;
  readonly eta97Percent: Date | null;
  readonly eta99Percent: Date | null;
  readonly eta100Percent: Date | null;
  readonly confidenceLevel: number; // 0-100
  readonly projectionMethod:
    | "linear"
    | "exponential"
    | "regression"
    | "specialist-based";
}

export interface BottleneckAnalysis {
  readonly primaryBottlenecks: Bottleneck[];
  readonly impactAnalysis: BottleneckImpact[];
  readonly recommendedActions: OrchestrationAction[];
}

export interface Bottleneck {
  readonly id: string;
  readonly type:
    | "specialist_capacity"
    | "dependency_chain"
    | "technical_blocker"
    | "resource_constraint";
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly description: string;
  readonly affectedTasks: string[];
  readonly estimatedDelay: number; // hours
  readonly detectedAt: Date;
}

export interface BottleneckImpact {
  readonly bottleneckId: string;
  readonly completionDelay: number; // hours
  readonly affectedCompletionRate: number; // percentage points
  readonly cascadeEffects: string[];
}

export interface OrchestrationAction {
  readonly id: string;
  readonly type:
    | "specialist_reallocation"
    | "dependency_prioritization"
    | "blocker_escalation"
    | "parallel_execution";
  readonly priority: "low" | "medium" | "high" | "urgent";
  readonly description: string;
  readonly expectedImpact: number; // completion rate improvement
  readonly estimatedEffort: number; // hours to implement
  readonly targetBottlenecks: string[];
}

// === Milestone Tracking ===

export interface MilestoneTracker {
  readonly milestones: CompletionMilestone[];
  readonly currentMilestone: CompletionMilestone | null;
  readonly nextMilestone: CompletionMilestone | null;
  readonly milestoneHistory: MilestoneAchievement[];
}

export interface CompletionMilestone {
  readonly id: string;
  readonly threshold: number; // completion percentage
  readonly label: string;
  readonly significance: "minor" | "major" | "critical";
  readonly celebrations: CelebrationAction[];
  readonly requirements: MilestoneRequirement[];
}

export interface MilestoneAchievement {
  readonly milestoneId: string;
  readonly achievedAt: Date;
  readonly actualCompletion: number;
  readonly velocityAtAchievement: number;
  readonly timeToNext: number | null; // hours to next milestone
}

export interface CelebrationAction {
  readonly type:
    | "notification"
    | "report_generation"
    | "team_alert"
    | "progress_broadcast";
  readonly message: string;
  readonly recipients: string[];
}

export interface MilestoneRequirement {
  readonly type:
    | "completion_rate"
    | "velocity_threshold"
    | "blocker_resolution"
    | "specialist_availability";
  readonly criteria: string;
  readonly isMet: boolean;
}

// === Progressive Completion Tracker Implementation ===

export class ProgressiveCompletionTracker extends EventTarget {
  private readonly snapshots: CompletionSnapshot[] = [];
  private readonly milestoneTracker: MilestoneTracker;
  private readonly orchestrator: MigrationOrchestrator;

  // Current baseline metrics from task description
  public static readonly CURRENT_SUBTASK_TOTAL = 235;
  public static readonly CURRENT_SUBTASK_COMPLETED = 215;
  public static readonly CURRENT_TASK_TOTAL = 41;
  public static readonly CURRENT_TASK_COMPLETED = 37;

  // Tracking intervals
  private trackingInterval: number | null = null;
  private readonly TRACKING_FREQUENCY_MS = 30000; // 30 seconds for real-time tracking

  constructor(orchestrator: MigrationOrchestrator) {
    super();
    this.orchestrator = orchestrator;
    this.milestoneTracker = this.initializeMilestones();

    // Initialize baseline snapshot
    this.captureSnapshot();

    // Start real-time tracking
    this.startRealTimeTracking();

    // Listen for migration events
    this.orchestrator.addEventListener(
      "migration",
      this.handleMigrationEvent.bind(this),
    );
  }

  // === Core Tracking Methods ===

  /**
   * Capture current completion snapshot with full analysis
   */
  public captureSnapshot(): CompletionSnapshot {
    const timestamp = new Date();
    const report = this.orchestrator.generateProgressReport();

    const snapshot: CompletionSnapshot = {
      timestamp,
      taskCompletion: this.calculateTaskMetrics(report),
      subtaskCompletion: this.calculateSubtaskMetrics(),
      velocity: this.calculateVelocityMetrics(),
      projections: this.generateCompletionProjections(),
      bottlenecks: this.analyzeBottlenecks(report),
    };

    this.snapshots.push(snapshot);

    // Maintain sliding window of snapshots (last 24 hours)
    this.pruneOldSnapshots();

    // Check for milestone achievements
    this.checkMilestoneProgress(snapshot);

    // Emit snapshot event
    this.emitSnapshotEvent(snapshot);

    return snapshot;
  }

  /**
   * Get current completion status
   */
  public getCurrentStatus(): CompletionSnapshot {
    return this.snapshots[this.snapshots.length - 1] || this.captureSnapshot();
  }

  /**
   * Get completion velocity trend analysis
   */
  public getVelocityTrend(hours = 24): VelocityMetrics {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const recentSnapshots = this.snapshots.filter((s) => s.timestamp >= cutoff);

    if (recentSnapshots.length < 2) {
      return this.calculateVelocityMetrics();
    }

    return this.calculateVelocityFromSnapshots(recentSnapshots);
  }

  /**
   * Generate systematic orchestration recommendations
   */
  public generateOrchestrationRecommendations(): OrchestrationAction[] {
    const currentSnapshot = this.getCurrentStatus();
    const actions: OrchestrationAction[] = [];

    // Analyze completion rate and identify acceleration opportunities
    if (currentSnapshot.velocity.trendDirection === "stalled") {
      actions.push({
        id: "stall-resolution-" + Date.now(),
        type: "specialist_reallocation",
        priority: "urgent",
        description: "Reallocate specialists to break completion stall",
        expectedImpact: 5.0, // 5% completion rate improvement
        estimatedEffort: 2,
        targetBottlenecks: currentSnapshot.bottlenecks.primaryBottlenecks
          .filter((b) => b.type === "specialist_capacity")
          .map((b) => b.id),
      });
    }

    if (currentSnapshot.velocity.trendDirection === "decelerating") {
      actions.push({
        id: "deceleration-correction-" + Date.now(),
        type: "dependency_prioritization",
        priority: "high",
        description:
          "Prioritize critical path tasks to prevent further deceleration",
        expectedImpact: 3.5,
        estimatedEffort: 1.5,
        targetBottlenecks: currentSnapshot.bottlenecks.primaryBottlenecks
          .filter((b) => b.type === "dependency_chain")
          .map((b) => b.id),
      });
    }

    // Target critical bottlenecks
    for (const bottleneck of currentSnapshot.bottlenecks.primaryBottlenecks) {
      if (bottleneck.severity === "critical") {
        actions.push({
          id: "critical-bottleneck-" + bottleneck.id,
          type: "blocker_escalation",
          priority: "urgent",
          description:
            `Escalate critical bottleneck: ${bottleneck.description}`,
          expectedImpact: 4.0,
          estimatedEffort: 3,
          targetBottlenecks: [bottleneck.id],
        });
      }
    }

    // Optimize for final 5% completion (95% -> 100%)
    if (currentSnapshot.taskCompletion.completionRate >= 95) {
      actions.push({
        id: "final-sprint-optimization-" + Date.now(),
        type: "parallel_execution",
        priority: "high",
        description: "Enable parallel execution for final completion sprint",
        expectedImpact: 2.5,
        estimatedEffort: 1,
        targetBottlenecks: [],
      });
    }

    return actions.sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  /**
   * Execute orchestration action
   */
  public async executeOrchestrationAction(actionId: string): Promise<boolean> {
    const recommendations = this.generateOrchestrationRecommendations();
    const action = recommendations.find((a) => a.id === actionId);

    if (!action) {
      throw new Error(`Orchestration action not found: ${actionId}`);
    }

    try {
      // Execute the action based on type
      switch (action.type) {
        case "specialist_reallocation":
          await this.executeSpecialistReallocation(action);
          break;
        case "dependency_prioritization":
          await this.executeDependencyPrioritization(action);
          break;
        case "blocker_escalation":
          await this.executeBlockerEscalation(action);
          break;
        case "parallel_execution":
          await this.executeParallelExecution(action);
          break;
      }

      // Emit action executed event
      this.dispatchEvent(
        new CustomEvent("orchestration-action-executed", {
          detail: { action, timestamp: new Date() },
        }),
      );

      return true;
    } catch (error) {
      // Emit action failed event
      this.dispatchEvent(
        new CustomEvent("orchestration-action-failed", {
          detail: { action, error, timestamp: new Date() },
        }),
      );

      return false;
    }
  }

  // === Private Implementation ===

  private initializeMilestones(): MilestoneTracker {
    const milestones: CompletionMilestone[] = [
      {
        id: "milestone-95",
        threshold: 95.0,
        label: "95% Completion Milestone",
        significance: "major",
        celebrations: [
          {
            type: "progress_broadcast",
            message:
              "🎯 95% completion achieved! Entering final completion phase.",
            recipients: ["development-team", "stakeholders"],
          },
        ],
        requirements: [
          {
            type: "completion_rate",
            criteria: "taskCompletion >= 95.0",
            isMet: false,
          },
        ],
      },
      {
        id: "milestone-97",
        threshold: 97.0,
        label: "97% Completion Milestone",
        significance: "major",
        celebrations: [
          {
            type: "team_alert",
            message: "🚀 97% completion! Final sprint acceleration detected.",
            recipients: ["development-team"],
          },
        ],
        requirements: [
          {
            type: "completion_rate",
            criteria: "taskCompletion >= 97.0",
            isMet: false,
          },
        ],
      },
      {
        id: "milestone-99",
        threshold: 99.0,
        label: "99% Completion Milestone",
        significance: "critical",
        celebrations: [
          {
            type: "progress_broadcast",
            message: "⚡ 99% completion! Final tasks in progress.",
            recipients: ["development-team", "stakeholders", "management"],
          },
        ],
        requirements: [
          {
            type: "completion_rate",
            criteria: "taskCompletion >= 99.0",
            isMet: false,
          },
        ],
      },
      {
        id: "milestone-100",
        threshold: 100.0,
        label: "100% Completion Achievement",
        significance: "critical",
        celebrations: [
          {
            type: "progress_broadcast",
            message:
              "🎉 100% COMPLETION ACHIEVED! Type domain migration complete!",
            recipients: ["all"],
          },
          {
            type: "report_generation",
            message: "Generate final completion report with full metrics",
            recipients: ["documentation-system"],
          },
        ],
        requirements: [
          {
            type: "completion_rate",
            criteria: "taskCompletion >= 100.0",
            isMet: false,
          },
          {
            type: "blocker_resolution",
            criteria: "criticalBlockers === 0",
            isMet: false,
          },
        ],
      },
    ];

    return {
      milestones,
      currentMilestone: null,
      nextMilestone: milestones[0],
      milestoneHistory: [],
    };
  }

  private calculateTaskMetrics(
    report: MigrationProgressReport,
  ): TaskCompletionMetrics {
    // Combine baseline with orchestrator progress
    const baselineCompleted =
      ProgressiveCompletionTracker.CURRENT_TASK_COMPLETED;
    const total = ProgressiveCompletionTracker.CURRENT_TASK_TOTAL +
      report.totalTasks;
    const completed = baselineCompleted + report.completedTasks;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate delta from previous snapshot
    const previousSnapshot = this.snapshots[this.snapshots.length - 1];
    const completionDelta = previousSnapshot
      ? completionRate - previousSnapshot.taskCompletion.completionRate
      : 0;

    return {
      total,
      completed,
      inProgress: report.inProgressTasks,
      pending: total - completed - report.inProgressTasks - report.blockedTasks,
      blocked: report.blockedTasks,
      completionRate,
      completionDelta,
    };
  }

  private calculateSubtaskMetrics(): SubtaskCompletionMetrics {
    const total = ProgressiveCompletionTracker.CURRENT_SUBTASK_TOTAL;
    const completed = ProgressiveCompletionTracker.CURRENT_SUBTASK_COMPLETED;
    const completionRate = (completed / total) * 100;

    // Category breakdown (placeholder - would be calculated from actual task data)
    const categoryBreakdown = new Map<string, CategoryMetrics>([
      ["type-migration", {
        category: "Type Migration",
        total: 95,
        completed: 87,
        completionRate: 91.58,
        averageVelocity: 2.3,
        estimatedRemaining: 3.5,
      }],
      ["import-consolidation", {
        category: "Import Consolidation",
        total: 78,
        completed: 72,
        completionRate: 92.31,
        averageVelocity: 1.8,
        estimatedRemaining: 3.3,
      }],
      ["type-safety", {
        category: "Type Safety",
        total: 62,
        completed: 56,
        completionRate: 90.32,
        averageVelocity: 1.5,
        estimatedRemaining: 4.0,
      }],
    ]);

    return {
      total,
      completed,
      completionRate,
      categoryBreakdown,
    };
  }

  private calculateVelocityMetrics(): VelocityMetrics {
    if (this.snapshots.length < 2) {
      return {
        currentVelocity: 0,
        averageVelocity: 0,
        accelerationRate: 0,
        trendDirection: "stable",
        velocityHistory: [],
      };
    }

    const recent = this.snapshots.slice(-5); // Last 5 snapshots
    const velocityHistory: VelocityDataPoint[] = [];

    for (let i = 1; i < recent.length; i++) {
      const current = recent[i];
      const previous = recent[i - 1];
      const timeDiff =
        (current.timestamp.getTime() - previous.timestamp.getTime()) /
        (1000 * 60 * 60); // hours
      const completionDiff = current.taskCompletion.completed -
        previous.taskCompletion.completed;

      const velocity = timeDiff > 0 ? completionDiff / timeDiff : 0;

      velocityHistory.push({
        timestamp: current.timestamp,
        velocity,
        completedCount: current.taskCompletion.completed,
      });
    }

    const currentVelocity =
      velocityHistory[velocityHistory.length - 1]?.velocity || 0;
    const averageVelocity = velocityHistory.length > 0
      ? velocityHistory.reduce((sum, v) => sum + v.velocity, 0) /
        velocityHistory.length
      : 0;

    // Calculate acceleration (change in velocity)
    const accelerationRate = velocityHistory.length >= 2
      ? velocityHistory[velocityHistory.length - 1].velocity -
        velocityHistory[velocityHistory.length - 2].velocity
      : 0;

    // Determine trend direction
    let trendDirection: VelocityMetrics["trendDirection"] = "stable";
    if (currentVelocity === 0 && averageVelocity < 0.1) {
      trendDirection = "stalled";
    } else if (accelerationRate > 0.1) {
      trendDirection = "accelerating";
    } else if (accelerationRate < -0.1) {
      trendDirection = "decelerating";
    }

    return {
      currentVelocity,
      averageVelocity,
      accelerationRate,
      trendDirection,
      velocityHistory,
    };
  }

  private calculateVelocityFromSnapshots(
    snapshots: CompletionSnapshot[],
  ): VelocityMetrics {
    const velocityHistory: VelocityDataPoint[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const current = snapshots[i];
      const previous = snapshots[i - 1];
      const timeDiff =
        (current.timestamp.getTime() - previous.timestamp.getTime()) /
        (1000 * 60 * 60);
      const completionDiff = current.taskCompletion.completed -
        previous.taskCompletion.completed;

      const velocity = timeDiff > 0 ? completionDiff / timeDiff : 0;

      velocityHistory.push({
        timestamp: current.timestamp,
        velocity,
        completedCount: current.taskCompletion.completed,
      });
    }

    const currentVelocity =
      velocityHistory[velocityHistory.length - 1]?.velocity || 0;
    const averageVelocity = velocityHistory.length > 0
      ? velocityHistory.reduce((sum, v) => sum + v.velocity, 0) /
        velocityHistory.length
      : 0;

    const accelerationRate = velocityHistory.length >= 2
      ? velocityHistory[velocityHistory.length - 1].velocity -
        velocityHistory[0].velocity
      : 0;

    let trendDirection: VelocityMetrics["trendDirection"] = "stable";
    if (currentVelocity === 0 && averageVelocity < 0.1) {
      trendDirection = "stalled";
    } else if (accelerationRate > 0.05) {
      trendDirection = "accelerating";
    } else if (accelerationRate < -0.05) {
      trendDirection = "decelerating";
    }

    return {
      currentVelocity,
      averageVelocity,
      accelerationRate,
      trendDirection,
      velocityHistory,
    };
  }

  private generateCompletionProjections(): CompletionProjections {
    const velocity = this.calculateVelocityMetrics();
    
    // Get current completion rate directly without causing circular reference
    const currentCompletion = this.snapshots.length > 0 
      ? this.snapshots[this.snapshots.length - 1].taskCompletion.completionRate
      : (ProgressiveCompletionTracker.CURRENT_TASK_COMPLETED / ProgressiveCompletionTracker.CURRENT_TASK_TOTAL) * 100;

    if (velocity.averageVelocity <= 0) {
      return {
        eta95Percent: null,
        eta97Percent: null,
        eta99Percent: null,
        eta100Percent: null,
        confidenceLevel: 0,
        projectionMethod: "linear",
      };
    }

    // currentCompletion is already defined above
    const remainingTo95 = Math.max(0, 95 - currentCompletion);
    const remainingTo97 = Math.max(0, 97 - currentCompletion);
    const remainingTo99 = Math.max(0, 99 - currentCompletion);
    const remainingTo100 = Math.max(0, 100 - currentCompletion);

    const hoursTo95 = remainingTo95 / velocity.averageVelocity;
    const hoursTo97 = remainingTo97 / velocity.averageVelocity;
    const hoursTo99 = remainingTo99 / velocity.averageVelocity;
    const hoursTo100 = remainingTo100 / velocity.averageVelocity;

    const now = new Date();

    return {
      eta95Percent: remainingTo95 > 0
        ? new Date(now.getTime() + (hoursTo95 * 60 * 60 * 1000))
        : new Date(),
      eta97Percent: remainingTo97 > 0
        ? new Date(now.getTime() + (hoursTo97 * 60 * 60 * 1000))
        : new Date(),
      eta99Percent: remainingTo99 > 0
        ? new Date(now.getTime() + (hoursTo99 * 60 * 60 * 1000))
        : new Date(),
      eta100Percent: remainingTo100 > 0
        ? new Date(now.getTime() + (hoursTo100 * 60 * 60 * 1000))
        : new Date(),
      confidenceLevel: this.calculateProjectionConfidence(velocity),
      projectionMethod: "linear",
    };
  }

  private calculateProjectionConfidence(velocity: VelocityMetrics): number {
    // Base confidence on velocity consistency
    if (velocity.velocityHistory.length < 3) return 30;

    const velocities = velocity.velocityHistory.map((v) => v.velocity);
    const mean = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance =
      velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      velocities.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 50));

    // Factor in trend direction
    const trendBonus = velocity.trendDirection === "accelerating"
      ? 10
      : velocity.trendDirection === "stable"
      ? 5
      : velocity.trendDirection === "decelerating"
      ? -5
      : -15;

    return Math.min(95, Math.max(10, consistencyScore + trendBonus));
  }

  private analyzeBottlenecks(
    report: MigrationProgressReport,
  ): BottleneckAnalysis {
    const bottlenecks: Bottleneck[] = [];
    const impactAnalysis: BottleneckImpact[] = [];

    // Analyze specialist capacity constraints
    const overloadedSpecialists = report.specialistUtilization.filter((s) =>
      s.utilizationRate > 85
    );
    if (overloadedSpecialists.length > 0) {
      const bottleneck: Bottleneck = {
        id: "specialist-capacity-" + Date.now(),
        type: "specialist_capacity",
        severity: overloadedSpecialists.length > 2 ? "critical" : "high",
        description:
          `${overloadedSpecialists.length} specialists at >85% capacity`,
        affectedTasks: [],
        estimatedDelay: overloadedSpecialists.length * 2,
        detectedAt: new Date(),
      };
      bottlenecks.push(bottleneck);
    }

    // Analyze critical blockers
    if (report.criticalBlockers.length > 0) {
      const bottleneck: Bottleneck = {
        id: "critical-blockers-" + Date.now(),
        type: "technical_blocker",
        severity: "critical",
        description:
          `${report.criticalBlockers.length} critical blockers active`,
        affectedTasks: [],
        estimatedDelay: report.criticalBlockers.length * 4,
        detectedAt: new Date(),
      };
      bottlenecks.push(bottleneck);
    }

    // Generate impact analysis
    for (const bottleneck of bottlenecks) {
      impactAnalysis.push({
        bottleneckId: bottleneck.id,
        completionDelay: bottleneck.estimatedDelay,
        affectedCompletionRate: bottleneck.estimatedDelay * 0.5, // Estimated impact
        cascadeEffects: [
          "Delayed milestone achievement",
          "Reduced team velocity",
        ],
      });
    }

    // Generate basic recommendations without circular dependency
    const recommendedActions: OrchestrationAction[] = [];
    
    // Add basic specialist reallocation if overloaded
    if (overloadedSpecialists.length > 0) {
      recommendedActions.push({
        id: "basic-reallocation-" + Date.now(),
        type: "specialist_reallocation",
        priority: "high",
        description: "Reallocate specialist workload",
        expectedImpact: 3.0,
        estimatedEffort: 2,
        targetBottlenecks: bottlenecks.filter(b => b.type === "specialist_capacity").map(b => b.id),
      });
    }

    return {
      primaryBottlenecks: bottlenecks,
      impactAnalysis,
      recommendedActions,
    };
  }

  private checkMilestoneProgress(snapshot: CompletionSnapshot): void {
    const completionRate = snapshot.taskCompletion.completionRate;

    for (const milestone of this.milestoneTracker.milestones) {
      if (
        completionRate >= milestone.threshold &&
        !this.isMilestoneAchieved(milestone.id)
      ) {
        this.achieveMilestone(milestone, snapshot);
      }
    }
  }

  private isMilestoneAchieved(milestoneId: string): boolean {
    return this.milestoneTracker.milestoneHistory.some((h) =>
      h.milestoneId === milestoneId
    );
  }

  private achieveMilestone(
    milestone: CompletionMilestone,
    snapshot: CompletionSnapshot,
  ): void {
    const achievement: MilestoneAchievement = {
      milestoneId: milestone.id,
      achievedAt: new Date(),
      actualCompletion: snapshot.taskCompletion.completionRate,
      velocityAtAchievement: snapshot.velocity.currentVelocity,
      timeToNext: null, // Would be calculated based on next milestone
    };

    this.milestoneTracker.milestoneHistory.push(achievement);

    // Execute celebrations
    for (const celebration of milestone.celebrations) {
      this.executeCelebration(celebration, milestone);
    }

    // Emit milestone event
    this.dispatchEvent(
      new CustomEvent("milestone-achieved", {
        detail: { milestone, achievement, snapshot },
      }),
    );
  }

  private executeCelebration(
    celebration: CelebrationAction,
    milestone: CompletionMilestone,
  ): void {
    // Implementation would depend on notification system
    console.log(`🎉 ${milestone.label}: ${celebration.message}`);
  }

  private startRealTimeTracking(): void {
    this.trackingInterval = setInterval(() => {
      this.captureSnapshot();
    }, this.TRACKING_FREQUENCY_MS);
  }

  private pruneOldSnapshots(): void {
    const cutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
    const cutoffIndex = this.snapshots.findIndex((s) => s.timestamp >= cutoff);
    if (cutoffIndex > 0) {
      this.snapshots.splice(0, cutoffIndex);
    }
  }

  private handleMigrationEvent(event: Event): void {
    // Capture snapshot on significant migration events
    const migrationEvent = (event as CustomEvent).detail;
    if (
      ["task-completed", "milestone-reached", "critical-blocker-detected"]
        .includes(migrationEvent.type)
    ) {
      this.captureSnapshot();
    }
  }

  private emitSnapshotEvent(snapshot: CompletionSnapshot): void {
    this.dispatchEvent(
      new CustomEvent("completion-snapshot", {
        detail: { snapshot, timestamp: new Date() },
      }),
    );
  }

  // === Orchestration Action Implementations ===

  private async executeSpecialistReallocation(
    action: OrchestrationAction,
  ): Promise<void> {
    // Implementation would interact with specialist management system
    console.log(`Executing specialist reallocation: ${action.description}`);
  }

  private async executeDependencyPrioritization(
    action: OrchestrationAction,
  ): Promise<void> {
    // Implementation would interact with task dependency system
    console.log(`Executing dependency prioritization: ${action.description}`);
  }

  private async executeBlockerEscalation(
    action: OrchestrationAction,
  ): Promise<void> {
    // Implementation would interact with blocker resolution system
    console.log(`Executing blocker escalation: ${action.description}`);
  }

  private async executeParallelExecution(
    action: OrchestrationAction,
  ): Promise<void> {
    // Implementation would enable parallel task execution
    console.log(
      `Executing parallel execution optimization: ${action.description}`,
    );
  }

  // === Cleanup ===

  public dispose(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }
}

// === Factory and Utilities ===

export function createProgressiveTracker(
  orchestrator: MigrationOrchestrator,
): ProgressiveCompletionTracker {
  return new ProgressiveCompletionTracker(orchestrator);
}

export function formatCompletionRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function formatVelocity(velocity: number): string {
  return `${velocity.toFixed(1)} tasks/hr`;
}

export function formatETA(eta: Date | null): string {
  if (!eta) return "Cannot estimate";

  const now = new Date();
  const diffMs = eta.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Within 1 hour";
  if (diffHours === 1) return "1 hour";
  if (diffHours < 24) return `${diffHours} hours`;

  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays} days`;
}
