import { assertEquals } from "@std/assert";
import { isValidBitcoinAddress } from "$lib/utils/utxoUtils.ts";

// Note: reverseEndian is not exported, so we'll test the exported functions

Deno.test("isValidBitcoinAddress - validates P2PKH addresses (1...)", () => {
  // Valid P2PKH addresses
  assertEquals(
    isValidBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    true,
  );
  assertEquals(
    isValidBitcoinAddress("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"),
    true,
  );
  assertEquals(
    isValidBitcoinAddress("1CounterpartyXXXXXXXXXXXXXXXUWLpVr"),
    true,
  );

  // Invalid P2PKH addresses
  assertEquals(
    isValidBitcoinAddress("0A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    false,
  ); // Starts with 0 instead of 1
  assertEquals(isValidBitcoinAddress("1"), false);
  assertEquals(isValidBitcoinAddress("1234567890"), false);
  assertEquals(isValidBitcoinAddress("111111111111111111111111"), false); // Too short (24 chars)
});

Deno.test("isValidBitcoinAddress - validates P2SH addresses (3...)", () => {
  // Valid P2SH addresses
  assertEquals(
    isValidBitcoinAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"),
    true,
  );
  assertEquals(
    isValidBitcoinAddress("3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC"),
    true,
  );

  // Invalid P2SH addresses
  assertEquals(
    isValidBitcoinAddress("2J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"),
    false,
  ); // Starts with 2 instead of 3
  assertEquals(isValidBitcoinAddress("3"), false);
  assertEquals(isValidBitcoinAddress("3111111111111111111111111"), false); // Too short
});

Deno.test("isValidBitcoinAddress - validates Bech32 addresses (bc1...)", () => {
  // Valid Bech32 addresses
  assertEquals(
    isValidBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    true,
  );
  assertEquals(
    isValidBitcoinAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"),
    true,
  );
  assertEquals(
    isValidBitcoinAddress(
      "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
    ),
    true,
  ); // P2TR

  // Invalid Bech32 addresses
  assertEquals(
    isValidBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarv"),
    false,
  ); // Too short
  assertEquals(isValidBitcoinAddress("bc1"), false);
  assertEquals(
    isValidBitcoinAddress("bc2qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    false,
  ); // bc2 instead of bc1
  assertEquals(
    isValidBitcoinAddress("bc1rw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    false,
  ); // bc1r instead of bc1q or bc1p
});

Deno.test("isValidBitcoinAddress - rejects invalid formats", () => {
  assertEquals(isValidBitcoinAddress(""), false);
  assertEquals(isValidBitcoinAddress("not-an-address"), false);
  assertEquals(
    isValidBitcoinAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f8b2"),
    false,
  ); // Ethereum address
  assertEquals(
    isValidBitcoinAddress("LKPeZZrJnTZzaGd5aXJft7JZnQ3x8gYJYu"),
    false,
  ); // Litecoin address
  assertEquals(
    isValidBitcoinAddress("2NFrxEjw3v7WYqqGg4rFDCQF9LQ8WgVmJr"),
    false,
  ); // Testnet address
  assertEquals(
    isValidBitcoinAddress("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"),
    false,
  ); // Testnet bech32
});

Deno.test("isValidBitcoinAddress - handles edge cases", () => {
  assertEquals(isValidBitcoinAddress("   "), false);
  assertEquals(
    isValidBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa "),
    false,
  ); // Trailing space
  assertEquals(
    isValidBitcoinAddress(" 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    false,
  ); // Leading space
  assertEquals(
    isValidBitcoinAddress("1A1ZP1EP5QGEFI2DMPTFTL5SLMV7DIVFNA"),
    false,
  ); // Wrong case
});
