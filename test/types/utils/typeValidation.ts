/**
 * Runtime type validation utilities for type testing
 *
 * These utilities help validate type compilation and module resolution
 * at runtime using Deno's capabilities.
 */

import { assertEquals, assertRejects } from "@std/testing/asserts.ts";

/**
 * Validates that a TypeScript declaration file compiles without errors
 */
export async function validateTypeCompilation(filePath: string): Promise<void> {
  const command = new Deno.Command("deno", {
    args: ["check", "--no-emit", filePath],
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
    args: ["check", "--no-emit", ...filePaths],
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
    throw new Error(`Failed to import module ${modulePath}: ${error.message}`);
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
