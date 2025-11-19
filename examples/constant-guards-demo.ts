/**
 * Demo: Constant Type Guards Usage
 * Shows how the new type guards improve type safety
 */

import {
  getStampTypeDisplay,
  isValidStampFilterType,
  isValidStampType,
  parseStampType,
  validateConstants,
  validateStampType,
} from "$types/constants.ts";
import { STAMP_TYPES } from "$constants";

console.log("=== Constant Type Guards Demo ===\n");

// 1. Basic validation
console.log("1. Basic Validation:");
const userInput = "cursed";
if (isValidStampType(userInput)) {
  console.log(`✅ "${userInput}" is a valid stamp type`);
  console.log(`   Display name: ${getStampTypeDisplay(userInput)}`);
} else {
  console.log(`❌ "${userInput}" is not a valid stamp type`);
}

// 2. Invalid input handling
console.log("\n2. Invalid Input Handling:");
const invalidInput = "invalid-type";
if (!isValidStampType(invalidInput)) {
  console.log(`❌ "${invalidInput}" is not valid`);
  console.log(`   Using fallback: ${parseStampType(invalidInput)}`);
}

// 3. Type assertion with error
console.log("\n3. Type Assertion (with error handling):");
try {
  validateStampType("invalid");
} catch (error) {
  console.log(
    `❌ Assertion failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

// 4. Batch validation
console.log("\n4. Batch Validation:");
const params = {
  type: STAMP_TYPES.CLASSIC,
  filter: "pixel",
  invalid: "bad-value",
};

try {
  validateConstants([
    { value: params.type, validator: isValidStampType, name: "type" },
    { value: params.filter, validator: isValidStampFilterType, name: "filter" },
  ]);
  console.log("✅ All parameters valid");
} catch (error) {
  console.log(
    `❌ Validation failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

// 5. Type narrowing in action
console.log("\n5. Type Narrowing Example:");
function processStampType(value: unknown) {
  if (isValidStampType(value)) {
    // TypeScript now knows 'value' is StampType
    console.log(`Processing ${value} stamps...`);
    switch (value) {
      case STAMP_TYPES.CURSED:
        console.log("   Special handling for cursed stamps");
        break;
      case STAMP_TYPES.POSH:
        console.log("   Premium processing for posh stamps");
        break;
      default:
        console.log("   Standard processing");
    }
  } else {
    console.log("❌ Invalid stamp type provided");
  }
}

processStampType("posh");
processStampType("invalid");

console.log("\n✨ Type guards are working correctly!");
