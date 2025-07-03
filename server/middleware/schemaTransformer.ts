import { getFieldsToStrip } from "./apiVersionMiddleware.ts";
import { logger } from "../../lib/utils/logger.ts";

/**
 * Schema Transformation Framework
 * 
 * Task 4.2: Design Schema Transformation Framework and Version Registry
 * Handles field mapping, type conversions, and structural changes between API versions
 */

export interface TransformationRule {
  sourceField: string;
  targetField?: string;
  transform?: (value: any) => any;
  condition?: (data: any) => boolean;
  remove?: boolean;
}

export interface VersionTransformationConfig {
  version: string;
  rules: TransformationRule[];
  globalTransforms?: ((data: any) => any)[];
}

// Transformation registry for different versions
const TRANSFORMATION_REGISTRY: Record<string, VersionTransformationConfig> = {
  "2.2": {
    version: "2.2",
    rules: [
      // Remove all enhanced fields for v2.2
      { sourceField: "marketData", remove: true },
      { sourceField: "dispenserInfo", remove: true },
      { sourceField: "cacheStatus", remove: true },
      { sourceField: "cacheInfo", remove: true },
      { sourceField: "holderCount", remove: true },
      { sourceField: "uniqueHolderCount", remove: true },
      { sourceField: "floorPriceBTC", remove: true },
      { sourceField: "volume24hBTC", remove: true },
      { sourceField: "dataQualityScore", remove: true },
      { sourceField: "priceSource", remove: true }
    ],
    globalTransforms: []
  },
  "2.3": {
    version: "2.3",
    rules: [], // No transformations needed - latest version
    globalTransforms: []
  }
};

/**
 * Deep clone an object to avoid mutations
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  const clonedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * Remove fields from an object based on a set of field names
 */
function removeFields(obj: any, fieldsToRemove: Set<string>): void {
  if (!obj || typeof obj !== "object") {
    return;
  }

  for (const field of fieldsToRemove) {
    if (field in obj) {
      delete obj[field];
    }
  }

  // Recursively process nested objects and arrays
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (Array.isArray(value)) {
        value.forEach(item => removeFields(item, fieldsToRemove));
      } else if (value && typeof value === "object") {
        removeFields(value, fieldsToRemove);
      }
    }
  }
}

/**
 * Apply transformation rules to data
 */
function applyTransformationRules(
  data: any,
  rules: TransformationRule[]
): any {
  const transformed = deepClone(data);
  
  for (const rule of rules) {
    // Check condition if specified
    if (rule.condition && !rule.condition(transformed)) {
      continue;
    }
    
    // Handle field removal
    if (rule.remove) {
      delete transformed[rule.sourceField];
      continue;
    }
    
    // Handle field transformation
    if (rule.sourceField in transformed) {
      const sourceValue = transformed[rule.sourceField];
      
      if (rule.transform) {
        // Apply transformation function
        const transformedValue = rule.transform(sourceValue);
        
        if (rule.targetField) {
          // Move to new field
          transformed[rule.targetField] = transformedValue;
          if (rule.targetField !== rule.sourceField) {
            delete transformed[rule.sourceField];
          }
        } else {
          // Transform in place
          transformed[rule.sourceField] = transformedValue;
        }
      } else if (rule.targetField && rule.targetField !== rule.sourceField) {
        // Simple field rename
        transformed[rule.targetField] = sourceValue;
        delete transformed[rule.sourceField];
      }
    }
  }
  
  return transformed;
}

/**
 * Transform response data based on API version
 */
export function transformResponseForVersion(
  data: any,
  version: string
): any {
  try {
    // Get transformation config for version
    const config = TRANSFORMATION_REGISTRY[version];
    
    if (!config) {
      logger.warn(`No transformation config for version ${version}`);
      return data;
    }
    
    // Clone data to avoid mutations
    let transformed = deepClone(data);
    
    // Apply field stripping based on version
    const fieldsToStrip = getFieldsToStrip(version);
    if (fieldsToStrip.size > 0) {
      // Handle both single object and array responses
      if (Array.isArray(transformed)) {
        transformed.forEach(item => removeFields(item, fieldsToStrip));
      } else if (transformed.data && Array.isArray(transformed.data)) {
        // Handle paginated responses
        transformed.data.forEach((item: any) => removeFields(item, fieldsToStrip));
      } else {
        removeFields(transformed, fieldsToStrip);
      }
    }
    
    // Apply transformation rules
    if (config.rules.length > 0) {
      if (Array.isArray(transformed)) {
        transformed = transformed.map(item => 
          applyTransformationRules(item, config.rules)
        );
      } else if (transformed.data && Array.isArray(transformed.data)) {
        transformed.data = transformed.data.map((item: any) => 
          applyTransformationRules(item, config.rules)
        );
      } else {
        transformed = applyTransformationRules(transformed, config.rules);
      }
    }
    
    // Apply global transforms
    if (config.globalTransforms) {
      for (const transform of config.globalTransforms) {
        transformed = transform(transformed);
      }
    }
    
    return transformed;
  } catch (error) {
    logger.error("Error transforming response for version", { version, error });
    return data; // Return original data on error
  }
}

/**
 * Register custom transformation rules for a version
 */
export function registerTransformationRule(
  version: string,
  rule: TransformationRule
): void {
  if (!TRANSFORMATION_REGISTRY[version]) {
    TRANSFORMATION_REGISTRY[version] = {
      version,
      rules: [],
      globalTransforms: []
    };
  }
  
  TRANSFORMATION_REGISTRY[version].rules.push(rule);
}

/**
 * Validate if a response matches expected schema for a version
 */
export function validateResponseSchema(
  data: any,
  version: string,
  _endpoint: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fieldsToStrip = getFieldsToStrip(version);
  
  // Check if stripped fields are present
  const checkForStrippedFields = (obj: any, path: string = ""): void => {
    if (!obj || typeof obj !== "object") {
      return;
    }
    
    for (const field of fieldsToStrip) {
      if (field in obj) {
        errors.push(`Field '${field}' should not be present in version ${version} at ${path}`);
      }
    }
    
    // Check nested objects
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            checkForStrippedFields(item, `${path}.${key}[${index}]`);
          });
        } else if (value && typeof value === "object") {
          checkForStrippedFields(value, `${path}.${key}`);
        }
      }
    }
  };
  
  checkForStrippedFields(data);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get a summary of changes between versions
 */
export function getVersionChangeSummary(
  fromVersion: string,
  toVersion: string
): {
  addedFields: string[];
  removedFields: string[];
  transformedFields: string[];
} {
  const fromConfig = TRANSFORMATION_REGISTRY[fromVersion];
  // TODO(@team): toConfig might need to be used for analyzing target version changes
  const _toConfig = TRANSFORMATION_REGISTRY[toVersion];
  
  const summary = {
    addedFields: [] as string[],
    removedFields: [] as string[],
    transformedFields: [] as string[]
  };
  
  // Analyze rules to determine changes
  if (fromConfig) {
    fromConfig.rules.forEach(rule => {
      if (rule.remove) {
        summary.removedFields.push(rule.sourceField);
      } else if (rule.targetField && rule.targetField !== rule.sourceField) {
        summary.transformedFields.push(`${rule.sourceField} → ${rule.targetField}`);
      }
    });
  }
  
  // Get fields based on version differences
  const fromFields = getFieldsToStrip(fromVersion);
  const toFields = getFieldsToStrip(toVersion);
  
  // Fields in fromFields but not in toFields are added
  fromFields.forEach(field => {
    if (!toFields.has(field)) {
      summary.addedFields.push(field);
    }
  });
  
  return summary;
}