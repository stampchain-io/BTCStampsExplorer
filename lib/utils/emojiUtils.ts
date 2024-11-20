import { SUPPORTED_UNICODE_FROM_INDEXER_CODE } from "$lib/utils/constants.ts";
// Format the unicode string and create a Set of supported emoji code points
const formattedString =
  SUPPORTED_UNICODE_FROM_INDEXER_CODE.replace(/U/g, "\\u{") + "}";
const emojiCodePoints = formattedString.split("}{").map((emoji) =>
  emoji.replace("\\u{", "").replace("}", "")
);

// Create Set of supported emoji code points for validation
export const SUPPORTED_UNICODE = new Set(
  emojiCodePoints.map((code) => parseInt(code, 16)),
);

// Create regex pattern from supported unicode points
const SUPPORTED_EMOJI_PATTERN = new RegExp(
  `^[${SUPPORTED_UNICODE_FROM_INDEXER_CODE.replace(/U/g, "\\u")}]+$`,
  "u",
);

/**
 * Converts a tick string to its emoji representation using supported unicode points
 */
export function convertToEmoji(tick: string): string {
  // Check if the string is already a supported emoji
  if (SUPPORTED_EMOJI_PATTERN.test(tick)) {
    return tick;
  }

  // First try to match 8-digit uppercase format: \U0001f525
  let result = tick.replace(/\\U([0-9a-fA-F]{8})/g, (match, grp) => {
    const codePoint = parseInt(grp, 16);
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return match;
    }
  });

  // If no change and it's lowercase format, try that
  if (result === tick) {
    result = result.replace(/\\u([0-9a-fA-F]{4,8})/g, (match, grp) => {
      const codePoint = parseInt(grp, 16);
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    });
  }

  return result;
}

// Utility function to convert emoji to Unicode escape sequence
export function emojiToUnicode(input: string): string {
  if (!input) return input;

  try {
    // Split the string into an array of characters/emojis
    const chars = Array.from(input);

    // Map through each character, only convert if it's an emoji
    const converted = chars.map((char) => {
      // Check if it's an emoji (surrogate pair)
      if (/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(char)) {
        const codePoint = char.codePointAt(0);
        if (!codePoint) return char;
        // Convert to uppercase hex and pad to 8 digits
        return `\\U${codePoint.toString(16).toUpperCase().padStart(8, "0")}`;
      }
      return char;
    });

    // Join the characters back together
    return converted.join("");
  } catch {
    return input;
  }
}
/**
 * Converts an emoji to its tick representation using supported unicode points
 */
export function convertEmojiToTick(str: string): string {
  str = decodeURIComponent(str);
  let result = "";

  for (const char of str) {
    if (char.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/)) {
      const codePoint = char.codePointAt(0);
      if (codePoint && SUPPORTED_UNICODE.has(codePoint)) {
        result += "\\\\u" + codePoint.toString(16).padStart(8, "0");
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}

// Test cases
/*
// You can uncomment and run these tests:
const testCases = [
  "\\U0001f525",  // Fire emoji uppercase
  "\\u0001f525",  // Fire emoji lowercase
  "\\u1f525",     // Fire emoji shortened
  "\\U0001f600",  // Grinning face
  "\\u1f600",     // Grinning face shortened
  "invalid",      // Invalid input
];

testCases.forEach(test => {
  console.log(`Input: ${test}`);
  console.log(`Output: ${convertToEmoji(test)}`);
  console.log('---');
});
*/

// Test directly
// console.log("Test conversion:");
// console.log("\\U0001f525 ->", convertToEmoji("\\U0001f525")); // Should show 🔥
