/**
 * Migration Orchestration System - Main Exports
 * Task 38.1 - Core MigrationOrchestrator Implementation
 *
 * Provides systematic orchestration for driving type domain migration
 * completion from 95.02% to 100% through specialist delegation,
 * real-time monitoring, and progressive completion tracking.
 */

// Core orchestrator and types
export {
  type BlockerInfo,
  type BlockerSummary,
  // Delegation system
  type DelegationMonitor,
  isMigrationEvent,
  // Type guards
  isTypeMigrationStatus,
  // Event system
  type MigrationEvent,
  type MigrationEventType,
  MigrationOrchestrator,
  migrationOrchestrator,
  type MigrationProgressReport,
  type MigrationState,
  // Progress reporting
  type ProgressReporter,
  type SpecialistAssignment,
  type SpecialistUtilization,
  // Core interfaces
  type TypeMigrationStatus,
} from "./MigrationOrchestrator.ts";

// Task 38.3 - Specialist Assignment Coordination
export {
  type AccelerationPlan,
  type AccelerationStrategy,
  type AssignmentScore,
  type AssignmentStrategy,
  type CapabilityCategory,
  type CapacityAnalysis,
  type CapacityRecommendation,
  type PerformanceMetrics,
  type RebalancingPlan,
  type RecommendedAssignment,
  type SpecialistAnalytics,
  type SpecialistCapability,
  SpecialistCoordinator,
  type SpecialistCoordinator as SpecialistCoordinatorType,
  specialistCoordinator,
  type SpecialistProfile,
  type TaskAssignmentRequest,
  type TaskPriority,
  type TaskReassignment,
  type WorkloadBalancer,
} from "./SpecialistCoordinator.ts";

// Task 38.4 - Critical Path Analysis
export {
  type BottleneckInfo,
  type BottleneckType,
  type BreakthroughSignal,
  type BreakthroughType,
  type CriticalPath,
  CriticalPathAnalyzer,
  type CriticalPathAnalyzer as CriticalPathAnalyzerType,
  criticalPathAnalyzer,
  type CriticalPathNode,
  type ParallelizationOpportunity,
  type PathPriority,
  type ResolutionStrategy,
} from "./CriticalPathAnalyzer.ts";

// Task 38.5 - Automated Milestone Detection
export {
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
  type BreakthroughImpact,
  type CelebrationType,
  MilestoneDetector,
  type MilestoneDetector as MilestoneDetectorType,
  milestoneDetector,
  type MilestoneEvent,
  type MilestoneEventType,
  type MilestoneSignificance,
  type MilestoneThreshold,
  type MomentumLevel,
  type MomentumState,
  type MomentumTrend,
} from "./MilestoneDetector.ts";

// Task 38.6 - Task Master AI Integration
export {
  type OrchestrationEvent,
  TaskMasterIntegration,
  type TaskMasterUpdate,
} from "./TaskMasterIntegration.ts";

// Task 38.7 - Maximum Velocity Maintenance
export {
  type CompletionBlocker,
  type MomentumIndicator,
  VelocityMaintainer,
  type VelocityMaintainerConfig,
  type VelocityMetrics,
} from "./VelocityMaintainer.ts";

// Task 38.8 - Type Module Integration
export {
  type DependencyGraph,
  type ParallelMigrationConfig,
  type TypeModule,
  TypeModuleIntegrator,
  type TypeModuleIntegratorConfig,
  type TypeModuleStatus,
  type ValidationResult,
} from "./TypeModuleIntegrator.ts";
