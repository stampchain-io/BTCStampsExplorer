import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { logger } from "$lib/utils/logger.ts";
import {
  getIdentifierType,
  isCpid,
  isTxHash,
} from "$lib/utils/identifierUtils.ts";
import { WebResponseUtil } from "$lib/utils/webResponseUtil.ts";
import { FreshContext } from "$fresh/server.ts";
import { normalizeHeaders } from "$lib/utils/headerUtils.ts";
import { getRecursiveHeaders } from "$lib/utils/securityHeaders.ts";

// Define the state type
export interface State {
  baseUrl: string;
}

export async function handleContentRequest(
  identifier: string,
  ctx: FreshContext<State>,
) {
  logger.debug("content", {
    message: "Content request received",
    identifier,
    path: ctx.url.pathname,
    baseUrl: ctx.state.baseUrl,
    env: Deno.env.get("DENO_ENV"),
  });

  const isFullPath = identifier.includes(".") || ctx.url.pathname.includes(".");

  try {
    // Validate identifier based on path type
    if (!isFullPath) {
      const idType = getIdentifierType(identifier);
      const isValidId = isCpid(identifier) ||
        idType === "tx_hash" ||
        idType === "stamp_hash";

      if (!isValidId) {
        logger.debug("content", {
          message: "Invalid identifier",
          identifier,
          idType,
        });
        return WebResponseUtil.stampNotFound();
      }
    } else {
      // Extract the base identifier without extension
      const [id] = identifier.split(".");
      if (!isTxHash(id)) {
        return WebResponseUtil.stampNotFound();
      }
    }

    const response = await StampController.getStampFile(
      identifier,
      RouteType.STAMP_DETAIL,
      ctx.state.baseUrl,
      isFullPath,
    );

    if (
      response.headers.get("content-type")?.toLowerCase().includes("html")
    ) {
      let htmlContent = await response.text();

      // Regex to find the specific inline script and capture its parts
      const dudkoScriptRegex =
        /(\s*<script[^>]*>\s*let\s+dudko\s*=\s*)(\[.*\])(\s*,\s*maxWidth\s*=\s*)(\d+)(\s*,\s*maxHeight\s*=\s*)(\d+)(\s*,\s*backgroundColor\s*=\s*['"])([0-9a-fA-F]{3,8})(['"]\s*;?\s*<\/script>)/is;
      const dudkoMatch = htmlContent.match(dudkoScriptRegex);

      if (dudkoMatch) {
        const originalFullScriptTag = dudkoMatch[0];
        const dudkoArrayDefinition = dudkoMatch[2]; // Capture dudko array string
        const maxWidthValue = dudkoMatch[4];
        const maxHeightValue = dudkoMatch[6];
        const backgroundColorValue = dudkoMatch[8];

        // Construct the new script content for the head
        const newHeadScriptContent =
          `window.maxWidth=${maxWidthValue}; window.maxHeight=${maxHeightValue}; window.backgroundColor='${backgroundColorValue}'; let dudko=${dudkoArrayDefinition};`;
        const newHeadScriptTag = `<script>${newHeadScriptContent}</script>`;

        // Remove the original script tag from its place
        htmlContent = htmlContent.replace(originalFullScriptTag, "");

        // Prepend the new script to the head
        htmlContent = htmlContent.replace(
          /(<head[^>]*>)/i,
          `$1${newHeadScriptTag}`,
        );
      } else {
        // Fallback or logging if the specific dudko script isn't found, try previous broader injection
        const inlineScriptRegex =
          /<script[^>]*>\s*let\s+dudko\s*=\s*.*?,\s*maxWidth\s*=\s*(\d+),\s*maxHeight\s*=\s*(\d+),\s*backgroundColor\s*=\s*'([0-9a-fA-F]{3,8})';?\s*<\/script>/is;
        const matchResult = htmlContent.match(inlineScriptRegex);
        if (matchResult && matchResult.length === 4) {
          const [, extractedMaxWidth, extractedMaxHeight, extractedBgColor] =
            matchResult;
          const injectionScript =
            `<script>window.maxWidth=${extractedMaxWidth}; window.maxHeight=${extractedMaxHeight}; window.backgroundColor='${extractedBgColor}';</script>`;
          htmlContent = htmlContent.replace(
            /(<head[^>]*>)/i,
            `$1${injectionScript}`,
          );
        }
      }

      // Step 1: Ensure scripts from /s/ have correct type and data-cfasync="false"
      htmlContent = htmlContent.replace(
        /(<script[^>]*?src="\/s\/[A-Z0-9]+"[^>]*?)>/g, // Matches <script ... src="/s/..." ...>
        (_match, openingTagInnerContentAndAttributes) => {
          let tag = openingTagInnerContentAndAttributes;
          // Correct type if it's mangled
          tag = tag.replace(
            /type\s*=\s*"[a-f0-9]{24}-text\/javascript"/i,
            'type="text/javascript"',
          );
          // Add data-cfasync="false" if not already present
          if (!tag.includes('data-cfasync="false"')) {
            tag += ' data-cfasync="false"';
          }
          return tag + ">";
        },
      );

      // Step 2: Globally correct any remaining mangled script types (e.g., for inline scripts).
      // Cloudflare's Rocket Loader might change type="text/javascript"
      // to type="<hex_value>-text/javascript". This reverts that change.
      // Assumes the hex string is 24 characters long.
      htmlContent = htmlContent.replace(
        /type\s*=\s*"[a-f0-9]{24}-text\/javascript"/gi,
        'type="text/javascript"',
      );

      // Use the recursive headers which include appropriate CSP and cache settings
      const headers = {
        ...Object.fromEntries(response.headers),
        ...getRecursiveHeaders(),
        "Content-Type": "text/html; charset=utf-8",
      };

      return new Response(htmlContent, {
        headers: normalizeHeaders(headers),
      });
    }

    // For non-HTML, preserve response but ensure version headers
    return new Response(response.body, {
      headers: normalizeHeaders(response.headers),
    });
  } catch (error) {
    logger.error("content", {
      message: "Content handler error",
      identifier,
      error: error instanceof Error ? error.message : String(error),
      path: ctx.url.pathname,
    });
    return WebResponseUtil.stampNotFound();
  }
}
