/**
 * HTML cleanup utility for Cloudflare Rocket Loader demangling.
 *
 * When HTML stamps are served through Cloudflare's CDN, Rocket Loader
 * mangles script tags (adding hex-prefixed type attributes, defer, data-cf-*
 * attributes, and injecting its own loader script). This function reverses
 * all those transformations so the HTML renders correctly in Chrome/Puppeteer.
 *
 * Extracted from sharedContentHandler.ts for reuse by both the /content/
 * route (SSR) and the preview renderer (Chrome screenshot).
 */

/**
 * Clean HTML content by reversing Cloudflare Rocket Loader transformations.
 *
 * Handles two categories of cleanup:
 * 1. Dudko script extraction — moves inline stamp config variables to <head>
 * 2. Rocket Loader reversal — fixes mangled script type attributes, removes
 *    injected cdn-cgi scripts, cleans up data-cf-* attributes
 *
 * @param htmlContent Raw HTML string fetched from CDN
 * @returns Cleaned HTML string safe for rendering
 */
export function cleanHtmlForRendering(htmlContent: string): string {
  let cleaned = htmlContent;

  // --- Dudko script extraction ---
  // Some HTML stamps define a dudko array, maxWidth, maxHeight, backgroundColor
  // in a single inline <script>. Extract these values and inject them as
  // window.* globals in <head> so they're available before any other scripts run.

  const dudkoScriptRegex =
    /(\s*<script[^>]*>\s*let\s+dudko\s*=\s*)(\[.*\])(\s*,\s*maxWidth\s*=\s*)(\d+)(\s*,\s*maxHeight\s*=\s*)(\d+)(\s*,\s*backgroundColor\s*=\s*['"])([0-9a-fA-F]{3,8})(['"]\s*;?\s*<\/script>)/is;
  const dudkoMatch = cleaned.match(dudkoScriptRegex);

  if (dudkoMatch) {
    const originalFullScriptTag = dudkoMatch[0];
    const dudkoArrayDefinition = dudkoMatch[2];
    const maxWidthValue = dudkoMatch[4];
    const maxHeightValue = dudkoMatch[6];
    const backgroundColorValue = dudkoMatch[8];

    const newHeadScriptContent =
      `window.maxWidth=${maxWidthValue}; window.maxHeight=${maxHeightValue}; window.backgroundColor='${backgroundColorValue}'; let dudko=${dudkoArrayDefinition};`;
    const newHeadScriptTag = `<script>${newHeadScriptContent}</script>`;

    // Remove the original script tag from its place
    cleaned = cleaned.replace(originalFullScriptTag, "");

    // Prepend the new script to the head
    cleaned = cleaned.replace(
      /(<head[^>]*>)/i,
      `$1${newHeadScriptTag}`,
    );
  } else {
    // Fallback: try broader regex for dudko scripts with different formatting
    const inlineScriptRegex =
      /<script[^>]*>\s*let\s+dudko\s*=\s*.*?,\s*maxWidth\s*=\s*(\d+),\s*maxHeight\s*=\s*(\d+),\s*backgroundColor\s*=\s*'([0-9a-fA-F]{3,8})';?\s*<\/script>/is;
    const matchResult = cleaned.match(inlineScriptRegex);
    if (matchResult && matchResult.length === 4) {
      const [
        ,
        extractedMaxWidth,
        extractedMaxHeight,
        extractedBgColor,
      ] = matchResult;
      const injectionScript =
        `<script>window.maxWidth=${extractedMaxWidth}; window.maxHeight=${extractedMaxHeight}; window.backgroundColor='${extractedBgColor}';</script>`;
      cleaned = cleaned.replace(
        /(<head[^>]*>)/i,
        `$1${injectionScript}`,
      );
    }
  }

  // --- Cloudflare Rocket Loader fixes ---

  // Step 1: Fix ALL script tags — remove any Cloudflare mangling
  cleaned = cleaned.replace(
    /(<script[^>]*?)>/g,
    (_match, openingTagInnerContentAndAttributes) => {
      let tag = openingTagInnerContentAndAttributes;

      // Remove ALL Cloudflare type manglings — any hex prefix before -text/javascript
      tag = tag.replace(
        /type\s*=\s*"[a-f0-9]+-text\/javascript"/gi,
        'type="text/javascript"',
      );

      // Remove data-cf-settings attributes that Cloudflare adds
      tag = tag.replace(
        /data-cf-settings\s*=\s*"[^"]*"/gi,
        "",
      );

      // Remove defer attributes from rocket-loader scripts
      tag = tag.replace(
        /\s+defer(?:\s*=\s*["']?defer["']?)?/gi,
        "",
      );

      // Add data-cfasync="false" to prevent any Rocket Loader processing
      // but not for cdn-cgi scripts which we'll remove entirely
      if (
        !tag.includes("data-cfasync") && !tag.includes("/cdn-cgi/")
      ) {
        tag += ' data-cfasync="false"';
      }

      return tag + ">";
    },
  );

  // Step 2: Remove ALL Cloudflare Rocket Loader injected script tags
  cleaned = cleaned.replace(
    /<script[^>]*\/cdn-cgi\/scripts\/[^>]*rocket-loader[^>]*>[^<]*<\/script>/gi,
    "",
  );

  // Also remove any script with mangled type that loads rocket-loader
  cleaned = cleaned.replace(
    /<script[^>]*type="[a-f0-9]{8,}-text\/javascript"[^>]*src="[^"]*rocket-loader[^"]*"[^>]*><\/script>/gi,
    "",
  );

  // Step 3: Remove any remaining Cloudflare Rocket Loader references
  cleaned = cleaned.replace(
    /data-cf-beacon=["'][^"']*["']/gi,
    "",
  );

  // Step 4: Clean up any malformed script src attributes with encoded quotes
  cleaned = cleaned.replace(
    /src=["']([^"']*%22[^"']*)["']/gi,
    (_match, srcValue) => {
      const cleanSrc = srcValue.replace(/%22/g, "");
      return `src="${cleanSrc}"`;
    },
  );

  return cleaned;
}
