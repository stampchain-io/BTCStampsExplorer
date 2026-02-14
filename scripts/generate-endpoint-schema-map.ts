#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Endpoint-to-Schema Mapping Generator
 *
 * This script parses the OpenAPI specification and Postman collection to generate
 * a comprehensive mapping file that links each Newman request to its expected
 * response schema, status codes, and required fields.
 *
 * Input Files:
 * - static/swagger/openapi.yml - OpenAPI 3.0 specification
 * - tests/postman/collections/comprehensive.json - Postman collection
 *
 * Output File:
 * - tests/postman/endpoint-schema-map.json - Generated mapping
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-endpoint-schema-map.ts
 */

import { parse as parseYaml } from "@std/yaml";

// Type definitions
interface OpenAPISpec {
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    responses?: Record<string, ResponseObject>;
  };
}

interface PathItem {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
}

interface OperationObject {
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
}

interface ParameterObject {
  name: string;
  in: string;
  required?: boolean;
  schema?: SchemaObject;
}

interface RequestBodyObject {
  content?: Record<string, { schema?: SchemaObject }>;
}

interface ResponseObject {
  description?: string;
  content?: Record<string, { schema?: SchemaObject }>;
  $ref?: string;
}

interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  $ref?: string;
  enum?: unknown[];
  oneOf?: SchemaObject[];
  allOf?: SchemaObject[];
  description?: string;
}

interface PostmanCollection {
  info: { name: string };
  item: PostmanItem[];
}

interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  event?: PostmanEvent[];
}

interface PostmanRequest {
  method: string;
  url: PostmanUrl;
  header?: Array<{ key: string; value: string }>;
  body?: {
    mode: string;
    raw?: string;
  };
}

interface PostmanUrl {
  raw: string;
  host?: string[];
  path?: string[];
}

interface PostmanEvent {
  listen: string;
  script: {
    exec: string[];
  };
}

interface EndpointMapping {
  postmanName: string;
  method: string;
  url: string;
  openapiPath: string;
  expectedStatus: number;
  hasExistingTests: boolean;
  responseType: "simple" | "paginated" | "error" | "array";
  requiredFields: string[];
  dataItemFields?: string[];
  dataItemTypes?: Record<string, string>;
  parameters?: string[];
}

interface MappingOutput {
  requests: EndpointMapping[];
  summary: {
    totalRequests: number;
    requestsWithoutTests: number;
    requestsWithTests: number;
    openapiEndpoints: number;
  };
}

/**
 * Read and parse the OpenAPI YAML file
 */
async function parseOpenAPI(filePath: string): Promise<OpenAPISpec> {
  const content = await Deno.readTextFile(filePath);
  return parseYaml(content) as OpenAPISpec;
}

/**
 * Read and parse the Postman collection JSON file
 */
async function parsePostmanCollection(
  filePath: string,
): Promise<PostmanCollection> {
  const content = await Deno.readTextFile(filePath);
  return JSON.parse(content);
}

/**
 * Recursively flatten Postman collection to extract all requests
 */
function extractRequests(items: PostmanItem[]): PostmanItem[] {
  const requests: PostmanItem[] = [];

  for (const item of items) {
    if (item.request) {
      requests.push(item);
    }
    if (item.item) {
      requests.push(...extractRequests(item.item));
    }
  }

  return requests;
}

/**
 * Check if a request has test scripts
 */
function hasTestScripts(request: PostmanItem): boolean {
  if (!request.event) return false;

  return request.event.some((event) => {
    return event.listen === "test" &&
      event.script?.exec?.some((line) =>
        line.includes("pm.test") || line.includes("pm.expect")
      );
  });
}

/**
 * Convert Postman URL to OpenAPI path format
 * Example: {{dev_base_url}}/api/v2/balance/{{test_address}} -> /api/v2/balance/{address}
 */
function postmanUrlToOpenapiPath(postmanUrl: PostmanUrl): string {
  let path = "";

  if (postmanUrl.path) {
    path = "/" + postmanUrl.path.join("/");
  } else if (postmanUrl.raw) {
    // Extract path from raw URL
    const urlMatch = postmanUrl.raw.match(/\/api\/v2\/[^\s?]*/);
    if (urlMatch) {
      path = urlMatch[0];
    }
  }

  // Replace Postman variables with OpenAPI path parameters
  path = path.replace(/\{\{[^}]+\}\}/g, (match) => {
    // Common variable name mappings
    const varName = match.replace(/\{\{|\}\}/g, "");
    if (varName === "test_address" || varName === "address") {
      return "{address}";
    }
    if (varName === "test_tick" || varName === "tick") return "{tick}";
    if (varName === "test_id" || varName === "id") return "{id}";
    if (varName === "test_block" || varName === "block_index") {
      return "{block_index}";
    }
    if (varName === "test_tx_hash" || varName === "tx_hash") {
      return "{tx_hash}";
    }
    if (varName === "test_deploy_hash" || varName === "deploy_hash") {
      return "{deploy_hash}";
    }
    if (varName === "test_token_id" || varName === "tokenid") {
      return "{tokenid}";
    }
    if (varName === "test_ident" || varName === "ident") return "{ident}";
    if (varName === "test_creator" || varName === "creator") {
      return "{creator}";
    }
    if (varName === "number") return "{number}";
    if (varName === "index") return "{index}";
    if (varName === "address_btc") return "{address_btc}";

    // Default: use variable name as-is
    return `{${varName}}`;
  });

  return path;
}

/**
 * Resolve $ref to actual schema object
 */
function resolveRef(
  ref: string,
  openapi: OpenAPISpec,
): SchemaObject | ResponseObject | null {
  if (!ref.startsWith("#/")) return null;

  const parts = ref.split("/").slice(1); // Remove leading #
  let current: unknown = openapi;

  for (const part of parts) {
    if (typeof current === "object" && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return current as SchemaObject | ResponseObject;
}

/**
 * Extract required fields from a schema object
 */
function extractRequiredFields(
  schema: SchemaObject,
  openapi: OpenAPISpec,
): string[] {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, openapi);
    if (resolved && "properties" in resolved) {
      return extractRequiredFields(resolved as SchemaObject, openapi);
    }
  }

  const fields: string[] = [];

  if (schema.properties) {
    const required = schema.required || [];
    for (const [key, value] of Object.entries(schema.properties)) {
      if (required.includes(key) || value.required) {
        fields.push(key);
      }
    }

    // Also include common fields that appear in properties
    for (const key of Object.keys(schema.properties)) {
      if (!fields.includes(key)) {
        fields.push(key);
      }
    }
  }

  return fields;
}

/**
 * Determine response type based on schema
 */
function determineResponseType(
  schema: SchemaObject,
  openapi: OpenAPISpec,
): "simple" | "paginated" | "error" | "array" {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, openapi);
    if (resolved && "properties" in resolved) {
      return determineResponseType(resolved as SchemaObject, openapi);
    }
  }

  if (schema.properties) {
    // Check for pagination fields
    if (
      "data" in schema.properties &&
      ("page" in schema.properties || "limit" in schema.properties)
    ) {
      return "paginated";
    }

    // Check for error fields
    if ("error" in schema.properties || "message" in schema.properties) {
      return "error";
    }
  }

  if (schema.type === "array") {
    return "array";
  }

  return "simple";
}

/**
 * Extract data item fields from paginated responses
 */
function extractDataItemFields(
  schema: SchemaObject,
  openapi: OpenAPISpec,
): { fields: string[]; types: Record<string, string> } {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, openapi);
    if (resolved && "properties" in resolved) {
      return extractDataItemFields(resolved as SchemaObject, openapi);
    }
  }

  const fields: string[] = [];
  const types: Record<string, string> = {};

  if (schema.properties?.data) {
    const dataSchema = schema.properties.data;

    if (dataSchema.type === "array" && dataSchema.items) {
      const itemSchema = dataSchema.items;

      if (itemSchema.$ref) {
        const resolved = resolveRef(itemSchema.$ref, openapi);
        if (resolved && "properties" in resolved) {
          const props = (resolved as SchemaObject).properties || {};
          for (const [key, value] of Object.entries(props)) {
            fields.push(key);
            types[key] = value.type || "unknown";
          }
        }
      } else if (itemSchema.properties) {
        for (const [key, value] of Object.entries(itemSchema.properties)) {
          fields.push(key);
          types[key] = value.type || "unknown";
        }
      }
    }
  }

  return { fields, types };
}

/**
 * Extract path parameters from OpenAPI path
 */
function extractPathParameters(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  if (!matches) return [];

  return matches.map((m) => m.replace(/[{}]/g, ""));
}

/**
 * Find matching OpenAPI endpoint for a Postman request
 */
function findMatchingEndpoint(
  postmanPath: string,
  method: string,
  openapi: OpenAPISpec,
): { path: string; operation: OperationObject } | null {
  // Try exact match first
  const pathItem = openapi.paths[postmanPath];
  if (pathItem) {
    const operation = pathItem[method.toLowerCase() as keyof PathItem] as
      | OperationObject
      | undefined;
    if (operation) {
      return { path: postmanPath, operation };
    }
  }

  // Try fuzzy matching for paths with parameters
  for (const [apiPath, pathItem] of Object.entries(openapi.paths)) {
    const operation = pathItem[method.toLowerCase() as keyof PathItem] as
      | OperationObject
      | undefined;
    if (!operation) continue;

    // Convert both paths to regex patterns
    const apiPattern = apiPath.replace(/\{[^}]+\}/g, "[^/]+");
    const regex = new RegExp(`^${apiPattern}$`);

    if (regex.test(postmanPath)) {
      return { path: apiPath, operation };
    }
  }

  return null;
}

/**
 * Generate endpoint mapping for a single request
 */
function generateMapping(
  request: PostmanItem,
  openapi: OpenAPISpec,
): EndpointMapping | null {
  if (!request.request) return null;

  const method = request.request.method;
  const postmanUrl = postmanUrlToOpenapiPath(request.request.url);

  const match = findMatchingEndpoint(postmanUrl, method, openapi);
  if (!match) {
    console.warn(
      `Warning: No OpenAPI match found for ${method} ${postmanUrl} (${request.name})`,
    );
    return null;
  }

  const { path: openapiPath, operation } = match;

  // Determine expected status (default to 200 for GET, 201 for POST)
  let expectedStatus = 200;
  if (method === "POST") expectedStatus = 201;

  // Find success response (2xx)
  for (const [status, response] of Object.entries(operation.responses)) {
    if (status.startsWith("2")) {
      expectedStatus = parseInt(status);
      break;
    }
  }

  // Get response schema for success status
  const responseObj = operation.responses[expectedStatus.toString()];
  let schema: SchemaObject | null = null;

  if (responseObj) {
    if (responseObj.$ref) {
      const resolved = resolveRef(responseObj.$ref, openapi);
      if (resolved && "content" in resolved) {
        const content = (resolved as ResponseObject).content?.[
          "application/json"
        ];
        schema = content?.schema || null;
      }
    } else if (responseObj.content?.["application/json"]?.schema) {
      schema = responseObj.content["application/json"].schema;
    }
  }

  let requiredFields: string[] = [];
  let responseType: "simple" | "paginated" | "error" | "array" = "simple";
  let dataItemFields: string[] | undefined;
  let dataItemTypes: Record<string, string> | undefined;

  if (schema) {
    requiredFields = extractRequiredFields(schema, openapi);
    responseType = determineResponseType(schema, openapi);

    if (responseType === "paginated") {
      const { fields, types } = extractDataItemFields(schema, openapi);
      if (fields.length > 0) {
        dataItemFields = fields;
        dataItemTypes = types;
      }
    }
  }

  const parameters = extractPathParameters(openapiPath);

  return {
    postmanName: request.name,
    method,
    url: postmanUrl,
    openapiPath,
    expectedStatus,
    hasExistingTests: hasTestScripts(request),
    responseType,
    requiredFields,
    dataItemFields,
    dataItemTypes,
    parameters: parameters.length > 0 ? parameters : undefined,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log("🔧 Endpoint-to-Schema Mapping Generator");
  console.log("=" .repeat(60));

  // Paths
  const openapiPath = "static/swagger/openapi.yml";
  const postmanPath = "tests/postman/collections/comprehensive.json";
  const outputPath = "tests/postman/endpoint-schema-map.json";

  console.log(`\n📖 Reading OpenAPI spec from: ${openapiPath}`);
  const openapi = await parseOpenAPI(openapiPath);
  const openapiEndpointCount = Object.keys(openapi.paths).length;
  console.log(`   Found ${openapiEndpointCount} OpenAPI endpoints`);

  console.log(`\n📖 Reading Postman collection from: ${postmanPath}`);
  const postman = await parsePostmanCollection(postmanPath);
  const allRequests = extractRequests(postman.item);
  console.log(`   Found ${allRequests.length} Postman requests`);

  console.log(`\n🔍 Generating mappings...`);
  const mappings: EndpointMapping[] = [];
  let withTests = 0;
  let withoutTests = 0;

  for (const request of allRequests) {
    const mapping = generateMapping(request, openapi);
    if (mapping) {
      mappings.push(mapping);
      if (mapping.hasExistingTests) {
        withTests++;
      } else {
        withoutTests++;
      }
    }
  }

  console.log(`   ✅ Generated ${mappings.length} mappings`);
  console.log(`   📊 ${withTests} with tests, ${withoutTests} without tests`);

  // Create output
  const output: MappingOutput = {
    requests: mappings,
    summary: {
      totalRequests: mappings.length,
      requestsWithoutTests: withoutTests,
      requestsWithTests: withTests,
      openapiEndpoints: openapiEndpointCount,
    },
  };

  console.log(`\n💾 Writing output to: ${outputPath}`);
  await Deno.writeTextFile(outputPath, JSON.stringify(output, null, 2));

  console.log("\n✨ Summary:");
  console.log(`   Total Requests: ${output.summary.totalRequests}`);
  console.log(`   Requests with Tests: ${output.summary.requestsWithTests}`);
  console.log(
    `   Requests without Tests: ${output.summary.requestsWithoutTests}`,
  );
  console.log(`   OpenAPI Endpoints: ${output.summary.openapiEndpoints}`);

  console.log("\n📊 Response Type Breakdown:");
  const typeCounts: Record<string, number> = {};
  for (const mapping of mappings) {
    typeCounts[mapping.responseType] =
      (typeCounts[mapping.responseType] || 0) + 1;
  }
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`   ${type}: ${count}`);
  }

  console.log("\n✅ Mapping generation complete!");
}

// Run main function
if (import.meta.main) {
  main();
}
