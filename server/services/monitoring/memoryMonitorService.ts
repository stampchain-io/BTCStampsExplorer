/**
 * Memory Monitoring Service for Container Environments
 * Provides memory usage tracking, leak detection, and health endpoints
 * Platform-agnostic design for Docker, ECS, Kubernetes, etc.
 */

export interface MemoryUsage {
  rss: number;           // Resident Set Size
  heapTotal: number;     // Total heap size
  heapUsed: number;      // Used heap size
  external: number;      // External memory usage
  arrayBuffers: number;  // ArrayBuffer memory usage
}

export interface MemoryMetrics {
  current: MemoryUsage;
  peak: MemoryUsage;
  timestamp: number;
  uptimeSeconds: number;
  memoryPressure: "low" | "medium" | "high" | "critical";
  leakDetected: boolean;
  gcInfo?: {
    lastGC: number;
    totalGCs: number;
    averageGCTime: number;
  };
}

export interface MemoryLimits {
  heapLimit: number;     // Container memory limit (bytes)
  warningThreshold: number;   // 70% of limit
  criticalThreshold: number;  // 85% of limit
  maxAllowedRSS: number;     // 90% of container limit
}

export class MemoryMonitorService {
  private static instance: MemoryMonitorService;
  private memoryHistory: MemoryUsage[] = [];
  private peakMemory: MemoryUsage;
  private memoryLimits: MemoryLimits;
  private monitoringInterval?: number;
  private gcMetrics = {
    totalGCs: 0,
    totalGCTime: 0,
    lastGCTime: 0
  };

  private constructor() {
    // Initialize peak memory tracking
    this.peakMemory = this.getCurrentMemoryUsage();

    // Set default memory limits (can be overridden by container environment)
    this.memoryLimits = this.detectContainerLimits();

    // Start monitoring
    this.startMonitoring();

    // Setup graceful shutdown
    this.setupShutdownHandlers();
  }

  static getInstance(): MemoryMonitorService {
    if (!MemoryMonitorService.instance) {
      MemoryMonitorService.instance = new MemoryMonitorService();
    }
    return MemoryMonitorService.instance;
  }

  /**
   * Get current memory usage from Deno runtime
   */
  private getCurrentMemoryUsage(): MemoryUsage {
    const usage = Deno.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: (usage as any).arrayBuffers || 0  // Not all Deno versions have this
    };
  }

  /**
   * Detect container memory limits from environment
   */
  private detectContainerLimits(): MemoryLimits {
    // Try to detect container memory limits
    let containerLimit = 2048 * 1024 * 1024; // Default 2GB

    try {
      // Check for common container memory environment variables
      const containerMemory = Deno.env.get("CONTAINER_MEMORY_LIMIT") ||
                              Deno.env.get("MEMORY_LIMIT") ||
                              Deno.env.get("MAX_MEMORY");

      if (containerMemory) {
        containerLimit = parseInt(containerMemory) * 1024 * 1024; // Assume MB
      } else {
        // Try to read cgroup memory limit (Linux containers)
        try {
          const cgroupLimit = Deno.readTextFileSync("/sys/fs/cgroup/memory/memory.limit_in_bytes");
          const limit = parseInt(cgroupLimit.trim());
          if (limit && limit > 0 && limit < Number.MAX_SAFE_INTEGER) {
            containerLimit = limit;
          }
        } catch {
          // Fallback to cgroup v2
          try {
            const cgroupV2Limit = Deno.readTextFileSync("/sys/fs/cgroup/memory.max");
            const limit = parseInt(cgroupV2Limit.trim());
            if (limit && limit > 0 && limit < Number.MAX_SAFE_INTEGER) {
              containerLimit = limit;
            }
          } catch {
            // Use default
          }
        }
      }
         } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       console.warn("[MemoryMonitor] Could not detect container memory limits, using defaults:", errorMessage);
     }

    return {
      heapLimit: containerLimit,
      warningThreshold: Math.floor(containerLimit * 0.70),   // 70%
      criticalThreshold: Math.floor(containerLimit * 0.85),  // 85%
      maxAllowedRSS: Math.floor(containerLimit * 0.90)       // 90%
    };
  }

  /**
   * Start memory monitoring with periodic checks
   */
  private startMonitoring(): void {
    const MONITORING_INTERVAL = 30000; // 30 seconds

    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();
      this.checkMemoryPressure();
    }, MONITORING_INTERVAL);
  }

  /**
   * Record current memory usage and update peaks
   */
  private recordMemoryUsage(): void {
    const current = this.getCurrentMemoryUsage();

    // Update peaks
    if (current.rss > this.peakMemory.rss) this.peakMemory.rss = current.rss;
    if (current.heapTotal > this.peakMemory.heapTotal) this.peakMemory.heapTotal = current.heapTotal;
    if (current.heapUsed > this.peakMemory.heapUsed) this.peakMemory.heapUsed = current.heapUsed;
    if (current.external > this.peakMemory.external) this.peakMemory.external = current.external;
    if (current.arrayBuffers > this.peakMemory.arrayBuffers) this.peakMemory.arrayBuffers = current.arrayBuffers;

    // Store in history (keep last 100 entries, ~50 minutes)
    this.memoryHistory.push(current);
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Check for memory pressure and take action if needed
   */
  private checkMemoryPressure(): void {
    const current = this.getCurrentMemoryUsage();
    const pressure = this.calculateMemoryPressure(current);

    if (pressure === "critical") {
      console.error("[MemoryMonitor] CRITICAL memory pressure detected!", {
        current: this.formatBytes(current.rss),
        limit: this.formatBytes(this.memoryLimits.heapLimit),
        percentage: Math.round((current.rss / this.memoryLimits.heapLimit) * 100)
      });

      // Force garbage collection
      this.forceGarbageCollection();

    } else if (pressure === "high") {
      console.warn("[MemoryMonitor] HIGH memory pressure detected", {
        current: this.formatBytes(current.rss),
        limit: this.formatBytes(this.memoryLimits.heapLimit),
        percentage: Math.round((current.rss / this.memoryLimits.heapLimit) * 100)
      });

      // Suggest garbage collection
      this.suggestGarbageCollection();
    }
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(usage: MemoryUsage): "low" | "medium" | "high" | "critical" {
    const rssPercentage = (usage.rss / this.memoryLimits.heapLimit) * 100;

    if (rssPercentage >= 85) return "critical";
    if (rssPercentage >= 70) return "high";
    if (rssPercentage >= 50) return "medium";
    return "low";
  }

  /**
   * Force garbage collection (if available)
   */
  private forceGarbageCollection(): void {
    try {
      const startTime = performance.now();

      // Deno doesn't expose gc() directly, but we can try to trigger it
      // by creating and releasing large objects
      const triggerGC = () => {
        const largeArray = new Array(1000000).fill(0);
        largeArray.length = 0;
      };

      // Trigger multiple times to ensure GC
      for (let i = 0; i < 3; i++) {
        triggerGC();
      }

      const endTime = performance.now();
      const gcTime = endTime - startTime;

      this.gcMetrics.totalGCs++;
      this.gcMetrics.totalGCTime += gcTime;
      this.gcMetrics.lastGCTime = Date.now();

      console.log("[MemoryMonitor] Triggered garbage collection", {
        duration: `${gcTime.toFixed(2)}ms`,
        totalGCs: this.gcMetrics.totalGCs
      });

         } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       console.warn("[MemoryMonitor] Could not force garbage collection:", errorMessage);
     }
  }

  /**
   * Suggest garbage collection (less aggressive)
   */
  private suggestGarbageCollection(): void {
    // Create a small trigger to suggest GC
    const suggestion = new Array(10000).fill(0);
    suggestion.length = 0;
  }

  /**
   * Detect memory leaks based on trends
   */
  private detectMemoryLeak(): boolean {
    if (this.memoryHistory.length < 10) return false;

    // Get last 10 measurements
    const recent = this.memoryHistory.slice(-10);

    // Check if memory usage is consistently increasing
    let increasing = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].heapUsed > recent[i-1].heapUsed) {
        increasing++;
      }
    }

    // If 80% of recent measurements show increase, flag as potential leak
    return (increasing / (recent.length - 1)) >= 0.8;
  }

  /**
   * Get comprehensive memory metrics
   */
  getMemoryMetrics(): MemoryMetrics {
    const current = this.getCurrentMemoryUsage();
    const pressure = this.calculateMemoryPressure(current);
    const leakDetected = this.detectMemoryLeak();

    return {
      current,
      peak: { ...this.peakMemory },
      timestamp: Date.now(),
      uptimeSeconds: Math.floor(performance.now() / 1000),
      memoryPressure: pressure,
      leakDetected,
      gcInfo: {
        lastGC: this.gcMetrics.lastGCTime,
        totalGCs: this.gcMetrics.totalGCs,
        averageGCTime: this.gcMetrics.totalGCs > 0
          ? this.gcMetrics.totalGCTime / this.gcMetrics.totalGCs
          : 0
      }
    };
  }

  /**
   * Get memory health status for health checks
   */
  getHealthStatus(): {
    status: "healthy" | "warning" | "critical";
    message: string;
    metrics: {
      memoryUsagePercent: number;
      memoryPressure: string;
      leakDetected: boolean;
    };
  } {
    const current = this.getCurrentMemoryUsage();
    const pressure = this.calculateMemoryPressure(current);
    const leakDetected = this.detectMemoryLeak();
    const usagePercent = Math.round((current.rss / this.memoryLimits.heapLimit) * 100);

    let status: "healthy" | "warning" | "critical" = "healthy";
    let message = "Memory usage is within normal limits";

    if (pressure === "critical" || usagePercent >= 85) {
      status = "critical";
      message = `Critical memory usage: ${usagePercent}%`;
    } else if (pressure === "high" || usagePercent >= 70 || leakDetected) {
      status = "warning";
      message = leakDetected
        ? `Memory leak detected, usage: ${usagePercent}%`
        : `High memory usage: ${usagePercent}%`;
    }

    return {
      status,
      message,
      metrics: {
        memoryUsagePercent: usagePercent,
        memoryPressure: pressure,
        leakDetected
      }
    };
  }

  /**
   * Get memory statistics for monitoring endpoints
   */
  getMemoryStats(): {
    usage: {
      current: MemoryUsage;
      peak: MemoryUsage;
      formatted: {
        current: Record<string, string>;
        peak: Record<string, string>;
      };
    };
    limits: MemoryLimits & {
      formatted: Record<string, string>;
    };
    health: {
      pressure: string;
      leakDetected: boolean;
      uptimeSeconds: number;
    };
    history: MemoryUsage[];
  } {
    const current = this.getCurrentMemoryUsage();

    return {
      usage: {
        current,
        peak: this.peakMemory,
        formatted: {
          current: {
            rss: this.formatBytes(current.rss),
            heapTotal: this.formatBytes(current.heapTotal),
            heapUsed: this.formatBytes(current.heapUsed),
            external: this.formatBytes(current.external),
            arrayBuffers: this.formatBytes(current.arrayBuffers)
          },
          peak: {
            rss: this.formatBytes(this.peakMemory.rss),
            heapTotal: this.formatBytes(this.peakMemory.heapTotal),
            heapUsed: this.formatBytes(this.peakMemory.heapUsed),
            external: this.formatBytes(this.peakMemory.external),
            arrayBuffers: this.formatBytes(this.peakMemory.arrayBuffers)
          }
        }
      },
      limits: {
        ...this.memoryLimits,
        formatted: {
          heapLimit: this.formatBytes(this.memoryLimits.heapLimit),
          warningThreshold: this.formatBytes(this.memoryLimits.warningThreshold),
          criticalThreshold: this.formatBytes(this.memoryLimits.criticalThreshold),
          maxAllowedRSS: this.formatBytes(this.memoryLimits.maxAllowedRSS)
        }
      },
      health: {
        pressure: this.calculateMemoryPressure(current),
        leakDetected: this.detectMemoryLeak(),
        uptimeSeconds: Math.floor(performance.now() / 1000)
      },
      history: [...this.memoryHistory]
    };
  }

  /**
   * Reset peak memory tracking
   */
  resetPeakMemory(): void {
    this.peakMemory = this.getCurrentMemoryUsage();
    console.log("[MemoryMonitor] Peak memory tracking reset");
  }

  /**
   * Clear memory history
   */
  clearHistory(): void {
    this.memoryHistory = [];
    console.log("[MemoryMonitor] Memory history cleared");
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const cleanup = () => {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      console.log("[MemoryMonitor] Monitoring stopped");
    };

    // Handle various shutdown signals
    ["SIGINT", "SIGTERM", "SIGUSR2"].forEach(signal => {
      try {
        Deno.addSignalListener(signal as Deno.Signal, cleanup);
      } catch {
        // Signal handling might not be available in all environments
      }
    });

    // Handle unload event
    addEventListener("unload", cleanup);
  }

  /**
   * Set custom memory limits (useful for different container environments)
   */
  setMemoryLimits(limits: Partial<MemoryLimits>): void {
    this.memoryLimits = { ...this.memoryLimits, ...limits };

    // If heap limit changed, recalculate thresholds if they weren't explicitly set
    if (limits.heapLimit && !limits.warningThreshold && !limits.criticalThreshold && !limits.maxAllowedRSS) {
      this.memoryLimits.warningThreshold = Math.floor(limits.heapLimit * 0.70);
      this.memoryLimits.criticalThreshold = Math.floor(limits.heapLimit * 0.85);
      this.memoryLimits.maxAllowedRSS = Math.floor(limits.heapLimit * 0.90);
    }

    console.log("[MemoryMonitor] Memory limits updated:", {
      heapLimit: this.formatBytes(this.memoryLimits.heapLimit),
      warningThreshold: this.formatBytes(this.memoryLimits.warningThreshold),
      criticalThreshold: this.formatBytes(this.memoryLimits.criticalThreshold)
    });
  }
}

// Export singleton instance
export const memoryMonitor = MemoryMonitorService.getInstance();
