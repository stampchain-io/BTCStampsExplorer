#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * Dependency Graph Analysis Script
 * 
 * This is a convenience wrapper that runs the DependencyGraphAnalyzer
 * from its new location in lib/utils/validation
 */

import { DependencyGraphAnalyzer } from "$lib/utils/validation/DependencyGraphAnalyzer.ts";

// Run the analyzer with the same CLI interface
if (import.meta.main) {
  const args = Deno.args;
  const projectRoot = Deno.cwd();
  const format = args.find((arg) =>
    arg.startsWith("--format=")
  )?.split("=")[1] as "mermaid" | "dot" | "json" || "mermaid";
  const checkClientServer = args.includes("--check-client-server");

  const analyzer = new DependencyGraphAnalyzer(projectRoot);

  try {
    const graph = await analyzer.analyzeDependencies();
    
    analyzer.printReport();

    // Generate visualization
    const visualization = await analyzer.generateVisualization(format);
    
    // Save reports
    const { join } = await import("@std/path");
    const reportsDir = join(projectRoot, "reports");
    await Deno.mkdir(reportsDir, { recursive: true });

    // Save visualization
    const visualizationPath = join(
      reportsDir,
      `dependency-graph.${
        format === "json" ? "json" : format === "dot" ? "dot" : "mmd"
      }`,
    );
    await Deno.writeTextFile(visualizationPath, visualization);
    console.log(`\n📄 Visualization saved: ${visualizationPath}`);

    // Save detailed JSON report
    const jsonReport = await analyzer.generateVisualization("json");
    const reportPath = join(reportsDir, "dependency-analysis.json");
    await Deno.writeTextFile(reportPath, jsonReport);
    console.log(`📄 Detailed report saved: ${reportPath}`);

    // Exit with error code if critical issues found
    const hasIssues = graph.healthReport.criticalIssues.length > 0;
    Deno.exit(hasIssues ? 1 : 0);
  } catch (error) {
    console.error("💥 Dependency analysis failed:", error.message);
    Deno.exit(1);
  }
}