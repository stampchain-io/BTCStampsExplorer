#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * audit-endpoint-coverage.ts
 *
 * Compares OpenAPI spec endpoints against Postman test coverage and reports gaps.
 * Ensures all API endpoints have corresponding test coverage.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/audit-endpoint-coverage.ts
 *   OR
 *   deno task audit:coverage
 */

import { parse as parseYaml } from "@std/yaml";

interface OpenAPIEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  tags?: string[];
}

interface PostmanEndpoint {
  path: string;
  method: string;
  name: string;
  folder: string;
}

interface CoverageResults {
  timestamp: string;
  summary: {
    totalEndpoints: number;
    testedEndpoints: number;
    untestedEndpoints: number;
    coveragePercentage: number;
  };
  endpoints: {
    tested: Array<OpenAPIEndpoint & { testName: string; testFolder: string }>;
    untested: OpenAPIEndpoint[];
    extra: PostmanEndpoint[];
  };
}

class EndpointCoverageAuditor {
  private openapiPath = "static/swagger/openapi.yml";
  private postmanPath = "tests/postman/collections/comprehensive.json";
  private results: CoverageResults;

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEndpoints: 0,
        testedEndpoints: 0,
        untestedEndpoints: 0,
        coveragePercentage: 0,
      },
      endpoints: {
        tested: [],
        untested: [],
        extra: [],
      },
    };
  }

  async loadOpenAPISpec(): Promise<Record<string, unknown>> {
    try {
      const content = await Deno.readTextFile(this.openapiPath);
      return parseYaml(content) as Record<string, unknown>;
    } catch (error) {
      console.error(`❌ Error loading OpenAPI spec from ${this.openapiPath}:`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      Deno.exit(1);
    }
  }

  async loadPostmanCollection(): Promise<Record<string, unknown>> {
    try {
      const content = await Deno.readTextFile(this.postmanPath);
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error loading Postman collection from ${this.postmanPath}:`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      Deno.exit(1);
    }
  }

  extractOpenAPIEndpoints(spec: Record<string, unknown>): OpenAPIEndpoint[] {
    const endpoints: OpenAPIEndpoint[] = [];
    const paths = spec.paths as Record<string, unknown>;

    if (!paths) {
      console.error("❌ No paths found in OpenAPI spec");
      return endpoints;
    }

    for (const [path, pathObject] of Object.entries(paths)) {
      const pathOps = pathObject as Record<string, unknown>;

      for (const [method, operation] of Object.entries(pathOps)) {
        const httpMethods = ["get", "post", "put", "delete", "patch"];
        if (httpMethods.includes(method.toLowerCase())) {
          const op = operation as Record<string, unknown>;
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: op.operationId as string | undefined,
            summary: op.summary as string | undefined,
            tags: op.tags as string[] | undefined,
          });
        }
      }
    }

    return endpoints;
  }

  extractPostmanEndpoints(
    collection: Record<string, unknown>,
  ): PostmanEndpoint[] {
    const endpoints: PostmanEndpoint[] = [];

    const extractFromItems = (
      items: unknown[] | undefined,
      parentPath = "",
    ): void => {
      if (!items) return;

      for (const item of items) {
        const itemObj = item as Record<string, unknown>;

        // Check if this item has a request
        if (itemObj.request) {
          const request = itemObj.request as Record<string, unknown>;
          let path = "";

          // Extract path from URL object or string
          if (request.url) {
            const url = request.url;

            if (typeof url === "object" && url !== null) {
              const urlObj = url as Record<string, unknown>;
              if (Array.isArray(urlObj.path)) {
                path = "/" + urlObj.path.join("/");
              }
            } else if (typeof url === "string") {
              try {
                const urlParsed = new URL(url);
                path = urlParsed.pathname;
              } catch {
                // If URL parsing fails, try to extract path manually
                path = url.replace(/^https?:\/\/[^/]+/, "");
              }
            }
          }

          // Normalize Postman variables to OpenAPI parameter format
          path = path.replace(/{{[^}]+}}/g, (match) => {
            const param = match.replace(/[{}]/g, "");
            return `{${param}}`;
          });

          const method = (request.method as string | undefined) || "GET";

          endpoints.push({
            path,
            method: method.toUpperCase(),
            name: (itemObj.name as string) || "Unnamed test",
            folder: parentPath,
          });
        }

        // Recursively process nested items (folders)
        if (itemObj.item && Array.isArray(itemObj.item)) {
          const currentPath = parentPath
            ? `${parentPath}/${itemObj.name}`
            : (itemObj.name as string);
          extractFromItems(itemObj.item, currentPath);
        }
      }
    };

    const collectionItems = collection.item;
    if (Array.isArray(collectionItems)) {
      extractFromItems(collectionItems);
    }

    return endpoints;
  }

  normalizePath(path: string): string {
    return path
      .replace(/^\/api/, "") // Remove /api prefix if present
      .replace(/\{[^}]+\}/g, "{param}") // Replace all parameters with generic {param}
      .replace(/\/+/g, "/") // Remove duplicate slashes
      .replace(/\/$/, ""); // Remove trailing slash
  }

  pathsMatch(path1: string, path2: string): boolean {
    const normalized1 = this.normalizePath(path1);
    const normalized2 = this.normalizePath(path2);
    return normalized1 === normalized2;
  }

  compareEndpoints(
    openapiEndpoints: OpenAPIEndpoint[],
    postmanEndpoints: PostmanEndpoint[],
  ): void {
    console.log(`📊 OpenAPI spec defines ${openapiEndpoints.length} endpoints`);
    console.log(`📊 Postman collection tests ${postmanEndpoints.length} requests`);

    this.results.summary.totalEndpoints = openapiEndpoints.length;

    // Find tested endpoints
    for (const openapiEndpoint of openapiEndpoints) {
      const found = postmanEndpoints.find(
        (postmanEndpoint) =>
          this.pathsMatch(openapiEndpoint.path, postmanEndpoint.path) &&
          openapiEndpoint.method === postmanEndpoint.method,
      );

      if (found) {
        this.results.endpoints.tested.push({
          ...openapiEndpoint,
          testName: found.name,
          testFolder: found.folder,
        });
      } else {
        this.results.endpoints.untested.push(openapiEndpoint);
      }
    }

    // Find extra endpoints (tested but not in spec)
    for (const postmanEndpoint of postmanEndpoints) {
      const found = openapiEndpoints.find(
        (openapiEndpoint) =>
          this.pathsMatch(openapiEndpoint.path, postmanEndpoint.path) &&
          openapiEndpoint.method === postmanEndpoint.method,
      );

      if (!found) {
        this.results.endpoints.extra.push(postmanEndpoint);
      }
    }

    this.results.summary.testedEndpoints = this.results.endpoints.tested.length;
    this.results.summary.untestedEndpoints = this.results.endpoints.untested.length;
    this.results.summary.coveragePercentage = Math.round(
      (this.results.summary.testedEndpoints / this.results.summary.totalEndpoints) *
        100,
    );
  }

  printReport(): void {
    console.log("\n📋 Endpoint Coverage Audit Report");
    console.log("=====================================");
    console.log(
      `Coverage: ${this.results.summary.coveragePercentage}% ` +
        `(${this.results.summary.testedEndpoints}/${this.results.summary.totalEndpoints})`,
    );

    // Report untested endpoints
    if (this.results.endpoints.untested.length > 0) {
      console.log(
        `\n❌ ${this.results.endpoints.untested.length} Missing Endpoints (defined in OpenAPI but not tested):`,
      );
      this.results.endpoints.untested.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.path}`);
        if (endpoint.summary) {
          console.log(`      Summary: ${endpoint.summary}`);
        }
        if (endpoint.tags && endpoint.tags.length > 0) {
          console.log(`      Tags: ${endpoint.tags.join(", ")}`);
        }
      });
    } else {
      console.log("\n✅ All OpenAPI endpoints have test coverage!");
    }

    // Report extra endpoints
    if (this.results.endpoints.extra.length > 0) {
      console.log(
        `\n⚠️  ${this.results.endpoints.extra.length} Extra Endpoints (tested but not in OpenAPI spec):`,
      );
      this.results.endpoints.extra.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.path}`);
        console.log(`      Test: ${endpoint.name}`);
        if (endpoint.folder) {
          console.log(`      Folder: ${endpoint.folder}`);
        }
      });
    }

    // Breakdown by tag
    console.log("\n📊 Coverage by Tag:");
    const tagCoverage = new Map<string, { total: number; tested: number }>();

    // Count total endpoints per tag
    for (const endpoint of this.results.endpoints.tested.concat(
      this.results.endpoints.untested,
    )) {
      if (endpoint.tags) {
        for (const tag of endpoint.tags) {
          const current = tagCoverage.get(tag) || { total: 0, tested: 0 };
          current.total++;
          tagCoverage.set(tag, current);
        }
      }
    }

    // Count tested endpoints per tag
    for (const endpoint of this.results.endpoints.tested) {
      if (endpoint.tags) {
        for (const tag of endpoint.tags) {
          const current = tagCoverage.get(tag)!;
          current.tested++;
          tagCoverage.set(tag, current);
        }
      }
    }

    // Print tag coverage
    for (const [tag, stats] of Array.from(tagCoverage.entries()).sort()) {
      const percentage = Math.round((stats.tested / stats.total) * 100);
      const icon = percentage === 100 ? "✅" : percentage >= 80 ? "⚠️ " : "❌";
      console.log(
        `   ${icon} ${tag}: ${percentage}% (${stats.tested}/${stats.total})`,
      );
    }
  }

  async saveReport(): Promise<void> {
    const reportDir = "reports";
    const reportPath = `${reportDir}/endpoint-coverage-audit.json`;

    try {
      // Ensure reports directory exists
      try {
        await Deno.stat(reportDir);
      } catch {
        await Deno.mkdir(reportDir, { recursive: true });
      }

      await Deno.writeTextFile(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Detailed report saved: ${reportPath}`);
    } catch (error) {
      console.error("⚠️  Failed to save report:");
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run(): Promise<void> {
    console.log("🔍 Auditing endpoint test coverage...\n");

    // Load files
    const [openapiSpec, postmanCollection] = await Promise.all([
      this.loadOpenAPISpec(),
      this.loadPostmanCollection(),
    ]);

    // Extract endpoints
    const openapiEndpoints = this.extractOpenAPIEndpoints(openapiSpec);
    const postmanEndpoints = this.extractPostmanEndpoints(postmanCollection);

    // Compare and generate report
    this.compareEndpoints(openapiEndpoints, postmanEndpoints);
    this.printReport();
    await this.saveReport();

    // Exit with error if any endpoints are missing coverage
    if (this.results.summary.untestedEndpoints > 0) {
      console.log(
        `\n❌ FAILURE: ${this.results.summary.untestedEndpoints} endpoint(s) lack test coverage`,
      );
      Deno.exit(1);
    } else {
      console.log("\n✅ SUCCESS: All endpoints have test coverage!");
      Deno.exit(0);
    }
  }
}

// Main execution
if (import.meta.main) {
  const auditor = new EndpointCoverageAuditor();
  await auditor.run();
}
