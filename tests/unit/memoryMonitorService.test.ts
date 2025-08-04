import { MemoryMonitorService } from "$/server/services/monitoring/memoryMonitorService.ts";
import { assert, assertEquals, assertExists } from "@std/assert";
import { afterAll, afterEach, beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";

describe("MemoryMonitorService", () => {
  let memoryMonitor: MemoryMonitorService;

  beforeEach(() => {
    // Mock Deno.addSignalListener to prevent leaks
    const originalAddSignalListener = Deno.addSignalListener;
    Deno.addSignalListener = () => {};
    
    // Get the singleton instance
    memoryMonitor = MemoryMonitorService.getInstance();
    
    // Restore after initialization
    Deno.addSignalListener = originalAddSignalListener;
  });

  afterEach(() => {
    // Reset peak memory and clear history for clean tests
    memoryMonitor.resetPeakMemory();
    memoryMonitor.clearHistory();
  });
  
  afterAll(() => {
    // Stop monitoring to clean up intervals and listeners
    memoryMonitor.stopMonitoring();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = MemoryMonitorService.getInstance();
      const instance2 = MemoryMonitorService.getInstance();
      assertEquals(instance1, instance2);
    });
  });

  describe("Memory Metrics", () => {
    it("should get current memory metrics", () => {
      const metrics = memoryMonitor.getMemoryMetrics();

      assertExists(metrics.current);
      assertExists(metrics.peak);
      assertExists(metrics.timestamp);
      assertExists(metrics.uptimeSeconds);
      assertExists(metrics.memoryPressure);
      assertExists(metrics.leakDetected);
      assertExists(metrics.gcInfo);

      // Check that current memory values are positive numbers
      assert(metrics.current.rss > 0);
      assert(metrics.current.heapTotal > 0);
      assert(metrics.current.heapUsed > 0);
      assert(metrics.current.external >= 0);
      assert(metrics.current.arrayBuffers >= 0);

      // Check that memory pressure is valid
      assert(
        ["low", "medium", "high", "critical"].includes(metrics.memoryPressure),
      );

      // Check that leak detection returns a boolean
      assertEquals(typeof metrics.leakDetected, "boolean");
    });

    it("should track peak memory", () => {
      const initialMetrics = memoryMonitor.getMemoryMetrics();
      const initialPeak = initialMetrics.peak.rss;

      // Force some memory allocation to potentially increase peak
      const largeArray = new Array(100000).fill("test");
      const newMetrics = memoryMonitor.getMemoryMetrics();

      // Peak should be >= initial peak
      assert(newMetrics.peak.rss >= initialPeak);

      // Clean up
      largeArray.length = 0;
    });
  });

  describe("Health Status", () => {
    it("should return valid health status", () => {
      const health = memoryMonitor.getHealthStatus();

      assertExists(health.status);
      assertExists(health.message);
      assertExists(health.metrics);

      // Status should be one of the valid values
      assert(["healthy", "warning", "critical"].includes(health.status));

      // Message should be a non-empty string
      assert(typeof health.message === "string");
      assert(health.message.length > 0);

      // Metrics should have required properties
      assert(typeof health.metrics.memoryUsagePercent === "number");
      assert(health.metrics.memoryUsagePercent >= 0);
      assert(health.metrics.memoryUsagePercent <= 100);

      assert(typeof health.metrics.memoryPressure === "string");
      assert(
        ["low", "medium", "high", "critical"].includes(
          health.metrics.memoryPressure,
        ),
      );

      assert(typeof health.metrics.leakDetected === "boolean");
    });

    it("should calculate memory pressure correctly", () => {
      const stats = memoryMonitor.getMemoryStats();
      const health = memoryMonitor.getHealthStatus();

      // Memory pressure should correspond to usage percentage
      const usagePercent = (stats.usage.current.rss / stats.limits.heapLimit) *
        100;

      // Test that the memory pressure matches the expected thresholds
      // We can't predict exact memory usage in tests, so verify the logic
      const expectedPressure = usagePercent >= 85 ? "critical" :
                              usagePercent >= 70 ? "high" :
                              usagePercent >= 50 ? "medium" : "low";

      assertEquals(health.metrics.memoryPressure, expectedPressure);
      
      // Also verify that the pressure is one of the valid values
      assert(
        ["low", "medium", "high", "critical"].includes(health.metrics.memoryPressure),
        `Invalid memory pressure value: ${health.metrics.memoryPressure}`
      );
    });
  });

  describe("Memory Statistics", () => {
    it("should return comprehensive memory statistics", () => {
      const stats = memoryMonitor.getMemoryStats();

      // Check usage section
      assertExists(stats.usage);
      assertExists(stats.usage.current);
      assertExists(stats.usage.peak);
      assertExists(stats.usage.formatted);
      assertExists(stats.usage.formatted.current);
      assertExists(stats.usage.formatted.peak);

      // Check limits section
      assertExists(stats.limits);
      assert(stats.limits.heapLimit > 0);
      assert(stats.limits.warningThreshold > 0);
      assert(stats.limits.criticalThreshold > 0);
      assert(stats.limits.maxAllowedRSS > 0);
      assertExists(stats.limits.formatted);

      // Check health section
      assertExists(stats.health);
      assert(typeof stats.health.pressure === "string");
      assert(typeof stats.health.leakDetected === "boolean");
      assert(typeof stats.health.uptimeSeconds === "number");

      // Check history
      assertExists(stats.history);
      assert(Array.isArray(stats.history));
    });

    it("should format bytes correctly", () => {
      const stats = memoryMonitor.getMemoryStats();

      // Check that formatted values contain units
      const currentFormatted = stats.usage.formatted.current;
      assert(currentFormatted.rss.includes(" ")); // Should have space and unit
      assert(currentFormatted.heapTotal.includes(" "));
      assert(currentFormatted.heapUsed.includes(" "));

      // Should contain valid units
      const validUnits = ["B", "KB", "MB", "GB", "TB"];
      const rssUnit = currentFormatted.rss.split(" ")[1];
      assert(validUnits.includes(rssUnit));
    });
  });

  describe("Memory Limits", () => {
    it("should set custom memory limits", () => {
      const originalStats = memoryMonitor.getMemoryStats();
      const originalHeapLimit = originalStats.limits.heapLimit;

      // Set custom limits
      const customLimits = {
        heapLimit: 1024 * 1024 * 1024, // 1GB
        warningThreshold: 1024 * 1024 * 512, // 512MB
        criticalThreshold: 1024 * 1024 * 768, // 768MB
      };

      memoryMonitor.setMemoryLimits(customLimits);

      const newStats = memoryMonitor.getMemoryStats();
      assertEquals(newStats.limits.heapLimit, customLimits.heapLimit);
      assertEquals(
        newStats.limits.warningThreshold,
        customLimits.warningThreshold,
      );
      assertEquals(
        newStats.limits.criticalThreshold,
        customLimits.criticalThreshold,
      );

      // Restore original limits
      memoryMonitor.setMemoryLimits({ heapLimit: originalHeapLimit });
    });

    it("should validate memory limit relationships", () => {
      const stats = memoryMonitor.getMemoryStats();

      // Warning threshold should be less than critical threshold
      assert(stats.limits.warningThreshold < stats.limits.criticalThreshold);

      // Critical threshold should be less than max allowed RSS
      assert(stats.limits.criticalThreshold < stats.limits.maxAllowedRSS);

      // Max allowed RSS should be less than or equal to heap limit
      assert(stats.limits.maxAllowedRSS <= stats.limits.heapLimit);
    });
  });

  describe("Memory History Management", () => {
    it("should clear memory history", () => {
      // Get initial history length
      const initialStats = memoryMonitor.getMemoryStats();
      const initialHistoryLength = initialStats.history.length;

      // Clear history
      memoryMonitor.clearHistory();

      // Verify history is cleared
      const clearedStats = memoryMonitor.getMemoryStats();
      assertEquals(clearedStats.history.length, 0);
      assert(
        clearedStats.history.length < initialHistoryLength ||
          initialHistoryLength === 0,
      );
    });

    it("should reset peak memory", () => {
      // Force some memory allocation
      const largeArray = new Array(50000).fill("test");

      // Get initial peak
      const initialMetrics = memoryMonitor.getMemoryMetrics();
      const initialPeak = initialMetrics.peak.rss;

      // Reset peak memory
      memoryMonitor.resetPeakMemory();

      // Get new metrics
      const newMetrics = memoryMonitor.getMemoryMetrics();

      // Peak should be updated to current values (may be similar but timing could differ)
      assertExists(newMetrics.peak);
      assert(newMetrics.peak.rss > 0);

      // Clean up
      largeArray.length = 0;
    });
  });

  describe("Container Environment Detection", () => {
    it("should detect container limits from environment", () => {
      const stats = memoryMonitor.getMemoryStats();

      // Should have reasonable default limits
      assert(stats.limits.heapLimit > 0);

      // Should have detected some kind of limit (default or actual)
      // Default is 512MB, so it should be at least that much
      assert(stats.limits.heapLimit >= 512 * 1024 * 1024);
    });
  });

  describe("Memory Leak Detection", () => {
    it("should not detect memory leak initially", () => {
      const health = memoryMonitor.getHealthStatus();

      // With fresh history, should not detect leaks
      assertEquals(health.metrics.leakDetected, false);
    });
  });

  describe("Performance", () => {
    it("should get metrics quickly", () => {
      const startTime = performance.now();
      const metrics = memoryMonitor.getMemoryMetrics();
      const endTime = performance.now();

      // Should complete within reasonable time (< 100ms)
      const duration = endTime - startTime;
      assert(duration < 100);

      // Should return valid data
      assertExists(metrics);
      assert(metrics.current.rss > 0);
    });

    it("should get health status quickly", () => {
      const startTime = performance.now();
      const health = memoryMonitor.getHealthStatus();
      const endTime = performance.now();

      // Should complete within reasonable time (< 50ms)
      const duration = endTime - startTime;
      assert(duration < 50);

      // Should return valid data
      assertExists(health);
      assert(["healthy", "warning", "critical"].includes(health.status));
    });
  });
});
