/**
 * Tests for OpenAPI 3.0+ compliance in api.d.ts
 */

import { assertEquals, assertExists } from "@std/assert";
import type {
  ApiError,
  ApiRequest,
  ApiResponse,
  EndpointRegistry,
  OpenAPIDocument,
  OpenAPIInfo,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPISchema,
  OpenAPIServer,
} from "./api.d.ts";

Deno.test("OpenAPI type definitions - basic structures", () => {
  // Test OpenAPIInfo structure
  const info: OpenAPIInfo = {
    title: "BTCStampsExplorer API",
    version: "2.0.0",
    description: "Bitcoin Stamps Protocol API",
    termsOfService: "https://stampchain.io/terms",
    contact: {
      name: "API Support",
      email: "api@stampchain.io",
      url: "https://stampchain.io/support",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  };

  assertEquals(info.title, "BTCStampsExplorer API");
  assertEquals(info.version, "2.0.0");
  assertExists(info.contact);
  assertExists(info.license);
});

Deno.test("OpenAPI server configuration", () => {
  const servers: OpenAPIServer[] = [
    {
      url: "https://api.stampchain.io/v2",
      description: "Production server",
    },
    {
      url: "https://staging-api.stampchain.io/v2",
      description: "Staging server",
      variables: {
        version: {
          default: "v2",
          enum: ["v1", "v2"],
          description: "API version",
        },
      },
    },
  ];

  assertEquals(servers.length, 2);
  assertEquals(servers[0].url, "https://api.stampchain.io/v2");
  assertExists(servers[1].variables);
});

Deno.test("OpenAPI parameter definitions", () => {
  const parameter: OpenAPIParameter = {
    name: "stampId",
    in: "path",
    description: "The stamp identifier",
    required: true,
    schema: {
      type: "integer",
      minimum: 1,
      maximum: 999999,
    },
    example: 12345,
  };

  assertEquals(parameter.name, "stampId");
  assertEquals(parameter.in, "path");
  assertEquals(parameter.required, true);
  assertEquals(parameter.schema.type, "integer");
});

Deno.test("OpenAPI schema validation", () => {
  const schema: OpenAPISchema = {
    type: "object",
    title: "StampResponse",
    description: "Bitcoin Stamp data",
    required: ["stamp", "cpid", "tx_hash"],
    properties: {
      stamp: {
        type: "integer",
        description: "Stamp number",
        minimum: 1,
      },
      cpid: {
        type: "string",
        pattern: "^A[0-9]+$",
        description: "CPID identifier",
      },
      tx_hash: {
        type: "string",
        description: "Transaction hash",
        minLength: 64,
        maxLength: 64,
      },
      supply: {
        type: "number",
        nullable: true,
      },
    },
    additionalProperties: false,
  };

  assertEquals(schema.type, "object");
  assertEquals(schema.required?.length, 3);
  assertExists(schema.properties);
  assertEquals(schema.properties.cpid.pattern, "^A[0-9]+$");
  assertEquals(schema.properties.supply.nullable, true);
});

Deno.test("OpenAPI operation definition", () => {
  const operation: OpenAPIOperation = {
    tags: ["Bitcoin Stamps"],
    summary: "Get stamp by ID",
    description: "Retrieve detailed information about a specific stamp",
    operationId: "getStampById",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
    ],
    responses: {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                stamp: { type: "integer" },
                cpid: { type: "string" },
              },
            },
          },
        },
      },
      "404": {
        description: "Stamp not found",
      },
    },
  };

  assertExists(operation.tags);
  assertEquals(operation.tags[0], "Bitcoin Stamps");
  assertEquals(operation.operationId, "getStampById");
  assertExists(operation.responses["200"]);
  assertExists(operation.responses["404"]);
});

Deno.test("Complete OpenAPI document structure", () => {
  const doc: OpenAPIDocument = {
    openapi: "3.0.3",
    info: {
      title: "BTCStampsExplorer API",
      version: "2.0.0",
    },
    servers: [
      {
        url: "https://api.stampchain.io",
      },
    ],
    paths: {
      "/stamps/{id}": {
        get: {
          responses: {
            "200": {
              description: "Success",
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Stamp: {
          type: "object",
          properties: {
            stamp: { type: "integer" },
          },
        },
      },
    },
    tags: [
      {
        name: "Stamps",
        description: "Bitcoin Stamps operations",
      },
    ],
  };

  assertEquals(doc.openapi, "3.0.3");
  assertExists(doc.info);
  assertExists(doc.paths);
  assertExists(doc.components?.schemas);
  assertExists(doc.tags);
});

Deno.test("Generic API request/response types", () => {
  // Test ApiRequest
  const request: ApiRequest<
    { id: string },
    { limit?: number },
    { name: string }
  > = {
    params: { id: "123" },
    query: { limit: 10 },
    body: { name: "Test Stamp" },
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer token123",
    },
    method: "POST",
    url: "https://api.example.com/stamps/123",
    path: "/stamps/123",
  };

  assertEquals(request.params?.id, "123");
  assertEquals(request.query?.limit, 10);
  assertEquals(request.body?.name, "Test Stamp");

  // Test ApiResponse
  const response: ApiResponse<{ stamp: number }> = {
    success: true,
    data: { stamp: 12345 },
    metadata: {
      timestamp: Date.now(),
      version: "2.0.0",
      requestId: "req-123",
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 100,
      pages: 5,
      hasNext: true,
      hasPrevious: false,
    },
  };

  assertEquals(response.success, true);
  assertEquals(response.data?.stamp, 12345);
  assertExists(response.metadata);
  assertExists(response.pagination);
});

Deno.test("API error structure - RFC 7807 compliance", () => {
  const error: ApiError = {
    type: "https://api.stampchain.io/errors/invalid-stamp",
    title: "Invalid Stamp ID",
    status: 400,
    detail: "The stamp ID must be a positive integer",
    instance: "/stamps/-1",
    code: "INVALID_STAMP",
    timestamp: new Date().toISOString(),
    path: "/api/v2/stamps/-1",
    method: "GET",
    correlationId: "req-456",
    // Extension members
    validationErrors: [
      {
        field: "id",
        message: "Must be positive",
      },
    ],
  };

  assertEquals(error.status, 400);
  assertEquals(error.code, "INVALID_STAMP");
  assertExists(error.type);
  assertExists(error.detail);
  assertExists(error.instance);
  // Extension members are allowed
  assertExists(error.validationErrors);
});

Deno.test("Endpoint registry coverage", () => {
  // This is a type-level test to ensure EndpointRegistry is properly structured

  // Test that we can extract response types
  type StampsResponse = EndpointRegistry["/api/v2/stamps"]["GET"];
  type HealthResponse = EndpointRegistry["/api/v2/health"]["GET"];

  // These assertions would fail at compile time if the types were wrong
  const _stampsTest: StampsResponse = {} as any;
  const _healthTest: HealthResponse = {} as any;

  assertExists(_stampsTest);
  assertExists(_healthTest);
});
