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
 * Converts an emoji character or string containing emoji to its Unicode escape sequence representation.
 * Example: "🧧" -> "\U0001F9E7"
 * @param emoji The emoji character or string containing emoji to convert
 * @returns The Unicode escape sequence representation
 */
export function emojiToUnicodeEscape(emoji: string): string {
  if (!emoji) {
    return emoji;
  }

  try {
    // Split the string into an array of characters/emojis
    const chars = Array.from(emoji);

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
    const result = converted.join("");
    return result;
  } catch (_error) {
    return emoji;
  }
}

/**
 * Converts a Unicode escape sequence back to its emoji character representation.
 * Example: "\U0001F9E7" -> "🧧"
 * Supports both uppercase (\U0001F9E7) and lowercase (\u{1F9E7}) formats
 * @param unicodeStr The Unicode escape sequence to convert
 * @returns The emoji character representation
 */
export function unicodeEscapeToEmoji(unicodeStr: string): string {
  // Check if the string is already a supported emoji
  if (SUPPORTED_EMOJI_PATTERN.test(unicodeStr)) {
    return unicodeStr;
  }

  // First try to match 8-digit uppercase format: \U0001f525
  let result = unicodeStr.replace(/\\U([0-9a-fA-F]{8})/g, (match, grp) => {
    const codePoint = parseInt(grp, 16);
    try {
      return String.fromCodePoint(codePoint);
    } catch (_error) {
      return match;
    }
  });

  // If no change and it's lowercase format, try that
  if (result === unicodeStr) {
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

/**
 * @deprecated Use emojiToUnicodeEscape instead.
 * This function converts emoji characters to Unicode escape sequences for database storage.
 */
export const convertEmojiToTick = emojiToUnicodeEscape;

/**
 * @deprecated Use unicodeEscapeToEmoji instead.
 * This function converts Unicode escape sequences back to emoji characters for display.
 */
export const convertToEmoji = unicodeEscapeToEmoji;
