import { logger } from "$lib/utils/monitoring/logging/logger.ts";
import { LOG_NAMESPACES } from "$lib/constants/loggingConstants.ts";
import type { Context } from "$types/ui.d.ts";
import { parse as parseYaml } from "@std/yaml";
import Ajv from "npm:ajv@8.17.1";
import addFormats from "npm:ajv-formats@3.0.1";

// Define Next type locally since it's not exported from ui.d.ts
type Next = () => Promise<void> | void;

/**
 * OpenAPI Schema Validator Middleware
 * 
 * Validates API responses against OpenAPI schema definitions
 * Supports v2.2/v2.3 schema transitions and provides contract testing
 * 
 * Task 82: Add OpenAPI Contract Testing to Validate API Responses
 */

interface SchemaValidator {
  (data: any): boolean;
  errors?: any[];
}

class OpenAPIValidator {
  private ajv: any;
  private schemas: Map<string, SchemaValidator> = new Map();
  private openapiSpec: any;
  private enabled: boolean;

  constructor() {
    // Import Ajv constructor properly
    const AjvConstructor = (Ajv as any).default || Ajv;
    this.ajv = new AjvConstructor({ 
      allErrors: true, 
      strict: false,
      removeAdditional: false,
      validateFormats: true
    });
    
    // Add formats support
    const addFormatsFunc = (addFormats as any).default || addFormats;
    addFormatsFunc(this.ajv);
    
    // Always enable validation - this adds robustness to our API
    // Can be disabled in specific environments if needed (e.g., performance testing)
    this.enabled = Deno.env.get("OPENAPI_VALIDATION_DISABLED") !== "true";
  }

  /**
   * Load OpenAPI specification from YAML file
   */
  async loadSpec(specPath: string = "./schema.yml") {
    // When running from tests directory, adjust the path
    if (Deno.cwd().endsWith("/tests")) {
      specPath = "../schema.yml";
    }
    try {
      const yamlContent = await Deno.readTextFile(specPath);
      this.openapiSpec = parseYaml(yamlContent) as any;
      
      // Pre-compile schemas for all endpoints
      this.compileSchemas();
      
      logger.info(LOG_NAMESPACES.OPENAPI_VALIDATION, {
        message: "OpenAPI spec loaded successfully",
        version: this.openapiSpec.info?.version,
        paths: Object.keys(this.openapiSpec.paths || {}).length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(LOG_NAMESPACES.OPENAPI_VALIDATION, { 
        message: "Failed to load OpenAPI spec",
        error: errorMessage 
      });
      throw error;
    }
  }

  /**
   * Compile JSON schemas from OpenAPI spec
   */
  private compileSchemas() {
    const components = this.openapiSpec.components?.schemas || {};
    
    // Add component schemas to AJV
    for (const [name, schema] of Object.entries(components)) {
      this.ajv.addSchema(schema, `#/components/schemas/${name}`);
    }

    // Compile endpoint schemas (both request and response)
    for (const [path, pathItem] of Object.entries(this.openapiSpec.paths || {})) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (["get", "post", "put", "delete", "patch"].includes(method)) {
          // Compile request body schemas
          const requestBody = (operation as any).requestBody;
          if (requestBody) {
            const schema = this.extractRequestSchema(requestBody);
            if (schema) {
              const key = `${method.toUpperCase()} ${path} request`;
              try {
                const validator = this.ajv.compile(schema);
                this.schemas.set(key, validator);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.warn(LOG_NAMESPACES.OPENAPI_VALIDATION, { 
                  message: `Failed to compile request schema for ${key}`,
                  error: errorMessage 
                });
              }
            }
          }

          // Compile response schemas
          const responses = (operation as any).responses || {};
          for (const [statusCode, response] of Object.entries(responses)) {
            const schema = this.extractResponseSchema(response);
            if (schema) {
              const key = `${method.toUpperCase()} ${path} ${statusCode}`;
              try {
                const validator = this.ajv.compile(schema);
                this.schemas.set(key, validator);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.warn(LOG_NAMESPACES.OPENAPI_VALIDATION, { 
                  message: `Failed to compile response schema for ${key}`,
                  error: errorMessage 
                });
              }
            }
          }
        }
      }
    }
  }

  /**
   * Extract request schema from OpenAPI request body object
   */
  private extractRequestSchema(requestBody: any): any {
    if (requestBody.content) {
      const jsonContent = requestBody.content["application/json"];
      if (jsonContent?.schema) {
        return this.resolveSchema(jsonContent.schema);
      }
    }
    return null;
  }

  /**
   * Extract response schema from OpenAPI response object
   */
  private extractResponseSchema(response: any): any {
    const content = response.content || {};
    const jsonContent = content["application/json"];
    
    if (jsonContent?.schema) {
      return this.resolveSchema(jsonContent.schema);
    }
    
    return null;
  }

  /**
   * Resolve $ref references in schemas
   */
  private resolveSchema(schema: any): any {
    if (schema.$ref) {
      const refPath = schema.$ref.split("/").slice(1);
      let resolved = this.openapiSpec;
      
      for (const part of refPath) {
        resolved = resolved[part];
        if (!resolved) {
          logger.warn(LOG_NAMESPACES.OPENAPI_VALIDATION, { 
            message: `Unable to resolve $ref: ${schema.$ref}` 
          });
          return null;
        }
      }
      
      return this.resolveSchema(resolved);
    }
    
    // Recursively resolve nested schemas
    if (schema.type === "object" && schema.properties) {
      const resolvedProperties: any = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProperties[key] = this.resolveSchema(value as any);
      }
      return { ...schema, properties: resolvedProperties };
    }
    
    if (schema.type === "array" && schema.items) {
      return { ...schema, items: this.resolveSchema(schema.items) };
    }
    
    return schema;
  }

  /**
   * Validate response data against schema
   */
  validateResponse(method: string, path: string, statusCode: number, data: any): {
    valid: boolean;
    errors?: any[];
    warnings?: string[];
  } {
    if (!this.enabled) {
      return { valid: true };
    }

    const key = `${method} ${path} ${statusCode}`;
    const validator = this.schemas.get(key);
    
    if (!validator) {
      // Try to match with path parameters
      const matchedValidator = this.findMatchingValidator(method, path, statusCode);
      if (!matchedValidator) {
        return { 
          valid: true, 
          warnings: [`No schema found for ${key}`] 
        };
      }
      return this.runValidator(matchedValidator, data);
    }
    
    return this.runValidator(validator, data);
  }

  /**
   * Find validator for paths with parameters
   */
  private findMatchingValidator(method: string, actualPath: string, statusCodeOrType: number | string): SchemaValidator | null {
    // Convert actual path to OpenAPI pattern
    for (const [key, validator] of this.schemas.entries()) {
      const parts = key.split(" ");
      const keyMethod = parts[0];
      const keyPath = parts[1];
      const keyStatusOrType = parts[2];
      
      if (keyMethod === method && keyStatusOrType === String(statusCodeOrType)) {
        // Check if paths match with parameter substitution
        const pattern = keyPath.replace(/{[^}]+}/g, "[^/]+");
        const regex = new RegExp(`^${pattern}$`);
        
        if (regex.test(actualPath)) {
          return validator;
        }
      }
    }
    
    return null;
  }

  /**
   * Run validator and format results
   */
  private runValidator(validator: SchemaValidator, data: any): {
    valid: boolean;
    errors?: any[];
  } {
    const valid = validator(data);
    
    if (!valid && validator.errors) {
      return {
        valid: false,
        errors: validator.errors.map(err => ({
          path: err.instancePath,
          message: err.message,
          params: err.params,
          schemaPath: err.schemaPath
        }))
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate request data against schema
   */
  validateRequest(method: string, path: string, data: any): {
    valid: boolean;
    errors?: any[];
    warnings?: string[];
  } {
    if (!this.enabled) {
      return { valid: true };
    }

    const key = `${method} ${path} request`;
    const validator = this.schemas.get(key);
    
    if (!validator) {
      // Try to match with path parameters
      const matchedValidator = this.findMatchingValidator(method, path, "request");
      if (!matchedValidator) {
        return { 
          valid: true, 
          warnings: [`No request schema found for ${method} ${path}`] 
        };
      }
      return this.runValidator(matchedValidator, data);
    }
    
    return this.runValidator(validator, data);
  }

  /**
   * Check if validation is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
let validatorInstance: OpenAPIValidator | null = null;

/**
 * Get or create validator instance
 */
export async function getValidator(): Promise<OpenAPIValidator> {
  if (!validatorInstance) {
    validatorInstance = new OpenAPIValidator();
    await validatorInstance.loadSpec();
  }
  return validatorInstance;
}

/**
 * Middleware function for OpenAPI validation
 */
export async function openapiValidatorMiddleware(ctx: Context, next: Next) {
  // Skip validation for non-API routes
  if (!ctx.request.url?.pathname?.startsWith("/api/v2/")) {
    return next();
  }

  // Continue processing request
  await next();

  // Validate response after processing
  try {
    const validator = await getValidator();
    
    if (validator.isEnabled() && ctx.response.body) {
      const method = ctx.request.method;
      const path = ctx.request.url?.pathname;
      const statusCode = ctx.response.status || 200;
      
      // Parse response body for validation
      let responseData: any;
      const body = ctx.response.body;
      
      if (typeof body === "string") {
        try {
          responseData = JSON.parse(body);
        } catch {
          // Not JSON, skip validation
          return;
        }
      } else if (body instanceof Response) {
        // Handle Response objects
        const text = await body.text();
        try {
          responseData = JSON.parse(text);
          // Recreate response with same data
          ctx.response.body = text;
        } catch {
          // Not JSON, skip validation
          return;
        }
      } else {
        responseData = body;
      }

      // Validate against schema
      const validation = validator.validateResponse(
        method,
        path,
        statusCode,
        responseData
      );

      if (!validation.valid) {
        // Log validation errors
        logger.warn(LOG_NAMESPACES.OPENAPI_VALIDATION, {
          message: "OpenAPI schema validation failed",
          method,
          path,
          statusCode,
          errors: validation.errors,
          apiVersion: ctx.state.apiVersion
        });

        // In development, add validation errors to response headers
        if (Deno.env.get("DENO_ENV") === "development") {
          ctx.response.headers.set(
            "X-Schema-Validation-Error",
            JSON.stringify(validation.errors)
          );
        }
      }

      // Add validation status header
      ctx.response.headers.set(
        "X-Schema-Validated",
        validation.valid ? "true" : "false"
      );
    }
  } catch (error) {
    logger.error(LOG_NAMESPACES.OPENAPI_VALIDATION, { 
      message: "OpenAPI validation middleware error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
  }
}

/**
 * Helper function to manually validate data against a schema
 */
export async function validateAgainstSchema(
  method: string,
  path: string,
  statusCode: number,
  data: any
): Promise<{ valid: boolean; errors?: any[] }> {
  const validator = await getValidator();
  return validator.validateResponse(method, path, statusCode, data);
}

/**
 * Middleware function for request validation
 */
export async function requestValidatorMiddleware(ctx: Context, next: Next) {
  // Skip validation for non-API routes and internal API routes
  // Only validate /api/v2 endpoints that are part of our OpenAPI schema
  if (!ctx.request.url?.pathname?.startsWith("/api/v2/")) {
    return next();
  }

  // Skip validation for GET requests (no body, query params handled separately)
  if (ctx.request.method === "GET") {
    // TODO(#83): Add query parameter validation
    return next();
  }

  try {
    const validator = await getValidator();
    
    if (validator.isEnabled() && ["POST", "PUT", "PATCH"].includes(ctx.request.method)) {
      const contentType = ctx.request.headers.get("content-type");
      
      // Only validate JSON requests
      if (contentType?.includes("application/json")) {
        let requestData: any;
        
        try {
          // Clone request to avoid consuming the body
          const clonedRequest = ctx.request.clone();
          requestData = await clonedRequest.json();
        } catch (error) {
          // Malformed JSON
          ctx.response.status = 400;
          ctx.response.body = {
            error: "Invalid JSON in request body",
            message: error instanceof Error ? error.message : "JSON parsing failed"
          };
          return;
        }

        // Validate against schema
        const validation = validator.validateRequest(
          ctx.request.method,
          ctx.request.url?.pathname,
          requestData
        );

        if (!validation.valid) {
          // Return 400 Bad Request with validation errors
          ctx.response.status = 400;
          ctx.response.body = {
            error: "Request validation failed",
            errors: validation.errors,
            message: "The request body does not match the expected schema"
          };
          
          logger.warn(LOG_NAMESPACES.OPENAPI_VALIDATION, {
            message: "Request validation failed",
            method: ctx.request.method,
            path: ctx.request.url?.pathname,
            errors: validation.errors
          });
          
          return;
        }
      }
    }
  } catch (error) {
    logger.error(LOG_NAMESPACES.OPENAPI_VALIDATION, { 
      message: "Request validation middleware error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
  }

  // Continue to next middleware
  await next();
}