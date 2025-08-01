/**
 * Specialist Assignment Coordination - Task 38.3
 * Advanced specialist management with workload balancing and delegation tracking
 *
 * Integrates with MigrationOrchestrator events for active task assignments
 * Maintains maximum velocity through intelligent workload distribution
 */

import type {
  DelegationMonitor,
  MigrationEvent,
  SpecialistAssignment,
} from "./MigrationOrchestrator.ts";

// === Specialist Capability System ===
export interface SpecialistCapability {
  readonly name: string;
  readonly proficiency: number; // 1-10 scale
  readonly category: CapabilityCategory;
  readonly estimatedTaskTime: number; // hours
}

export type CapabilityCategory =
  | "typescript"
  | "database"
  | "frontend"
  | "testing"
  | "integration"
  | "architecture"
  | "performance"
  | "migration";

export interface SpecialistProfile {
  readonly id: string;
  readonly name: string;
  readonly capabilities: SpecialistCapability[];
  readonly maxConcurrentTasks: number;
  readonly currentWorkload: number;
  readonly utilizationRate: number; // 0-100%
  readonly averageCompletionTime: number; // hours
  readonly completedTasks: number;
  readonly availability: AvailabilityStatus;
}

export type AvailabilityStatus =
  | "available"
  | "busy"
  | "overloaded"
  | "offline"
  | "on-break";

// === Advanced Assignment Strategies ===
export interface AssignmentStrategy {
  readonly name: string;
  readonly priority: number;
  evaluateAssignment(
    task: TaskAssignmentRequest,
    specialist: SpecialistProfile,
  ): AssignmentScore;
}

export interface TaskAssignmentRequest {
  readonly taskId: string;
  readonly requiredCapabilities: string[];
  readonly priority: TaskPriority;
  readonly estimatedHours: number;
  readonly dependencies: string[];
  readonly deadline?: Date;
}

export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface AssignmentScore {
  readonly score: number; // 0-100
  readonly confidence: number; // 0-100
  readonly reasoning: string[];
  readonly risks: string[];
  readonly estimatedCompletion: Date;
}

// === Workload Balancing Engine ===
export interface WorkloadBalancer {
  calculateOptimalAssignment(
    request: TaskAssignmentRequest,
    availableSpecialists: SpecialistProfile[],
  ): RecommendedAssignment[];

  rebalanceWorkload(): RebalancingPlan;

  predictCapacityNeeds(
    upcomingTasks: TaskAssignmentRequest[],
    timeframe: number, // hours
  ): CapacityAnalysis;
}

export interface RecommendedAssignment {
  readonly specialist: SpecialistProfile;
  readonly assignment: SpecialistAssignment;
  readonly score: AssignmentScore;
  readonly alternatives: SpecialistProfile[];
}

export interface RebalancingPlan {
  readonly reassignments: TaskReassignment[];
  readonly expectedImprovements: PerformanceMetrics;
  readonly risks: string[];
  readonly estimatedCompletionGain: number; // hours saved
}

export interface TaskReassignment {
  readonly taskId: string;
  readonly fromSpecialist: string;
  readonly toSpecialist: string;
  readonly reason: string;
  readonly impact: ReassignmentImpact;
}

export interface ReassignmentImpact {
  readonly velocityChange: number; // +/- tasks per hour
  readonly completionTimeChange: number; // +/- hours
  readonly utilizationImprovement: number; // +/- percentage points
}

export interface CapacityAnalysis {
  readonly currentCapacity: number; // tasks per hour
  readonly requiredCapacity: number;
  readonly shortfall: number;
  readonly bottleneckCategories: CapabilityCategory[];
  readonly recommendations: CapacityRecommendation[];
}

export interface CapacityRecommendation {
  readonly type: "hire" | "redistribute" | "defer" | "optimize";
  readonly category: CapabilityCategory;
  readonly urgency: "immediate" | "soon" | "planned";
  readonly description: string;
  readonly estimatedImpact: number; // velocity improvement
}

export interface PerformanceMetrics {
  readonly averageTaskCompletion: number; // hours
  readonly specialistUtilization: number; // 0-100%
  readonly taskThroughput: number; // tasks per hour
  readonly blockerResolutionTime: number; // hours
  readonly qualityScore: number; // 0-100%
}

// === Core Specialist Coordinator ===
export class SpecialistCoordinator implements DelegationMonitor {
  readonly assignments = new Map<string, SpecialistAssignment>();
  private readonly specialists = new Map<string, SpecialistProfile>();
  private readonly assignmentStrategies: AssignmentStrategy[] = [];
  private readonly workloadBalancer: WorkloadBalancer;
  private readonly performanceHistory = new Map<string, PerformanceMetrics[]>();

  constructor() {
    this.workloadBalancer = new OptimalWorkloadBalancer(this);
    this.initializeStrategies();
    this.initializeDefaultSpecialists();
  }

  // === Core DelegationMonitor Implementation ===

  assignSpecialist(
    taskId: string,
    specialist: string,
    capabilities: string[],
  ): void {
    const specialistProfile = this.specialists.get(specialist);
    if (!specialistProfile) {
      throw new Error(`Specialist not found: ${specialist}`);
    }

    // Check capacity constraints
    if (
      specialistProfile.currentWorkload >= specialistProfile.maxConcurrentTasks
    ) {
      throw new Error(`Specialist ${specialist} is at capacity`);
    }

    const assignment: SpecialistAssignment = {
      taskId,
      specialist,
      capabilities,
      assignedAt: new Date(),
      status: "assigned",
      expectedCompletion: this.calculateExpectedCompletion(
        specialist,
        capabilities,
      ),
    };

    this.assignments.set(taskId, assignment);
    this.updateSpecialistWorkload(specialist, 1);
  }

  getAssignment(taskId: string): SpecialistAssignment | undefined {
    return this.assignments.get(taskId);
  }

  releaseSpecialist(taskId: string): void {
    const assignment = this.assignments.get(taskId);
    if (!assignment) return;

    // Update assignment status
    this.assignments.set(taskId, {
      ...assignment,
      status: "completed",
    });

    // Update specialist workload
    this.updateSpecialistWorkload(assignment.specialist, -1);

    // Record performance metrics
    this.recordTaskCompletion(assignment);
  }

  getWorkload(specialist: string): number {
    return Array.from(this.assignments.values())
      .filter((a) =>
        a.specialist === specialist &&
        ["assigned", "active"].includes(a.status)
      )
      .length;
  }

  listActiveAssignments(): SpecialistAssignment[] {
    return Array.from(this.assignments.values())
      .filter((a) => ["assigned", "active"].includes(a.status));
  }

  // === Advanced Assignment Management ===

  /**
   * Find optimal assignment using sophisticated scoring
   */
  findOptimalAssignment(
    request: TaskAssignmentRequest,
  ): RecommendedAssignment | null {
    const availableSpecialists = Array.from(this.specialists.values())
      .filter((s) =>
        s.availability === "available" &&
        s.currentWorkload < s.maxConcurrentTasks
      );

    if (availableSpecialists.length === 0) {
      return null;
    }

    const recommendations = this.workloadBalancer.calculateOptimalAssignment(
      request,
      availableSpecialists,
    );

    return recommendations.length > 0 ? recommendations[0] : null;
  }

  /**
   * Intelligently reassign tasks for maximum velocity
   */
  async optimizeAssignments(): Promise<RebalancingPlan> {
    const plan = this.workloadBalancer.rebalanceWorkload();

    // Execute reassignments if beneficial
    if (plan.estimatedCompletionGain > 2) { // Only if saves 2+ hours
      for (const reassignment of plan.reassignments) {
        await this.executeReassignment(reassignment);
      }
    }

    return plan;
  }

  /**
   * Add new specialist to coordination system
   */
  addSpecialist(profile: SpecialistProfile): void {
    this.specialists.set(profile.id, profile);
  }

  /**
   * Update specialist capabilities and availability
   */
  updateSpecialist(
    specialistId: string,
    updates: Partial<SpecialistProfile>,
  ): void {
    const current = this.specialists.get(specialistId);
    if (!current) {
      throw new Error(`Specialist not found: ${specialistId}`);
    }

    const updated: SpecialistProfile = {
      ...current,
      ...updates,
    };

    this.specialists.set(specialistId, updated);
  }

  /**
   * Get comprehensive specialist analytics
   */
  getSpecialistAnalytics(specialistId: string): SpecialistAnalytics | null {
    const specialist = this.specialists.get(specialistId);
    if (!specialist) return null;

    const history = this.performanceHistory.get(specialistId) || [];
    const activeAssignments = Array.from(this.assignments.values())
      .filter((a) => a.specialist === specialistId && a.status === "active");

    return {
      specialist,
      performanceHistory: history,
      currentAssignments: activeAssignments,
      projectedCompletion: this.calculateProjectedCompletion(specialist),
      utilizationTrend: this.calculateUtilizationTrend(specialistId),
      strengthAreas: this.identifyStrengths(specialist),
      improvementAreas: this.identifyImprovements(specialist),
    };
  }

  /**
   * Predict capacity needs for upcoming work
   */
  analyzeCapacityNeeds(
    upcomingTasks: TaskAssignmentRequest[],
    timeframeHours: number = 168, // 1 week default
  ): CapacityAnalysis {
    return this.workloadBalancer.predictCapacityNeeds(
      upcomingTasks,
      timeframeHours,
    );
  }

  // === Event Integration ===

  /**
   * Handle MigrationOrchestrator events
   */
  handleMigrationEvent(event: MigrationEvent): void {
    switch (event.type) {
      case "task-started":
        this.onTaskStarted(event);
        break;
      case "task-completed":
        this.onTaskCompleted(event);
        break;
      case "task-failed":
        this.onTaskFailed(event);
        break;
      case "task-blocked":
        this.onTaskBlocked(event);
        break;
      default:
        // Handle other events as needed
        break;
    }
  }

  // === Private Implementation ===

  private initializeStrategies(): void {
    this.assignmentStrategies.push(
      new CapabilityMatchStrategy(),
      new WorkloadBalanceStrategy(),
      new DeadlinePriorityStrategy(),
      new PerformanceHistoryStrategy(),
    );
  }

  private initializeDefaultSpecialists(): void {
    // Add default specialist profiles for common capabilities
    const specialists: SpecialistProfile[] = [
      {
        id: "typescript-specialist",
        name: "TypeScript Migration Specialist",
        capabilities: [
          {
            name: "typescript",
            proficiency: 9,
            category: "typescript",
            estimatedTaskTime: 1.5,
          },
          {
            name: "type-migration",
            proficiency: 10,
            category: "migration",
            estimatedTaskTime: 1.0,
          },
        ],
        maxConcurrentTasks: 3,
        currentWorkload: 0,
        utilizationRate: 0,
        averageCompletionTime: 1.2,
        completedTasks: 0,
        availability: "available",
      },
      {
        id: "integration-specialist",
        name: "Integration Testing Specialist",
        capabilities: [
          {
            name: "integration-testing",
            proficiency: 9,
            category: "testing",
            estimatedTaskTime: 2.0,
          },
          {
            name: "database-testing",
            proficiency: 8,
            category: "database",
            estimatedTaskTime: 2.5,
          },
        ],
        maxConcurrentTasks: 2,
        currentWorkload: 0,
        utilizationRate: 0,
        averageCompletionTime: 2.2,
        completedTasks: 0,
        availability: "available",
      },
    ];

    specialists.forEach((specialist) => {
      this.specialists.set(specialist.id, specialist);
    });
  }

  private calculateExpectedCompletion(
    specialist: string,
    capabilities: string[],
  ): Date {
    const profile = this.specialists.get(specialist);
    if (!profile) {
      // Default estimation
      const completion = new Date();
      completion.setHours(completion.getHours() + 2);
      return completion;
    }

    // Calculate based on specialist capabilities and current workload
    const relevantCapabilities = profile.capabilities.filter((cap) =>
      capabilities.includes(cap.name)
    );

    const avgTaskTime = relevantCapabilities.length > 0
      ? relevantCapabilities.reduce(
        (sum, cap) => sum + cap.estimatedTaskTime,
        0,
      ) /
        relevantCapabilities.length
      : profile.averageCompletionTime;

    // Account for current workload
    const workloadMultiplier = 1 + (profile.currentWorkload * 0.2);
    const estimatedHours = avgTaskTime * workloadMultiplier;

    const completion = new Date();
    completion.setHours(completion.getHours() + estimatedHours);
    return completion;
  }

  private updateSpecialistWorkload(specialist: string, delta: number): void {
    const profile = this.specialists.get(specialist);
    if (!profile) return;

    const newWorkload = Math.max(0, profile.currentWorkload + delta);
    const utilizationRate = (newWorkload / profile.maxConcurrentTasks) * 100;

    const availability: AvailabilityStatus = utilizationRate >= 100
      ? "overloaded"
      : utilizationRate >= 80
      ? "busy"
      : "available";

    this.specialists.set(specialist, {
      ...profile,
      currentWorkload: newWorkload,
      utilizationRate,
      availability,
    });
  }

  private recordTaskCompletion(assignment: SpecialistAssignment): void {
    const specialist = assignment.specialist;
    const profile = this.specialists.get(specialist);
    if (!profile) return;

    // Calculate actual completion time
    const completionTime =
      (new Date().getTime() - assignment.assignedAt.getTime()) /
      (1000 * 60 * 60); // hours

    // Update specialist stats
    const totalTasks = profile.completedTasks + 1;
    const avgTime = ((profile.averageCompletionTime * profile.completedTasks) +
      completionTime) / totalTasks;

    this.specialists.set(specialist, {
      ...profile,
      completedTasks: totalTasks,
      averageCompletionTime: avgTime,
    });

    // Record performance metrics
    const currentMetrics: PerformanceMetrics = {
      averageTaskCompletion: avgTime,
      specialistUtilization: profile.utilizationRate,
      taskThroughput: totalTasks / Math.max(1, profile.averageCompletionTime),
      blockerResolutionTime: 0, // Would track from blocker data
      qualityScore: 95, // Would calculate from task success rate
    };

    const history = this.performanceHistory.get(specialist) || [];
    history.push(currentMetrics);
    this.performanceHistory.set(specialist, history.slice(-50)); // Keep last 50 records
  }

  private async executeReassignment(
    reassignment: TaskReassignment,
  ): Promise<void> {
    const assignment = this.assignments.get(reassignment.taskId);
    if (!assignment) return;

    // Release from current specialist
    this.updateSpecialistWorkload(reassignment.fromSpecialist, -1);

    // Assign to new specialist
    const updatedAssignment: SpecialistAssignment = {
      ...assignment,
      specialist: reassignment.toSpecialist,
      status: "reassigned",
    };

    this.assignments.set(reassignment.taskId, updatedAssignment);
    this.updateSpecialistWorkload(reassignment.toSpecialist, 1);
  }

  private calculateProjectedCompletion(specialist: SpecialistProfile): Date {
    const activeAssignments = Array.from(this.assignments.values())
      .filter((a) => a.specialist === specialist.id && a.status === "active");

    if (activeAssignments.length === 0) {
      return new Date();
    }

    // Calculate based on remaining work and specialist velocity
    const totalEstimatedHours = activeAssignments.length *
      specialist.averageCompletionTime;
    const completion = new Date();
    completion.setHours(completion.getHours() + totalEstimatedHours);
    return completion;
  }

  private calculateUtilizationTrend(specialistId: string): number {
    const history = this.performanceHistory.get(specialistId) || [];
    if (history.length < 2) return 0;

    const recent = history.slice(-5); // Last 5 records
    const trend = recent.map((h) => h.specialistUtilization);

    // Simple linear trend calculation
    const avgEarly = trend.slice(0, Math.floor(trend.length / 2))
      .reduce((sum, val) => sum + val, 0) / Math.floor(trend.length / 2);
    const avgLate = trend.slice(Math.floor(trend.length / 2))
      .reduce((sum, val) => sum + val, 0) / Math.ceil(trend.length / 2);

    return avgLate - avgEarly; // Positive = increasing utilization
  }

  private identifyStrengths(specialist: SpecialistProfile): string[] {
    return specialist.capabilities
      .filter((cap) => cap.proficiency >= 8)
      .map((cap) => cap.name);
  }

  private identifyImprovements(specialist: SpecialistProfile): string[] {
    const improvements: string[] = [];

    if (specialist.averageCompletionTime > 3) {
      improvements.push("Task completion speed");
    }

    if (specialist.utilizationRate > 90) {
      improvements.push("Workload management");
    }

    const lowProficiencies = specialist.capabilities
      .filter((cap) => cap.proficiency < 7)
      .map((cap) => cap.name);

    improvements.push(...lowProficiencies);

    return improvements;
  }

  private onTaskStarted(event: MigrationEvent): void {
    const taskId = event.taskId;
    if (!taskId) return;

    const assignment = this.assignments.get(taskId);
    if (assignment && assignment.status === "assigned") {
      this.assignments.set(taskId, {
        ...assignment,
        status: "active",
      });
    }
  }

  private onTaskCompleted(event: MigrationEvent): void {
    const taskId = event.taskId;
    if (taskId) {
      this.releaseSpecialist(taskId);
    }
  }

  private onTaskFailed(event: MigrationEvent): void {
    const taskId = event.taskId;
    if (!taskId) return;

    const assignment = this.assignments.get(taskId);
    if (assignment) {
      // Consider reassignment for failed tasks
      this.assignments.set(taskId, {
        ...assignment,
        status: "reassigned",
      });

      // Free up the specialist for new work
      this.updateSpecialistWorkload(assignment.specialist, -1);
    }
  }

  private onTaskBlocked(event: MigrationEvent): void {
    const taskId = event.taskId;
    if (!taskId) return;

    const assignment = this.assignments.get(taskId);
    if (assignment) {
      // Specialist can work on other tasks while this is blocked
      this.updateSpecialistWorkload(assignment.specialist, -0.5);
    }
  }
}

// === Supporting Types ===

export interface SpecialistAnalytics {
  readonly specialist: SpecialistProfile;
  readonly performanceHistory: PerformanceMetrics[];
  readonly currentAssignments: SpecialistAssignment[];
  readonly projectedCompletion: Date;
  readonly utilizationTrend: number;
  readonly strengthAreas: string[];
  readonly improvementAreas: string[];
}

// === Assignment Strategy Implementations ===

class CapabilityMatchStrategy implements AssignmentStrategy {
  readonly name = "Capability Match";
  readonly priority = 1;

  evaluateAssignment(
    task: TaskAssignmentRequest,
    specialist: SpecialistProfile,
  ): AssignmentScore {
    const matchingCapabilities = specialist.capabilities.filter((cap) =>
      task.requiredCapabilities.includes(cap.name)
    );

    const coverageScore =
      (matchingCapabilities.length / task.requiredCapabilities.length) * 100;
    const proficiencyScore = matchingCapabilities.length > 0
      ? matchingCapabilities.reduce((sum, cap) => sum + cap.proficiency, 0) /
        matchingCapabilities.length * 10
      : 0;

    const score = (coverageScore * 0.6) + (proficiencyScore * 0.4);

    return {
      score,
      confidence: coverageScore > 80 ? 90 : 60,
      reasoning: [
        `Capability coverage: ${coverageScore.toFixed(1)}%`,
        `Average proficiency: ${(proficiencyScore / 10).toFixed(1)}/10`,
      ],
      risks: coverageScore < 50 ? ["Low capability match"] : [],
      estimatedCompletion: new Date(
        Date.now() + (task.estimatedHours * 60 * 60 * 1000),
      ),
    };
  }
}

class WorkloadBalanceStrategy implements AssignmentStrategy {
  readonly name = "Workload Balance";
  readonly priority = 2;

  evaluateAssignment(
    task: TaskAssignmentRequest,
    specialist: SpecialistProfile,
  ): AssignmentScore {
    const utilizationScore = 100 - specialist.utilizationRate;
    const capacityScore =
      ((specialist.maxConcurrentTasks - specialist.currentWorkload) /
        specialist.maxConcurrentTasks) * 100;

    const score = (utilizationScore * 0.7) + (capacityScore * 0.3);

    return {
      score,
      confidence: 80,
      reasoning: [
        `Current utilization: ${specialist.utilizationRate.toFixed(1)}%`,
        `Available capacity: ${
          specialist.maxConcurrentTasks - specialist.currentWorkload
        } tasks`,
      ],
      risks: specialist.utilizationRate > 80
        ? ["High specialist utilization"]
        : [],
      estimatedCompletion: new Date(
        Date.now() + (task.estimatedHours * 60 * 60 * 1000),
      ),
    };
  }
}

class DeadlinePriorityStrategy implements AssignmentStrategy {
  readonly name = "Deadline Priority";
  readonly priority = 3;

  evaluateAssignment(
    task: TaskAssignmentRequest,
    specialist: SpecialistProfile,
  ): AssignmentScore {
    const priorityWeight = {
      critical: 100,
      high: 80,
      medium: 60,
      low: 40,
    };

    const baseScore = priorityWeight[task.priority];

    // Adjust for deadline urgency
    let urgencyMultiplier = 1;
    if (task.deadline) {
      const hoursUntilDeadline = (task.deadline.getTime() - Date.now()) /
        (1000 * 60 * 60);
      if (hoursUntilDeadline < 24) urgencyMultiplier = 1.5;
      else if (hoursUntilDeadline < 72) urgencyMultiplier = 1.2;
    }

    const score = baseScore * urgencyMultiplier;

    return {
      score: Math.min(100, score),
      confidence: 75,
      reasoning: [
        `Task priority: ${task.priority}`,
        task.deadline
          ? `Deadline: ${task.deadline.toISOString()}`
          : "No deadline",
      ],
      risks: urgencyMultiplier > 1 ? ["Tight deadline"] : [],
      estimatedCompletion: new Date(
        Date.now() + (task.estimatedHours * 60 * 60 * 1000),
      ),
    };
  }
}

class PerformanceHistoryStrategy implements AssignmentStrategy {
  readonly name = "Performance History";
  readonly priority = 4;

  evaluateAssignment(
    task: TaskAssignmentRequest,
    specialist: SpecialistProfile,
  ): AssignmentScore {
    // Base score on completion time efficiency
    const efficiencyScore = specialist.averageCompletionTime <= 2
      ? 90
      : specialist.averageCompletionTime <= 4
      ? 70
      : 50;

    // Factor in completed task count
    const experienceScore = Math.min(100, specialist.completedTasks * 5);

    const score = (efficiencyScore * 0.6) + (experienceScore * 0.4);

    return {
      score,
      confidence: specialist.completedTasks > 5 ? 85 : 60,
      reasoning: [
        `Average completion time: ${
          specialist.averageCompletionTime.toFixed(1)
        }h`,
        `Completed tasks: ${specialist.completedTasks}`,
      ],
      risks: specialist.completedTasks < 3
        ? ["Limited performance history"]
        : [],
      estimatedCompletion: new Date(
        Date.now() + (specialist.averageCompletionTime * 60 * 60 * 1000),
      ),
    };
  }
}

// === Optimal Workload Balancer ===

class OptimalWorkloadBalancer implements WorkloadBalancer {
  constructor(private readonly coordinator: SpecialistCoordinator) {}

  calculateOptimalAssignment(
    request: TaskAssignmentRequest,
    availableSpecialists: SpecialistProfile[],
  ): RecommendedAssignment[] {
    const recommendations: RecommendedAssignment[] = [];

    for (const specialist of availableSpecialists) {
      // Use all assignment strategies
      const strategies = [
        new CapabilityMatchStrategy(),
        new WorkloadBalanceStrategy(),
        new DeadlinePriorityStrategy(),
        new PerformanceHistoryStrategy(),
      ];

      const scores = strategies.map((strategy) =>
        strategy.evaluateAssignment(request, specialist)
      );

      // Calculate weighted composite score
      const compositeScore = scores.reduce((sum, score, index) => {
        const weight = 1 / (index + 1); // Higher priority strategies get more weight
        return sum + (score.score * weight);
      }, 0) / strategies.length;

      const compositeConfidence = scores.reduce((sum, score) =>
        sum + score.confidence, 0) / scores.length;

      const assignment: SpecialistAssignment = {
        taskId: request.taskId,
        specialist: specialist.id,
        capabilities: request.requiredCapabilities,
        assignedAt: new Date(),
        status: "assigned",
        expectedCompletion: scores[0].estimatedCompletion,
      };

      recommendations.push({
        specialist,
        assignment,
        score: {
          score: compositeScore,
          confidence: compositeConfidence,
          reasoning: scores.flatMap((s) =>
            s.reasoning
          ),
          risks: scores.flatMap((s) => s.risks),
          estimatedCompletion: scores[0].estimatedCompletion,
        },
        alternatives: [], // Would be populated with other viable options
      });
    }

    // Sort by composite score
    return recommendations.sort((a, b) => b.score.score - a.score.score);
  }

  rebalanceWorkload(): RebalancingPlan {
    // Analyze current workload distribution
    const specialists = Array.from(this.coordinator["specialists"].values());
    const assignments = this.coordinator.listActiveAssignments();

    const overloadedSpecialists = specialists.filter((s) =>
      s.utilizationRate > 85
    );
    const underutilizedSpecialists = specialists.filter((s) =>
      s.utilizationRate < 50
    );

    const reassignments: TaskReassignment[] = [];

    // Identify reassignment opportunities
    for (const overloaded of overloadedSpecialists) {
      const tasks = assignments.filter((a) => a.specialist === overloaded.id);

      for (const task of tasks.slice(0, 1)) { // Consider moving 1 task
        const bestAlternative = underutilizedSpecialists
          .filter((s) =>
            s.capabilities.some((cap) => task.capabilities.includes(cap.name))
          )
          .sort((a, b) => a.utilizationRate - b.utilizationRate)[0];

        if (bestAlternative) {
          reassignments.push({
            taskId: task.taskId,
            fromSpecialist: overloaded.id,
            toSpecialist: bestAlternative.id,
            reason: "Workload balancing",
            impact: {
              velocityChange: 0.1,
              completionTimeChange: -0.5,
              utilizationImprovement: 5,
            },
          });
        }
      }
    }

    return {
      reassignments,
      expectedImprovements: {
        averageTaskCompletion: 2.0,
        specialistUtilization: 75,
        taskThroughput: 0.5,
        blockerResolutionTime: 1.0,
        qualityScore: 95,
      },
      risks: reassignments.length > 3
        ? ["Many simultaneous reassignments"]
        : [],
      estimatedCompletionGain: reassignments.length * 0.5,
    };
  }

  predictCapacityNeeds(
    upcomingTasks: TaskAssignmentRequest[],
    timeframe: number,
  ): CapacityAnalysis {
    const totalEstimatedHours = upcomingTasks.reduce(
      (sum, task) => sum + task.estimatedHours,
      0,
    );
    const specialists = Array.from(this.coordinator["specialists"].values());

    const currentCapacity = specialists.reduce((sum, s) => {
      const availableHours = (s.maxConcurrentTasks - s.currentWorkload) *
        timeframe;
      return sum + (availableHours / s.averageCompletionTime);
    }, 0);

    const requiredCapacity = totalEstimatedHours;
    const shortfall = Math.max(0, requiredCapacity - currentCapacity);

    // Analyze capability bottlenecks
    const capabilityDemand = new Map<CapabilityCategory, number>();
    upcomingTasks.forEach((task) => {
      task.requiredCapabilities.forEach((cap) => {
        // Map capability names to categories (simplified)
        const category: CapabilityCategory = cap.includes("typescript")
          ? "typescript"
          : cap.includes("test")
          ? "testing"
          : cap.includes("database")
          ? "database"
          : "architecture";

        capabilityDemand.set(
          category,
          (capabilityDemand.get(category) || 0) + task.estimatedHours,
        );
      });
    });

    const bottleneckCategories = Array.from(capabilityDemand.entries())
      .filter(([category, demand]) => {
        const categoryCapacity = specialists
          .filter((s) =>
            s.capabilities.some((cap) => cap.category === category)
          )
          .reduce(
            (sum, s) =>
              sum +
              (s.maxConcurrentTasks * timeframe / s.averageCompletionTime),
            0,
          );
        return demand > categoryCapacity;
      })
      .map(([category]) => category);

    const recommendations: CapacityRecommendation[] = [];

    if (shortfall > 10) {
      recommendations.push({
        type: "hire",
        category: "typescript",
        urgency: "immediate",
        description: "Additional TypeScript migration specialists needed",
        estimatedImpact: 0.3,
      });
    }

    return {
      currentCapacity,
      requiredCapacity,
      shortfall,
      bottleneckCategories,
      recommendations,
    };
  }
}

// === Singleton Instance ===
export const specialistCoordinator = new SpecialistCoordinator();
