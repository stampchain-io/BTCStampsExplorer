// FIXME(20241117 Reainamora): utilize this in the DeployContent to validate potential unicode values
const SUPPORTED_UNICODE_FROM_INDEXER_CODE =
  "\U0001f004\U0001f0cf\U0001f170\U0001f171\U0001f17e\U0001f17f\U0001f18e\U0001f191..."; // (full string)

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

  // Convert Unicode code points to emojis using the supported unicode set
  return tick.replace(/\\u([a-fA-F0-9]{8})/gi, (match, grp) => {
    const codePoint = parseInt(grp, 16);
    if (!isNaN(codePoint) && SUPPORTED_UNICODE.has(codePoint)) {
      return String.fromCodePoint(codePoint);
    }
    return match;
  });
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
