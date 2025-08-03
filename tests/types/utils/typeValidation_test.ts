/**
 * Tests for enhanced type validation utilities
 */

import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";

import {
  analyzeDependencies,
  benchmarkTypeChecking,
  checkTypeCompleteness,
  TypeValidationError,
  validateCrossModuleCompatibility,
  validateModuleResolution,
  validateTypeCompilationWithSuggestions,
  validateTypeCompilationWithTimeout,
  validateTypeExports,
  validateTypeStructure,
  withTempTypeFile,
} from "./typeValidation.ts";

Deno.test("Type Validation - validateTypeStructure", () => {
  const typeContent = `
    export interface TestInterface {
      id: number;
      name: string;
    }
  `;

  const patterns = [
    /export\s+interface\s+\w+/,
    /id:\s*number/,
    /name:\s*string/,
  ];

  // Should pass with matching patterns
  validateTypeStructure(typeContent, patterns);

  // Should fail with non-matching pattern
  const invalidPatterns = [/nonexistent:\s*boolean/];
  try {
    validateTypeStructure(typeContent, invalidPatterns);
    throw new Error("Should have thrown");
  } catch (error) {
    assertStringIncludes(
      (error as Error).message,
      "does not match expected pattern",
    );
  }
});

Deno.test("Type Validation - withTempTypeFile", async () => {
  const content = `
    export interface TempInterface {
      test: string;
    }
  `;

  let capturedPath = "";
  await withTempTypeFile(content, async (filePath) => {
    capturedPath = filePath;

    // File should exist and contain our content
    const fileContent = await Deno.readTextFile(filePath);
    assertStringIncludes(fileContent, "TempInterface");
    assertStringIncludes(fileContent, "test: string");
  });

  // File should be cleaned up
  await assertRejects(() => Deno.stat(capturedPath));
});

Deno.test("Type Validation - validateTypeExports", async () => {
  const typeContent = `
    export interface ExportedInterface {
      prop: string;
    }
    
    export type ExportedType = string;
    
    export enum ExportedEnum {
      VALUE = "value"
    }
  `;

  await withTempTypeFile(typeContent, async (filePath) => {
    // Should pass for existing exports
    await validateTypeExports(filePath, [
      "ExportedInterface",
      "ExportedType",
      "ExportedEnum",
    ]);

    // Should fail for non-existent export
    await assertRejects(
      () => validateTypeExports(filePath, ["NonExistentType"]),
      Error,
      "Expected export 'NonExistentType' not found",
    );
  });
});

Deno.test("Type Validation - validateTypeCompilationWithTimeout", async () => {
  const validContent = `
    export interface ValidInterface {
      prop: string;
    }
  `;

  await withTempTypeFile(validContent, async (filePath) => {
    // Should pass with valid content within timeout
    await validateTypeCompilationWithTimeout(filePath, 5000);
  });

  const invalidContent = `
    export interface InvalidInterface {
      prop: NonExistentType;
    }
  `;

  await withTempTypeFile(invalidContent, async (filePath) => {
    // Should fail with invalid content
    await assertRejects(
      () => validateTypeCompilationWithTimeout(filePath, 5000),
      Error,
      "Type compilation failed",
    );
  });
});

Deno.test("Type Validation - TypeValidationError", () => {
  const error = new TypeValidationError(
    "Test error message",
    "/path/to/file.d.ts",
    ["Suggestion 1", "Suggestion 2"],
    "TS2304",
  );

  assertEquals(error.name, "TypeValidationError");
  assertEquals(error.file, "/path/to/file.d.ts");
  assertEquals(error.suggestions.length, 2);
  assertEquals(error.errorCode, "TS2304");

  const errorString = error.toString();
  assertStringIncludes(errorString, "Test error message");
  assertStringIncludes(errorString, "/path/to/file.d.ts");
  assertStringIncludes(errorString, "Suggestion 1");
  assertStringIncludes(errorString, "TS2304");
});

Deno.test("Type Validation - validateTypeCompilationWithSuggestions", async () => {
  const invalidContent = `
    export interface TestInterface {
      prop: NonExistentType;
    }
  `;

  await withTempTypeFile(invalidContent, async (filePath) => {
    try {
      await validateTypeCompilationWithSuggestions(filePath);
      throw new Error("Should have thrown TypeValidationError");
    } catch (error) {
      assertEquals(error instanceof TypeValidationError, true);
      if (error instanceof TypeValidationError) {
        assertStringIncludes(error.message, "Type compilation failed");
        assertEquals(error.suggestions.length > 0, true);
      }
    }
  });
});

Deno.test("Type Validation - checkTypeCompleteness", () => {
  const typeContent = `
    export interface TestInterface {
      requiredProp: string;
      optionalProp?: number;
      requiredMethod(): void;
    }
  `;

  const result = checkTypeCompleteness(
    typeContent,
    ["requiredProp", "optionalProp", "missingProp"],
    ["requiredMethod", "missingMethod"],
  );

  assertEquals(result.missingProperties, ["missingProp"]);
  assertEquals(result.missingMethods, ["missingMethod"]);
  assertEquals(result.optionalProperties, ["optionalProp"]);
  assertEquals(result.completenessScore, 60); // 3 out of 5 requirements met
});

Deno.test("Type Validation - benchmarkTypeChecking", async () => {
  const typeContent = `
    export interface BenchmarkInterface {
      prop1: string;
      prop2: number;
      prop3: boolean;
    }
  `;

  await withTempTypeFile(typeContent, async (filePath) => {
    const result = await benchmarkTypeChecking(filePath);

    assertEquals(typeof result.checkTime, "number");
    assertEquals(result.checkTime > 0, true);
    assertEquals(typeof result.fileSize, "number");
    assertEquals(result.fileSize > 0, true);
    assertEquals(typeof result.linesOfCode, "number");
    assertEquals(result.linesOfCode > 0, true);
    assertEquals(typeof result.performanceScore, "number");
    assertEquals(result.performanceScore > 0, true);
  });
});

Deno.test("Type Validation - analyzeDependencies", async () => {
  // Create temporary test files with dependencies
  const fileA = await Deno.makeTempFile({ suffix: ".d.ts" });
  const fileB = await Deno.makeTempFile({ suffix: ".d.ts" });

  try {
    await Deno.writeTextFile(
      fileA,
      `
      import type { TypeB } from "${fileB}";
      export interface TypeA {
        prop: TypeB;
      }
    `,
    );

    await Deno.writeTextFile(
      fileB,
      `
      export interface TypeB {
        prop: string;
      }
    `,
    );

    const result = await analyzeDependencies("/tmp", [fileA, fileB]);

    assertEquals(result.dependencies.size, 2);
    assertEquals(result.dependencies.get(fileA)?.includes(fileB), true);
    assertEquals(result.circularDependencies.length, 0);
  } finally {
    await Deno.remove(fileA);
    await Deno.remove(fileB);
  }
});

Deno.test("Type Validation - validateModuleResolution", async () => {
  const validContent = `
    export interface TestInterface {
      prop: string;
    }
  `;

  await withTempTypeFile(validContent, async (filePath) => {
    // Should pass with valid module resolution
    await validateModuleResolution(filePath, {
      "testModule": filePath,
    });
  });

  // Should fail with invalid module path
  await assertRejects(
    () =>
      validateModuleResolution("/nonexistent.d.ts", {
        "invalid":
          "/absolutely/nonexistent/path/that/definitely/does/not/exist.d.ts",
      }),
    Error,
  );
});

Deno.test("Type Validation - validateCrossModuleCompatibility", async () => {
  const moduleAContent = `
    export interface SharedType {
      prop: string;
    }
  `;

  const moduleBContent = `
    export interface SharedType {
      prop: string;
    }
  `;

  const moduleA = await Deno.makeTempFile({ suffix: ".d.ts" });
  const moduleB = await Deno.makeTempFile({ suffix: ".d.ts" });

  try {
    await Deno.writeTextFile(moduleA, moduleAContent);
    await Deno.writeTextFile(moduleB, moduleBContent);

    // Should pass with compatible types
    await validateCrossModuleCompatibility(
      moduleA,
      moduleB,
      ["SharedType"],
    );
  } finally {
    await Deno.remove(moduleA);
    await Deno.remove(moduleB);
  }
});
