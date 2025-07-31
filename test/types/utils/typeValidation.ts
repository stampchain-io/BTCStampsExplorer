/**
 * Runtime type validation utilities for type testing
 *
 * These utilities help validate type compilation and module resolution
 * at runtime using Deno's capabilities.
 *
 * Enhanced with Bitcoin-specific validation utilities and dependency analysis.
 */

import { assertEquals } from "@std/assert";

/**
 * Validates that a TypeScript declaration file compiles without errors
 */
export async function validateTypeCompilation(filePath: string): Promise<void> {
  const command = new Deno.Command("deno", {
    args: ["check", filePath],
    stderr: "piped",
  });

  const { code, stderr } = await command.output();
  const errorOutput = new TextDecoder().decode(stderr);

  assertEquals(
    code,
    0,
    `Type compilation failed for ${filePath}: ${errorOutput}`,
  );
}

/**
 * Validates that multiple TypeScript files compile together without conflicts
 */
export async function validateTypeCompatibility(
  filePaths: string[],
): Promise<void> {
  const command = new Deno.Command("deno", {
    args: ["check", ...filePaths],
    stderr: "piped",
  });

  const { code, stderr } = await command.output();
  const errorOutput = new TextDecoder().decode(stderr);

  assertEquals(code, 0, `Type compatibility check failed: ${errorOutput}`);
}

/**
 * Validates that a module can be imported without errors
 */
export async function validateModuleImport(modulePath: string): Promise<void> {
  try {
    await import(modulePath);
  } catch (error) {
    throw new Error(
      `Failed to import module ${modulePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Helper to create a temporary TypeScript file for testing
 */
export async function withTempTypeFile(
  content: string,
  testFn: (filePath: string) => Promise<void>,
): Promise<void> {
  const tempFile = await Deno.makeTempFile({ suffix: ".d.ts" });

  try {
    await Deno.writeTextFile(tempFile, content);
    await testFn(tempFile);
  } finally {
    await Deno.remove(tempFile);
  }
}

/**
 * Validates that a type definition follows expected patterns
 */
export function validateTypeStructure(
  typeContent: string,
  patterns: RegExp[],
): void {
  for (const pattern of patterns) {
    if (!pattern.test(typeContent)) {
      throw new Error(
        `Type definition does not match expected pattern: ${pattern}`,
      );
    }
  }
}

// ============================================================================
// ENHANCED TYPE VALIDATION UTILITIES
// ============================================================================

/**
 * Interface for dependency analysis results
 */
export interface DependencyAnalysisResult {
  /** Map of file to its dependencies */
  dependencies: Map<string, string[]>;
  /** Circular dependencies found */
  circularDependencies: string[][];
  /** Missing dependencies */
  missingDependencies: string[];
  /** Unused dependencies */
  unusedDependencies: string[];
}

/**
 * Analyzes type dependencies and detects circular references
 */
export async function analyzeDependencies(
  rootPath: string,
  typeFiles: string[],
): Promise<DependencyAnalysisResult> {
  const dependencies = new Map<string, string[]>();
  const circularDependencies: string[][] = [];
  const missingDependencies: string[] = [];
  const unusedDependencies: string[] = [];

  // Parse import statements from each file
  for (const filePath of typeFiles) {
    try {
      const content = await Deno.readTextFile(filePath);
      const imports = extractImportStatements(content);
      const resolvedImports = await resolveImports(imports, filePath, rootPath);
      dependencies.set(filePath, resolvedImports.valid);
      missingDependencies.push(...resolvedImports.missing);
    } catch (error) {
      missingDependencies.push(filePath);
    }
  }

  // Detect circular dependencies using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycles(node: string, path: string[]): void {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      circularDependencies.push([...path.slice(cycleStart), node]);
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);

    const nodeDeps = dependencies.get(node) || [];
    for (const dep of nodeDeps) {
      detectCycles(dep, [...path, node]);
    }

    recursionStack.delete(node);
  }

  for (const file of typeFiles) {
    if (!visited.has(file)) {
      detectCycles(file, []);
    }
  }

  return {
    dependencies,
    circularDependencies,
    missingDependencies,
    unusedDependencies,
  };
}

/**
 * Extracts import statements from TypeScript content
 */
function extractImportStatements(content: string): string[] {
  const importRegex = /^\s*import\s+.*?from\s+["']([^"']+)["']/gm;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Resolves import paths to actual file paths
 */
async function resolveImports(
  imports: string[],
  currentFile: string,
  rootPath: string,
): Promise<{ valid: string[]; missing: string[] }> {
  const valid: string[] = [];
  const missing: string[] = [];

  for (const importPath of imports) {
    try {
      // Handle relative imports
      let resolvedPath = importPath;
      if (importPath.startsWith("./") || importPath.startsWith("../")) {
        const currentDir = currentFile.substring(
          0,
          currentFile.lastIndexOf("/"),
        );
        resolvedPath = new URL(importPath, `file://${currentDir}/`).pathname;
      } else if (importPath.startsWith("@/")) {
        // Handle @ alias imports
        resolvedPath = importPath.replace("@/", rootPath + "/");
      } else if (importPath.startsWith("$types/")) {
        // Handle $types alias imports
        resolvedPath = importPath.replace("$types/", rootPath + "/lib/types/");
      }

      // Add .d.ts if not present
      if (!resolvedPath.endsWith(".d.ts") && !resolvedPath.endsWith(".ts")) {
        resolvedPath += ".d.ts";
      }

      // Check if file exists
      await Deno.stat(resolvedPath);
      valid.push(resolvedPath);
    } catch {
      missing.push(importPath);
    }
  }

  return { valid, missing };
}

/**
 * Validates cross-module type compatibility
 */
export async function validateCrossModuleCompatibility(
  moduleA: string,
  moduleB: string,
  sharedTypes: string[],
): Promise<void> {
  const tempTestFile = await Deno.makeTempFile({ suffix: ".ts" });

  try {
    const testContent = `
      import * as _ModuleA from "${moduleA}";
      import * as _ModuleB from "${moduleB}";
      
      ${
      sharedTypes.map((type) => `
        // Test ${type} compatibility
        type TestA = _ModuleA.${type};
        type TestB = _ModuleB.${type};
        type CompatibilityTest = TestA extends TestB ? (TestB extends TestA ? true : false) : false;
        const _test${type}: CompatibilityTest = true;
        void _test${type}; // Use the variable to prevent unused warning
      `).join("")
    }
    `;

    await Deno.writeTextFile(tempTestFile, testContent);
    await validateTypeCompilation(tempTestFile);
  } finally {
    await Deno.remove(tempTestFile);
  }
}

/**
 * Validates type export/import relationships
 */
export async function validateTypeExports(
  filePath: string,
  expectedExports: string[],
): Promise<void> {
  const content = await Deno.readTextFile(filePath);

  for (const expectedExport of expectedExports) {
    const exportRegex = new RegExp(
      `export\\s+(?:interface|type|enum|class)\\s+${expectedExport}\\b`,
    );
    const reExportRegex = new RegExp(
      `export\\s+\\{[^}]*\\b${expectedExport}\\b[^}]*\\}`,
    );
    const starExportRegex = /export\s+\*\s+from/;

    if (
      !exportRegex.test(content) && !reExportRegex.test(content) &&
      !starExportRegex.test(content)
    ) {
      throw new Error(
        `Expected export '${expectedExport}' not found in ${filePath}`,
      );
    }
  }
}

/**
 * Performance-focused type checking with timeout
 */
export async function validateTypeCompilationWithTimeout(
  filePath: string,
  timeoutMs: number = 30000,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const command = new Deno.Command("deno", {
      args: ["check", filePath],
      stderr: "piped",
      signal: controller.signal,
    });

    const { code, stderr } = await command.output();
    const errorOutput = new TextDecoder().decode(stderr);

    assertEquals(
      code,
      0,
      `Type compilation failed for ${filePath} (within ${timeoutMs}ms): ${errorOutput}`,
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Type compilation timed out after ${timeoutMs}ms for ${filePath}`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Enhanced error context with fix suggestions
 */
export class TypeValidationError extends Error {
  constructor(
    message: string,
    public readonly file: string,
    public readonly suggestions: string[] = [],
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = "TypeValidationError";
  }

  override toString(): string {
    let result = `${this.name}: ${this.message}\n  File: ${this.file}`;
    if (this.errorCode) {
      result += `\n  Code: ${this.errorCode}`;
    }
    if (this.suggestions.length > 0) {
      result += `\n  Suggestions:\n${
        this.suggestions.map((s) => `    - ${s}`).join("\n")
      }`;
    }
    return result;
  }
}

/**
 * Validates type compilation with enhanced error reporting
 */
export async function validateTypeCompilationWithSuggestions(
  filePath: string,
): Promise<void> {
  const command = new Deno.Command("deno", {
    args: ["check", filePath],
    stderr: "piped",
  });

  const { code, stderr } = await command.output();
  const errorOutput = new TextDecoder().decode(stderr);

  if (code !== 0) {
    const suggestions = generateFixSuggestions(errorOutput, filePath);
    throw new TypeValidationError(
      `Type compilation failed for ${filePath}`,
      filePath,
      suggestions,
      extractErrorCode(errorOutput),
    );
  }
}

/**
 * Generates fix suggestions based on common TypeScript errors
 */
function generateFixSuggestions(
  errorOutput: string,
  _filePath: string,
): string[] {
  const suggestions: string[] = [];

  if (errorOutput.includes("TS2307")) {
    suggestions.push("Check if the imported module path is correct");
    suggestions.push("Verify the module exports the expected types");
    suggestions.push("Consider using relative paths instead of aliases");
  }

  if (errorOutput.includes("TS2308")) {
    suggestions.push("Remove duplicate exports or use explicit re-exports");
    suggestions.push("Consider using namespace imports to avoid conflicts");
  }

  if (errorOutput.includes("TS2304")) {
    suggestions.push("Import the missing type or interface");
    suggestions.push("Check if the type name is spelled correctly");
  }

  if (errorOutput.includes("TS1183")) {
    suggestions.push("Remove function implementations from .d.ts files");
    suggestions.push(
      "Use 'declare function' instead of function implementations",
    );
  }

  if (errorOutput.includes("TS1254")) {
    suggestions.push("Use 'declare const' for ambient const declarations");
    suggestions.push("Move const initializers to a .ts file instead of .d.ts");
  }

  if (suggestions.length === 0) {
    suggestions.push("Review the TypeScript error messages above");
    suggestions.push(
      "Check the official TypeScript documentation for error codes",
    );
  }

  return suggestions;
}

/**
 * Extracts error code from TypeScript error output
 */
function extractErrorCode(errorOutput: string): string | undefined {
  const match = errorOutput.match(/TS(\d+)/);
  return match ? `TS${match[1]}` : undefined;
}

/**
 * Validates module resolution for type files
 */
export async function validateModuleResolution(
  _filePath: string,
  expectedResolutions: Record<string, string>,
): Promise<void> {
  // First, check if all expected files exist
  for (const [alias, path] of Object.entries(expectedResolutions)) {
    try {
      await Deno.stat(path);
    } catch {
      throw new Error(
        `Expected module file not found: ${path} (alias: ${alias})`,
      );
    }
  }

  const tempTestFile = await Deno.makeTempFile({ suffix: ".ts" });

  try {
    const imports = Object.entries(expectedResolutions)
      .map(([alias, expected]) =>
        `import * as _${
          alias.replace(/[^a-zA-Z0-9]/g, "_")
        } from "${expected}"; void _${alias.replace(/[^a-zA-Z0-9]/g, "_")};`
      )
      .join("\n");

    await Deno.writeTextFile(tempTestFile, imports);
    await validateTypeCompilation(tempTestFile);
  } finally {
    await Deno.remove(tempTestFile);
  }
}

/**
 * Type definition completeness checker
 */
export interface TypeCompletenessResult {
  /** Missing required properties */
  missingProperties: string[];
  /** Missing required methods */
  missingMethods: string[];
  /** Optional properties that could be required */
  optionalProperties: string[];
  /** Overall completeness score (0-100) */
  completenessScore: number;
}

/**
 * Checks completeness of type definitions against a reference
 */
export function checkTypeCompleteness(
  typeContent: string,
  requiredProperties: string[],
  requiredMethods: string[],
): TypeCompletenessResult {
  const missingProperties: string[] = [];
  const missingMethods: string[] = [];
  const optionalProperties: string[] = [];

  // Check for required properties
  for (const prop of requiredProperties) {
    const propertyRegex = new RegExp(`\\b${prop}\\s*[?]?\\s*:`, "m");
    const optionalRegex = new RegExp(`\\b${prop}\\s*\\?\\s*:`, "m");

    if (!propertyRegex.test(typeContent)) {
      missingProperties.push(prop);
    } else if (optionalRegex.test(typeContent)) {
      optionalProperties.push(prop);
    }
  }

  // Check for required methods
  for (const method of requiredMethods) {
    const methodRegex = new RegExp(`\\b${method}\\s*\\([^)]*\\)\\s*:`, "m");
    if (!methodRegex.test(typeContent)) {
      missingMethods.push(method);
    }
  }

  const totalRequired = requiredProperties.length + requiredMethods.length;
  const totalMissing = missingProperties.length + missingMethods.length;
  const completenessScore = Math.round(
    ((totalRequired - totalMissing) / totalRequired) * 100,
  );

  return {
    missingProperties,
    missingMethods,
    optionalProperties,
    completenessScore,
  };
}

/**
 * Performance benchmarking for type checking operations
 */
export interface TypeCheckPerformanceResult {
  /** Time taken for type checking in milliseconds */
  checkTime: number;
  /** File size in bytes */
  fileSize: number;
  /** Lines of code */
  linesOfCode: number;
  /** Performance score (lines per second) */
  performanceScore: number;
}

/**
 * Benchmarks type checking performance
 */
export async function benchmarkTypeChecking(
  filePath: string,
): Promise<TypeCheckPerformanceResult> {
  const startTime = performance.now();

  // Run type checking
  await validateTypeCompilation(filePath);

  const endTime = performance.now();
  const checkTime = endTime - startTime;

  // Get file metrics
  const stat = await Deno.stat(filePath);
  const content = await Deno.readTextFile(filePath);
  const linesOfCode = content.split("\n").length;

  const performanceScore = Math.round((linesOfCode / checkTime) * 1000); // lines per second

  return {
    checkTime,
    fileSize: stat.size,
    linesOfCode,
    performanceScore,
  };
}
