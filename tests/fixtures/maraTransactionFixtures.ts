/**
 * MARA Transaction Test Fixtures
 * Provides mock data and utilities for MARA transaction testing
 */

import type { MARATransactionEstimateConfig } from "$lib/utils/bitcoin/minting/maraTransactionSizeEstimator.ts";

// Common test configurations
export const testConfigurations = {
  minimal: {
    inputs: [{ type: "P2WPKH" as const, isWitness: true }],
    fileSize: 32,
    outputValue: 100,
    includeServiceFee: false,
    includeChangeOutput: false,
    isMaraMode: true,
    maraFeeRate: 10,
  } satisfies MARATransactionEstimateConfig,

  typical: {
    inputs: [
      { type: "P2WPKH" as const, isWitness: true },
      { type: "P2WPKH" as const, isWitness: true },
    ],
    fileSize: 128,
    outputValue: 150,
    includeServiceFee: true,
    serviceFeeType: "P2WPKH" as const,
    includeChangeOutput: true,
    changeOutputType: "P2WPKH" as const,
    isMaraMode: true,
    maraFeeRate: 25,
  } satisfies MARATransactionEstimateConfig,

  complex: {
    inputs: [
      { type: "P2WPKH" as const, isWitness: true },
      { type: "P2PKH" as const, isWitness: false },
      { type: "P2WPKH" as const, isWitness: true },
    ],
    fileSize: 1024,
    outputValue: 200,
    includeServiceFee: true,
    serviceFeeType: "P2PKH" as const,
    includeChangeOutput: true,
    changeOutputType: "P2PKH" as const,
    isMaraMode: true,
    maraFeeRate: 50,
  } satisfies MARATransactionEstimateConfig,

  nonMaraMode: {
    inputs: [{ type: "P2WPKH" as const, isWitness: true }],
    fileSize: 64,
    outputValue: 500, // Above MARA threshold
    includeServiceFee: true,
    serviceFeeType: "P2WPKH" as const,
    includeChangeOutput: true,
    changeOutputType: "P2WPKH" as const,
    isMaraMode: false,
    maraFeeRate: 30,
  } satisfies MARATransactionEstimateConfig,

  highFee: {
    inputs: [{ type: "P2WPKH" as const, isWitness: true }],
    fileSize: 256,
    outputValue: 100,
    includeServiceFee: true,
    serviceFeeType: "P2WPKH" as const,
    includeChangeOutput: true,
    changeOutputType: "P2WPKH" as const,
    isMaraMode: true,
    maraFeeRate: 200,
  } satisfies MARATransactionEstimateConfig,

  largeFile: {
    inputs: Array(5).fill({ type: "P2WPKH" as const, isWitness: true }),
    fileSize: 10000,
    outputValue: 50,
    includeServiceFee: true,
    serviceFeeType: "P2WPKH" as const,
    includeChangeOutput: true,
    changeOutputType: "P2WPKH" as const,
    isMaraMode: true,
    maraFeeRate: 35,
  } satisfies MARATransactionEstimateConfig,
};

// Test file sizes and their expected chunk counts
export const fileSizeTestCases = [
  { size: 0, expectedChunks: 0 },
  { size: 1, expectedChunks: 1 },
  { size: 16, expectedChunks: 1 },
  { size: 32, expectedChunks: 1 },
  { size: 33, expectedChunks: 2 },
  { size: 64, expectedChunks: 2 },
  { size: 96, expectedChunks: 3 },
  { size: 128, expectedChunks: 4 },
  { size: 256, expectedChunks: 8 },
  { size: 512, expectedChunks: 16 },
  { size: 1024, expectedChunks: 32 },
  { size: 10000, expectedChunks: 313 },
];

// Output value validation test cases
export const outputValueTestCases = [
  {
    value: -10,
    isValid: false,
    isMaraMode: false,
    description: "negative value",
  },
  { value: 0, isValid: false, isMaraMode: false, description: "zero value" },
  {
    value: 1,
    isValid: true,
    isMaraMode: true,
    description: "minimum valid value",
  },
  { value: 50, isValid: true, isMaraMode: true, description: "low MARA value" },
  {
    value: 100,
    isValid: true,
    isMaraMode: true,
    description: "typical MARA value",
  },
  {
    value: 329,
    isValid: true,
    isMaraMode: true,
    description: "borderline MARA value",
  },
  {
    value: 330,
    isValid: true,
    isMaraMode: false,
    description: "non-MARA threshold",
  },
  {
    value: 500,
    isValid: true,
    isMaraMode: false,
    description: "typical non-MARA value",
  },
  {
    value: 5000,
    isValid: true,
    isMaraMode: false,
    description: "maximum valid value",
  },
  {
    value: 5001,
    isValid: false,
    isMaraMode: false,
    description: "above maximum",
  },
  {
    value: 10000,
    isValid: false,
    isMaraMode: false,
    description: "well above maximum",
  },
];

// Expected transaction size ranges for validation
export const expectedSizeRanges = {
  minimal: {
    minSize: 100,
    maxSize: 200,
    description: "Single input, no services",
  },
  typical: {
    minSize: 200,
    maxSize: 400,
    description: "Two inputs with services",
  },
  complex: {
    minSize: 300,
    maxSize: 600,
    description: "Mixed inputs, large file",
  },
  largeFile: {
    minSize: 1000,
    maxSize: 5000,
    description: "Large file, many chunks",
  },
};

// Minimum funding test scenarios
export const fundingTestScenarios = [
  {
    name: "Small File MARA",
    config: {
      fileSize: 32,
      outputValue: 100,
      maraFeeRate: 20,
      includeServiceFee: true,
      serviceFeeAmount: 42000,
      estimatedInputCount: 2,
    },
    expectedMinimum: 42000, // At least service fee
  },
  {
    name: "Medium File MARA",
    config: {
      fileSize: 256,
      outputValue: 150,
      maraFeeRate: 30,
      includeServiceFee: true,
      serviceFeeAmount: 42000,
      estimatedInputCount: 3,
    },
    expectedMinimum: 43000, // Service fee + dust + miner fee
  },
  {
    name: "Large File High Fee",
    config: {
      fileSize: 2000,
      outputValue: 50,
      maraFeeRate: 100,
      includeServiceFee: true,
      serviceFeeAmount: 42000,
      estimatedInputCount: 5,
    },
    expectedMinimum: 50000, // Substantial due to large file and high fees
  },
  {
    name: "No Service Fee",
    config: {
      fileSize: 64,
      outputValue: 200,
      maraFeeRate: 25,
      includeServiceFee: false,
      serviceFeeAmount: 0,
      estimatedInputCount: 2,
    },
    expectedMinimum: 500, // Just dust and miner fee
  },
];

// Mock logger for tests
export const createMockLogger = () => ({
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  trace: () => {},
});

// Helper function to create test configurations with overrides
export function createTestConfig(
  baseConfig: keyof typeof testConfigurations,
  overrides: Partial<MARATransactionEstimateConfig> = {},
): MARATransactionEstimateConfig {
  return {
    ...testConfigurations[baseConfig],
    ...overrides,
  };
}

// Validation helper for test results
export function validateTransactionEstimate(estimate: any) {
  const requiredFields = [
    "estimatedSize",
    "estimatedWeight",
    "chunkCount",
    "totalDustValue",
    "estimatedFee",
    "breakdown",
  ];

  const missingFields = requiredFields.filter((field) => !(field in estimate));
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  const breakdownFields = [
    "base",
    "inputs",
    "opReturn",
    "dataOutputs",
    "serviceFee",
    "change",
    "total",
  ];
  const missingBreakdownFields = breakdownFields.filter((field) =>
    !(field in estimate.breakdown)
  );
  if (missingBreakdownFields.length > 0) {
    throw new Error(
      `Missing breakdown fields: ${missingBreakdownFields.join(", ")}`,
    );
  }

  // Validate types
  if (
    typeof estimate.estimatedSize !== "number" || estimate.estimatedSize < 0
  ) {
    throw new Error("estimatedSize must be a non-negative number");
  }

  if (
    typeof estimate.estimatedWeight !== "number" || estimate.estimatedWeight < 0
  ) {
    throw new Error("estimatedWeight must be a non-negative number");
  }

  if (typeof estimate.chunkCount !== "number" || estimate.chunkCount < 0) {
    throw new Error("chunkCount must be a non-negative number");
  }

  if (
    typeof estimate.totalDustValue !== "number" || estimate.totalDustValue < 0
  ) {
    throw new Error("totalDustValue must be a non-negative number");
  }

  if (typeof estimate.estimatedFee !== "number" || estimate.estimatedFee < 0) {
    throw new Error("estimatedFee must be a non-negative number");
  }

  // Validate breakdown totals
  if (estimate.breakdown.total !== estimate.estimatedSize) {
    throw new Error("breakdown.total must equal estimatedSize");
  }

  return true;
}

// Helper to validate minimum funding result
export function validateFundingResult(result: any) {
  const requiredFields = ["minimumFunding", "breakdown"];
  const missingFields = requiredFields.filter((field) => !(field in result));
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  const breakdownFields = [
    "dustTotal",
    "serviceFee",
    "estimatedMinerFee",
    "buffer",
  ];
  const missingBreakdownFields = breakdownFields.filter((field) =>
    !(field in result.breakdown)
  );
  if (missingBreakdownFields.length > 0) {
    throw new Error(
      `Missing breakdown fields: ${missingBreakdownFields.join(", ")}`,
    );
  }

  // Validate funding calculation
  const expectedTotal = result.breakdown.dustTotal +
    result.breakdown.serviceFee +
    result.breakdown.estimatedMinerFee +
    result.breakdown.buffer;

  if (result.minimumFunding !== expectedTotal) {
    throw new Error("minimumFunding must equal sum of breakdown components");
  }

  return true;
}

// Performance test utilities
export const performanceTestCases = [
  {
    name: "Small Transaction",
    config: testConfigurations.minimal,
    maxExecutionTime: 10, // ms
  },
  {
    name: "Typical Transaction",
    config: testConfigurations.typical,
    maxExecutionTime: 20, // ms
  },
  {
    name: "Complex Transaction",
    config: testConfigurations.complex,
    maxExecutionTime: 50, // ms
  },
  {
    name: "Large File Transaction",
    config: testConfigurations.largeFile,
    maxExecutionTime: 100, // ms
  },
];

// Edge case test data
export const edgeCaseInputs = [
  { type: "P2WPKH" as const, isWitness: true },
  { type: "P2PKH" as const, isWitness: false },
  { type: "P2WSH" as const, isWitness: true },
  { type: "P2SH" as const, isWitness: false },
];

export const extremeValues = {
  minFileSize: 0,
  maxFileSize: 1000000, // 1MB
  minOutputValue: 1,
  maxOutputValue: 5000,
  minFeeRate: 1,
  maxFeeRate: 1000,
  maxInputs: 100,
};
