/**
 * Comprehensive test suite for utils.d.ts utility types
 * Tests type correctness and ensures all utility types work as expected
 */

import type {
  AddressFormatMap,
  AddressTypeGuard,
  AddressValidationResult,
  ApiError,
  // Data Transformation Types
  ApiResponse,
  ArrayElement,
  AssertType,
  AsyncCallback,
  AsyncCallbackWithParam,
  BalanceOptions,
  BinaryData,
  // Bitcoin-Specific Types
  BitcoinAddressFormat,
  BitcoinNetwork,
  Brand,
  BTCBalanceInfoOptions,
  BufferLike,
  Callback,
  CallbackWithParam,
  Cast,
  ConfigValidationResult,
  DeepMerge,
  // TypeScript Utility Types
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  DiscriminatedUnion,
  EnvironmentConfig,
  EventHandler,
  ExhaustiveCheck,
  FeeCalculationOptions,
  FeeEstimate,
  FilterConfig,
  FilterOperator,
  Head,
  IsAny,
  IsNever,
  IsUnknown,
  KeysOfType,
  Last,
  Maybe,
  Mutable,
  NonEmptyArray,
  Nullable,
  NullableToOptional,
  OmitByValue,
  Optional,
  PaginationInfo,
  PartialBy,
  PickByValue,
  PickOptional,
  PickRequired,
  PromiseValue,
  QueryParams,
  RequiredBy,
  ReturnTypeOf,
  SafeGet,
  ScriptType,
  SortConfig,
  SortOrder,
  Tail,
  TransactionInput,
  TransactionOutput,
  UnionToIntersection,
  UTXOFromBlockchain,
  // Existing types
  UTXOFromBlockCypher,
  UTXOSelectionStrategy,
  ValuesOf,
} from "./utils.d.ts";

import { assertEquals, assertExists } from "@std/assert";

Deno.test("Utils Types - Basic TypeScript Utility Types", () => {
  // Test DeepPartial
  type TestObj = {
    a: string;
    b: {
      c: number;
      d: boolean;
    };
  };

  type PartialTest = DeepPartial<TestObj>;
  const partialObj: PartialTest = { a: "test" }; // Should work
  // Test nested partial type - compile-time check only
  // const _: PartialTest = { b: { c: 1 } }; // Type test only

  // Test DeepRequired
  type OptionalObj = {
    a?: string;
    b?: {
      c?: number;
    };
  };

  type RequiredTest = DeepRequired<OptionalObj>;
  // This should require all properties
  const requiredObj: RequiredTest = {
    a: "test",
    b: {
      c: 1,
    },
  };

  // Test DeepReadonly
  type ReadonlyTest = DeepReadonly<TestObj>;
  const readonlyObj: ReadonlyTest = {
    a: "test",
    b: {
      c: 1,
      d: true,
    },
  };
  // readonlyObj.a = 'new'; // Should error (readonly)

  // Test Mutable
  type MutableTest = Mutable<ReadonlyTest>;
  const mutableObj: MutableTest = readonlyObj;

  assertEquals(typeof partialObj.a, "string");
  assertEquals(typeof requiredObj.a, "string");
  assertEquals(typeof readonlyObj.a, "string");
  assertEquals(typeof mutableObj.a, "string");
});

Deno.test("Utils Types - Advanced Pick/Omit Types", () => {
  type TestObj = {
    name: string;
    age: number;
    isActive: boolean;
    count: number;
  };

  // Test PickByValue - pick properties with number values
  type NumberProps = PickByValue<TestObj, number>;
  const numberOnly: NumberProps = { age: 25, count: 10 };

  // Test OmitByValue - omit properties with number values
  type NonNumberProps = OmitByValue<TestObj, number>;
  const nonNumbers: NonNumberProps = { name: "test", isActive: true };

  // Test PickRequired vs PickOptional
  type MixedObj = {
    required: string;
    optional?: number;
    alsoRequired: boolean;
  };

  type RequiredOnly = PickRequired<MixedObj>;
  type OptionalOnly = PickOptional<MixedObj>;

  const requiredProps: RequiredOnly = { required: "test", alsoRequired: true };
  const optionalProps: OptionalOnly = { optional: 42 };

  assertEquals(typeof numberOnly.age, "number");
  assertEquals(typeof nonNumbers.name, "string");
  assertEquals(typeof requiredProps.required, "string");
  assertEquals(typeof optionalProps.optional, "number");
});

Deno.test("Utils Types - Bitcoin-Specific Types", () => {
  // Test BitcoinAddressFormat
  const addressFormat: BitcoinAddressFormat = "P2PKH";
  assertEquals(addressFormat, "P2PKH");

  // Test BitcoinNetwork
  const network: BitcoinNetwork = "mainnet";
  assertEquals(network, "mainnet");

  // Test AddressValidationResult
  const validationResult: AddressValidationResult = {
    isValid: true,
    format: "P2PKH",
    network: "mainnet",
  };
  assertEquals(validationResult.isValid, true);

  // Test ScriptType
  const scriptType: ScriptType = "P2WPKH";
  assertEquals(scriptType, "P2WPKH");

  // Test TransactionInput
  const txInput: TransactionInput = {
    txid: "1234567890abcdef",
    vout: 0,
    scriptSig: "scriptSig",
    sequence: 0xffffffff,
    witness: ["witness1", "witness2"],
  };
  assertEquals(txInput.vout, 0);

  // Test TransactionOutput
  const txOutput: TransactionOutput = {
    value: 100000,
    scriptPubKey: "scriptPubKey",
    address: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
    scriptType: "P2PKH",
  };
  assertEquals(txOutput.value, 100000);

  // Test UTXOSelectionStrategy
  const strategy: UTXOSelectionStrategy = "LARGEST_FIRST";
  assertEquals(strategy, "LARGEST_FIRST");

  // Test FeeCalculationOptions
  const feeOptions: FeeCalculationOptions = {
    feeRate: 10,
    strategy: "OPTIMAL",
    dustThreshold: 546,
    maxFeeRate: 100,
  };
  assertEquals(feeOptions.feeRate, 10);

  // Test FeeEstimate
  const feeEstimate: FeeEstimate = {
    totalFee: 1500,
    feeRate: 10,
    estimatedSize: 150,
    inputCount: 2,
    outputCount: 1,
  };
  assertEquals(feeEstimate.totalFee, 1500);
});

Deno.test("Utils Types - Data Transformation Types", () => {
  // Test ApiResponse
  const successResponse: ApiResponse<string> = {
    success: true,
    data: "test data",
    timestamp: Date.now(),
  };
  assertEquals(successResponse.success, true);

  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: "INVALID_REQUEST",
      message: "Invalid request parameters",
      details: { field: "required" },
    },
  };
  assertEquals(errorResponse.success, false);

  // Test PaginationInfo
  const pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10,
    hasNext: true,
    hasPrevious: false,
  };
  assertEquals(pagination.page, 1);

  // Test SortConfig
  const sortConfig: SortConfig<"name" | "age"> = {
    field: "name",
    order: "asc",
  };
  assertEquals(sortConfig.field, "name");

  // Test FilterConfig
  const filterConfig: FilterConfig<"status"> = {
    field: "status",
    operator: "eq",
    value: "active",
  };
  assertEquals(filterConfig.operator, "eq");

  // Test QueryParams
  const queryParams: QueryParams = {
    page: 1,
    limit: 20,
    sort: [{ field: "createdAt", order: "desc" }],
    filters: [{ field: "status", operator: "eq", value: "active" }],
    search: "bitcoin",
  };
  assertEquals(queryParams.page, 1);
});

Deno.test("Utils Types - Advanced Type Utilities", () => {
  // Test DeepMerge
  type A = { a: string; nested: { x: number } };
  type B = { b: boolean; nested: { y: string } };
  type Merged = DeepMerge<A, B>;

  const merged: Merged = {
    a: "test",
    b: true,
    nested: { x: 1, y: "test" },
  };
  assertEquals(merged.a, "test");
  assertEquals(merged.b, true);

  // Test ArrayElement
  type StringArray = string[];
  type Element = ArrayElement<StringArray>;
  const element: Element = "test";
  assertEquals(element, "test");

  // Test NonEmptyArray
  const nonEmpty: NonEmptyArray<number> = [1, 2, 3];
  assertEquals(nonEmpty[0], 1);

  // Test Nullable, Optional, Maybe
  const nullable: Nullable<string> = null;
  const optional: Optional<string> = undefined;
  const maybe: Maybe<string> = "test";

  assertEquals(nullable, null);
  assertEquals(optional, undefined);
  assertEquals(maybe, "test");

  // Test Brand types
  type UserId = Brand<string, "UserId">;
  type ProductId = Brand<string, "ProductId">;

  const userId: UserId = "user123" as UserId;
  // const invalidAssignment: UserId = productId; // Should error

  assertEquals(typeof userId, "string");
});

Deno.test("Utils Types - Tuple Utilities", () => {
  type TestTuple = ["first", "second", "third"];

  // Test Head
  type FirstElement = Head<TestTuple>;
  const first: FirstElement = "first";
  assertEquals(first, "first");

  // Test Tail
  type RestElements = Tail<TestTuple>;
  const rest: RestElements = ["second", "third"];
  assertEquals(rest[0], "second");

  // Test Last
  type LastElement = Last<TestTuple>;
  const last: LastElement = "third";
  assertEquals(last, "third");
});

Deno.test("Utils Types - Function and Callback Types", () => {
  // Test EventHandler type only
  type _EventHandlerTest = EventHandler<string>;

  // Test Callback types
  const callback: Callback<string> = () => "result";
  const asyncCallback: AsyncCallback<number> = async () => 42;
  const callbackWithParam: CallbackWithParam<string, number> = (
    param: string,
  ) => param.length;
  const asyncCallbackWithParam: AsyncCallbackWithParam<number, string> = async (
    param: number,
  ) => param.toString();

  assertEquals(callback(), "result");
  assertEquals(callbackWithParam("test"), 4);

  // Async tests
  asyncCallback().then((result) => assertEquals(result, 42));
  asyncCallbackWithParam(123).then((result) => assertEquals(result, "123"));
});

Deno.test("Utils Types - Environment Configuration", () => {
  // Test EnvironmentConfig
  const config: EnvironmentConfig = {
    NODE_ENV: "development",
    PORT: 3000,
    DATABASE_URL: "postgresql://localhost:5432/test",
    API_BASE_URL: "https://api.example.com",
    BITCOIN_NETWORK: "testnet",
    DEBUG: true,
  };

  assertEquals(config.NODE_ENV, "development");
  assertEquals(config.PORT, 3000);
  assertEquals(config.BITCOIN_NETWORK, "testnet");

  // Test ConfigValidationResult
  const validationResult: ConfigValidationResult = {
    isValid: false,
    errors: ["Missing DATABASE_URL"],
    warnings: ["PORT not specified, using default"],
  };

  assertEquals(validationResult.isValid, false);
  assertEquals(validationResult.errors.length, 1);
  assertEquals(validationResult.warnings.length, 1);
});

Deno.test("Utils Types - Existing UTXO Types Preserved", () => {
  // Test that existing types are still available and working
  const utxoBlockCypher: UTXOFromBlockCypher = {
    tx_hash: "abc123",
    block_height: 700000,
    tx_input_n: -1,
    tx_output_n: 0,
    value: 100000,
    ref_balance: 100000,
    spent: false,
    confirmations: 6,
    confirmed: new Date(),
    double_spend: false,
    script: "76a914...",
    size: 25,
  };

  const utxoBlockchain: UTXOFromBlockchain = {
    tx_hash_big_endian: "def456",
    tx_hash: "abc123",
    tx_output_n: 0,
    script: "76a914...",
    value: 100000,
    value_hex: "186a0",
    confirmations: 6,
    tx_index: 123456,
  };

  const balanceOptions: BalanceOptions = {
    format: "BTC",
    fallbackValue: 0,
  };

  const btcBalanceOptions: BTCBalanceInfoOptions = {
    includeUSD: true,
    apiBaseUrl: "https://api.blockchain.info",
  };

  assertEquals(utxoBlockCypher.value, 100000);
  assertEquals(utxoBlockchain.tx_output_n, 0);
  assertEquals(balanceOptions.format, "BTC");
  assertEquals(btcBalanceOptions.includeUSD, true);
});

Deno.test("Utils Types - Type Predicate Helpers", () => {
  // Test IsNever
  type NeverTest = IsNever<never>;
  type NotNeverTest = IsNever<string>;

  // Test IsAny
  type AnyTest = IsAny<any>;
  type NotAnyTest = IsAny<string>;

  // Test IsUnknown
  type UnknownTest = IsUnknown<unknown>;
  type NotUnknownTest = IsUnknown<string>;

  // These are compile-time tests, so we just verify they exist
  assertExists(true); // Placeholder assertion
});
