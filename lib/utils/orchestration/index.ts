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
