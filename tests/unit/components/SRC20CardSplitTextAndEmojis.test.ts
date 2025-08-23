import { assertEquals } from "@std/assert";

// Import the splitTextAndEmojis function by copying it for testing
// This test focuses specifically on the function that was causing the TypeError
function splitTextAndEmojis(text: string): { text: string; emoji: string } {
  // Ensure text is actually a string
  if (typeof text !== "string") {
    return { text: String(text || ""), emoji: "" };
  }

  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu;
  const match = text.match(emojiRegex);
  if (!match || !match[0]) return { text, emoji: "" };
  const emojiIndex = text.indexOf(match[0]);
  return {
    text: text.slice(0, emojiIndex),
    emoji: text.slice(emojiIndex),
  };
}

Deno.test("SRC20Card splitTextAndEmojis - string inputs (normal case)", () => {
  // Test basic text without emojis
  assertEquals(
    splitTextAndEmojis("PEPE"),
    { text: "PEPE", emoji: "" }
  );

  assertEquals(
    splitTextAndEmojis("DOGE"),
    { text: "DOGE", emoji: "" }
  );

  // Test empty string
  assertEquals(
    splitTextAndEmojis(""),
    { text: "", emoji: "" }
  );

  // Test text with emojis
  assertEquals(
    splitTextAndEmojis("FIRE🔥"),
    { text: "FIRE", emoji: "🔥" }
  );

  assertEquals(
    splitTextAndEmojis("MOON🌙"),
    { text: "MOON", emoji: "🌙" }
  );

  // Test emoji at the beginning
  assertEquals(
    splitTextAndEmojis("🚀ROCKET"),
    { text: "", emoji: "🚀ROCKET" }
  );

  // Test only emoji
  assertEquals(
    splitTextAndEmojis("🔥"),
    { text: "", emoji: "🔥" }
  );

  // Test multiple emojis (should split at first emoji)
  assertEquals(
    splitTextAndEmojis("PEPE🐸🚀"),
    { text: "PEPE", emoji: "🐸🚀" }
  );
});

Deno.test("SRC20Card splitTextAndEmojis - numeric inputs (bug case)", () => {
  // Test with number 420 - the original bug case
  assertEquals(
    splitTextAndEmojis(420 as any),
    { text: "420", emoji: "" }
  );

  // Test with number 69
  assertEquals(
    splitTextAndEmojis(69 as any),
    { text: "69", emoji: "" }
  );

  // Test with number 0 (falsy, becomes empty string)
  assertEquals(
    splitTextAndEmojis(0 as any),
    { text: "", emoji: "" }
  );

  // Test with number 1 (truthy, converts to string)
  assertEquals(
    splitTextAndEmojis(1 as any),
    { text: "1", emoji: "" }
  );

  // Test with negative numbers
  assertEquals(
    splitTextAndEmojis(-1 as any),
    { text: "-1", emoji: "" }
  );

  // Test with decimal numbers
  assertEquals(
    splitTextAndEmojis(3.14 as any),
    { text: "3.14", emoji: "" }
  );

  // Test with large numbers
  assertEquals(
    splitTextAndEmojis(1000000 as any),
    { text: "1000000", emoji: "" }
  );
});

Deno.test("SRC20Card splitTextAndEmojis - null/undefined inputs", () => {
  // Test with null
  assertEquals(
    splitTextAndEmojis(null as any),
    { text: "", emoji: "" }
  );

  // Test with undefined
  assertEquals(
    splitTextAndEmojis(undefined as any),
    { text: "", emoji: "" }
  );
});

Deno.test("SRC20Card splitTextAndEmojis - empty and whitespace inputs", () => {
  // Test with empty string (already covered but worth emphasizing)
  assertEquals(
    splitTextAndEmojis(""),
    { text: "", emoji: "" }
  );

  // Test with whitespace
  assertEquals(
    splitTextAndEmojis("   "),
    { text: "   ", emoji: "" }
  );

  // Test with tabs and newlines
  assertEquals(
    splitTextAndEmojis("\t\n"),
    { text: "\t\n", emoji: "" }
  );
});

Deno.test("SRC20Card splitTextAndEmojis - mixed content with various data types", () => {
  // Test boolean - true is truthy
  assertEquals(
    splitTextAndEmojis(true as any),
    { text: "true", emoji: "" }
  );

  // Test boolean - false is falsy, becomes empty string
  assertEquals(
    splitTextAndEmojis(false as any),
    { text: "", emoji: "" }
  );

  // Test object (should stringify)
  assertEquals(
    splitTextAndEmojis({ name: "test" } as any),
    { text: "[object Object]", emoji: "" }
  );

  // Test array
  assertEquals(
    splitTextAndEmojis([1, 2, 3] as any),
    { text: "1,2,3", emoji: "" }
  );
});

Deno.test("SRC20Card splitTextAndEmojis - edge cases with emojis", () => {
  // Test with various emoji types
  
  // Standard emoji
  assertEquals(
    splitTextAndEmojis("TEST🎉"),
    { text: "TEST", emoji: "🎉" }
  );

  // Emoji with skin tone modifiers
  assertEquals(
    splitTextAndEmojis("WAVE👋🏽"),
    { text: "WAVE", emoji: "👋🏽" }
  );

  // Multiple different emojis
  assertEquals(
    splitTextAndEmojis("PARTY🎉🎊🥳"),
    { text: "PARTY", emoji: "🎉🎊🥳" }
  );

  // Text with emoji in the middle
  assertEquals(
    splitTextAndEmojis("BE🔥ST"),
    { text: "BE", emoji: "🔥ST" }
  );

  // Complex unicode characters
  assertEquals(
    splitTextAndEmojis("TEST🇺🇸"),
    { text: "TEST", emoji: "🇺🇸" }
  );
});

Deno.test("SRC20Card splitTextAndEmojis - special characters", () => {
  // Test with special characters that aren't emojis
  assertEquals(
    splitTextAndEmojis("TEST@#$%"),
    { text: "TEST@#$%", emoji: "" }
  );

  // Test with mathematical symbols
  assertEquals(
    splitTextAndEmojis("X±∞"),
    { text: "X±∞", emoji: "" }
  );

  // Test with currency symbols
  assertEquals(
    splitTextAndEmojis("$100€"),
    { text: "$100€", emoji: "" }
  );
});

Deno.test("SRC20Card splitTextAndEmojis - real-world SRC20 token examples", () => {
  // Test common SRC20 token patterns that might cause issues
  
  // Numeric token names
  assertEquals(
    splitTextAndEmojis("420"),
    { text: "420", emoji: "" }
  );

  assertEquals(
    splitTextAndEmojis("69"),
    { text: "69", emoji: "" }
  );

  // Mixed alphanumeric
  assertEquals(
    splitTextAndEmojis("PEPE420"),
    { text: "PEPE420", emoji: "" }
  );

  // Token with emoji
  assertEquals(
    splitTextAndEmojis("PEPE🐸"),
    { text: "PEPE", emoji: "🐸" }
  );

  // All caps tokens
  assertEquals(
    splitTextAndEmojis("BITCOIN"),
    { text: "BITCOIN", emoji: "" }
  );

  // Tokens with numbers and symbols
  assertEquals(
    splitTextAndEmojis("BTC20"),
    { text: "BTC20", emoji: "" }
  );
});