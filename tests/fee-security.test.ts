import { assert, assertEquals, assertExists } from "@std/assert";
import { FeeSecurityService } from "$server/services/fee/feeSecurityService.ts";

Deno.test("Fee Security Validation Tests", async (t) => {
  // Clear events before testing
  FeeSecurityService.clearEvents();

  await t.step("Valid fee data passes validation", () => {
    const validFeeData = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now(),
      fastestFee: 15,
      halfHourFee: 10,
      hourFee: 8,
    };

    const result = FeeSecurityService.validateFeeData(validFeeData, "mempool");

    assertEquals(result.isValid, true);
    assertEquals(result.violations.length, 0);
    assertEquals(result.riskLevel, "low");
    assertEquals(result.action, "allow");
  });

  await t.step("Invalid fee structure is detected", () => {
    const invalidFeeData = null;

    const result = FeeSecurityService.validateFeeData(invalidFeeData, "test");

    assertEquals(result.isValid, false);
    assert(result.violations.includes("Invalid fee data structure"));
    assertEquals(result.riskLevel, "high");
    assertEquals(result.action, "block");
  });

  await t.step("Fee rate too low is detected", () => {
    const lowFeeData = {
      recommendedFee: 0.5, // Below minimum of 1
      source: "mempool",
      timestamp: Date.now(),
    };

    const result = FeeSecurityService.validateFeeData(lowFeeData, "mempool");

    assertEquals(result.isValid, false);
    assert(result.violations.some((v) => v.includes("Fee rate too low")));
    assertEquals(result.riskLevel, "medium");
    assertEquals(result.action, "warn");
  });

  await t.step("Fee rate too high is detected", () => {
    const highFeeData = {
      recommendedFee: 1500, // Above maximum of 1000
      source: "mempool",
      timestamp: Date.now(),
    };

    const result = FeeSecurityService.validateFeeData(highFeeData, "mempool");

    assertEquals(result.isValid, false);
    assert(result.violations.some((v) => v.includes("Fee rate too high")));
    assertEquals(result.riskLevel, "high");
    assertEquals(result.action, "block");
  });

  await t.step("Old cached data is detected", () => {
    const oldFeeData = {
      recommendedFee: 10,
      source: "cached",
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours old
    };

    const result = FeeSecurityService.validateFeeData(oldFeeData, "cached");

    assertEquals(result.isValid, false);
    assert(result.violations.some((v) => v.includes("Data too old")));
    assertEquals(result.riskLevel, "medium");
    assertEquals(result.action, "warn");
  });

  await t.step("Suspicious fee patterns are detected", () => {
    const suspiciousFeeData = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now(),
      fastestFee: 5, // Inverted: fastest < half hour
      halfHourFee: 10,
      hourFee: 15,
    };

    const result = FeeSecurityService.validateFeeData(
      suspiciousFeeData,
      "mempool",
    );

    assertEquals(result.isValid, false);
    assert(
      result.violations.some((v) =>
        v.includes("Suspicious data patterns detected")
      ),
    );
    assertEquals(result.riskLevel, "high");
    assertEquals(result.action, "block");
  });

  await t.step("Non-integer fees from mempool are detected", () => {
    const nonIntegerFeeData = {
      recommendedFee: 10.5, // Non-integer from mempool.space
      source: "mempool",
      timestamp: Date.now(),
    };

    const result = FeeSecurityService.validateFeeData(
      nonIntegerFeeData,
      "mempool",
    );

    assertEquals(result.isValid, false);
    assert(
      result.violations.some((v) =>
        v.includes("Suspicious data patterns detected")
      ),
    );
    assertEquals(result.riskLevel, "high");
    assertEquals(result.action, "block");
  });

  await t.step("Cache poisoning detection works", () => {
    const oldValue = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now(),
    };

    const newValue = {
      recommendedFee: 150, // 15x increase (suspicious)
      source: "mempool",
      timestamp: Date.now(),
    };

    const suspicious = FeeSecurityService.monitorCachePoisoning(
      "test_cache_key",
      oldValue,
      newValue,
      "test",
    );

    assertEquals(suspicious, true);
  });

  await t.step("Valid cache updates are not flagged", () => {
    const oldValue = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now() - 60000,
    };

    const newValue = {
      recommendedFee: 12, // 20% increase (normal)
      source: "mempool",
      timestamp: Date.now(),
    };

    const suspicious = FeeSecurityService.monitorCachePoisoning(
      "test_cache_key",
      oldValue,
      newValue,
      "test",
    );

    assertEquals(suspicious, false);
  });

  await t.step("Future timestamps are detected", () => {
    const oldValue = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now(),
    };

    const newValue = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now() + 120000, // 2 minutes in future
    };

    const suspicious = FeeSecurityService.monitorCachePoisoning(
      "test_cache_key",
      oldValue,
      newValue,
      "test",
    );

    assertEquals(suspicious, true);
  });

  await t.step("Valid source transitions are allowed", () => {
    const oldValue = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now(),
    };

    const newValue = {
      recommendedFee: 12,
      source: "quicknode", // Valid fallback transition
      timestamp: Date.now(),
    };

    const suspicious = FeeSecurityService.monitorCachePoisoning(
      "test_cache_key",
      oldValue,
      newValue,
      "test",
    );

    assertEquals(suspicious, false);
  });

  await t.step("Security report generation works", () => {
    // Generate some test events first
    FeeSecurityService.validateFeeData({
      recommendedFee: 2000, // High fee to trigger event
      source: "test",
      timestamp: Date.now(),
    }, "test");

    const report = FeeSecurityService.getSecurityReport();

    assertExists(report.config);
    assertExists(report.recentEvents);
    assertExists(report.summary);
    assertExists(report.violationCounts);

    assertEquals(typeof report.config.minFeeRate, "number");
    assertEquals(typeof report.config.maxFeeRate, "number");
    assert(report.recentEvents.length > 0);
    assert(report.summary.totalEvents > 0);
  });

  await t.step("Security configuration can be updated", () => {
    const originalReport = FeeSecurityService.getSecurityReport();
    const originalMinFee = originalReport.config.minFeeRate;

    FeeSecurityService.updateConfig({
      minFeeRate: 5,
    });

    const updatedReport = FeeSecurityService.getSecurityReport();
    assertEquals(updatedReport.config.minFeeRate, 5);

    // Restore original config
    FeeSecurityService.updateConfig({
      minFeeRate: originalMinFee,
    });
  });

  await t.step("Security events can be cleared", () => {
    // Ensure we have some events
    FeeSecurityService.validateFeeData({
      recommendedFee: 0, // Invalid to trigger event
      source: "test",
      timestamp: Date.now(),
    }, "test");

    let report = FeeSecurityService.getSecurityReport();
    assert(report.recentEvents.length > 0);

    FeeSecurityService.clearEvents();

    report = FeeSecurityService.getSecurityReport();
    assertEquals(report.recentEvents.length, 0);
    assertEquals(Object.keys(report.violationCounts).length, 0);
  });

  await t.step("Client info is properly logged", () => {
    const clientInfo = {
      ip: "192.168.1.1",
      userAgent: "Test Browser",
      referer: "https://example.com",
    };

    FeeSecurityService.validateFeeData(
      {
        recommendedFee: 0, // Invalid to trigger event
        source: "test",
        timestamp: Date.now(),
      },
      "test",
      clientInfo,
    );

    const report = FeeSecurityService.getSecurityReport();
    const lastEvent = report.recentEvents[report.recentEvents.length - 1];

    assertExists(lastEvent.clientInfo);
    assertEquals(lastEvent.clientInfo.ip, "192.168.1.1");
    assertEquals(lastEvent.clientInfo.userAgent, "Test Browser");
    assertEquals(lastEvent.clientInfo.referer, "https://example.com");
  });

  console.log("Fee security validation tests completed successfully");
});
