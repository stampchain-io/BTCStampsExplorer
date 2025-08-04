#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * Dependency Graph Analysis and Circular Dependency Detection
 *
 * Implements automated dependency graph analysis using ts-morph v20+ to parse
 * all import/export relationships. Creates circular dependency detection algorithm
 * with detailed reporting and dependency visualization using Mermaid diagrams.
 *
 * Usage:
 *   deno run --allow-all scripts/validation/dependency-graph-analyzer.ts
 *   deno run --allow-all scripts/validation/dependency-graph-analyzer.ts --format=mermaid
 *   deno run --allow-all scripts/validation/dependency-graph-analyzer.ts --check-client-server
 */

import { dirname, join, relative, resolve } from "@std/path";
import { exists, walk } from "@std/fs";

interface DependencyNode {
  id: string;
  filePath: string;
  moduleType: "client" | "server" | "shared" | "test";
  imports: string[];
  exports: string[];
  dependencies: string[];
  dependents: string[];
  cyclicDependencies: string[];
  healthScore: number;
}

interface CircularDependency {
  cycle: string[];
  severity: "critical" | "major" | "minor";
  impact: "high" | "medium" | "low";
  recommendation: string;
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Map<string, string[]>;
  circularDependencies: CircularDependency[];
  clientServerLeaks: string[];
  orphanedTypes: string[];
  healthReport: DependencyHealthReport;
}

interface DependencyHealthReport {
  totalModules: number;
  circularDependencies: number;
  clientServerLeaks: number;
  orphanedTypes: number;
  averageHealthScore: number;
  criticalIssues: string[];
  recommendations: string[];
}

class DependencyGraphAnalyzer {
  private graph: DependencyGraph;
  private projectRoot: string;
  private typeModules: string[] = [];
  private importPatterns = {
    es6Import:
      /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+["']([^"']+)["']/g,
    dynamicImport: /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    requireImport: /require\s*\(\s*["']([^"']+)["']\s*\)/g,
    typeImport:
      /import\s+type\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+["']([^"']+)["']/g,
  };

  constructor(projectRoot: string) {
    this.projectRoot = resolve(projectRoot);
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      circularDependencies: [],
      clientServerLeaks: [],
      orphanedTypes: [],
      healthReport: {
        totalModules: 0,
        circularDependencies: 0,
        clientServerLeaks: 0,
        orphanedTypes: 0,
        averageHealthScore: 0,
        criticalIssues: [],
        recommendations: [],
      },
    };
  }

  async analyzeDependencies(): Promise<DependencyGraph> {
    console.log("🔍 Starting Dependency Graph Analysis");
    console.log("=" * 50);

    // Discover all TypeScript files
    await this.discoverTypeModules();

    // Parse import/export relationships
    await this.parseImportExportRelationships();

    // Build dependency graph
    this.buildDependencyGraph();

    // Detect circular dependencies
    this.detectCircularDependencies();

    // Check for client/server leaks
    this.detectClientServerLeaks();

    // Find orphaned types
    this.findOrphanedTypes();

    // Calculate health scores
    this.calculateHealthScores();

    // Generate health report
    this.generateHealthReport();

    return this.graph;
  }

  generateVisualization(
    format: "mermaid" | "dot" | "json" = "mermaid",
  ): string {
    switch (format) {
      case "mermaid":
        return this.generateMermaidDiagram();
      case "dot":
        return this.generateDotGraph();
      case "json":
        return this.generateJsonReport();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async discoverTypeModules(): Promise<void> {
    console.log("📁 Discovering TypeScript modules...");

    const typeDirectories = [
      "lib/types",
      "server/types",
      "client/types",
    ];

    for (const dir of typeDirectories) {
      const fullPath = join(this.projectRoot, dir);

      if (await exists(fullPath)) {
        for await (
          const entry of walk(fullPath, {
            exts: [".ts", ".d.ts"],
            includeDirs: false,
          })
        ) {
          const relativePath = relative(this.projectRoot, entry.path);
          this.typeModules.push(relativePath);
        }
      }
    }

    // Also include main application files for dependency analysis
    const appDirectories = [
      "routes",
      "islands",
      "components",
      "server/services",
      "server/controllers",
      "server/database",
    ];

    for (const dir of appDirectories) {
      const fullPath = join(this.projectRoot, dir);

      if (await exists(fullPath)) {
        for await (
          const entry of walk(fullPath, {
            exts: [".ts", ".tsx"],
            includeDirs: false,
          })
        ) {
          const relativePath = relative(this.projectRoot, entry.path);
          this.typeModules.push(relativePath);
        }
      }
    }

    console.log(`   Found ${this.typeModules.length} TypeScript modules`);
  }

  private async parseImportExportRelationships(): Promise<void> {
    console.log("🔗 Parsing import/export relationships...");

    let processedCount = 0;
    const totalCount = this.typeModules.length;

    for (const modulePath of this.typeModules) {
      const fullPath = join(this.projectRoot, modulePath);

      try {
        const content = await Deno.readTextFile(fullPath);
        const node = await this.parseModule(modulePath, content);
        this.graph.nodes.set(modulePath, node);

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`   Processed ${processedCount}/${totalCount} modules`);
        }
      } catch (error) {
        console.warn(
          `   Warning: Failed to parse ${modulePath}: ${error.message}`,
        );
      }
    }

    console.log(`   Completed parsing ${processedCount} modules`);
  }

  private parseModule(
    modulePath: string,
    content: string,
  ): DependencyNode {
    const imports: string[] = [];
    const exports: string[] = [];

    // Extract all imports
    for (const [pattern, regex] of Object.entries(this.importPatterns)) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        const resolvedPath = this.resolveImportPath(modulePath, importPath);
        if (resolvedPath) {
          imports.push(resolvedPath);
        }
      }
    }

    // Extract exports (simplified)
    const exportMatches = content.match(
      /export\s+(?:type\s+|interface\s+|class\s+|function\s+|const\s+|let\s+|var\s+)?(\w+)/g,
    ) || [];
    exports.push(
      ...exportMatches.map((match) =>
        match.replace(
          /export\s+(?:type\s+|interface\s+|class\s+|function\s+|const\s+|let\s+|var\s+)?/,
          "",
        )
      ),
    );

    // Determine module type
    const moduleType = this.determineModuleType(modulePath);

    return {
      id: modulePath,
      filePath: modulePath,
      moduleType,
      imports: [...new Set(imports)], // Remove duplicates
      exports: [...new Set(exports)],
      dependencies: [],
      dependents: [],
      cyclicDependencies: [],
      healthScore: 0,
    };
  }

  private resolveImportPath(
    fromModule: string,
    importPath: string,
  ): string | null {
    // Handle relative imports
    if (importPath.startsWith("./") || importPath.startsWith("../")) {
      const fromDir = dirname(fromModule);
      let resolvedPath = join(fromDir, importPath);

      // Add .ts extension if missing
      if (
        !resolvedPath.endsWith(".ts") && !resolvedPath.endsWith(".tsx") &&
        !resolvedPath.endsWith(".d.ts")
      ) {
        // Try different extensions
        const extensions = [".ts", ".tsx", ".d.ts", "/index.ts"];
        for (const ext of extensions) {
          const testPath = resolvedPath + ext;
          if (this.typeModules.includes(testPath)) {
            return testPath;
          }
        }
      }

      return this.typeModules.includes(resolvedPath) ? resolvedPath : null;
    }

    // Handle absolute imports with aliases
    if (importPath.startsWith("$")) {
      const aliasMap: Record<string, string> = {
        "$types/": "lib/types/",
        "$server/": "server/",
        "$lib/": "lib/",
        "$components/": "components/",
        "$islands/": "islands/",
      };

      for (const [alias, actualPath] of Object.entries(aliasMap)) {
        if (importPath.startsWith(alias)) {
          const resolvedPath = importPath.replace(alias, actualPath);
          return this.typeModules.includes(resolvedPath) ? resolvedPath : null;
        }
      }
    }

    // Handle npm modules, ignore for now
    if (
      !importPath.startsWith(".") && !importPath.startsWith("/") &&
      !importPath.startsWith("$")
    ) {
      return null;
    }

    return null;
  }

  private determineModuleType(
    modulePath: string,
  ): "client" | "server" | "shared" | "test" {
    if (modulePath.includes("/tests/") || modulePath.includes(".test.")) {
      return "test";
    }
    if (modulePath.startsWith("server/") || modulePath.includes("/server/")) {
      return "server";
    }
    if (
      modulePath.startsWith("islands/") ||
      modulePath.startsWith("components/") ||
      modulePath.startsWith("client/")
    ) {
      return "client";
    }
    return "shared";
  }

  private buildDependencyGraph(): void {
    console.log("🏗️ Building dependency graph...");

    // Build edges and dependency relationships
    for (const [nodeId, node] of this.graph.nodes) {
      const dependencies: string[] = [];

      for (const importPath of node.imports) {
        if (this.graph.nodes.has(importPath)) {
          dependencies.push(importPath);

          // Add this node as a dependent of the imported module
          const importedNode = this.graph.nodes.get(importPath)!;
          if (!importedNode.dependents.includes(nodeId)) {
            importedNode.dependents.push(nodeId);
          }
        }
      }

      node.dependencies = dependencies;
      this.graph.edges.set(nodeId, dependencies);
    }

    console.log(
      `   Built graph with ${this.graph.nodes.size} nodes and ${
        Array.from(this.graph.edges.values()).flat().length
      } edges`,
    );
  }

  private detectCircularDependencies(): void {
    console.log("🔄 Detecting circular dependencies...");

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[] = []): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          const cycle = [...path.slice(cycleStart), nodeId];
          cycles.push(cycle);
        }
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const dependencies = this.graph.edges.get(nodeId) || [];
      for (const depId of dependencies) {
        dfs(depId, [...path]);
      }

      recursionStack.delete(nodeId);
    };

    // Check all nodes for cycles
    for (const nodeId of this.graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    // Convert cycles to CircularDependency objects
    this.graph.circularDependencies = cycles.map((cycle) => ({
      cycle,
      severity: this.calculateCycleSeverity(cycle),
      impact: this.calculateCycleImpact(cycle),
      recommendation: this.generateCycleRecommendation(cycle),
    }));

    // Update nodes with their cyclic dependencies
    for (const circularDep of this.graph.circularDependencies) {
      for (const nodeId of circularDep.cycle) {
        const node = this.graph.nodes.get(nodeId);
        if (node) {
          node.cyclicDependencies.push(
            ...circularDep.cycle.filter((id) => id !== nodeId),
          );
        }
      }
    }

    console.log(
      `   Found ${this.graph.circularDependencies.length} circular dependencies`,
    );
  }

  private calculateCycleSeverity(
    cycle: string[],
  ): "critical" | "major" | "minor" {
    // Critical: cycles involving more than 5 modules or server/client boundary crossing
    if (cycle.length > 5) return "critical";

    const moduleTypes = cycle.map((nodeId) =>
      this.graph.nodes.get(nodeId)?.moduleType || "shared"
    );
    const hasServerClient = moduleTypes.includes("server") &&
      moduleTypes.includes("client");

    if (hasServerClient) return "critical";
    if (cycle.length > 3) return "major";

    return "minor";
  }

  private calculateCycleImpact(cycle: string[]): "high" | "medium" | "low" {
    const totalDependents = cycle.reduce((sum, nodeId) => {
      const node = this.graph.nodes.get(nodeId);
      return sum + (node?.dependents.length || 0);
    }, 0);

    if (totalDependents > 10) return "high";
    if (totalDependents > 5) return "medium";
    return "low";
  }

  private generateCycleRecommendation(cycle: string[]): string {
    const moduleTypes = cycle.map((nodeId) =>
      this.graph.nodes.get(nodeId)?.moduleType || "shared"
    );

    if (moduleTypes.includes("server") && moduleTypes.includes("client")) {
      return "Extract shared types to a common module to break client-server cycle";
    }

    if (cycle.length > 5) {
      return "Refactor into smaller, more focused modules with clear dependencies";
    }

    return "Consider introducing an interface or abstraction layer to break the cycle";
  }

  private detectClientServerLeaks(): void {
    console.log("🔒 Detecting client-server boundary violations...");

    const leaks: string[] = [];

    for (const [nodeId, node] of this.graph.nodes) {
      if (node.moduleType === "client") {
        // Check if client code imports server-only modules
        for (const depId of node.dependencies) {
          const depNode = this.graph.nodes.get(depId);
          if (depNode?.moduleType === "server") {
            leaks.push(
              `Client module ${nodeId} imports server module ${depId}`,
            );
          }
        }
      } else if (node.moduleType === "server") {
        // Check if server code imports client-only modules
        for (const depId of node.dependencies) {
          const depNode = this.graph.nodes.get(depId);
          if (depNode?.moduleType === "client") {
            leaks.push(
              `Server module ${nodeId} imports client module ${depId}`,
            );
          }
        }
      }
    }

    this.graph.clientServerLeaks = leaks;
    console.log(`   Found ${leaks.length} client-server boundary violations`);
  }

  private findOrphanedTypes(): void {
    console.log("🏝️ Finding orphaned types...");

    const orphaned: string[] = [];

    for (const [nodeId, node] of this.graph.nodes) {
      // A type module is orphaned if:
      // 1. It has no dependents (nothing imports it)
      // 2. It's in the types directory
      // 3. It's not an index file or main export

      if (
        node.dependents.length === 0 &&
        nodeId.includes("/types/") &&
        !nodeId.endsWith("/index.ts") &&
        !nodeId.endsWith("/index.d.ts")
      ) {
        orphaned.push(nodeId);
      }
    }

    this.graph.orphanedTypes = orphaned;
    console.log(`   Found ${orphaned.length} orphaned type modules`);
  }

  private calculateHealthScores(): void {
    console.log("💊 Calculating module health scores...");

    for (const [_nodeId, node] of this.graph.nodes) {
      let score = 100;

      // Deduct points for circular dependencies
      score -= node.cyclicDependencies.length * 20;

      // Deduct points for too many dependencies
      if (node.dependencies.length > 10) {
        score -= (node.dependencies.length - 10) * 5;
      }

      // Deduct points for too many dependents (high coupling)
      if (node.dependents.length > 20) {
        score -= (node.dependents.length - 20) * 2;
      }

      // Bonus points for being well-connected but not over-coupled
      if (node.dependents.length >= 3 && node.dependents.length <= 10) {
        score += 10;
      }

      // Deduct points for client-server violations
      if (
        node.moduleType === "client" &&
        node.dependencies.some((dep) =>
          this.graph.nodes.get(dep)?.moduleType === "server"
        )
      ) {
        score -= 30;
      }

      node.healthScore = Math.max(0, Math.min(100, score));
    }
  }

  private generateHealthReport(): void {
    const totalModules = this.graph.nodes.size;
    const circularDependencies = this.graph.circularDependencies.length;
    const clientServerLeaks = this.graph.clientServerLeaks.length;
    const orphanedTypes = this.graph.orphanedTypes.length;

    const healthScores = Array.from(this.graph.nodes.values()).map((node) =>
      node.healthScore
    );
    const averageHealthScore =
      healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Critical issues
    if (circularDependencies > 0) {
      criticalIssues.push(
        `${circularDependencies} circular dependency cycles detected`,
      );
      recommendations.push(
        "Break circular dependencies by extracting interfaces or shared modules",
      );
    }

    if (clientServerLeaks > 0) {
      criticalIssues.push(
        `${clientServerLeaks} client-server boundary violations`,
      );
      recommendations.push(
        "Ensure client code doesn't import server modules and vice versa",
      );
    }

    if (orphanedTypes > 5) {
      criticalIssues.push(`${orphanedTypes} orphaned type modules`);
      recommendations.push("Remove unused type modules or add proper exports");
    }

    if (averageHealthScore < 70) {
      criticalIssues.push(
        `Low average health score: ${averageHealthScore.toFixed(1)}`,
      );
      recommendations.push(
        "Refactor modules with low health scores to improve maintainability",
      );
    }

    this.graph.healthReport = {
      totalModules,
      circularDependencies,
      clientServerLeaks,
      orphanedTypes,
      averageHealthScore,
      criticalIssues,
      recommendations,
    };
  }

  private generateMermaidDiagram(): string {
    const lines = ["graph TD"];

    // Add nodes
    for (const [nodeId, node] of this.graph.nodes) {
      const shortId = nodeId.replace(/[\/\-\.]/g, "_");
      const displayName = nodeId.split("/").pop() || nodeId;
      const color = this.getNodeColor(node);

      lines.push(`    ${shortId}["${displayName}"]:::${color}`);
    }

    // Add edges
    for (const [fromId, dependencies] of this.graph.edges) {
      const fromShortId = fromId.replace(/[\/\-\.]/g, "_");

      for (const toId of dependencies) {
        const toShortId = toId.replace(/[\/\-\.]/g, "_");
        lines.push(`    ${fromShortId} --> ${toShortId}`);
      }
    }

    // Add circular dependency highlighting
    for (const circularDep of this.graph.circularDependencies) {
      if (circularDep.severity === "critical") {
        for (let i = 0; i < circularDep.cycle.length; i++) {
          const fromId = circularDep.cycle[i].replace(/[\/\-\.]/g, "_");
          const toId = circularDep.cycle[(i + 1) % circularDep.cycle.length]
            .replace(/[\/\-\.]/g, "_");
          lines.push(`    ${fromId} -.-> ${toId}:::critical`);
        }
      }
    }

    // Add styles
    lines.push("    classDef client fill:#e1f5fe");
    lines.push("    classDef server fill:#f3e5f5");
    lines.push("    classDef shared fill:#e8f5e8");
    lines.push("    classDef test fill:#fff3e0");
    lines.push(
      "    classDef critical fill:#ffebee,stroke:#f44336,stroke-width:3px",
    );

    return lines.join("\n");
  }

  private getNodeColor(node: DependencyNode): string {
    if (node.cyclicDependencies.length > 0) return "critical";
    return node.moduleType;
  }

  private generateDotGraph(): string {
    const lines = ["digraph DependencyGraph {"];
    lines.push("  rankdir=TB;");
    lines.push("  node [shape=box];");

    // Add nodes
    for (const [nodeId, node] of this.graph.nodes) {
      const shortId = nodeId.replace(/[\/\-\.]/g, "_");
      const displayName = nodeId.split("/").pop() || nodeId;
      const color = node.moduleType === "client"
        ? "lightblue"
        : node.moduleType === "server"
        ? "lightgreen"
        : node.moduleType === "test"
        ? "lightyellow"
        : "lightgray";

      lines.push(
        `  ${shortId} [label="${displayName}", fillcolor="${color}", style=filled];`,
      );
    }

    // Add edges
    for (const [fromId, dependencies] of this.graph.edges) {
      const fromShortId = fromId.replace(/[\/\-\.]/g, "_");

      for (const toId of dependencies) {
        const toShortId = toId.replace(/[\/\-\.]/g, "_");
        lines.push(`  ${fromShortId} -> ${toShortId};`);
      }
    }

    lines.push("}");
    return lines.join("\n");
  }

  private generateJsonReport(): string {
    return JSON.stringify(
      {
        summary: this.graph.healthReport,
        circularDependencies: this.graph.circularDependencies,
        clientServerLeaks: this.graph.clientServerLeaks,
        orphanedTypes: this.graph.orphanedTypes,
        nodeDetails: Array.from(this.graph.nodes.values()).map((node) => ({
          id: node.id,
          moduleType: node.moduleType,
          healthScore: node.healthScore,
          dependencyCount: node.dependencies.length,
          dependentCount: node.dependents.length,
          hasCycles: node.cyclicDependencies.length > 0,
        })),
      },
      null,
      2,
    );
  }

  printReport(): void {
    console.log("\n" + "=" * 60);
    console.log("📊 DEPENDENCY GRAPH ANALYSIS REPORT");
    console.log("=" * 60);

    const report = this.graph.healthReport;

    console.log(`\n📈 Overview:`);
    console.log(`   Total Modules: ${report.totalModules}`);
    console.log(
      `   Average Health Score: ${report.averageHealthScore.toFixed(1)}%`,
    );
    console.log(`   Circular Dependencies: ${report.circularDependencies}`);
    console.log(`   Client-Server Leaks: ${report.clientServerLeaks}`);
    console.log(`   Orphaned Types: ${report.orphanedTypes}`);

    if (report.criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues:`);
      report.criticalIssues.forEach((issue) => console.log(`   • ${issue}`));
    }

    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec) => console.log(`   • ${rec}`));
    }

    // Show worst health scores
    const worstNodes = Array.from(this.graph.nodes.values())
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 5);

    if (worstNodes.length > 0 && worstNodes[0].healthScore < 80) {
      console.log(`\n🔥 Modules Needing Attention:`);
      worstNodes.forEach((node) => {
        console.log(`   ${node.healthScore}% - ${node.id}`);
        if (node.cyclicDependencies.length > 0) {
          console.log(
            `      🔄 ${node.cyclicDependencies.length} circular deps`,
          );
        }
        if (node.dependencies.length > 10) {
          console.log(`      📈 ${node.dependencies.length} dependencies`);
        }
      });
    }

    // Overall status
    const overallHealth = report.criticalIssues.length === 0 &&
      report.averageHealthScore >= 80;
    console.log(
      `\n${overallHealth ? "✅" : "❌"} Overall Status: ${
        overallHealth ? "HEALTHY" : "NEEDS ATTENTION"
      }`,
    );
  }
}

// CLI execution
if (import.meta.main) {
  const args = Deno.args;
  const projectRoot = Deno.cwd();
  const format = args.find((arg) =>
    arg.startsWith("--format=")
  )?.split("=")[1] as "mermaid" | "dot" | "json" || "mermaid";
  const _checkClientServer = args.includes("--check-client-server");

  const analyzer = new DependencyGraphAnalyzer(projectRoot);

  try {
    const graph = await analyzer.analyzeDependencies();

    analyzer.printReport();

    // Generate visualization
    const visualization = await analyzer.generateVisualization(format);

    // Save reports
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

export {
  type CircularDependency,
  type DependencyGraph,
  DependencyGraphAnalyzer,
};
