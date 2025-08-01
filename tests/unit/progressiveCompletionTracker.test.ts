/**
 * Progressive Completion Tracker Tests - Task 38.2
 * 
 * Test systematic orchestration algorithms and progress tracking
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.213.0/assert/mod.ts";
import {
  ProgressiveCompletionTracker,
  createProgressiveTracker,
  formatCompletionRate,
  formatVelocity,
  formatETA,
} from "../../lib/utils/orchestration/ProgressiveCompletionTracker.ts";
import { MigrationOrchestrator } from "../../lib/utils/orchestration/MigrationOrchestrator.ts";

Deno.test("Progressive Completion Tracker - Initialization", () => {
  const orchestrator = new MigrationOrchestrator();
  const tracker = new ProgressiveCompletionTracker(orchestrator);
  
  assertExists(tracker);
  
  // Test initial status capture
  const status = tracker.getCurrentStatus();
  assertExists(status);
  assertExists(status.timestamp);
  assertExists(status.taskCompletion);
  assertExists(status.subtaskCompletion);
  assertExists(status.velocity);
  assertExists(status.projections);
  assertExists(status.bottlenecks);
  
  // Clean up
  tracker.dispose();
});

Deno.test("Progressive Completion Tracker - Baseline Metrics", () => {
  const orchestrator = new MigrationOrchestrator();
  const tracker = new ProgressiveCompletionTracker(orchestrator);
  
  const status = tracker.getCurrentStatus();
  
  // Verify baseline metrics match task description
  assertEquals(status.subtaskCompletion.total, 235);
  assertEquals(status.subtaskCompletion.completed, 215);
  assertEquals(status.subtaskCompletion.completionRate, (215 / 235) * 100);
  
  // Clean up
  tracker.dispose();
});

Deno.test("Progressive Completion Tracker - Orchestration Recommendations", () => {
  const orchestrator = new MigrationOrchestrator();
  const tracker = new ProgressiveCompletionTracker(orchestrator);
  
  const recommendations = tracker.generateOrchestrationRecommendations();
  
  assertExists(recommendations);
  // Should have some recommendations for improving completion
  // Exact number depends on current state and bottlenecks
  
  // Clean up
  tracker.dispose();
});

Deno.test("Progressive Completion Tracker - Velocity Tracking", () => {
  const orchestrator = new MigrationOrchestrator();
  const tracker = new ProgressiveCompletionTracker(orchestrator);
  
  // Initial velocity should be stable/stalled since no progress yet
  const velocity = tracker.getVelocityTrend();
  assertExists(velocity);
  assertEquals(velocity.currentVelocity, 0);
  assertEquals(velocity.averageVelocity, 0);
  assertEquals(velocity.trendDirection, "stable");
  
  // Clean up
  tracker.dispose();
});

Deno.test("Progressive Completion Tracker - Factory Function", () => {
  const orchestrator = new MigrationOrchestrator();
  const tracker = createProgressiveTracker(orchestrator);
  
  assertExists(tracker);
  
  // Clean up
  tracker.dispose();
});

Deno.test("Progressive Completion Tracker - Utility Functions", () => {
  // Test formatting utilities
  assertEquals(formatCompletionRate(91.49), "91.49%");
  assertEquals(formatVelocity(2.5), "2.5 tasks/hr");
  
  // Test ETA formatting
  assertEquals(formatETA(null), "Cannot estimate");
  
  const futureDate = new Date(Date.now() + (2 * 60 * 60 * 1000)); // 2 hours from now
  assertEquals(formatETA(futureDate), "2 hours");
  
  const nearFuture = new Date(Date.now() + (30 * 60 * 1000)); // 30 minutes from now
  assertEquals(formatETA(nearFuture), "1 hour"); // Math.ceil rounds up to 1
});

Deno.test("Progressive Completion Tracker - Event System", async () => {
  const orchestrator = new MigrationOrchestrator();
  const tracker = new ProgressiveCompletionTracker(orchestrator);
  
  let snapshotReceived = false;
  
  // Listen for snapshot events
  tracker.addEventListener("completion-snapshot", () => {
    snapshotReceived = true;
  });
  
  // Capture a snapshot to trigger event
  tracker.captureSnapshot();
  
  // Give event a moment to fire
  await new Promise(resolve => setTimeout(resolve, 10));
  
  assertEquals(snapshotReceived, true);
  
  // Clean up
  tracker.dispose();
});

Deno.test("Progressive Completion Tracker - Milestone Detection", () => {
  const orchestrator = new MigrationOrchestrator();
  const tracker = new ProgressiveCompletionTracker(orchestrator);
  
  const status = tracker.getCurrentStatus();
  
  // Current completion should be around 91.49% 
  // Should detect when crossing 95%, 97%, 99%, 100% thresholds
  const currentRate = status.taskCompletion.completionRate;
  
  // Verify we're tracking the expected completion rate
  assertEquals(Math.round(currentRate * 100) / 100, Math.round((37/41) * 100 * 100) / 100);
  
  // Clean up
  tracker.dispose();
});