#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Helper script for fixing TYPE_MISMATCH TypeScript errors
 * Usage: deno run --allow-read --allow-write --allow-run scripts/fix-type-mismatch.ts
 */

interface TypeMismatchError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

async function getTypeMismatchErrors(): Promise<TypeMismatchError[]> {
  console.log("🔍 Analyzing TYPE_MISMATCH errors...");

  try {
    // Run TypeScript check and capture output using Deno.Command
    const cmd = new Deno.Command("deno", {
      args: ["check", "--unstable-byonm", "main.ts", "dev.ts"],
      stdout: "piped",
      stderr: "piped",
    });

    const result = await cmd.output();
    const output = new TextDecoder().decode(result.stderr) +
      new TextDecoder().decode(result.stdout);

    const errors: TypeMismatchError[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      // Match TypeScript error format for type mismatch errors
      const match = line.match(/^(.+):(\d+):(\d+)\s*-\s*(TS2\d+):\s*(.+)$/);
      if (match) {
        const [, file, lineNum, column, code, message] = match;

        // Focus on TYPE_MISMATCH related error codes
        if (isTypeMismatchError(code, message)) {
          const category = categorizeError(message, file);
          const priority = assessPriority(message, file, category);

          errors.push({
            file: file.replace(Deno.cwd() + "/", ""),
            line: parseInt(lineNum),
            column: parseInt(column),
            message,
            code,
            category,
            priority,
          });
        }
      }
    }

    return errors;
  } catch (error) {
    console.error("Error running TypeScript check:", error);
    return [];
  }
}

function isTypeMismatchError(code: string, message: string): boolean {
  // Common TYPE_MISMATCH error codes
  const typeMismatchCodes = [
    "TS2322", // Type 'X' is not assignable to type 'Y'
    "TS2375", // exactOptionalPropertyTypes issues
    "TS2379", // Argument of type 'X' is not assignable to parameter of type 'Y'
    "TS2345", // Argument of type 'X' is not assignable to parameter of type 'Y'
    "TS2339", // Property 'X' does not exist on type 'Y' (sometimes type mismatch)
    "TS2724", // has no exported member (import/export mismatch)
  ];

  return typeMismatchCodes.includes(code) ||
    message.includes("is not assignable to") ||
    message.includes("exactOptionalPropertyTypes") ||
    message.includes("has no exported member");
}

function categorizeError(message: string, file: string): string {
  // Category A: exactOptionalPropertyTypes Issues
  if (message.includes("exactOptionalPropertyTypes")) {
    return "exactOptionalPropertyTypes";
  }

  // Category B: Import/Export Issues
  if (
    message.includes("has no exported member") ||
    message.includes("Did you mean")
  ) {
    return "import/export";
  }

  // Category C: Fresh Route Handler Issues
  if (
    file.includes("fresh.gen.ts") || message.includes("Handler<") ||
    message.includes("Handlers<")
  ) {
    return "fresh-handlers";
  }

  // Category D: Component Props
  if (
    file.includes("components/") || file.includes("islands/") ||
    message.includes("HTMLAttributes")
  ) {
    return "component-props";
  }

  // Category E: API Response Types
  if (
    message.includes("ResponseOptions") ||
    message.includes("ApiResponseOptions")
  ) {
    return "api-responses";
  }

  // Category F: Database/Service Types
  if (file.includes("database/") || file.includes("services/")) {
    return "database/services";
  }

  return "other";
}

function assessPriority(
  message: string,
  file: string,
  category: string,
): "LOW" | "MEDIUM" | "HIGH" {
  // HIGH RISK: Core infrastructure
  if (
    file.includes("databaseManager") || file.includes("Redis") ||
    message.includes("Redis") || message.includes("connect")
  ) {
    return "HIGH";
  }

  // LOW RISK: Simple fixes
  if (
    category === "import/export" ||
    message.includes("Did you mean") ||
    message.includes("has no exported member")
  ) {
    return "LOW";
  }

  // LOW RISK: exactOptionalPropertyTypes (usually safe with type assertions)
  if (category === "exactOptionalPropertyTypes") {
    return "LOW";
  }

  // MEDIUM RISK: Everything else
  return "MEDIUM";
}

function groupErrorsByCategory(
  errors: TypeMismatchError[],
): Map<string, TypeMismatchError[]> {
  const grouped = new Map<string, TypeMismatchError[]>();

  for (const error of errors) {
    if (!grouped.has(error.category)) {
      grouped.set(error.category, []);
    }
    grouped.get(error.category)!.push(error);
  }

  return grouped;
}

async function main() {
  console.log("🎯 TYPE_MISMATCH Error Analysis (Phase 2)");
  console.log("==========================================");

  const errors = await getTypeMismatchErrors();

  if (errors.length === 0) {
    console.log("🎉 No TYPE_MISMATCH errors found!");
    return;
  }

  console.log(`📊 Found ${errors.length} TYPE_MISMATCH errors`);

  const groupedByCategory = groupErrorsByCategory(errors);
  const sortedCategories = Array.from(groupedByCategory.entries())
    .sort(([, a], [, b]) => b.length - a.length);

  console.log("\n📁 Errors by Category (sorted by count):");
  console.log("=========================================");

  for (const [category, categoryErrors] of sortedCategories) {
    const lowRisk = categoryErrors.filter((e) => e.priority === "LOW").length;
    const mediumRisk = categoryErrors.filter((e) =>
      e.priority === "MEDIUM"
    ).length;
    const highRisk = categoryErrors.filter((e) => e.priority === "HIGH").length;

    console.log(
      `\n${category.toUpperCase()} (${categoryErrors.length} errors):`,
    );
    console.log(
      `  🟢 Low Risk: ${lowRisk} | 🟡 Medium Risk: ${mediumRisk} | 🔴 High Risk: ${highRisk}`,
    );

    // Show first few examples
    for (let i = 0; i < Math.min(3, categoryErrors.length); i++) {
      const error = categoryErrors[i];
      console.log(
        `  ${error.file}:${error.line} - ${error.code}: ${
          error.message.substring(0, 80)
        }...`,
      );
    }
    if (categoryErrors.length > 3) {
      console.log(`  ... and ${categoryErrors.length - 3} more`);
    }
  }

  console.log("\n🔧 Recommended Fix Order:");
  console.log("=========================");

  // Phase 2A: Low risk categories first
  const lowRiskCategories = sortedCategories.filter(([, errors]) =>
    errors.some((e) => e.priority === "LOW")
  );

  console.log("\n🟢 Phase 2A (Low Risk - Start Here):");
  for (const [category, categoryErrors] of lowRiskCategories) {
    const lowRiskCount = categoryErrors.filter((e) =>
      e.priority === "LOW"
    ).length;
    if (lowRiskCount > 0) {
      console.log(`  ${category}: ${lowRiskCount} low-risk errors`);
    }
  }

  console.log("\n🟡 Phase 2B (Medium Risk - Proceed Carefully):");
  for (const [category, categoryErrors] of sortedCategories) {
    const mediumRiskCount = categoryErrors.filter((e) =>
      e.priority === "MEDIUM"
    ).length;
    if (mediumRiskCount > 0) {
      console.log(`  ${category}: ${mediumRiskCount} medium-risk errors`);
    }
  }

  console.log("\n🔴 Phase 2C (High Risk - Expert Review Needed):");
  for (const [category, categoryErrors] of sortedCategories) {
    const highRiskCount = categoryErrors.filter((e) =>
      e.priority === "HIGH"
    ).length;
    if (highRiskCount > 0) {
      console.log(`  ${category}: ${highRiskCount} high-risk errors`);
    }
  }

  console.log("\n💡 Quick Fix Examples:");
  console.log("======================");

  // Show specific fix examples for each category
  const importExportErrors = groupedByCategory.get("import/export");
  if (importExportErrors && importExportErrors.length > 0) {
    const example = importExportErrors[0];
    console.log("\n🔧 Import/Export Fix Example:");
    console.log(`File: ${example.file}`);
    console.log(`Error: ${example.message}`);
    if (example.message.includes("_")) {
      console.log(`Fix: Remove underscore prefix from import name`);
    }
  }

  const exactOptionalErrors = groupedByCategory.get(
    "exactOptionalPropertyTypes",
  );
  if (exactOptionalErrors && exactOptionalErrors.length > 0) {
    console.log("\n🔧 exactOptionalPropertyTypes Fix Example:");
    console.log(`Use type assertion: prop={value as any}`);
    console.log(`Or conditional: {value && <Component prop={value} />}`);
  }

  console.log("\n💡 Quick Commands:");
  console.log("==================");
  console.log("# Check specific file:");
  if (sortedCategories.length > 0) {
    const firstError = sortedCategories[0][1][0];
    console.log(`deno check ${firstError.file}`);
  }
  console.log("\n# Check all files:");
  console.log("deno task analyze:types:v2");
  console.log("\n# Test UI components:");
  console.log("deno task dev");
  console.log("\n# Check linting:");
  console.log("deno task check:lint");

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalErrors: errors.length,
    categories: Object.fromEntries(groupedByCategory),
    prioritySummary: {
      low: errors.filter((e) => e.priority === "LOW").length,
      medium: errors.filter((e) => e.priority === "MEDIUM").length,
      high: errors.filter((e) => e.priority === "HIGH").length,
    },
    recommendedOrder: sortedCategories.map(([category, errors]) => ({
      category,
      count: errors.length,
      priority: errors.map((e) => e.priority),
    })),
  };

  await Deno.writeTextFile(
    "reports/type-mismatch-errors.json",
    JSON.stringify(report, null, 2),
  );

  console.log(
    "\n📄 Detailed report saved to: reports/type-mismatch-errors.json",
  );
  console.log(
    "\n🎸 Ready for Phase 2! Start with low-risk categories for best results.",
  );
}

if (import.meta.main) {
  main().catch(console.error);
}
