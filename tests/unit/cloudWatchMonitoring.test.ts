// tests/unit/cloudWatchMonitoring.test.ts
import {
    type BusinessMetrics,
    cloudWatchMonitoring,
} from "$server/services/aws/cloudWatchMonitoring.ts";
import { ecsDetection } from "$server/services/aws/ecsDetection.ts";
import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing@1.0.14/bdd";

describe("CloudWatch Monitoring Service", () => {
  // Store original functions to restore later
  const originalSetInterval = globalThis.setInterval;
  const originalAddSignalListener = Deno.addSignalListener;
  const originalRemoveSignalListener = Deno.removeSignalListener;
  const intervals: number[] = [];
  const signalListeners: Array<{ signal: Deno.Signal; handler: () => void }> = [];

  beforeAll(async () => {
    // Mock setInterval to track intervals for cleanup
    globalThis.setInterval = function (callback: any, delay: number) {
      const id = originalSetInterval(callback, delay);
      intervals.push(id);
      return id;
    } as any;

    // Mock Deno.addSignalListener to track signal listeners
    Deno.addSignalListener = (signal: Deno.Signal, handler: () => void) => {
      signalListeners.push({ signal, handler });
    };

    // Mock Deno.removeSignalListener for completeness
    Deno.removeSignalListener = (signal: Deno.Signal, handler: () => void) => {
      const index = signalListeners.findIndex(
        (item) => item.signal === signal && item.handler === handler
      );
      if (index !== -1) {
        signalListeners.splice(index, 1);
      }
    };

    // Initialize the service for testing
    try {
      await cloudWatchMonitoring.initialize();
    } catch (error) {
      console.warn(
        "CloudWatch initialization failed in test (expected in non-ECS environment):",
        error,
      );
    }
  });

  afterAll(() => {
    // Clean up all intervals
    intervals.forEach((id) => clearInterval(id));
    intervals.length = 0;

    // Clear all tracked signal listeners
    signalListeners.length = 0;

    // Restore original functions
    globalThis.setInterval = originalSetInterval;
    Deno.addSignalListener = originalAddSignalListener;
    Deno.removeSignalListener = originalRemoveSignalListener;
  });

  describe("Initialization", () => {
    it("should initialize without throwing errors", async () => {
      const status = cloudWatchMonitoring.getMonitoringStatus();
      assertExists(status);
      assertEquals(typeof status.initialized, "boolean");
    });

    it("should detect ECS environment correctly", async () => {
      const status = cloudWatchMonitoring.getMonitoringStatus();
      assertEquals(typeof status.ecsDetected, "boolean");
      assertEquals(typeof status.awsEnvironment, "boolean");
    });

    it("should provide monitoring status information", () => {
      const status = cloudWatchMonitoring.getMonitoringStatus();

      assertExists(status.metricQueueSize);
      assertExists(status.logQueueSize);
      assertEquals(typeof status.metricQueueSize, "number");
      assertEquals(typeof status.logQueueSize, "number");
    });
  });

  describe("Health Check Data", () => {
    it("should provide comprehensive health check data", () => {
      const healthData = cloudWatchMonitoring.getHealthCheckData();

      assertExists(healthData.status);
      assertExists(healthData.timestamp);
      assertExists(healthData.memory);
      assertExists(healthData.objectPools);
      assertExists(healthData.businessMetrics);

      assertEquals(healthData.status, "healthy");
      assertEquals(typeof healthData.timestamp, "string");
    });

    it("should include memory utilization metrics", () => {
      const healthData = cloudWatchMonitoring.getHealthCheckData();

      assertExists(healthData.memory.current);
      assertExists(healthData.memory.limits);
      assertExists(healthData.memory.pressure);

      assertEquals(typeof healthData.memory.current.rss, "number");
      assertEquals(typeof healthData.memory.current.heapUsed, "number");
    });

    it("should include object pool metrics", () => {
      const healthData = cloudWatchMonitoring.getHealthCheckData();

      assertExists(healthData.objectPools);
      assertEquals(typeof healthData.objectPools, "object");
    });

    it("should include ECS metadata when available", () => {
      const healthData = cloudWatchMonitoring.getHealthCheckData();

      // ECS metadata might be null in non-ECS environments
      if (healthData.ecs) {
        assertExists(healthData.ecs.service);
        assertExists(healthData.ecs.cluster);
      }
    });
  });

  describe("Business Metrics", () => {
    it("should allow updating business metrics", () => {
      const updates: Partial<BusinessMetrics> = {
        btcPriceFetchSuccessRate: 95.5,
        btcPriceFetchLatency: 250,
        apiResponseTime: 150,
      };

      cloudWatchMonitoring.updateBusinessMetrics(updates);

      const healthData = cloudWatchMonitoring.getHealthCheckData();
      assertEquals(healthData.businessMetrics.btcPriceFetchSuccessRate, 95.5);
      assertEquals(healthData.businessMetrics.btcPriceFetchLatency, 250);
      assertEquals(healthData.businessMetrics.apiResponseTime, 150);
    });

    it("should maintain existing metrics when partially updating", () => {
      // Set initial metrics
      cloudWatchMonitoring.updateBusinessMetrics({
        btcPriceFetchSuccessRate: 100,
        apiResponseTime: 200,
        errorRate: 0.5,
      });

      // Update only some metrics
      cloudWatchMonitoring.updateBusinessMetrics({
        btcPriceFetchSuccessRate: 98,
      });

      const healthData = cloudWatchMonitoring.getHealthCheckData();
      assertEquals(healthData.businessMetrics.btcPriceFetchSuccessRate, 98);
      assertEquals(healthData.businessMetrics.apiResponseTime, 200); // Should remain unchanged
      assertEquals(healthData.businessMetrics.errorRate, 0.5); // Should remain unchanged
    });
  });

  describe("Correlation IDs", () => {
    it("should generate unique correlation IDs", () => {
      const id1 = cloudWatchMonitoring.generateCorrelationId();
      const id2 = cloudWatchMonitoring.generateCorrelationId();

      assertExists(id1);
      assertExists(id2);
      assertEquals(typeof id1, "string");
      assertEquals(typeof id2, "string");

      // IDs should be different
      assertEquals(id1 === id2, false);
    });

    it("should generate correlation IDs with expected format", () => {
      const id = cloudWatchMonitoring.generateCorrelationId();

      // Should contain timestamp and counter parts separated by hyphen
      assertEquals(id.includes("-"), true);

      const parts = id.split("-");
      assertEquals(parts.length, 2);

      // Both parts should be non-empty
      assertEquals(parts[0].length > 0, true);
      assertEquals(parts[1].length > 0, true);
    });
  });

  describe("Log Events", () => {
    it("should accept and queue log events", () => {
      const initialStatus = cloudWatchMonitoring.getMonitoringStatus();
      const initialLogQueueSize = initialStatus.logQueueSize;

      cloudWatchMonitoring.addLogEvent({
        message: "Test log event",
        level: "INFO",
        source: "test",
        correlationId: "test-123",
        metadata: { testKey: "testValue" },
      });

      const updatedStatus = cloudWatchMonitoring.getMonitoringStatus();
      assertEquals(updatedStatus.logQueueSize >= initialLogQueueSize, true);
    });

    it("should handle log events without optional fields", () => {
      cloudWatchMonitoring.addLogEvent({
        message: "Simple test log",
        level: "DEBUG",
        source: "test",
      });

      // Should not throw errors
      const status = cloudWatchMonitoring.getMonitoringStatus();
      assertExists(status);
    });
  });

  describe("ECS Detection Integration", () => {
    it("should integrate with ECS detection service", async () => {
      const ecsMetadata = await ecsDetection.detectECSEnvironment();
      const monitoringStatus = cloudWatchMonitoring.getMonitoringStatus();

      assertExists(ecsMetadata);
      assertEquals(typeof ecsMetadata.isECS, "boolean");
      assertEquals(monitoringStatus.ecsDetected, ecsMetadata.isECS);
    });

    it("should provide ECS service and cluster names", () => {
      const ecsServiceName = ecsDetection.getServiceName();
      const ecsClusterName = ecsDetection.getClusterName();
      const ecsRegion = ecsDetection.getRegion();

      assertExists(ecsServiceName);
      assertExists(ecsClusterName);
      assertExists(ecsRegion);

      assertEquals(typeof ecsServiceName, "string");
      assertEquals(typeof ecsClusterName, "string");
      assertEquals(typeof ecsRegion, "string");
    });
  });

  describe("Error Handling", () => {
    it("should handle initialization gracefully in non-AWS environments", async () => {
      // This test should pass regardless of environment
      const status = cloudWatchMonitoring.getMonitoringStatus();

      // The service should be initialized even if not on ECS
      assertExists(status);
      assertEquals(typeof status.initialized, "boolean");
    });

    it("should provide default values for missing ECS metadata", () => {
      const healthData = cloudWatchMonitoring.getHealthCheckData();

      // Should not throw errors even if ECS metadata is not available
      assertExists(healthData);
      assertExists(healthData.businessMetrics);
      assertExists(healthData.memory);
    });
  });
});

describe("ECS Detection Service", () => {
  describe("Environment Detection", () => {
    it("should detect ECS environment without errors", async () => {
      const metadata = await ecsDetection.detectECSEnvironment();

      assertExists(metadata);
      assertEquals(typeof metadata.isECS, "boolean");
    });

    it("should provide consistent metadata", () => {
      const metadata1 = ecsDetection.getMetadata();
      const metadata2 = ecsDetection.getMetadata();

      // Should return the same cached metadata
      assertEquals(metadata1, metadata2);
    });

    it("should provide service information", () => {
      const serviceName = ecsDetection.getServiceName();
      const clusterName = ecsDetection.getClusterName();
      const region = ecsDetection.getRegion();

      assertEquals(typeof serviceName, "string");
      assertEquals(typeof clusterName, "string");
      assertEquals(typeof region, "string");
    });
  });

  describe("Metadata Extraction", () => {
    it("should handle missing ECS environment gracefully", async () => {
      // In non-ECS environments, should return isECS: false
      const metadata = await ecsDetection.detectECSEnvironment();

      assertExists(metadata);
      assertEquals(typeof metadata.isECS, "boolean");

      if (!metadata.isECS) {
        // In non-ECS environment, most fields should be undefined
        assertEquals(metadata.taskArn, undefined);
        assertEquals(metadata.clusterName, undefined);
        assertEquals(metadata.serviceName, undefined);
      }
    });

    it("should provide default values for service information", () => {
      const serviceName = ecsDetection.getServiceName();
      const clusterName = ecsDetection.getClusterName();
      const region = ecsDetection.getRegion();

      // Should never be empty strings
      assertEquals(serviceName.length > 0, true);
      assertEquals(clusterName.length > 0, true);
      assertEquals(region.length > 0, true);
    });
  });
});

describe("API Integration", () => {
  describe("Monitoring Endpoint Compatibility", () => {
    it("should provide data compatible with monitoring API", () => {
      const healthData = cloudWatchMonitoring.getHealthCheckData();
      const monitoringStatus = cloudWatchMonitoring.getMonitoringStatus();

      // Should have all required fields for API responses
      assertExists(healthData.status);
      assertExists(healthData.timestamp);
      assertExists(healthData.memory);
      assertExists(healthData.businessMetrics);

      assertExists(monitoringStatus.initialized);
      assertExists(monitoringStatus.ecsDetected);
      assertExists(monitoringStatus.awsEnvironment);
    });

    it("should generate correlation IDs for API responses", () => {
      const correlationId = cloudWatchMonitoring.generateCorrelationId();

      assertExists(correlationId);
      assertEquals(typeof correlationId, "string");
      assertEquals(correlationId.length > 0, true);
    });
  });
});
