import {
  bigIntReviver,
  bigIntSerializer,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { assertEquals } from "@std/assert";
import { describe, it } from "jsr:@std/testing@1.0.14/bdd";

describe("BigInt Serialization and Deserialization", () => {
  it("should serialize BigInt values correctly", () => {
    const testObj = {
      normalNumber: 42,
      bigIntValue: BigInt("123456789012345678901234567890"),
      smallBigInt: BigInt("100"),
      string: "hello",
      nested: {
        bigIntInNested: BigInt("999999999999999999999"),
        normalValue: "test",
      },
    };

    const serialized = JSON.stringify(testObj, bigIntSerializer);

    // Should contain the BigInt serialization format
    const parsed = JSON.parse(serialized);

    // Check that BigInt values are serialized as objects with __type
    assertEquals(parsed.bigIntValue.__type, "BigInt");
    assertEquals(parsed.bigIntValue.value, "123456789012345678901234567890");
    assertEquals(parsed.smallBigInt.__type, "BigInt");
    assertEquals(parsed.smallBigInt.value, "100");
    assertEquals(parsed.nested.bigIntInNested.__type, "BigInt");
    assertEquals(parsed.nested.bigIntInNested.value, "999999999999999999999");

    // Non-BigInt values should remain unchanged
    assertEquals(parsed.normalNumber, 42);
    assertEquals(parsed.string, "hello");
    assertEquals(parsed.nested.normalValue, "test");
  });

  it("should deserialize BigInt values correctly", () => {
    const testObj = {
      normalNumber: 42,
      bigIntValue: BigInt("123456789012345678901234567890"),
      smallBigInt: BigInt("100"),
      string: "hello",
      nested: {
        bigIntInNested: BigInt("999999999999999999999"),
        normalValue: "test",
      },
    };

    // Serialize then deserialize
    const serialized = JSON.stringify(testObj, bigIntSerializer);
    const deserialized = JSON.parse(serialized, bigIntReviver);

    // BigInt values should be restored
    assertEquals(
      deserialized.bigIntValue,
      BigInt("123456789012345678901234567890"),
    );
    assertEquals(deserialized.smallBigInt, BigInt("100"));
    assertEquals(
      deserialized.nested.bigIntInNested,
      BigInt("999999999999999999999"),
    );

    // Non-BigInt values should remain unchanged
    assertEquals(deserialized.normalNumber, 42);
    assertEquals(deserialized.string, "hello");
    assertEquals(deserialized.nested.normalValue, "test");
  });

  it("should handle arrays with BigInt values", () => {
    const testArray = [
      BigInt("111111111111111111111"),
      42,
      "string",
      {
        bigIntProp: BigInt("222222222222222222222"),
        normalProp: "value",
      },
    ];

    const serialized = JSON.stringify(testArray, bigIntSerializer);
    const deserialized = JSON.parse(serialized, bigIntReviver);

    assertEquals(deserialized[0], BigInt("111111111111111111111"));
    assertEquals(deserialized[1], 42);
    assertEquals(deserialized[2], "string");
    assertEquals(deserialized[3].bigIntProp, BigInt("222222222222222222222"));
    assertEquals(deserialized[3].normalProp, "value");
  });

  it("should handle edge cases gracefully", () => {
    const testObj = {
      zeroBigInt: BigInt("0"),
      negativeBigInt: BigInt("-123456789012345678901234567890"),
      normalZero: 0,
      nullValue: null,
      undefinedValue: undefined,
    };

    const serialized = JSON.stringify(testObj, bigIntSerializer);
    const deserialized = JSON.parse(serialized, bigIntReviver);

    assertEquals(deserialized.zeroBigInt, BigInt("0"));
    assertEquals(
      deserialized.negativeBigInt,
      BigInt("-123456789012345678901234567890"),
    );
    assertEquals(deserialized.normalZero, 0);
    assertEquals(deserialized.nullValue, null);
    assertEquals(deserialized.undefinedValue, undefined);
  });

  it("should handle invalid BigInt serialization gracefully", () => {
    // Test with manually created invalid BigInt object
    const invalidBigIntObj = {
      __type: "BigInt",
      value: "invalid_number",
    };

    const serialized = JSON.stringify(invalidBigIntObj);
    const deserialized = JSON.parse(serialized, bigIntReviver);

    // Should return the original string value if BigInt conversion fails
    assertEquals(deserialized, "invalid_number");
  });

  it("should preserve existing string-based BigInt parsing", () => {
    // Test the fallback behavior for existing cached data
    const stringBigInt = "123456789012345678901234567890";
    const smallString = "42";

    const parsedLarge = JSON.parse(`"${stringBigInt}"`, bigIntReviver);
    const parsedSmall = JSON.parse(`"${smallString}"`, bigIntReviver);

    // Large numbers should become BigInt
    assertEquals(parsedLarge, BigInt(stringBigInt));

    // Small numbers should remain as numbers
    assertEquals(parsedSmall, 42);
  });
});
