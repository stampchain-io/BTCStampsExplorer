/**
 * Orchestration Types
 *
 * Type definitions for task orchestration, parallel execution, and completion management.
 * Supports Type Domain Migration orchestration and general task coordination.
 */

// Parallel Execution Framework Types ----------------------------------------

/**
 * Task that can be executed in parallel
 */
export interface ParallelTask {
  id: string;
  title: string;
  priority: number;
  dependencies: string[];
  resourceRequirements: string[];
  estimatedDuration: number;
  status: "pending" | "in-progress" | "completed" | "failed";
}

/**
 * Execution slot for parallel processing
 */
export interface ExecutionSlot {
  id: string;
  isActive: boolean;
  currentTask: string | null;
  startTime: number | null;
  resourcesAllocated: string[];
}

/**
 * Resource lock for preventing conflicts
 */
export interface ResourceLock {
  resourceId: string;
  lockedBy: string;
  lockTime: number;
  estimatedReleaseTime: number;
}

/**
 * Result of task execution
 */
export interface TaskResult {
  taskId: string;
  success: boolean;
  error?: string;
  completedAt: Date;
  duration: number;
  artifacts?: {
    filesCreated?: string[];
    filesModified?: string[];
    testsRun?: number;
    testsPassed?: number;
  };
}

// Migration Orchestrator Types ----------------------------------------------

/**
 * Type Domain Migration task metadata
 */
export interface MigrationTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  complexity: number; // 1-10 scale
  estimatedHours: number;
  actualHours?: number;
  dependencies: string[];
  blockers?: string[];
  subtasks: MigrationSubtask[];
  completionCriteria: string[];
  verificationSteps: string[];
}

/**
 * Migration subtask details
 */
export interface MigrationSubtask {
  id: string;
  parentId: string;
  title: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  assignedTo?: string;
  estimatedDuration: number;
  actualDuration?: number;
  artifacts: string[];
  verificationStatus: "not-started" | "in-progress" | "passed" | "failed";
}

/**
 * Migration progress metrics
 */
export interface MigrationProgress {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  failedTasks: number;
  blockedTasks: number;
  completionPercentage: number;
  estimatedCompletion: Date;
  criticalPath: string[];
  blockers: string[];
}

/**
 * Orchestration specialist assignment
 */
export interface SpecialistAssignment {
  specialistId: string;
  specialistType:
    | "feature-development"
    | "typescript-expert"
    | "testing-specialist"
    | "architecture-design";
  assignedTasks: string[];
  capacity: number; // 0-100 percentage
  currentWorkload: number;
  expertise: string[];
  availability: "available" | "busy" | "unavailable";
}

// Verification and Completion Types -----------------------------------------

/**
 * Physical evidence for task completion
 */
export interface PhysicalEvidence {
  taskId: string;
  evidenceType:
    | "file-creation"
    | "file-modification"
    | "test-results"
    | "build-success"
    | "deployment";
  filePath?: string;
  fileHash?: string;
  testResults?: TestEvidence;
  buildResults?: BuildEvidence;
  timestamp: Date;
  verifiedBy: string;
}

/**
 * Test execution evidence
 */
export interface TestEvidence {
  testSuite: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  executionTime: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

/**
 * Build execution evidence
 */
export interface BuildEvidence {
  buildType: "development" | "production" | "test";
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  outputFiles: string[];
}

/**
 * Comprehensive verification audit result
 */
export interface VerificationAudit {
  auditId: string;
  executedAt: Date;
  totalTasksAudited: number;
  tasksVerified: number;
  tasksFailed: number;
  overallCompletionPercentage: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  evidenceCollected: PhysicalEvidence[];
  auditTrail: AuditTrailEntry[];
}

/**
 * Audit trail entry for tracking verification steps
 */
export interface AuditTrailEntry {
  timestamp: Date;
  action: string;
  taskId?: string;
  result: "success" | "failure" | "warning";
  details: string;
  verifier: string;
}

// Completion Report Types ---------------------------------------------------

/**
 * Final completion report for Type Domain Migration
 */
export interface CompletionReport {
  reportId: string;
  generatedAt: Date;
  projectName: string;
  migrationPhase: string;
  startDate: Date;
  completionDate: Date;
  totalDuration: number; // in hours

  // Task Statistics
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    subtasksCompleted: number;
    averageTaskComplexity: number;
    criticalPathDuration: number;
  };

  // Code Metrics
  codeMetrics: {
    filesCreated: number;
    filesModified: number;
    linesOfCodeAdded: number;
    linesOfCodeRemoved: number;
    typeDefinitionsAdded: number;
    typeErrorsResolved: number;
  };

  // Quality Metrics
  qualityMetrics: {
    testCoverage: number;
    buildSuccessRate: number;
    typeCheckingErrors: number;
    eslintWarnings: number;
    performanceImprovements: string[];
  };

  // Achievement Summary
  achievements: {
    majorMilestones: string[];
    technicalImprovements: string[];
    bestPracticesImplemented: string[];
    lessonLearned: string[];
  };

  // Verification Summary
  verificationSummary: {
    auditsPassed: number;
    evidenceCollected: number;
    criticalIssuesResolved: number;
    qualityGatesAchieved: string[];
  };
}

// Export comprehensive orchestration configuration
export interface OrchestrationConfig {
  parallelExecution: {
    maxConcurrency: number;
    resourceLockTimeout: number;
    retryAttempts: number;
  };
  verification: {
    enablePhysicalEvidence: boolean;
    requireTestEvidence: boolean;
    auditFrequency: number;
  };
  reporting: {
    generateIntermediateReports: boolean;
    includeCodeMetrics: boolean;
    includePerformanceMetrics: boolean;
  };
}
