// This is a stub implementation for the build process
// It will be used only during the build and not at runtime
import { logger } from "$lib/utils/logger.ts";

/**
 * A stub implementation of broadcastTransaction for build-time usage.
 * At runtime, the actual implementation from broadcast.ts will be used.
 *
 * @param {string} _signedPsbtHex - The signed PSBT hex string (unused in stub)
 * @returns {Promise<string>} A dummy transaction ID for testing
 */
export async function broadcastTransaction(
  _signedPsbtHex: string,
): Promise<string> {
  // Check if we're in a build context
  const isBuild = Deno.args.includes("build");

  if (isBuild) {
    logger.warn("broadcast", {
      message: "Running in build mode - broadcast functionality disabled",
    });
    return "BUILD_MODE_DUMMY_TXID";
  }

  // If somehow this file is loaded at runtime (should never happen), throw an error
  logger.error("broadcast", {
    message: "broadcast.build.ts was incorrectly loaded at runtime",
  });
  throw new Error(
    "broadcast.build.ts was incorrectly loaded at runtime. This is a bug.",
  );
}
