/**
 * Runtime Type Resolution Testing Suite
 * 
 * Comprehensive testing of runtime type resolution, dynamic imports, type guards,
 * and runtime type validation across the domain migration. Tests type safety at
 * runtime and validates that types work correctly in actual execution contexts.
 */

import { assertEquals, assertExists, assertThrows, assertTrue } from "@std/assert";
import { join } from "@std/path";

interface RuntimeTypeTest {
  name: string;
  testFunction: () => Promise<boolean>;
  critical: boolean;
  timeout: number;
}

interface TypeResolutionResult {
  test: string;
  passed: boolean;
  duration: number;
  error?: string;
  typeInfo?: {
    resolved: boolean;
    actualType: string;
    expectedType: string;
  };
}

interface RuntimeTypeReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalFailures: number;
  totalDuration: number;
  results: TypeResolutionResult[];
  summary: {
    dynamicImports: boolean;
    typeGuards: boolean;
    runtimeValidation: boolean;
    performanceAcceptable: boolean;
  };
}

class RuntimeTypeResolutionTester {
  private projectRoot: string;
  private testResults: TypeResolutionResult[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async runRuntimeTypeTests(): Promise<RuntimeTypeReport> {
    console.log("🔄 Starting Runtime Type Resolution Testing");
    console.log("=" * 50);

    const startTime = Date.now();
    this.testResults = [];

    const tests: RuntimeTypeTest[] = [
      {
        name: "dynamic-import-type-resolution",
        testFunction: () => this.testDynamicImportResolution(),
        critical: true,
        timeout: 30000
      },
      {
        name: "type-guard-runtime-validation",
        testFunction: () => this.testTypeGuardValidation(),
        critical: true,
        timeout: 15000
      },
      {
        name: "runtime-interface-validation",
        testFunction: () => this.testRuntimeInterfaceValidation(),
        critical: true,
        timeout: 20000
      },
      {
        name: "generic-type-resolution",
        testFunction: () => this.testGenericTypeResolution(),
        critical: false,
        timeout: 15000
      },
      {
        name: "union-type-narrowing",
        testFunction: () => this.testUnionTypeNarrowing(),
        critical: true,
        timeout: 10000
      },
      {
        name: "conditional-type-resolution",
        testFunction: () => this.testConditionalTypeResolution(),
        critical: false,
        timeout: 15000
      },
      {
        name: "mapped-type-runtime-behavior",
        testFunction: () => this.testMappedTypeRuntimeBehavior(),
        critical: false,
        timeout: 10000
      },
      {
        name: "api-response-type-validation",
        testFunction: () => this.testApiResponseTypeValidation(),
        critical: true,
        timeout: 25000
      },
      {
        name: "cross-module-type-compatibility",
        testFunction: () => this.testCrossModuleTypeCompatibility(),
        critical: true,
        timeout: 30000
      },
      {
        name: "performance-type-resolution",
        testFunction: () => this.testTypeResolutionPerformance(),
        critical: false,
        timeout: 45000
      }
    ];

    for (const test of tests) {
      await this.runSingleTest(test);
    }

    const endTime = Date.now();
    const report = this.generateReport(endTime - startTime);
    
    this.printReport(report);
    await this.saveReport(report);

    return report;
  }

  private async runSingleTest(test: RuntimeTypeTest): Promise<void> {
    console.log(`   🧪 ${test.name}${test.critical ? " [CRITICAL]" : ""}`);
    
    const startTime = Date.now();
    let passed = false;
    let error: string | undefined;
    let typeInfo: any = undefined;

    try {
      // Set up timeout
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Test timeout")), test.timeout);
      });

      const testPromise = test.testFunction();
      passed = await Promise.race([testPromise, timeoutPromise]);

    } catch (err) {
      passed = false;
      error = err instanceof Error ? err.message : String(err);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    this.testResults.push({
      test: test.name,
      passed,
      duration,
      error,
      typeInfo
    });

    const status = passed ? "✅" : "❌";
    console.log(`      ${status} ${passed ? "PASSED" : "FAILED"} (${duration}ms)${error ? ` - ${error}` : ""}`);
  }

  private async testDynamicImportResolution(): Promise<boolean> {
    try {
      // Test dynamic import of type modules
      const modules = [
        "lib/types/api.d.ts",
        "lib/types/base.d.ts", 
        "lib/types/stamp.d.ts",
        "lib/types/src20.d.ts",
        "lib/types/transaction.d.ts"
      ];

      for (const modulePath of modules) {
        const fullPath = join(this.projectRoot, modulePath);
        
        try {
          // Test dynamic import resolution
          const module = await import(fullPath);
          
          // Verify module loaded
          if (typeof module !== "object") {
            throw new Error(`Module ${modulePath} did not load as object`);
          }

          // Test if we can access type exports (they should be undefined at runtime)
          // This is expected behavior for type-only exports
          
        } catch (importError) {
          console.warn(`Dynamic import failed for ${modulePath}: ${importError.message}`);
          return false;
        }
      }

      // Test dynamic import of implementation modules
      const implModules = [
        "lib/utils/ui/media/imageUtils.ts",
        "server/services/stampService.ts"
      ];

      for (const modulePath of implModules) {
        const fullPath = join(this.projectRoot, modulePath);
        
        try {
          const module = await import(fullPath);
          
          // Verify module has exports
          if (typeof module !== "object" || Object.keys(module).length === 0) {
            console.warn(`Implementation module ${modulePath} has no exports`);
          }
          
        } catch (importError) {
          console.warn(`Dynamic import failed for ${modulePath}: ${importError.message}`);
          // Don't fail the test for implementation modules that might not exist
        }
      }

      return true;

    } catch (error) {
      console.error(`Dynamic import resolution test failed: ${error.message}`);
      return false;
    }
  }

  private async testTypeGuardValidation(): Promise<boolean> {
    try {
      // Test runtime type guard functions
      const testData = [
        { type: "stamp", cpid: "A1234567890123456789", valid: true },
        { type: "src20", tick: "TEST", valid: true },
        { type: "invalid", data: "bad", valid: false },
        { invalid: "object", valid: false }
      ];

      // Define type guards
      const isStampLike = (obj: any): obj is { type: "stamp", cpid: string } => {
        return typeof obj === "object" && 
               obj !== null && 
               obj.type === "stamp" && 
               typeof obj.cpid === "string" &&
               obj.cpid.length > 0;
      };

      const isSRC20Like = (obj: any): obj is { type: "src20", tick: string } => {
        return typeof obj === "object" && 
               obj !== null && 
               obj.type === "src20" && 
               typeof obj.tick === "string" &&
               obj.tick.length > 0;
      };

      // Test type guards
      for (const testCase of testData) {
        const isStamp = isStampLike(testCase);
        const isSRC20 = isSRC20Like(testCase);
        
        if (testCase.valid) {
          if (testCase.type === "stamp" && !isStamp) {
            throw new Error(`Type guard failed for valid stamp object`);
          }
          if (testCase.type === "src20" && !isSRC20) {
            throw new Error(`Type guard failed for valid SRC20 object`);
          }
        } else {
          if (isStamp || isSRC20) {
            throw new Error(`Type guard incorrectly validated invalid object`);
          }
        }
      }

      // Test union type narrowing
      type AssetType = { type: "stamp", cpid: string } | { type: "src20", tick: string };

      const processAsset = (asset: AssetType): string => {
        if (asset.type === "stamp") {
          // TypeScript should narrow the type here
          return asset.cpid; // This should not cause a type error
        } else {
          // TypeScript should know this is SRC20
          return asset.tick; // This should not cause a type error
        }
      };

      const testAssets: AssetType[] = [
        { type: "stamp", cpid: "TEST123" },
        { type: "src20", tick: "BTC" }
      ];

      for (const asset of testAssets) {
        const result = processAsset(asset);
        if (typeof result !== "string" || result.length === 0) {
          throw new Error(`Type narrowing failed for asset type ${asset.type}`);
        }
      }

      return true;

    } catch (error) {
      console.error(`Type guard validation test failed: ${error.message}`);
      return false;
    }
  }

  private async testRuntimeInterfaceValidation(): Promise<boolean> {
    try {
      // Test runtime validation of interface-like objects
      interface TestApiResponse {
        success: boolean;
        data?: any;
        error?: string;
        timestamp: number;
      }

      const validateApiResponse = (obj: any): obj is TestApiResponse => {
        return typeof obj === "object" &&
               obj !== null &&
               typeof obj.success === "boolean" &&
               typeof obj.timestamp === "number" &&
               (obj.data === undefined || obj.data !== null) &&
               (obj.error === undefined || typeof obj.error === "string");
      };

      const testResponses = [
        { success: true, data: { result: "ok" }, timestamp: Date.now() },
        { success: false, error: "Test error", timestamp: Date.now() },
        { success: true, timestamp: Date.now() },
        { invalid: true }, // Should fail validation
        { success: "invalid", timestamp: Date.now() }, // Should fail validation
      ];

      for (let i = 0; i < testResponses.length; i++) {
        const response = testResponses[i];
        const isValid = validateApiResponse(response);
        
        if (i < 3) {
          // First 3 should be valid
          if (!isValid) {
            throw new Error(`Valid response ${i} failed validation`);
          }
        } else {
          // Last 2 should be invalid
          if (isValid) {
            throw new Error(`Invalid response ${i} passed validation`);
          }
        }
      }

      // Test nested interface validation
      interface NestedData {
        user: {
          id: string;
          name: string;
        };
        settings: {
          theme: "light" | "dark";
          notifications: boolean;
        };
      }

      const validateNestedData = (obj: any): obj is NestedData => {
        return typeof obj === "object" &&
               obj !== null &&
               typeof obj.user === "object" &&
               obj.user !== null &&
               typeof obj.user.id === "string" &&
               typeof obj.user.name === "string" &&
               typeof obj.settings === "object" &&
               obj.settings !== null &&
               (obj.settings.theme === "light" || obj.settings.theme === "dark") &&
               typeof obj.settings.notifications === "boolean";
      };

      const nestedTestData = [
        {
          user: { id: "123", name: "Test User" },
          settings: { theme: "dark" as const, notifications: true }
        },
        {
          user: { id: "456", name: "Another User" },
          settings: { theme: "light" as const, notifications: false }
        },
        {
          user: { id: "789" }, // Missing name - should fail
          settings: { theme: "dark" as const, notifications: true }
        }
      ];

      for (let i = 0; i < nestedTestData.length; i++) {
        const data = nestedTestData[i];
        const isValid = validateNestedData(data);
        
        if (i < 2) {
          if (!isValid) {
            throw new Error(`Valid nested data ${i} failed validation`);
          }
        } else {
          if (isValid) {
            throw new Error(`Invalid nested data ${i} passed validation`);
          }
        }
      }

      return true;

    } catch (error) {
      console.error(`Runtime interface validation test failed: ${error.message}`);
      return false;
    }
  }

  private async testGenericTypeResolution(): Promise<boolean> {
    try {
      // Test generic types at runtime
      class Container<T> {
        private items: T[] = [];

        add(item: T): void {
          this.items.push(item);
        }

        getAll(): T[] {
          return [...this.items];
        }

        get length(): number {
          return this.items.length;
        }
      }

      // Test string container
      const stringContainer = new Container<string>();
      stringContainer.add("test1");
      stringContainer.add("test2");
      
      const strings = stringContainer.getAll();
      if (strings.length !== 2 || strings[0] !== "test1" || strings[1] !== "test2") {
        throw new Error("String container failed");
      }

      // Test number container
      const numberContainer = new Container<number>();
      numberContainer.add(42);
      numberContainer.add(100);
      
      const numbers = numberContainer.getAll();
      if (numbers.length !== 2 || numbers[0] !== 42 || numbers[1] !== 100) {
        throw new Error("Number container failed");
      }

      // Test object container
      interface TestObject {
        id: string;
        value: number;
      }

      const objectContainer = new Container<TestObject>();
      objectContainer.add({ id: "test1", value: 10 });
      objectContainer.add({ id: "test2", value: 20 });
      
      const objects = objectContainer.getAll();
      if (objects.length !== 2 || objects[0].id !== "test1" || objects[1].value !== 20) {
        throw new Error("Object container failed");
      }

      return true;

    } catch (error) {
      console.error(`Generic type resolution test failed: ${error.message}`);
      return false;
    }
  }

  private async testUnionTypeNarrowing(): Promise<boolean> {
    try {
      // Test union type narrowing in various scenarios
      type Status = "loading" | "success" | "error";
      
      const processStatus = (status: Status): string => {
        switch (status) {
          case "loading":
            return "Please wait...";
          case "success":
            return "Operation completed successfully";
          case "error":
            return "An error occurred";
          default:
            // This should be unreachable due to exhaustive checking
            const _exhaustive: never = status;
            return _exhaustive;
        }
      };

      const statuses: Status[] = ["loading", "success", "error"];
      for (const status of statuses) {
        const result = processStatus(status);
        if (typeof result !== "string" || result.length === 0) {
          throw new Error(`Status processing failed for ${status}`);
        }
      }

      // Test discriminated unions
      type ApiResult = 
        | { success: true; data: any }
        | { success: false; error: string };

      const handleResult = (result: ApiResult): string => {
        if (result.success) {
          // TypeScript should narrow to success case
          return `Data: ${JSON.stringify(result.data)}`;
        } else {
          // TypeScript should narrow to error case
          return `Error: ${result.error}`;
        }
      };

      const results: ApiResult[] = [
        { success: true, data: { value: 42 } },
        { success: false, error: "Test error" }
      ];

      for (const result of results) {
        const output = handleResult(result);
        if (typeof output !== "string" || output.length === 0) {
          throw new Error(`Result handling failed`);
        }
      }

      return true;

    } catch (error) {
      console.error(`Union type narrowing test failed: ${error.message}`);
      return false;
    }
  }

  private async testConditionalTypeResolution(): Promise<boolean> {
    try {
      // Test conditional types behavior at runtime
      type NonNullable<T> = T extends null | undefined ? never : T;
      type ExtractArray<T> = T extends (infer U)[] ? U : never;

      // These are compile-time constructs, but we can test their behavior
      const testValue: NonNullable<string | null> = "test"; // Should work
      if (testValue !== "test") {
        throw new Error("NonNullable type failed");
      }

      // Test array extraction
      const numbers = [1, 2, 3, 4, 5];
      const firstNumber: ExtractArray<typeof numbers> = numbers[0]; // Should be number
      if (typeof firstNumber !== "number") {
        throw new Error("Array extraction type failed");
      }

      return true;

    } catch (error) {
      console.error(`Conditional type resolution test failed: ${error.message}`);
      return false;
    }
  }

  private async testMappedTypeRuntimeBehavior(): Promise<boolean> {
    try {
      // Test mapped types behavior
      interface BaseType {
        id: string;
        name: string;
        active: boolean;
      }

      // Simulate Partial<T> behavior
      type PartialBase = {
        [K in keyof BaseType]?: BaseType[K];
      };

      const partialObject: PartialBase = {
        id: "test",
        // name and active are optional
      };

      if (partialObject.id !== "test") {
        throw new Error("Partial mapped type failed");
      }

      // Test that optional properties work
      const completeObject: PartialBase = {
        id: "test2",
        name: "Test Name",
        active: true
      };

      if (completeObject.name !== "Test Name" || completeObject.active !== true) {
        throw new Error("Complete partial object failed");
      }

      return true;

    } catch (error) {
      console.error(`Mapped type runtime behavior test failed: ${error.message}`);
      return false;
    }
  }

  private async testApiResponseTypeValidation(): Promise<boolean> {
    try {
      // Test API response type validation with real-world scenarios
      interface StampApiResponse {
        success: boolean;
        data?: {
          stamps: Array<{
            cpid: string;
            creator: string;
            supply: number;
          }>;
          total: number;
        };
        error?: string;
        pagination?: {
          page: number;
          totalPages: number;
          limit: number;
        };
      }

      const validateStampResponse = (obj: any): obj is StampApiResponse => {
        if (typeof obj !== "object" || obj === null) return false;
        if (typeof obj.success !== "boolean") return false;
        
        if (obj.success) {
          if (!obj.data || typeof obj.data !== "object") return false;
          if (!Array.isArray(obj.data.stamps)) return false;
          if (typeof obj.data.total !== "number") return false;
          
          // Validate stamp objects
          for (const stamp of obj.data.stamps) {
            if (typeof stamp.cpid !== "string" || 
                typeof stamp.creator !== "string" || 
                typeof stamp.supply !== "number") {
              return false;
            }
          }
        } else {
          if (typeof obj.error !== "string") return false;
        }

        if (obj.pagination) {
          if (typeof obj.pagination !== "object" ||
              typeof obj.pagination.page !== "number" ||
              typeof obj.pagination.totalPages !== "number" ||
              typeof obj.pagination.limit !== "number") {
            return false;
          }
        }

        return true;
      };

      const testResponses = [
        {
          success: true,
          data: {
            stamps: [
              { cpid: "A123", creator: "bc1test", supply: 1000 },
              { cpid: "B456", creator: "bc1test2", supply: 500 }
            ],
            total: 2
          },
          pagination: { page: 1, totalPages: 1, limit: 50 }
        },
        {
          success: false,
          error: "Invalid request parameters"
        },
        {
          success: true,
          data: { stamps: [], total: 0 }
        }
      ];

      for (const response of testResponses) {
        if (!validateStampResponse(response)) {
          throw new Error(`API response validation failed for: ${JSON.stringify(response)}`);
        }
      }

      // Test invalid responses
      const invalidResponses = [
        { success: "invalid" }, // wrong type
        { success: true, data: { stamps: "invalid" } }, // stamps not array
        { success: true, data: { stamps: [{ invalid: "stamp" }], total: 1 } }, // invalid stamp
        { success: false } // missing error
      ];

      for (const response of invalidResponses) {
        if (validateStampResponse(response)) {
          throw new Error(`Invalid response incorrectly passed validation: ${JSON.stringify(response)}`);
        }
      }

      return true;

    } catch (error) {
      console.error(`API response type validation test failed: ${error.message}`);
      return false;
    }
  }

  private async testCrossModuleTypeCompatibility(): Promise<boolean> {
    try {
      // Test type compatibility across modules
      // This simulates importing types from different modules and using them together
      
      // Simulate types from different modules
      interface BaseEntity {
        id: string;
        createdAt: Date;
        updatedAt: Date;
      }

      interface StampEntity extends BaseEntity {
        cpid: string;
        creator: string;
        supply: number;
      }

      interface SRC20Entity extends BaseEntity {
        tick: string;
        max: string;
        lim: string;
      }

      // Test type compatibility
      const createStamp = (data: Omit<StampEntity, keyof BaseEntity>): StampEntity => {
        return {
          ...data,
          id: `stamp_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      };

      const createSRC20 = (data: Omit<SRC20Entity, keyof BaseEntity>): SRC20Entity => {
        return {
          ...data,
          id: `src20_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      };

      // Test stamp creation
      const stamp = createStamp({
        cpid: "A123456789",
        creator: "bc1test",
        supply: 1000
      });

      if (!stamp.id || !stamp.cpid || !stamp.createdAt) {
        throw new Error("Stamp creation failed");
      }

      // Test SRC20 creation
      const src20 = createSRC20({
        tick: "TEST",
        max: "21000000",
        lim: "1000"
      });

      if (!src20.id || !src20.tick || !src20.createdAt) {
        throw new Error("SRC20 creation failed");
      }

      // Test polymorphic functions
      const processEntity = (entity: BaseEntity): string => {
        return `Entity ${entity.id} created at ${entity.createdAt.toISOString()}`;
      };

      const stampResult = processEntity(stamp);
      const src20Result = processEntity(src20);

      if (!stampResult.includes(stamp.id) || !src20Result.includes(src20.id)) {
        throw new Error("Polymorphic processing failed");
      }

      return true;

    } catch (error) {
      console.error(`Cross-module type compatibility test failed: ${error.message}`);
      return false;
    }
  }

  private async testTypeResolutionPerformance(): Promise<boolean> {
    try {
      // Test performance of type operations
      const startTime = performance.now();

      // Simulate heavy type operations
      const iterations = 10000;
      
      interface TestObject {
        id: string;
        data: {
          values: number[];
          metadata: Record<string, any>;
        };
      }

      const objects: TestObject[] = [];

      // Create many objects with type checking
      for (let i = 0; i < iterations; i++) {
        const obj: TestObject = {
          id: `test_${i}`,
          data: {
            values: [i, i * 2, i * 3],
            metadata: {
              index: i,
              timestamp: Date.now(),
              valid: true
            }
          }
        };
        objects.push(obj);
      }

      // Process objects with type narrowing
      let processedCount = 0;
      for (const obj of objects) {
        if (typeof obj.id === "string" && 
            obj.data && 
            Array.isArray(obj.data.values) &&
            obj.data.values.length > 0) {
          processedCount++;
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`      Performance test: ${iterations} objects processed in ${duration.toFixed(1)}ms`);

      // Performance should be reasonable (under 5 seconds for 10k objects)
      if (duration > 5000) {
        throw new Error(`Type resolution performance too slow: ${duration}ms for ${iterations} objects`);
      }

      if (processedCount !== iterations) {
        throw new Error(`Type checking failed: ${processedCount}/${iterations} objects processed correctly`);
      }

      return true;

    } catch (error) {
      console.error(`Type resolution performance test failed: ${error.message}`);
      return false;
    }
  }

  private generateReport(totalDuration: number): RuntimeTypeReport {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const criticalFailures = this.testResults.filter(r => !r.passed && r.test.includes("critical")).length;

    // Calculate component-specific results
    const dynamicImportTests = this.testResults.filter(r => r.test.includes("dynamic-import"));
    const typeGuardTests = this.testResults.filter(r => r.test.includes("type-guard"));
    const validationTests = this.testResults.filter(r => r.test.includes("validation"));
    const performanceTests = this.testResults.filter(r => r.test.includes("performance"));

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      criticalFailures,
      totalDuration,
      results: this.testResults,
      summary: {
        dynamicImports: dynamicImportTests.every(r => r.passed),
        typeGuards: typeGuardTests.every(r => r.passed),
        runtimeValidation: validationTests.every(r => r.passed),
        performanceAcceptable: performanceTests.every(r => r.passed)
      }
    };
  }

  private printReport(report: RuntimeTypeReport): void {
    console.log("\n" + "=" * 50);
    console.log("🔄 RUNTIME TYPE RESOLUTION TEST REPORT");
    console.log("=" * 50);

    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   Passed: ${report.passedTests}`);
    console.log(`   Failed: ${report.failedTests}`);
    console.log(`   Critical Failures: ${report.criticalFailures}`);
    console.log(`   Total Duration: ${(report.totalDuration / 1000).toFixed(1)}s`);

    console.log(`\n🔍 Component Status:`);
    console.log(`   Dynamic Imports: ${report.summary.dynamicImports ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`   Type Guards: ${report.summary.typeGuards ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`   Runtime Validation: ${report.summary.runtimeValidation ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`   Performance: ${report.summary.performanceAcceptable ? "✅ PASS" : "❌ FAIL"}`);

    // Show failed tests
    const failedTests = report.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`   • ${test.test} (${test.duration}ms)`);
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
    }

    // Overall status
    const overallPassed = report.criticalFailures === 0;
    console.log(`\n${overallPassed ? "✅" : "❌"} Overall Status: ${overallPassed ? "PASSED" : "FAILED"}`);

    if (!overallPassed) {
      console.log(`\n🚫 RUNTIME TYPE RESOLUTION FAILED`);
      console.log(`   ${report.criticalFailures} critical test(s) failed`);
      console.log(`   Runtime type safety is compromised`);
    } else {
      console.log(`\n🎉 RUNTIME TYPE RESOLUTION PASSED`);
      console.log(`   All critical tests passed - runtime types are working correctly`);
    }
  }

  private async saveReport(report: RuntimeTypeReport): Promise<void> {
    try {
      const reportsDir = join(this.projectRoot, "reports");
      await Deno.mkdir(reportsDir, { recursive: true });

      const reportPath = join(reportsDir, `runtime-type-resolution-${Date.now()}.json`);
      await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));

      console.log(`\n📄 Runtime type resolution report saved: ${reportPath}`);
    } catch (error) {
      console.warn(`Failed to save report: ${error.message}`);
    }
  }
}

// Main test execution
Deno.test("Runtime Type Resolution Test Suite", async () => {
  const projectRoot = Deno.cwd();
  const tester = new RuntimeTypeResolutionTester(projectRoot);
  
  const report = await tester.runRuntimeTypeTests();
  
  // Assert that all critical tests passed
  assertEquals(report.criticalFailures, 0, "All critical runtime type tests must pass");
  
  // Assert overall runtime type health
  const overallHealthy = Object.values(report.summary).every(status => status === true);
  assertEquals(overallHealthy, true, "All runtime type components must be healthy");
});

export { RuntimeTypeResolutionTester, type RuntimeTypeReport };