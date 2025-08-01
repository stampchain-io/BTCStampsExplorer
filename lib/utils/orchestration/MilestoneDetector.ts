/**
 * Automated Milestone Detection System - Task 38.5
 * Intelligent threshold monitoring and breakthrough progress identification
 *
 * Detects and celebrates critical completion thresholds (95%, 97%, 99%, 100%)
 * Event emission for achievements and momentum tracking
 */

import type {
  MigrationEvent,
  MigrationEventType,
  TypeMigrationStatus,
} from "./MigrationOrchestrator.ts";

// === Milestone Detection System ===
export interface MilestoneThreshold {
  readonly percentage: number;
  readonly name: string;
  readonly description: string;
  readonly significance: MilestoneSignificance;
  readonly celebrationType: CelebrationType;
  readonly triggers: MilestoneTrigger[];
  readonly rewards: MilestoneReward[];
}

export type MilestoneSignificance =
  | "minor"
  | "moderate"
  | "major"
  | "critical"
  | "legendary";

export type CelebrationType =
  | "notification"
  | "announcement"
  | "celebration"
  | "achievement"
  | "victory";

export interface MilestoneTrigger {
  readonly condition: string;
  readonly threshold: number;
  readonly metric: MetricType;
  readonly timeframe?: number; // hours
}

export type MetricType =
  | "completion_rate"
  | "velocity"
  | "quality_score"
  | "blocker_resolution_rate"
  | "specialist_efficiency"
  | "time_to_completion";

export interface MilestoneReward {
  readonly type: RewardType;
  readonly description: string;
  readonly value: number;
  readonly eligibility: string[];
}

export type RewardType =
  | "recognition"
  | "unlock_feature"
  | "bonus_points"
  | "achievement_badge"
  | "progress_boost";

// === Breakthrough Progress Detection ===
export interface BreakthroughSignal {
  readonly type: BreakthroughType;
  readonly magnitude: number; // 0-100 scale
  readonly duration: number; // hours
  readonly impact: BreakthroughImpact;
  readonly contributors: string[];
  readonly metrics: BreakthroughMetrics;
  readonly timestamp: Date;
}

export type BreakthroughType =
  | "velocity_surge"
  | "blocker_elimination"
  | "quality_improvement"
  | "efficiency_gain"
  | "innovation_moment"
  | "team_synchronization";

export interface BreakthroughImpact {
  readonly completionAcceleration: number; // hours saved
  readonly qualityImprovement: number; // percentage points
  readonly teamMoraleBoost: number; // 0-100 scale
  readonly knowledgeGain: string[];
  readonly processImprovements: string[];
}

export interface BreakthroughMetrics {
  readonly previousRate: number;
  readonly currentRate: number;
  readonly improvement: number; // percentage
  readonly consistency: number; // 0-100 reliability score
  readonly sustainability: number; // 0-100 likelihood to maintain
}

// === Achievement System ===
export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly rarity: AchievementRarity;
  readonly requirements: AchievementRequirement[];
  readonly unlockedAt?: Date;
  readonly progress: number; // 0-100
  readonly rewards: AchievementReward[];
}

export type AchievementCategory =
  | "completion"
  | "velocity"
  | "quality"
  | "collaboration"
  | "innovation"
  | "leadership";

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export interface AchievementRequirement {
  readonly metric: MetricType;
  readonly operator: "gt" | "gte" | "lt" | "lte" | "eq" | "between";
  readonly value: number | [number, number];
  readonly timeframe?: number; // hours
  readonly description: string;
}

export interface AchievementReward {
  readonly type: "title" | "badge" | "feature" | "boost";
  readonly name: string;
  readonly description: string;
  readonly duration?: number; // hours for temporary rewards
}

// === Progress Momentum Tracking ===
export interface MomentumState {
  readonly current: MomentumLevel;
  readonly trend: MomentumTrend;
  readonly sustainability: number; // 0-100
  readonly factors: MomentumFactor[];
  readonly recommendations: MomentumRecommendation[];
  readonly nextMilestone: MilestoneThreshold;
  readonly estimatedTime: number; // hours to next milestone
}

export type MomentumLevel =
  | "stalled"
  | "slow"
  | "steady"
  | "accelerating"
  | "breakthrough";

export type MomentumTrend =
  | "declining"
  | "stable"
  | "improving"
  | "surging";

export interface MomentumFactor {
  readonly name: string;
  readonly impact: number; // -100 to +100
  readonly category: "positive" | "negative" | "neutral";
  readonly description: string;
  readonly actionable: boolean;
}

export interface MomentumRecommendation {
  readonly priority: "low" | "medium" | "high" | "critical";
  readonly action: string;
  readonly expectedImpact: number; // 0-100
  readonly effort: number; // 0-100
  readonly timeframe: string;
}

// === Event Emission System ===
export interface MilestoneEvent {
  readonly type: MilestoneEventType;
  readonly milestone: MilestoneThreshold;
  readonly timestamp: Date;
  readonly context: MilestoneContext;
  readonly celebration: CelebrationPlan;
}

export type MilestoneEventType =
  | "milestone_reached"
  | "milestone_approaching"
  | "breakthrough_detected"
  | "achievement_unlocked"
  | "momentum_surge"
  | "celebration_time";

export interface MilestoneContext {
  readonly currentProgress: number;
  readonly previousMilestone: number;
  readonly nextMilestone: number;
  readonly timeInPhase: number; // hours
  readonly teamContributions: TeamContribution[];
  readonly keyAccomplishments: string[];
}

export interface TeamContribution {
  readonly specialist: string;
  readonly tasksCompleted: number;
  readonly qualityScore: number;
  readonly specialContributions: string[];
}

export interface CelebrationPlan {
  readonly immediate: CelebrationAction[];
  readonly scheduled: ScheduledCelebration[];
  readonly rewards: CelebrationReward[];
  readonly recognition: RecognitionPlan[];
}

export interface CelebrationAction {
  readonly type: "notification" | "sound" | "visual" | "message";
  readonly content: string;
  readonly duration: number; // seconds
  readonly audience: "individual" | "team" | "organization";
}

export interface ScheduledCelebration {
  readonly when: Date;
  readonly event: string;
  readonly participants: string[];
  readonly format: "virtual" | "message" | "report";
}

export interface CelebrationReward {
  readonly recipient: string;
  readonly reward: MilestoneReward;
  readonly justification: string;
}

export interface RecognitionPlan {
  readonly recipient: string;
  readonly achievement: string;
  readonly visibility: "team" | "organization" | "public";
  readonly format: "mention" | "spotlight" | "feature";
}

// === Core Milestone Detector ===
export class MilestoneDetector extends EventTarget {
  private readonly thresholds: MilestoneThreshold[] = [];
  private readonly achievements: Map<string, Achievement> = new Map();
  private readonly reachedMilestones = new Set<number>();
  private readonly breakthroughHistory: BreakthroughSignal[] = [];
  private readonly momentumHistory: MomentumState[] = [];
  private currentProgress = 95.02; // Starting from current state

  constructor() {
    super();
    this.initializeThresholds();
    this.initializeAchievements();
  }

  // === Core Detection Logic ===

  /**
   * Detect and celebrate critical thresholds
   */
  detectMilestones(
    currentProgress: number,
    tasks: TypeMigrationStatus[],
  ): MilestoneEvent[] {
    const events: MilestoneEvent[] = [];
    const previousProgress = this.currentProgress;
    this.currentProgress = currentProgress;

    // Check for milestone crossings
    for (const threshold of this.thresholds) {
      if (
        this.hasReachedMilestone(currentProgress, previousProgress, threshold)
      ) {
        const event = this.createMilestoneEvent(threshold, tasks);
        events.push(event);
        this.emitMilestoneEvent(event);
        this.reachedMilestones.add(threshold.percentage);
      }
    }

    // Check for approaching milestones
    const approaching = this.findApproachingMilestones(currentProgress);
    for (const threshold of approaching) {
      const event = this.createApproachingEvent(threshold, tasks);
      events.push(event);
      this.emitMilestoneEvent(event);
    }

    return events;
  }

  /**
   * Identify breakthrough progress signals
   */
  detectBreakthroughs(
    tasks: TypeMigrationStatus[],
    metrics: ProgressMetrics,
  ): BreakthroughSignal[] {
    const signals: BreakthroughSignal[] = [];

    // Velocity breakthrough detection
    const velocitySignal = this.detectVelocityBreakthrough(metrics);
    if (velocitySignal) signals.push(velocitySignal);

    // Blocker elimination breakthrough
    const blockerSignal = this.detectBlockerBreakthrough(tasks);
    if (blockerSignal) signals.push(blockerSignal);

    // Quality improvement breakthrough
    const qualitySignal = this.detectQualityBreakthrough(metrics);
    if (qualitySignal) signals.push(qualitySignal);

    // Team synchronization breakthrough
    const teamSignal = this.detectTeamSyncBreakthrough(tasks, metrics);
    if (teamSignal) signals.push(teamSignal);

    // Store breakthrough history
    signals.forEach((signal) => {
      this.breakthroughHistory.push(signal);
      this.emitBreakthroughEvent(signal);
    });

    // Keep last 50 breakthrough signals
    if (this.breakthroughHistory.length > 50) {
      this.breakthroughHistory.splice(0, this.breakthroughHistory.length - 50);
    }

    return signals;
  }

  /**
   * Track achievement progress and unlock achievements
   */
  updateAchievements(
    tasks: TypeMigrationStatus[],
    metrics: ProgressMetrics,
  ): Achievement[] {
    const unlockedAchievements: Achievement[] = [];

    for (const [id, achievement] of this.achievements) {
      if (achievement.unlockedAt) continue; // Already unlocked

      const progress = this.calculateAchievementProgress(
        achievement,
        tasks,
        metrics,
      );
      const updatedAchievement: Achievement = {
        ...achievement,
        progress,
        unlockedAt: progress >= 100 ? new Date() : undefined,
      };

      this.achievements.set(id, updatedAchievement);

      if (updatedAchievement.unlockedAt && !achievement.unlockedAt) {
        unlockedAchievements.push(updatedAchievement);
        this.emitAchievementEvent(updatedAchievement);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Analyze current momentum state
   */
  analyzeMomentum(
    tasks: TypeMigrationStatus[],
    metrics: ProgressMetrics,
  ): MomentumState {
    const current = this.determineMomentumLevel(metrics);
    const trend = this.analyzeMomentumTrend();
    const sustainability = this.calculateSustainability(metrics);
    const factors = this.identifyMomentumFactors(tasks, metrics);
    const recommendations = this.generateMomentumRecommendations(factors);
    const nextMilestone = this.findNextMilestone();
    const estimatedTime = this.estimateTimeToMilestone(nextMilestone, metrics);

    const momentumState: MomentumState = {
      current,
      trend,
      sustainability,
      factors,
      recommendations,
      nextMilestone,
      estimatedTime,
    };

    // Store momentum history
    this.momentumHistory.push(momentumState);
    if (this.momentumHistory.length > 100) {
      this.momentumHistory.splice(0, this.momentumHistory.length - 100);
    }

    return momentumState;
  }

  /**
   * Get progress towards next milestone
   */
  getNextMilestoneProgress(): MilestoneProgress {
    const nextMilestone = this.findNextMilestone();
    const previousMilestone = this.findPreviousMilestone();

    const rangeStart = previousMilestone?.percentage || 0;
    const rangeEnd = nextMilestone.percentage;
    const rangeSize = rangeEnd - rangeStart;
    const progressInRange = this.currentProgress - rangeStart;
    const percentageInRange = (progressInRange / rangeSize) * 100;

    return {
      nextMilestone,
      previousMilestone,
      currentProgress: this.currentProgress,
      progressInRange: Math.max(0, Math.min(100, percentageInRange)),
      estimatedTimeRemaining: this.estimateTimeToMilestone(
        nextMilestone,
        this.getCurrentMetrics(),
      ),
      breakthroughProbability: this.calculateBreakthroughProbability(),
    };
  }

  /**
   * Get comprehensive milestone analytics
   */
  getMilestoneAnalytics(): MilestoneAnalytics {
    const reachedCount = this.reachedMilestones.size;
    const totalCount = this.thresholds.length;
    const completionRate = (reachedCount / totalCount) * 100;

    const breakthroughsLast24h = this.breakthroughHistory.filter(
      (signal) => Date.now() - signal.timestamp.getTime() < 24 * 60 * 60 * 1000,
    );

    const unlockedAchievements = Array.from(this.achievements.values())
      .filter((achievement) => achievement.unlockedAt);

    const currentMomentum =
      this.momentumHistory[this.momentumHistory.length - 1];

    return {
      milestoneProgress: {
        reached: reachedCount,
        total: totalCount,
        completionRate,
        nextMilestone: this.findNextMilestone(),
        estimatedCompletion: this.estimateProjectCompletion(),
      },
      breakthroughAnalysis: {
        recentBreakthroughs: breakthroughsLast24h.length,
        totalBreakthroughs: this.breakthroughHistory.length,
        averageMagnitude: this.calculateAverageBreakthroughMagnitude(),
        topContributors: this.identifyTopBreakthroughContributors(),
      },
      achievementStatus: {
        unlocked: unlockedAchievements.length,
        total: this.achievements.size,
        categories: this.getAchievementsByCategory(),
        recentUnlocks: this.getRecentAchievements(24), // Last 24 hours
      },
      momentumAnalysis: {
        current: currentMomentum?.current || "steady",
        trend: currentMomentum?.trend || "stable",
        sustainability: currentMomentum?.sustainability || 50,
        keyFactors: currentMomentum?.factors.slice(0, 5) || [],
      },
    };
  }

  // === Event Integration ===

  handleMigrationEvent(event: MigrationEvent): void {
    // Update progress based on migration events
    switch (event.type) {
      case "task-completed":
        this.onTaskCompleted(event);
        break;
      case "blocker-resolved":
        this.onBlockerResolved(event);
        break;
      case "milestone-reached":
        // Already handled by orchestrator
        break;
      default:
        this.onGeneralProgress(event);
        break;
    }
  }

  // === Private Implementation ===

  private initializeThresholds(): void {
    this.thresholds.push(
      {
        percentage: 95,
        name: "The 95% Threshold",
        description: "Critical mass achieved - momentum building",
        significance: "major",
        celebrationType: "celebration",
        triggers: [
          {
            condition: "completion_rate >= 95",
            threshold: 95,
            metric: "completion_rate",
          },
        ],
        rewards: [
          {
            type: "achievement_badge",
            description: "Critical Mass achiever",
            value: 100,
            eligibility: ["all_contributors"],
          },
        ],
      },
      {
        percentage: 97,
        name: "The 97% Milestone",
        description: "Excellence zone - quality and speed in harmony",
        significance: "major",
        celebrationType: "achievement",
        triggers: [
          {
            condition: "completion_rate >= 97",
            threshold: 97,
            metric: "completion_rate",
          },
        ],
        rewards: [
          {
            type: "recognition",
            description: "Excellence Zone Recognition",
            value: 150,
            eligibility: ["team_leads", "top_contributors"],
          },
        ],
      },
      {
        percentage: 99,
        name: "The 99% Achievement",
        description: "Near-perfect execution - legendary performance",
        significance: "critical",
        celebrationType: "victory",
        triggers: [
          {
            condition: "completion_rate >= 99",
            threshold: 99,
            metric: "completion_rate",
          },
        ],
        rewards: [
          {
            type: "unlock_feature",
            description: "Legendary Status Unlocked",
            value: 200,
            eligibility: ["all_team"],
          },
        ],
      },
      {
        percentage: 100,
        name: "The 100% Victory",
        description: "Perfect completion - project mastery achieved",
        significance: "legendary",
        celebrationType: "victory",
        triggers: [
          {
            condition: "completion_rate >= 100",
            threshold: 100,
            metric: "completion_rate",
          },
        ],
        rewards: [
          {
            type: "progress_boost",
            description: "Master Achievement - Ultimate Victory",
            value: 1000,
            eligibility: ["entire_organization"],
          },
        ],
      },
    );
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      {
        id: "velocity_master",
        name: "Velocity Master",
        description: "Maintain high task completion velocity",
        category: "velocity",
        rarity: "rare",
        requirements: [
          {
            metric: "velocity",
            operator: "gte",
            value: 5,
            timeframe: 24,
            description: "Complete 5+ tasks in 24 hours",
          },
        ],
        progress: 0,
        rewards: [
          {
            type: "title",
            name: "Velocity Master",
            description: "Recognition for exceptional speed",
          },
        ],
      },
      {
        id: "blocker_destroyer",
        name: "Blocker Destroyer",
        description: "Resolve critical blockers efficiently",
        category: "collaboration",
        rarity: "epic",
        requirements: [
          {
            metric: "blocker_resolution_rate",
            operator: "gte",
            value: 90,
            timeframe: 168,
            description: "Resolve 90%+ of assigned blockers within a week",
          },
        ],
        progress: 0,
        rewards: [
          {
            type: "badge",
            name: "Blocker Destroyer",
            description: "Master of problem resolution",
          },
        ],
      },
      {
        id: "quality_champion",
        name: "Quality Champion",
        description: "Maintain exceptional quality standards",
        category: "quality",
        rarity: "legendary",
        requirements: [
          {
            metric: "quality_score",
            operator: "gte",
            value: 95,
            timeframe: 168,
            description: "Maintain 95%+ quality score for a week",
          },
        ],
        progress: 0,
        rewards: [
          {
            type: "feature",
            name: "Quality Tools Access",
            description: "Access to advanced quality analysis tools",
          },
        ],
      },
    ];

    achievements.forEach((achievement) => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private hasReachedMilestone(
    current: number,
    previous: number,
    threshold: MilestoneThreshold,
  ): boolean {
    return current >= threshold.percentage &&
      previous < threshold.percentage &&
      !this.reachedMilestones.has(threshold.percentage);
  }

  private findApproachingMilestones(
    currentProgress: number,
  ): MilestoneThreshold[] {
    return this.thresholds.filter((threshold) => {
      const distance = threshold.percentage - currentProgress;
      return distance > 0 && distance <= 2; // Within 2% of milestone
    });
  }

  private createMilestoneEvent(
    threshold: MilestoneThreshold,
    tasks: TypeMigrationStatus[],
  ): MilestoneEvent {
    const context = this.createMilestoneContext(threshold, tasks);
    const celebration = this.createCelebrationPlan(threshold, context);

    return {
      type: "milestone_reached",
      milestone: threshold,
      timestamp: new Date(),
      context,
      celebration,
    };
  }

  private createApproachingEvent(
    threshold: MilestoneThreshold,
    tasks: TypeMigrationStatus[],
  ): MilestoneEvent {
    const context = this.createMilestoneContext(threshold, tasks);
    const celebration = this.createPreparationPlan(threshold, context);

    return {
      type: "milestone_approaching",
      milestone: threshold,
      timestamp: new Date(),
      context,
      celebration,
    };
  }

  private createMilestoneContext(
    threshold: MilestoneThreshold,
    tasks: TypeMigrationStatus[],
  ): MilestoneContext {
    const previousMilestone = this.findPreviousMilestone()?.percentage || 0;
    const nextMilestone = this.findNextMilestone().percentage;

    return {
      currentProgress: this.currentProgress,
      previousMilestone,
      nextMilestone,
      timeInPhase: this.calculateTimeInPhase(),
      teamContributions: this.calculateTeamContributions(tasks),
      keyAccomplishments: this.identifyKeyAccomplishments(tasks),
    };
  }

  private createCelebrationPlan(
    threshold: MilestoneThreshold,
    context: MilestoneContext,
  ): CelebrationPlan {
    const immediate: CelebrationAction[] = [
      {
        type: "notification",
        content: `🎉 ${threshold.name} reached! ${threshold.description}`,
        duration: 10,
        audience: "team",
      },
    ];

    if (threshold.significance === "legendary") {
      immediate.push({
        type: "visual",
        content: "🏆 LEGENDARY ACHIEVEMENT UNLOCKED! 🏆",
        duration: 30,
        audience: "organization",
      });
    }

    return {
      immediate,
      scheduled: [],
      rewards: threshold.rewards.map((reward) => ({
        recipient: "team",
        reward,
        justification: `Reached ${threshold.name}`,
      })),
      recognition: context.teamContributions.map((contrib) => ({
        recipient: contrib.specialist,
        achievement: `Contributed to ${threshold.name}`,
        visibility: "team",
        format: "mention",
      })),
    };
  }

  private createPreparationPlan(
    threshold: MilestoneThreshold,
    context: MilestoneContext,
  ): CelebrationPlan {
    return {
      immediate: [
        {
          type: "notification",
          content: `🎯 Approaching ${threshold.name}! ${
            Math.round(threshold.percentage - context.currentProgress)
          }% to go!`,
          duration: 5,
          audience: "team",
        },
      ],
      scheduled: [],
      rewards: [],
      recognition: [],
    };
  }

  private detectVelocityBreakthrough(
    metrics: ProgressMetrics,
  ): BreakthroughSignal | null {
    const currentVelocity = metrics.tasksPerHour;
    const historicalAverage = this.calculateHistoricalVelocity();
    const improvement =
      ((currentVelocity - historicalAverage) / historicalAverage) * 100;

    if (improvement > 50) { // 50%+ velocity improvement
      return {
        type: "velocity_surge",
        magnitude: Math.min(100, improvement),
        duration: 4, // hours
        impact: {
          completionAcceleration: improvement * 0.1,
          qualityImprovement: 0,
          teamMoraleBoost: 20,
          knowledgeGain: ["Velocity optimization techniques"],
          processImprovements: ["Optimized task workflow"],
        },
        contributors: ["team"],
        metrics: {
          previousRate: historicalAverage,
          currentRate: currentVelocity,
          improvement,
          consistency: 75,
          sustainability: 60,
        },
        timestamp: new Date(),
      };
    }

    return null;
  }

  private detectBlockerBreakthrough(
    tasks: TypeMigrationStatus[],
  ): BreakthroughSignal | null {
    const recentlyResolved = tasks.filter((task) =>
      task.blockers.some((blocker) =>
        blocker.resolvedAt &&
        Date.now() - blocker.resolvedAt.getTime() < 4 * 60 * 60 * 1000
      )
    );

    if (recentlyResolved.length >= 3) { // 3+ blockers resolved in 4 hours
      return {
        type: "blocker_elimination",
        magnitude: recentlyResolved.length * 20,
        duration: 2,
        impact: {
          completionAcceleration: recentlyResolved.length * 0.5,
          qualityImprovement: 5,
          teamMoraleBoost: 30,
          knowledgeGain: ["Blocker resolution patterns"],
          processImprovements: ["Improved blocker identification"],
        },
        contributors: ["problem_solvers"],
        metrics: {
          previousRate: 0.5, // blockers per hour
          currentRate: recentlyResolved.length / 4,
          improvement: 300,
          consistency: 80,
          sustainability: 70,
        },
        timestamp: new Date(),
      };
    }

    return null;
  }

  private detectQualityBreakthrough(
    metrics: ProgressMetrics,
  ): BreakthroughSignal | null {
    if (
      metrics.qualityScore > 95 &&
      metrics.qualityScore > this.getPreviousQualityScore() + 10
    ) {
      return {
        type: "quality_improvement",
        magnitude: 80,
        duration: 8,
        impact: {
          completionAcceleration: 0,
          qualityImprovement: 15,
          teamMoraleBoost: 25,
          knowledgeGain: ["Quality best practices"],
          processImprovements: ["Enhanced quality controls"],
        },
        contributors: ["quality_team"],
        metrics: {
          previousRate: this.getPreviousQualityScore(),
          currentRate: metrics.qualityScore,
          improvement:
            ((metrics.qualityScore - this.getPreviousQualityScore()) /
              this.getPreviousQualityScore()) * 100,
          consistency: 90,
          sustainability: 85,
        },
        timestamp: new Date(),
      };
    }

    return null;
  }

  private detectTeamSyncBreakthrough(
    tasks: TypeMigrationStatus[],
    metrics: ProgressMetrics,
  ): BreakthroughSignal | null {
    // Detect when multiple specialists are working in perfect harmony
    const activeTasks = tasks.filter((task) => task.status === "in-progress");
    const specialists = new Set(
      activeTasks.map((task) => task.assignedSpecialist).filter(Boolean),
    );

    if (specialists.size >= 3 && metrics.tasksPerHour > 1.5) {
      return {
        type: "team_synchronization",
        magnitude: 70,
        duration: 6,
        impact: {
          completionAcceleration: 2,
          qualityImprovement: 8,
          teamMoraleBoost: 40,
          knowledgeGain: ["Team coordination strategies"],
          processImprovements: ["Synchronized workflow patterns"],
        },
        contributors: Array.from(specialists) as string[],
        metrics: {
          previousRate: 0.8,
          currentRate: metrics.tasksPerHour,
          improvement: 87.5,
          consistency: 85,
          sustainability: 75,
        },
        timestamp: new Date(),
      };
    }

    return null;
  }

  private calculateAchievementProgress(
    achievement: Achievement,
    tasks: TypeMigrationStatus[],
    metrics: ProgressMetrics,
  ): number {
    let totalProgress = 0;
    let requirementCount = achievement.requirements.length;

    for (const requirement of achievement.requirements) {
      const metricValue = this.getMetricValue(
        requirement.metric,
        tasks,
        metrics,
      );
      const progress = this.evaluateRequirement(requirement, metricValue);
      totalProgress += progress;
    }

    return totalProgress / requirementCount;
  }

  private getMetricValue(
    metric: MetricType,
    tasks: TypeMigrationStatus[],
    metrics: ProgressMetrics,
  ): number {
    switch (metric) {
      case "completion_rate":
        return this.currentProgress;
      case "velocity":
        return metrics.tasksPerHour;
      case "quality_score":
        return metrics.qualityScore;
      case "blocker_resolution_rate":
        return metrics.blockerResolutionRate || 0;
      case "specialist_efficiency":
        return metrics.specialistEfficiency || 0;
      case "time_to_completion":
        return metrics.timeToCompletion || 0;
      default:
        return 0;
    }
  }

  private evaluateRequirement(
    requirement: AchievementRequirement,
    value: number,
  ): number {
    switch (requirement.operator) {
      case "gte":
        return value >= (requirement.value as number) ? 100 : 0;
      case "gt":
        return value > (requirement.value as number) ? 100 : 0;
      case "lte":
        return value <= (requirement.value as number) ? 100 : 0;
      case "lt":
        return value < (requirement.value as number) ? 100 : 0;
      case "eq":
        return value === (requirement.value as number) ? 100 : 0;
      case "between":
        const [min, max] = requirement.value as [number, number];
        return value >= min && value <= max ? 100 : 0;
      default:
        return 0;
    }
  }

  private determineMomentumLevel(metrics: ProgressMetrics): MomentumLevel {
    const velocity = metrics.tasksPerHour;
    const quality = metrics.qualityScore;

    if (velocity >= 2.0 && quality >= 95) return "breakthrough";
    if (velocity >= 1.5 && quality >= 90) return "accelerating";
    if (velocity >= 1.0 && quality >= 85) return "steady";
    if (velocity >= 0.5) return "slow";
    return "stalled";
  }

  private analyzeMomentumTrend(): MomentumTrend {
    if (this.momentumHistory.length < 2) return "stable";

    const recent = this.momentumHistory.slice(-3);
    const levels = recent.map((state) => {
      const levelValue = {
        stalled: 1,
        slow: 2,
        steady: 3,
        accelerating: 4,
        breakthrough: 5,
      };
      return levelValue[state.current];
    });

    const trend = levels[levels.length - 1] - levels[0];

    if (trend > 1) return "surging";
    if (trend > 0) return "improving";
    if (trend < -1) return "declining";
    return "stable";
  }

  private calculateSustainability(metrics: ProgressMetrics): number {
    // Base sustainability on consistency of metrics
    const qualityStability = metrics.qualityScore >= 85 ? 30 : 10;
    const velocityStability = metrics.tasksPerHour >= 1.0 ? 30 : 10;
    const teamStability = 20; // Would calculate from team metrics
    const processStability = 20; // Would calculate from process adherence

    return qualityStability + velocityStability + teamStability +
      processStability;
  }

  private identifyMomentumFactors(
    tasks: TypeMigrationStatus[],
    metrics: ProgressMetrics,
  ): MomentumFactor[] {
    const factors: MomentumFactor[] = [];

    // Positive factors
    if (metrics.qualityScore >= 90) {
      factors.push({
        name: "High Quality Standards",
        impact: 20,
        category: "positive",
        description: "Maintaining excellent quality throughout development",
        actionable: false,
      });
    }

    if (metrics.tasksPerHour >= 1.5) {
      factors.push({
        name: "Strong Velocity",
        impact: 25,
        category: "positive",
        description: "Completing tasks at high speed",
        actionable: false,
      });
    }

    // Negative factors
    const blockedTasks =
      tasks.filter((task) => task.status === "blocked").length;
    if (blockedTasks > 2) {
      factors.push({
        name: "Multiple Blockers",
        impact: -15,
        category: "negative",
        description: `${blockedTasks} tasks currently blocked`,
        actionable: true,
      });
    }

    return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  private generateMomentumRecommendations(
    factors: MomentumFactor[],
  ): MomentumRecommendation[] {
    const recommendations: MomentumRecommendation[] = [];

    const negativeFactors = factors.filter((f) =>
      f.category === "negative" && f.actionable
    );

    for (const factor of negativeFactors) {
      if (factor.name === "Multiple Blockers") {
        recommendations.push({
          priority: "high",
          action: "Focus on resolving blockers to maintain momentum",
          expectedImpact: 70,
          effort: 40,
          timeframe: "immediate",
        });
      }
    }

    // Add general recommendations
    recommendations.push({
      priority: "medium",
      action: "Maintain current quality standards while increasing velocity",
      expectedImpact: 50,
      effort: 30,
      timeframe: "ongoing",
    });

    return recommendations;
  }

  private findNextMilestone(): MilestoneThreshold {
    return this.thresholds.find((t) => t.percentage > this.currentProgress) ||
      this.thresholds[this.thresholds.length - 1];
  }

  private findPreviousMilestone(): MilestoneThreshold | null {
    const previous = this.thresholds
      .filter((t) => t.percentage <= this.currentProgress)
      .sort((a, b) => b.percentage - a.percentage);

    return previous[0] || null;
  }

  private estimateTimeToMilestone(
    milestone: MilestoneThreshold,
    metrics: ProgressMetrics,
  ): number {
    const remainingProgress = milestone.percentage - this.currentProgress;
    const currentVelocity = metrics.tasksPerHour * 0.5; // Assume each task = 0.5% progress

    if (currentVelocity <= 0) return 999; // Infinite time if no progress

    return remainingProgress / currentVelocity;
  }

  private getCurrentMetrics(): ProgressMetrics {
    // Mock implementation - would get real metrics
    return {
      tasksPerHour: 1.2,
      qualityScore: 92,
      blockerResolutionRate: 85,
      specialistEfficiency: 88,
      timeToCompletion: 48,
    };
  }

  private calculateBreakthroughProbability(): number {
    const recentBreakthroughs = this.breakthroughHistory.filter(
      (signal) => Date.now() - signal.timestamp.getTime() < 24 * 60 * 60 * 1000,
    );

    // Higher recent breakthrough activity increases probability
    const baseProb = 20;
    const recentBonus = recentBreakthroughs.length * 10;
    const momentumBonus = this.momentumHistory.length > 0 &&
        this.momentumHistory[this.momentumHistory.length - 1].current ===
          "accelerating"
      ? 20
      : 0;

    return Math.min(95, baseProb + recentBonus + momentumBonus);
  }

  private estimateProjectCompletion(): Date {
    const remaining = 100 - this.currentProgress;
    const velocity = this.getCurrentMetrics().tasksPerHour * 0.5; // 0.5% per task
    const hoursRemaining = velocity > 0 ? remaining / velocity : 999;

    return new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
  }

  private calculateAverageBreakthroughMagnitude(): number {
    if (this.breakthroughHistory.length === 0) return 0;

    const total = this.breakthroughHistory.reduce(
      (sum, signal) => sum + signal.magnitude,
      0,
    );
    return total / this.breakthroughHistory.length;
  }

  private identifyTopBreakthroughContributors(): string[] {
    const contributors = new Map<string, number>();

    this.breakthroughHistory.forEach((signal) => {
      signal.contributors.forEach((contributor) => {
        contributors.set(
          contributor,
          (contributors.get(contributor) || 0) + signal.magnitude,
        );
      });
    });

    return Array.from(contributors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([contributor]) => contributor);
  }

  private getAchievementsByCategory(): Record<AchievementCategory, number> {
    const categories: Record<AchievementCategory, number> = {
      completion: 0,
      velocity: 0,
      quality: 0,
      collaboration: 0,
      innovation: 0,
      leadership: 0,
    };

    Array.from(this.achievements.values())
      .filter((achievement) => achievement.unlockedAt)
      .forEach((achievement) => {
        categories[achievement.category]++;
      });

    return categories;
  }

  private getRecentAchievements(hours: number): Achievement[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    return Array.from(this.achievements.values())
      .filter((achievement) =>
        achievement.unlockedAt &&
        achievement.unlockedAt.getTime() > cutoff
      );
  }

  private calculateHistoricalVelocity(): number {
    return 1.0; // Would calculate from historical data
  }

  private getPreviousQualityScore(): number {
    return 85; // Would get from historical metrics
  }

  private calculateTimeInPhase(): number {
    return 12; // hours - would calculate actual time in current phase
  }

  private calculateTeamContributions(
    tasks: TypeMigrationStatus[],
  ): TeamContribution[] {
    const contributions: TeamContribution[] = [];
    const specialists = new Set(
      tasks.map((t) => t.assignedSpecialist).filter(Boolean),
    );

    specialists.forEach((specialist) => {
      if (specialist) {
        const specialistTasks = tasks.filter((t) =>
          t.assignedSpecialist === specialist
        );
        const completed = specialistTasks.filter((t) =>
          t.status === "completed"
        ).length;

        contributions.push({
          specialist,
          tasksCompleted: completed,
          qualityScore: 90, // Would calculate actual quality score
          specialContributions: ["High-quality implementations"],
        });
      }
    });

    return contributions;
  }

  private identifyKeyAccomplishments(tasks: TypeMigrationStatus[]): string[] {
    const accomplishments: string[] = [];

    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    if (completedTasks > 10) {
      accomplishments.push(`Completed ${completedTasks} tasks`);
    }

    const resolvedBlockers = tasks.flatMap((t) => t.blockers)
      .filter((b) => b.resolvedAt).length;
    if (resolvedBlockers > 5) {
      accomplishments.push(`Resolved ${resolvedBlockers} blockers`);
    }

    return accomplishments;
  }

  private onTaskCompleted(event: MigrationEvent): void {
    // Update progress calculations
    this.currentProgress += 0.5; // Assume each task is 0.5% progress
  }

  private onBlockerResolved(event: MigrationEvent): void {
    // Boost momentum on blocker resolution
  }

  private onGeneralProgress(event: MigrationEvent): void {
    // Handle general progress updates
  }

  private emitMilestoneEvent(event: MilestoneEvent): void {
    const customEvent = new CustomEvent("milestone", {
      detail: event,
    });
    this.dispatchEvent(customEvent);
  }

  private emitBreakthroughEvent(signal: BreakthroughSignal): void {
    const customEvent = new CustomEvent("breakthrough", {
      detail: signal,
    });
    this.dispatchEvent(customEvent);
  }

  private emitAchievementEvent(achievement: Achievement): void {
    const customEvent = new CustomEvent("achievement", {
      detail: achievement,
    });
    this.dispatchEvent(customEvent);
  }
}

// === Supporting Types ===

interface ProgressMetrics {
  tasksPerHour: number;
  qualityScore: number;
  blockerResolutionRate?: number;
  specialistEfficiency?: number;
  timeToCompletion?: number;
}

interface MilestoneProgress {
  nextMilestone: MilestoneThreshold;
  previousMilestone: MilestoneThreshold | null;
  currentProgress: number;
  progressInRange: number;
  estimatedTimeRemaining: number;
  breakthroughProbability: number;
}

interface MilestoneAnalytics {
  milestoneProgress: {
    reached: number;
    total: number;
    completionRate: number;
    nextMilestone: MilestoneThreshold;
    estimatedCompletion: Date;
  };
  breakthroughAnalysis: {
    recentBreakthroughs: number;
    totalBreakthroughs: number;
    averageMagnitude: number;
    topContributors: string[];
  };
  achievementStatus: {
    unlocked: number;
    total: number;
    categories: Record<AchievementCategory, number>;
    recentUnlocks: Achievement[];
  };
  momentumAnalysis: {
    current: MomentumLevel;
    trend: MomentumTrend;
    sustainability: number;
    keyFactors: MomentumFactor[];
  };
}

// === Singleton Instance ===
export const milestoneDetector = new MilestoneDetector();
