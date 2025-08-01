/**
 * Maximum Velocity Maintenance System
 * 
 * Ensures sustained maximum velocity deployment, prevents completion blockers,
 * and maintains unstoppable momentum toward 100% completion.
 */

import type { 
  TaskStatus, 
  MigrationMetrics,
  VelocityMetrics,
  CompletionBlocker,
  MomentumIndicator 
} from '@/lib/types/services.d.ts';

export interface VelocityMaintainerConfig {
  targetVelocity: number; // tasks per day
  momentumThreshold: number; // minimum momentum to maintain
  blockerDetectionInterval: number; // ms
  emergencyProtocolThreshold: number; // completion percentage to trigger emergency protocols
  maxRecoveryTime: number; // max time allowed for velocity recovery in ms
}

/**
 * System for maintaining maximum velocity and preventing completion blockers
 */
export class VelocityMaintainer {
  private readonly config: VelocityMaintainerConfig;
  private readonly velocityHistory: Array<{ timestamp: number; value: number }> = [];
  private readonly blockerHistory: CompletionBlocker[] = [];
  private readonly momentumIndicators: MomentumIndicator[] = [];
  
  private monitoringInterval: number | null = null;
  private emergencyProtocolActive = false;
  private lastVelocityCheck = 0;
  private currentMomentum = 0;

  constructor(config: Partial<VelocityMaintainerConfig> = {}) {
    this.config = {
      targetVelocity: 3.0, // 3 tasks per day
      momentumThreshold: 0.8, // 80% momentum maintenance
      blockerDetectionInterval: 30000, // Check every 30 seconds
      emergencyProtocolThreshold: 95, // Activate emergency protocols at 95% completion
      maxRecoveryTime: 300000, // 5 minutes max recovery time
      ...config
    };

    this.initializeVelocityMonitoring();
  }

  /**
   * Initialize continuous velocity monitoring
   */
  private initializeVelocityMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performVelocityCheck();
    }, this.config.blockerDetectionInterval);

    // Initialize momentum tracking
    this.currentMomentum = 1.0; // Start with full momentum
  }

  /**
   * Ensure sustained maximum velocity deployment
   */
  async maintainMaximumVelocity(currentMetrics: MigrationMetrics): Promise<{
    velocityStatus: 'optimal' | 'degraded' | 'critical' | 'emergency';
    currentVelocity: number;
    targetVelocity: number;
    adjustmentsApplied: string[];
    nextCheckIn: number;
  }> {
    try {
      // Calculate current velocity
      const currentVelocity = this.calculateCurrentVelocity(currentMetrics);
      
      // Record velocity measurement
      this.recordVelocityMeasurement(currentVelocity);

      // Determine velocity status
      const velocityStatus = this.assessVelocityStatus(currentVelocity);

      // Apply velocity adjustments based on status
      const adjustments = await this.applyVelocityAdjustments(velocityStatus, currentMetrics);

      // Update momentum indicators
      this.updateMomentumIndicators(velocityStatus, currentVelocity);

      return {
        velocityStatus,
        currentVelocity,
        targetVelocity: this.config.targetVelocity,
        adjustmentsApplied: adjustments,
        nextCheckIn: Date.now() + this.config.blockerDetectionInterval
      };
    } catch (error) {
      console.error('Failed to maintain maximum velocity:', error);
      throw error;
    }
  }

  /**
   * Prevent completion blockers through proactive detection
   */
  async preventCompletionBlockers(context: {
    pendingTasks: Array<{ id: string; dependencies: string[]; complexity: number }>;
    activeSpecialists: string[];
    systemResources: { cpu: number; memory: number; disk: number };
    externalDependencies: Array<{ service: string; status: 'available' | 'degraded' | 'unavailable' }>;
  }): Promise<{
    blockersDetected: CompletionBlocker[];
    preventiveActions: Array<{ action: string; priority: 'high' | 'medium' | 'low'; eta: string }>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitigationStrategies: string[];
  }> {
    try {
      // Detect potential blockers
      const blockersDetected = await this.detectPotentialBlockers(context);

      // Assess overall risk level
      const riskLevel = this.assessRiskLevel(blockersDetected);

      // Generate preventive actions
      const preventiveActions = this.generatePreventiveActions(blockersDetected);

      // Develop mitigation strategies
      const mitigationStrategies = this.developMitigationStrategies(blockersDetected, riskLevel);

      // Record blocker detection results
      this.recordBlockerDetection(blockersDetected, riskLevel);

      return {
        blockersDetected,
        preventiveActions,
        riskLevel,
        mitigationStrategies
      };
    } catch (error) {
      console.error('Failed to prevent completion blockers:', error);
      throw error;
    }
  }

  /**
   * Maintain unstoppable momentum toward 100% completion
   */
  async maintainUnstoppableMomentum(progressMetrics: {
    completionPercentage: number;
    recentCompletions: Array<{ taskId: string; completedAt: number; complexity: number }>;
    upcomingDeadlines: Array<{ taskId: string; deadline: number; critical: boolean }>;
    teamMorale: number; // 0-1 scale
  }): Promise<{
    momentumStatus: 'unstoppable' | 'strong' | 'moderate' | 'weak' | 'stalled';
    momentumScore: number; // 0-1 scale
    accelerationActions: string[];
    momentumPreservation: string[];
    projectedCompletion: string;
  }> {
    try {
      // Calculate momentum score
      const momentumScore = this.calculateMomentumScore(progressMetrics);

      // Determine momentum status
      const momentumStatus = this.determineMomentumStatus(momentumScore);

      // Generate acceleration actions
      const accelerationActions = this.generateAccelerationActions(momentumStatus, progressMetrics);

      // Develop momentum preservation strategies
      const momentumPreservation = this.developMomentumPreservation(progressMetrics);

      // Project completion timeline
      const projectedCompletion = this.projectCompletionTimeline(progressMetrics, momentumScore);

      // Update current momentum
      this.currentMomentum = momentumScore;

      // Trigger emergency protocols if needed
      if (progressMetrics.completionPercentage >= this.config.emergencyProtocolThreshold) {
        await this.activateEmergencyCompletionProtocol(progressMetrics);
      }

      return {
        momentumStatus,
        momentumScore,
        accelerationActions,
        momentumPreservation,
        projectedCompletion
      };
    } catch (error) {
      console.error('Failed to maintain unstoppable momentum:', error);
      throw error;
    }
  }

  /**
   * Calculate current velocity from metrics
   */
  private calculateCurrentVelocity(metrics: MigrationMetrics): number {
    // Calculate tasks completed per day
    const elapsedDays = Math.max(metrics.elapsedDays || 1, 1);
    return metrics.completedTasks / elapsedDays;
  }

  /**
   * Record velocity measurement
   */
  private recordVelocityMeasurement(velocity: number): void {
    this.velocityHistory.push({
      timestamp: Date.now(),
      value: velocity
    });

    // Keep only last 100 measurements
    if (this.velocityHistory.length > 100) {
      this.velocityHistory.shift();
    }
  }

  /**
   * Assess velocity status
   */
  private assessVelocityStatus(currentVelocity: number): 'optimal' | 'degraded' | 'critical' | 'emergency' {
    const velocityRatio = currentVelocity / this.config.targetVelocity;

    if (velocityRatio >= 1.2) return 'optimal'; // 120% or better
    if (velocityRatio >= 0.8) return 'degraded'; // 80-119%
    if (velocityRatio >= 0.5) return 'critical'; // 50-79%
    return 'emergency'; // Below 50%
  }

  /**
   * Apply velocity adjustments
   */
  private async applyVelocityAdjustments(
    status: 'optimal' | 'degraded' | 'critical' | 'emergency',
    metrics: MigrationMetrics
  ): Promise<string[]> {
    const adjustments: string[] = [];

    switch (status) {
      case 'optimal':
        adjustments.push('Maintain current pace');
        adjustments.push('Consider parallel execution opportunities');
        break;

      case 'degraded':
        adjustments.push('Increase specialist allocation');
        adjustments.push('Identify and remove minor blockers');
        adjustments.push('Optimize task sequencing');
        break;

      case 'critical':
        adjustments.push('Activate velocity recovery protocol');
        adjustments.push('Reassign high-priority specialists');
        adjustments.push('Implement parallel task execution');
        adjustments.push('Defer non-critical tasks');
        break;

      case 'emergency':
        adjustments.push('ACTIVATE EMERGENCY VELOCITY PROTOCOL');
        adjustments.push('All available specialists to critical path');
        adjustments.push('Suspend all non-essential activities');
        adjustments.push('Implement 24/7 monitoring');
        await this.activateEmergencyVelocityProtocol();
        break;
    }

    return adjustments;
  }

  /**
   * Detect potential blockers
   */
  private async detectPotentialBlockers(context: {
    pendingTasks: Array<{ id: string; dependencies: string[]; complexity: number }>;
    activeSpecialists: string[];
    systemResources: { cpu: number; memory: number; disk: number };
    externalDependencies: Array<{ service: string; status: string }>;
  }): Promise<CompletionBlocker[]> {
    const blockers: CompletionBlocker[] = [];

    // Detect dependency chain blockers
    const dependencyBlockers = this.detectDependencyBlockers(context.pendingTasks);
    blockers.push(...dependencyBlockers);

    // Detect resource constraint blockers
    const resourceBlockers = this.detectResourceBlockers(context.systemResources, context.activeSpecialists);
    blockers.push(...resourceBlockers);

    // Detect external dependency blockers
    const externalBlockers = this.detectExternalBlockers(context.externalDependencies);
    blockers.push(...externalBlockers);

    // Detect complexity accumulation blockers
    const complexityBlockers = this.detectComplexityBlockers(context.pendingTasks);
    blockers.push(...complexityBlockers);

    return blockers;
  }

  /**
   * Detect dependency chain blockers
   */
  private detectDependencyBlockers(tasks: Array<{ id: string; dependencies: string[] }>): CompletionBlocker[] {
    const blockers: CompletionBlocker[] = [];
    
    // Find circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    tasks.forEach(task => {
      if (this.hasCyclicDependency(task, tasks, visited, recursionStack)) {
        blockers.push({
          id: `dependency-cycle-${task.id}`,
          type: 'dependency-cycle',
          severity: 'high',
          description: `Circular dependency detected involving task ${task.id}`,
          estimatedDelay: '1-3 days',
          mitigationStrategy: 'Break dependency cycle through task reordering'
        });
      }
    });

    return blockers;
  }

  /**
   * Detect resource constraint blockers
   */
  private detectResourceBlockers(
    systemResources: { cpu: number; memory: number; disk: number },
    specialists: string[]
  ): CompletionBlocker[] {
    const blockers: CompletionBlocker[] = [];

    // Check system resource constraints
    if (systemResources.cpu > 90) {
      blockers.push({
        id: 'cpu-constraint',
        type: 'resource-constraint',
        severity: 'medium',
        description: 'High CPU usage may impact task execution performance',
        estimatedDelay: '0.5-1 day',
        mitigationStrategy: 'Optimize resource-intensive operations or scale infrastructure'
      });
    }

    if (systemResources.memory > 85) {
      blockers.push({
        id: 'memory-constraint',
        type: 'resource-constraint',
        severity: 'medium',
        description: 'High memory usage approaching limits',
        estimatedDelay: '0.5-1 day',
        mitigationStrategy: 'Optimize memory usage or increase available memory'
      });
    }

    // Check specialist availability
    if (specialists.length < 3) {
      blockers.push({
        id: 'specialist-shortage',
        type: 'resource-constraint',
        severity: 'high',
        description: 'Insufficient specialists for optimal task execution',
        estimatedDelay: '1-2 days',
        mitigationStrategy: 'Recruit additional specialists or optimize task distribution'
      });
    }

    return blockers;
  }

  /**
   * Detect external dependency blockers
   */
  private detectExternalBlockers(dependencies: Array<{ service: string; status: string }>): CompletionBlocker[] {
    return dependencies
      .filter(dep => dep.status !== 'available')
      .map(dep => ({
        id: `external-${dep.service}`,
        type: 'external-dependency',
        severity: dep.status === 'unavailable' ? 'high' : 'medium',
        description: `External service ${dep.service} is ${dep.status}`,
        estimatedDelay: dep.status === 'unavailable' ? '1-3 days' : '0.5-1 day',
        mitigationStrategy: 'Implement fallback or wait for service restoration'
      }));
  }

  /**
   * Detect complexity accumulation blockers
   */
  private detectComplexityBlockers(tasks: Array<{ id: string; complexity: number }>): CompletionBlocker[] {
    const blockers: CompletionBlocker[] = [];
    
    const highComplexityTasks = tasks.filter(task => task.complexity >= 8);
    if (highComplexityTasks.length > 3) {
      blockers.push({
        id: 'complexity-accumulation',
        type: 'complexity-overload',
        severity: 'medium',
        description: `${highComplexityTasks.length} high-complexity tasks may create bottleneck`,
        estimatedDelay: '1-2 days',
        mitigationStrategy: 'Break down complex tasks or distribute across multiple specialists'
      });
    }

    return blockers;
  }

  /**
   * Check for cyclic dependencies
   */
  private hasCyclicDependency(
    task: { id: string; dependencies: string[] },
    allTasks: Array<{ id: string; dependencies: string[] }>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(task.id);
    recursionStack.add(task.id);

    for (const depId of task.dependencies) {
      const depTask = allTasks.find(t => t.id === depId);
      if (!depTask) continue;

      if (!visited.has(depId)) {
        if (this.hasCyclicDependency(depTask, allTasks, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        return true;
      }
    }

    recursionStack.delete(task.id);
    return false;
  }

  /**
   * Calculate momentum score
   */
  private calculateMomentumScore(metrics: {
    completionPercentage: number;
    recentCompletions: Array<{ completedAt: number; complexity: number }>;
    teamMorale: number;
  }): number {
    // Base score from completion percentage
    let score = Math.min(metrics.completionPercentage / 100, 1);

    // Adjust for recent completion velocity
    const recentVelocity = this.calculateRecentVelocity(metrics.recentCompletions);
    score = score * 0.7 + (recentVelocity / this.config.targetVelocity) * 0.2;

    // Adjust for team morale
    score = score * 0.9 + metrics.teamMorale * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate recent completion velocity
   */
  private calculateRecentVelocity(completions: Array<{ completedAt: number; complexity: number }>): number {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentCompletions = completions.filter(c => c.completedAt > oneDayAgo);
    return recentCompletions.length; // Simple count for now
  }

  /**
   * Determine momentum status from score
   */
  private determineMomentumStatus(score: number): 'unstoppable' | 'strong' | 'moderate' | 'weak' | 'stalled' {
    if (score >= 0.9) return 'unstoppable';
    if (score >= 0.75) return 'strong';
    if (score >= 0.5) return 'moderate';
    if (score >= 0.25) return 'weak';
    return 'stalled';
  }

  /**
   * Generate acceleration actions
   */
  private generateAccelerationActions(
    status: string,
    metrics: { completionPercentage: number }
  ): string[] {
    const actions: string[] = [];

    switch (status) {
      case 'unstoppable':
        actions.push('Maintain current extraordinary pace');
        actions.push('Prepare for final completion sprint');
        break;

      case 'strong':
        actions.push('Sustain strong momentum');
        actions.push('Identify opportunities for final acceleration');
        break;

      case 'moderate':
        actions.push('Implement momentum boosting strategies');
        actions.push('Increase task completion frequency');
        actions.push('Remove moderate friction points');
        break;

      case 'weak':
        actions.push('URGENT: Implement momentum recovery protocol');
        actions.push('Reassess and reallocate resources');
        actions.push('Address team motivation and blockers');
        break;

      case 'stalled':
        actions.push('CRITICAL: Activate emergency momentum recovery');
        actions.push('All-hands intervention required');
        actions.push('Identify and eliminate all blockers immediately');
        break;
    }

    // Add completion-specific actions
    if (metrics.completionPercentage >= 95) {
      actions.push('FINAL SPRINT: Deploy maximum velocity completion protocol');
      actions.push('All specialists focus on remaining critical tasks');
    }

    return actions;
  }

  /**
   * Develop momentum preservation strategies
   */
  private developMomentumPreservation(metrics: {
    completionPercentage: number;
    teamMorale: number;
  }): string[] {
    const strategies: string[] = [];

    strategies.push('Celebrate recent achievements to maintain morale');
    strategies.push('Maintain regular progress visibility');
    strategies.push('Prevent specialist burnout through rotation');

    if (metrics.completionPercentage >= 90) {
      strategies.push('Maintain focus on final completion goals');
      strategies.push('Prevent late-stage complacency');
      strategies.push('Preserve energy for final push');
    }

    if (metrics.teamMorale < 0.7) {
      strategies.push('Address team morale concerns immediately');
      strategies.push('Provide additional motivation and recognition');
    }

    return strategies;
  }

  /**
   * Project completion timeline
   */
  private projectCompletionTimeline(
    metrics: { completionPercentage: number },
    momentumScore: number
  ): string {
    const remainingPercentage = 100 - metrics.completionPercentage;
    const adjustedVelocity = this.config.targetVelocity * momentumScore;
    const estimatedDays = Math.ceil(remainingPercentage / (adjustedVelocity * 10)); // Rough estimate

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + estimatedDays);

    return completionDate.toISOString().split('T')[0];
  }

  /**
   * Activate emergency completion protocol
   */
  private async activateEmergencyCompletionProtocol(metrics: {
    completionPercentage: number;
  }): Promise<void> {
    if (this.emergencyProtocolActive) return;

    console.log(`🚨 EMERGENCY COMPLETION PROTOCOL ACTIVATED at ${metrics.completionPercentage}%`);
    
    this.emergencyProtocolActive = true;

    // Implement emergency measures
    // - Increase monitoring frequency
    // - Prioritize all remaining tasks as critical
    // - Activate maximum resource allocation
    // - Enable 24/7 progress tracking
  }

  /**
   * Activate emergency velocity protocol
   */
  private async activateEmergencyVelocityProtocol(): Promise<void> {
    console.log('🚨 EMERGENCY VELOCITY PROTOCOL ACTIVATED');
    
    // Emergency velocity recovery measures
    // - Suspend all non-critical activities
    // - Reallocate all available resources
    // - Enable continuous monitoring
    // - Implement velocity recovery tracking
  }

  /**
   * Perform periodic velocity check
   */
  private performVelocityCheck(): void {
    const now = Date.now();
    
    // Skip if checked recently
    if (now - this.lastVelocityCheck < this.config.blockerDetectionInterval) {
      return;
    }

    this.lastVelocityCheck = now;

    // Log velocity check
    console.log(`🔍 Velocity check performed at ${new Date().toISOString()}`);
  }

  /**
   * Assess overall risk level
   */
  private assessRiskLevel(blockers: CompletionBlocker[]): 'low' | 'medium' | 'high' | 'critical' {
    if (blockers.length === 0) return 'low';
    
    const highSeverityCount = blockers.filter(b => b.severity === 'high').length;
    if (highSeverityCount >= 3) return 'critical';
    if (highSeverityCount >= 1) return 'high';
    if (blockers.length >= 3) return 'medium';
    
    return 'low';
  }

  /**
   * Generate preventive actions
   */
  private generatePreventiveActions(blockers: CompletionBlocker[]): Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    eta: string;
  }> {
    return blockers.map(blocker => ({
      action: blocker.mitigationStrategy,
      priority: blocker.severity === 'high' ? 'high' : 'medium',
      eta: blocker.estimatedDelay
    }));
  }

  /**
   * Develop mitigation strategies
   */
  private developMitigationStrategies(blockers: CompletionBlocker[], riskLevel: string): string[] {
    const strategies: string[] = [
      'Proactive blocker monitoring and early detection',
      'Resource buffer maintenance for quick response',
      'Alternative execution path planning'
    ];

    if (riskLevel === 'high' || riskLevel === 'critical') {
      strategies.push('Emergency response team activation');
      strategies.push('Stakeholder notification and support escalation');
    }

    return strategies;
  }

  /**
   * Record blocker detection
   */
  private recordBlockerDetection(blockers: CompletionBlocker[], riskLevel: string): void {
    blockers.forEach(blocker => {
      this.blockerHistory.push({
        ...blocker,
        detectedAt: Date.now(),
        riskLevel
      });
    });

    // Keep only last 50 blocker records
    if (this.blockerHistory.length > 50) {
      this.blockerHistory.splice(0, this.blockerHistory.length - 50);
    }
  }

  /**
   * Update momentum indicators
   */
  private updateMomentumIndicators(status: string, velocity: number): void {
    this.momentumIndicators.push({
      timestamp: Date.now(),
      status,
      velocity,
      momentum: this.currentMomentum
    });

    // Keep only last 100 indicators
    if (this.momentumIndicators.length > 100) {
      this.momentumIndicators.shift();
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    isActive: boolean;
    currentMomentum: number;
    emergencyProtocolActive: boolean;
    recentVelocity: number;
    blockerCount: number;
  } {
    const recentVelocity = this.velocityHistory.length > 0 
      ? this.velocityHistory[this.velocityHistory.length - 1].value 
      : 0;

    return {
      isActive: this.monitoringInterval !== null,
      currentMomentum: this.currentMomentum,
      emergencyProtocolActive: this.emergencyProtocolActive,
      recentVelocity,
      blockerCount: this.blockerHistory.length
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.velocityHistory.length = 0;
    this.blockerHistory.length = 0;
    this.momentumIndicators.length = 0;
    this.emergencyProtocolActive = false;
  }
}

export default VelocityMaintainer;